import { AppBar } from "../../components/AppBar";
import { CardWorkout } from "../../components/CardWorkout";
import { EmptyState } from "../../components/EmptyState";
import { PremiumBanner } from "../../components/PremiumBanner";
import { Dumbbell, X, MessageCircle, Star } from "lucide-react";
import { workouts, clientData } from "../../data/mockData";
import { useState } from "react";

interface ClientWorkoutsScreenProps {
  onBack: () => void;
  onWorkoutClick: (workoutId: string) => void;
}

export function ClientWorkoutsScreen({
  onBack,
  onWorkoutClick,
}: ClientWorkoutsScreenProps) {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const coach = clientData.coach;

  const handleUpgradeClick = () => {
    setIsUpgradeModalOpen(true);
  };

  const filteredWorkouts = workouts.filter((w) => {
    if (filter === "all") return true;
    if (filter === "pending") return w.status === "pending" || w.status === "in-progress";
    if (filter === "completed") return w.status === "completed";
    return true;
  });

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      `Hola ${coach.name}! Me interesa actualizar a Premium. ¿Podrías contarme más sobre los beneficios y el precio?`
    );
    const phoneNumber = "5491123456789"; // Número de ejemplo
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AppBar title="Mis Workouts" onBack={onBack} />

      <div className="px-4 py-6">
        {/* Filtros rápidos (opcional) */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-[14px] font-medium whitespace-nowrap transition-colors ${
              filter === "all"
                ? "bg-primary text-white"
                : "bg-white text-gray-700 border border-border"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-lg text-[14px] font-medium whitespace-nowrap transition-colors ${
              filter === "pending"
                ? "bg-primary text-white"
                : "bg-white text-gray-700 border border-border"
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-4 py-2 rounded-lg text-[14px] font-medium whitespace-nowrap transition-colors ${
              filter === "completed"
                ? "bg-primary text-white"
                : "bg-white text-gray-700 border border-border"
            }`}
          >
            Completados
          </button>
        </div>

        {/* Banner Premium */}
        <div className="mb-6">
          <PremiumBanner onUpgrade={handleUpgradeClick} />
        </div>

        {/* Lista de workouts */}
        {filteredWorkouts.length > 0 ? (
          <div className="space-y-3">
            {filteredWorkouts.map((workout) => (
              <CardWorkout
                key={workout.id}
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
            description="Tu entrenador aún no te ha asignado workouts para esta semana."
          />
        )}
      </div>

      {/* Modal de Upgrade */}
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