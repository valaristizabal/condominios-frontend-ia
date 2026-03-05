import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../../services/apiClient";
import { useActiveCondominium } from "../../../context/useActiveCondominium";

export function useDashboard() {
  const { activeCondominiumId, source } = useActiveCondominium();

  const requestConfig = useMemo(
    () =>
      activeCondominiumId
        ? {
            headers: {
              "X-Active-Condominium-Id": String(activeCondominiumId),
            },
          }
        : undefined,
    [activeCondominiumId]
  );

  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["dashboard-summary", activeCondominiumId],
    enabled: Boolean(activeCondominiumId),
    staleTime: 1000 * 60,
    queryFn: async () => {
      const response = await apiClient.get("/dashboard/summary", requestConfig);
      return response?.data ?? {};
    },
  });

  const resolvedSummary = useMemo(
    () =>
      data
        ? {
            source: "api",
            activeCondominiumId,
            contextSource: source,
            kpis: {
              vehicles_today: 0,
              visitors_inside: Number(data.visitors_inside_count ?? 0),
              active_staff: Number(data.operatives_count ?? 0),
              residents_count: Number(data.residents_count ?? 0),
              pending_packages: 0,
              emergencies_open: 0,
              incidents_open: 0,
            },
            recentActivity: [],
          }
        : {
            source: "fallback",
            activeCondominiumId,
            contextSource: source,
            kpis: {
              vehicles_today: 0,
              visitors_inside: 0,
              active_staff: 0,
              residents_count: 0,
              pending_packages: 0,
              emergencies_open: 0,
              incidents_open: 0,
            },
            recentActivity: [],
          },
    [activeCondominiumId, data, source]
  );

  const error = queryError
    ? queryError?.response?.data?.message || queryError?.message || "No fue posible cargar el dashboard."
    : "";

  return {
    summary: resolvedSummary,
    loading: Boolean(activeCondominiumId) && isLoading,
    error,
    loadSummary: refetch,
  };
}
