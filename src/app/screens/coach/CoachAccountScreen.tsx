import { AppBar } from "../../components/AppBar";
import { CTAButton } from "../../components/CTAButton";
import { CardInsight } from "../../components/CardInsight";
import { Award, Star, Users, TrendingUp, LogOut, Settings, User } from "lucide-react";
import { coachData } from "../../data/mockData";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

export function CoachAccountScreen() {
  const { user, logout } = useAuth();
  const profile = coachData.profile;
  const metrics = profile.metrics;

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada");
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
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="mb-1">{profile.name}</h2>
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
