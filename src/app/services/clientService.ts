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
  }
};