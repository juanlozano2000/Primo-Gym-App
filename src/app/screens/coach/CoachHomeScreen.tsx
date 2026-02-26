import { Plus, Users, AlertCircle } from "lucide-react";
import { AppBar } from "../../components/AppBar";
import { CTAButton } from "../../components/CTAButton";
import { MetricChip } from "../../components/MetricChip";
import { ClientListItem } from "../../components/ClientListItem";
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
// 🚨 Importamos nuestro nuevo servicio
import { dashboardService, DashboardData } from '../../services/dashboardService';

interface CoachHomeScreenProps {
  onNavigateToClients: () => void;
  onClientClick: (clientId: string) => void;
  onCreatePlan: () => void;
}

export function CoachHomeScreen({
  onNavigateToClients,
  onClientClick,
  onCreatePlan,
}: CoachHomeScreenProps) {
  const { user } = useAuth();
  const coachName = user?.fullName?.trim().split(" ")[0] || "Entrenador";

  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    summary: { activeClients: 0, completedWorkouts: 0, alerts: 0 },
    clientsWithAlerts: [],
    activeToday: [],
    allClients: []
  });

  useEffect(() => {
    if (!user?.id) return;
    
    // 🚨 Llamamos al servicio y esperamos la respuesta ya masticada
    const loadData = async () => {
      setIsLoading(true);
      const data = await dashboardService.getCoachDashboardData(user.id);
      setDashboardData(data);
      setIsLoading(false);
    };

    loadData();
  }, [user?.id]);

  const { summary, clientsWithAlerts, activeToday } = dashboardData;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <AppBar showNotifications />
        <div className="px-4 py-6 space-y-6 animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded-lg mb-2"></div>
          <div className="h-4 w-32 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-28 bg-gray-200 rounded-2xl w-full"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded-lg w-full"></div>
            <div className="h-20 bg-gray-200 rounded-xl w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AppBar showNotifications />

      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Hola, {coachName} 👋</h1>
          <p className="text-[15px] text-gray-600">Resumen de tu jornada</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
          <h3 className="font-semibold mb-3">Hoy</h3>
          <div className="grid grid-cols-3 gap-3">
            <MetricChip label="Clientes activos" value={summary.activeClients} variant="primary" />
            <MetricChip label="Completados" value={summary.completedWorkouts} variant="success" />
            <MetricChip label="Alertas" value={summary.alerts} variant="warning" />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Acciones rápidas</h3>
          <div className="grid grid-cols-1 gap-3">
            <CTAButton variant="primary" icon={Plus} fullWidth onClick={onCreatePlan}>
              Crear plan
            </CTAButton>
          </div>
        </div>

        {clientsWithAlerts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-warning" />
              <h3 className="font-semibold">Requieren atención ({clientsWithAlerts.length})</h3>
            </div>
            <div className="space-y-3">
              {clientsWithAlerts.map((client) => (
                <ClientListItem
                  key={client.id}
                  name={client.name}
                  lastActivity={client.lastActivity}
                  adherence={client.adherence}
                  hasAlert={client.hasAlert}
                  alertMessage={client.alertMessage}
                  plan={client.plan}
                  onClick={() => onClientClick(client.id)}
                />
              ))}
            </div>
             <button onClick={onNavigateToClients} className="w-full mt-3 text-[14px] text-primary font-medium text-center py-2 hover:underline">
              Ver todos los clientes
            </button>
          </div>
        )}

        {activeToday.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-700" />
                <h3 className="font-semibold">Entrenaron hoy</h3>
              </div>
              <button onClick={onNavigateToClients} className="text-[14px] text-primary font-medium hover:underline">
                Ver todos
              </button>
            </div>
            <div className="space-y-3">
              {activeToday.slice(0, 3).map((client) => (
                <ClientListItem
                  key={client.id}
                  name={client.name}
                  lastActivity={client.lastActivity}
                  adherence={client.adherence}
                  hasAlert={client.hasAlert}
                  alertMessage={client.alertMessage}
                  plan={client.plan}
                  onClick={() => onClientClick(client.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}