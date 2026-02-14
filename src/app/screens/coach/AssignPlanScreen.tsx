import { useState } from "react";
import { AppBar } from "../../components/AppBar";
import { CTAButton } from "../../components/CTAButton";
import { Search, Check, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { PlanBasicInfo } from "./CreatePlanScreen";
import { coachData } from "../../data/mockData";

interface AssignPlanScreenProps {
  onBack: () => void;
  onComplete: () => void;
  planData: PlanBasicInfo;
}

export function AssignPlanScreen({ onBack, onComplete, planData }: AssignPlanScreenProps) {
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [searchQuery, setSearchQuery] = useState("");

  const clients = coachData.clients;

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleClient = (clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleAssign = () => {
    if (selectedClients.length === 0) {
      toast.error("Seleccioná al menos un cliente");
      return;
    }

    const clientNames = clients
      .filter(c => selectedClients.includes(c.id))
      .map(c => c.name.split(' ')[0])
      .join(", ");

    toast.success(
      `Plan "${planData.name}" asignado a ${selectedClients.length} cliente${selectedClients.length > 1 ? 's' : ''}`,
      {
        description: clientNames,
        duration: 4000,
      }
    );

    onComplete();
  };

  const handleSkip = () => {
    toast.success(`Plan "${planData.name}" creado correctamente`, {
      description: "Podés asignarlo a tus clientes cuando quieras",
      duration: 4000,
    });
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      <AppBar title="Asignar Plan" onBack={onBack} />

      <div className="px-4 py-6 space-y-6">
        {/* Resumen del plan */}
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-4 text-white">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-white mb-1">{planData.name}</h3>
              {planData.description && (
                <p className="text-[13px] text-white/90 mb-2">{planData.description}</p>
              )}
              <div className="flex items-center gap-3 text-[13px] text-white/80">
                <span>{planData.durationWeeks} semanas</span>
                <span>·</span>
                <span>{planData.daysPerWeek} días/semana</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-[13px] font-medium">Fecha de inicio</span>
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full h-11 px-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder:text-white/60 focus:bg-white/30 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Buscador */}
        <div>
          <h3 className="mb-3">Seleccioná los clientes</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full h-12 pl-10 pr-3 rounded-xl bg-white border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Contador de seleccionados */}
        {selectedClients.length > 0 && (
          <div className="bg-success/10 border border-success/30 rounded-xl p-3 flex items-center gap-2">
            <Check className="w-5 h-5 text-success" />
            <span className="text-[14px] text-success font-medium">
              {selectedClients.length} cliente{selectedClients.length > 1 ? 's' : ''} seleccionado{selectedClients.length > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Lista de clientes */}
        <div className="space-y-2">
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => {
              const isSelected = selectedClients.includes(client.id);
              return (
                <button
                  key={client.id}
                  onClick={() => toggleClient(client.id)}
                  className={`w-full bg-white rounded-xl p-4 border-2 transition-all text-left ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-gray-300"
                    }`}>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>

                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium mb-1">{client.name}</h4>
                      <div className="flex items-center gap-2 text-[13px] text-gray-600">
                        <span>Adherencia: {client.adherence}%</span>
                        {client.hasAlert && (
                          <>
                            <span>·</span>
                            <span className="text-warning">{client.alertMessage}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className={`px-3 py-1 rounded-lg text-[12px] font-medium ${
                      client.adherence >= 80
                        ? "bg-success/10 text-success"
                        : client.adherence >= 60
                        ? "bg-warning/10 text-warning"
                        : "bg-error/10 text-error"
                    }`}>
                      {client.adherence}%
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="bg-gray-100 rounded-xl p-8 text-center">
              <p className="text-[14px] text-gray-600">
                No se encontraron clientes con "{searchQuery}"
              </p>
            </div>
          )}
        </div>

        {/* Acciones rápidas */}
        <div>
          <h4 className="text-[14px] text-gray-600 mb-2">Acciones rápidas</h4>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedClients(clients.map(c => c.id))}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-[13px] font-medium hover:border-primary hover:bg-primary/5 transition-all"
            >
              Seleccionar todos
            </button>
            <button
              onClick={() => setSelectedClients([])}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-[13px] font-medium hover:border-primary hover:bg-primary/5 transition-all"
            >
              Deseleccionar todos
            </button>
          </div>
        </div>
      </div>

      {/* Botones fijos */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-white border-t border-border space-y-2">
        <CTAButton
          variant="primary"
          size="large"
          fullWidth
          onClick={handleAssign}
          disabled={selectedClients.length === 0}
        >
          Asignar plan ({selectedClients.length})
        </CTAButton>
        <button
          onClick={handleSkip}
          className="w-full py-3 text-[14px] text-gray-600 font-medium"
        >
          Asignar después
        </button>
      </div>
    </div>
  );
}
