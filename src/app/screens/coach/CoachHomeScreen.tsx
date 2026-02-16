import { Plus, MessageSquare, Users, CheckCircle, AlertCircle } from "lucide-react";
import { AppBar } from "../../components/AppBar";
import { CTAButton } from "../../components/CTAButton";
import { MetricChip } from "../../components/MetricChip";
import { ClientListItem } from "../../components/ClientListItem";
import { coachData } from "../../data/mockData";
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase.js';

let cachedCoachName: string | null = null;
let cachedCoachUserId: string | null = null;

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
  const { session } = useAuth(); // Obtenemos la sesión actual
  const hasCachedForUser = session?.user?.id && cachedCoachUserId === session.user.id && cachedCoachName;
  const [coachName, setCoachName] = useState(hasCachedForUser ? cachedCoachName! : 'Entrenador');
  const [isLoadingName, setIsLoadingName] = useState(!hasCachedForUser);
  const summary = coachData.dailySummary;

  useEffect(() => {
    const userId = session?.user?.id || null;

    // Si ya tenemos cache para este usuario, no volvemos a pedirlo
    if (userId && cachedCoachUserId === userId && cachedCoachName) {
      setCoachName(cachedCoachName);
      setIsLoadingName(false);
      return;
    }

    if (userId) {
      getProfile();
    } else {
      setIsLoadingName(false);
    }
  }, [session]);

  const getProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles') // Tu tabla de la BD
        .select('full_name')
        .eq('id', session?.user.id)
        .single();

      if (data) {
        const firstName = data.full_name.split(' ')[0];
        setCoachName(firstName); // Tomamos solo el primer nombre
        cachedCoachName = firstName;
        cachedCoachUserId = session?.user.id ?? null;
      }
    } catch (error) {
      console.log('Error cargando perfil:', error);
    } finally {
      setIsLoadingName(false);
    }
  };
  
  // Clientes con alertas
  const clientsWithAlerts = coachData.clients.filter((c) => c.hasAlert);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AppBar showNotifications />

      <div className="px-4 py-6 space-y-6">
        {/* Saludo */}
        <div>
          {isLoadingName ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-7 w-40 rounded-lg bg-gray-200" />
              <div className="h-4 w-52 rounded-lg bg-gray-200" />
            </div>
          ) : (
            <>
              <h1 className="mb-1">Hola, {coachName} 👋</h1>
              <p className="text-[15px] text-gray-600">
                Resumen de tu jornada
              </p>
            </>
          )}
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
          
          <div className="grid grid-cols-1 gap-3">
            <CTAButton
              variant="primary"
              icon={Plus}
              fullWidth
              onClick={onCreatePlan}
            >
              Crear plan
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