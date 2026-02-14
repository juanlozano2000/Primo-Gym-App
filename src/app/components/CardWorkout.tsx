import { ChevronRight, Clock, Dumbbell } from "lucide-react";

export type WorkoutStatus = "pending" | "in-progress" | "completed";

interface CardWorkoutProps {
  title: string;
  exercises: number;
  duration: string;
  status: WorkoutStatus;
  onClick?: () => void;
}

export function CardWorkout({
  title,
  exercises,
  duration,
  status,
  onClick,
}: CardWorkoutProps) {
  const statusConfig = {
    pending: {
      label: "Pendiente",
      color: "bg-gray-100 text-gray-700 border-gray-200",
      cardBg: "bg-white",
    },
    "in-progress": {
      label: "En curso",
      color: "bg-accent text-accent-foreground border-accent",
      cardBg: "bg-orange-50",
    },
    completed: {
      label: "Completado",
      color: "bg-success text-success-foreground border-success",
      cardBg: "bg-green-50",
    },
  };
  
  const config = statusConfig[status];
  
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl border ${config.cardBg} border-border hover:border-gray-300 active:scale-[0.98] transition-all text-left`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Status badge */}
          <div className={`inline-flex items-center px-2 py-1 rounded-md text-[12px] font-medium mb-2 border ${config.color}`}>
            {config.label}
          </div>
          
          {/* Título */}
          <h3 className="mb-2 truncate">{title}</h3>
          
          {/* Metadata */}
          <div className="flex items-center gap-4 text-gray-600">
            <div className="flex items-center gap-1">
              <Dumbbell className="w-4 h-4" />
              <span className="text-[14px]">{exercises} ejercicios</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span className="text-[14px]">{duration}</span>
            </div>
          </div>
        </div>
        
        {/* Chevron */}
        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}
