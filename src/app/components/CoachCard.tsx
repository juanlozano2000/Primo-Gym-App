import { Star, Award } from "lucide-react";

interface CoachCardProps {
  name: string;
  rating: number;
  specialty: string;
  certifications?: string[];
  avatarUrl?: string;
  onChangeCoach?: () => void;
}

export function CoachCard({
  name,
  rating,
  specialty,
  certifications = [],
  avatarUrl,
  onChangeCoach,
}: CoachCardProps) {
  return (
    <div className="p-4 rounded-xl bg-white border border-border">
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[24px] font-bold text-gray-700">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="mb-1">{name}</h3>
          
          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-4 h-4 fill-warning text-warning" />
            <span className="text-[15px] font-semibold text-gray-900">{rating.toFixed(1)}</span>
          </div>
          
          {/* Especialidad */}
          <p className="text-[14px] text-gray-600">{specialty}</p>
        </div>
      </div>
      
      {/* Certificaciones */}
      {certifications.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-gray-600" />
            <span className="text-[13px] font-medium text-gray-700">Certificaciones</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {certifications.map((cert, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-[12px] rounded-md"
              >
                {cert}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Botón cambiar profesor */}
      {onChangeCoach && (
        <button
          onClick={onChangeCoach}
          className="w-full h-11 px-4 rounded-lg bg-gray-100 text-gray-900 font-medium hover:bg-gray-200 active:bg-gray-300 transition-colors"
        >
          Cambiar profesor
        </button>
      )}
    </div>
  );
}
