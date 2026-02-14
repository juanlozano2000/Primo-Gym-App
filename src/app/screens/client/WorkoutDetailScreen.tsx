import { useState } from "react";
import { AppBar } from "../../components/AppBar";
import { CTAButton } from "../../components/CTAButton";
import { CheckCircle2, Circle, Clock, Play, Pause, Eye } from "lucide-react";
import { workouts } from "../../data/mockData";
import { toast } from "sonner";
import { ExercisePreviewModal } from "../../components/ExercisePreviewModal";

interface WorkoutDetailScreenProps {
  workoutId: string;
  onBack: () => void;
}

export function WorkoutDetailScreen({
  workoutId,
  onBack,
}: WorkoutDetailScreenProps) {
  const workout = workouts.find((w) => w.id === workoutId);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [isResting, setIsResting] = useState(false);
  const [restTimer, setRestTimer] = useState(0);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewExercise, setPreviewExercise] = useState<any>(null);

  if (!workout || !workout.exerciseList) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppBar title="Workout" onBack={onBack} />
        <div className="p-6 text-center">
          <p>Workout no encontrado</p>
        </div>
      </div>
    );
  }

  const currentExercise = workout.exerciseList[currentExerciseIndex];
  const isLastExercise = currentExerciseIndex === workout.exerciseList.length - 1;
  const isExerciseCompleted = completedExercises.includes(currentExercise.id);

  const handleMarkAsDone = () => {
    if (!isExerciseCompleted) {
      setCompletedExercises([...completedExercises, currentExercise.id]);
      toast.success("Ejercicio completado");
      
      // Iniciar descanso
      const restSeconds = parseInt(currentExercise.rest);
      setRestTimer(restSeconds);
      setIsResting(true);
      
      // Timer simulado
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

  const handleFinishWorkout = () => {
    toast.success("¡Workout completado! 💪");
    onBack();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AppBar title={workout.title} onBack={onBack} />

      <div className="px-4 py-6 space-y-6">
        {/* Progreso */}
        <div className="bg-white rounded-2xl p-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] text-gray-600 font-medium">
              Progreso del workout
            </span>
            <span className="text-[14px] font-semibold text-primary">
              {completedExercises.length}/{workout.exerciseList.length}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{
                width: `${(completedExercises.length / workout.exerciseList.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Ejercicio actual */}
        <div className="bg-white rounded-2xl p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[14px] text-gray-500 font-medium">
              Ejercicio {currentExerciseIndex + 1} de {workout.exerciseList.length}
            </span>
            {isExerciseCompleted && (
              <CheckCircle2 className="w-5 h-5 text-success" />
            )}
          </div>

          <h2 className="mb-6">{currentExercise.name}</h2>

          {/* Detalles del ejercicio */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-[13px] text-gray-600 mb-1">Series</p>
              <p className="text-[20px] font-bold text-gray-900">{currentExercise.sets}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-[13px] text-gray-600 mb-1">Reps</p>
              <p className="text-[20px] font-bold text-gray-900">
                {currentExercise.reps || currentExercise.time || "-"}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-[13px] text-gray-600 mb-1">Descanso</p>
              <p className="text-[20px] font-bold text-gray-900">{currentExercise.rest}</p>
            </div>
          </div>

          {/* Notas */}
          {currentExercise.notes && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-6">
              <p className="text-[14px] text-blue-900">{currentExercise.notes}</p>
            </div>
          )}

          {/* Temporizador de descanso */}
          {isResting && (
            <div className="mb-6 p-6 bg-accent/10 rounded-xl text-center">
              <Clock className="w-8 h-8 text-accent mx-auto mb-2" />
              <p className="text-[14px] text-gray-700 mb-2">Descanso</p>
              <p className="text-[32px] font-bold text-accent">{restTimer}s</p>
            </div>
          )}

          {/* Botón marcar como hecho */}
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

        {/* Navegación entre ejercicios */}
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
            <CTAButton
              variant="secondary"
              fullWidth
              onClick={handleNext}
            >
              Siguiente
            </CTAButton>
          ) : (
            <CTAButton
              variant="accent"
              fullWidth
              onClick={handleFinishWorkout}
              disabled={completedExercises.length !== workout.exerciseList.length}
            >
              Finalizar workout
            </CTAButton>
          )}
        </div>

        {/* Lista de ejercicios */}
        <div className="bg-white rounded-2xl p-4 border border-border">
          <h4 className="mb-3">Todos los ejercicios</h4>
          <div className="space-y-2">
            {workout.exerciseList.map((exercise, index) => {
              const isDone = completedExercises.includes(exercise.id);
              const isCurrent = index === currentExerciseIndex;
              
              return (
                <div
                  key={exercise.id}
                  className={`relative w-full p-3 rounded-lg transition-all group ${
                    isCurrent
                      ? "bg-primary text-white"
                      : isDone
                      ? "bg-green-50 text-green-900"
                      : "bg-gray-50 text-gray-900"
                  }`}
                >
                  <button
                    onClick={() => setCurrentExerciseIndex(index)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center gap-3">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-medium truncate">{exercise.name}</p>
                        <p className={`text-[13px] ${isCurrent ? "opacity-80" : "opacity-60"}`}>
                          {exercise.sets} series × {exercise.reps || exercise.time}
                        </p>
                      </div>
                    </div>
                  </button>
                  
                  {/* Botón del ojo flotante */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewExercise(exercise);
                      setIsPreviewModalOpen(true);
                    }}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${
                      isCurrent
                        ? "bg-white/20 hover:bg-white/30 text-white"
                        : "bg-gray-200 hover:bg-accent/20 text-gray-700 hover:text-accent"
                    }`}
                    title="Ver demo del ejercicio"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal de vista previa del ejercicio */}
      <ExercisePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        exercise={previewExercise}
      />
    </div>
  );
}