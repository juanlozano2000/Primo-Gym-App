import { useState } from "react";
import { toast } from "sonner";

import { AppBar } from "../../components/AppBar";
import { CTAButton } from "../../components/CTAButton";
import { useAuth } from "../../context/AuthContext";
import { clientService } from "../../services/clientService";

interface AddMetricsScreenProps {
  onBack: () => void;
  onSaved: () => void;
}

export function AddMetricsScreen({ onBack, onSaved }: AddMetricsScreenProps) {
  const { session } = useAuth();

  const [metricWeight, setMetricWeight] = useState("");
  const [metricHeight, setMetricHeight] = useState("");
  const [metricBodyFat, setMetricBodyFat] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveMetrics = async () => {
    if (!session?.user?.id) {
      toast.error("No se pudo identificar al usuario");
      return;
    }

    const parsedWeight = metricWeight.trim() === "" ? undefined : parseFloat(metricWeight);
    const parsedHeight = metricHeight.trim() === "" ? undefined : parseFloat(metricHeight);
    const parsedBodyFat = metricBodyFat.trim() === "" ? undefined : parseFloat(metricBodyFat);

    if (parsedWeight === undefined && parsedHeight === undefined && parsedBodyFat === undefined) {
      toast.error("Ingresá al menos una métrica");
      return;
    }

    if (parsedWeight !== undefined && (isNaN(parsedWeight) || parsedWeight <= 0)) {
      toast.error("Ingresá un peso válido");
      return;
    }

    if (parsedHeight !== undefined && (isNaN(parsedHeight) || parsedHeight <= 0)) {
      toast.error("Ingresá una estatura válida");
      return;
    }

    if (parsedBodyFat !== undefined && (isNaN(parsedBodyFat) || parsedBodyFat < 0 || parsedBodyFat > 100)) {
      toast.error("Ingresá un % de grasa válido");
      return;
    }

    setIsSaving(true);
    const saved = await clientService.addBodyMetrics(session.user.id, {
      weightKg: parsedWeight,
      heightCm: parsedHeight,
      bodyFatPct: parsedBodyFat,
    });
    setIsSaving(false);

    if (!saved) {
      toast.error("No se pudieron guardar las métricas");
      return;
    }

    toast.success("Métricas guardadas");
    onSaved();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AppBar title="Cargar métricas" onBack={onBack} />

      <div className="px-4 py-6 space-y-5">
        <div className="bg-white rounded-2xl p-4 border border-border shadow-sm space-y-4">
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-2">Peso</label>
            <div className="relative">
              <input
                type="number"
                placeholder="70"
                value={metricWeight}
                onChange={(e) => setMetricWeight(e.target.value)}
                className="w-full h-12 px-4 pr-12 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-[15px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                step="0.1"
                min="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-[15px] font-medium">kg</span>
            </div>
          </div>

          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-2">Estatura</label>
            <div className="relative">
              <input
                type="number"
                placeholder="175"
                value={metricHeight}
                onChange={(e) => setMetricHeight(e.target.value)}
                className="w-full h-12 px-4 pr-12 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-[15px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                step="0.1"
                min="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-[15px] font-medium">cm</span>
            </div>
          </div>

          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-2">% Grasa corporal</label>
            <div className="relative">
              <input
                type="number"
                placeholder="18"
                value={metricBodyFat}
                onChange={(e) => setMetricBodyFat(e.target.value)}
                className="w-full h-12 px-4 pr-12 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-[15px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                step="0.1"
                min="0"
                max="100"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-[15px] font-medium">%</span>
            </div>
          </div>

          <p className="text-[12px] text-gray-500">
            Podés completar solo las métricas que quieras actualizar hoy.
          </p>
        </div>

        <CTAButton fullWidth onClick={handleSaveMetrics} disabled={isSaving}>
          {isSaving ? "Guardando..." : "Guardar métricas"}
        </CTAButton>
      </div>
    </div>
  );
}
