import { AppBar } from "../../components/AppBar";
import { CardInsight } from "../../components/CardInsight";
import { CoachCard } from "../../components/CoachCard";
import { CTAButton } from "../../components/CTAButton";
import { PremiumBanner } from "../../components/PremiumBanner";
import { Weight, Ruler, Activity, TrendingDown, User, LogOut, Settings, Plus, X, Trash2, MessageCircle, Star } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { clientService } from "../../services/clientService"; // 🚨 Servicio
import { toast } from "sonner";
import { useState, useEffect } from "react";

export function ClientAccountScreen() {
  const { user, logout, session } = useAuth();
  
  const [isAddPRModalOpen, setIsAddPRModalOpen] = useState(false);
  const [personalRecords, setPersonalRecords] = useState<any[]>([]);
  const [exerciseName, setExerciseName] = useState("");
  const [exerciseWeight, setExerciseWeight] = useState("");
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // 🚨 Estados reales para datos
  const [fullName, setFullName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accountData, setAccountData] = useState<any>(null);

  // Cargar récords locales
  useEffect(() => {
    const savedPRs = localStorage.getItem("personalRecords");
    if (savedPRs) {
      setPersonalRecords(JSON.parse(savedPRs));
    }
  }, []);

  // Cargar datos reales
  useEffect(() => {
    const fetchAccountData = async () => {
      if (!session?.user?.id) return;
      setIsLoading(true);

      try {
        // Nombre del perfil
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .single();

        if (profile) setFullName(profile.full_name);

        // Métricas y Coach
        const data = await clientService.getClientAccountData(session.user.id);
        setAccountData(data);

      } catch (error) {
        console.error("Error al cargar la cuenta:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccountData();
  }, [session]);

  const handleUpgradeClick = () => setIsUpgradeModalOpen(true);

  const handleWhatsAppContact = () => {
    const coachName = accountData?.coach?.name || "Entrenador";
    const message = encodeURIComponent(
      `Hola ${coachName}! Me interesa actualizar a Premium. ¿Podrías contarme más sobre los beneficios y el precio?`
    );
    const phoneNumber = "5491138756897"; 
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
      date: new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }),
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

  const handleChangeCoach = () => toast.info("Contacta al administrador para cambiar de entrenador");

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Sesión cerrada");
    } catch (e) {
      toast.error("No se pudo cerrar sesión");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AppBar title="Mi Cuenta" />

      <div className="px-4 py-6 space-y-6">
        <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white">
              <span className="text-[24px] font-bold">
                {(fullName || user?.fullName || user?.email || "?").charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              {isLoading ? (
                <div className="h-5 w-32 rounded-lg bg-gray-200 animate-pulse" />
              ) : (
                <h3 className="mb-1 text-gray-900 font-bold">{fullName || user?.fullName || user?.email?.split("@")[0]}</h3>
              )}
              <p className="text-[14px] text-gray-600">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Insights - Métricas */}
        <div>
          <h3 className="mb-3 text-gray-900">Mis métricas</h3>
          {isLoading || !accountData ? (
            <div className="grid grid-cols-2 gap-3 animate-pulse">
              <div className="h-24 bg-white rounded-2xl border border-border"></div>
              <div className="h-24 bg-white rounded-2xl border border-border"></div>
              <div className="h-24 bg-white rounded-2xl border border-border"></div>
              <div className="h-24 bg-white rounded-2xl border border-border"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <CardInsight title="Peso" value={accountData.insights.weight.value || "-"} unit="kg" trend={accountData.insights.weight.trend} trendValue={accountData.insights.weight.trendValue} icon={Weight} />
              <CardInsight title="Estatura" value={accountData.insights.height.value || "-"} unit="cm" trend="neutral" icon={Ruler} />
              <CardInsight title="% Grasa" value={accountData.insights.bodyFat.value || "-"} unit="%" trend={accountData.insights.bodyFat.trend} trendValue={accountData.insights.bodyFat.trendValue} icon={TrendingDown} />
              <CardInsight title="IMC" value={accountData.insights.bmi.value || "-"} unit="" trend="neutral" icon={Activity} />
            </div>
          )}
        </div>

        {/* Records personales (Local Storage) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-900">Records personales</h3>
            <button onClick={() => setIsAddPRModalOpen(true)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors active:scale-95">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
            {personalRecords.length === 0 ? (
              <p className="text-center text-gray-500 py-4 text-[14px]">No hay récords registrados aún</p>
            ) : (
              <div className="space-y-1">
                {personalRecords.map((pr, index) => (
                  <div key={index} className="flex items-center justify-between py-2 group border-b border-gray-50 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-[15px]">{pr.exercise}</p>
                      <p className="text-[12px] text-gray-500">{pr.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[18px] font-bold text-primary">{pr.value}</span>
                      <button onClick={() => handleDeletePR(index)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <PremiumBanner onUpgrade={handleUpgradeClick} />

        {/* Mi Profesor */}
        <div>
          <h3 className="mb-3 text-gray-900">Mi profesor</h3>
          {isLoading || !accountData ? (
             <div className="h-32 bg-white rounded-2xl border border-border animate-pulse"></div>
          ) : (
            <CoachCard
              name={accountData.coach.name}
              rating={accountData.coach.rating}
              specialty={accountData.coach.specialty}
              certifications={accountData.coach.certifications}
              onChangeCoach={handleChangeCoach}
            />
          )}
        </div>

        <div className="bg-white rounded-2xl p-2 border border-border shadow-sm">
          <button className="w-full flex items-center gap-3 px-3 py-4 hover:bg-gray-50 rounded-xl transition-colors">
            <User className="w-5 h-5 text-gray-500" />
            <span className="flex-1 text-left font-medium text-gray-700">Datos personales</span>
            <span className="text-[11px] text-gray-400 font-medium">Pronto...</span>
          </button>
          <div className="h-px bg-gray-100 mx-3" />
          <button className="w-full flex items-center gap-3 px-3 py-4 hover:bg-gray-50 rounded-xl transition-colors">
            <Settings className="w-5 h-5 text-gray-500" />
            <span className="flex-1 text-left font-medium text-gray-700">Configuración</span>
            <span className="text-[11px] text-gray-400 font-medium">Pronto...</span>
          </button>
        </div>

        <CTAButton variant="outline" fullWidth icon={LogOut} onClick={handleLogout}>Cerrar sesión</CTAButton>
      </div>

      {/* Modales mantenidos igual, omito el código de los modales para no saturar, pero dejalos tal cual los tenías al final del archivo */}
      {isAddPRModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setIsAddPRModalOpen(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">Agregar récord personal</h3>
              <button onClick={() => setIsAddPRModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[14px] font-medium text-gray-700 mb-2">Ejercicio</label>
                <input type="text" placeholder="Ej: Press de banca" value={exerciseName} onChange={(e) => setExerciseName(e.target.value)} className="w-full h-12 px-4 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-[15px]" autoFocus />
              </div>
              <div>
                <label className="block text-[14px] font-medium text-gray-700 mb-2">Peso máximo (1RM)</label>
                <div className="relative">
                  <input type="number" placeholder="80" value={exerciseWeight} onChange={(e) => setExerciseWeight(e.target.value)} className="w-full h-12 px-4 pr-12 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-[15px]" step="0.5" min="0" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-[15px] font-medium">kg</span>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex gap-3">
              <button onClick={() => setIsAddPRModalOpen(false)} className="flex-1 h-12 rounded-xl border border-border font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={handleAddPR} className="flex-1 h-12 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors active:scale-[0.98]">Agregar</button>
            </div>
          </div>
        </div>
      )}

      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setIsUpgradeModalOpen(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">Contactá a tu profesor</h3>
              <button onClick={() => setIsUpgradeModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-br from-gray-50 to-white border border-border rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white">
                    <span className="text-[18px] font-bold">{(accountData?.coach?.name || "?").charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{accountData?.coach?.name}</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-warning fill-warning" />
                      <span className="text-[13px] text-gray-600">{accountData?.coach?.rating} • {accountData?.coach?.specialty}</span>
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