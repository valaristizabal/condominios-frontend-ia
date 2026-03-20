import { useCallback, useEffect, useMemo, useState } from "react";
import { useActiveCondominium } from "../../../context/useActiveCondominium";
import apiClient from "../../../services/apiClient";

export function useCleaningAreas() {
  const { activeCondominiumId } = useActiveCondominium();
  const [areas, setAreas] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [checklistsByArea, setChecklistsByArea] = useState({});
  const [loading, setLoading] = useState(false);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklistSaving, setChecklistSaving] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 12,
    total: 0,
  });

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

  const fetchCleaningAreas = useCallback(
    async ({ page = 1 } = {}) => {
      if (!activeCondominiumId) {
        setAreas([]);
        setLoading(false);
        setCurrentPage(1);
        setPagination({
          currentPage: 1,
          lastPage: 1,
          perPage: 12,
          total: 0,
        });
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await apiClient.get("/cleaning-areas", {
          ...(requestConfig || {}),
          params: {
            page,
            per_page: 12,
          },
        });

        const payload = response?.data || {};
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        const nextCurrentPage = Number(payload?.current_page || page || 1);
        const nextLastPage = Math.max(1, Number(payload?.last_page || 1));

        if (nextCurrentPage > nextLastPage) {
          await fetchCleaningAreas({ page: nextLastPage });
          return;
        }

        setAreas(rows);
        setPagination({
          currentPage: nextCurrentPage,
          lastPage: nextLastPage,
          perPage: Number(payload?.per_page || 12),
          total: Number(payload?.total || rows.length),
        });
        setCurrentPage(nextCurrentPage);
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible cargar areas de aseo."));
        setAreas([]);
        setCurrentPage(1);
        setPagination({
          currentPage: 1,
          lastPage: 1,
          perPage: 12,
          total: 0,
        });
      } finally {
        setLoading(false);
      }
    },
    [activeCondominiumId, requestConfig]
  );

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
        await fetchCleaningAreas({ page: currentPage });
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible crear el area de aseo."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [currentPage, fetchCleaningAreas, requestConfig]
  );

  const updateCleaningArea = useCallback(
    async (id, payload) => {
      setSaving(true);
      setError("");

      try {
        const response = await apiClient.put(`/cleaning-areas/${id}`, payload, requestConfig);
        await fetchCleaningAreas({ page: currentPage });
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible actualizar el area de aseo."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [currentPage, fetchCleaningAreas, requestConfig]
  );

  const toggleCleaningArea = useCallback(
    async (id) => {
      setSaving(true);
      setError("");

      try {
        const response = await apiClient.patch(`/cleaning-areas/${id}/toggle`, {}, requestConfig);
        await fetchCleaningAreas({ page: currentPage });
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible cambiar el estado del area de aseo."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [currentPage, fetchCleaningAreas, requestConfig]
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
        const response = await apiClient.post(`/cleaning-areas/${areaId}/checklist`, payload, requestConfig);
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
        const response = await apiClient.delete(`/cleaning-areas/${areaId}/checklist/${itemId}`, requestConfig);
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
        setError(normalizeApiError(err, "No fue posible crear la programacion de aseo."));
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
        setError(normalizeApiError(err, "No fue posible actualizar la programacion de aseo."));
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
        setError(normalizeApiError(err, "No fue posible eliminar la programacion de aseo."));
        throw err;
      } finally {
        setScheduleSaving(false);
      }
    },
    [fetchCleaningSchedules, requestConfig]
  );

  useEffect(() => {
    fetchCleaningAreas({ page: currentPage });
  }, [currentPage, fetchCleaningAreas]);

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
    currentPage,
    pagination,
    hasTenantContext,
    activeCondominiumId,
    setCurrentPage,
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
