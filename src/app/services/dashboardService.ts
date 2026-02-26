import { supabase } from '../lib/supabase';

// Exportamos las interfaces para poder usarlas en cualquier pantalla
export interface DashboardClient {
  id: string;
  name: string;
  plan: "Basic" | "Premium";
  lastActivity: string;
  isToday: boolean;
  hasAlert: boolean;
  alertMessage?: string;
  adherence: number;
}

export interface DashboardData {
  summary: {
    activeClients: number;
    completedWorkouts: number;
    alerts: number;
  };
  clientsWithAlerts: DashboardClient[];
  activeToday: DashboardClient[];
  allClients: DashboardClient[];
}

export const dashboardService = {
  // Función 1: Devuelve todo el paquete de datos del dashboard listo para usar
  async getCoachDashboardData(coachId: string): Promise<DashboardData> {
    try {
      // 1. Buscamos a los clientes activos
      const { data: clientsData, error: clientsErr } = await supabase
        .from('coach_clients')
        .select(`
          client_id,
          profiles!coach_clients_client_id_fkey (
            full_name,
            plan_type
          )
        `)
        .eq('coach_id', coachId)
        .eq('status', 'active');

      if (clientsErr) throw clientsErr;

      const clientIds = clientsData?.map(c => c.client_id) || [];

      // 2. Buscamos las sesiones terminadas
      let sessionsData: any[] = [];
      if (clientIds.length > 0) {
        const { data: sData } = await supabase
          .from('workout_sessions')
          .select('client_id, ended_at')
          .in('client_id', clientIds)
          .not('ended_at', 'is', null)
          .order('ended_at', { ascending: false });
          
        sessionsData = sData || [];
      }

      // 3. Procesamos las fechas y armamos las alertas
      let completedTodayCount = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const processedClients: DashboardClient[] = clientsData?.map((relation: any) => {
        // Atajamos el perfil por si viene como array u objeto
        const profileData = Array.isArray(relation.profiles) ? relation.profiles[0] : relation.profiles;
        const clientId = relation.client_id;
        
        const clientSessions = sessionsData.filter(s => s.client_id === clientId);
        const lastSession = clientSessions[0]; 

        let lastActivityText = "Sin registros";
        let hasAlert = false;
        let alertMessage = "";
        let isToday = false;

        if (lastSession) {
          const sessionDate = new Date(lastSession.ended_at);
          const diffTime = new Date().getTime() - sessionDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (sessionDate >= today) {
            const hours = sessionDate.getHours();
            const mins = sessionDate.getMinutes().toString().padStart(2, '0');
            lastActivityText = `Hoy, ${hours}:${mins}`;
            completedTodayCount++;
            isToday = true;
          } else if (diffDays === 1) {
            lastActivityText = "Ayer";
          } else {
            lastActivityText = `Hace ${diffDays} días`;
            if (diffDays >= 3) {
              hasAlert = true;
              alertMessage = `Sin registros por ${diffDays} días`;
            }
          }
        } else {
          hasAlert = true;
          alertMessage = "Sin registros recientes";
        }

        const rawPlan = profileData?.plan_type || 'basic';
        const formattedPlan = (rawPlan.charAt(0).toUpperCase() + rawPlan.slice(1)) as "Basic" | "Premium";

        return {
          id: clientId,
          name: profileData?.full_name || "Cliente",
          plan: formattedPlan,
          lastActivity: lastActivityText,
          hasAlert,
          alertMessage,
          isToday,
          adherence: 85 // TODO: Cálculo real a futuro
        };
      }) || [];

      const alertsCount = processedClients.filter(c => c.hasAlert).length;

      // Devolvemos el objeto perfectamente formateado
      return {
        summary: {
          activeClients: processedClients.length,
          completedWorkouts: completedTodayCount,
          alerts: alertsCount
        },
        clientsWithAlerts: processedClients.filter(c => c.hasAlert),
        activeToday: processedClients.filter(c => c.isToday),
        allClients: processedClients,
      };

    } catch (error) {
      console.error('Error en dashboardService:', error);
      // Si explota, devolvemos un objeto vacío seguro para que no se rompa la pantalla
      return {
        summary: { activeClients: 0, completedWorkouts: 0, alerts: 0 },
        clientsWithAlerts: [],
        activeToday: [],
        allClients: []
      };
    }
  }, // <-- ACÁ ESTÁ LA COMA SEPARADORA

  // Función 2: Trae el perfil y currículum del entrenador
  async getCoachProfile(coachId: string) {
    try {
      const { data, error } = await supabase
        .from('coach_details')
        .select('*')
        .eq('id', coachId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching coach profile:', error);
      return null;
    }
  }
};