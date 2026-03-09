import { useState, useEffect } from "react";
import { Dumbbell, Eye, EyeOff, Search, ChevronRight, ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase";
import { CTAButton } from "../components/CTAButton";
import { toast } from "sonner";

interface Gym {
  id: string;
  name: string;
}

interface Coach {
  id: string;
  full_name: string;
  specialty: string | null;
}

type Step = "form" | "coach";

export function RegisterScreen() {
  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [gymId, setGymId] = useState("");
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Multi-step state
  const [step, setStep] = useState<Step>("form");
  const [userId, setUserId] = useState<string | null>(null);

  // Coach selection state
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [coachSearch, setCoachSearch] = useState("");
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    async function fetchGyms() {
      const { data, error } = await supabase
        .from("gyms")
        .select("id, name")
        .order("name", { ascending: true });
      if (!error && data) setGyms(data);
    }
    fetchGyms();
  }, []);

  useEffect(() => {
    if (step !== "coach") return;
    async function fetchCoaches() {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          coach_details (specialties)
        `)
        .eq("role", "coach")
        .order("full_name", { ascending: true });

      if (!error && data) {
        const mapped: Coach[] = data.map((c: any) => {
          const details = Array.isArray(c.coach_details)
            ? c.coach_details[0]
            : c.coach_details;
          return {
            id: c.id,
            full_name: c.full_name || "Sin nombre",
            specialty: details?.specialties?.[0] ?? null,
          };
        });
        setCoaches(mapped);
      }
    }
    fetchCoaches();
  }, [step]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (!gymId) {
      toast.error("Seleccioná un gimnasio");
      return;
    }

    setIsLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role: "client" } },
      });

      if (signUpError) {
        toast.error(signUpError.message);
        return;
      }

      const newUserId = signUpData.user?.id;
      if (!newUserId) {
        toast.error("No se pudo crear el usuario. Intentá de nuevo.");
        return;
      }

      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: newUserId,
          full_name: fullName,
          role: "client",
          birth_date: birthDate,
          phone: phone,
          gym_id: gymId,
        },
        { onConflict: "id" }
      );

      if (profileError) {
        toast.error("Error al guardar los datos del perfil");
        console.error(profileError);
        return;
      }

      setUserId(newUserId);
      setStep("coach");
    } catch (err) {
      toast.error("Error inesperado. Intentá de nuevo.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignCoach = async () => {
    if (!selectedCoachId || !userId) return;

    setIsAssigning(true);
    try {
      const { error } = await supabase.from("coach_clients").insert({
        coach_id: selectedCoachId,
        client_id: userId,
        status: "active",
      });

      if (error) {
        toast.error("Error al asignar el entrenador");
        console.error(error);
        return;
      }

      toast.success("¡Registro completo! Ya podés iniciar sesión.");
      setTimeout(() => window.location.replace("/"), 1500);
    } catch (err) {
      toast.error("Error inesperado. Intentá de nuevo.");
      console.error(err);
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredCoaches = coaches.filter((c) =>
    c.full_name.toLowerCase().includes(coachSearch.toLowerCase())
  );

  // ─── PASO: ELEGIR ENTRENADOR ─────────────────────────────────────────────────
  if (step === "coach") {
    return (
      <div className="min-h-screen bg-background flex justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-sm flex flex-col bg-background lg:bg-white lg:rounded-3xl lg:shadow-xl lg:border lg:border-border lg:px-10 lg:py-10">
          <div className="h-safe-area-inset-top lg:h-0" />

          {/* Header */}
          <div className="flex flex-col mb-6 mt-10 lg:mt-2">
            <button
              onClick={() => setStep("form")}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-[14px]">Volver</span>
            </button>
            <h1 className="mb-1">Elegí tu entrenador</h1>
            <p className="text-[15px] text-gray-600">
              Buscá y seleccioná a tu profesor
            </p>
          </div>

          {/* Buscador */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={coachSearch}
              onChange={(e) => setCoachSearch(e.target.value)}
              placeholder="Buscar entrenador..."
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Lista de entrenadores */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 mb-6">
            {coaches.length === 0 ? (
              <p className="text-center text-gray-400 text-[14px] py-8">
                Cargando entrenadores...
              </p>
            ) : filteredCoaches.length === 0 ? (
              <p className="text-center text-gray-400 text-[14px] py-8">
                No se encontraron entrenadores
              </p>
            ) : (
              filteredCoaches.map((coach) => {
                const isSelected = selectedCoachId === coach.id;
                return (
                  <button
                    key={coach.id}
                    onClick={() => setSelectedCoachId(coach.id)}
                    className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl border transition-all text-left ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary font-semibold text-[15px]">
                          {coach.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-[15px]">
                          {coach.full_name}
                        </p>
                        {coach.specialty && (
                          <p className="text-[13px] text-gray-500">
                            {coach.specialty}
                          </p>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <ChevronRight className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Botón confirmar */}
          <CTAButton
            variant="primary"
            size="large"
            fullWidth
            disabled={!selectedCoachId || isAssigning}
            onClick={handleAssignCoach}
          >
            {isAssigning ? "Asignando..." : "Confirmar entrenador"}
          </CTAButton>

          <div className="h-safe-area-inset-bottom lg:h-0" />
        </div>
      </div>
    );
  }

  // ─── PASO: FORMULARIO ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex justify-center px-4 sm:px-6 py-8">
      <div className="w-full max-w-sm flex flex-col bg-background lg:bg-white lg:rounded-3xl lg:shadow-xl lg:border lg:border-border lg:px-10 lg:py-10">
        <div className="h-safe-area-inset-top lg:h-0" />

        {/* Logo y título */}
        <div className="flex flex-col items-center mb-8 mt-10 lg:mt-2">
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <Dumbbell className="w-10 h-10 text-white" />
          </div>
          <h1 className="mb-1">Crear cuenta</h1>
          <p className="text-[15px] text-gray-600 text-center">
            Completá tus datos para registrarte
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          {/* Nombre y Apellido en fila */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[14px] mb-1.5 text-gray-700">
                Nombre
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Juan"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-[14px] mb-1.5 text-gray-700">
                Apellido
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Pérez"
                required
              />
            </div>
          </div>

          {/* Fecha de nacimiento */}
          <div>
            <label className="block text-[14px] mb-1.5 text-gray-700">
              Fecha de nacimiento
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-gray-700"
              required
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-[14px] mb-1.5 text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="tu@email.com"
              required
              autoComplete="email"
            />
          </div>

          {/* Celular */}
          <div>
            <label className="block text-[14px] mb-1.5 text-gray-700">
              Celular
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="+54 9 11 1234-5678"
              required
            />
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-[14px] mb-1.5 text-gray-700">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 pr-12 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label className="block text-[14px] mb-1.5 text-gray-700">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-12 px-4 pr-12 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Gimnasio */}
          <div>
            <label className="block text-[14px] mb-1.5 text-gray-700">
              Gimnasio
            </label>
            <select
              value={gymId}
              onChange={(e) => setGymId(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-gray-700 appearance-none"
              required
            >
              <option value="" disabled>
                {gyms.length === 0 ? "Cargando..." : "Seleccioná tu gimnasio"}
              </option>
              {gyms.map((gym) => (
                <option key={gym.id} value={gym.id}>
                  {gym.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-2">
            <CTAButton variant="primary" size="large" fullWidth disabled={isLoading}>
              {isLoading ? "Registrando..." : "Crear cuenta"}
            </CTAButton>
          </div>
        </form>

        <div className="h-safe-area-inset-bottom lg:h-0" />
      </div>
    </div>
  );
}
