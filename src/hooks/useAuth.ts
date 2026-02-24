import { useState, useEffect, useCallback } from "react";
import { AdminPrivilege, User } from "@/lib/types";
import {
  bootstrapStorage,
  getSession,
  login as doLogin,
  logout as doLogout,
  register as doRegister,
} from "@/lib/storage";
import { userCanAccessAdminPanel, userHasAdminPrivilege } from "@/lib/adminPermissions";

const AUTH_BOOTSTRAP_TIMEOUT_MS = 3500;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize on mount
  useEffect(() => {
    let active = true;

    const init = async () => {
      // Fast path: resolve from local session immediately.
      checkSession();

      try {
        await Promise.race([
          bootstrapStorage(),
          new Promise<void>((resolve) => {
            window.setTimeout(resolve, AUTH_BOOTSTRAP_TIMEOUT_MS);
          }),
        ]);
      } catch (error) {
        console.warn("Auth bootstrap failed", error);
      }

      if (!active) return;
      checkSession();
      setIsLoading(false);
    };

    void init();

    return () => {
      active = false;
    };
  }, []);

  // Listen for session changes
  useEffect(() => {
    const handleStorageChange = () => {
      checkSession();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const checkSession = () => {
    const session = getSession();
    if (session && session.isAuthenticated) {
      setUser(session.user);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const login = useCallback((email: string, password: string): { success: boolean; error?: string } => {
    const loggedInUser = doLogin(email, password);
    if (loggedInUser) {
      setUser(loggedInUser);
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: "Email ou mot de passe incorrect" };
  }, []);

  const logout = useCallback(() => {
    doLogout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const register = useCallback((email: string, password: string, name: string): { success: boolean; error?: string } => {
    const newUser = doRegister(email, password, name);
    if (newUser) {
      setUser(newUser);
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: "Cet email est déjà utilisé" };
  }, []);

  const isAdmin = user?.role === "admin";
  const isCoAdmin = user?.role === "co_admin";
  const canAccessAdmin = userCanAccessAdminPanel(user);
  const hasPrivilege = useCallback(
    (privilege: AdminPrivilege) => userHasAdminPrivilege(user, privilege),
    [user]
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    isCoAdmin,
    canAccessAdmin,
    hasPrivilege,
    login,
    logout,
    register,
  };
}
