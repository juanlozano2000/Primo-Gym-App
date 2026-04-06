import { useState, useEffect, useRef } from "react";
import { AppBar } from "../../components/AppBar";
import { CTAButton } from "../../components/CTAButton";
import { CheckCircle2, Circle, Clock, Eye, List, Loader2, Pencil, Save } from "lucide-react";
import { toast } from "sonner";
import { ExercisePreviewModal } from "../../components/ExercisePreviewModal";
import { useAuth } from "../../context/AuthContext";
import { clientService } from "../../services/clientService"; // 🚨 Importado

interface WorkoutDetailScreenProps {
  workoutId: string;
  onBack: () => void;
}

type WorkoutProgress = {
  workoutId: string;
  currentExerciseIndex: number;
  exerciseProgressById: Record<string, ExerciseProgress>;
  seriesEditsByExerciseId: Record<string, SeriesEdit[]>;
  completedExercises: string[];
  timestamp: number;
};

type ExerciseProgress = {
  completedSets: number;
  isCompleted: boolean;
};

type SeriesEdit = {
  reps: string;
  weight: string;
  rir: string;
  notes: string;
};

const WORKOUT_PROGRESS_PREFIX = "spoter_workout_progress_";

export function WorkoutDetailScreen({
  workoutId,
  onBack,
}: WorkoutDetailScreenProps) {
  const { session } = useAuth();
  
  // 🚨 Estados reales
  const [workout, setWorkout] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseProgressById, setExerciseProgressById] = useState<Record<string, ExerciseProgress>>({});
  const [seriesEditsByExerciseId, setSeriesEditsByExerciseId] = useState<Record<string, SeriesEdit[]>>({});
  const [isResting, setIsResting] = useState(false);
  const [restTimer, setRestTimer] = useState(0);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewExercise, setPreviewExercise] = useState<any>(null);
  const [isSeriesDetailModalOpen, setIsSeriesDetailModalOpen] = useState(false);
  const [isSeriesEditModalOpen, setIsSeriesEditModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<any>(null);
  const [editingSeriesDraft, setEditingSeriesDraft] = useState<SeriesEdit[]>([]);
  
  // 🚨 Nuevos estados para persistencia
  const [hasUnsavedProgress, setHasUnsavedProgress] = useState(false);
  const [showConfirmDiscardModal, setShowConfirmDiscardModal] = useState(false);
  const [showConfirmIncompleteFinishModal, setShowConfirmIncompleteFinishModal] = useState(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const restIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchWorkoutDetail = async () => {
      setIsLoading(true);
      const data = await clientService.getWorkoutDetail(workoutId);
      setWorkout(data);
      
      // 🚨 Restaurar progreso guardado del localStorage
      if (session?.user?.id) {
        const progressKey = `${WORKOUT_PROGRESS_PREFIX}${session.user.id}_${workoutId}`;
        const saved = localStorage.getItem(progressKey);
        
        if (saved) {
          try {
            const progress = JSON.parse(saved) as WorkoutProgress;
            // Solo restaurar si fue guardado hace menos de 12 horas
            if (Date.now() - progress.timestamp < 12 * 60 * 60 * 1000) {
              setCurrentExerciseIndex(progress.currentExerciseIndex);
              if (progress.exerciseProgressById) {
                setExerciseProgressById(progress.exerciseProgressById);
              } else {
                const fallbackProgress: Record<string, ExerciseProgress> = {};
                if (Array.isArray(progress.completedExercises)) {
                  progress.completedExercises.forEach((exerciseId: string) => {
                    fallbackProgress[exerciseId] = {
                      completedSets: 1,
                      isCompleted: true,
                    };
                  });
                }

                const currentExercise = data?.exerciseList?.[progress.currentExerciseIndex];
                if (currentExercise && typeof (progress as any).currentSet === "number") {
                  fallbackProgress[currentExercise.id] = {
                    completedSets: Math.max(0, (progress as any).currentSet - 1),
                    isCompleted: false,
                  };
                }

                setExerciseProgressById(fallbackProgress);
              }

              if (progress.seriesEditsByExerciseId) {
                setSeriesEditsByExerciseId(progress.seriesEditsByExerciseId);
              }
              toast.success("Progreso anterior restaurado ✓", { duration: 3000 });
            } else {
              localStorage.removeItem(progressKey);
            }
          } catch (e) {
            console.warn("[Workout] Progreso guardado corrupto, ignorando.");
          }
        }
      }
      
      setIsLoading(false);
    };

    if (workoutId) fetchWorkoutDetail();
  }, [workoutId, session?.user?.id]);

  // 🚨 Efecto: Limpiar interval al desmontar o cambiar de ejercicio
  useEffect(() => {
    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
      }
    };
  }, []);

  // 🚨 Efecto: Resetear serie actual cuando cambias de ejercicio
  useEffect(() => {
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
      restIntervalRef.current = null;
    }
    setIsResting(false);
    setRestTimer(0);
  }, [currentExerciseIndex]);

  // 🚨 Efecto: Guardar progreso automáticamente
  useEffect(() => {
    if (!session?.user?.id || !workout) return;

    const progressKey = `${WORKOUT_PROGRESS_PREFIX}${session.user.id}_${workoutId}`;
    const completedExercises = Object.entries(exerciseProgressById)
      .filter(([, progress]) => progress.isCompleted)
      .map(([exerciseId]) => exerciseId);
    const progress: WorkoutProgress = {
      workoutId,
      currentExerciseIndex,
      exerciseProgressById,
      seriesEditsByExerciseId,
      completedExercises,
      timestamp: Date.now(),
    };

    localStorage.setItem(progressKey, JSON.stringify(progress));
    setHasUnsavedProgress(false);
  }, [currentExerciseIndex, exerciseProgressById, seriesEditsByExerciseId, workoutId, session?.user?.id, workout]);

  // 🚨 Efecto: Advertencia al refrescar si hay progreso
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedProgress) {
        e.preventDefault();
        e.returnValue = "¿Estás seguro de que deseas salir? Tu progreso será guardado automáticamente.";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedProgress]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppBar title="Cargando..." onBack={onBack} />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!workout || !workout.exerciseList || workout.exerciseList.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppBar title="Workout" onBack={onBack} />
        <div className="p-6 text-center text-gray-500 mt-10">
          <p>Este workout no tiene ejercicios asignados.</p>
        </div>
      </div>
    );
  }

  const currentExercise = workout.exerciseList[currentExerciseIndex];
  const totalSets = Math.max(1, parseInt(currentExercise.sets, 10) || 0);
  const currentExerciseProgress = exerciseProgressById[currentExercise.id] || {
    completedSets: 0,
    isCompleted: false,
  };
  const currentExerciseSeriesEdits = seriesEditsByExerciseId[currentExercise.id];
  const completedExercises = Object.entries(exerciseProgressById)
    .filter(([, progress]) => progress.isCompleted)
    .map(([exerciseId]) => exerciseId);
  const hasAnyProgress = completedExercises.length > 0 || Object.values(exerciseProgressById).some((progress) => progress.completedSets > 0);
  const completedSets = currentExerciseProgress.isCompleted
    ? totalSets
    : Math.min(currentExerciseProgress.completedSets, totalSets);
  const currentSet = Math.min(completedSets + 1, totalSets);
  const isLastSet = currentSet >= totalSets;
  const isLastExercise = currentExerciseIndex === workout.exerciseList.length - 1;
  const isExerciseCompleted = currentExerciseProgress.isCompleted;
  const hasSeriesData = currentExercise.seriesData && currentExercise.seriesData.length > 0;
  const currentExerciseSeriesData = currentExerciseSeriesEdits || currentExercise.seriesData;

  const openSeriesEditModal = (exercise: any) => {
    const totalSeries = Math.max(1, Number(exercise.sets) || exercise.seriesData?.length || 0);
    const existingEdits = seriesEditsByExerciseId[exercise.id] || [];
    const draft = Array.from({ length: totalSeries }, (_, index) => {
      const baseSerie = exercise.seriesData?.[index] || {};
      const existingSerie = existingEdits[index] || {};

      return {
        reps: existingSerie.reps ?? baseSerie.reps ?? "",
        weight: existingSerie.weight ?? baseSerie.weight ?? "",
        rir: existingSerie.rir ?? baseSerie.rir ?? "",
        notes: existingSerie.notes ?? baseSerie.notes ?? "",
      };
    });

    setEditingExercise(exercise);
    setEditingSeriesDraft(draft);
    setIsSeriesEditModalOpen(true);
  };

  const handleSeriesDraftChange = (index: number, field: keyof SeriesEdit, value: string) => {
    setEditingSeriesDraft((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setHasUnsavedProgress(true);
  };

  const handleSaveSeriesEdits = () => {
    if (!editingExercise) return;

    const exerciseName = editingExercise.name;
    const savedSeries = editingSeriesDraft;

    setSeriesEditsByExerciseId((prev) => ({
      ...prev,
      [editingExercise.id]: savedSeries,
    }));
    setHasUnsavedProgress(true);
    setIsSeriesEditModalOpen(false);
    setEditingExercise(null);

    if (session?.user?.id) {
      const seriesSummary = savedSeries
        .map((item, index) => {
          const parts = [
            item.reps ? `reps ${item.reps}` : null,
            item.weight ? `peso ${item.weight}` : null,
            item.rir ? `RIR ${item.rir}` : null,
            item.notes ? `nota: ${item.notes}` : null,
          ].filter(Boolean);

          return parts.length > 0 ? `Serie ${index + 1} (${parts.join(", ")})` : null;
        })
        .filter(Boolean)
        .join(" | ");

      const suggestionNote = `Ajustes del cliente:\n${exerciseName}: ${seriesSummary || "Sin detalle"}`;
      clientService.saveWorkoutSuggestion(session.user.id, workout.id, suggestionNote).catch(() => {
        console.error("Error saving workout suggestion note");
      });
    }

    toast.success("Detalles de serie actualizados");
  };

  const buildCoachNotes = (isIncompleteWorkout: boolean) => {
    const editedExercises = Object.entries(seriesEditsByExerciseId)
      .filter(([, series]) => series.some((item) => item.reps || item.weight || item.rir || item.notes))
      .map(([exerciseId, series]) => {
        const exercise = workout.exerciseList.find((item: any) => item.id === exerciseId);
        const seriesSummary = series
          .map((item, index) => {
            const parts = [
              item.reps ? `reps ${item.reps}` : null,
              item.weight ? `peso ${item.weight}` : null,
              item.rir ? `RIR ${item.rir}` : null,
              item.notes ? `nota: ${item.notes}` : null,
            ].filter(Boolean);

            return parts.length > 0 ? `Serie ${index + 1} (${parts.join(", ")})` : null;
          })
          .filter(Boolean)
          .join(" | ");

        return `${exercise?.name || "Ejercicio"}: ${seriesSummary}`;
      });

    return editedExercises.length > 0 ? `Ajustes del cliente:\n${editedExercises.join("\n")}` : "";
  };

  const handleNextSet = () => {
    if (isExerciseCompleted) return;

    if (isLastSet) {
      // Última serie: marcar ejercicio completo sin perder el detalle de las series previas
      setExerciseProgressById((prev) => ({
        ...prev,
        [currentExercise.id]: {
          completedSets: totalSets,
          isCompleted: true,
        },
      }));
      setHasUnsavedProgress(true);
      toast.success("¡Ejercicio completado!");
      setRestTimer(0);
      setIsResting(false);
    } else {
      // No es la última serie: avanzar a la siguiente
      setExerciseProgressById((prev) => ({
        ...prev,
        [currentExercise.id]: {
          completedSets: currentSet,
          isCompleted: false,
        },
      }));
      setHasUnsavedProgress(true);
      toast.success(`Serie ${currentSet} completada`);
      
      // Limpiar interval anterior si existe
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
      }
      
      // Iniciar descanso
      const restSeconds = parseInt(currentExercise.rest) || 60;
      setRestTimer(restSeconds);
      setIsResting(true);
      
      restIntervalRef.current = setInterval(() => {
        setRestTimer((prev) => {
          if (prev <= 1) {
            if (restIntervalRef.current) {
              clearInterval(restIntervalRef.current);
              restIntervalRef.current = null;
            }
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleNext = () => {
    if (!isLastExercise) {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setHasUnsavedProgress(true);
      setIsResting(false);
    }
  };

  const handlePrevious = () => {
    if (currentExerciseIndex > 0) {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
      setCurrentExerciseIndex(currentExerciseIndex - 1);
      setHasUnsavedProgress(true);
      setIsResting(false);
    }
  };

  // 🚨 MAGIA: Registrar en la Base de Datos que terminamos
  const handleFinishWorkout = async (isIncomplete: boolean = false) => {
    if (!session?.user?.id) return;
    
    setIsFinishing(true);
    // Suponemos que cada ejercicio le tomó aprox 10 min
    const estimatedMinutes = workout.exerciseList.length * 10;
    const completedExercisesCount = completedExercises.length;
    const totalExercises = workout.exerciseList.length;

    const success = await clientService.finishWorkout(session.user.id, workout.id, {
      durationMinutes: estimatedMinutes,
      isIncomplete,
      completedExercises: completedExercisesCount,
      totalExercises,
      notes: buildCoachNotes(isIncomplete),
    });
    
    if (success) {
      toast.success(
        isIncomplete
          ? "Workout guardado como incompleto. El profesor podrá verlo."
          : "¡Workout completado! Progreso guardado. 💪",
        { duration: 4000 }
      );
      // Limpiar progreso guardado al terminar
      if (session?.user?.id) {
        const progressKey = `${WORKOUT_PROGRESS_PREFIX}${session.user.id}_${workoutId}`;
        localStorage.removeItem(progressKey);
      }
      setHasUnsavedProgress(false);
      onBack();
    } else {
      toast.error("Hubo un error al guardar el progreso.");
      setIsFinishing(false);
    }
  };

  const handleFinishWorkoutPress = () => {
    if (completedExercises.length < workout.exerciseList.length) {
      setShowConfirmIncompleteFinishModal(true);
      return;
    }

    handleFinishWorkout(false);
  };

  const handleBackWithConfirmation = () => {
    if (hasUnsavedProgress && hasAnyProgress) {
      pendingNavigationRef.current = onBack;
      setShowConfirmDiscardModal(true);
    } else {
      onBack();
    }
  };

  const handleConfirmDiscard = () => {
    setShowConfirmDiscardModal(false);
    if (pendingNavigationRef.current) {
      pendingNavigationRef.current();
    }
  };

  const handleSaveManually = () => {
    if (session?.user?.id) {
      const progressKey = `${WORKOUT_PROGRESS_PREFIX}${session.user.id}_${workoutId}`;
      const completedExercises = Object.entries(exerciseProgressById)
        .filter(([, progress]) => progress.isCompleted)
        .map(([exerciseId]) => exerciseId);
      const progress: WorkoutProgress = {
        workoutId,
        currentExerciseIndex,
        exerciseProgressById,
        seriesEditsByExerciseId,
        completedExercises,
        timestamp: Date.now(),
      };
      localStorage.setItem(progressKey, JSON.stringify(progress));
      toast.success("Progreso guardado ✓", { duration: 2000 });
      setHasUnsavedProgress(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AppBar title={workout.title} onBack={handleBackWithConfirmation} />

      <div className="px-4 py-6 max-w-5xl mx-auto lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] lg:gap-6 lg:items-start lg:space-y-0 space-y-6">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[14px] text-gray-600 font-medium">Progreso del workout</span>
              <span className="text-[14px] font-semibold text-primary">
                {completedExercises.length}/{workout.exerciseList.length}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(completedExercises.length / workout.exerciseList.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[14px] text-gray-500 font-medium">
                Ejercicio {currentExerciseIndex + 1} de {workout.exerciseList.length}
              </span>
              {isExerciseCompleted && <CheckCircle2 className="w-5 h-5 text-success" />}
            </div>

            <h2 className="mb-6">{currentExercise.name}</h2>

            {!isExerciseCompleted && (
              <div className="mb-6 p-4 bg-primary/5 rounded-xl border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] text-gray-700 font-medium">
                    Serie actual
                  </span>
                  <span className="text-[15px] font-bold text-primary">
                    {currentSet} de {totalSets}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{
                      width: `${((currentSet - 1) / totalSets) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[13px] text-gray-600 mb-1">Series</p>
                <p className="text-[20px] font-bold text-gray-900">{currentExercise.sets}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[13px] text-gray-600 mb-1">Reps</p>
                <p className="text-[18px] font-bold text-gray-900 truncate px-1">
                  {currentExercise.seriesData?.[0]?.reps ? `${currentExercise.seriesData[0].reps} reps` : "-"}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[13px] text-gray-600 mb-1">Descanso</p>
                <p className="text-[20px] font-bold text-gray-900">{currentExercise.rest}</p>
              </div>
            </div>

            {hasSeriesData && (
              <button
                onClick={() => setIsSeriesDetailModalOpen(true)}
                className="w-full mb-6 px-4 py-3 bg-primary/10 border border-primary/30 rounded-xl text-primary font-medium text-[14px] flex items-center justify-center gap-2 hover:bg-primary/20 transition-all active:scale-[0.98]"
              >
                <List className="w-4 h-4" />
                Ver detalle por serie
              </button>
            )}

            {isResting && (
              <div className="mb-6 p-6 bg-accent/10 rounded-xl text-center border border-accent/20">
                <Clock className="w-8 h-8 text-accent mx-auto mb-2 animate-pulse" />
                <p className="text-[14px] text-gray-700 mb-2">Descanso</p>
                <p className="text-[32px] font-bold text-accent">{restTimer}s</p>
              </div>
            )}

            <CTAButton
              variant={isExerciseCompleted ? "secondary" : "primary"}
              size="large"
              fullWidth
              onClick={handleNextSet}
              disabled={isExerciseCompleted}
              icon={isExerciseCompleted ? CheckCircle2 : Circle}
            >
              {isExerciseCompleted 
                ? "Ejercicio completado" 
                : isLastSet 
                ? "Marcar como hecho" 
                : `Siguiente serie (${currentSet}/${totalSets})`
              }
            </CTAButton>
            {hasAnyProgress && (
              <button
                onClick={handleSaveManually}
                className="mt-3 w-full px-4 py-3 bg-success/10 border border-success/30 rounded-xl text-success font-medium text-[14px] flex items-center justify-center gap-2 hover:bg-success/20 transition-all active:scale-[0.98]"
              >
                <Save className="w-4 h-4" />
                Guardar progreso
              </button>
            )}          </div>

          <div className="flex gap-3">
            <CTAButton
              variant="outline"
              fullWidth
              onClick={handlePrevious}
              disabled={currentExerciseIndex === 0}
            >
              Anterior
            </CTAButton>
            {!isLastExercise ? (
              <CTAButton variant="secondary" fullWidth onClick={handleNext}>
                Siguiente
              </CTAButton>
            ) : (
              <CTAButton
                variant="accent"
                fullWidth
                  onClick={handleFinishWorkoutPress}
                  disabled={isFinishing}
              >
                  {isFinishing
                    ? "Guardando..."
                    : completedExercises.length !== workout.exerciseList.length
                    ? "Finalizar incompleto"
                    : "Finalizar workout"}
              </CTAButton>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-border shadow-sm lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto">
          <h4 className="mb-3">Todos los ejercicios</h4>
          <div className="space-y-2">
            {workout.exerciseList.map((exercise: any, index: number) => {
              const exerciseProgress = exerciseProgressById[exercise.id];
              const isDone = exerciseProgress?.isCompleted || false;
              const completedSeries = Math.min(exerciseProgress?.completedSets || 0, Number(exercise.sets) || 0);
              const isCurrent = index === currentExerciseIndex;
              
              return (
                <div
                  key={exercise.id}
                  className={`relative w-full p-3 rounded-lg transition-all group border ${
                    isCurrent
                      ? "bg-primary text-white border-primary"
                      : isDone
                      ? "bg-success/5 text-success-700 border-success/20"
                      : "bg-gray-50 text-gray-900 border-gray-100"
                  }`}
                >
                  <button onClick={() => setCurrentExerciseIndex(index)} className="w-full text-left pr-10">
                    <div className="flex items-center gap-3">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-medium truncate">{exercise.name}</p>
                        <p className={`text-[13px] ${isCurrent ? "opacity-80" : "opacity-60"}`}>
                          {isDone
                            ? `${exercise.sets} series completadas`
                            : completedSeries > 0
                            ? `${completedSeries}/${exercise.sets} series guardadas`
                            : `${exercise.sets} series`}
                        </p>
                      </div>
                    </div>
                  </button>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openSeriesEditModal(exercise);
                      }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        isCurrent ? "bg-white/20 hover:bg-white/30 text-white" : "bg-gray-200 hover:bg-accent/20 text-gray-700 hover:text-accent"
                      }`}
                      aria-label="Editar serie"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewExercise(exercise);
                        setIsPreviewModalOpen(true);
                      }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        isCurrent ? "bg-white/20 hover:bg-white/30 text-white" : "bg-gray-200 hover:bg-accent/20 text-gray-700 hover:text-accent"
                      }`}
                      aria-label="Ver detalle"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ExercisePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        exerciseName={previewExercise?.name || ""}
        sets={previewExercise?.sets || 0}
        reps={previewExercise?.seriesData?.[0]?.reps || ""}
        notes={""}
      />

      {isSeriesEditModalOpen && editingExercise && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-3xl sm:rounded-t-2xl flex items-center justify-between z-10">
              <div>
                <h3 className="font-semibold text-[16px]">Editar serie</h3>
                <p className="text-[13px] text-gray-600">{editingExercise.name}</p>
              </div>
              <button onClick={() => setIsSeriesEditModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">✕</button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[13px] text-amber-900">
                Estos cambios no modifican la rutina original. Solo quedan guardados como notas para tu profesor.
              </div>

              {editingSeriesDraft.map((serie, index) => (
                <div key={index} className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-[13px]">{index + 1}</div>
                    <span className="text-[14px] font-medium text-gray-700">Serie {index + 1}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="space-y-1">
                      <span className="text-[12px] text-gray-600">Reps</span>
                      <input
                        value={serie.reps}
                        onChange={(e) => handleSeriesDraftChange(index, "reps", e.target.value)}
                        className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-[14px] outline-none focus:border-primary"
                        placeholder="Ej: 12"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[12px] text-gray-600">Peso</span>
                      <input
                        value={serie.weight}
                        onChange={(e) => handleSeriesDraftChange(index, "weight", e.target.value)}
                        className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-[14px] outline-none focus:border-primary"
                        placeholder="Ej: 20kg"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[12px] text-gray-600">RIR</span>
                      <input
                        value={serie.rir}
                        onChange={(e) => handleSeriesDraftChange(index, "rir", e.target.value)}
                        className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-[14px] outline-none focus:border-primary"
                        placeholder="Ej: 2"
                      />
                    </label>
                  </div>

                  <label className="space-y-1 block">
                    <span className="text-[12px] text-gray-600">Nota para el profesor</span>
                    <textarea
                      value={serie.notes}
                      onChange={(e) => handleSeriesDraftChange(index, "notes", e.target.value)}
                      className="w-full min-h-[88px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-[14px] outline-none focus:border-primary resize-none"
                      placeholder="Ej: Necesité menos peso, más repeticiones o una corrección técnica."
                    />
                  </label>
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
              <button onClick={() => setIsSeriesEditModalOpen(false)} className="w-full h-11 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-xl">
                Cancelar
              </button>
              <button onClick={handleSaveSeriesEdits} className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl">
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {isSeriesDetailModalOpen && hasSeriesData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-3xl sm:rounded-t-2xl flex items-center justify-between z-10">
              <div>
                <h3 className="font-semibold text-[16px]">{currentExercise.name}</h3>
                <p className="text-[13px] text-gray-600">Detalle por serie</p>
              </div>
              <button onClick={() => setIsSeriesDetailModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">✕</button>
            </div>
            <div className="px-6 py-4 space-y-3">
              {currentExerciseSeriesData.map((serie: any, index: number) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-[13px]">{index + 1}</div>
                    <span className="text-[14px] font-medium text-gray-700">Serie {index + 1}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {serie.reps && (<div className="bg-white rounded-lg p-3 border border-gray-200"><p className="text-[11px] text-gray-600 mb-1">Repeticiones</p><p className="text-[16px] font-bold text-gray-900">{serie.reps}</p></div>)}
                    {serie.weight && (<div className="bg-white rounded-lg p-3 border border-gray-200"><p className="text-[11px] text-gray-600 mb-1">Peso</p><p className="text-[16px] font-bold text-gray-900">{serie.weight}kg</p></div>)}
                    {serie.rir && (<div className="bg-white rounded-lg p-3 border border-gray-200"><p className="text-[11px] text-gray-600 mb-1">RIR</p><p className="text-[16px] font-bold text-gray-900">{serie.rir}</p></div>)}
                  </div>
                </div>
              ))}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
              <button onClick={() => setIsSeriesDetailModalOpen(false)} className="w-full h-11 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-xl">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmDiscardModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[18px] font-bold text-gray-900 mb-2">¿Descartar progreso?</h3>
            <p className="text-[14px] text-gray-600 mb-6">
              Has completado <strong>{completedExercises.length} ejercicio(s)</strong>. Tu progreso está guardado automáticamente y será restaurado si vuelves a esta sesión.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleConfirmDiscard}
                className="w-full h-11 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-xl transition-all active:scale-[0.98]"
              >
                Descartar
              </button>
              <button
                onClick={() => setShowConfirmDiscardModal(false)}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-all active:scale-[0.98]"
              >
                Continuar entrenando
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmIncompleteFinishModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[18px] font-bold text-gray-900 mb-2">Te faltaron ejercicios</h3>
            <p className="text-[14px] text-gray-600 mb-6">
              Te faltan <strong>{workout.exerciseList.length - completedExercises.length} ejercicio(s)</strong>. ¿Estás seguro de dejarlo así? Si aceptás, se guarda como incompleto para que el profesor vea la rutina tal como quedó.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setShowConfirmIncompleteFinishModal(false)}
                className="w-full h-11 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-xl transition-all active:scale-[0.98]"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowConfirmIncompleteFinishModal(false);
                  handleFinishWorkout(true);
                }}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-all active:scale-[0.98]"
              >
                Guardar incompleto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}