import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { CTAButton } from "./CTAButton";
import { toast } from "sonner";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
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

  // Estado para nuevo ejercicio
  const [newExercise, setNewExercise] = useState({
    name: "",
    sets: 3,
    reps: "10-12",
    rest: "60s",
  });

  const handleAddExercise = () => {
    if (!newExercise.name.trim()) {
      toast.error("Ingresá el nombre del ejercicio");
      return;
    }

    const exercise: Exercise = {
      id: Date.now().toString(),
      ...newExercise,
    };

    setExercises([...exercises, exercise]);
    setNewExercise({ name: "", sets: 3, reps: "10-12", rest: "60s" });
    toast.success("Ejercicio agregado");
  };

  const handleRemoveExercise = (id: string) => {
    setExercises(exercises.filter((e) => e.id !== id));
    toast.success("Ejercicio eliminado");
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setWeeks(8);
    setDays(4);
    setExercises([]);
    setNewExercise({ name: "", sets: 3, reps: "10-12", rest: "60s" });
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

    // Reset form después de guardar
    resetForm();
  };

  const handleCancel = () => {
    // Al cancelar o cerrar, se limpian los datos
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex items-start justify-center overflow-y-auto">
      <div className="bg-white w-full sm:max-w-md min-h-screen sm:min-h-0 sm:my-6 sm:rounded-2xl flex flex-col animate-in slide-in-from-bottom sm:slide-in-from-bottom-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">Crear Template</h3>
          <button
            onClick={handleCancel}
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

          {/* Agregar ejercicio */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h4 className="text-[14px] font-medium">Agregar ejercicio</h4>
            
            <input
              type="text"
              value={newExercise.name}
              onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
              placeholder="Nombre del ejercicio"
              className="w-full h-10 px-3 rounded-lg bg-white border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-[14px]"
            />

            <div className="grid grid-cols-3 gap-2">
              <div>
                <input
                  type="number"
                  value={newExercise.sets}
                  onChange={(e) => setNewExercise({ ...newExercise, sets: parseInt(e.target.value) || 0 })}
                  placeholder="Sets"
                  className="w-full h-10 px-3 rounded-lg bg-white border border-gray-200 focus:border-primary focus:outline-none text-[14px]"
                />
                <p className="text-[11px] text-gray-500 mt-1">Sets</p>
              </div>
              <div>
                <input
                  type="text"
                  value={newExercise.reps}
                  onChange={(e) => setNewExercise({ ...newExercise, reps: e.target.value })}
                  placeholder="Reps"
                  className="w-full h-10 px-3 rounded-lg bg-white border border-gray-200 focus:border-primary focus:outline-none text-[14px]"
                />
                <p className="text-[11px] text-gray-500 mt-1">Reps</p>
              </div>
              <div>
                <input
                  type="text"
                  value={newExercise.rest}
                  onChange={(e) => setNewExercise({ ...newExercise, rest: e.target.value })}
                  placeholder="Rest"
                  className="w-full h-10 px-3 rounded-lg bg-white border border-gray-200 focus:border-primary focus:outline-none text-[14px]"
                />
                <p className="text-[11px] text-gray-500 mt-1">Descanso</p>
              </div>
            </div>

            <button
              onClick={handleAddExercise}
              className="w-full h-10 bg-gray-200 text-gray-900 rounded-lg font-medium text-[14px] hover:bg-gray-300 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
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
                {exercises.map((exercise, index) => (
                  <div
                    key={exercise.id}
                    className="bg-white border border-border rounded-xl p-3 flex items-start gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium mb-1">
                        {index + 1}. {exercise.name}
                      </p>
                      <p className="text-[12px] text-gray-600">
                        {exercise.sets} sets × {exercise.reps} reps · {exercise.rest} descanso
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveExercise(exercise.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-error transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
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
            onClick={handleCancel}
          >
            Cancelar
          </CTAButton>
        </div>
      </div>
    </div>
  );
}
