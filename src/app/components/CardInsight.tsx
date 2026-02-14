import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";

interface CardInsightProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: LucideIcon;
  onClick?: () => void;
}

export function CardInsight({
  title,
  value,
  unit,
  trend,
  trendValue,
  icon: Icon,
  onClick,
}: CardInsightProps) {
  const trendConfig = {
    up: { icon: TrendingUp, color: "text-success" },
    down: { icon: TrendingDown, color: "text-error" },
    neutral: { icon: Minus, color: "text-gray-400" },
  };
  
  const TrendIcon = trend ? trendConfig[trend].icon : null;
  const trendColor = trend ? trendConfig[trend].color : "";
  
  const Component = onClick ? "button" : "div";
  
  return (
    <Component
      onClick={onClick}
      className={`p-4 rounded-xl bg-white border border-border ${
        onClick ? "hover:border-gray-300 active:scale-[0.98] transition-all cursor-pointer" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-[14px] text-gray-600 font-medium">{title}</span>
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
            <Icon className="w-5 h-5 text-gray-700" />
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-[28px] font-bold text-gray-900">{value}</span>
          {unit && <span className="text-[16px] text-gray-600 font-medium">{unit}</span>}
        </div>
        
        {trend && TrendIcon && (
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            {trendValue && <span className="text-[14px] font-medium">{trendValue}</span>}
          </div>
        )}
      </div>
    </Component>
  );
}
