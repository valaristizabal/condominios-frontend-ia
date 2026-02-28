import { useContext } from "react";
import { ActiveCondominiumContext } from "./ActiveCondominiumContext";

export function useActiveCondominium() {
  return useContext(ActiveCondominiumContext);
}

