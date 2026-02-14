import { useState } from "react";
import { AppBar } from "../../components/AppBar";
import { CTAButton } from "../../components/CTAButton";
import { Plus, Trash2, GripVertical, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { PlanBasicInfo } from "./CreatePlanScreen";

interface AddWorkoutsScreenProps {
  onBack: () => void;
  onContinue: (workouts: WorkoutData[]) => void;
  planData: PlanBasicInfo;
}

export interface WorkoutData {
  id: string;
  name: string;
  description: string;
  dayNumber: number;
}

export function AddWorkoutsScreen({ onBack, onContinue, planData }: AddWorkoutsScreenProps) {
  const [workouts, setWorkouts] = useState<WorkoutData[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [workoutName, setWorkoutName] = useState("");
  const [workoutDescription, setWorkoutDescription] = useState("");
  const [selectedDay, setSelectedDay] = useState(1);

  const handleAddWorkout = () => {
    if (!workoutName.trim()) {
      toast.error("Ingresá el nombre del workout");
      return;
    }

    if (editingId) {
      // Editar workout existente
      setWorkouts(workouts.map(w => 
        w.id === editingId 
          ? { ...w, name: workoutName, description: workoutDescription, dayNumber: selectedDay }
          : w
      ));
      toast.success("Workout actualizado");
    } else {
      // Agregar nuevo workout
      const newWorkout: WorkoutData = {
        id: Date.now().toString(),
        name: workoutName,
        description: workoutDescription,
        dayNumber: selectedDay,
      };
      setWorkouts([...workouts, newWorkout]);
      toast.success("Workout agregado");
    }

    // Resetear form
    setWorkoutName("");
    setWorkoutDescription("");
    setSelectedDay(workouts.length + 1);
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleEditWorkout = (workout: WorkoutData) => {
    setWorkoutName(workout.name);
    setWorkoutDescription(workout.description);
    setSelectedDay(workout.dayNumber);
    setEditingId(workout.id);
    setShowAddForm(true);
  };

  const handleDeleteWorkout = (id: string) => {
    setWorkouts(workouts.filter(w => w.id !== id));
    toast.success("Workout eliminado");
  };

  const handleContinue = () => {
    if (workouts.length === 0) {
      toast.error("Agregá al menos un workout al plan");
      return;
    }

    onContinue(workouts);
  };

  const handleQuickAdd = (template: { name: string; desc: string }) => {
    const newWorkout: WorkoutData = {
      id: Date.now().toString(),
      name: template.name,
      description: template.desc,
      dayNumber: workouts.length + 1,
    };
    setWorkouts([...workouts, newWorkout]);
    toast.success("Workout agregado");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <AppBar title="Agregar Workouts" onBack={onBack} />

      <div className="px-4 py-6 space-y-6">
        {/* Paso actual */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-primary rounded-full" />
          <div className="flex-1 h-1 bg-primary rounded-full" />
          <div className="flex-1 h-1 bg-gray-200 rounded-full" />
        </div>
        
        <div>
          <p className="text-[13px] text-gray-600 mb-1">Paso 2 de 3</p>
          <h2 className="text-[20px] font-semibold">{planData.name}</h2>
          <p className="text-[14px] text-gray-600">
            {planData.daysPerWeek} días por semana · {planData.durationWeeks} semanas
          </p>
        </div>

        {/* Lista de workouts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3>Workouts del plan ({workouts.length}/{planData.daysPerWeek})</h3>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1 text-[14px] text-primary font-medium"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            )}
          </div>

          {/* Formulario para agregar/editar workout */}
          {showAddForm && (
            <div className="bg-white rounded-2xl p-4 border-2 border-primary mb-3 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{editingId ? "Editar workout" : "Nuevo workout"}</h4>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingId(null);
                    setWorkoutName("");
                    setWorkoutDescription("");
                  }}
                  className="text-gray-500"
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="block text-[13px] mb-2 text-gray-700 font-medium">
                  Nombre del workout *
                </label>
                <input
                  type="text"
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  placeholder="Ej: Pecho y Tríceps"
                  className="w-full h-11 px-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-[13px] mb-2 text-gray-700 font-medium">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={workoutDescription}
                  onChange={(e) => setWorkoutDescription(e.target.value)}
                  placeholder="Grupos musculares o enfoque"
                  className="w-full h-11 px-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-[13px] mb-2 text-gray-700 font-medium">
                  Día de la semana
                </label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                  className="w-full h-11 px-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  {Array.from({ length: planData.daysPerWeek }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Día {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <CTAButton
                variant="primary"
                size="small"
                fullWidth
                onClick={handleAddWorkout}
              >
                {editingId ? "Guardar cambios" : "Agregar workout"}
              </CTAButton>
            </div>
          )}

          {/* Lista de workouts agregados */}
          <div className="space-y-3">
            {workouts.length > 0 ? (
              workouts
                .sort((a, b) => a.dayNumber - b.dayNumber)
                .map((workout) => (
                  <div
                    key={workout.id}
                    className="bg-white rounded-xl p-4 border border-border"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-semibold text-[14px] flex-shrink-0">
                        D{workout.dayNumber}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium mb-1">{workout.name}</h4>
                        {workout.description && (
                          <p className="text-[13px] text-gray-600">{workout.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleEditWorkout(workout)}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-primary transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteWorkout(workout.id)}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-error transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="bg-gray-100 rounded-xl p-8 text-center">
                <p className="text-[14px] text-gray-600 mb-1">
                  Todavía no agregaste ningún workout
                </p>
                <p className="text-[13px] text-gray-500">
                  Usá los templates o creá uno desde cero
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Templates rápidos */}
        {workouts.length < planData.daysPerWeek && !showAddForm && (
          <div>
            <h3 className="mb-3">Templates rápidos</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: "Pecho y Tríceps", desc: "Press + extensiones" },
                { name: "Espalda y Bíceps", desc: "Jalones + remos" },
                { name: "Piernas", desc: "Sentadilla + accesorios" },
                { name: "Hombros y Core", desc: "Press + abdominales" },
                { name: "Full Body", desc: "Cuerpo completo" },
                { name: "Upper Body", desc: "Tren superior" },
              ].map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAdd(template)}
                  className="bg-white rounded-xl p-3 border border-border text-left hover:border-primary hover:bg-primary/5 transition-all active:scale-[0.98]"
                >
                  <h4 className="text-[13px] font-medium mb-1">{template.name}</h4>
                  <p className="text-[12px] text-gray-600">{template.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Botones de navegación fijos */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-white border-t border-border space-y-2">
        <CTAButton
          variant="primary"
          size="large"
          fullWidth
          onClick={handleContinue}
          disabled={workouts.length === 0}
        >
          Continuar ({workouts.length} workouts)
        </CTAButton>
      </div>
    </div>
  );
}
