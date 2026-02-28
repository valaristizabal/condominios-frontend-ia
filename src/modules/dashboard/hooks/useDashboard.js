import { useMemo } from "react";

export function useDashboard() {
  // Placeholder controlado: conectar con endpoints reales cuando estén disponibles.
  const summary = useMemo(
    () => ({
      source: "placeholder",
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
    []
  );

  return {
    summary,
    loading: false,
    error: "",
  };
}

