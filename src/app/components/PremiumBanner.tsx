import { Crown, Sparkles, TrendingUp, Utensils, Activity } from "lucide-react";

interface PremiumBannerProps {
  onUpgrade: () => void;
}

export function PremiumBanner({ onUpgrade }: PremiumBannerProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary via-purple-700 to-accent rounded-2xl p-6 border-2 border-accent/30">
      {/* Decoración de fondo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />
      
      <div className="relative">
        {/* Header con icono */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-warning/20 backdrop-blur-sm flex items-center justify-center">
            <Crown className="w-5 h-5 text-warning" />
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-warning" />
            <span className="text-[13px] font-bold text-warning uppercase tracking-wide">
              Premium
            </span>
          </div>
        </div>

        {/* Título */}
        <h3 className="text-white mb-2">
          Desbloquea tu máximo potencial
        </h3>
        
        {/* Beneficios */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-white/90 text-[13px]">
            <TrendingUp className="w-4 h-4 flex-shrink-0" />
            <span>Métricas avanzadas y análisis detallado</span>
          </div>
          <div className="flex items-center gap-2 text-white/90 text-[13px]">
            <Activity className="w-4 h-4 flex-shrink-0" />
            <span>Ejercicios 100% personalizados</span>
          </div>
          <div className="flex items-center gap-2 text-white/90 text-[13px]">
            <Utensils className="w-4 h-4 flex-shrink-0" />
            <span>Promos en Nutrición y Kinesiología</span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onUpgrade}
          className="w-full h-11 bg-white text-primary font-semibold rounded-xl hover:bg-white/95 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Crown className="w-4 h-4" />
          Actualizar a Premium
        </button>
      </div>
    </div>
  );
}
