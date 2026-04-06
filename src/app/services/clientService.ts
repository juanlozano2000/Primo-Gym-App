import { supabase } from '../lib/supabase';

export interface WorkoutSummary {
  id: string;
  title: string;
  exercises: number;
  duration: string;
  status: 'pending' | 'in-progress' | 'completed';
  scheduledDate: string;
}

export const clientService = {
  async resolveAssignedPlanId(clientId: string, workoutId: string): Promise<string | null> {
    try {
      const { data: pending } = await supabase
        .from('assigned_plans')
        .select('id')
        .eq('client_id', clientId)
        .eq('workout_id', workoutId)
        .eq('is_completed', false)
        .order('scheduled_date', { ascending: true })
        .limit(1);

      if (pending && pending.length > 0) {
        return pending[0].id;
      }

      const { data: latest } = await supabase
        .from('assigned_plans')
        .select('id')
        .eq('client_id', clientId)
        .eq('workout_id', workoutId)
        .order('scheduled_date', { ascending: false })
        .limit(1);

      return latest && latest.length > 0 ? latest[0].id : null;
    } catch (error) {
      console.error('Error resolving assigned plan id:', error);
      return null;
    }
  },

  async appendAssignedPlanFeedback(assignedPlanId: string, feedback: string): Promise<void> {
    try {
      const cleanFeedback = feedback.trim();
      if (!cleanFeedback) return;

      const { data: planData, error: planErr } = await supabase
        .from('assigned_plans')
        .select('client_feedback')
        .eq('id', assignedPlanId)
        .maybeSingle();

      if (planErr) {
        console.warn('No se pudo leer feedback previo del plan:', planErr.message);
      }

      const currentFeedback = planData?.client_feedback?.trim() || '';
      const hasSameFeedback = currentFeedback.includes(cleanFeedback);
      if (hasSameFeedback) return;

      const mergedFeedback = [currentFeedback, cleanFeedback]
        .filter(Boolean)
        .join('\n\n---\n\n');

      const { error: updateErr } = await supabase
        .from('assigned_plans')
        .update({ client_feedback: mergedFeedback })
        .eq('id', assignedPlanId);

      if (updateErr) {
        console.warn('No se pudo guardar feedback en assigned_plans:', updateErr.message);
      }
    } catch (error) {
      console.warn('Error appending assigned plan feedback:', error);
    }
  },
  // 1. Obtener los próximos entrenamientos asignados al cliente
  async getUpcomingWorkouts(clientId: string): Promise<WorkoutSummary[]> {
    try {
      // Buscamos los planes asignados que NO están completados, ordenados por fecha
      const { data, error } = await supabase
        .from('assigned_plans')
        .select(`
          id,
          workout_id,
          scheduled_date,
          is_completed,
          workouts (
            title,
            workout_items (id)
          )
        `)
        .eq('client_id', clientId)
        .eq('is_completed', false)
        .order('scheduled_date', { ascending: true })
        .limit(3); // Traemos los próximos 3

      if (error) throw error;

      // Formateamos la data para que la UI la entienda fácil
      const formattedWorkouts = data?.map((assignment: any) => {
        // Atajamos los workouts por si vienen en array
        const workoutData = Array.isArray(assignment.workouts) ? assignment.workouts[0] : assignment.workouts;
        // Contamos cuántos ejercicios tiene la rutina
        const exerciseCount = workoutData?.workout_items?.length || 0;
        
        // Calculamos un estimado de duración (10 min por ejercicio aprox)
        const estimatedDuration = exerciseCount > 0 ? `${exerciseCount * 10} min` : '45 min';

        return {
          id: assignment.workout_id, // 🚨 Usamos el ID del workout para poder entrar a verlo
          title: workoutData?.title || 'Rutina asignada',
          exercises: exerciseCount,
          duration: estimatedDuration,
          status: 'pending' as const,
          scheduledDate: assignment.scheduled_date
        };
      }) || [];

      return formattedWorkouts;

    } catch (error) {
      console.error('Error fetching upcoming workouts:', error);
      return [];
    }
  },

  // 2. Obtener el progreso de la semana (Workouts y Series completadas)
  async getWeeklyProgress(clientId: string) {
    try {
      // Obtenemos el inicio de la semana (Lunes)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const startOfWeek = new Date(now.setDate(diff));
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 7);

      // 1. Planes asignados esta semana (total de workouts programados)
      const { data: weekAssignments } = await supabase
        .from('assigned_plans')
        .select(`
          id, workout_id, is_completed,
          workouts ( workout_items (sets) )
        `)
        .eq('client_id', clientId)
        .gte('scheduled_date', startOfWeek.toISOString())
        .lt('scheduled_date', endOfWeek.toISOString());

      const assignments = weekAssignments || [];
      const totalWorkouts = assignments.length;

      // Calcular series totales sumando los sets de cada workout_item de cada assignment
      let totalSets = 0;
      let completedSets = 0;
      for (const assignment of assignments) {
        const workoutData: any = Array.isArray(assignment.workouts) ? assignment.workouts[0] : assignment.workouts;
        const items = workoutData?.workout_items || [];
        const assignmentSets = items.reduce((acc: number, item: any) => acc + (item.sets || 0), 0);
        totalSets += assignmentSets;
        if (assignment.is_completed) {
          completedSets += assignmentSets;
        }
      }

      // 2. Sesiones completadas esta semana
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('id, duration_minutes')
        .eq('client_id', clientId)
        .gte('ended_at', startOfWeek.toISOString());

      const completedWorkouts = sessions?.length || 0;
      const totalTimeMinutes = sessions?.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0) || 0;
      
      const hours = Math.floor(totalTimeMinutes / 60);
      const minutes = totalTimeMinutes % 60;
      const totalTimeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;

      return {
        completedSets,
        totalSets,
        completedWorkouts,
        totalWorkouts,
        totalTime: totalTimeStr || "0 min"
      };

    } catch (error) {
      console.error('Error fetching weekly progress:', error);
      return {
        completedSets: 0,
        totalSets: 0,
        completedWorkouts: 0,
        totalWorkouts: 0,
        totalTime: "0 min"
      };
    }
  },
  // --- AGREGAR ESTO EN clientService.ts ---

  // 3. Obtener TODOS los entrenamientos (pendientes y completados)
  async getAllWorkouts(clientId: string): Promise<WorkoutSummary[]> {
    try {
      const { data, error } = await supabase
        .from('assigned_plans')
        .select(`
          id, workout_id, scheduled_date, is_completed,
          workouts (title, workout_items(id))
        `)
        .eq('client_id', clientId)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;

      return data?.map((assignment: any) => {
        const workoutData = Array.isArray(assignment.workouts) ? assignment.workouts[0] : assignment.workouts;
        const exerciseCount = workoutData?.workout_items?.length || 0;
        return {
          id: assignment.workout_id,
          title: workoutData?.title || 'Rutina',
          exercises: exerciseCount,
          duration: `${exerciseCount * 10} min`,
          status: assignment.is_completed ? 'completed' : 'pending',
          scheduledDate: assignment.scheduled_date
        };
      }) || [];
    } catch (error) {
      console.error('Error fetching all workouts:', error);
      return [];
    }
  },

  // 4. Obtener el detalle de un workout para la pantalla de entrenamiento
  async getWorkoutDetail(workoutId: string) {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          id, title, description,
          workout_items (
            id, sets, rest_time_seconds, order_index,
            exercises (id, name, muscle_group),
            workout_item_sets (set_number, reps_target, weight_target, rir_target)
          )
        `)
        .eq('id', workoutId)
        .single();

      if (error) throw error;

      // Ordenar los ejercicios por su índice
      const items = (data.workout_items || []).sort((a: any, b: any) => a.order_index - b.order_index);

      // Mapear al formato que espera la UI
      const exerciseList = items.map((item: any) => {
        const exerciseData = Array.isArray(item.exercises) ? item.exercises[0] : item.exercises;
        
        // Ordenar las series
        const sets = (item.workout_item_sets || []).sort((a: any, b: any) => a.set_number - b.set_number);
        
        const seriesData = sets.map((s: any) => ({
          reps: s.reps_target ? s.reps_target.toString() : undefined,
          weight: s.weight_target ? s.weight_target.toString() : undefined,
          rir: s.rir_target ? s.rir_target.toString() : undefined,
        }));

        return {
          id: item.id,
          name: exerciseData?.name || 'Ejercicio',
          sets: item.sets,
          rest: `${item.rest_time_seconds}s`,
          seriesData: seriesData.length > 0 ? seriesData : Array(item.sets).fill({})
        };
      });

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        exerciseList
      };
    } catch (error) {
      console.error('Error fetching workout detail:', error);
      return null;
    }
  },

  // 5. Registrar que el cliente terminó su entrenamiento
  async finishWorkout(
    clientId: string,
    workoutId: string,
    options: { durationMinutes?: number; isIncomplete?: boolean; completedExercises?: number; totalExercises?: number; notes?: string } = {}
  ) {
    try {
      const durationMinutes = options.durationMinutes ?? 45;
      const isIncomplete = options.isIncomplete ?? false;
      const completedExercises = options.completedExercises ?? 0;
      const totalExercises = options.totalExercises ?? 0;
      const coachNotes = options.notes?.trim() || "";
      const assignedPlanId = await this.resolveAssignedPlanId(clientId, workoutId);

      // a. Marcamos el plan asignado como completado (el más antiguo pendiente de este workout)
      if (!isIncomplete && assignedPlanId) {
        await supabase
          .from('assigned_plans')
          .update({ is_completed: true, completed_at: new Date().toISOString() })
          .eq('id', assignedPlanId);
      }

      const statusNotes = isIncomplete
        ? `Workout finalizado de forma incompleta: ${completedExercises}/${totalExercises} ejercicios completados.`
        : `Workout completado: ${completedExercises || totalExercises}/${totalExercises || completedExercises} ejercicios completados.`;
      const assignmentTag = assignedPlanId ? `[assigned_plan_id:${assignedPlanId}]` : "";
      const sessionNotes = [assignmentTag, statusNotes, coachNotes || null]
        .filter(Boolean)
        .join("\n\n");

      if (assignedPlanId && coachNotes) {
        await this.appendAssignedPlanFeedback(assignedPlanId, coachNotes);
      }

      // b. Guardamos la sesión en el historial
      await supabase.from('workout_sessions').insert({
        client_id: clientId,
        workout_id: workoutId,
        started_at: new Date(Date.now() - durationMinutes * 60000).toISOString(),
        ended_at: new Date().toISOString(),
        duration_minutes: durationMinutes,
        notes: sessionNotes,
        feeling_rating: isIncomplete ? null : 5
      });

      return true;
    } catch (error) {
      console.error('Error al finalizar workout:', error);
      return false;
    }
  },

  // 5b. Registrar una sugerencia del cliente para que el coach la vea inmediatamente
  async saveWorkoutSuggestion(clientId: string, workoutId: string, notes: string) {
    try {
      if (!notes.trim()) return true;

      const assignedPlanId = await this.resolveAssignedPlanId(clientId, workoutId);
      const assignmentTag = assignedPlanId ? `[assigned_plan_id:${assignedPlanId}]` : "";
      const sessionNotes = [assignmentTag, notes.trim()].filter(Boolean).join("\n\n");

      if (assignedPlanId) {
        await this.appendAssignedPlanFeedback(assignedPlanId, notes);
      }

      await supabase.from('workout_sessions').insert({
        client_id: clientId,
        workout_id: workoutId,
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        duration_minutes: 0,
        notes: sessionNotes,
        feeling_rating: null,
      });

      return true;
    } catch (error) {
      console.error('Error al guardar sugerencia del workout:', error);
      return false;
    }
  },

  // 6. Guardar una nueva entrada de métricas corporales
  async addBodyMetrics(
    clientId: string,
    metrics: { weightKg?: number; heightCm?: number; bodyFatPct?: number }
  ) {
    try {
      const payload: {
        client_id: string;
        date: string;
        weight_kg?: number;
        height_cm?: number;
        body_fat_pct?: number;
      } = {
        client_id: clientId,
        date: new Date().toISOString().split("T")[0],
      };

      if (typeof metrics.weightKg === "number") payload.weight_kg = metrics.weightKg;
      if (typeof metrics.heightCm === "number") payload.height_cm = metrics.heightCm;
      if (typeof metrics.bodyFatPct === "number") payload.body_fat_pct = metrics.bodyFatPct;

      const { error } = await supabase.from("body_metrics").insert(payload);
      if (error) throw error;

      return true;
    } catch (error) {
      console.error("Error saving body metrics:", error);
      return false;
    }
  },

  // 6. Obtener los datos completos para la pantalla "Mi Cuenta" del Cliente
  async getClientAccountData(clientId: string) {
    try {
      // a. Buscar últimas métricas corporales
      const { data: metrics } = await supabase
        .from('body_metrics')
        .select('weight_kg, height_cm, body_fat_pct, date')
        .eq('client_id', clientId)
        .order('date', { ascending: false })
        .limit(2); // Traemos las últimas 2 para ver si subió o bajó (trend)

      // Le decimos a TypeScript exactamente qué palabras están permitidas
      type TrendType = "up" | "down" | "neutral";

      let weightData = { value: 0, unit: "kg", trend: "neutral" as TrendType, trendValue: "0" };
      let heightData = { value: 0, unit: "cm", trend: "neutral" as TrendType };
      let bodyFatData = { value: 0, unit: "%", trend: "neutral" as TrendType, trendValue: "0" };
      let bmiData = { value: 0, unit: "", trend: "neutral" as TrendType, trendValue: "0" };

      if (metrics && metrics.length > 0) {
        const latest = metrics[0];
        const previous = metrics.length > 1 ? metrics[1] : null;

        if (latest.weight_kg) {
          weightData.value = latest.weight_kg;
          if (previous && previous.weight_kg) {
            const diff = latest.weight_kg - previous.weight_kg;
            weightData.trend = diff > 0 ? "up" : diff < 0 ? "down" : "neutral";
            weightData.trendValue = `${Math.abs(diff).toFixed(1)} kg`;
          }
        }

        if (latest.height_cm) heightData.value = latest.height_cm;

        if (latest.body_fat_pct) {
          bodyFatData.value = latest.body_fat_pct;
          if (previous && previous.body_fat_pct) {
            const diff = latest.body_fat_pct - previous.body_fat_pct;
            bodyFatData.trend = diff > 0 ? "up" : diff < 0 ? "down" : "neutral";
            bodyFatData.trendValue = `${Math.abs(diff).toFixed(1)}%`;
          }
        }

        // Calcular BMI si tenemos peso y altura
        if (latest.weight_kg && latest.height_cm) {
          const heightM = latest.height_cm / 100;
          const bmi = latest.weight_kg / (heightM * heightM);
          bmiData.value = parseFloat(bmi.toFixed(1));
        }
      }

      // b. Buscar datos del Entrenador asignado
      const { data: coachRelation } = await supabase
        .from("coach_clients")
        .select(`
          coach_id,
          profiles!coach_id (full_name)
        `)
        .eq("client_id", clientId)
        .eq("status", "active")
        .maybeSingle();

      let coachDetails = {
        name: "Sin entrenador",
        rating: 5.0,
        specialty: "General",
        certifications: ["Spoter Coach"]
      };

      if (coachRelation && coachRelation.profiles) {
        // @ts-ignore
        coachDetails.name = coachRelation.profiles.full_name || "Tu Entrenador";
        
        // Buscar detalles del coach
        const { data: coachInfo } = await supabase
          .from("coach_details")
          .select("specialties, certifications, rating")
          .eq("id", coachRelation.coach_id)
          .maybeSingle();

        if (coachInfo) {
          coachDetails.specialty = coachInfo.specialties?.[0] || "Entrenador Personal";
          coachDetails.certifications = coachInfo.certifications || [];
          coachDetails.rating = coachInfo.rating || 5.0;
        }
      }

      return {
        insights: { weight: weightData, height: heightData, bodyFat: bodyFatData, bmi: bmiData },
        coach: coachDetails
      };

    } catch (error) {
      console.error('Error fetching client account data:', error);
      return null;
    }
  }
};