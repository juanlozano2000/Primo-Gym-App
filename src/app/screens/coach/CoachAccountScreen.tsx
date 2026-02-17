import { AppBar } from "../../components/AppBar";
import { CTAButton } from "../../components/CTAButton";
import { CardInsight } from "../../components/CardInsight";
import { Award, Star, Users, TrendingUp, LogOut, Settings, User } from "lucide-react";
import { coachData } from "../../data/mockData";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { useEffect, useState } from "react";

// Cache simple para el nombre del entrenador en la pantalla de cuenta
let cachedCoachAccountFullName: string | null = null;
let cachedCoachAccountUserId: string | null = null;

export function CoachAccountScreen() {
  const { user, logout, session } = useAuth();
  const profile = coachData.profile;
  const metrics = profile.metrics;

  const hasCachedForUser =
    session?.user?.id &&
    cachedCoachAccountUserId === session.user.id &&
    cachedCoachAccountFullName;

  const [fullName, setFullName] = useState<string | null>(
    hasCachedForUser ? cachedCoachAccountFullName! : null
  );
  const [isLoadingName, setIsLoadingName] = useState(!hasCachedForUser);

  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoadingName(false);
      return;
    }

    if (
      cachedCoachAccountUserId === session.user.id &&
      cachedCoachAccountFullName
    ) {
      setFullName(cachedCoachAccountFullName);
      setIsLoadingName(false);
      return;
    }

    const fetchCoachName = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("Error Supabase cargando nombre de coach:", error);
        }

        if (!error && data?.full_name) {
          const name = data.full_name as string;
          setFullName(name);
          cachedCoachAccountFullName = name;
          cachedCoachAccountUserId = session.user.id;
        }
      } catch (e) {
        console.error("Error cargando nombre de coach (catch):", e);
      } finally {
        setIsLoadingName(false);
      }
    };

    fetchCoachName();
  }, [session]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Sesión cerrada");
    } catch (e) {
      console.error("Error al cerrar sesión:", e);
      toast.error("No se pudo cerrar sesión");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AppBar title="Mi Cuenta" />

      <div className="px-4 py-6 space-y-6">
        {/* Portfolio del entrenador */}
        <div className="bg-white rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white">
              <span className="text-[28px] font-bold">
                {(fullName || profile.name).charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              {isLoadingName && !fullName ? (
                <div className="h-6 w-40 rounded-lg bg-gray-200 animate-pulse mb-1" />
              ) : (
                <h2 className="mb-1">{fullName || profile.name}</h2>
              )}
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-warning text-warning" />
                <span className="text-[14px] font-semibold text-gray-900">4.9</span>
                <span className="text-[14px] text-gray-600 ml-1">Entrenador destacado</span>
              </div>
            </div>
          </div>

          {/* Bio */}
          <p className="text-[15px] text-gray-700 mb-4">{profile.bio}</p>

          {/* Especialidades */}
          <div className="mb-4">
            <p className="text-[13px] font-medium text-gray-700 mb-2">Especialidades</p>
            <div className="flex flex-wrap gap-2">
              {profile.specialties.map((specialty, index) => (
                <span
                  key={index}
                  className="inline-block px-3 py-1 bg-primary/10 text-primary text-[13px] font-medium rounded-lg"
                >
                  {specialty}
                </span>
              ))}
            </div>
          </div>

          {/* Certificaciones */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-gray-600" />
              <p className="text-[13px] font-medium text-gray-700">Certificaciones</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.certifications.map((cert, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-[12px] rounded-md"
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Métricas del entrenador */}
        <div>
          <h3 className="mb-3">Mis métricas</h3>
          <div className="grid grid-cols-3 gap-3">
            <CardInsight
              title="Retención"
              value={metrics.retention}
              unit="%"
              trend="up"
              icon={TrendingUp}
            />
            <CardInsight
              title="NPS"
              value={metrics.nps}
              trend="up"
              icon={Star}
            />
            <CardInsight
              title="Clientes"
              value={metrics.activeClients}
              icon={Users}
            />
          </div>
        </div>

        {/* Insights propios */}
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-4 border border-primary/20">
          <h4 className="mb-2 text-primary">🎉 Excelente desempeño</h4>
          <p className="text-[14px] text-gray-700">
            Tu tasa de retención está 12% por encima del promedio del gimnasio. 
            Tus clientes valoran tu compromiso y seguimiento personalizado.
          </p>
        </div>

        {/* Datos personales */}
        <div className="bg-white rounded-2xl p-4 border border-border">
          <button className="w-full flex items-center gap-3 py-3 hover:bg-gray-50 rounded-lg transition-colors">
            <User className="w-5 h-5 text-gray-600" />
            <span className="flex-1 text-left font-medium text-gray-900">
              Datos personales
            </span>
          </button>
          <button className="w-full flex items-center gap-3 py-3 hover:bg-gray-50 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-gray-600" />
            <span className="flex-1 text-left font-medium text-gray-900">
              Configuración
            </span>
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
