import { supabase } from '../lib/supabase';

// --- INTERFACES PARA TIPAR LOS DATOS ---
export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
}

export interface SetDetail {
  reps?: string;
  weight?: string;
  time?: string;
  rir?: string;
}

export interface WorkoutItemPayload {
  exerciseId?: string; // 🚨 Ahora es opcional
  name: string;        // 🚨 Necesitamos el nombre por si hay que crearlo
  sets: number;
  restSeconds: number;
  seriesData: SetDetail[];
}

export interface WorkoutPlanPayload {
  title: string;
  description: string;
  isTemplate: boolean;
  durationWeeks?: number;
  items: WorkoutItemPayload[];
}

export interface CoachTemplate {
  id: string;
  name: string;
  description: string;
  weeks: number;
  days: number;
  exercises: Array<{
    id: string;
    exerciseId?: string;
    name: string;
    totalSets: number;
    seriesData: SetDetail[];
    rest: string;
  }>;
  source: 'admin' | 'coach';
}

// --- EL SERVICIO ---
export const planService = {

  async getTemplatesForCoach(coachId: string): Promise<{ adminTemplates: CoachTemplate[]; coachTemplates: CoachTemplate[] }> {
    try {
      const { data: adminProfiles, error: adminsErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (adminsErr) throw adminsErr;

      const adminIds = (adminProfiles || []).map((p: { id: string }) => p.id);
      const ownerIds = [coachId, ...adminIds];

      if (ownerIds.length === 0) {
        return { adminTemplates: [], coachTemplates: [] };
      }

      const { data: rawTemplates, error: templatesErr } = await supabase
        .from('workouts')
        .select(`
          id,
          title,
          description,
          duration_weeks,
          coach_id,
          workout_items (
            id,
            sets,
            rest_time_seconds,
            order_index,
            exercise_id,
            exercises (id, name),
            workout_item_sets (set_number, reps_target, weight_target, rir_target)
          )
        `)
        .eq('is_template', true)
        .in('coach_id', ownerIds)
        .order('created_at', { ascending: false });

      if (templatesErr) throw templatesErr;

      const mappedTemplates: CoachTemplate[] = (rawTemplates || []).map((template: any) => {
        const workoutItems = (template.workout_items || []).sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));

        const exercises = workoutItems.map((item: any) => {
          const exerciseData = Array.isArray(item.exercises) ? item.exercises[0] : item.exercises;
          const sets = (item.workout_item_sets || []).sort((a: any, b: any) => a.set_number - b.set_number);

          const seriesData: SetDetail[] = sets.map((serie: any) => ({
            reps: serie.reps_target ? String(serie.reps_target) : undefined,
            weight: serie.weight_target !== null && serie.weight_target !== undefined ? String(serie.weight_target) : undefined,
            rir: serie.rir_target !== null && serie.rir_target !== undefined ? String(serie.rir_target) : undefined,
          }));

          return {
            id: item.id,
            exerciseId: item.exercise_id,
            name: exerciseData?.name || 'Ejercicio',
            totalSets: item.sets || seriesData.length || 1,
            seriesData,
            rest: `${item.rest_time_seconds || 60}s`,
          };
        });

        return {
          id: template.id,
          name: template.title,
          description: template.description || '',
          weeks: template.duration_weeks || 8,
          days: Math.max(1, Math.min(7, workoutItems.length || 1)),
          exercises,
          source: adminIds.includes(template.coach_id) ? 'admin' : 'coach',
        };
      });

      return {
        adminTemplates: mappedTemplates.filter((t) => t.source === 'admin'),
        coachTemplates: mappedTemplates.filter((t) => t.source === 'coach'),
      };
    } catch (error) {
      console.error('Error fetching templates for coach:', error);
      return { adminTemplates: [], coachTemplates: [] };
    }
  },
  
  // 1. Obtener la lista de ejercicios para el buscador/selector
  async getExercises(): Promise<Exercise[]> {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, muscle_group')
        .order('name'); 
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching exercises:', error);
      return [];
    }
  },

  // 2. Guardar una rutina completa (con creación de ejercicios al vuelo)
  async createWorkoutPlan(coachId: string, planData: WorkoutPlanPayload) {
    try {
      console.log("Iniciando guardado de la rutina...");

      // PASO A: Crear la Rutina principal
      const { data: workoutRecord, error: workoutErr } = await supabase
        .from('workouts')
        .insert({
          title: planData.title,
          description: planData.description,
          coach_id: coachId,
          is_template: planData.isTemplate,
          duration_weeks: planData.durationWeeks ?? 1,
        })
        .select('id')
        .single();

      if (workoutErr) throw workoutErr;
      const newWorkoutId = workoutRecord.id;

      // PASO B: Recorrer los ejercicios que eligió el coach
      for (let i = 0; i < planData.items.length; i++) {
        const item = planData.items[i];
        let finalExerciseId = item.exerciseId;

        // 🚨 LA MAGIA: Si no hay ID, es un ejercicio escrito a mano. Lo creamos.
        if (!finalExerciseId) {
          console.log(`Creando nuevo ejercicio personalizado: ${item.name}`);
          const { data: newExercise, error: newExErr } = await supabase
            .from('exercises')
            .insert({
              name: item.name,
              created_by: coachId, // Queda guardado como creado por este coach
              muscle_group: 'Personalizado' // Categoría por defecto
            })
            .select('id')
            .single();

          if (newExErr) throw newExErr;
          finalExerciseId = newExercise.id; // Agarramos el ID recién horneado
        }
        
        // Ahora sí, insertamos en workout_items con un ID válido
        const { data: itemRecord, error: itemErr } = await supabase
          .from('workout_items')
          .insert({
            workout_id: newWorkoutId,
            exercise_id: finalExerciseId,
            sets: item.sets,
            rest_time_seconds: item.restSeconds,
            order_index: i + 1 
          })
          .select('id')
          .single();

        if (itemErr) throw itemErr;
        const newItemId = itemRecord.id;

        // PASO C: Guardar el detalle de las series (Reps, Peso, RIR)
        if (item.seriesData && item.seriesData.length > 0) {
          const setsToInsert = item.seriesData.map((serie, index) => ({
            workout_item_id: newItemId,
            set_number: index + 1,
            reps_target: serie.reps || null,
            weight_target: serie.weight ? parseFloat(serie.weight) : null,
            rir_target: serie.rir ? parseInt(serie.rir) : null,
            // Si tenías un campo de tiempo en la BD, lo podés agregar acá también
          }));

          const { error: setsErr } = await supabase
            .from('workout_item_sets')
            .insert(setsToInsert);

          if (setsErr) throw setsErr;
        }
      }

      console.log("¡Rutina guardada con éxito!");
      return { success: true, workoutId: newWorkoutId };

    } catch (error) {
      console.error('Error crítico al crear el plan de entrenamiento:', error);
      return { success: false, error };
    }
  },

  // 3. Agendarle esta rutina a un cliente en el calendario
  async assignPlanToClient(clientId: string, workoutId: string, scheduledDate: string) {
    try {
      const { error } = await supabase
        .from('assigned_plans')
        .insert({
          client_id: clientId,
          workout_id: workoutId,
          scheduled_date: scheduledDate
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error al asignarle el plan al cliente:', error);
      return false;
    }
  }
};