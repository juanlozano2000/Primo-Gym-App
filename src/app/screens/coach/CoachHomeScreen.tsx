import { Plus, MessageSquare, Users, CheckCircle, AlertCircle } from "lucide-react";
import { AppBar } from "../../components/AppBar";
import { CTAButton } from "../../components/CTAButton";
import { MetricChip } from "../../components/MetricChip";
import { ClientListItem } from "../../components/ClientListItem";
import { useAuth } from "../../context/AuthContext";
import { coachData } from "../../data/mockData";

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
  const firstName = user?.name.split(" ")[0] || "Entrenador";
  const summary = coachData.dailySummary;
  
  // Clientes con alertas
  const clientsWithAlerts = coachData.clients.filter((c) => c.hasAlert);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AppBar showNotifications />

      <div className="px-4 py-6 space-y-6">
        {/* Saludo */}
        <div>
          <h1 className="mb-1">Hola, {firstName} 👋</h1>
          <p className="text-[15px] text-gray-600">
            Resumen de tu jornada
          </p>
        </div>

        {/* Resumen del día */}
        <div className="bg-white rounded-2xl p-4 border border-border">
          <h3 className="mb-3">Hoy</h3>
          
          <div className="grid grid-cols-3 gap-3">
            <MetricChip
              label="Clientes activos"
              value={summary.activeClients}
              variant="primary"
            />
            <MetricChip
              label="Completados"
              value={summary.completedWorkouts}
              variant="success"
            />
            <MetricChip
              label="Alertas"
              value={summary.alerts}
              variant="warning"
            />
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="space-y-3">
          <h3>Acciones rápidas</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <CTAButton
              variant="primary"
              icon={Plus}
              fullWidth
              onClick={onCreatePlan}
            >
              Crear plan
            </CTAButton>
            <CTAButton
              variant="outline"
              icon={MessageSquare}
              fullWidth
            >
              Enviar mensaje
            </CTAButton>
          </div>
        </div>

        {/* Alertas de clientes */}
        {clientsWithAlerts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-warning" />
              <h3>Requieren atención</h3>
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
            
            <button
              onClick={onNavigateToClients}
              className="w-full mt-3 text-[14px] text-primary font-medium text-center py-2"
            >
              Ver todos los clientes
            </button>
          </div>
        )}

        {/* Clientes activos hoy */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-700" />
              <h3>Activos hoy</h3>
            </div>
            <button
              onClick={onNavigateToClients}
              className="text-[14px] text-primary font-medium"
            >
              Ver todos
            </button>
          </div>
          
          <div className="space-y-3">
            {coachData.clients
              .filter((c) => c.lastActivity.includes("Hoy"))
              .slice(0, 3)
              .map((client) => (
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
      </div>
    </div>
  );
}