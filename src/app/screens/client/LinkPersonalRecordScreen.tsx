import { useState, useEffect } from "react";
import { AppBar } from "../../components/AppBar";
import { CTAButton } from "../../components/CTAButton";
import { useAuth } from "../../context/AuthContext";
import { clientService, PersonalRecord } from "../../services/clientService";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LinkPersonalRecordScreenProps {
  exerciseName: string;
  workoutId: string;
  currentExerciseId: string;
  onBack: () => void;
  onConfirm: (prLink: { prId: string; prName: string; prWeight: number; percentage: number; calculatedWeight: number }) => void;
}

export function LinkPersonalRecordScreen({
  exerciseName,
  workoutId,
  currentExerciseId,
  onBack,
  onConfirm,
}: LinkPersonalRecordScreenProps) {
  const { session } = useAuth();
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPRId, setSelectedPRId] = useState<string | null>(null);
  const [percentage, setPercentage] = useState(100);

  useEffect(() => {
    const loadPRs = async () => {
      if (!session?.user?.id) return;
      setIsLoading(true);
      const prs = await clientService.getPersonalRecords(session.user.id);
      setPersonalRecords(prs);
      setIsLoading(false);
    };
    loadPRs();
  }, [session?.user?.id]);

  const selectedPR = selectedPRId ? personalRecords.find((pr) => pr.id === selectedPRId) : null;
  const calculatedWeight = selectedPR ? (selectedPR.weight * percentage) / 100 : 0;

  const handleConfirm = () => {
    if (!selectedPR) {
      toast.error("Selecciona un registro personal");
      return;
    }

    onConfirm({
      prId: selectedPR.id,
      prName: selectedPR.exercise_name,
      prWeight: selectedPR.weight,
      percentage,
      calculatedWeight,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppBar title="Enlazar Record Personal" onBack={onBack} />

      {isLoading ? (
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : personalRecords.length === 0 ? (
        <div className="p-6 text-center text-gray-500 mt-10">
          <p>No tienes registros personales cargados.</p>
          <p className="text-sm mt-2">Crea uno en la sección de Records Personales primero.</p>
        </div>
      ) : (
        <div className="p-4 pb-24 max-w-2xl mx-auto">
          {/* Info del ejercicio actual */}
          <div className="bg-white rounded-2xl p-4 border border-border shadow-sm mb-6">
            <p className="text-[13px] text-gray-600 mb-1">Ejercicio actual</p>
            <p className="text-[16px] font-bold text-gray-900">{exerciseName}</p>
          </div>

          {/* Seleccionar PR */}
          <div className="mb-6">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-3">Mis Records Personales</h3>
            <div className="space-y-2">
              {personalRecords.map((pr) => (
                <button
                  key={pr.id}
                  onClick={() => setSelectedPRId(pr.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                    selectedPRId === pr.id
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 bg-white hover:border-primary/30"
                  }`}
                >
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{pr.exercise_name}</p>
                    <p className="text-[13px] text-gray-600 mt-1">
                      {pr.weight}kg • {pr.reps} reps
                    </p>
                  </div>
                  {selectedPRId === pr.id && <Check className="w-5 h-5 text-primary" />}
                </button>
              ))}
            </div>
          </div>

          {/* Slider de porcentaje */}
          {selectedPR && (
            <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
              <div className="mb-6">
                <label className="text-[13px] font-semibold text-gray-600 mb-3 block">
                  Porcentaje del Record Personal
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={percentage}
                    onChange={(e) => setPercentage(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-[16px] font-bold text-primary w-12 text-right">{percentage}%</span>
                </div>
              </div>

              {/* Peso calculado */}
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 text-center">
                <p className="text-[13px] text-gray-600 mb-1">Peso calculado</p>
                <p className="text-[28px] font-bold text-primary">{calculatedWeight.toFixed(2)}kg</p>
                <p className="text-[12px] text-gray-600 mt-2">
                  {selectedPR.weight}kg × {percentage}% = {calculatedWeight.toFixed(2)}kg
                </p>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 max-w-2xl mx-auto">
            <div className="flex gap-3">
              <CTAButton variant="outline" fullWidth onClick={onBack}>
                Cancelar
              </CTAButton>
              <CTAButton
                variant="primary"
                fullWidth
                onClick={handleConfirm}
                disabled={!selectedPR}
              >
                Confirmar
              </CTAButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
