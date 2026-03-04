import { useCallback, useEffect, useMemo, useState } from "react";
import { useActiveCondominium } from "../../context/useActiveCondominium";
import apiClient from "../../services/apiClient";

export function useCleaningRecords() {
  const { activeCondominiumId } = useActiveCondominium();
  const [records, setRecords] = useState([]);
  const [areas, setAreas] = useState([]);
  const [operatives, setOperatives] = useState([]);
  const [detailsByRecordId, setDetailsByRecordId] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
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

  const loadRecords = useCallback(async () => {
    if (!activeCondominiumId) {
      setRecords([]);
      return;
    }

    const response = await apiClient.get("/cleaning-records", requestConfig);
    setRecords(Array.isArray(response.data) ? response.data : []);
  }, [activeCondominiumId, requestConfig]);

  const loadCatalogs = useCallback(async () => {
    if (!activeCondominiumId) {
      setAreas([]);
      setOperatives([]);
      return;
    }

    const [areasResponse, operativesResponse] = await Promise.all([
      apiClient.get("/cleaning-areas", requestConfig),
      apiClient.get("/operatives", requestConfig),
    ]);

    const allAreas = Array.isArray(areasResponse.data) ? areasResponse.data : [];
    setAreas(allAreas.filter((item) => item?.is_active !== false));
    setOperatives(Array.isArray(operativesResponse.data) ? operativesResponse.data : []);
  }, [activeCondominiumId, requestConfig]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      await Promise.all([loadCatalogs(), loadRecords()]);
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible cargar modulo de aseo."));
    } finally {
      setLoading(false);
    }
  }, [loadCatalogs, loadRecords]);

  const createCleaningRecord = useCallback(
    async (payload) => {
      setSaving(true);
      setError("");

      try {
        const response = await apiClient.post("/cleaning-records", payload, requestConfig);
        const created = response.data;
        await loadRecords();
        if (created?.id) {
          setDetailsByRecordId((prev) => ({
            ...prev,
            [created.id]: created,
          }));
        }
        return created;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible crear el registro de limpieza."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [loadRecords, requestConfig]
  );

  const getRecordDetails = useCallback(
    async (recordId) => {
      setDetailsLoading(true);
      setError("");

      try {
        const response = await apiClient.get(`/cleaning-records/${recordId}`, requestConfig);
        const details = response.data || null;
        if (details?.id) {
          setDetailsByRecordId((prev) => ({
            ...prev,
            [details.id]: details,
          }));
        }
        return details;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible cargar el detalle del registro."));
        throw err;
      } finally {
        setDetailsLoading(false);
      }
    },
    [requestConfig]
  );

  const completeCleaningRecord = useCallback(
    async (recordId, payload) => {
      setSaving(true);
      setError("");

      try {
        const response = await apiClient.patch(
          `/cleaning-records/${recordId}/complete`,
          payload || {},
          requestConfig
        );
        const updated = response.data;

        setRecords((prev) =>
          prev.map((item) => (Number(item.id) === Number(recordId) ? { ...item, ...updated } : item))
        );

        if (updated?.id) {
          setDetailsByRecordId((prev) => ({
            ...prev,
            [updated.id]: updated,
          }));
        }

        return updated;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible finalizar el registro de limpieza."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [requestConfig]
  );

  const updateChecklistItem = useCallback(
    async (recordId, itemId, completed) => {
      setSaving(true);
      setError("");

      try {
        const response = await apiClient.patch(
          `/cleaning-records/${recordId}/checklist-items/${itemId}`,
          { completed: Boolean(completed) },
          requestConfig
        );

        setDetailsByRecordId((prev) => {
          const existingRecord = prev[recordId];
          if (!existingRecord) return prev;

          return {
            ...prev,
            [recordId]: {
              ...existingRecord,
              checklistItems: (existingRecord.checklistItems || []).map((item) =>
                Number(item.id) === Number(itemId)
                  ? { ...item, completed: Boolean(completed) }
                  : item
              ),
            },
          };
        });

        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible actualizar el item del checklist."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [requestConfig]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    records,
    areas,
    operatives,
    detailsByRecordId,
    loading,
    saving,
    detailsLoading,
    error,
    hasTenantContext: Boolean(activeCondominiumId),
    activeCondominiumId,
    refresh,
    loadRecords,
    createCleaningRecord,
    getRecordDetails,
    updateChecklistItem,
    completeCleaningRecord,
  };
}

function normalizeApiError(err, fallbackMessage) {
  const responseData = err?.response?.data;
  const errors = responseData?.errors;

  if (errors && typeof errors === "object") {
    const firstFieldErrors = Object.values(errors).find(
      (fieldErrors) => Array.isArray(fieldErrors) && fieldErrors.length > 0
    );
    if (firstFieldErrors) {
      return String(firstFieldErrors[0]);
    }
  }

  return responseData?.message || err?.message || fallbackMessage;
}
