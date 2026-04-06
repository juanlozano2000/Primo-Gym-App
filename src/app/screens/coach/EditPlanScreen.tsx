import { AppBar } from "../../components/AppBar";
import { CTAButton } from "../../components/CTAButton";
import { Copy, FileText, Loader2, Trash2, AlertTriangle, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

interface SuggestionItem {
  key: string;
  text: string;
}

interface AssignedPlanData {
  id: string;
  workoutId: string;
  title: string;
  scheduledDate: string;
  isCompleted: boolean;
  exercises: { id: string; name: string; sets: number; restSeconds: number }[];
  clientSuggestions: SuggestionItem[];
  rawFeedback: string | null;
  lastCoachEditAt: string | null;
}

interface UnmatchedSuggestion {
  workoutId: string;
  assignedPlanId?: string;
  date: string;
  items: string[];
  reason: "orphan-plan" | "orphan-workout";
}

interface EditPlanScreenProps {
  clientId: string;
  onBack: () => void;
}

export function EditPlanScreen({ clientId, onBack }: EditPlanScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [plans, setPlans] = useState<AssignedPlanData[]>([]);
  const [clientName, setClientName] = useState("Cliente");
  const [unmatchedSuggestions, setUnmatchedSuggestions] = useState<UnmatchedSuggestion[]>([]);
  const [editingSuggestionKey, setEditingSuggestionKey] = useState<string | null>(null);
  const [editedSuggestionText, setEditedSuggestionText] = useState("");
  const [processingSuggestionKey, setProcessingSuggestionKey] = useState<string | null>(null);
  const [manualEditPlanId, setManualEditPlanId] = useState<string | null>(null);
  const [manualExerciseSets, setManualExerciseSets] = useState<Record<string, string>>({});
  const [manualExerciseRests, setManualExerciseRests] = useState<Record<string, string>>({});
  const [isSavingManualEdits, setIsSavingManualEdits] = useState(false);

  const normalizeText = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const buildSuggestionKey = (workoutId: string, suggestion: string) => {
    const raw = `${workoutId}|${normalizeText(suggestion).replace(/\s+/g, " ")}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i += 1) {
      hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
    }
    return hash.toString(36);
  };

  const parseSuggestionStatusKeys = (feedback: string | null | undefined) => {
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

  const parseLastCoachEditAt = (feedback: string | null | undefined) => {
    if (!feedback) return null;
    const regex = /\[COACH_PLAN_EDIT\]\[at:([^\]]+)\]/gi;
    let lastIso: string | null = null;
    let match: RegExpExecArray | null = regex.exec(feedback);
    while (match) {
      lastIso = match[1];
      match = regex.exec(feedback);
    }
    return lastIso;
  };

  const parseSuggestionSeries = (suggestion: string) => {
    const [exerciseNameRaw, setsRaw] = suggestion.split(":");
    if (!exerciseNameRaw || !setsRaw) return null;

    const exerciseName = exerciseNameRaw.trim();
    const seriesChunks = setsRaw
      .split("|")
      .map((chunk) => chunk.trim())
      .filter(Boolean);

    const parsedSets = seriesChunks
      .map((chunk) => {
        const setMatch = chunk.match(/serie\s*(\d+)\s*\((.*)\)/i);
        if (!setMatch) return null;

        const setNumber = Number(setMatch[1]);
        if (!Number.isFinite(setNumber)) return null;

        const detail = setMatch[2]
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean);

        let repsTarget: number | null = null;
        let weightTarget: number | null = null;
        let rirTarget: number | null = null;

        detail.forEach((part) => {
          const lower = part.toLowerCase();
          if (lower.startsWith("reps")) {
            const value = Number(part.replace(/[^0-9.]/g, ""));
            if (Number.isFinite(value)) repsTarget = value;
          }
          if (lower.startsWith("peso")) {
            const value = Number(part.replace(/[^0-9.]/g, ""));
            if (Number.isFinite(value)) weightTarget = value;
          }
          if (lower.startsWith("rir")) {
            const value = Number(part.replace(/[^0-9]/g, ""));
            if (Number.isFinite(value)) rirTarget = value;
          }
        });

        return {
          setNumber,
          repsTarget,
          weightTarget,
          rirTarget,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.setNumber - b.setNumber);

    if (parsedSets.length === 0) return null;
    return { exerciseName, parsedSets };
  };

  const appendSuggestionStatus = async (
    planId: string,
    suggestionKey: string,
    status: "ACCEPTED" | "REJECTED",
    note: string
  ) => {
    const { data: planData, error: readErr } = await supabase
      .from("assigned_plans")
      .select("client_feedback")
      .eq("id", planId)
      .maybeSingle();

    if (readErr) throw readErr;

    const currentFeedback = planData?.client_feedback || "";
    const statusLine = `[SUGGESTION_STATUS][${status}][key:${suggestionKey}][at:${new Date().toISOString()}]`;
    const statusBlock = [statusLine, note.trim()].filter(Boolean).join("\n");
    const mergedFeedback = [currentFeedback, statusBlock].filter(Boolean).join("\n\n");

    const { error: updateErr } = await supabase
      .from("assigned_plans")
      .update({ client_feedback: mergedFeedback })
      .eq("id", planId);

    if (updateErr) throw updateErr;
  };

  const appendCoachPlanEditAudit = async (planId: string, note: string, atIso: string) => {
    const { data: planData, error: readErr } = await supabase
      .from("assigned_plans")
      .select("client_feedback")
      .eq("id", planId)
      .maybeSingle();

    if (readErr) throw readErr;

    const currentFeedback = planData?.client_feedback || "";
    const auditHeader = `[COACH_PLAN_EDIT][at:${atIso}]`;
    const auditBlock = [auditHeader, note.trim()].filter(Boolean).join("\n");
    const mergedFeedback = [currentFeedback, auditBlock].filter(Boolean).join("\n\n");

    const { error: updateErr } = await supabase
      .from("assigned_plans")
      .update({ client_feedback: mergedFeedback })
      .eq("id", planId);

    if (updateErr) throw updateErr;
    return mergedFeedback;
  };

  const applySuggestionToWorkout = async (plan: AssignedPlanData, suggestionText: string) => {
    const parsed = parseSuggestionSeries(suggestionText);
    if (!parsed) {
      throw new Error("No se pudo interpretar la sugerencia para actualizar el plan");
    }

    const targetExercise = plan.exercises.find((exercise) => {
      const normalizedExercise = normalizeText(exercise.name);
      const normalizedTarget = normalizeText(parsed.exerciseName);
      return normalizedExercise === normalizedTarget || normalizedExercise.includes(normalizedTarget) || normalizedTarget.includes(normalizedExercise);
    });

    if (!targetExercise) {
      throw new Error(`No se encontró el ejercicio \"${parsed.exerciseName}\" dentro del plan`);
    }

    const { error: updateItemErr } = await supabase
      .from("workout_items")
      .update({ sets: parsed.parsedSets.length })
      .eq("id", targetExercise.id);
    if (updateItemErr) throw updateItemErr;

    const { error: deleteSetsErr } = await supabase
      .from("workout_item_sets")
      .delete()
      .eq("workout_item_id", targetExercise.id);
    if (deleteSetsErr) throw deleteSetsErr;

    const setRows = parsed.parsedSets.map((set: any) => ({
      workout_item_id: targetExercise.id,
      set_number: set.setNumber,
      reps_target: set.repsTarget,
      weight_target: set.weightTarget,
      rir_target: set.rirTarget,
    }));

    const { error: insertSetsErr } = await supabase
      .from("workout_item_sets")
      .insert(setRows);
    if (insertSetsErr) throw insertSetsErr;

    setPlans((prev) =>
      prev.map((current) =>
        current.id === plan.id
          ? {
              ...current,
              exercises: current.exercises.map((exercise) =>
                exercise.id === targetExercise.id
                  ? { ...exercise, sets: parsed.parsedSets.length }
                  : exercise
              ),
            }
          : current
      )
    );
  };

  const handleAcceptSuggestion = async (plan: AssignedPlanData, suggestion: SuggestionItem) => {
    const suggestionText =
      editingSuggestionKey === suggestion.key ? editedSuggestionText.trim() : suggestion.text;

    if (!suggestionText) {
      toast.error("La sugerencia no puede quedar vacía");
      return;
    }

    setProcessingSuggestionKey(suggestion.key);
    try {
      await applySuggestionToWorkout(plan, suggestionText);
      await appendSuggestionStatus(
        plan.id,
        suggestion.key,
        "ACCEPTED",
        `Sugerencia aplicada por coach:\n${suggestionText}`
      );

      setPlans((prev) =>
        prev.map((currentPlan) =>
          currentPlan.id === plan.id
            ? {
                ...currentPlan,
                clientSuggestions: currentPlan.clientSuggestions.filter((item) => item.key !== suggestion.key),
              }
            : currentPlan
        )
      );

      if (editingSuggestionKey === suggestion.key) {
        setEditingSuggestionKey(null);
        setEditedSuggestionText("");
      }

      toast.success("Sugerencia aceptada y aplicada al plan");
    } catch (error: any) {
      console.error("Error al aceptar sugerencia:", error);
      toast.error(error?.message || "No se pudo aplicar la sugerencia");
    } finally {
      setProcessingSuggestionKey(null);
    }
  };

  const handleRejectSuggestion = async (plan: AssignedPlanData, suggestion: SuggestionItem) => {
    setProcessingSuggestionKey(suggestion.key);
    try {
      await appendSuggestionStatus(
        plan.id,
        suggestion.key,
        "REJECTED",
        `Sugerencia rechazada por coach:\n${suggestion.text}`
      );

      setPlans((prev) =>
        prev.map((currentPlan) =>
          currentPlan.id === plan.id
            ? {
                ...currentPlan,
                clientSuggestions: currentPlan.clientSuggestions.filter((item) => item.key !== suggestion.key),
              }
            : currentPlan
        )
      );

      if (editingSuggestionKey === suggestion.key) {
        setEditingSuggestionKey(null);
        setEditedSuggestionText("");
      }

      toast.success("Sugerencia rechazada");
    } catch (error) {
      console.error("Error al rechazar sugerencia:", error);
      toast.error("No se pudo rechazar la sugerencia");
    } finally {
      setProcessingSuggestionKey(null);
    }
  };

  const startManualEdit = (plan: AssignedPlanData) => {
    if (manualEditPlanId === plan.id) {
      setManualEditPlanId(null);
      setManualExerciseSets({});
      return;
    }

    const initialValues = plan.exercises.reduce<Record<string, string>>((acc, exercise) => {
      acc[exercise.id] = String(exercise.sets || 1);
      return acc;
    }, {});
    const initialRestValues = plan.exercises.reduce<Record<string, string>>((acc, exercise) => {
      acc[exercise.id] = String(exercise.restSeconds || 60);
      return acc;
    }, {});

    setManualEditPlanId(plan.id);
    setManualExerciseSets(initialValues);
    setManualExerciseRests(initialRestValues);
    setEditingSuggestionKey(null);
    setEditedSuggestionText("");
  };

  const syncWorkoutItemSets = async (workoutItemId: string, targetSets: number) => {
    const { data: existingSets, error: existingErr } = await supabase
      .from("workout_item_sets")
      .select("set_number")
      .eq("workout_item_id", workoutItemId)
      .order("set_number", { ascending: true });

    if (existingErr) throw existingErr;

    const currentSetNumbers = (existingSets || [])
      .map((row: any) => Number(row.set_number))
      .filter((value: number) => Number.isFinite(value));

    const toDelete = currentSetNumbers.filter((setNumber) => setNumber > targetSets);
    if (toDelete.length > 0) {
      const { error: deleteErr } = await supabase
        .from("workout_item_sets")
        .delete()
        .eq("workout_item_id", workoutItemId)
        .in("set_number", toDelete);
      if (deleteErr) throw deleteErr;
    }

    const toInsert: Array<{
      workout_item_id: string;
      set_number: number;
      reps_target: null;
      weight_target: null;
      rir_target: null;
    }> = [];

    for (let setNumber = 1; setNumber <= targetSets; setNumber += 1) {
      if (!currentSetNumbers.includes(setNumber)) {
        toInsert.push({
          workout_item_id: workoutItemId,
          set_number: setNumber,
          reps_target: null,
          weight_target: null,
          rir_target: null,
        });
      }
    }

    if (toInsert.length > 0) {
      const { error: insertErr } = await supabase
        .from("workout_item_sets")
        .insert(toInsert);
      if (insertErr) throw insertErr;
    }
  };

  const handleSaveManualEdits = async (plan: AssignedPlanData) => {
    setIsSavingManualEdits(true);
    try {
      const nextExerciseSets: Record<string, number> = {};
      const nextExerciseRests: Record<string, number> = {};
      const editedLines: string[] = [];

      for (const exercise of plan.exercises) {
        const rawValue = manualExerciseSets[exercise.id] ?? String(exercise.sets || 1);
        const parsedValue = Number(rawValue);
        const normalizedSets = Number.isFinite(parsedValue) ? Math.min(20, Math.max(1, Math.round(parsedValue))) : Math.max(1, exercise.sets || 1);

        const rawRestValue = manualExerciseRests[exercise.id] ?? String(exercise.restSeconds || 60);
        const parsedRest = Number(rawRestValue);
        const normalizedRest = Number.isFinite(parsedRest) ? Math.min(600, Math.max(10, Math.round(parsedRest))) : Math.max(10, exercise.restSeconds || 60);

        nextExerciseSets[exercise.id] = normalizedSets;
        nextExerciseRests[exercise.id] = normalizedRest;
        if (normalizedSets === exercise.sets && normalizedRest === exercise.restSeconds) continue;

        const { error: updateItemErr } = await supabase
          .from("workout_items")
          .update({ sets: normalizedSets, rest_time_seconds: normalizedRest })
          .eq("id", exercise.id);
        if (updateItemErr) throw updateItemErr;

        if (normalizedSets !== exercise.sets) {
          await syncWorkoutItemSets(exercise.id, normalizedSets);
        }

        editedLines.push(
          `${exercise.name}: ${exercise.sets}→${normalizedSets} series, descanso ${exercise.restSeconds}s→${normalizedRest}s`
        );
      }

      const editedAtIso = new Date().toISOString();
      if (editedLines.length > 0) {
        await appendCoachPlanEditAudit(
          plan.id,
          `Edicion manual del coach:\n${editedLines.join("\n")}`,
          editedAtIso
        );
      }

      setPlans((prev) =>
        prev.map((currentPlan) =>
          currentPlan.id === plan.id
            ? {
                ...currentPlan,
                exercises: currentPlan.exercises.map((exercise) => ({
                  ...exercise,
                  sets: nextExerciseSets[exercise.id] ?? exercise.sets,
                  restSeconds: nextExerciseRests[exercise.id] ?? exercise.restSeconds,
                })),
                lastCoachEditAt: editedLines.length > 0 ? editedAtIso : currentPlan.lastCoachEditAt,
              }
            : currentPlan
        )
      );

      setManualEditPlanId(null);
      setManualExerciseSets({});
      setManualExerciseRests({});
      toast.success(editedLines.length > 0 ? "Plan actualizado por el coach" : "No hubo cambios para guardar");
    } catch (error) {
      console.error("Error al guardar edición manual del plan:", error);
      toast.error("No se pudo guardar la edición del plan");
    } finally {
      setIsSavingManualEdits(false);
    }
  };

  const parseClientSuggestions = (notes: string | null | undefined) => {
    if (!notes) return [];

    const marker = "ajustes del cliente:";
    const lowerNotes = notes.toLowerCase();
    const markerIndex = lowerNotes.indexOf(marker);
    if (markerIndex === -1) return [];

    return notes
      .slice(markerIndex + marker.length)
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .filter((line) => !line.toLowerCase().startsWith("workout "))
      .filter((line) => !line.startsWith("["))
      .filter((line) => !line.toLowerCase().startsWith("sugerencia aplicada por coach"))
      .filter((line) => !line.toLowerCase().startsWith("sugerencia rechazada por coach"))
      .filter((line) => /:\s*serie\s*\d+/i.test(line));
  };

  const parseAssignedPlanId = (notes: string | null | undefined) => {
    if (!notes) return null;
    const match = notes.match(/\[assigned_plan_id:([a-f0-9-]+)\]/i);
    return match?.[1] || null;
  };

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true);
      try {
        // Traer nombre del cliente
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", clientId)
          .single();

        if (profile) setClientName(profile.full_name || "Cliente");

        // Traer planes asignados con sus workouts y ejercicios
        const { data, error } = await supabase
          .from("assigned_plans")
          .select(`
            id,
            workout_id,
            scheduled_date,
            is_completed,
            client_feedback,
            workouts (
              title,
              workout_items (
                id,
                sets,
                rest_time_seconds,
                exercises (name)
              )
            )
          `)
          .eq("client_id", clientId)
          .order("scheduled_date", { ascending: true });

        if (error) throw error;

        const { data: sessionsData, error: sessionsErr } = await supabase
          .from("workout_sessions")
          .select("workout_id, notes, ended_at")
          .eq("client_id", clientId)
          .not("ended_at", "is", null)
          .order("ended_at", { ascending: false });

        if (sessionsErr) throw sessionsErr;

        const suggestionsByWorkout = new Map<string, string[]>();
        const suggestionsByPlanId = new Map<string, string[]>();
        const parsedSessionSuggestions: UnmatchedSuggestion[] = [];
        (sessionsData || []).forEach((session: any) => {
          const parsed = parseClientSuggestions(session.notes);
          if (parsed.length === 0) return;
          const assignedPlanId = parseAssignedPlanId(session.notes);

          const previous = suggestionsByWorkout.get(session.workout_id) || [];
          const merged = [...previous];
          parsed.forEach((item) => {
            if (!merged.includes(item)) {
              merged.push(item);
            }
          });
          suggestionsByWorkout.set(session.workout_id, merged);

          if (assignedPlanId) {
            const planPrev = suggestionsByPlanId.get(assignedPlanId) || [];
            const planMerged = [...planPrev];
            parsed.forEach((item) => {
              if (!planMerged.includes(item)) {
                planMerged.push(item);
              }
            });
            suggestionsByPlanId.set(assignedPlanId, planMerged);
          }

          parsedSessionSuggestions.push({
            workoutId: session.workout_id,
            assignedPlanId: assignedPlanId || undefined,
            date: session.ended_at,
            items: parsed,
            reason: "orphan-workout",
          });
        });

        const formatted: AssignedPlanData[] = (data || []).map((ap: any) => {
          const w = Array.isArray(ap.workouts) ? ap.workouts[0] : ap.workouts;
          const items = w?.workout_items || [];
          const resolvedSuggestionKeys = parseSuggestionStatusKeys(ap.client_feedback);
          const fromPlanFeedback = parseClientSuggestions(ap.client_feedback);
          const fromPlanId = suggestionsByPlanId.get(ap.id) || [];
          const fromWorkout = suggestionsByWorkout.get(ap.workout_id) || [];
          const suggestionsMap = new Map<string, string>();
          [...fromPlanFeedback, ...fromPlanId, ...fromWorkout].forEach((suggestionText) => {
            const key = buildSuggestionKey(ap.workout_id, suggestionText);
            if (!resolvedSuggestionKeys.has(key) && !suggestionsMap.has(key)) {
              suggestionsMap.set(key, suggestionText);
            }
          });

          const mergedSuggestions: SuggestionItem[] = Array.from(suggestionsMap.entries()).map(([key, text]) => ({ key, text }));
          return {
            id: ap.id,
            workoutId: ap.workout_id,
            title: w?.title || "Rutina",
            scheduledDate: ap.scheduled_date,
            isCompleted: ap.is_completed,
            exercises: items.map((item: any) => ({
              id: item.id,
              name: Array.isArray(item.exercises) ? item.exercises[0]?.name : (item.exercises?.name || "Ejercicio"),
              sets: item.sets || 0,
              restSeconds: item.rest_time_seconds || 60,
            })),
            clientSuggestions: mergedSuggestions,
            rawFeedback: ap.client_feedback || null,
            lastCoachEditAt: parseLastCoachEditAt(ap.client_feedback),
          };
        });

        setPlans(formatted);

        const assignedPlanIds = new Set((data || []).map((ap: any) => ap.id));
        const assignedWorkoutIds = new Set((data || []).map((ap: any) => ap.workout_id));
        const unmatched = parsedSessionSuggestions
          .filter((entry) => {
            if (entry.assignedPlanId && !assignedPlanIds.has(entry.assignedPlanId)) {
              entry.reason = "orphan-plan";
              return true;
            }
            if (!assignedWorkoutIds.has(entry.workoutId)) {
              entry.reason = "orphan-workout";
              return true;
            }
            return false;
          })
          .slice(0, 3);
        setUnmatchedSuggestions(unmatched);
      } catch (err) {
        console.error("Error cargando planes:", err);
        toast.error("Error al cargar los planes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [clientId]);

  const handleDeleteAssignment = async (assignmentId: string) => {
    const { error } = await supabase
      .from("assigned_plans")
      .delete()
      .eq("id", assignmentId);

    if (error) {
      toast.error("Error al eliminar la asignación");
    } else {
      setPlans((prev) => prev.filter((p) => p.id !== assignmentId));
      toast.success("Asignación eliminada");
    }
  };

  const handleDuplicate = async (plan: AssignedPlanData) => {
    // Duplicar la asignación con fecha de mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from("assigned_plans")
      .insert({
        client_id: clientId,
        workout_id: plan.workoutId,
        scheduled_date: tomorrow.toISOString().split("T")[0],
        is_completed: false,
      })
      .select("id")
      .single();

    if (error) {
      toast.error("Error al duplicar");
    } else if (data) {
      setPlans((prev) => [
        ...prev,
        { ...plan, id: data.id, scheduledDate: tomorrow.toISOString().split("T")[0], isCompleted: false },
      ]);
      toast.success("Plan duplicado para mañana");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <AppBar title="Editar Plan" onBack={onBack} />
        <div className="px-4 py-6 flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AppBar title={`Plan de ${clientName}`} onBack={onBack} />

      <div className="px-4 py-6 space-y-6">
        {unmatchedSuggestions.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-amber-900">Sugerencias del cliente en rutinas anteriores</p>
                <p className="text-[12px] text-amber-800">Estas sugerencias se guardaron en sesiones que no coinciden con las rutinas asignadas actualmente.</p>
              </div>
            </div>
            <div className="space-y-2">
              {unmatchedSuggestions.map((entry, index) => (
                <div key={`${entry.workoutId}-${index}`} className="rounded-lg bg-white/80 border border-amber-100 p-3">
                  <p className="text-[11px] text-gray-600 mb-1">
                    Workout: {entry.workoutId.slice(0, 8)} • {new Date(entry.date).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </p>
                  <p className="text-[11px] text-amber-800 mb-2">
                    {entry.reason === "orphan-plan"
                      ? "Asignada a un plan anterior que ya no existe"
                      : "Pertenece a una rutina que ya no está asignada"}
                  </p>
                  {entry.items.map((item, itemIndex) => (
                    <p key={itemIndex} className="text-[13px] text-amber-950">{item}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {plans.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-dashed border-border text-center">
            <p className="text-[15px] text-gray-500">Este cliente no tiene rutinas asignadas</p>
            <p className="text-[13px] text-gray-400 mt-1">Creá un plan y asignalo desde la pantalla principal</p>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-2xl p-4 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{plan.title}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startManualEdit(plan)}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
                        manualEditPlanId === plan.id
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                      aria-label="Editar plan manualmente"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${
                      plan.isCompleted
                        ? "bg-success/10 text-success"
                        : "bg-primary/10 text-primary"
                    }`}>
                      {plan.isCompleted ? "Completado" : "Pendiente"}
                    </span>
                  </div>
                </div>

                <p className="text-[13px] text-gray-500 mb-3">
                  Programado: {new Date(plan.scheduledDate).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
                {plan.lastCoachEditAt && (
                  <p className="text-[11px] text-gray-500 mb-2">
                    Ultima edicion del coach: {new Date(plan.lastCoachEditAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })} {new Date(plan.lastCoachEditAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}

                {plan.exercises.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {plan.exercises.map((ex) => (
                      <div key={ex.id} className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg">
                        <span className="text-[14px] text-gray-700">{ex.name}</span>
                        <span className="text-[13px] text-gray-500">{ex.sets} series • {ex.restSeconds}s descanso</span>
                      </div>
                    ))}
                  </div>
                )}

                {manualEditPlanId === plan.id && (
                  <div className="mb-3 rounded-xl border border-primary/25 bg-primary/5 p-3">
                    <div className="mb-2">
                      <p className="text-[13px] font-semibold text-primary">Edición manual del coach</p>
                      <p className="text-[12px] text-gray-600">Ajustá la cantidad de series por ejercicio y guardá los cambios.</p>
                    </div>
                    <div className="space-y-2">
                      {plan.exercises.map((exercise) => (
                        <div key={exercise.id} className="flex items-center justify-between rounded-lg border border-primary/10 bg-white px-3 py-2">
                          <span className="text-[13px] text-gray-800">{exercise.name}</span>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min={1}
                              max={20}
                              value={manualExerciseSets[exercise.id] ?? String(exercise.sets)}
                              onChange={(event) =>
                                setManualExerciseSets((prev) => ({
                                  ...prev,
                                  [exercise.id]: event.target.value,
                                }))
                              }
                              className="w-16 rounded-md border border-gray-300 px-2 py-1 text-[13px] text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <span className="text-[12px] text-gray-500">series</span>

                            <input
                              type="number"
                              min={10}
                              max={600}
                              step={5}
                              value={manualExerciseRests[exercise.id] ?? String(exercise.restSeconds || 60)}
                              onChange={(event) =>
                                setManualExerciseRests((prev) => ({
                                  ...prev,
                                  [exercise.id]: event.target.value,
                                }))
                              }
                              className="w-20 rounded-md border border-gray-300 px-2 py-1 text-[13px] text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <span className="text-[12px] text-gray-500">seg de descanso</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => handleSaveManualEdits(plan)}
                        disabled={isSavingManualEdits}
                        className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-white px-3 py-1.5 text-[12px] font-medium text-primary hover:bg-primary/10 disabled:opacity-60"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Guardar cambios
                      </button>
                      <button
                        onClick={() => {
                          setManualEditPlanId(null);
                          setManualExerciseSets({});
                          setManualExerciseRests({});
                        }}
                        disabled={isSavingManualEdits}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {plan.clientSuggestions.length > 0 && (
                  <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[13px] font-semibold text-amber-900">Mejoras propuestas por el cliente</p>
                        <p className="text-[12px] text-amber-800">Revisalas antes de editar la rutina.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {plan.clientSuggestions.map((suggestion) => (
                        <div key={suggestion.key} className="rounded-lg bg-white/70 px-3 py-2 text-[13px] text-amber-950 border border-amber-100">
                          {editingSuggestionKey === suggestion.key ? (
                            <textarea
                              value={editedSuggestionText}
                              onChange={(event) => setEditedSuggestionText(event.target.value)}
                              className="w-full min-h-[72px] rounded-md border border-amber-200 bg-white px-2 py-1.5 text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
                            />
                          ) : (
                            <p>{suggestion.text}</p>
                          )}

                          <div className="mt-2 flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (editingSuggestionKey === suggestion.key) {
                                  setEditingSuggestionKey(null);
                                  setEditedSuggestionText("");
                                  return;
                                }
                                setEditingSuggestionKey(suggestion.key);
                                setEditedSuggestionText(suggestion.text);
                              }}
                              disabled={processingSuggestionKey === suggestion.key}
                              className="inline-flex items-center gap-1 rounded-md border border-amber-300 px-2 py-1 text-[12px] font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-60"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              {editingSuggestionKey === suggestion.key ? "Cancelar edición" : "Editar"}
                            </button>

                            <button
                              onClick={() => handleAcceptSuggestion(plan, suggestion)}
                              disabled={processingSuggestionKey === suggestion.key}
                              className="inline-flex items-center gap-1 rounded-md border border-green-300 px-2 py-1 text-[12px] font-medium text-green-700 hover:bg-green-50 disabled:opacity-60"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Aceptar
                            </button>

                            <button
                              onClick={() => handleRejectSuggestion(plan, suggestion)}
                              disabled={processingSuggestionKey === suggestion.key}
                              className="inline-flex items-center gap-1 rounded-md border border-red-300 px-2 py-1 text-[12px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                            >
                              <X className="w-3.5 h-3.5" />
                              Rechazar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleDuplicate(plan)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Duplicar
                  </button>
                  <button
                    onClick={() => handleDeleteAssignment(plan.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Nota informativa */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <FileText className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
            <p className="text-[13px] text-blue-800 leading-relaxed">
              Para agregar nuevas rutinas, usá "Crear plan" desde la pantalla principal y asignalo a este cliente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
