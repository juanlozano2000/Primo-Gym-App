import { useState } from "react";
import { AppBar } from "../../components/AppBar";
import { CTAButton } from "../../components/CTAButton";
import { Plus, Trash2, Edit3, ChevronDown, ChevronUp, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { PlanBasicInfo } from "./CreatePlanScreen";
import { WorkoutData } from "./AddWorkoutsScreen";
import { ExercisePreviewModal } from "../../components/ExercisePreviewModal";

interface AddExercisesScreenProps {
  onBack: () => void;
  onFinish: (exercises: WorkoutExercises[]) => void;
  planData: PlanBasicInfo;
  workouts: WorkoutData[];
}

export interface SeriesData {
  reps?: string;
  weight?: string;
  time?: string;
  rir?: string;
}

export interface ExerciseData {
  id: string;
  name: string;
  totalSets: number;
  seriesData: SeriesData[];
  rest: string;
  notes: string;
}

export interface WorkoutExercises {
  workoutId: string;
  exercises: ExerciseData[];
}

export function AddExercisesScreen({ 
  onBack, 
  onFinish, 
  planData, 
  workouts 
}: AddExercisesScreenProps) {
  const [currentWorkoutIndex, setCurrentWorkoutIndex] = useState(0);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercises[]>(
    workouts.map(w => ({ workoutId: w.id, exercises: [] }))
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal preview state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedExercisePreview, setSelectedExercisePreview] = useState<ExerciseData | null>(null);
  
  // Form state - Nuevo sistema
  const [exerciseName, setExerciseName] = useState("");
  const [totalSets, setTotalSets] = useState(3);
  const [seriesData, setSeriesData] = useState<SeriesData[]>([{}, {}, {}]);
  const [rest, setRest] = useState("60");
  const [notes, setNotes] = useState("");

  const currentWorkout = workouts[currentWorkoutIndex];
  const currentExercises = workoutExercises.find(we => we.workoutId === currentWorkout.id)?.exercises || [];

  const handleSetsChange = (sets: number) => {
    setTotalSets(sets);
    // Crear array de series con datos existentes o vacíos
    const newSeriesData = Array.from({ length: sets }, (_, i) => 
      seriesData[i] || {}
    );
    setSeriesData(newSeriesData);
  };

  const handleSeriesChange = (index: number, field: keyof SeriesData, value: string) => {
    const newSeriesData = [...seriesData];
    newSeriesData[index] = {
      ...newSeriesData[index],
      [field]: value || undefined
    };
    setSeriesData(newSeriesData);
  };

  const handleAddExercise = () => {
    if (!exerciseName.trim()) {
      toast.error("Ingresá el nombre del ejercicio");
      return;
    }

    if (totalSets < 1) {
      toast.error("Seleccioná al menos 1 serie");
      return;
    }

    const exercise: ExerciseData = {
      id: editingId || Date.now().toString(),
      name: exerciseName,
      totalSets,
      seriesData,
      rest: rest + "s",
      notes,
    };

    setWorkoutExercises(prev => prev.map(we => {
      if (we.workoutId === currentWorkout.id) {
        if (editingId) {
          return { ...we, exercises: we.exercises.map(e => e.id === editingId ? exercise : e) };
        } else {
          return { ...we, exercises: [...we.exercises, exercise] };
        }
      }
      return we;
    }));

    toast.success(editingId ? "Ejercicio actualizado" : "Ejercicio agregado");
    resetForm();
  };

  const resetForm = () => {
    setExerciseName("");
    setTotalSets(3);
    setSeriesData([{}, {}, {}]);
    setRest("60");
    setNotes("");
    setShowAddForm(false);
    setEditingId(null);
    setShowExerciseLibrary(false);
    setSearchQuery("");
  };

  const handleEditExercise = (exercise: ExerciseData) => {
    setExerciseName(exercise.name);
    setTotalSets(exercise.totalSets);
    setSeriesData(exercise.seriesData);
    setRest(exercise.rest.replace("s", ""));
    setNotes(exercise.notes);
    setEditingId(exercise.id);
    setShowAddForm(true);
  };

  const handleDeleteExercise = (id: string) => {
    setWorkoutExercises(prev => prev.map(we => {
      if (we.workoutId === currentWorkout.id) {
        return { ...we, exercises: we.exercises.filter(e => e.id !== id) };
      }
      return we;
    }));
    toast.success("Ejercicio eliminado");
  };

  const handleNextWorkout = () => {
    if (currentExercises.length === 0) {
      toast.error("Agregá al menos un ejercicio a este workout");
      return;
    }

    if (currentWorkoutIndex < workouts.length - 1) {
      setCurrentWorkoutIndex(currentWorkoutIndex + 1);
      resetForm();
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    // Validar que todos los workouts tengan ejercicios
    const emptyWorkouts = workoutExercises.filter(we => we.exercises.length === 0);
    if (emptyWorkouts.length > 0) {
      toast.error("Todos los workouts deben tener al menos un ejercicio");
      return;
    }

    onFinish(workoutExercises);
  };

  const exerciseLibrary = [
    { category: "Pecho", exercises: ["Press Banca", "Press Inclinado", "Aperturas", "Fondos", "Press con Mancuernas"] },
    { category: "Espalda", exercises: ["Dominadas", "Remo con Barra", "Peso Muerto", "Jalón al Pecho", "Remo con Mancuerna"] },
    { category: "Piernas", exercises: ["Sentadilla", "Prensa", "Peso Muerto Rumano", "Extensiones", "Curl Femoral", "Pantorrillas"] },
    { category: "Hombros", exercises: ["Press Militar", "Elevaciones Laterales", "Face Pulls", "Press Arnold"] },
    { category: "Brazos", exercises: ["Curl con Barra", "Curl Martillo", "Extensiones de Tríceps", "Fondos", "Curl Concentrado"] },
    { category: "Core", exercises: ["Plancha", "Abdominales", "Elevación de Piernas", "Russian Twist", "Dead Bug"] },
  ];

  const filteredLibrary = exerciseLibrary.map(cat => ({
    ...cat,
    exercises: cat.exercises.filter(ex => 
      ex.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.exercises.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <AppBar title="Agregar Ejercicios" onBack={onBack} />

      <div className="px-4 py-6 space-y-6">
        {/* Paso actual */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-primary rounded-full" />
          <div className="flex-1 h-1 bg-primary rounded-full" />
          <div className="flex-1 h-1 bg-primary rounded-full" />
        </div>
        
        <div>
          <p className="text-[13px] text-gray-600 mb-1">Paso 3 de 3 - Workout {currentWorkoutIndex + 1}/{workouts.length}</p>
          <h2 className="text-[20px] font-semibold">{currentWorkout.name}</h2>
          {currentWorkout.description && (
            <p className="text-[14px] text-gray-600">{currentWorkout.description}</p>
          )}
        </div>

        {/* Navegación entre workouts */}
        {workouts.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {workouts.map((workout, idx) => {
              const exerciseCount = workoutExercises.find(we => we.workoutId === workout.id)?.exercises.length || 0;
              return (
                <button
                  key={workout.id}
                  onClick={() => {
                    setCurrentWorkoutIndex(idx);
                    resetForm();
                  }}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl border-2 transition-all ${
                    idx === currentWorkoutIndex
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : exerciseCount > 0
                      ? "border-success/30 bg-success/5 text-gray-700"
                      : "border-gray-200 bg-white text-gray-600"
                  }`}
                >
                  <div className="text-[13px]">{workout.name}</div>
                  <div className="text-[11px] opacity-75">{exerciseCount} ejercicios</div>
                </button>
              );
            })}
          </div>
        )}

        {/* Librería de ejercicios */}
        {showExerciseLibrary ? (
          <div className="bg-white rounded-2xl p-4 border-2 border-primary space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Librería de ejercicios</h4>
              <button
                onClick={() => setShowExerciseLibrary(false)}
                className="text-gray-500"
              >
                ✕
              </button>
            </div>

            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar ejercicio..."
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Lista de ejercicios por categoría */}
            <div className="max-h-80 overflow-y-auto space-y-3">
              {filteredLibrary.map((category) => (
                <div key={category.category}>
                  <h5 className="text-[13px] font-medium text-gray-700 mb-2">{category.category}</h5>
                  <div className="space-y-1">
                    {category.exercises.map((exercise) => (
                      <button
                        key={exercise}
                        onClick={() => {
                          setExerciseName(exercise);
                          setShowExerciseLibrary(false);
                          setShowAddForm(true);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-[14px]"
                      >
                        {exercise}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Formulario para agregar/editar ejercicio - NUEVO DISEÑO */}
        {showAddForm && !showExerciseLibrary && (
          <div className="bg-white rounded-2xl p-4 border-2 border-primary space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{editingId ? "Editar ejercicio" : "Nuevo ejercicio"}</h4>
              <button
                onClick={resetForm}
                className="text-gray-500 w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Nombre del ejercicio */}
            <div>
              <label className="block text-[13px] mb-2 text-gray-700 font-medium">
                Nombre del ejercicio *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  placeholder="Ej: Press Banca"
                  className="flex-1 h-11 px-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  onClick={() => setShowExerciseLibrary(true)}
                  className="px-4 h-11 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-[13px] font-medium"
                >
                  Librería
                </button>
              </div>
            </div>

            {/* Cantidad de series y descanso */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] mb-2 text-gray-700 font-medium">
                  Cantidad de series *
                </label>
                <input
                  type="number"
                  value={totalSets}
                  onChange={(e) => handleSetsChange(parseInt(e.target.value) || 1)}
                  min="1"
                  max="8"
                  className="w-full h-11 px-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-center font-semibold text-[15px]"
                />
              </div>

              <div>
                <label className="block text-[13px] mb-2 text-gray-700 font-medium">
                  Descanso entre series
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={rest}
                    onChange={(e) => setRest(e.target.value)}
                    min="0"
                    max="600"
                    step="15"
                    className="w-full h-11 px-3 pr-12 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-center font-semibold text-[15px]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-gray-500 font-medium">seg</span>
                </div>
              </div>
            </div>

            {/* Configuración por serie */}
            {totalSets > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] text-gray-700 font-medium">
                    Configuración por serie
                  </label>
                  <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Todos los campos son opcionales
                  </span>
                </div>
                
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {seriesData.map((serie, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-[13px] flex-shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-[13px] text-gray-600 font-medium">Serie {index + 1}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[11px] text-gray-600 mb-1 font-medium">Repeticiones</label>
                          <input
                            type="text"
                            value={serie.reps || ""}
                            onChange={(e) => handleSeriesChange(index, "reps", e.target.value)}
                            placeholder="10"
                            className="w-full h-10 px-3 rounded-lg bg-white border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-center text-[14px]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-gray-600 mb-1 font-medium">Peso (kg)</label>
                          <input
                            type="text"
                            value={serie.weight || ""}
                            onChange={(e) => handleSeriesChange(index, "weight", e.target.value)}
                            placeholder="50"
                            className="w-full h-10 px-3 rounded-lg bg-white border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-center text-[14px]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-gray-600 mb-1 font-medium">Tiempo (seg)</label>
                          <input
                            type="text"
                            value={serie.time || ""}
                            onChange={(e) => handleSeriesChange(index, "time", e.target.value)}
                            placeholder="30"
                            className="w-full h-10 px-3 rounded-lg bg-white border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-center text-[14px]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-gray-600 mb-1 font-medium">RIR</label>
                          <input
                            type="text"
                            value={serie.rir || ""}
                            onChange={(e) => handleSeriesChange(index, "rir", e.target.value)}
                            placeholder="2"
                            className="w-full h-10 px-3 rounded-lg bg-white border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-center text-[14px]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notas */}
            <div>
              <label className="block text-[13px] mb-2 text-gray-700 font-medium">
                Notas (opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Enfocarse en la técnica"
                className="w-full h-11 px-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <CTAButton
              variant="primary"
              size="small"
              fullWidth
              onClick={handleAddExercise}
            >
              {editingId ? "Guardar cambios" : "Agregar ejercicio"}
            </CTAButton>
          </div>
        )}

        {/* Lista de ejercicios */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3>Ejercicios ({currentExercises.length})</h3>
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

          <div className="space-y-2">
            {currentExercises.length > 0 ? (
              currentExercises.map((exercise, idx) => {
                // Construir resumen de las series
                const seriesSummary = exercise.seriesData
                  .map((s, i) => {
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
                    className="bg-white rounded-xl p-3 border border-border"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 text-gray-700 font-semibold text-[13px] flex-shrink-0">
                        {idx + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-[15px] mb-1">{exercise.name}</h4>
                        <div className="flex items-center gap-2 text-[13px] text-gray-600 mb-1">
                          <span className="font-medium text-primary">{exercise.totalSets} series</span>
                          <span>·</span>
                          <span>{exercise.rest} descanso</span>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                          {seriesSummary}
                        </p>
                        {exercise.notes && (
                          <p className="text-[12px] text-gray-500 mt-1.5 italic">{exercise.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            setSelectedExercisePreview(exercise);
                            setPreviewModalOpen(true);
                          }}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-accent transition-colors"
                          title="Ver demo"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditExercise(exercise)}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-primary transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExercise(exercise.id)}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-error transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-gray-100 rounded-xl p-8 text-center">
                <p className="text-[14px] text-gray-600 mb-1">
                  Todavía no agregaste ejercicios
                </p>
                <p className="text-[13px] text-gray-500">
                  Comenzá agregando desde cero o usando la librería
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botones de navegación fijos */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-white border-t border-border">
        <CTAButton
          variant="primary"
          size="large"
          fullWidth
          onClick={handleNextWorkout}
          disabled={currentExercises.length === 0}
        >
          {currentWorkoutIndex < workouts.length - 1
            ? `Siguiente workout (${currentWorkoutIndex + 2}/${workouts.length})`
            : "Finalizar plan"}
        </CTAButton>
      </div>

      {/* Modal de preview de ejercicio */}
      {selectedExercisePreview && (
        <ExercisePreviewModal
          isOpen={previewModalOpen}
          onClose={() => {
            setPreviewModalOpen(false);
            setSelectedExercisePreview(null);
          }}
          exerciseName={selectedExercisePreview.name}
          sets={selectedExercisePreview.totalSets}
          reps={selectedExercisePreview.seriesData.map(s => s.reps || '-').join(', ')}
          notes={selectedExercisePreview.notes}
        />
      )}
    </div>
  );
}