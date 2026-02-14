import { useState } from "react";
import { AppBar } from "../../components/AppBar";
import { CTAButton } from "../../components/CTAButton";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface CreatePlanScreenProps {
  onBack: () => void;
  onContinue: (planData: PlanBasicInfo) => void;
}

export interface PlanBasicInfo {
  name: string;
  description: string;
  durationWeeks: number;
  daysPerWeek: number;
}

export function CreatePlanScreen({ onBack, onContinue }: CreatePlanScreenProps) {
  const [planName, setPlanName] = useState("");
  const [description, setDescription] = useState("");
  const [durationWeeks, setDurationWeeks] = useState<number>(8);
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4);

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
    };

    onContinue(planData);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <AppBar title="Crear Nuevo Plan" onBack={onBack} />

      <div className="px-4 py-6 space-y-6">
        {/* Paso actual */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-primary rounded-full" />
          <div className="flex-1 h-1 bg-gray-200 rounded-full" />
          <div className="flex-1 h-1 bg-gray-200 rounded-full" />
        </div>
        
        <div>
          <p className="text-[13px] text-gray-600 mb-1">Paso 1 de 3</p>
          <h2 className="text-[20px] font-semibold">Información básica</h2>
        </div>

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

        {/* Templates sugeridos */}
        <div>
          <h3 className="mb-3">Templates sugeridos</h3>
          <div className="space-y-2">
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
    </div>
  );
}
