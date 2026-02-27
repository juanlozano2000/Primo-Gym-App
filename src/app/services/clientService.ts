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

      // Buscamos sesiones de esta semana
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

      // TODO: Las series requerirían consultar 'exercise_logs', 
      // por ahora mockeamos una meta semanal estándar.
      return {
        completedSets: completedWorkouts * 15, // Estimado temporal
        totalSets: 60,
        completedWorkouts: completedWorkouts,
        totalWorkouts: 4,
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
  async finishWorkout(clientId: string, workoutId: string, durationMinutes: number = 45) {
    try {
      // a. Marcamos el plan asignado como completado (el más antiguo pendiente de este workout)
      const { data: assignment } = await supabase
        .from('assigned_plans')
        .select('id')
        .eq('client_id', clientId)
        .eq('workout_id', workoutId)
        .eq('is_completed', false)
        .order('scheduled_date', { ascending: true })
        .limit(1)
        .single();

      if (assignment) {
        await supabase.from('assigned_plans').update({ is_completed: true }).eq('id', assignment.id);
      }

      // b. Guardamos la sesión en el historial
      await supabase.from('workout_sessions').insert({
        client_id: clientId,
        workout_id: workoutId,
        started_at: new Date(Date.now() - durationMinutes * 60000).toISOString(),
        ended_at: new Date().toISOString(),
        duration_minutes: durationMinutes
      });

      return true;
    } catch (error) {
      console.error('Error al finalizar workout:', error);
      return false;
    }
  }
};