import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { Home, Dumbbell, User } from "lucide-react";

// Context
import { AuthProvider, useAuth } from "./context/AuthContext";

// Components
import { TabBar, TabItem } from "./components/TabBar";

// Screens - Auth
import { LoginScreen } from "./screens/LoginScreen";
import { RegisterScreen } from "./screens/RegisterScreen";

// Screens - Client
import { ClientHomeScreen } from "./screens/client/ClientHomeScreen";
import { ClientWorkoutsScreen } from "./screens/client/ClientWorkoutsScreen";
import { WorkoutDetailScreen } from "./screens/client/WorkoutDetailScreen";
import { ClientAccountScreen } from "./screens/client/ClientAccountScreen";

// Screens - Coach
import { CoachHomeScreen } from "./screens/coach/CoachHomeScreen";
import { CoachClientsScreen } from "./screens/coach/CoachClientsScreen";
import { ClientDetailScreen } from "./screens/coach/ClientDetailScreen";
import { EditPlanScreen } from "./screens/coach/EditPlanScreen";
import { CoachAccountScreen } from "./screens/coach/CoachAccountScreen";
import { CreatePlanScreen, PlanBasicInfo } from "./screens/coach/CreatePlanScreen";
import { AddWorkoutsScreen, WorkoutData } from "./screens/coach/AddWorkoutsScreen";
import { AddExercisesScreen, WorkoutExercises } from "./screens/coach/AddExercisesScreen";
import { AssignPlanScreen } from "./screens/coach/AssignPlanScreen";
import { AttendanceHistoryScreen } from "./screens/coach/AttendanceHistoryScreen";

type ClientTab = "home" | "workouts" | "account";
type CoachTab = "home" | "clients" | "account";

type ClientScreen =
  | { type: "home" }
  | { type: "workouts" }
  | { type: "workout-detail"; workoutId: string }
  | { type: "account" };

type CoachScreen =
  | { type: "home" }
  | { type: "clients" }
  | { type: "client-detail"; clientId: string }
  | { type: "edit-plan"; clientId: string } // 🚨 Modificado: Ahora el EditPlan recuerda de qué cliente venía
  | { type: "account" }
  | { type: "create-plan" }
  | { type: "add-workouts"; planData: PlanBasicInfo }
  | { type: "add-exercises"; planData: PlanBasicInfo; workouts: WorkoutData[] }
  | { type: "assign-plan"; planData: PlanBasicInfo; workouts: WorkoutData[]; workoutExercises: WorkoutExercises[] }
  | { type: "attendance-history"; clientId: string };

type PersistedNavigationState = {
  role: "client" | "coach";
  clientTab: ClientTab;
  clientScreen: ClientScreen;
  coachTab: CoachTab;
  coachScreen: CoachScreen;
};

const NAV_STATE_PREFIX = "spoter_navigation_state_";

const isClientTab = (value: unknown): value is ClientTab =>
  value === "home" || value === "workouts" || value === "account";

const isCoachTab = (value: unknown): value is CoachTab =>
  value === "home" || value === "clients" || value === "account";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isClientScreen = (value: unknown): value is ClientScreen => {
  if (!isObject(value) || typeof value.type !== "string") return false;

  if (value.type === "home" || value.type === "workouts" || value.type === "account") {
    return true;
  }

  if (value.type === "workout-detail") {
    return typeof value.workoutId === "string";
  }

  return false;
};

const isCoachScreen = (value: unknown): value is CoachScreen => {
  if (!isObject(value) || typeof value.type !== "string") return false;

  if (value.type === "home" || value.type === "clients" || value.type === "account" || value.type === "create-plan") {
    return true;
  }

  if (value.type === "client-detail" || value.type === "edit-plan" || value.type === "attendance-history") {
    return typeof value.clientId === "string";
  }

  if (value.type === "add-workouts") {
    return isObject(value.planData);
  }

  if (value.type === "add-exercises") {
    return isObject(value.planData) && Array.isArray(value.workouts);
  }

  if (value.type === "assign-plan") {
    return isObject(value.planData) && Array.isArray(value.workouts) && Array.isArray(value.workoutExercises);
  }

  return false;
};

const isPersistedNavigationState = (value: unknown): value is PersistedNavigationState => {
  if (!isObject(value)) return false;

  const role = value.role;
  if (role !== "client" && role !== "coach") return false;

  return (
    isClientTab(value.clientTab) &&
    isClientScreen(value.clientScreen) &&
    isCoachTab(value.coachTab) &&
    isCoachScreen(value.coachScreen)
  );
};

