import { useState } from "react";
import { AppBar } from "../../components/AppBar";
import { ClientListItem } from "../../components/ClientListItem";
import { EmptyState } from "../../components/EmptyState";
import { Search, Users } from "lucide-react";
import { coachData } from "../../data/mockData";

interface CoachClientsScreenProps {
  onClientClick: (clientId: string) => void;
}

export function CoachClientsScreen({ onClientClick }: CoachClientsScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "alerts" | "active">("all");
  
  const filters = [
    { id: "all" as const, label: "Todos" },
    { id: "alerts" as const, label: "Con alertas" },
    { id: "active" as const, label: "Activos hoy" },
  ];

  // Filtrar clientes
  const filteredClients = coachData.clients.filter((client) => {
    // Filtro de búsqueda
    if (searchQuery && !client.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filtro de estado
    if (activeFilter === "alerts" && !client.hasAlert) {
      return false;
    }
    if (activeFilter === "active" && !client.lastActivity.includes("Hoy")) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AppBar title="Mis Clientes" />

      <div className="px-4 py-6 space-y-6">
        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar cliente..."
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-white border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-lg text-[14px] font-medium whitespace-nowrap transition-all ${
                activeFilter === filter.id
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700 border border-border"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Contador */}
        <div className="flex items-center gap-2 text-gray-600">
          <Users className="w-5 h-5" />
          <span className="text-[15px]">
            {filteredClients.length} {filteredClients.length === 1 ? "cliente" : "clientes"}
          </span>
        </div>

        {/* Lista de clientes */}
        {filteredClients.length > 0 ? (
          <div className="space-y-3">
            {filteredClients.map((client) => (
              <ClientListItem
                key={client.id}
                name={client.name}
                lastActivity={client.lastActivity}
                adherence={client.adherence}
                hasAlert={client.hasAlert}
                alertMessage={client.alertMessage}
                plan={client.plan}
                onClick={() => onClientClick(client.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No se encontraron clientes"
            description="Intenta ajustar los filtros de búsqueda para encontrar a tus clientes."
          />
        )}
      </div>
    </div>
  );
}