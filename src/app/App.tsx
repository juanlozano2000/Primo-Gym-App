import { useState } from "react";
import { Toaster } from "sonner";
import { Home, Dumbbell, User } from "lucide-react";

// Context
import { AuthProvider, useAuth } from "./context/AuthContext";

// Components
import { TabBar, TabItem } from "./components/TabBar";

// Screens - Auth
import { LoginScreen } from "./screens/LoginScreen";

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
  | { type: "edit-plan" }
  | { type: "account" }
  | { type: "create-plan" }
  | { type: "add-workouts"; planData: PlanBasicInfo }
  | { type: "add-exercises"; planData: PlanBasicInfo; workouts: WorkoutData[] }
  | { type: "assign-plan"; planData: PlanBasicInfo; workouts: WorkoutData[] };

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  
  // Client state
  const [clientTab, setClientTab] = useState<ClientTab>("home");
  const [clientScreen, setClientScreen] = useState<ClientScreen>({ type: "home" });
  
  // Coach state
  const [coachTab, setCoachTab] = useState<CoachTab>("home");
  const [coachScreen, setCoachScreen] = useState<CoachScreen>({ type: "home" });

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

  const navigateToEditPlan = () => {
    setCoachScreen({ type: "edit-plan" });
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
    setCoachScreen({ type: "add-workouts", planData });
  };

  const navigateToAddExercises = (planData: PlanBasicInfo, workouts: WorkoutData[]) => {
    setCoachScreen({ type: "add-exercises", planData, workouts });
  };

  const navigateToAssignPlan = (planData: PlanBasicInfo, workouts: WorkoutData[]) => {
    setCoachScreen({ type: "assign-plan", planData, workouts });
  };

  const navigateBackToCoachHome = () => {
    setCoachTab("home");
    setCoachScreen({ type: "home" });
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  // Cliente role
  if (user?.role === "client") {
    return (
      <div className="min-h-screen bg-background">
        {/* Renderizar pantalla según estado */}
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

        {/* Tab bar solo en pantallas principales */}
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

  // Entrenador role
  if (user?.role === "coach") {
    return (
      <div className="min-h-screen bg-background">
        {/* Renderizar pantalla según estado */}
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
            onEditPlan={navigateToEditPlan}
          />
        )}
        
        {coachScreen.type === "edit-plan" && (
          <EditPlanScreen
            onBack={() => navigateBackToClientDetail("c1")}
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
            onFinish={() => navigateToAssignPlan(coachScreen.planData, coachScreen.workouts)}
            planData={coachScreen.planData}
            workouts={coachScreen.workouts}
          />
        )}

        {coachScreen.type === "assign-plan" && (
          <AssignPlanScreen
            onBack={() => navigateToAddExercises(coachScreen.planData, coachScreen.workouts)}
            onComplete={navigateBackToCoachHome}
            planData={coachScreen.planData}
          />
        )}
        
        {coachScreen.type === "account" && <CoachAccountScreen />}

        {/* Tab bar solo en pantallas principales */}
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