function AppContent() {
  const { user, isAuthenticated, loading } = useAuth();
  
  // Client state
  const [clientTab, setClientTab] = useState<ClientTab>("home");
  const [clientScreen, setClientScreen] = useState<ClientScreen>({ type: "home" });
  
  // Coach state
  const [coachTab, setCoachTab] = useState<CoachTab>("home");
  const [coachScreen, setCoachScreen] = useState<CoachScreen>({ type: "home" });
  const [hasRestoredNavigation, setHasRestoredNavigation] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setHasRestoredNavigation(false);
      return;
    }

    const navStateKey = `${NAV_STATE_PREFIX}${user.id}`;
    const rawState = localStorage.getItem(navStateKey);

    if (!rawState) {
      setHasRestoredNavigation(true);
      return;
    }

    try {
      const parsedState = JSON.parse(rawState) as unknown;

      if (!isPersistedNavigationState(parsedState) || parsedState.role !== user.role) {
        localStorage.removeItem(navStateKey);
        setHasRestoredNavigation(true);
        return;
      }

      setClientTab(parsedState.clientTab);
      setClientScreen(parsedState.clientScreen);
      setCoachTab(parsedState.coachTab);
      setCoachScreen(parsedState.coachScreen);
    } catch {
      localStorage.removeItem(navStateKey);
    }

    setHasRestoredNavigation(true);
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || !user || !hasRestoredNavigation) return;

    const navStateKey = `${NAV_STATE_PREFIX}${user.id}`;
    const stateToPersist: PersistedNavigationState = {
      role: user.role,
      clientTab,
      clientScreen,
      coachTab,
      coachScreen,
    };

    localStorage.setItem(navStateKey, JSON.stringify(stateToPersist));
  }, [isAuthenticated, user, hasRestoredNavigation, clientTab, clientScreen, coachTab, coachScreen]);

  // Tab items para Cliente
  const clientTabs: TabItem[] = [
    { id: "home", label: "Inicio", icon: Home },
    { id: "workouts", label: "Workout", icon: Dumbbell },
    { id: "account", label: "Mi cuenta", icon: User },
  ];

  // Tab items para Entrenador
  const coachTabs: TabItem[] = [
    { id: "home", label: "Inicio", icon: Home },
    { id: "clients", label: "Clientes", icon: Dumbbell },
    { id: "account", label: "Mi cuenta", icon: User },
  ];

  // Handlers para Cliente
  const handleClientTabChange = (tabId: string) => {
    const tab = tabId as ClientTab;
    setClientTab(tab);
    setClientScreen({ type: tab });
  };

  const navigateToClientWorkouts = () => {
    setClientTab("workouts");
    setClientScreen({ type: "workouts" });
  };

  const navigateToWorkoutDetail = (workoutId: string) => {
    setClientScreen({ type: "workout-detail", workoutId });
  };

  const navigateToClientHome = () => {
    setClientTab("home");
    setClientScreen({ type: "home" });
  };

  const navigateToMetrics = () => {
    setClientTab("account");
    setClientScreen({ type: "account" });
  };

  // Handlers para Entrenador
  const handleCoachTabChange = (tabId: string) => {
    const tab = tabId as CoachTab;
    setCoachTab(tab);
    setCoachScreen({ type: tab });
  };

  const navigateToCoachClients = () => {
    setCoachTab("clients");
    setCoachScreen({ type: "clients" });
  };

  const navigateToClientDetail = (clientId: string) => {
    setCoachScreen({ type: "client-detail", clientId });
  };

  // 🚨 Modificado: Recibe el clientId real para pasarlo a la pantalla de Editar
  const navigateToEditPlan = (clientId: string) => {
    setCoachScreen({ type: "edit-plan", clientId });
  };

  const navigateBackToClients = () => {
    setCoachTab("clients");
    setCoachScreen({ type: "clients" });
  };

  const navigateBackToClientDetail = (clientId: string) => {
    setCoachScreen({ type: "client-detail", clientId });
  };

  // Handlers para flujo de creación de plan
  const navigateToCreatePlan = () => {
    setCoachScreen({ type: "create-plan" });
  };

  const navigateToAddWorkouts = (planData: PlanBasicInfo) => {
    if (planData.exercises && planData.exercises.length > 0) {
      const workout: WorkoutData = {
        id: "t-template-1",
        name: planData.name || "Workout 1",
        description: planData.description || "Workout generado desde template",
        dayNumber: 1,
      };
      setCoachScreen({ type: "assign-plan", planData, workouts: [workout], workoutExercises: [] });
    } else {
      setCoachScreen({ type: "add-workouts", planData });
    }
  };

  const navigateToAddExercises = (planData: PlanBasicInfo, workouts: WorkoutData[]) => {
    setCoachScreen({ type: "add-exercises", planData, workouts });
  };

  const navigateToAssignPlan = (planData: PlanBasicInfo, workouts: WorkoutData[], workoutExercises: WorkoutExercises[] = []) => {
    setCoachScreen({ type: "assign-plan", planData, workouts, workoutExercises });
  };

  const navigateToAttendanceHistory = (clientId: string) => {
    setCoachScreen({ type: "attendance-history", clientId });
  };

  const navigateBackToCoachHome = () => {
    setCoachTab("home");
    setCoachScreen({ type: "home" });
  };

  const isRegisterRoute = new URLSearchParams(window.location.search).get("register") === "true";

  // Si la URL tiene ?register=true, siempre mostramos el registro (sin importar sesión)
  if (isRegisterRoute) {
    return (
      <>
        <RegisterScreen />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-gray-500 animate-pulse font-medium">Cargando sesión...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  if (user?.role === "client") {
    return (
      <div className="min-h-screen bg-background">
        {clientScreen.type === "home" && (
          <ClientHomeScreen
            onNavigateToWorkouts={navigateToClientWorkouts}
            onNavigateToMetrics={navigateToMetrics}
            onWorkoutClick={navigateToWorkoutDetail}
          />
        )}
        
        {clientScreen.type === "workouts" && (
          <ClientWorkoutsScreen
            onBack={navigateToClientHome}
            onWorkoutClick={navigateToWorkoutDetail}
          />
        )}
        
        {clientScreen.type === "workout-detail" && (
          <WorkoutDetailScreen
            workoutId={clientScreen.workoutId}
            onBack={navigateToClientWorkouts}
          />
        )}
        
        {clientScreen.type === "account" && <ClientAccountScreen />}

        {(clientScreen.type === "home" ||
          clientScreen.type === "workouts" ||
          clientScreen.type === "account") && (
          <TabBar
            items={clientTabs}
            activeTab={clientTab}
            onTabChange={handleClientTabChange}
          />
        )}

        <Toaster position="top-center" richColors />
      </div>
    );
  }

  if (user?.role === "coach") {
    return (
      <div className="min-h-screen bg-background">
        {coachScreen.type === "home" && (
          <CoachHomeScreen
            onNavigateToClients={navigateToCoachClients}
            onClientClick={navigateToClientDetail}
            onCreatePlan={navigateToCreatePlan}
          />
        )}
        
        {coachScreen.type === "clients" && (
          <CoachClientsScreen onClientClick={navigateToClientDetail} />
        )}
        
        {coachScreen.type === "client-detail" && (
          <ClientDetailScreen
            clientId={coachScreen.clientId}
            onBack={navigateBackToClients}
            onEditPlan={() => navigateToEditPlan(coachScreen.clientId)}
            onViewAttendance={() => navigateToAttendanceHistory(coachScreen.clientId)}
          />
        )}

        {coachScreen.type === "attendance-history" && (
          <AttendanceHistoryScreen
            clientId={coachScreen.clientId}
            onBack={() => navigateBackToClientDetail(coachScreen.clientId)}
          />
        )}
        
        {coachScreen.type === "edit-plan" && (
          <EditPlanScreen
            clientId={coachScreen.clientId}
            // 🚨 Al volver atrás, usamos el ID que guardamos, no "c1"
            onBack={() => navigateBackToClientDetail(coachScreen.clientId)} 
          />
        )}

        {coachScreen.type === "create-plan" && (
          <CreatePlanScreen
            onBack={navigateBackToCoachHome}
            onContinue={navigateToAddWorkouts}
          />
        )}

        {coachScreen.type === "add-workouts" && (
          <AddWorkoutsScreen
            onBack={navigateToCreatePlan}
            onContinue={(workouts) => navigateToAddExercises(coachScreen.planData, workouts)}
            planData={coachScreen.planData}
          />
        )}

        {coachScreen.type === "add-exercises" && (
          <AddExercisesScreen
            onBack={() => navigateToAddWorkouts(coachScreen.planData)}
            onFinish={(exercises) => navigateToAssignPlan(coachScreen.planData, coachScreen.workouts, exercises)}
            planData={coachScreen.planData}
            workouts={coachScreen.workouts}
          />
        )}

        {coachScreen.type === "assign-plan" && (
          <AssignPlanScreen
            onBack={() => {
              if (coachScreen.planData.exercises && coachScreen.planData.exercises.length > 0) {
                navigateToCreatePlan();
              } else {
                navigateToAddExercises(coachScreen.planData, coachScreen.workouts);
              }
            }}
            onComplete={navigateBackToCoachHome}
            planData={coachScreen.planData}
            workouts={coachScreen.workouts}
            workoutExercises={coachScreen.workoutExercises}
          />
        )}

        {coachScreen.type === "account" && <CoachAccountScreen />}

        {(coachScreen.type === "home" ||
          coachScreen.type === "clients" ||
          coachScreen.type === "account") && (
          <TabBar
            items={coachTabs}
            activeTab={coachTab}
            onTabChange={handleCoachTabChange}
          />
        )}

        <Toaster position="top-center" richColors />
      </div>
    );
  }

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}