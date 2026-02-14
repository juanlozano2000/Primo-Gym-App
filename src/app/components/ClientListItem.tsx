import { ChevronRight, AlertCircle } from "lucide-react";

interface ClientListItemProps {
  name: string;
  lastActivity: string;
  adherence: number;
  hasAlert?: boolean;
  alertMessage?: string;
  avatarUrl?: string;
  plan: "Basic" | "Premium";
  onClick?: () => void;
}

export function ClientListItem({
  name,
  lastActivity,
  adherence,
  hasAlert,
  alertMessage,
  avatarUrl,
  plan,
  onClick,
}: ClientListItemProps) {
  const adherenceColor =
    adherence >= 80
      ? "text-success"
      : adherence >= 60
      ? "text-warning"
      : "text-error";
  
  return (
    <button
      onClick={onClick}
      className="w-full p-4 rounded-xl bg-white border border-border hover:border-gray-300 active:scale-[0.98] transition-all text-left relative"
    >
      {/* Badge del plan */}
      <div className="absolute top-3 right-3">
        {plan === "Premium" ? (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-[11px] font-bold text-white">P</span>
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-[11px] font-bold text-gray-700">B</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pr-8">{/* Added pr-8 for badge space */}
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[18px] font-semibold text-gray-700">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold truncate">{name}</h4>
            {hasAlert && (
              <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />
            )}
          </div>
          
          <div className="flex items-center gap-3 text-[14px]">
            <span className="text-gray-600">{lastActivity}</span>
            <span className={`font-medium ${adherenceColor}`}>
              {adherence}% adherencia
            </span>
          </div>
          
          {hasAlert && alertMessage && (
            <p className="text-[13px] text-warning mt-1 truncate">
              {alertMessage}
            </p>
          )}
        </div>
        
        {/* Chevron */}
        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </div>
    </button>
  );
}