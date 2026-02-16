import { AppBar } from "../../components/AppBar";
import { CTAButton } from "../../components/CTAButton";
import { Edit, TrendingUp, CheckCircle, Calendar } from "lucide-react";
import { clientDetail } from "../../data/mockData";
import { toast } from "sonner";

interface ClientDetailScreenProps {
  clientId: string;
  onBack: () => void;
  onEditPlan: () => void;
}

export function ClientDetailScreen({
  clientId,
  onBack,
  onEditPlan,
}: ClientDetailScreenProps) {
  const client = clientDetail;

  const handleSendMessage = () => {
    toast.info("Función de mensajería próximamente");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AppBar title={client.name} onBack={onBack} />

      <div className="px-4 py-6 space-y-6">
        {/* Perfil del cliente */}
        <div className="bg-white rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white">
              <span className="text-[24px] font-bold">
                {client.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="mb-1">{client.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-[14px] text-gray-600">Adherencia:</span>
                <span className={`text-[15px] font-semibold ${
                  client.adherence >= 80 ? "text-success" : 
                  client.adherence >= 60 ? "text-warning" : "text-error"
                }`}>
                  {client.adherence}%
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <CTAButton
              variant="primary"
              size="small"
              icon={Edit}
              onClick={onEditPlan}
              fullWidth
            >
              Editar plan
            </CTAButton>
          </div>
        </div>

        {/* Métricas históricas */}
        <div>
          <h3 className="mb-3">Métricas históricas</h3>
          <div className="grid grid-cols-3 gap-3">
            {client.metrics.map((metric, index) => (
              <div key={index} className="bg-white rounded-xl p-3 border border-border">
                <p className="text-[12px] text-gray-600 mb-1">{metric.label}</p>
                <p className="text-[18px] font-bold text-gray-900 mb-2">
                  {metric.value}
                  {metric.unit && <span className="text-[14px] ml-0.5">{metric.unit}</span>}
                </p>
                {/* Mini sparkline */}
                <div className="flex items-end gap-0.5 h-6">
                  {metric.history.map((val, i) => {
                    const max = Math.max(...metric.history);
                    const height = (val / max) * 100;
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-primary/20 rounded-sm"
                        style={{ height: `${height}%` }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Planes asignados */}
        <div>
          <h3 className="mb-3">Planes asignados</h3>
          <div className="bg-white rounded-2xl p-4 border border-border">
            {client.assignedPlans.map((plan) => (
              <div key={plan.id} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="mb-1">{plan.name}</h4>
                  <p className="text-[14px] text-gray-600">
                    Desde {new Date(plan.startDate).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </p>
                  <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-success/10 text-success rounded-md">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span className="text-[12px] font-medium">Activo</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workouts recientes */}
        <div>
          <h3 className="mb-3">Actividad reciente</h3>
          <div className="bg-white rounded-2xl p-4 border border-border space-y-3">
            {client.recentWorkouts.map((workout, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-900">{workout.name}</p>
                  <p className="text-[13px] text-gray-600">
                    {new Date(workout.date).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "long"
                    })}
                  </p>
                </div>
                {workout.completed && (
                  <CheckCircle className="w-5 h-5 text-success" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Evolución */}
        <div className="bg-primary/5 rounded-2xl p-4 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="mb-1 text-primary">Evolución positiva</h4>
              <p className="text-[14px] text-gray-700">
                El cliente ha mejorado su adherencia en un 15% en las últimas 4 semanas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
