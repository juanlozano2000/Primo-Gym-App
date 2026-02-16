import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { CTAButton } from "./CTAButton";
import { toast } from "sonner";

interface SeriesData {
  reps: string;
  weight: string;
  time?: string;
  rir?: string;
}

interface Exercise {
  id: string;
  name: string;
  totalSets: number;
  seriesData: SeriesData[];
  rest: string;
}

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: {
    name: string;
    description: string;
    weeks: number;
    days: number;
    exercises: Exercise[];
  }) => void;
}

export function CreateTemplateModal({ isOpen, onClose, onSave }: CreateTemplateModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [weeks, setWeeks] = useState<number>(8);
  const [days, setDays] = useState<number>(4);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // Estado para nuevo ejercicio - NUEVO SISTEMA
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newTotalSets, setNewTotalSets] = useState(3);
  const [newSeriesData, setNewSeriesData] = useState<SeriesData[]>([
    { reps: "", weight: "" },
    { reps: "", weight: "" },
    { reps: "", weight: "" },
  ]);
  const [newRest, setNewRest] = useState("60");

  const handleSetsChange = (sets: number) => {
    setNewTotalSets(sets);
    const newData = Array.from({ length: sets }, (_, i) => 
      newSeriesData[i] || { reps: "", weight: "" }
    );
    setNewSeriesData(newData);
  };

  const handleSeriesChange = (index: number, field: keyof SeriesData, value: string) => {
    const newData = [...newSeriesData];
    newData[index] = {
      ...newData[index],
      [field]: value
    };
    setNewSeriesData(newData);
  };

  const handleAddExercise = () => {
    if (!newExerciseName.trim()) {
      toast.error("Ingresá el nombre del ejercicio");
      return;
    }

    if (newTotalSets < 1) {
      toast.error("Seleccioná al menos 1 serie");
      return;
    }

    const exercise: Exercise = {
      id: Date.now().toString(),
      name: newExerciseName,
      totalSets: newTotalSets,
      seriesData: newSeriesData,
      rest: newRest + "s",
    };

    setExercises([...exercises, exercise]);
    
    // Reset form
    setNewExerciseName("");
    setNewTotalSets(3);
    setNewSeriesData([
      { reps: "", weight: "" },
      { reps: "", weight: "" },
      { reps: "", weight: "" },
    ]);
    setNewRest("60");
    
    toast.success("Ejercicio agregado");
  };

  const handleRemoveExercise = (id: string) => {
    setExercises(exercises.filter((e) => e.id !== id));
    toast.success("Ejercicio eliminado");
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Ingresá el nombre del template");
      return;
    }

    if (exercises.length === 0) {
      toast.error("Agregá al menos un ejercicio");
      return;
    }

    onSave({
      name,
      description,
      weeks,
      days,
      exercises,
    });

    // Reset form
    setName("");
    setDescription("");
    setWeeks(8);
    setDays(4);
    setExercises([]);
    setNewExerciseName("");
    setNewTotalSets(3);
    setNewSeriesData([
      { reps: "", weight: "" },
      { reps: "", weight: "" },
      { reps: "", weight: "" },
    ]);
    setNewRest("60");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full h-[90vh] sm:max-w-md sm:h-auto sm:rounded-2xl flex flex-col animate-in slide-in-from-bottom sm:slide-in-from-bottom-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">Crear Template</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-[14px] mb-2 text-gray-700 font-medium">
              Nombre del template *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Plan Principiantes"
              className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-[14px] mb-2 text-gray-700 font-medium">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el objetivo del template"
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          {/* Duración */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[14px] mb-2 text-gray-700 font-medium">
                Semanas
              </label>
              <input
                type="number"
                value={weeks}
                onChange={(e) => setWeeks(parseInt(e.target.value) || 0)}
                min="1"
                max="52"
                className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-[14px] mb-2 text-gray-700 font-medium">
                Días/semana
              </label>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 0)}
                min="1"
                max="7"
                className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Agregar ejercicio - NUEVO DISEÑO */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h4 className="text-[14px] font-medium">Agregar ejercicio</h4>
            
            {/* Nombre */}
            <input
              type="text"
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
              placeholder="Nombre del ejercicio"
              className="w-full h-10 px-3 rounded-lg bg-white border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-[14px]"
            />

            {/* Series y descanso */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[12px] mb-1.5 text-gray-700 font-medium">
                  Series *
                </label>
                <input
                  type="number"
                  value={newTotalSets}
                  onChange={(e) => handleSetsChange(parseInt(e.target.value) || 1)}
                  min="1"
                  max="8"
                  className="w-full h-10 px-3 rounded-lg bg-white border border-gray-200 focus:border-primary focus:outline-none text-center font-semibold text-[14px]"
                />
              </div>
              <div>
                <label className="block text-[12px] mb-1.5 text-gray-700 font-medium">
                  Descanso (seg)
                </label>
                <input
                  type="number"
                  value={newRest}
                  onChange={(e) => setNewRest(e.target.value)}
                  min="0"
                  max="600"
                  step="15"
                  className="w-full h-10 px-3 rounded-lg bg-white border border-gray-200 focus:border-primary focus:outline-none text-center font-semibold text-[14px]"
                />
              </div>
            </div>

            {/* Configuración por serie - versión compacta para modal */}
            {newTotalSets > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] text-gray-700 font-medium">
                    Config. por serie
                  </label>
                  <span className="text-[10px] text-gray-500 bg-white px-1.5 py-0.5 rounded">
                    Opcionales
                  </span>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {newSeriesData.map((serie, index) => (
                    <div key={index} className="bg-white rounded-lg p-2.5 border border-gray-200">
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-6 h-6 rounded bg-primary text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-[11px] text-gray-600 font-medium">Serie {index + 1}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <label className="block text-[10px] text-gray-600 mb-0.5">Reps</label>
                          <input
                            type="text"
                            value={serie.reps || ""}
                            onChange={(e) => handleSeriesChange(index, "reps", e.target.value)}
                            placeholder="10"
                            className="w-full h-8 px-2 rounded bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none text-center text-[12px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-600 mb-0.5">Peso</label>
                          <input
                            type="text"
                            value={serie.weight || ""}
                            onChange={(e) => handleSeriesChange(index, "weight", e.target.value)}
                            placeholder="50"
                            className="w-full h-8 px-2 rounded bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none text-center text-[12px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-600 mb-0.5">Tiempo</label>
                          <input
                            type="text"
                            value={serie.time || ""}
                            onChange={(e) => handleSeriesChange(index, "time", e.target.value)}
                            placeholder="30"
                            className="w-full h-8 px-2 rounded bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none text-center text-[12px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-600 mb-0.5">RIR</label>
                          <input
                            type="text"
                            value={serie.rir || ""}
                            onChange={(e) => handleSeriesChange(index, "rir", e.target.value)}
                            placeholder="2"
                            className="w-full h-8 px-2 rounded bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none text-center text-[12px]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleAddExercise}
              className="w-full h-10 bg-primary text-white rounded-lg font-medium text-[14px] hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar ejercicio
            </button>
          </div>

          {/* Lista de ejercicios */}
          {exercises.length > 0 && (
            <div>
              <h4 className="text-[14px] font-medium mb-2">
                Ejercicios ({exercises.length})
              </h4>
              <div className="space-y-2">
                {exercises.map((exercise, index) => {
                  const seriesSummary = exercise.seriesData
                    .map((s) => {
                      const parts = [];
                      if (s.reps) parts.push(`${s.reps}r`);
                      if (s.weight) parts.push(`${s.weight}kg`);
                      if (s.time) parts.push(`${s.time}s`);
                      if (s.rir) parts.push(`RIR${s.rir}`);
                      return parts.length > 0 ? parts.join(' ') : '-';
                    })
                    .join(' · ');

                  return (
                    <div
                      key={exercise.id}
                      className="bg-white border border-border rounded-xl p-3 flex items-start gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium mb-1">
                          {index + 1}. {exercise.name}
                        </p>
                        <p className="text-[12px] text-gray-600 mb-0.5">
                          {exercise.totalSets} series · {exercise.rest} descanso
                        </p>
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                          {seriesSummary}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveExercise(exercise.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-error transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <CTAButton
            variant="primary"
            size="large"
            fullWidth
            onClick={handleSave}
          >
            Guardar template
          </CTAButton>
          <CTAButton
            variant="outline"
            size="large"
            fullWidth
            onClick={onClose}
          >
            Cancelar
          </CTAButton>
        </div>
      </div>
    </div>
  );
}