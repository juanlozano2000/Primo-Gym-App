import { AppBar } from "../../components/AppBar";
import { CTAButton } from "../../components/CTAButton";
import { EmptyState } from "../../components/EmptyState";
import { Plus, Copy, FileText } from "lucide-react";
import { toast } from "sonner";

interface EditPlanScreenProps {
  onBack: () => void;
}

export function EditPlanScreen({ onBack }: EditPlanScreenProps) {
  const handleSave = () => {
    toast.success("Plan guardado correctamente");
    onBack();
  };

  const handleDuplicate = () => {
    toast.info("Plan duplicado. Realiza los cambios necesarios.");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AppBar title="Editar Plan" onBack={onBack} />

      <div className="px-4 py-6 space-y-6">
        {/* Wireframe de editor */}
        <div className="bg-white rounded-2xl p-4 border border-border">
          <h3 className="mb-3">Información del plan</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[14px] mb-2 text-gray-700">
                Nombre del plan
              </label>
              <input
                type="text"
                defaultValue="Hipertrofia 4 días"
                className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-[14px] mb-2 text-gray-700">
                Duración (semanas)
              </label>
              <input
                type="number"
                defaultValue="8"
                className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-[14px] mb-2 text-gray-700">
                Días por semana
              </label>
              <select className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                <option>3 días</option>
                <option selected>4 días</option>
                <option>5 días</option>
                <option>6 días</option>
              </select>
            </div>
          </div>
        </div>

        {/* Workouts del plan */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3>Workouts del plan</h3>
            <button className="flex items-center gap-1 text-[14px] text-primary font-medium">
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>

          {/* Lista de workouts (wireframe) */}
          <div className="space-y-3">
            {["Pecho y Tríceps", "Espalda y Bíceps", "Piernas", "Hombros y Core"].map(
              (workout, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-4 border border-border"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="mb-1">{workout}</h4>
                      <p className="text-[14px] text-gray-600">
                        {Math.floor(Math.random() * 3) + 5} ejercicios · 45-55 min
                      </p>
                    </div>
                    <button className="text-primary text-[14px] font-medium">
                      Editar
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="space-y-3">
          <CTAButton
            variant="outline"
            icon={Copy}
            fullWidth
            onClick={handleDuplicate}
          >
            Duplicar plan existente
          </CTAButton>
        </div>

        {/* Nota informativa */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <FileText className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[14px] text-blue-900 mb-1 font-medium">
                Vista simplificada
              </p>
              <p className="text-[13px] text-blue-800">
                Esta es una representación wireframe del editor de planes. En la versión
                completa podrás agregar ejercicios, series, repeticiones y más detalles.
              </p>
            </div>
          </div>
        </div>

        {/* Botón guardar */}
        <div className="fixed bottom-20 left-0 right-0 px-4 py-3 bg-white border-t border-border">
          <CTAButton
            variant="primary"
            size="large"
            fullWidth
            onClick={handleSave}
          >
            Guardar cambios
          </CTAButton>
        </div>
      </div>
    </div>
  );
}
