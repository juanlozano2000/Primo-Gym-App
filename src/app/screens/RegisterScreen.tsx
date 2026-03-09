import { useState, useEffect } from "react";
import { Dumbbell, Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";
import { CTAButton } from "../components/CTAButton";
import { toast } from "sonner";

interface Gym {
  id: string;
  name: string;
}

export function RegisterScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gymId, setGymId] = useState("");
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

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

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });

      if (signUpError) {
        toast.error(signUpError.message);
        return;
      }

      const userId = signUpData.user?.id;
      if (!userId) {
        toast.error("No se pudo crear el usuario. Intentá de nuevo.");
        return;
      }

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        full_name: fullName,
        role: "client",
        birth_date: birthDate,
        gym_id: gymId,
      }, { onConflict: "id" });

      if (profileError) {
        toast.error("Error al guardar los datos del perfil");
        console.error(profileError);
        return;
      }

      setRegistered(true);
    } catch (err) {
      toast.error("Error inesperado. Intentá de nuevo.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-background flex justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-sm flex flex-col items-center justify-center gap-6 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center">
            <Dumbbell className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-semibold">¡Registro exitoso!</h1>
          <p className="text-gray-600 text-[15px]">
            Tu cuenta fue creada. Revisá tu email para confirmar tu dirección y
            luego iniciá sesión desde la app.
          </p>
        </div>
      </div>
    );
  }

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
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
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
                {showConfirm ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
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
            <CTAButton
              variant="primary"
              size="large"
              fullWidth
              disabled={isLoading}
            >
              {isLoading ? "Registrando..." : "Crear cuenta"}
            </CTAButton>
          </div>
        </form>

        <div className="h-safe-area-inset-bottom lg:h-0" />
      </div>
    </div>
  );
}
