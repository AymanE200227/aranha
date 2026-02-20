import { useState, useEffect, useCallback } from "react";
import { User } from "@/lib/types";
import { getSession, login as doLogin, logout as doLogout, register as doRegister, initializeStorage } from "@/lib/storage";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize on mount
  useEffect(() => {
    initializeStorage();
    checkSession();
    setIsLoading(false);
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

  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    login,
    logout,
    register,
  };
}
