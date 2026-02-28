import { useContext } from "react";
import { AuthContext } from "./authContextInstance";

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext debe usarse dentro de AuthProvider.");
  }

  return context;
}
