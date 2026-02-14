import React, { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "client" | "coach";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Usuarios mock para demostración
const MOCK_USERS: Record<string, User & { password: string }> = {
  "cliente@primogym.com": {
    id: "c1",
    name: "Carlos Rodríguez",
    email: "cliente@primogym.com",
    password: "cliente123",
    role: "client",
  },
  "entrenador@primogym.com": {
    id: "t1",
    name: "María González",
    email: "entrenador@primogym.com",
    password: "entrenador123",
    role: "coach",
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simular delay de red
    await new Promise((resolve) => setTimeout(resolve, 500));

    const mockUser = MOCK_USERS[email];
    if (mockUser && mockUser.password === password) {
      const { password: _, ...userWithoutPassword } = mockUser;
      setUser(userWithoutPassword);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
