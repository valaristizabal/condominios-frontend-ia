import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "../../../services/apiClient";
import { useActiveCondominium } from "../../../context/useActiveCondominium";

export function useDashboard() {
  const { activeCondominiumId, source } = useActiveCondominium();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get("/dashboard/summary", requestConfig);
      const data = response?.data ?? {};

      setSummary({
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
      });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "No fue posible cargar el dashboard.");
      setSummary({
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
      });
    } finally {
      setLoading(false);
    }
  }, [activeCondominiumId, requestConfig, source]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const resolvedSummary = useMemo(
    () =>
      summary ?? {
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
    [activeCondominiumId, source, summary]
  );

  return {
    summary: resolvedSummary,
    loading,
    error,
    loadSummary,
  };
}
