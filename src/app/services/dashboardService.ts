import { supabase } from '../lib/supabase';

// Exportamos las interfaces para poder usarlas en cualquier pantalla
export interface DashboardClient {
  id: string;
  name: string;
  plan: "Basic" | "Premium";
  lastActivity: string;
  isToday: boolean;
  hasAlert: boolean;
  alertMessage?: string;
  adherence: number;
}

export interface DashboardData {
  summary: {
    activeClients: number;
    completedWorkouts: number;
    alerts: number;
  };
  clientsWithAlerts: DashboardClient[];
  activeToday: DashboardClient[];
  allClients: DashboardClient[];
}

const normalizeSuggestionText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const buildSuggestionKey = (workoutId: string, suggestion: string) => {
  const raw = `${workoutId}|${normalizeSuggestionText(suggestion).replace(/\s+/g, ' ')}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
};

const parseClientSuggestions = (notes: string | null | undefined) => {
  if (!notes) return [];
  const marker = 'ajustes del cliente:';
  const lowerNotes = notes.toLowerCase();
  const markerIndex = lowerNotes.indexOf(marker);
  if (markerIndex === -1) return [];

  return notes
    .slice(markerIndex + marker.length)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !line.toLowerCase().startsWith('workout '))
    .filter((line) => !line.startsWith('['))
    .filter((line) => !line.toLowerCase().startsWith('sugerencia aplicada por coach'))
    .filter((line) => !line.toLowerCase().startsWith('sugerencia rechazada por coach'))
    .filter((line) => /:\s*serie\s*\d+/i.test(line));
};

const parseResolvedSuggestionKeys = (feedback: string | null | undefined) => {
  if (!feedback) return new Set<string>();

  const regex = /\[SUGGESTION_STATUS\]\[(?:ACCEPTED|REJECTED)\]\[key:([a-z0-9]+)\]/gi;
  const resolved = new Set<string>();
  let match: RegExpExecArray | null = regex.exec(feedback);
  while (match) {
    resolved.add(match[1]);
    match = regex.exec(feedback);
  }
  return resolved;
};

export const dashboardService = {
  // Función 1: Devuelve todo el paquete de datos del dashboard listo para usar
  async getCoachDashboardData(coachId: string): Promise<DashboardData> {
    try {
      // 1. Buscamos a los clientes activos
      const { data: clientsData, error: clientsErr } = await supabase
        .from('coach_clients')
        .select(`
          client_id,
          profiles!coach_clients_client_id_fkey (
            full_name,
            plan_type
          )
        `)
        .eq('coach_id', coachId)
        .eq('status', 'active');

      if (clientsErr) throw clientsErr;

      const clientIds = clientsData?.map(c => c.client_id) || [];

      // 2. Buscamos las sesiones terminadas
      let sessionsData: any[] = [];
      if (clientIds.length > 0) {
        const { data: sData } = await supabase
          .from('workout_sessions')
          .select('client_id, ended_at, notes')
          .in('client_id', clientIds)
          .not('ended_at', 'is', null)
          .order('ended_at', { ascending: false });
          
        sessionsData = sData || [];
      }

      // 2b. Buscamos assigned_plans para calcular adherencia real por cliente
      let assignedPlansData: any[] = [];
      const todayStr = new Date().toISOString().split('T')[0];
      if (clientIds.length > 0) {
        const { data: apData } = await supabase
          .from('assigned_plans')
          .select('id, client_id, workout_id, is_completed, client_feedback')
          .in('client_id', clientIds)
          .lte('scheduled_date', todayStr);
        assignedPlansData = apData || [];
      }

      // 3. Procesamos las fechas y armamos las alertas
      let completedTodayCount = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const processedClients: DashboardClient[] = clientsData?.map((relation: any) => {
        // Atajamos el perfil por si viene como array u objeto
        const profileData = Array.isArray(relation.profiles) ? relation.profiles[0] : relation.profiles;
        const clientId = relation.client_id;
        const clientName = profileData?.full_name || "Cliente";
        
        const clientSessions = sessionsData.filter(s => s.client_id === clientId);
        const lastSession = clientSessions[0]; 

        let lastActivityText = "Sin registros";
        let hasAlert = false;
        let alertMessage = "";
        let isToday = false;

        if (lastSession) {
          const sessionDate = new Date(lastSession.ended_at);
          
          // Comparar por día calendario (midnights), no por diferencia bruta de ms
          const sessionDay = new Date(sessionDate);
          sessionDay.setHours(0, 0, 0, 0);
          const diffDays = Math.round((today.getTime() - sessionDay.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays === 0) {
            const hours = sessionDate.getHours();
            const mins = sessionDate.getMinutes().toString().padStart(2, '0');
            lastActivityText = `Hoy, ${hours}:${mins}`;
            completedTodayCount++;
            isToday = true;
          } else if (diffDays === 1) {
            lastActivityText = "Ayer";
          } else {
            lastActivityText = `Hace ${diffDays} días`;
            if (diffDays >= 3) {
              hasAlert = true;
              alertMessage = `Sin registros por ${diffDays} días`;
            }
          }
        } else {
          hasAlert = true;
          alertMessage = "Sin registros recientes";
        }

        const clientPendingSuggestions = assignedPlansData
          .filter((plan) => plan.client_id === clientId)
          .reduce((total, plan) => {
            const suggestions = parseClientSuggestions(plan.client_feedback);
            const resolvedKeys = parseResolvedSuggestionKeys(plan.client_feedback);
            const unresolvedCount = suggestions.filter((suggestion) => {
              const key = buildSuggestionKey(plan.workout_id || '', suggestion);
              return !resolvedKeys.has(key);
            }).length;
            return total + unresolvedCount;
          }, 0);

        if (clientPendingSuggestions > 0) {
          hasAlert = true;
          const suggestionMessage = `El cliente ${clientName} tiene ${clientPendingSuggestions} sugerencia${clientPendingSuggestions > 1 ? 's' : ''} pendiente${clientPendingSuggestions > 1 ? 's' : ''}`;
          alertMessage = alertMessage
            ? `${alertMessage} · ${suggestionMessage}`
            : suggestionMessage;
        }

        const rawPlan = profileData?.plan_type || 'basic';
        const formattedPlan = (rawPlan.charAt(0).toUpperCase() + rawPlan.slice(1)) as "Basic" | "Premium";

        // Adherencia = asistencia: de las rutinas programadas que ya pasaron, ¿a cuántas fue?
        const clientPlans = assignedPlansData.filter(p => p.client_id === clientId);
        const totalPlans = clientPlans.length;
        const completedPlans = clientPlans.filter(p => p.is_completed).length;
        const adherence = totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 0;

        return {
          id: clientId,
          name: profileData?.full_name || "Cliente",
          plan: formattedPlan,
          lastActivity: lastActivityText,
          hasAlert,
          alertMessage,
          isToday,
          adherence
        };
      }) || [];

      const alertsCount = processedClients.filter(c => c.hasAlert).length;

      // Devolvemos el objeto perfectamente formateado
      return {
        summary: {
          activeClients: processedClients.length,
          completedWorkouts: completedTodayCount,
          alerts: alertsCount
        },
        clientsWithAlerts: processedClients.filter(c => c.hasAlert),
        activeToday: processedClients.filter(c => c.isToday),
        allClients: processedClients,
      };

    } catch (error) {
      console.error('Error en dashboardService:', error);
      // Si explota, devolvemos un objeto vacío seguro para que no se rompa la pantalla
      return {
        summary: { activeClients: 0, completedWorkouts: 0, alerts: 0 },
        clientsWithAlerts: [],
        activeToday: [],
        allClients: []
      };
    }
  },

  // Función 2: Trae el perfil y currículum del entrenador
  async getCoachProfile(coachId: string) {
    try {
      const { data, error } = await supabase
        .from('coach_details')
        .select('*')
        .eq('id', coachId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching coach profile:', error);
      return null;
    }
  },
  // --- Función 3: Trae el detalle completo de un cliente específico ---
// --- Función 3: Trae el detalle completo de un cliente específico ---
async getClientDetail(clientId: string) {
    // 🚨 ESCUDO ANTI-BUGS: Si el ID viene vacío o es un número de Mock, abortamos sin romper la base
    if (!clientId || clientId === "1" || clientId.length < 10) {
      console.warn("Se intentó buscar un cliente con un ID inválido:", clientId);
      return null; 
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, plan_type, plan_updated_at')
        .eq('id', clientId)
        .single();

      const { data: metricsData } = await supabase
        .from('body_metrics')
        .select('weight_kg, body_fat_pct, date')
        .eq('client_id', clientId)
        .order('date', { ascending: true });

      // 🚨 RELACIONES EXPLÍCITAS para evitar el error PGRST201
      const { data: assignedData } = await supabase
        .from('assigned_plans')
        .select('id, workout_id, scheduled_date, is_completed, client_feedback, workouts!assigned_plans_workout_id_fkey(title, duration_weeks, workout_items(id))')
        .eq('client_id', clientId)
        .order('scheduled_date', { ascending: false });

      const { data: sessionsData } = await supabase
        .from('workout_sessions')
        .select('id, ended_at, notes, workouts!workout_sessions_workout_id_fkey(title)')
        .eq('client_id', clientId)
        .not('ended_at', 'is', null)
        .order('ended_at', { ascending: false })
        .limit(10);

      const weights = metricsData?.map(m => m.weight_kg).filter(Boolean) || [];
      const fats = metricsData?.map(m => m.body_fat_pct).filter(Boolean) || [];
      
      const latestWeight = weights.length > 0 ? weights[weights.length - 1] : 0;
      const latestFat = fats.length > 0 ? fats[fats.length - 1] : 0;

      const metrics = [];
      if (latestWeight > 0) metrics.push({ label: "Peso", value: latestWeight, unit: "kg", history: weights });
      if (latestFat > 0) metrics.push({ label: "% Grasa", value: latestFat, unit: "%", history: fats });

      const assignedPlans = assignedData?.map((ap: any) => {
        const workoutData = Array.isArray(ap.workouts) ? ap.workouts[0] : ap.workouts;
        const exerciseCount = workoutData?.workout_items?.length || 0;
        const estimatedMinutes = exerciseCount > 0 ? exerciseCount * 10 : 45;
        const durationWeeks = workoutData?.duration_weeks ?? 1;
        const endDate = new Date(ap.scheduled_date);
        endDate.setDate(endDate.getDate() + durationWeeks * 7);
        const suggestions = parseClientSuggestions(ap.client_feedback);
        const resolvedKeys = parseResolvedSuggestionKeys(ap.client_feedback);
        const pendingSuggestions = suggestions.filter((suggestion) => {
          const key = buildSuggestionKey(ap.workout_id || '', suggestion);
          return !resolvedKeys.has(key);
        }).length;

        return {
          id: ap.id,
          workoutId: ap.workout_id,
          name: workoutData?.title || "Rutina asignada",
          startDate: ap.scheduled_date,
          endDate: endDate.toISOString().split('T')[0],
          isCompleted: ap.is_completed,
          duration: `${estimatedMinutes} min`,
          clientFeedback: ap.client_feedback || null,
          pendingSuggestions,
        };
      }) || [];

      const recentWorkouts = sessionsData?.map((ws: any) => {
        const notesText = ws.notes || "";
        const normalizedNotes = notesText.toLowerCase();

        return {
          name: Array.isArray(ws.workouts) ? ws.workouts[0]?.title : (ws.workouts?.title || "Rutina"),
          date: ws.ended_at,
          completed: !normalizedNotes.includes("incompleta"),
          hasClientEdits: normalizedNotes.includes("ajustes del cliente"),
          notes: notesText || null
        };
      }) || [];

      // Adherencia = asistencia: solo contamos las rutinas cuya fecha ya pasó
      const todayForAdherence = new Date().toISOString().split('T')[0];
      const pastAssigned = assignedData?.filter((ap: any) => ap.scheduled_date <= todayForAdherence) || [];
      const totalPast = pastAssigned.length;
      const completedPast = pastAssigned.filter((ap: any) => ap.is_completed).length;
      const adherence = totalPast > 0 ? Math.round((completedPast / totalPast) * 100) : 0;

      return {
        id: clientId,
        name: profile?.full_name || "Cliente",
        planType: (profile?.plan_type || "basic") as "basic" | "premium",
        planUpdatedAt: profile?.plan_updated_at ?? null,
        adherence,
        metrics,
        assignedPlans,
        hasPendingSuggestions: assignedPlans.some((plan: any) => (plan.pendingSuggestions || 0) > 0),
        recentWorkouts
      };
    } catch (error) {
      console.error("Error fetching client details:", error);
      return null;
    }
  },

  // --- Función 4: Historial de asistencia real para un cliente ---
  async getClientAttendanceHistory(clientId: string) {
    if (!clientId || clientId.length < 10) return null;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', clientId)
        .single();

      const { data: assignedData } = await supabase
        .from('assigned_plans')
        .select(`
          id, workout_id, scheduled_date, is_completed,
          workouts!assigned_plans_workout_id_fkey(title, duration_weeks)
        `)
        .eq('client_id', clientId)
        .order('scheduled_date', { ascending: true });

      if (!assignedData || assignedData.length === 0) return null;

      // Agrupar assigned_plans en "bloques de plan" (asignaciones consecutivas con <7 días de gap)
      const batches: (typeof assignedData)[] = [];
      let currentBatch = [assignedData[0]];

      for (let i = 1; i < assignedData.length; i++) {
        const prev = new Date(assignedData[i - 1].scheduled_date + 'T12:00:00');
        const curr = new Date(assignedData[i].scheduled_date + 'T12:00:00');
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays <= 7) {
          currentBatch.push(assignedData[i]);
        } else {
          batches.push(currentBatch);
          currentBatch = [assignedData[i]];
        }
      }
      batches.push(currentBatch);

      // Procesar el último bloque (plan actual)
      const batch = batches[batches.length - 1];
      const workoutInfo: any = Array.isArray(batch[0].workouts)
        ? batch[0].workouts[0]
        : batch[0].workouts;

      const durationWeeks = workoutInfo?.duration_weeks || 4;
      const daysPerWeek = batch.length;
      const planName = (workoutInfo?.title || 'Plan').split(' - ')[0].trim();
      const startDateStr = batch[0].scheduled_date;

      // Días de la semana programados (basados en los scheduled_date del plan)
      const scheduledDayIndices = batch.map(ap =>
        new Date(ap.scheduled_date + 'T12:00:00').getDay()
      );

      const workoutIds = batch.map(ap => ap.workout_id);

      // Sesiones reales del cliente para estos workouts
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('ended_at')
        .eq('client_id', clientId)
        .in('workout_id', workoutIds)
        .not('ended_at', 'is', null);

      const sessionDates = new Set<string>();
      sessions?.forEach(s => {
        const d = new Date(s.ended_at);
        sessionDates.add(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        );
      });

      // Calcular el lunes de la semana de inicio
      const startDate = new Date(startDateStr + 'T12:00:00');
      const dow = startDate.getDay();
      const mondayOffset = dow === 0 ? -6 : 1 - dow;
      const firstMonday = new Date(startDate);
      firstMonday.setDate(firstMonday.getDate() + mondayOffset);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
      const weeks: any[] = [];
      let totalAttended = 0;
      const streakDays: boolean[] = [];

      for (let w = 0; w < durationWeeks; w++) {
        const weekMonday = new Date(firstMonday);
        weekMonday.setDate(weekMonday.getDate() + w * 7);

        const weekSunday = new Date(weekMonday);
        weekSunday.setDate(weekSunday.getDate() + 6);
        weekSunday.setHours(0, 0, 0, 0);
        const isWeekPast = weekSunday < today;

        const rawDays: {
          label: string; dateStr: string; dayOfWeek: number;
          attended: boolean; isFuture: boolean; isScheduled: boolean; isToday: boolean;
        }[] = [];

        let weekAttended = 0;

        for (let d = 0; d < 7; d++) {
          const dayDate = new Date(weekMonday);
          dayDate.setDate(dayDate.getDate() + d);
          dayDate.setHours(0, 0, 0, 0);

          const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
          const dayOfWeek = dayDate.getDay();
          const attended = sessionDates.has(dateStr);
          const isFuture = dayDate > today;
          const isScheduled = scheduledDayIndices.includes(dayOfWeek);
          const isToday = dateStr === todayStr;

          if (attended) weekAttended++;

          rawDays.push({ label: dayLabels[d], dateStr, dayOfWeek, attended, isFuture, isScheduled, isToday });
        }

        totalAttended += weekAttended;

        // Determinar estado de cada día
        let missedToMark = isWeekPast ? Math.max(0, daysPerWeek - weekAttended) : 0;

        const days = rawDays.map(rd => {
          let status: 'attended' | 'missed' | 'rest' | 'future';

          if (rd.attended) {
            status = 'attended';
          } else if (rd.isFuture) {
            status = rd.isScheduled ? 'future' : 'rest';
          } else if (missedToMark > 0 && rd.isScheduled) {
            status = 'missed';
            missedToMark--;
          } else {
            status = 'rest';
          }

          // Tracking de racha: solo días programados pasados (hoy solo si asistió)
          if (rd.isScheduled && !rd.isFuture) {
            if (!rd.isToday || rd.attended) {
              streakDays.push(rd.attended);
            }
          }

          return { day: rd.label, date: rd.dateStr, status };
        });

        weeks.push({
          weekNumber: w + 1,
          weekLabel: `Semana ${w + 1}`,
          planName,
          daysPerWeek,
          completedDays: Math.min(weekAttended, daysPerWeek),
          days,
        });
      }

      // Calcular rachas
      let longestStreak = 0;
      let tempStreak = 0;
      for (const a of streakDays) {
        if (a) { tempStreak++; longestStreak = Math.max(longestStreak, tempStreak); }
        else { tempStreak = 0; }
      }

      let currentStreak = 0;
      for (let i = streakDays.length - 1; i >= 0; i--) {
        if (streakDays[i]) currentStreak++;
        else break;
      }

      const totalScheduled = durationWeeks * daysPerWeek;
      const adherence = totalScheduled > 0 ? Math.round((totalAttended / totalScheduled) * 100) : 0;

      return {
        clientName: profile?.full_name || 'Cliente',
        adherence,
        planName,
        durationWeeks,
        daysPerWeek,
        totalDaysAttended: totalAttended,
        totalDaysScheduled: totalScheduled,
        currentStreak,
        longestStreak,
        weeks,
      };
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      return null;
    }
  }
};