import { useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useActiveCondominium } from "../../context/useActiveCondominium";
import apiClient from "../../services/apiClient";

export function useCleaningRecords() {
  const { activeCondominiumId } = useActiveCondominium();
  const { id: routeCondominiumId } = useParams();

  const resolvedCondominiumId = useMemo(() => {
    const contextId = Number(activeCondominiumId);
    if (Number.isFinite(contextId) && contextId > 0) {
      return contextId;
    }

    const routeId = Number(routeCondominiumId);
    if (Number.isFinite(routeId) && routeId > 0) {
      return routeId;
    }

    return null;
  }, [activeCondominiumId, routeCondominiumId]);

  const requestConfig = useMemo(
    () =>
      resolvedCondominiumId
        ? {
            headers: {
              "X-Active-Condominium-Id": String(resolvedCondominiumId),
            },
          }
        : undefined,
    [resolvedCondominiumId]
  );

  const getInitialData = useCallback(async () => {
    if (!resolvedCondominiumId) {
      return {
        areas: [],
        operatives: [],
        records: [],
      };
    }

    const response = await apiClient.get("/cleaning/bootstrap-data", requestConfig);
    const payload = response?.data || {};

    const areas = Array.isArray(payload?.areas) ? payload.areas.filter((a) => a?.is_active !== false) : [];
    const operatives = Array.isArray(payload?.operatives) ? payload.operatives : [];
    const records = Array.isArray(payload?.records) ? payload.records : [];

    return { areas, operatives, records };
  }, [resolvedCondominiumId, requestConfig]);

  const getChecklistItems = useCallback(
    async (recordId) => {
      const response = await apiClient.get(`/cleaning-records/${recordId}/checklist`, requestConfig);
      return Array.isArray(response.data) ? response.data : [];
    },
    [requestConfig]
  );

  const createCleaningRecord = useCallback(
    async (payload) => {
      const response = await apiClient.post("/cleaning-records", payload, requestConfig);
      return response.data;
    },
    [requestConfig]
  );

  const toggleChecklistItem = useCallback(
    async (recordId, itemId, currentCompleted) => {
      const response = await apiClient.patch(
        `/cleaning-records/${recordId}/checklist-items/${itemId}`,
        { completed: !Boolean(currentCompleted) },
        requestConfig
      );
      return response.data;
    },
    [requestConfig]
  );

  const completeCleaningRecord = useCallback(
    async (recordId, payload) => {
      const response = await apiClient.patch(`/cleaning-records/${recordId}/complete`, payload, requestConfig);
      return response.data;
    },
    [requestConfig]
  );

  return {
    hasTenantContext: Boolean(resolvedCondominiumId),
    tenantCacheKey: resolvedCondominiumId,
    getInitialData,
    getChecklistItems,
    createCleaningRecord,
    toggleChecklistItem,
    completeCleaningRecord,
  };
}
