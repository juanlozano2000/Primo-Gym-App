import { Plus, Activity, BarChart3, Crown, X, MessageCircle, Star } from "lucide-react";
import { AppBar } from "../../components/AppBar";
import { CTAButton } from "../../components/CTAButton";
import { MetricChip } from "../../components/MetricChip";
import { CardWorkout } from "../../components/CardWorkout";
import { GymStoryGenerator } from "../../components/GymStoryGenerator";
import { useAuth } from "../../context/AuthContext";
import { clientData, workouts } from "../../data/mockData";
import { useState } from "react";

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
  const { user } = useAuth();
  const firstName = user?.name.split(" ")[0] || "Usuario";
  const progress = clientData.weeklyProgress;
  const coach = clientData.coach;
  const userPlan = clientData.plan;
  
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  
  // Próximos workouts (solo pendientes y en curso)
  const upcomingWorkouts = workouts.filter(
    (w) => w.status === "pending" || w.status === "in-progress"
  ).slice(0, 2);

  const handleUpgradeClick = () => {
    setIsUpgradeModalOpen(true);
  };

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      `Hola ${coach.name}! Me interesa actualizar a Premium. ¿Podrías contarme más sobre los beneficios y el precio?`
    );
    const phoneNumber = "5491123456789"; // Número de ejemplo
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AppBar showNotifications />

      <div className="px-4 py-6 space-y-6">
        {/* Saludo */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1>Hola, {firstName} 👋</h1>
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
          <p className="text-[15px] text-gray-600">
            Listo para entrenar hoy
          </p>
        </div>

        {/* Progreso semanal */}
        <div className="bg-white rounded-2xl p-4 border border-border">
          <h3 className="mb-3">Progreso esta semana</h3>
          
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

        {/* Acciones rápidas */}
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

        {/* Botón para crear historia del gym */}
        <GymStoryGenerator 
          metrics={progress}
          userName={user?.name || "Usuario"}
        />

        {/* Próximos entrenamientos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3>Próximos entrenamientos</h3>
            <button
              onClick={onNavigateToWorkouts}
              className="text-[14px] text-primary font-medium"
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
              <div className="text-center py-8 text-gray-500">
                <p className="text-[15px]">No hay entrenamientos pendientes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Upgrade a Premium */}
      {isUpgradeModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setIsUpgradeModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">Contactá a tu profesor</h3>
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-[14px] text-gray-600">
                Para actualizar a Premium y disfrutar de todos los beneficios exclusivos, contactá directamente a tu entrenador:
              </p>

              {/* Tarjeta del profesor */}
              <div className="bg-gradient-to-br from-gray-50 to-white border border-border rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white">
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

                {/* Certificaciones */}
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

                {/* Botón de WhatsApp */}
                <button
                  onClick={handleWhatsAppContact}
                  className="w-full h-12 bg-[#25D366] text-white font-medium rounded-xl hover:bg-[#22c55e] transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Consultar por WhatsApp
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-[12px] text-blue-900">
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