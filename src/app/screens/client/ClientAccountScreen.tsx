import { AppBar } from "../../components/AppBar";
import { CardInsight } from "../../components/CardInsight";
import { CoachCard } from "../../components/CoachCard";
import { CTAButton } from "../../components/CTAButton";
import { PremiumBanner } from "../../components/PremiumBanner";
import { Weight, Ruler, Activity, TrendingDown, User, LogOut, Settings, Plus, X, Trash2, MessageCircle, Star } from "lucide-react";
import { clientData } from "../../data/mockData";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export function ClientAccountScreen() {
  const { user, logout } = useAuth();
  const insights = clientData.insights;
  const coach = clientData.coach;
  const prs = clientData.personalRecords;
  
  const [isAddPRModalOpen, setIsAddPRModalOpen] = useState(false);
  const [personalRecords, setPersonalRecords] = useState(prs);
  const [exerciseName, setExerciseName] = useState("");
  const [exerciseWeight, setExerciseWeight] = useState("");
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Cargar récords del localStorage al montar
  useEffect(() => {
    const savedPRs = localStorage.getItem("personalRecords");
    if (savedPRs) {
      setPersonalRecords(JSON.parse(savedPRs));
    }
  }, []);

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

  const handleAddPR = () => {
    if (!exerciseName.trim() || !exerciseWeight.trim()) {
      toast.error("Completá todos los campos");
      return;
    }

    const weight = parseFloat(exerciseWeight);
    if (isNaN(weight) || weight <= 0) {
      toast.error("Ingresá un peso válido");
      return;
    }

    const newPR = {
      exercise: exerciseName.trim(),
      value: `${weight}kg`,
      date: new Date().toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    };

    const updatedPRs = [...personalRecords, newPR];
    setPersonalRecords(updatedPRs);
    localStorage.setItem("personalRecords", JSON.stringify(updatedPRs));

    toast.success("Récord agregado correctamente");
    setExerciseName("");
    setExerciseWeight("");
    setIsAddPRModalOpen(false);
  };

  const handleDeletePR = (index: number) => {
    const updatedPRs = personalRecords.filter((_, i) => i !== index);
    setPersonalRecords(updatedPRs);
    localStorage.setItem("personalRecords", JSON.stringify(updatedPRs));
    toast.success("Récord eliminado");
  };

  const handleChangeCoach = () => {
    toast.info("Contacta al administrador para cambiar de entrenador");
  };

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AppBar title="Mi Cuenta" />

      <div className="px-4 py-6 space-y-6">
        {/* Perfil del usuario */}
        <div className="bg-white rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white">
              <span className="text-[24px] font-bold">
                {user?.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="mb-1">{user?.email.split("@")[0]}</h3>
              <p className="text-[14px] text-gray-600">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Insights - Métricas */}
        <div>
          <h3 className="mb-3">Mis métricas</h3>
          <div className="grid grid-cols-2 gap-3">
            <CardInsight
              title="Peso"
              value={insights.weight.value}
              unit={insights.weight.unit}
              trend={insights.weight.trend}
              trendValue={insights.weight.trendValue}
              icon={Weight}
            />
            <CardInsight
              title="Estatura"
              value={insights.height.value}
              unit={insights.height.unit}
              trend={insights.height.trend}
              icon={Ruler}
            />
            <CardInsight
              title="% Grasa"
              value={insights.bodyFat.value}
              unit={insights.bodyFat.unit}
              trend={insights.bodyFat.trend}
              trendValue={insights.bodyFat.trendValue}
              icon={TrendingDown}
            />
            <CardInsight
              title="IMC"
              value={insights.bmi.value}
              unit={insights.bmi.unit}
              trend={insights.bmi.trend}
              trendValue={insights.bmi.trendValue}
              icon={Activity}
            />
          </div>
        </div>

        {/* Records personales */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3>Records personales</h3>
            <button
              onClick={() => setIsAddPRModalOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors active:scale-95"
              title="Agregar récord personal"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-border">
            {personalRecords.length === 0 ? (
              <p className="text-center text-gray-500 py-6">
                No hay récords registrados aún
              </p>
            ) : (
              <div className="space-y-3">
                {personalRecords.map((pr, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 group"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{pr.exercise}</p>
                      <p className="text-[13px] text-gray-600">{pr.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[20px] font-bold text-primary">
                        {pr.value}
                      </span>
                      <button
                        onClick={() => handleDeletePR(index)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Eliminar récord"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Banner Premium */}
        <PremiumBanner onUpgrade={handleUpgradeClick} />

        {/* Mi Profesor */}
        <div>
          <h3 className="mb-3">Mi profesor</h3>
          <CoachCard
            name={coach.name}
            rating={coach.rating}
            specialty={coach.specialty}
            certifications={coach.certifications}
            onChangeCoach={handleChangeCoach}
          />
        </div>

        {/* Datos personales */}
        <div className="bg-white rounded-2xl p-4 border border-border">
          <button className="w-full flex items-center gap-3 py-3 hover:bg-gray-50 rounded-lg transition-colors">
            <User className="w-5 h-5 text-gray-600" />
            <span className="flex-1 text-left font-medium text-gray-900">Datos personales</span>
          </button>
          <button className="w-full flex items-center gap-3 py-3 hover:bg-gray-50 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-gray-600" />
            <span className="flex-1 text-left font-medium text-gray-900">Configuración</span>
          </button>
        </div>

        {/* Cerrar sesión */}
        <CTAButton
          variant="outline"
          fullWidth
          icon={LogOut}
          onClick={handleLogout}
        >
          Cerrar sesión
        </CTAButton>
      </div>

      {/* Modal para agregar récords */}
      {isAddPRModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setIsAddPRModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">Agregar récord personal</h3>
              <button
                onClick={() => setIsAddPRModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[14px] font-medium text-gray-700 mb-2">
                  Ejercicio
                </label>
                <input
                  type="text"
                  placeholder="Ej: Press de banca"
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  className="w-full h-12 px-4 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-[15px]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[14px] font-medium text-gray-700 mb-2">
                  Peso máximo (1RM)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="80"
                    value={exerciseWeight}
                    onChange={(e) => setExerciseWeight(e.target.value)}
                    className="w-full h-12 px-4 pr-12 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-[15px]"
                    step="0.5"
                    min="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-[15px] font-medium">
                    kg
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-[12px] text-blue-900">
                  💡 Tu entrenador usará este dato para calcular el peso adecuado en tus workouts (ej: 80% de 1RM)
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex gap-3">
              <button
                onClick={() => setIsAddPRModalOpen(false)}
                className="flex-1 h-12 rounded-xl border border-border font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddPR}
                className="flex-1 h-12 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors active:scale-[0.98]"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para actualizar a Premium */}
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