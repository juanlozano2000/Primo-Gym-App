import { Plus, Activity, BarChart3, Crown, X, MessageCircle, Star } from "lucide-react";
import { AppBar } from "../../components/AppBar";
import { CTAButton } from "../../components/CTAButton";
import { MetricChip } from "../../components/MetricChip";
import { CardWorkout } from "../../components/CardWorkout";
import { GymStoryGenerator } from "../../components/GymStoryGenerator";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
// 🚨 Importamos el nuevo servicio del cliente
import { clientService, WorkoutSummary } from "../../services/clientService";

let cachedClientFullName: string | null = null;
let cachedClientUserId: string | null = null;

interface ClientHomeScreenProps {
  onNavigateToWorkouts: () => void;
  onNavigateToMetrics: () => void;
  onWorkoutClick: (workoutId: string) => void;
}

export function ClientHomeScreen({
  onNavigateToWorkouts,
  onNavigateToMetrics,
  onWorkoutClick,
}: ClientHomeScreenProps) {
  const { session } = useAuth();
  
  const hasCachedForUser =
    session?.user?.id &&
    cachedClientUserId === session.user.id &&
    cachedClientFullName;

  const [fullName, setFullName] = useState<string | null>(
    hasCachedForUser ? cachedClientFullName! : null
  );
  const [userPlan, setUserPlan] = useState<"Basic" | "Premium">("Basic");
  const [coachName, setCoachName] = useState<string>("Tu Entrenador");
  const [gymName, setGymName] = useState<string | null>(null);
  const [gymLogoUrl, setGymLogoUrl] = useState<string | null>(null);
  const [isLoadingName, setIsLoadingName] = useState(!hasCachedForUser);
  
  // 🚨 Estados para datos reales
  const [upcomingWorkouts, setUpcomingWorkouts] = useState<WorkoutSummary[]>([]);
  const [progress, setProgress] = useState({
    completedSets: 0,
    totalSets: 0,
    completedWorkouts: 0,
    totalWorkouts: 0,
    totalTime: "0 min"
  });
  
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const firstName = fullName?.split(" ")[0] || "Atleta";
  
  const coach = {
    name: coachName,
    rating: 4.9,
    specialty: "Hipertrofia y fuerza",
    certifications: ["NSCA-CPT", "CrossFit L2"]
  };

  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoadingName(false);
      return;
    }

    const fetchAllData = async () => {
      try {
        // 1. Perfil y Coach
        const { data: clientProfile } = await supabase
          .from("profiles")
          .select("full_name, plan_type, gym_name, gym_logo_url")
          .eq("id", session.user.id)
          .single();

        if (clientProfile) {
          setFullName(clientProfile.full_name);
          cachedClientFullName = clientProfile.full_name;
          cachedClientUserId = session.user.id;
          setGymName(clientProfile.gym_name ?? null);
          setGymLogoUrl(clientProfile.gym_logo_url ?? null);
          setUserPlan(clientProfile.plan_type?.toLowerCase() === "premium" ? "Premium" : "Basic");
        }

        const { data: relationData } = await supabase
          .from("coach_clients")
          .select("coach:profiles!coach_id(full_name)")
          .eq("client_id", session.user.id)
          .eq("status", "active")
          .maybeSingle();

        if (relationData && relationData.coach) {
          // @ts-ignore
          setCoachName(relationData.coach.full_name || "Tu Entrenador");
        }

        // 🚨 2. Traer rutinas pendientes y progreso de la BD usando el servicio
        const [workoutsData, progressData] = await Promise.all([
          clientService.getUpcomingWorkouts(session.user.id),
          clientService.getWeeklyProgress(session.user.id)
        ]);

        setUpcomingWorkouts(workoutsData);
        setProgress(progressData);

      } catch (error) {
        console.error("Error cargando datos del home:", error);
      } finally {
        setIsLoadingName(false);
      }
    };

    fetchAllData();
  }, [session]);
  
  const handleUpgradeClick = () => {
    setIsUpgradeModalOpen(true);
  };

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      `Hola ${coachName}! Me interesa actualizar a Premium. ¿Podrías contarme más sobre los beneficios y el precio?`
    );
    const phoneNumber = "5491123456789"; 
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AppBar showNotifications />

      <div className="px-4 py-6 space-y-6">
        <div>
          {isLoadingName ? (
            <div className="space-y-2 animate-pulse mb-3">
              <div className="h-7 w-40 rounded-lg bg-gray-200" />
              <div className="h-4 w-52 rounded-lg bg-gray-200" />
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">Hola, {firstName} 👋</h1>
              <div className="flex items-center gap-1">
              {userPlan === "Premium" ? (
                <div className="px-3 py-1 bg-gradient-to-r from-primary to-accent rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3 text-white" />
                  <span className="text-[11px] font-bold text-white uppercase tracking-wide">
                    Premium
                  </span>
                </div>
              ) : (
                <>
                  <div className="px-3 py-1 bg-gray-200 rounded-full">
                    <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">
                      Basic
                    </span>
                  </div>
                  <button
                    onClick={handleUpgradeClick}
                    className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95"
                    title="Actualizar a Premium"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </>
              )}
              </div>
            </div>
          )}
          {!isLoadingName && (
            <p className="text-[15px] text-gray-600">
              Listo para entrenar hoy
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
          <h3 className="font-semibold mb-3">Progreso esta semana</h3>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <MetricChip
              label="Series"
              value={`${progress.completedSets}/${progress.totalSets}`}
              variant="primary"
            />
            <MetricChip
              label="Workouts"
              value={`${progress.completedWorkouts}/${progress.totalWorkouts}`}
              variant="success"
            />
          </div>
          
          <div className="flex items-center gap-2 text-gray-600">
            <Activity className="w-4 h-4" />
            <span className="text-[14px]">Tiempo total: {progress.totalTime}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CTAButton
            variant="primary"
            icon={Plus}
            onClick={onNavigateToWorkouts}
            fullWidth
          >
            Comenzar workout
          </CTAButton>
          <CTAButton
            variant="outline"
            icon={BarChart3}
            onClick={onNavigateToMetrics}
            fullWidth
          >
            Registrar métricas
          </CTAButton>
        </div>

        <GymStoryGenerator 
          metrics={progress}
          userName={fullName || firstName}
          gymName={gymName || undefined}
          gymLogo={gymLogoUrl || undefined}
        />

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Próximos entrenamientos</h3>
            <button
              onClick={onNavigateToWorkouts}
              className="text-[14px] text-primary font-medium hover:underline"
            >
              Ver todos
            </button>
          </div>
          
          <div className="space-y-3">
            {upcomingWorkouts.length > 0 ? (
              upcomingWorkouts.map((workout) => (
                <CardWorkout
                  key={workout.id}
                  title={workout.title}
                  exercises={workout.exercises}
                  duration={workout.duration}
                  status={workout.status}
                  onClick={() => onWorkoutClick(workout.id)}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-dashed">
                <p className="text-[15px]">No tenés rutinas asignadas</p>
                <p className="text-[12px] text-gray-400 mt-1">Contactá a tu entrenador</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isUpgradeModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setIsUpgradeModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">Contactá a tu profesor</h3>
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-[14px] text-gray-600">
                Para actualizar a Premium y disfrutar de todos los beneficios exclusivos, contactá directamente a tu entrenador:
              </p>

              <div className="bg-gradient-to-br from-gray-50 to-white border border-border rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-sm">
                    <span className="text-[18px] font-bold">
                      {coach.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{coach.name}</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-warning fill-warning" />
                      <span className="text-[13px] text-gray-600">
                        {coach.rating} • {coach.specialty}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {coach.certifications.map((cert, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-primary/10 text-primary text-[11px] font-medium rounded-lg"
                    >
                      {cert}
                    </span>
                  ))}
                </div>

                <button
                  onClick={handleWhatsAppContact}
                  className="w-full h-12 bg-[#25D366] text-white font-medium rounded-xl hover:bg-[#22c55e] transition-colors active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
                >
                  <MessageCircle className="w-5 h-5" />
                  Consultar por WhatsApp
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-[12px] text-blue-900 leading-relaxed">
                  💬 Tu entrenador te informará sobre precio, beneficios y cómo activar el plan Premium
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}