import { AppBar } from "../../components/AppBar";
import { CardWorkout } from "../../components/CardWorkout";
import { EmptyState } from "../../components/EmptyState";
import { PremiumBanner } from "../../components/PremiumBanner";
import { Dumbbell, X, MessageCircle, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { clientService, WorkoutSummary } from "../../services/clientService"; // 🚨 Importado

interface ClientWorkoutsScreenProps {
  onBack: () => void;
  onWorkoutClick: (workoutId: string) => void;
}

export function ClientWorkoutsScreen({
  onBack,
  onWorkoutClick,
}: ClientWorkoutsScreenProps) {
  const { session } = useAuth();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  
  // 🚨 Estados reales
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [coachName, setCoachName] = useState("Tu Entrenador");

  useEffect(() => {
    const fetchWorkouts = async () => {
      if (!session?.user?.id) return;
      setIsLoading(true);
      
      const data = await clientService.getAllWorkouts(session.user.id);
      setWorkouts(data);

      // Traer nombre del coach para WhatsApp
      const { data: relation } = await supabase
        .from("coach_clients")
        .select("coach:profiles!coach_id(full_name)")
        .eq("client_id", session.user.id)
        .eq("status", "active")
        .maybeSingle();

      if (relation && relation.coach) {
        // @ts-ignore
        setCoachName(relation.coach.full_name || "Tu Entrenador");
      }
      setIsLoading(false);
    };

    fetchWorkouts();
  }, [session]);

  const handleUpgradeClick = () => setIsUpgradeModalOpen(true);

  const filteredWorkouts = workouts.filter((w) => {
    if (filter === "all") return true;
    if (filter === "pending") return w.status === "pending" || w.status === "in-progress";
    if (filter === "completed") return w.status === "completed";
    return true;
  });

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      `Hola ${coachName}! Me interesa actualizar a Premium. ¿Podrías contarme más sobre los beneficios y el precio?`
    );
    const phoneNumber = "5491123456789"; 
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AppBar title="Mis Workouts" onBack={onBack} />

      <div className="px-4 py-6 max-w-5xl mx-auto">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex-1">
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-lg text-[14px] font-medium whitespace-nowrap transition-colors ${filter === "all" ? "bg-primary text-white" : "bg-white text-gray-700 border border-border"}`}>Todos</button>
              <button onClick={() => setFilter("pending")} className={`px-4 py-2 rounded-lg text-[14px] font-medium whitespace-nowrap transition-colors ${filter === "pending" ? "bg-primary text-white" : "bg-white text-gray-700 border border-border"}`}>Pendientes</button>
              <button onClick={() => setFilter("completed")} className={`px-4 py-2 rounded-lg text-[14px] font-medium whitespace-nowrap transition-colors ${filter === "completed" ? "bg-primary text-white" : "bg-white text-gray-700 border border-border"}`}>Completados</button>
            </div>

            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                 <div className="h-24 bg-gray-200 rounded-xl w-full" />
                 <div className="h-24 bg-gray-200 rounded-xl w-full" />
              </div>
            ) : filteredWorkouts.length > 0 ? (
              <div className="space-y-3">
                {filteredWorkouts.map((workout, idx) => (
                  <CardWorkout
                    key={idx} // Usamos idx porque el ID de la rutina se puede repetir si está asignada varios días
                    title={workout.title}
                    exercises={workout.exercises}
                    duration={workout.duration}
                    status={workout.status}
                    onClick={() => onWorkoutClick(workout.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Dumbbell}
                title="No hay entrenamientos"
                description="Tu entrenador aún no te ha asignado workouts."
              />
            )}
          </div>

          <div className="lg:w-[320px] lg:sticky lg:top-[80px]">
            <div className="mb-6">
              <PremiumBanner onUpgrade={handleUpgradeClick} />
            </div>
          </div>
        </div>
      </div>

      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setIsUpgradeModalOpen(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">Contactá a tu profesor</h3>
              <button onClick={() => setIsUpgradeModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-br from-gray-50 to-white border border-border rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white">
                    <span className="text-[18px] font-bold">{coachName.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{coachName}</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-warning fill-warning" />
                      <span className="text-[13px] text-gray-600">4.9 • Profesional</span>
                    </div>
                  </div>
                </div>
                <button onClick={handleWhatsAppContact} className="w-full h-12 bg-[#25D366] text-white font-medium rounded-xl hover:bg-[#22c55e] transition-colors active:scale-[0.98] flex items-center justify-center gap-2">
                  <MessageCircle className="w-5 h-5" /> Consultar por WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}