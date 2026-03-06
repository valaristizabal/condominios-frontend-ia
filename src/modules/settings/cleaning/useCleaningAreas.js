import { useCallback, useEffect, useMemo, useState } from "react";
import { useActiveCondominium } from "../../../context/useActiveCondominium";
import apiClient from "../../../services/apiClient";

export function useCleaningAreas() {
  const { activeCondominiumId } = useActiveCondominium();
  const [areas, setAreas] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [checklistsByArea, setChecklistsByArea] = useState({});
  const [loading, setLoading] = useState(true);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
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
    if (!activeCondominiumId) {
      setAreas([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get("/cleaning-areas", requestConfig);
      setAreas(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible cargar áreas de aseo."));
    } finally {
      setLoading(false);
    }
  }, [activeCondominiumId, requestConfig]);

  const fetchCleaningSchedules = useCallback(async () => {
    if (!activeCondominiumId) {
      setSchedules([]);
      setSchedulesLoading(false);
      return;
    }

    setSchedulesLoading(true);
    setError("");

    try {
      const response = await apiClient.get("/cleaning-schedules", requestConfig);
      setSchedules(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible cargar programaciones de aseo."));
    } finally {
      setSchedulesLoading(false);
    }
  }, [activeCondominiumId, requestConfig]);

  const createCleaningArea = useCallback(
    async (payload) => {
      setSaving(true);
      setError("");

      try {
        const response = await apiClient.post("/cleaning-areas", payload, requestConfig);
        await fetchCleaningAreas();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible crear el área de aseo."));
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
        setError(normalizeApiError(err, "No fue posible actualizar el área de aseo."));
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
        setError(normalizeApiError(err, "No fue posible cambiar el estado del área de aseo."));
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
        setError(normalizeApiError(err, "No fue posible cargar el checklist del área."));
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

  const createCleaningSchedule = useCallback(
    async (payload) => {
      setScheduleSaving(true);
      setError("");

      try {
        const response = await apiClient.post("/cleaning-schedules", payload, requestConfig);
        await fetchCleaningSchedules();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible crear la programación de aseo."));
        throw err;
      } finally {
        setScheduleSaving(false);
      }
    },
    [fetchCleaningSchedules, requestConfig]
  );

  const updateCleaningSchedule = useCallback(
    async (id, payload) => {
      setScheduleSaving(true);
      setError("");

      try {
        const response = await apiClient.put(`/cleaning-schedules/${id}`, payload, requestConfig);
        await fetchCleaningSchedules();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible actualizar la programación de aseo."));
        throw err;
      } finally {
        setScheduleSaving(false);
      }
    },
    [fetchCleaningSchedules, requestConfig]
  );

  const removeCleaningSchedule = useCallback(
    async (id) => {
      setScheduleSaving(true);
      setError("");

      try {
        const response = await apiClient.delete(`/cleaning-schedules/${id}`, requestConfig);
        await fetchCleaningSchedules();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible eliminar la programación de aseo."));
        throw err;
      } finally {
        setScheduleSaving(false);
      }
    },
    [fetchCleaningSchedules, requestConfig]
  );

  useEffect(() => {
    fetchCleaningAreas();
  }, [fetchCleaningAreas]);

  useEffect(() => {
    fetchCleaningSchedules();
  }, [fetchCleaningSchedules]);

  const hasTenantContext = useMemo(() => Boolean(activeCondominiumId), [activeCondominiumId]);

  return {
    cleaningAreas: areas,
    cleaningSchedules: schedules,
    checklistsByArea,
    loading,
    schedulesLoading,
    saving,
    scheduleSaving,
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
    fetchCleaningSchedules,
    createCleaningSchedule,
    updateCleaningSchedule,
    removeCleaningSchedule,
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
