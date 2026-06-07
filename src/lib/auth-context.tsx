"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    name?: string,
  ) => Promise<{ error?: string; message?: string }>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ error?: string; message?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error?: string; message?: string }>;
  deleteAccount: () => Promise<{ error?: string; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      const token = getCookie("zuklo-session");
      if (!token) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get-user" }),
          credentials: "include",
        });

        const data = await res.json();

        if (!cancelled) {
          if (data.user) {
            setUser({
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
            });
          } else {
            setUser(null);
          }
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "login", email, password }),
      });

      const data = await res.json();

      if (data.error) {
        return { error: data.error };
      }

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
        });
      }

      return {};
    } catch {
      return { error: "Error de conexion" };
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "signup", email, password, name }),
      });

      const data = await res.json();

      if (data.error) {
        return { error: data.error };
      }

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
        });
      }

      return { message: "Cuenta creada exitosamente" };
    } catch {
      return { error: "Error de conexion" };
    }
  };

  const signOut = async () => {
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "logout" }),
      });
    } finally {
      setUser(null);
      window.location.href = "/login";
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "forgot-password", email }),
      });

      const data = await res.json();

      if (data.error) {
        return { error: data.error };
      }

      return { message: data.message || "Si el email está registrado, recibirás un link de recuperación" };
    } catch {
      return { error: "Error de conexión" };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "update-password", currentPassword, password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        return { error: data.error || "Error al cambiar contraseña" };
      }

      return { message: data.message || "Contraseña actualizada correctamente" };
    } catch {
      return { error: "Error de conexión" };
    }
  };

  const deleteAccount = async () => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "delete-account" }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        return { error: data.error || "Error al eliminar cuenta" };
      }

      setUser(null);
      window.location.href = "/login";
      return { message: data.message || "Cuenta eliminada" };
    } catch {
      return { error: "Error de conexión" };
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signOut, forgotPassword, changePassword, deleteAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
