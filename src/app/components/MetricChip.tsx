import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricChipProps {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "success" | "warning" | "primary";
  onClick?: () => void;
}

export function MetricChip({
  label,
  value,
  trend,
  variant = "default",
  onClick,
}: MetricChipProps) {
  const variants = {
    default: "bg-gray-100 text-gray-900",
    success: "bg-green-50 text-green-800 border border-green-200",
    warning: "bg-orange-50 text-orange-800 border border-orange-200",
    primary: "bg-purple-50 text-primary border border-purple-200",
  };
  
  const trendIcons = {
    up: <TrendingUp className="w-3.5 h-3.5 text-success" />,
    down: <TrendingDown className="w-3.5 h-3.5 text-error" />,
    neutral: <Minus className="w-3.5 h-3.5 text-gray-400" />,
  };
  
  const Component = onClick ? "button" : "div";
  
  return (
    <Component
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${variants[variant]} ${
        onClick ? "hover:opacity-80 active:scale-95 transition-all cursor-pointer" : ""
      }`}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-[12px] font-medium opacity-70">{label}</span>
        <span className="text-[16px] font-semibold">{value}</span>
      </div>
      {trend && trendIcons[trend]}
    </Component>
  );
}
