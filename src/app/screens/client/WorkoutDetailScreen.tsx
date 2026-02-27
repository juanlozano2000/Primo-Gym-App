import { useState, useEffect } from "react";
import { AppBar } from "../../components/AppBar";
import { CTAButton } from "../../components/CTAButton";
import { CheckCircle2, Circle, Clock, Eye, List, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ExercisePreviewModal } from "../../components/ExercisePreviewModal";
import { useAuth } from "../../context/AuthContext";
import { clientService } from "../../services/clientService"; // 🚨 Importado

interface WorkoutDetailScreenProps {
  workoutId: string;
  onBack: () => void;
}

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
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [isResting, setIsResting] = useState(false);
  const [restTimer, setRestTimer] = useState(0);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewExercise, setPreviewExercise] = useState<any>(null);
  const [isSeriesDetailModalOpen, setIsSeriesDetailModalOpen] = useState(false);

  useEffect(() => {
    const fetchWorkoutDetail = async () => {
      setIsLoading(true);
      const data = await clientService.getWorkoutDetail(workoutId);
      setWorkout(data);
      setIsLoading(false);
    };

    if (workoutId) fetchWorkoutDetail();
  }, [workoutId]);

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
  const isLastExercise = currentExerciseIndex === workout.exerciseList.length - 1;
  const isExerciseCompleted = completedExercises.includes(currentExercise.id);
  const hasSeriesData = currentExercise.seriesData && currentExercise.seriesData.length > 0;

  const handleMarkAsDone = () => {
    if (!isExerciseCompleted) {
      setCompletedExercises([...completedExercises, currentExercise.id]);
      toast.success("Ejercicio completado");
      
      const restSeconds = parseInt(currentExercise.rest) || 60;
      setRestTimer(restSeconds);
      setIsResting(true);
      
      const interval = setInterval(() => {
        setRestTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
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
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setIsResting(false);
    }
  };

  const handlePrevious = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
      setIsResting(false);
    }
  };

  // 🚨 MAGIA: Registrar en la Base de Datos que terminamos
  const handleFinishWorkout = async () => {
    if (!session?.user?.id) return;
    
    setIsFinishing(true);
    // Suponemos que cada ejercicio le tomó aprox 10 min
    const estimatedMinutes = workout.exerciseList.length * 10;
    
    const success = await clientService.finishWorkout(session.user.id, workout.id, estimatedMinutes);
    
    if (success) {
      toast.success("¡Workout completado! Progreso guardado. 💪", { duration: 4000 });
      onBack();
    } else {
      toast.error("Hubo un error al guardar el progreso.");
      setIsFinishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AppBar title={workout.title} onBack={onBack} />

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

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[13px] text-gray-600 mb-1">Series</p>
                <p className="text-[20px] font-bold text-gray-900">{currentExercise.sets}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[13px] text-gray-600 mb-1">Objetivo</p>
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
              onClick={handleMarkAsDone}
              disabled={isExerciseCompleted}
              icon={isExerciseCompleted ? CheckCircle2 : Circle}
            >
              {isExerciseCompleted ? "Ejercicio completado" : "Marcar como hecho"}
            </CTAButton>
          </div>

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
                onClick={handleFinishWorkout}
                disabled={completedExercises.length !== workout.exerciseList.length || isFinishing}
              >
                {isFinishing ? "Guardando..." : "Finalizar workout"}
              </CTAButton>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-border shadow-sm lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto">
          <h4 className="mb-3">Todos los ejercicios</h4>
          <div className="space-y-2">
            {workout.exerciseList.map((exercise: any, index: number) => {
              const isDone = completedExercises.includes(exercise.id);
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
                          {exercise.sets} series
                        </p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewExercise(exercise);
                      setIsPreviewModalOpen(true);
                    }}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      isCurrent ? "bg-white/20 hover:bg-white/30 text-white" : "bg-gray-200 hover:bg-accent/20 text-gray-700 hover:text-accent"
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
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
              {currentExercise.seriesData.map((serie: any, index: number) => (
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
    </div>
  );
}