import { useCallback, useEffect, useMemo, useState } from "react";
import { useActiveCondominium } from "../../../context/useActiveCondominium";
import apiClient from "../../../services/apiClient";

export function useCleaningAreas() {
  const { activeCondominiumId } = useActiveCondominium();
  const [areas, setAreas] = useState([]);
  const [checklistsByArea, setChecklistsByArea] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklistSaving, setChecklistSaving] = useState(false);
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

  const fetchCleaningAreas = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get("/cleaning-areas", requestConfig);
      setAreas(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible cargar areas de aseo."));
    } finally {
      setLoading(false);
    }
  }, [requestConfig]);

  const createCleaningArea = useCallback(
    async (payload) => {
      setSaving(true);
      setError("");

      try {
        const response = await apiClient.post("/cleaning-areas", payload, requestConfig);
        await fetchCleaningAreas();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible crear el area de aseo."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchCleaningAreas, requestConfig]
  );

  const updateCleaningArea = useCallback(
    async (id, payload) => {
      setSaving(true);
      setError("");

      try {
        const response = await apiClient.put(`/cleaning-areas/${id}`, payload, requestConfig);
        await fetchCleaningAreas();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible actualizar el area de aseo."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchCleaningAreas, requestConfig]
  );

  const toggleCleaningArea = useCallback(
    async (id) => {
      setSaving(true);
      setError("");

      try {
        const response = await apiClient.patch(`/cleaning-areas/${id}/toggle`, {}, requestConfig);
        await fetchCleaningAreas();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible cambiar el estado del area de aseo."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchCleaningAreas, requestConfig]
  );

  const fetchChecklistByArea = useCallback(
    async (areaId) => {
      setChecklistLoading(true);
      setError("");

      try {
        const response = await apiClient.get(`/cleaning-areas/${areaId}/checklist`, requestConfig);
        const items = Array.isArray(response.data) ? response.data : [];
        setChecklistsByArea((prev) => ({
          ...prev,
          [areaId]: items,
        }));
        return items;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible cargar el checklist del area."));
        throw err;
      } finally {
        setChecklistLoading(false);
      }
    },
    [requestConfig]
  );

  const addChecklistItem = useCallback(
    async (areaId, payload) => {
      setChecklistSaving(true);
      setError("");

      try {
        const response = await apiClient.post(
          `/cleaning-areas/${areaId}/checklist`,
          payload,
          requestConfig
        );
        await fetchChecklistByArea(areaId);
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible agregar el item de checklist."));
        throw err;
      } finally {
        setChecklistSaving(false);
      }
    },
    [fetchChecklistByArea, requestConfig]
  );

  const removeChecklistItem = useCallback(
    async (areaId, itemId) => {
      setChecklistSaving(true);
      setError("");

      try {
        const response = await apiClient.delete(
          `/cleaning-areas/${areaId}/checklist/${itemId}`,
          requestConfig
        );
        await fetchChecklistByArea(areaId);
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible eliminar el item de checklist."));
        throw err;
      } finally {
        setChecklistSaving(false);
      }
    },
    [fetchChecklistByArea, requestConfig]
  );

  useEffect(() => {
    fetchCleaningAreas();
  }, [fetchCleaningAreas]);

  const hasTenantContext = useMemo(() => Boolean(activeCondominiumId), [activeCondominiumId]);

  return {
    cleaningAreas: areas,
    checklistsByArea,
    loading,
    saving,
    checklistLoading,
    checklistSaving,
    error,
    hasTenantContext,
    activeCondominiumId,
    fetchCleaningAreas,
    createCleaningArea,
    updateCleaningArea,
    toggleCleaningArea,
    fetchChecklistByArea,
    addChecklistItem,
    removeChecklistItem,
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
