import { useState } from "react";
import { AppBar } from "../../components/AppBar";
import { CTAButton } from "../../components/CTAButton";
import { CreateTemplateModal } from "../../components/CreateTemplateModal";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { coachData } from "../../data/mockData";

interface CreatePlanScreenProps {
  onBack: () => void;
  onContinue: (planData: PlanBasicInfo) => void;
}

interface SeriesData {
  reps: string;
  weight: string;
  time?: string;
  rir?: string;
}

export interface PlanBasicInfo {
  name: string;
  description: string;
  durationWeeks: number;
  daysPerWeek: number;
  exercises?: Array<{
    id: string;
    name: string;
    totalSets: number;
    seriesData: SeriesData[];
    rest: string;
  }>;
}

export function CreatePlanScreen({ onBack, onContinue }: CreatePlanScreenProps) {
  const [planName, setPlanName] = useState("");
  const [description, setDescription] = useState("");
  const [durationWeeks, setDurationWeeks] = useState<number>(8);
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4);
  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] = useState(false);
  const [customTemplates, setCustomTemplates] = useState(coachData.customTemplates);
  const [selectedExercises, setSelectedExercises] = useState<Array<{
    id: string;
    name: string;
    totalSets: number;
    seriesData: SeriesData[];
    rest: string;
  }> | null>(null);
  const [showExercises, setShowExercises] = useState(false);

  const hasExercises = selectedExercises && selectedExercises.length > 0;

  const handleContinue = () => {
    // Validación
    if (!planName.trim()) {
      toast.error("Por favor, ingresá el nombre del plan");
      return;
    }

    if (durationWeeks < 1 || durationWeeks > 52) {
      toast.error("La duración debe ser entre 1 y 52 semanas");
      return;
    }

    if (daysPerWeek < 1 || daysPerWeek > 7) {
      toast.error("Los días por semana deben ser entre 1 y 7");
      return;
    }

    const planData: PlanBasicInfo = {
      name: planName,
      description,
      durationWeeks,
      daysPerWeek,
      exercises: selectedExercises || undefined,
    };

    onContinue(planData);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <AppBar title="Crear Nuevo Plan" onBack={onBack} />

      <div className="px-4 py-6 space-y-6">
        {/* Paso actual */}
        {hasExercises ? (
          <>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-primary rounded-full" />
              <div className="flex-1 h-1 bg-gray-200 rounded-full" />
            </div>
            <div>
              <p className="text-[13px] text-gray-600 mb-1">Paso 1 de 2</p>
              <h2 className="text-[20px] font-semibold">Información básica</h2>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-primary rounded-full" />
              <div className="flex-1 h-1 bg-gray-200 rounded-full" />
              <div className="flex-1 h-1 bg-gray-200 rounded-full" />
            </div>
            <div>
              <p className="text-[13px] text-gray-600 mb-1">Paso 1 de 3</p>
              <h2 className="text-[20px] font-semibold">Información básica</h2>
            </div>
          </>
        )}
        
        {/* Formulario */}
        <div className="bg-white rounded-2xl p-4 border border-border space-y-4">
          {/* Nombre del plan */}
          <div>
            <label className="block text-[14px] mb-2 text-gray-700 font-medium">
              Nombre del plan *
            </label>
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="Ej: Hipertrofia 4 días"
              className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-[14px] mb-2 text-gray-700 font-medium">
              Descripción (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el objetivo y características principales del plan"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          {/* Duración */}
          <div>
            <label className="block text-[14px] mb-2 text-gray-700 font-medium">
              Duración del plan *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(parseInt(e.target.value) || 0)}
                  min="1"
                  max="52"
                  className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <p className="text-[12px] text-gray-500 mt-1">Semanas</p>
              </div>
              <div>
                <input
                  type="number"
                  value={daysPerWeek}
                  onChange={(e) => setDaysPerWeek(parseInt(e.target.value) || 0)}
                  min="1"
                  max="7"
                  className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <p className="text-[12px] text-gray-500 mt-1">Días por semana</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen rápido */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-[13px] text-gray-700 mb-2">
            <span className="font-medium">Resumen:</span> Este plan durará{" "}
            <span className="font-semibold text-primary">{durationWeeks} semanas</span> con{" "}
            <span className="font-semibold text-primary">{daysPerWeek} entrenamientos</span> por semana,
            totalizando{" "}
            <span className="font-semibold text-primary">{durationWeeks * daysPerWeek} workouts</span>.
          </p>
        </div>

        {/* Templates */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3>Templates</h3>
            <button
              onClick={() => setIsCreateTemplateModalOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {/* Templates personalizados */}
            {customTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  setPlanName(template.name);
                  setDescription(template.description);
                  setDurationWeeks(template.weeks);
                  setDaysPerWeek(template.days);
                  setSelectedExercises(template.exercises);
                  toast.success(`Template "${template.name}" aplicado con ${template.exercises.length} ejercicios`);
                }}
                className="w-full bg-white rounded-xl p-3 border border-border text-left hover:border-primary hover:bg-primary/5 transition-all active:scale-[0.98] relative"
              >
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] px-2 py-1 rounded-full bg-accent/10 text-accent font-semibold">
                    PERSONALIZADO
                  </span>
                </div>
                <h4 className="text-[15px] font-medium mb-1 pr-24">{template.name}</h4>
                <p className="text-[13px] text-gray-600 mb-2">
                  {template.weeks} semanas · {template.days} días/semana · {template.exercises.length} ejercicios
                </p>
                <p className="text-[12px] text-gray-500">{template.description}</p>
              </button>
            ))}

            {/* Templates sugeridos */}
            {[
              { name: "Hipertrofia 4 días", weeks: 8, days: 4, desc: "Enfoque en volumen muscular" },
              { name: "Fuerza 3 días", weeks: 12, days: 3, desc: "Movimientos básicos + accesorios" },
              { name: "Definición 5 días", weeks: 6, days: 5, desc: "Alta frecuencia + cardio" },
            ].map((template, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPlanName(template.name);
                  setDescription(template.desc);
                  setDurationWeeks(template.weeks);
                  setDaysPerWeek(template.days);
                  toast.success("Template aplicado");
                }}
                className="w-full bg-white rounded-xl p-3 border border-border text-left hover:border-primary hover:bg-primary/5 transition-all active:scale-[0.98]"
              >
                <h4 className="text-[15px] font-medium mb-1">{template.name}</h4>
                <p className="text-[13px] text-gray-600">
                  {template.weeks} semanas · {template.days} días/semana · {template.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Ejercicios del template */}
        {hasExercises && (
          <div className="bg-accent/5 border border-accent/30 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowExercises(!showExercises)}
              className="w-full p-4 flex items-center justify-between hover:bg-accent/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <span className="text-[16px] font-bold text-accent">{selectedExercises.length}</span>
                </div>
                <div className="text-left">
                  <h3 className="text-[15px] font-semibold">Ejercicios incluidos</h3>
                  <p className="text-[13px] text-gray-600">Tocá para {showExercises ? 'ocultar' : 'ver detalles'}</p>
                </div>
              </div>
              {showExercises ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {showExercises && (
              <div className="px-4 pb-4 space-y-2 border-t border-accent/20">
                {selectedExercises.map((exercise, index) => {
                  // Construir resumen de las series
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
                      className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-200"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[12px] font-semibold text-primary">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-medium mb-1">{exercise.name}</h4>
                        <p className="text-[12px] text-gray-600 mb-0.5">
                          {exercise.totalSets} series · {exercise.rest} descanso
                        </p>
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                          {seriesSummary}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newExercises = selectedExercises.filter((e) => e.id !== exercise.id);
                          setSelectedExercises(newExercises.length > 0 ? newExercises : null);
                          toast.success("Ejercicio eliminado");
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-error transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botón continuar fijo */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-white border-t border-border">
        <CTAButton
          variant="primary"
          size="large"
          fullWidth
          onClick={handleContinue}
        >
          Continuar
        </CTAButton>
      </div>

      {/* Modal para crear nuevo template */}
      <CreateTemplateModal
        isOpen={isCreateTemplateModalOpen}
        onClose={() => setIsCreateTemplateModalOpen(false)}
        onSave={(template) => {
          // Agregar el nuevo template a la lista
          const newTemplate = {
            id: `t${customTemplates.length + 1}`,
            name: template.name,
            description: template.description,
            weeks: template.weeks,
            days: template.days,
            exercises: template.exercises,
          };
          setCustomTemplates([...customTemplates, newTemplate]);
          
          // Aplicar el template al formulario
          setPlanName(template.name);
          setDescription(template.description);
          setDurationWeeks(template.weeks);
          setDaysPerWeek(template.days);
          setSelectedExercises(template.exercises);
          
          setIsCreateTemplateModalOpen(false);
          toast.success(`Template "${template.name}" creado y aplicado`);
        }}
      />
    </div>
  );
}