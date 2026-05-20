import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { AppBar } from "../../components/AppBar";
import { CTAButton } from "../../components/CTAButton";
import { useAuth } from "../../context/AuthContext";
import { clientService, PersonalRecord } from "../../services/clientService";

interface PersonalRecordsScreenProps {
  onBack: () => void;
  onNavigateToAddPersonalRecord: () => void;
}

function formatDate(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function PersonalRecordsScreen({ onBack, onNavigateToAddPersonalRecord }: PersonalRecordsScreenProps) {
  const { session } = useAuth();
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const totalRecords = records.length;

  useEffect(() => {
    const fetchRecords = async () => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const data = await clientService.getPersonalRecords(session.user.id);
      setRecords(data);
      setIsLoading(false);
    };

    fetchRecords();
  }, [session]);

  const handleDeleteRecord = async (recordId: string) => {
    const confirmed = window.confirm("¿Eliminar este récord personal?");
    if (!confirmed) return;

    setIsDeletingId(recordId);
    const deleted = await clientService.deletePersonalRecord(recordId);

    if (!deleted) {
      toast.error("No se pudo eliminar el récord");
      setIsDeletingId(null);
      return;
    }

    setRecords((current) => current.filter((record) => record.id !== recordId));
    setIsDeletingId(null);
    toast.success("Récord eliminado");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AppBar title="Récords personales" onBack={onBack} />

      <div className="px-4 py-5 space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-border shadow-sm p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] text-gray-500">Historial guardado en tu cuenta</p>
              <h2 className="text-[18px] font-bold text-gray-900 leading-tight">{totalRecords} récord{totalRecords === 1 ? "" : "s"}</h2>
            </div>
            <button
              onClick={onNavigateToAddPersonalRecord}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-white text-[14px] font-medium active:scale-[0.98] transition-transform"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-border shadow-sm">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-20 rounded-2xl bg-gray-100" />
              <div className="h-20 rounded-2xl bg-gray-100" />
              <div className="h-20 rounded-2xl bg-gray-100" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-10 px-2">
              <p className="text-[15px] font-medium text-gray-700">Todavía no tenés récords guardados</p>
              <p className="text-[13px] text-gray-400 mt-1">Agregá tu primer récord para llevar seguimiento</p>
              <div className="mt-4">
                <CTAButton onClick={onNavigateToAddPersonalRecord} fullWidth>
                  Agregar récord
                </CTAButton>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div key={record.id} className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-[15px] leading-tight truncate">{record.exercise_name}</p>
                      <p className="text-[12px] text-gray-500 mt-1">
                        {record.weight} kg × {record.reps} reps
                      </p>
                      <p className="text-[12px] text-gray-400 mt-1">{formatDate(record.created_at)}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="inline-flex items-center justify-center min-w-[56px] h-9 rounded-full bg-primary/10 text-primary text-[15px] font-bold px-3">
                        {record.one_rm}kg
                      </span>
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        disabled={isDeletingId === record.id}
                        className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
