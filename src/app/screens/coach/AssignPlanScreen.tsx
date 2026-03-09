import { useState, useEffect } from "react";
import { AppBar } from "../../components/AppBar";
import { CTAButton } from "../../components/CTAButton";
import { Search, Check, Calendar, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PlanBasicInfo } from "./CreatePlanScreen";
import { WorkoutData } from "./AddWorkoutsScreen";
import { WorkoutExercises } from "./AddExercisesScreen";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { planService } from "../../services/planService";

interface AssignPlanScreenProps {
  onBack: () => void;
  onComplete: () => void;
  planData: PlanBasicInfo;
  // 🚨 Recibimos los datos de los pasos anteriores
  workouts?: WorkoutData[];
  workoutExercises?: WorkoutExercises[];
}

interface RealClient {
  id: string;
  name: string;
  adherence: number;
  hasAlert: boolean;
  alertMessage?: string;
}

export function AssignPlanScreen({ 
  onBack, 
  onComplete, 
  planData,
  workouts = [],
  workoutExercises = []
}: AssignPlanScreenProps) {
  const { user } = useAuth();
  
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [searchQuery, setSearchQuery] = useState("");
  
  // Estados para datos reales
  const [dbClients, setDbClients] = useState<RealClient[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const hasExercises = workouts.length > 0;

// 1. Cargar clientes reales del coach
useEffect(() => {
  const fetchClients = async () => {
    if (!user?.id) return;
    try {
      // 🚨 ACÁ ESTÁ EL ARREGLO: Le decimos exactamente qué relación (Foreign Key) usar
      const { data, error } = await supabase
        .from('coach_clients')
        .select(`
          client_id,
          profiles!coach_clients_client_id_fkey(full_name)
        `)
        .eq('coach_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      const formattedClients = data?.map((c: any) => {
        // Atajamos el perfil por si viene como Array u Objeto
        const profileData = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
        
        return {
          id: c.client_id,
          name: profileData?.full_name || "Cliente",
          adherence: 85, 
          hasAlert: false,
        };
      }) || [];

      setDbClients(formattedClients);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      toast.error("Error al cargar la lista de clientes");
    } finally {
      setIsLoadingClients(false);
    }
  };

  fetchClients();
}, [user?.id]);

  const filteredClients = dbClients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleClient = (clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  // 2. Función core que guarda en la base de datos
  const savePlanToDatabase = async (assignToSelected: boolean) => {
    if (!user?.id) return;
    setIsSaving(true);
    
    try {
      // Recorremos cada workout (Día 1, Día 2, etc.) que armó el coach
      for (let i = 0; i < workouts.length; i++) {
        const workout = workouts[i];
        const exercisesForWorkout = workoutExercises.find(we => we.workoutId === workout.id)?.exercises || [];
        
        // Armamos el objeto que nuestro servicio entiende
        const payload = {
          title: `${planData.name} - ${workout.name}`, // Ej: "Plan Verano - Pecho"
          description: workout.description || planData.description || "",
          isTemplate: true,
          durationWeeks: planData.durationWeeks,
          items: exercisesForWorkout.map(ex => ({
            exerciseId: ex.exerciseId, // Si está vacío, el servicio lo crea
            name: ex.name,
            sets: ex.totalSets,
            restSeconds: parseInt(ex.rest) || 60,
            seriesData: ex.seriesData.map(s => ({
              reps: s.reps,
              weight: s.weight,
              time: s.time,
              rir: s.rir
            }))
          }))
        };

        // Guardamos la rutina en la BD
        const result = await planService.createWorkoutPlan(user.id, payload);

        // Si hay que asignarlo a clientes, lo agendamos
        if (result.success && result.workoutId && assignToSelected && selectedClients.length > 0) {
          // Asumimos que los workouts se agendan en días consecutivos para simplificar
          const scheduleDate = new Date(startDate);
          scheduleDate.setDate(scheduleDate.getDate() + i); 
          const formattedDate = scheduleDate.toISOString().split('T')[0];

          for (const clientId of selectedClients) {
            await planService.assignPlanToClient(clientId, result.workoutId, formattedDate);
          }
        }
      }

      // Finalizamos el proceso visualmente
      if (assignToSelected) {
        const clientNames = dbClients
          .filter(c => selectedClients.includes(c.id))
          .map(c => c.name.split(' ')[0])
          .join(", ");
        
        toast.success(`Plan asignado a ${selectedClients.length} cliente(s)`, { description: clientNames });
      } else {
        toast.success(`Plan "${planData.name}" creado correctamente`, { description: "Guardado en tus templates." });
      }

      onComplete();

    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error("Ocurrió un error al guardar el plan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssign = () => {
    if (selectedClients.length === 0) {
      toast.error("Seleccioná al menos un cliente");
      return;
    }
    savePlanToDatabase(true);
  };

  const handleSkip = () => {
    savePlanToDatabase(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      <AppBar title="Asignar Plan" onBack={onBack} />

      <div className="px-4 py-6 space-y-6">
        {hasExercises ? (
          <>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-primary rounded-full" />
              <div className="flex-1 h-1 bg-primary rounded-full" />
            </div>
            <div>
              <p className="text-[13px] text-gray-600 mb-1">Paso 2 de 2</p>
              <h2 className="text-[20px] font-semibold">Asignar Plan</h2>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-primary rounded-full" />
              <div className="flex-1 h-1 bg-primary rounded-full" />
              <div className="flex-1 h-1 bg-primary rounded-full" />
            </div>
            <div>
              <p className="text-[13px] text-gray-600 mb-1">Paso 3 de 3</p>
              <h2 className="text-[20px] font-semibold">Asignar Plan</h2>
            </div>
          </>
        )}

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
                <span>{planData.daysPerWeek} días/sem</span>
                {hasExercises && (
                  <>
                    <span>·</span>
                    <span>{workouts.length} rutinas</span>
                  </>
                )}
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

        {selectedClients.length > 0 && (
          <div className="bg-success/10 border border-success/30 rounded-xl p-3 flex items-center gap-2">
            <Check className="w-5 h-5 text-success" />
            <span className="text-[14px] text-success font-medium">
              {selectedClients.length} cliente{selectedClients.length > 1 ? 's' : ''} seleccionado{selectedClients.length > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Lista de clientes (Ahora desde la DB) */}
        <div className="space-y-2">
          {isLoadingClients ? (
            <div className="text-center py-8 text-gray-500 text-sm">Cargando clientes...</div>
          ) : filteredClients.length > 0 ? (
            filteredClients.map((client) => {
              const isSelected = selectedClients.includes(client.id);
              return (
                <button
                  key={client.id}
                  onClick={() => toggleClient(client.id)}
                  className={`w-full bg-white rounded-xl p-4 border-2 transition-all text-left ${
                    isSelected ? "border-primary bg-primary/5" : "border-border hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isSelected ? "border-primary bg-primary" : "border-gray-300"
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
                      </div>
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

        {!isLoadingClients && dbClients.length > 0 && (
          <div>
            <h4 className="text-[14px] text-gray-600 mb-2">Acciones rápidas</h4>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedClients(dbClients.map(c => c.id))}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-[13px] font-medium hover:border-primary hover:bg-primary/5 transition-all"
              >
                Todos
              </button>
              <button
                onClick={() => setSelectedClients([])}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-[13px] font-medium hover:border-primary hover:bg-primary/5 transition-all"
              >
                Ninguno
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-white border-t border-border space-y-2">
        <CTAButton
          variant="primary"
          size="large"
          fullWidth
          onClick={handleAssign}
          disabled={selectedClients.length === 0 || isSaving}
        >
          {isSaving ? (
            <div className="flex items-center gap-2 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" /> Guardando...
            </div>
          ) : (
            `Asignar plan (${selectedClients.length})`
          )}
        </CTAButton>
        <button
          onClick={handleSkip}
          disabled={isSaving}
          className="w-full py-3 text-[14px] text-gray-600 font-medium disabled:opacity-50"
        >
          Guardar sin asignar
        </button>
      </div>
    </div>
  );
}