import { AppBar } from "../../components/AppBar";
import { CTAButton } from "../../components/CTAButton";
import { Plus, Copy, FileText, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

interface AssignedPlanData {
  id: string;
  workoutId: string;
  title: string;
  scheduledDate: string;
  isCompleted: boolean;
  exercises: { id: string; name: string; sets: number }[];
}

interface EditPlanScreenProps {
  clientId: string;
  onBack: () => void;
}

export function EditPlanScreen({ clientId, onBack }: EditPlanScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [plans, setPlans] = useState<AssignedPlanData[]>([]);
  const [clientName, setClientName] = useState("Cliente");

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true);
      try {
        // Traer nombre del cliente
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", clientId)
          .single();

        if (profile) setClientName(profile.full_name || "Cliente");

        // Traer planes asignados con sus workouts y ejercicios
        const { data, error } = await supabase
          .from("assigned_plans")
          .select(`
            id,
            workout_id,
            scheduled_date,
            is_completed,
            workouts (
              title,
              workout_items (
                id,
                sets,
                exercises (name)
              )
            )
          `)
          .eq("client_id", clientId)
          .order("scheduled_date", { ascending: true });

        if (error) throw error;

        const formatted: AssignedPlanData[] = (data || []).map((ap: any) => {
          const w = Array.isArray(ap.workouts) ? ap.workouts[0] : ap.workouts;
          const items = w?.workout_items || [];
          return {
            id: ap.id,
            workoutId: ap.workout_id,
            title: w?.title || "Rutina",
            scheduledDate: ap.scheduled_date,
            isCompleted: ap.is_completed,
            exercises: items.map((item: any) => ({
              id: item.id,
              name: Array.isArray(item.exercises) ? item.exercises[0]?.name : (item.exercises?.name || "Ejercicio"),
              sets: item.sets || 0,
            })),
          };
        });

        setPlans(formatted);
      } catch (err) {
        console.error("Error cargando planes:", err);
        toast.error("Error al cargar los planes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [clientId]);

  const handleDeleteAssignment = async (assignmentId: string) => {
    const { error } = await supabase
      .from("assigned_plans")
      .delete()
      .eq("id", assignmentId);

    if (error) {
      toast.error("Error al eliminar la asignación");
    } else {
      setPlans((prev) => prev.filter((p) => p.id !== assignmentId));
      toast.success("Asignación eliminada");
    }
  };

  const handleDuplicate = async (plan: AssignedPlanData) => {
    // Duplicar la asignación con fecha de mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from("assigned_plans")
      .insert({
        client_id: clientId,
        workout_id: plan.workoutId,
        scheduled_date: tomorrow.toISOString().split("T")[0],
        is_completed: false,
      })
      .select("id")
      .single();

    if (error) {
      toast.error("Error al duplicar");
    } else if (data) {
      setPlans((prev) => [
        ...prev,
        { ...plan, id: data.id, scheduledDate: tomorrow.toISOString().split("T")[0], isCompleted: false },
      ]);
      toast.success("Plan duplicado para mañana");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <AppBar title="Editar Plan" onBack={onBack} />
        <div className="px-4 py-6 flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AppBar title={`Plan de ${clientName}`} onBack={onBack} />

      <div className="px-4 py-6 space-y-6">
        {plans.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-dashed border-border text-center">
            <p className="text-[15px] text-gray-500">Este cliente no tiene rutinas asignadas</p>
            <p className="text-[13px] text-gray-400 mt-1">Creá un plan y asignalo desde la pantalla principal</p>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-2xl p-4 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{plan.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${
                    plan.isCompleted 
                      ? "bg-success/10 text-success" 
                      : "bg-primary/10 text-primary"
                  }`}>
                    {plan.isCompleted ? "Completado" : "Pendiente"}
                  </span>
                </div>

                <p className="text-[13px] text-gray-500 mb-3">
                  Programado: {new Date(plan.scheduledDate).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                </p>

                {plan.exercises.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {plan.exercises.map((ex) => (
                      <div key={ex.id} className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg">
                        <span className="text-[14px] text-gray-700">{ex.name}</span>
                        <span className="text-[13px] text-gray-500">{ex.sets} series</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleDuplicate(plan)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Duplicar
                  </button>
                  {!plan.isCompleted && (
                    <button
                      onClick={() => handleDeleteAssignment(plan.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Nota informativa */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <FileText className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
            <p className="text-[13px] text-blue-800 leading-relaxed">
              Para agregar nuevas rutinas, usá "Crear plan" desde la pantalla principal y asignalo a este cliente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
