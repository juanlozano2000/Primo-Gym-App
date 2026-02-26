import { supabase } from '../lib/supabase';

// --- INTERFACES PARA TIPAR LOS DATOS ---
export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
}

export interface SetDetail {
  reps: string;
  weight: string;
  rir?: string;
}

export interface WorkoutItemPayload {
  exerciseId: string;
  sets: number;
  restSeconds: number;
  seriesData: SetDetail[];
}

export interface WorkoutPlanPayload {
  title: string;
  description: string;
  isTemplate: boolean;
  items: WorkoutItemPayload[];
}

// --- EL SERVICIO ---
export const planService = {
  
  // 1. Obtener la lista de ejercicios para el buscador/selector
  async getExercises(): Promise<Exercise[]> {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, muscle_group')
        .order('name'); // Los ordenamos alfabéticamente
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching exercises:', error);
      return [];
    }
  },

  // 2. Guardar una rutina completa (con todos sus ejercicios y series)
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
          is_template: planData.isTemplate
        })
        .select('id')
        .single();

      if (workoutErr) throw workoutErr;
      const newWorkoutId = workoutRecord.id;

      // PASO B: Recorrer los ejercicios que eligió el coach y guardarlos
      for (let i = 0; i < planData.items.length; i++) {
        const item = planData.items[i];
        
        const { data: itemRecord, error: itemErr } = await supabase
          .from('workout_items')
          .insert({
            workout_id: newWorkoutId,
            exercise_id: item.exerciseId,
            sets: item.sets,
            rest_time_seconds: item.restSeconds,
            order_index: i + 1 // Para mantener el orden que eligió el coach
          })
          .select('id')
          .single();

        if (itemErr) throw itemErr;
        const newItemId = itemRecord.id;

        // PASO C: Si el coach detalló las series (Reps, Peso, RIR), las guardamos
        if (item.seriesData && item.seriesData.length > 0) {
          const setsToInsert = item.seriesData.map((serie, index) => ({
            workout_item_id: newItemId,
            set_number: index + 1,
            reps_target: serie.reps,
            weight_target: parseFloat(serie.weight) || 0,
            rir_target: serie.rir ? parseInt(serie.rir) : null
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

  // 3. Agendarle esta rutina recién creada a un cliente en el calendario
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