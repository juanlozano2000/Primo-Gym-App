import { AppBar } from "../../components/AppBar";
import { CTAButton } from "../../components/CTAButton";
import { Edit, TrendingUp, CheckCircle, Calendar, Loader2, Crown } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { dashboardService } from "../../services/dashboardService";
import { supabase } from "../../lib/supabase";

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
  
  // 🚨 Estado para guardar la data real
  const [client, setClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  const [planUpdatedAt, setPlanUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    const fetchClientDetail = async () => {
      setIsLoading(true);
      const data = await dashboardService.getClientDetail(clientId);
      setClient(data);
      setIsPremium(data?.planType === "premium");
      setPlanUpdatedAt(data?.planUpdatedAt ?? null);
      setIsLoading(false);
    };

    fetchClientDetail();
  }, [clientId]);

  const handleSendMessage = () => {
    toast.info("Función de mensajería próximamente");
  };

  const handleTogglePremium = async () => {
    const newPlan = isPremium ? "basic" : "premium";
    setIsUpdatingPlan(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("profiles")
      .update({ plan_type: newPlan, plan_updated_at: now })
      .eq("id", clientId);

    if (error) {
      toast.error("Error al actualizar el plan");
    } else {
      setIsPremium(!isPremium);
      setPlanUpdatedAt(now);
      toast.success(`Plan actualizado a ${newPlan === "premium" ? "Premium" : "Basic"}`);
    }
    setIsUpdatingPlan(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <AppBar title="Cargando..." onBack={onBack} />
        <div className="px-4 py-6 flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <AppBar title="Error" onBack={onBack} />
        <div className="p-8 text-center text-gray-500">No se pudo cargar la información del cliente.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AppBar title={client.name} onBack={onBack} />

      <div className="px-4 py-6 space-y-6">
        {/* Perfil del cliente */}
        <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
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

          {/* Toggle Premium */}
          <button
            onClick={handleTogglePremium}
            disabled={isUpdatingPlan}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all mb-3 ${
              isPremium
                ? "bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Crown className={`w-5 h-5 ${isPremium ? "text-primary" : "text-gray-400"}`} />
              <div className="text-left">
                <p className={`text-[14px] font-medium ${isPremium ? "text-primary" : "text-gray-700"}`}>
                  Plan Premium
                </p>
                <p className="text-[12px] text-gray-500">
                  {isPremium ? "Cliente Premium activo" : "Activar plan Premium"}
                </p>
              </div>
            </div>
            {/* Toggle switch */}
            <div className={`w-11 h-6 rounded-full transition-colors relative ${isPremium ? "bg-primary" : "bg-gray-300"}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isPremium ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
          </button>
          {planUpdatedAt && (
            <p className="text-[11px] text-gray-400 text-right -mt-1 mb-2 pr-1">
              Último cambio: {new Date(planUpdatedAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })} {new Date(planUpdatedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}

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
        {client.metrics && client.metrics.length > 0 && (
          <div>
            <h3 className="mb-3">Métricas históricas</h3>
            <div className="grid grid-cols-2 gap-3">
              {client.metrics.map((metric: any, index: number) => {
                // Protección contra arrays vacíos o un solo valor para el gráfico
                const validHistory = metric.history?.filter((v: number) => v > 0) || [];
                const max = validHistory.length > 0 ? Math.max(...validHistory) : 1;

                return (
                  <div key={index} className="bg-white rounded-xl p-3 border border-border shadow-sm">
                    <p className="text-[12px] text-gray-600 mb-1">{metric.label}</p>
                    <p className="text-[18px] font-bold text-gray-900 mb-2">
                      {metric.value}
                      {metric.unit && <span className="text-[14px] ml-0.5 font-medium text-gray-500">{metric.unit}</span>}
                    </p>
                    {/* Mini sparkline */}
                    <div className="flex items-end gap-[2px] h-6 mt-2">
                      {validHistory.map((val: number, i: number) => {
                        const height = max > 0 ? (val / max) * 100 : 0;
                        return (
                          <div
                            key={i}
                            className="flex-1 bg-primary/20 rounded-sm hover:bg-primary transition-colors"
                            style={{ height: `${height}%`, minHeight: '4px' }}
                            title={`${val}${metric.unit}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Planes asignados */}
        <div>
          <h3 className="mb-3">Planes asignados</h3>
          {client.assignedPlans.length > 0 ? (
            <div className="bg-white rounded-2xl p-4 border border-border shadow-sm space-y-3">
              {client.assignedPlans.map((plan: any) => (
                <div key={plan.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 font-semibold text-gray-900">{plan.name}</h4>
                    <p className="text-[13px] text-gray-600">
                      Inicio: {new Date(plan.startDate).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <p className="text-[13px] text-gray-600">
                      Fin: {new Date(plan.endDate).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-success/10 text-success rounded-md">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span className="text-[12px] font-medium">Activo</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-100/50 rounded-xl p-6 text-center border border-dashed border-gray-300">
              <p className="text-[14px] text-gray-600">Sin planes asignados</p>
            </div>
          )}
        </div>

        {/* Workouts recientes */}
        {client.recentWorkouts.length > 0 && (
          <div>
            <h3 className="mb-3">Actividad reciente</h3>
            <div className="bg-white rounded-2xl p-4 border border-border space-y-3 shadow-sm">
              {client.recentWorkouts.map((workout: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
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
                    <CheckCircle className="w-5 h-5 text-success bg-success/10 rounded-full p-0.5" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evolución */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-4 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="mb-1 text-primary font-semibold">Análisis en progreso</h4>
              <p className="text-[14px] text-gray-700 leading-relaxed">
                A medida que el cliente registre más entrenamientos, aquí aparecerán insights sobre su evolución.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}