import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../modules/auth/hooks/useAuth";
import { setAuthToken } from "../services/apiClient";
import { AuthContext } from "./authContextInstance";

export function AuthProvider({ children }) {
  const { login: loginRequest, getMe } = useAuth();
  const [token, setToken] = useState(() => localStorage.getItem("auth_token"));
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await loginRequest(email, password);

      if (!data?.token) {
        throw new Error("Token no recibido.");
      }

      localStorage.setItem("auth_token", data.token);
      setAuthToken(data.token);
      setToken(data.token);

      const me = await getMe();
      setUser(me);

      return { ...data, me };
    },
    [getMe, loginRequest]
  );

  useEffect(() => {
    let cancelled = false;

    const bootstrapSession = async () => {
      if (!token) {
        setAuthLoading(false);
        return;
      }

      setAuthToken(token);

      try {
        const me = await getMe();
        if (!cancelled) {
          setUser(me);
        }
      } catch {
        if (!cancelled) {
          logout();
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    };

    bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, [getMe, logout, token]);

  const value = useMemo(
    () => ({
      user,
      token,
      authLoading,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [authLoading, login, logout, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
