import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authService, type AuthResult, type AuthUser } from "@/services/AuthService";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  setSessionFromLogin: (result: AuthResult) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = authService.getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await authService.me();
      setUser(res.user);
    } catch {
      authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const setSessionFromLogin = useCallback((result: AuthResult) => {
    const token = result.access_token ?? result.token;
    if (token) {
      authService.setToken(token);
    }
    setUser(result.user ?? null);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    setSessionFromLogin,
    refreshUser,
    logout,
  }), [loading, logout, refreshUser, setSessionFromLogin, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
