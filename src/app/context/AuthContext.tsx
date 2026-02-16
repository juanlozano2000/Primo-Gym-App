import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import type { Session, User } from '@supabase/supabase-js';

type UserRole = 'client' | 'coach';

type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
};

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  user: AuthUser | null;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({ 
  session: null, 
  loading: true,
  // Valores por defecto; se reemplazan en el provider real
  login: async () => false,
  user: null,
  isAuthenticated: false,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  // Configuración: 2 horas en milisegundos
  // (2 horas * 60 minutos * 60 segundos * 1000 ms)
  const INACTIVITY_LIMIT = 2 * 60 * 60 * 1000; 

  const mapSessionToUser = (s: Session | null): AuthUser | null => {
    if (!s) return null;

    const baseUser: User = s.user;
    const email = baseUser.email ?? '';

    // Nombre completo desde metadata, con fallback al prefijo del email
    const metaFullName = (baseUser.user_metadata as any)?.full_name as string | undefined;
    const fullName = metaFullName && metaFullName.trim().length > 0
      ? metaFullName.trim()
      : (email ? email.split('@')[0] : '');

    // 1) Intentar tomar el rol desde user_metadata.role si existe
    const metaRole = (baseUser.user_metadata as any)?.role;

    let role: UserRole;
    if (metaRole === 'client' || metaRole === 'coach') {
      role = metaRole;
    } else {
      // 2) Fallback simple según el email de demo
      if (email.startsWith('entrenador')) {
        role = 'coach';
      } else {
        role = 'client';
      }
    }

    return {
      id: baseUser.id,
      email,
      role,
      fullName,
    };
  };

  useEffect(() => {
    // 1. Lógica de Sesión de Supabase (la que ya tenías)
    const loadUserProfile = async (authUser: AuthUser | null) => {
      if (!authUser) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('uid', authUser.id)
        .single();

      if (!error && data?.full_name) {
        setUser((prev) => prev ? { ...prev, fullName: data.full_name as string } : prev);
      }
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const mappedUser = mapSessionToUser(session);
      setSession(session);
      setUser(mappedUser);
      setLoading(false);

      await loadUserProfile(mappedUser);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const mappedUser = mapSessionToUser(session);
      setSession(session);
      setUser(mappedUser);

      await loadUserProfile(mappedUser);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const {
        data: { session: newSession },
        error,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !newSession) {
        console.error('Error al iniciar sesión:', error);
        return false;
      }

      setSession(newSession);
      setUser(mapSessionToUser(newSession));
      return true;
    } catch (err) {
      console.error('Error inesperado al iniciar sesión:', err);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    console.log('Calling supabase.auth.signOut() (fire-and-forget)');
    // Llamamos a Supabase pero no esperamos a que termine para actualizar el estado local
    supabase.auth.signOut().catch((err) => {
      console.error('Error en supabase.auth.signOut():', err);
    });

    console.log('Clearing local auth state (session/user)');
    setSession(null);
    setUser(null);
  };

  // 2. Lógica de Inactividad (Auto-Logout)
  useEffect(() => {
    // Si no hay sesión, no hacemos nada (no hay nadie a quien echar)
    if (!session) return;

    let timer: NodeJS.Timeout;

    // Función que cierra la sesión
    const handleLogout = async () => {
      console.log("Cerrando sesión por inactividad...");
      await supabase.auth.signOut();
      alert("Tu sesión ha expirado por seguridad."); // Opcional: aviso al usuario
    };

    // Función que reinicia el contador
    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(handleLogout, INACTIVITY_LIMIT);
    };

    // Eventos que consideramos "actividad"
    const events = [
      'mousedown', 'mousemove', 'keydown', 
      'scroll', 'touchstart', 'click'
    ];

    // Escuchar los eventos
    events.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    // Iniciar el timer apenas carga
    resetTimer();

    // Limpieza al desmontar
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [session]); // Se ejecuta cada vez que cambia la sesión (login/logout)

  return (
		<AuthContext.Provider value={{ session, loading, login, user, isAuthenticated: !!session, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);