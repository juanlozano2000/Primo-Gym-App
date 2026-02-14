import { X } from "lucide-react";
import { useEffect } from "react";

interface ExercisePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName?: string;
  exerciseGif?: string;
  sets?: number;
  reps?: string;
  notes?: string;
  exercise?: any;
}

export function ExercisePreviewModal({
  isOpen,
  onClose,
  exerciseName,
  exerciseGif,
  sets,
  reps,
  notes,
  exercise,
}: ExercisePreviewModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Usar los datos del ejercicio si están disponibles
  const name = exercise?.name || exerciseName || "Ejercicio";
  const exerciseSets = exercise?.sets || sets;
  const exerciseReps = exercise?.reps || exercise?.time || reps;
  const exerciseNotes = exercise?.notes || notes;

  // Placeholder GIF - en producción estos serían GIFs reales de cada ejercicio
  const defaultGif = exerciseGif || "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border px-4 py-3 flex items-center justify-between rounded-t-2xl">
          <h3 className="font-semibold">{name}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GIF del ejercicio */}
        <div className="p-4 space-y-4">
          <div className="relative w-full aspect-video bg-gray-100 rounded-xl overflow-hidden">
            <img
              src={defaultGif}
              alt={name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-white text-[11px] font-medium">
              Demo
            </div>
          </div>

          {/* Información del ejercicio */}
          {(exerciseSets || exerciseReps) && (
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <h4 className="text-[13px] font-medium text-gray-700">Configuración</h4>
              <div className="flex items-center gap-4 text-[14px]">
                {exerciseSets && (
                  <div>
                    <span className="text-gray-600">Series: </span>
                    <span className="font-semibold text-primary">{exerciseSets}</span>
                  </div>
                )}
                {exerciseReps && (
                  <div>
                    <span className="text-gray-600">Reps: </span>
                    <span className="font-semibold text-primary">{exerciseReps}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notas */}
          {exerciseNotes && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <h4 className="text-[13px] font-medium text-blue-900 mb-1">Notas</h4>
              <p className="text-[13px] text-blue-800">{exerciseNotes}</p>
            </div>
          )}

          {/* Consejos generales */}
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-3">
            <h4 className="text-[13px] font-medium text-gray-900 mb-2">💡 Consejos</h4>
            <ul className="text-[12px] text-gray-700 space-y-1">
              <li>• Mantené la técnica correcta en todo momento</li>
              <li>• Controlá la respiración durante el ejercicio</li>
              <li>• Ajustá el peso según tu nivel</li>
            </ul>
          </div>

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="w-full h-12 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors active:scale-[0.98]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}