import { useCallback } from "react";
import apiClient from "../../../services/apiClient";

export function useAuth() {
  const login = useCallback(async (email, password) => {
    const response = await apiClient.post("/login", { email, password });
    return response.data;
  }, []);

  const getMe = useCallback(async () => {
    const response = await apiClient.get("/me");
    return response.data;
  }, []);

  return { login, getMe };
}
