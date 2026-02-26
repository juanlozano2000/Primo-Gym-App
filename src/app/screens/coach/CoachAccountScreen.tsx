import { AppBar } from "../../components/AppBar";
import { CTAButton } from "../../components/CTAButton";
import { CardInsight } from "../../components/CardInsight";
import { Award, Star, Users, TrendingUp, LogOut, Settings, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { dashboardService } from "../../services/dashboardService";

// Interfaz para el perfil de la base de datos
interface CoachDetails {
  bio: string;
  specialties: string[];
  certifications: string[];
  years_experience: number;
  rating: number;
}

export function CoachAccountScreen() {
  const { user, logout } = useAuth();
  
  // Usamos el nombre del AuthContext directamente
  const fullName = user?.fullName || "Entrenador";
  
  // Estado para los datos reales de la base
  const [profileData, setProfileData] = useState<CoachDetails | null>(null);
  const [activeClientsCount, setActiveClientsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCoachData = async () => {
      if (!user?.id) return;
      setIsLoading(true);

      try {
        // 1. Traemos la Bio y Especialidades reales
        const details = await dashboardService.getCoachProfile(user.id);
        if (details) setProfileData(details);

        // 2. Calculamos los clientes activos reales para las métricas
        const dashboard = await dashboardService.getCoachDashboardData(user.id);
        setActiveClientsCount(dashboard.summary.activeClients);

      } catch (error) {
        console.error("Error al cargar datos del entrenador:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoachData();
  }, [user?.id]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Sesión cerrada");
    } catch (e) {
      console.error("Error al cerrar sesión:", e);
      toast.error("No se pudo cerrar sesión");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <AppBar title="Mi Cuenta" />
        <div className="px-4 py-6 space-y-6 animate-pulse">
          <div className="bg-white rounded-2xl p-4 h-48" />
          <div className="grid grid-cols-3 gap-3"><div className="h-24 bg-white rounded-2xl" /><div className="h-24 bg-white rounded-2xl" /><div className="h-24 bg-white rounded-2xl" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AppBar title="Mi Cuenta" />

      <div className="px-4 py-6 space-y-6">
        {/* Portfolio del entrenador */}
        <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white">
              <span className="text-[28px] font-bold">
                {fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="mb-1 text-gray-900 font-bold">{fullName}</h2>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-warning text-warning" />
                <span className="text-[14px] font-semibold text-gray-900">
                  {profileData?.rating || "5.0"}
                </span>
                <span className="text-[14px] text-gray-600 ml-1">
                  • {profileData?.years_experience || "Nuev@"} años de exp.
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          <p className="text-[15px] text-gray-700 mb-4 leading-relaxed">
            {profileData?.bio || "Sin biografía registrada."}
          </p>

          {/* Especialidades */}
          {profileData?.specialties && profileData.specialties.length > 0 && (
            <div className="mb-4">
              <p className="text-[13px] font-medium text-gray-700 mb-2">Especialidades</p>
              <div className="flex flex-wrap gap-2">
                {profileData.specialties.map((specialty, index) => (
                  <span
                    key={index}
                    className="inline-block px-3 py-1 bg-primary/10 text-primary text-[13px] font-medium rounded-lg"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Certificaciones */}
          {profileData?.certifications && profileData.certifications.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-gray-600" />
                <p className="text-[13px] font-medium text-gray-700">Certificaciones</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {profileData.certifications.map((cert, index) => (
                  <span
                    key={index}
                    className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-[12px] rounded-md font-medium"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Métricas del entrenador */}
        <div>
          <h3 className="mb-3 text-gray-900">Mis métricas</h3>
          <div className="grid grid-cols-3 gap-3">
            <CardInsight
              title="Retención"
              value={92} // Esto quedará pendiente para calcular históricamente
              unit="%"
              trend="up"
              icon={TrendingUp}
            />
            <CardInsight
              title="NPS"
              value={87}
              trend="up"
              icon={Star}
            />
            <CardInsight
              title="Clientes"
              value={activeClientsCount} // 🚨 Usamos el contador real de la BD
              icon={Users}
            />
          </div>
        </div>

        {/* Datos personales (Botones estáticos por ahora) */}
        <div className="bg-white rounded-2xl p-2 border border-border shadow-sm">
          <button className="w-full flex items-center gap-3 px-3 py-4 hover:bg-gray-50 rounded-xl transition-colors">
            <User className="w-5 h-5 text-gray-500" />
            <span className="flex-1 text-left font-medium text-gray-700">
              Datos personales
            </span>
            <span className="text-[11px] text-gray-400 font-medium">Pronto...</span>
          </button>
          <div className="h-px bg-gray-100 mx-3" />
          <button className="w-full flex items-center gap-3 px-3 py-4 hover:bg-gray-50 rounded-xl transition-colors">
            <Settings className="w-5 h-5 text-gray-500" />
            <span className="flex-1 text-left font-medium text-gray-700">
              Configuración
            </span>
            <span className="text-[11px] text-gray-400 font-medium">Pronto...</span>
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
    </div>
  );
}