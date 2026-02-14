import { useState } from "react";
import { Dumbbell } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { CTAButton } from "../components/CTAButton";
import { toast } from "sonner";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast.success("Inicio de sesión exitoso");
      } else {
        toast.error("Credenciales inválidas");
      }
    } catch (error) {
      toast.error("Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background px-6 py-8">
      {/* Safe area superior */}
      <div className="h-safe-area-inset-top" />
      
      {/* Logo y título */}
      <div className="flex flex-col items-center mb-12 mt-16">
        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mb-4">
          <Dumbbell className="w-10 h-10 text-white" />
        </div>
        <h1 className="mb-2">Spotter - Gym App</h1>
        <p className="text-[15px] text-gray-600 text-center">
          Nunca solo, siempre a tu lado
        </p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleLogin} className="flex-1 flex flex-col gap-6">
        <div>
          <label htmlFor="email" className="block text-[14px] mb-2 text-gray-700">
            Email o usuario
          </label>
          <input
            id="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="tu@email.com"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-[14px] mb-2 text-gray-700">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="button"
          className="text-[14px] text-primary font-medium -mt-2 text-left"
        >
          Olvidé mi contraseña
        </button>

        <CTAButton
          variant="primary"
          size="large"
          fullWidth
          disabled={isLoading}
        >
          {isLoading ? "Iniciando..." : "Iniciar sesión"}
        </CTAButton>

        {/* Nota de credenciales */}
        <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-[13px] text-gray-600 mb-3">
            <strong className="text-gray-900">Credenciales de demostración:</strong>
          </p>
          <div className="space-y-2 text-[13px] text-gray-700">
            <div>
              <p className="font-medium">Cliente:</p>
              <p>Email: cliente@primogym.com</p>
              <p>Contraseña: cliente123</p>
            </div>
            <div className="mt-2">
              <p className="font-medium">Entrenador:</p>
              <p>Email: entrenador@primogym.com</p>
              <p>Contraseña: entrenador123</p>
            </div>
          </div>
        </div>

        <p className="text-[13px] text-gray-500 text-center mt-auto">
          Las credenciales son provistas por el administrador del gimnasio
        </p>
      </form>

      {/* Safe area inferior */}
      <div className="h-safe-area-inset-bottom" />
    </div>
  );
}
