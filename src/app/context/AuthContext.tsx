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

  // 30 minutos de inactividad
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
      role: 'client', // Se asigna temporalmente, se pisa inmediatamente abajo
      fullName,
    };
  };

  // Función auxiliar para ir a buscar el perfil real a la base de datos
  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', userId)
      .single();
    
    if (!error && data) {
      return { fullName: data.full_name as string, role: data.role as UserRole };
    }
    return null;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      let currentUser = mapSessionToUser(session);

      // Si hay sesión guardada, buscamos el rol antes de sacar el "loading"
      if (currentUser) {
        const profile = await fetchUserProfile(currentUser.id);
        if (profile) {
          currentUser = { ...currentUser, fullName: profile.fullName, role: profile.role };
        }
      }

      setSession(session);
      setUser(currentUser);
      setLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      let currentUser = mapSessionToUser(session);
      
      if (currentUser) {
        const profile = await fetchUserProfile(currentUser.id);
        if (profile) {
          currentUser = { ...currentUser, fullName: profile.fullName, role: profile.role };
        }
      }

      setSession(session);
      setUser(currentUser);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data: { session: newSession }, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !newSession) return false;

      let currentUser = mapSessionToUser(newSession);

      // 🚨 LA CORRECCIÓN: Buscamos el rol real ANTES de terminar el login
      if (currentUser) {
        const profile = await fetchUserProfile(currentUser.id);
        if (profile) {
          currentUser = { ...currentUser, fullName: profile.fullName, role: profile.role };
        }
      }

      // Recién acá guardamos el usuario (ya con el rol de coach) y devolvemos true
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

  // Lógica de Inactividad (Auto-Logout 30 mins)
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