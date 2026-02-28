import { useMemo } from "react";
import { useActiveCondominium } from "../../../context/useActiveCondominium";

export function useDashboard() {
  const { activeCondominiumId, source } = useActiveCondominium();

  // Placeholder controlado: conectar con endpoints reales cuando estén disponibles.
  const summary = useMemo(
    () => ({
      source: "placeholder",
      activeCondominiumId,
      contextSource: source,
      kpis: {
        vehicles_today: 0,
        visitors_today: 0,
        active_staff: 0,
        pending_packages: 0,
        emergencies_open: 0,
        incidents_open: 0,
      },
      recentActivity: [],
    }),
    [activeCondominiumId, source]
  );

  return {
    summary,
    loading: false,
    error: "",
  };
}
