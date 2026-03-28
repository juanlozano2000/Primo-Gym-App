import { useState } from "react";
import { toast } from "sonner";

import { AppBar } from "../../components/AppBar";
import { CTAButton } from "../../components/CTAButton";

interface AddPersonalRecordScreenProps {
  onBack: () => void;
  onSaved: () => void;
}

export function AddPersonalRecordScreen({ onBack, onSaved }: AddPersonalRecordScreenProps) {
  const [exerciseName, setExerciseName] = useState("");
  const [exerciseWeight, setExerciseWeight] = useState("");
  const [exerciseReps, setExerciseReps] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveRecord = () => {
    if (!exerciseName.trim() || !exerciseWeight.trim() || !exerciseReps.trim()) {
      toast.error("Completá todos los campos");
      return;
    }

    const weight = parseFloat(exerciseWeight);
    const reps = parseInt(exerciseReps, 10);

    if (isNaN(weight) || weight <= 0) {
      toast.error("Ingresá un peso válido");
      return;
    }

    if (isNaN(reps) || reps <= 0) {
      toast.error("Ingresá repeticiones válidas");
      return;
    }

    setIsSaving(true);

    const oneRM = weight * (1 + reps / 30);
    const roundedOneRM = Math.round(oneRM * 10) / 10;

    const newPR = {
      exercise: exerciseName.trim(),
      weight,
      reps,
      oneRM: roundedOneRM,
      value: `${roundedOneRM}kg`,
      date: new Date().toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    };

    const savedPRs = localStorage.getItem("personalRecords");
    const currentPRs = savedPRs ? JSON.parse(savedPRs) : [];
    const updatedPRs = [...currentPRs, newPR];

    localStorage.setItem("personalRecords", JSON.stringify(updatedPRs));

    setIsSaving(false);
    toast.success("Récord agregado correctamente");
    onSaved();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AppBar title="Agregar récord personal" onBack={onBack} />

      <div className="px-4 py-6 space-y-5">
        <div className="bg-white rounded-2xl p-4 border border-border shadow-sm space-y-4">
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-2">Ejercicio</label>
            <input
              type="text"
              placeholder="Ej: Press de banca"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              className="w-full h-12 px-4 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-[15px]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-2">Peso levantado</label>
            <div className="relative">
              <input
                type="number"
                placeholder="80"
                value={exerciseWeight}
                onChange={(e) => setExerciseWeight(e.target.value)}
                className="w-full h-12 px-4 pr-12 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-[15px]"
                step="0.5"
                min="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-[15px] font-medium">kg</span>
            </div>
          </div>

          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-2">Repeticiones</label>
            <input
              type="number"
              placeholder="8"
              value={exerciseReps}
              onChange={(e) => setExerciseReps(e.target.value)}
              className="w-full h-12 px-4 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-[15px]"
              min="1"
              step="1"
            />
          </div>

          <div className="bg-gray-50 rounded-xl p-3 border border-border">
            <p className="text-[12px] text-gray-600">
              1RM estimado con Epley: <strong>1RM = Peso x (1 + Repeticiones / 30)</strong>
            </p>
          </div>
        </div>

        <CTAButton fullWidth onClick={handleSaveRecord} disabled={isSaving}>
          {isSaving ? "Guardando..." : "Guardar récord"}
        </CTAButton>
      </div>
    </div>
  );
}
