import { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  login: async () => false,
  user: null,
  isAuthenticated: false,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const INACTIVITY_LIMIT = 30 * 60 * 1000; 

  const mapSessionToUser = (s: Session | null): AuthUser | null => {
    if (!s) return null;
    const baseUser: User = s.user;
    const email = baseUser.email ?? '';
    
    const metaFullName = (baseUser.user_metadata as any)?.full_name as string | undefined;
    const fullName = metaFullName && metaFullName.trim().length > 0
      ? metaFullName.trim()
      : (email ? email.split('@')[0] : '');

    return {
      id: baseUser.id,
      email,
      role: 'client', // Fallback temporal
      fullName,
    };
  };

  // --- EFECTO 1: Manejo puro de la sesión (Cero bloqueos) ---
  useEffect(() => {
    let isMounted = true;
    console.log("[Auth] 1. Inicializando escuchador de sesión...");

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (isMounted) {
        setSession(initialSession);
        // Si entra como invitado (sin sesión), apagamos la carga para mostrar el Login
        if (!initialSession) setLoading(false); 
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      console.log(`[Auth] Evento Supabase: ${_event}`);
      if (isMounted) {
        setSession(currentSession);
        if (!currentSession) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // --- EFECTO 2: Buscar datos a la DB (Solo corre cuando ya hay sesión estable) ---
  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!session) return; 

      try {
        console.log(`[Auth] 2. Consultando perfil en BD para: ${session.user.id}`);
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', session.user.id)
          .single();

        if (isMounted) {
          let currentUser = mapSessionToUser(session);
          if (currentUser) {
            if (!error && data) {
              console.log(`[Auth] 3. Perfil listo. Rol: ${data.role}`);
              currentUser.fullName = data.full_name;
              currentUser.role = data.role as UserRole;
            }
            setUser(currentUser);
          }
          // Recién acá, con el rol correcto en mano, liberamos la interfaz
          setLoading(false); 
        }
      } catch (error) {
        console.error("[Auth] Error al cargar perfil:", error);
        if (isMounted) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [session]); // 🚨 La magia: este efecto reacciona a los cambios del Efecto 1

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data: { session: newSession }, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !newSession) return false;

      // Traemos el perfil en el acto para evitar que la UI parpadee
      const { data } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', newSession.user.id)
        .single();

      let currentUser = mapSessionToUser(newSession);
      if (currentUser && data) {
        currentUser.fullName = data.full_name;
        currentUser.role = data.role as UserRole;
      }

      setSession(newSession);
      setUser(currentUser);
      return true;
    } catch (err) {
      console.error('Error inesperado al iniciar sesión:', err);
      return false;
    }
  };

  const logout = useCallback(async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error en supabase.auth.signOut():', err);
    } finally {
      setSession(null);
      setUser(null);
    }
  }, []);

  // --- EFECTO 3: Temporizador de Inactividad (30 min) ---
  useEffect(() => {
    if (!session) return;
    let timer: NodeJS.Timeout;

    const handleLogout = async () => {
      console.log("Cerrando sesión por inactividad...");
      await logout();
      alert("Tu sesión ha expirado por inactividad tras 30 minutos.");
    };

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(handleLogout, INACTIVITY_LIMIT);
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => document.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((event) => document.removeEventListener(event, resetTimer));
    };
  }, [session, logout, INACTIVITY_LIMIT]);

  return (
    <AuthContext.Provider value={{ session, loading, login, user, isAuthenticated: !!session, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);