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

// Prefijo para nuestra "cookie" de caché
const CACHE_PREFIX = 'spoter_profile_';

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

  // --- EFECTO 1: Manejo puro de la sesión ---
  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (isMounted) {
        setSession(initialSession);
        if (!initialSession) setLoading(false); 
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
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

  // --- EFECTO 2: Buscar datos a la DB o CACHÉ ---
  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!session) return; 

      const userId = session.user.id;
      const cacheKey = `${CACHE_PREFIX}${userId}`;
      let currentUser = mapSessionToUser(session);

      if (!currentUser) return;

      // 1. ⚡ Intentamos leer de la CACHÉ primero (Costo: $0, Tiempo: 0ms)
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const { fullName, role } = JSON.parse(cachedData);
          console.log(`[Auth] ⚡ Perfil cargado desde caché local. Cero hits a BD.`);
          currentUser.fullName = fullName;
          currentUser.role = role as UserRole;
          
          if (isMounted) {
            setUser(currentUser);
            setLoading(false);
          }
          return; // 🛑 CORTAMOS ACÁ: No llamamos a Supabase
        } catch (e) {
          console.warn("[Auth] Caché corrupta, buscando en BD...");
        }
      }

      // 2. 🔍 Si no hay caché (primer login en este dispositivo), vamos a la BD
      try {
        console.log(`[Auth] 🔍 Buscando perfil en BD por única vez...`);
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', userId)
          .single();

        if (isMounted) {
          if (!error && data) {
            console.log(`[Auth] 💾 Guardando perfil en caché para futuros refresh.`);
            currentUser.fullName = data.full_name;
            currentUser.role = data.role as UserRole;
            
            // Guardamos los datos en el navegador para no volver a pedirlos
            localStorage.setItem(cacheKey, JSON.stringify({
              fullName: data.full_name,
              role: data.role
            }));
          }
          setUser(currentUser);
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
  }, [session]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data: { session: newSession }, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !newSession) return false;

      const { data } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', newSession.user.id)
        .single();

      let currentUser = mapSessionToUser(newSession);
      if (currentUser && data) {
        currentUser.fullName = data.full_name;
        currentUser.role = data.role as UserRole;
        
        // Al loguearnos, también guardamos la caché inmediatamente
        localStorage.setItem(`${CACHE_PREFIX}${newSession.user.id}`, JSON.stringify({
          fullName: data.full_name,
          role: data.role
        }));
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
      // 🧹 Limpiamos la caché de este usuario al cerrar sesión
      if (user?.id) {
        localStorage.removeItem(`${CACHE_PREFIX}${user.id}`);
      }
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error en supabase.auth.signOut():', err);
    } finally {
      setSession(null);
      setUser(null);
    }
  }, [user]);

  // --- EFECTO 3: Temporizador de Inactividad ---
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