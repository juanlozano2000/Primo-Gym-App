import { useState, useEffect } from "react";
import { AppBar } from "../../components/AppBar";
import { ClientListItem } from "../../components/ClientListItem";
import { EmptyState } from "../../components/EmptyState";
import { Search, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
// 🚨 Importamos nuestro servicio y la interfaz
import { dashboardService, DashboardClient } from "../../services/dashboardService";

interface CoachClientsScreenProps {
  onClientClick: (clientId: string) => void;
}

export function CoachClientsScreen({ onClientClick }: CoachClientsScreenProps) {
  const { user } = useAuth();
  
  const [clients, setClients] = useState<DashboardClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "alerts" | "active">("all");
  
  const filters = [
    { id: "all" as const, label: "Todos" },
    { id: "alerts" as const, label: "Con alertas" },
    { id: "active" as const, label: "Activos hoy" },
  ];

  // 🚨 Buscamos los datos reales al abrir la pantalla
  useEffect(() => {
    const fetchClients = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      const data = await dashboardService.getCoachDashboardData(user.id);
      // Guardamos la lista completa de clientes que agregamos en el Paso 1
      setClients(data.allClients || []);
      setIsLoading(false);
    };

    fetchClients();
  }, [user?.id]);

  // Filtrar clientes usando los datos de la BD
  const filteredClients = clients.filter((client) => {
    // Filtro de búsqueda
    if (searchQuery && !client.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filtro de estado
    if (activeFilter === "alerts" && !client.hasAlert) {
      return false;
    }
    // 🚨 Usamos la propiedad booleana isToday que calcula nuestro servicio
    if (activeFilter === "active" && !client.isToday) {
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
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-lg text-[14px] font-medium whitespace-nowrap transition-all ${
                activeFilter === filter.id
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white text-gray-700 border border-border hover:bg-gray-50"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Contador */}
        {!isLoading && (
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="w-5 h-5" />
            <span className="text-[15px]">
              {filteredClients.length} {filteredClients.length === 1 ? "cliente" : "clientes"}
            </span>
          </div>
        )}

        {/* Lista de clientes o Estados */}
        {isLoading ? (
          // Skeleton loader mientras carga
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-border flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
                <div className="w-12 h-6 bg-gray-200 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredClients.length > 0 ? (
          // Lista real
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
          // Empty State
          <EmptyState
            icon={Users}
            title={clients.length === 0 ? "Todavía no tenés clientes" : "No se encontraron clientes"}
            description={
              clients.length === 0 
                ? "Cuando invites clientes, aparecerán en esta lista." 
                : "Intenta ajustar los filtros de búsqueda."
            }
          />
        )}
      </div>
    </div>
  );
}