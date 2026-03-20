import { useCallback, useMemo, useState } from "react";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import apiClient from "../../../../services/apiClient";

export function useEmergencyTypes() {
  const { activeCondominiumId } = useActiveCondominium();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const fetchEmergencyTypes = useCallback(
    async ({ page = 1, query = "", status = "all" } = {}) => {
      setLoading(true);
      setError("");

      try {
        const response = await apiClient.get("/emergency-types", {
          ...(requestConfig || {}),
          params: {
            page,
            per_page: 12,
            q: String(query || "").trim() || undefined,
            status: status || "all",
          },
        });

        const payload = response?.data || {};
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        const nextCurrentPage = Number(payload?.current_page || page || 1);
        const nextLastPage = Math.max(1, Number(payload?.last_page || 1));

        if (nextCurrentPage > nextLastPage) {
          await fetchEmergencyTypes({ page: nextLastPage, query, status });
          return;
        }

        setItems(rows);
        setPagination({
          currentPage: nextCurrentPage,
          lastPage: nextLastPage,
          perPage: Number(payload?.per_page || 12),
          total: Number(payload?.total || rows.length),
        });
        setCurrentPage(nextCurrentPage);
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible cargar tipos de emergencia."));
        setItems([]);
        setPagination({
          currentPage: 1,
          lastPage: 1,
          perPage: 12,
          total: 0,
        });
        setCurrentPage(1);
      } finally {
        setLoading(false);
      }
    },
    [requestConfig]
  );

  const createEmergencyType = useCallback(
    async (payload, filters = { query: "", status: "all" }) => {
      setSaving(true);
      setError("");

      try {
        const response = await apiClient.post("/emergency-types", payload, requestConfig);
        await fetchEmergencyTypes({ page: currentPage, ...filters });
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible crear el tipo de emergencia."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [currentPage, fetchEmergencyTypes, requestConfig]
  );

  const updateEmergencyType = useCallback(
    async (id, payload, filters = { query: "", status: "all" }) => {
      setSaving(true);
      setError("");

      try {
        const response = await apiClient.put(`/emergency-types/${id}`, payload, requestConfig);
        await fetchEmergencyTypes({ page: currentPage, ...filters });
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible actualizar el tipo de emergencia."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [currentPage, fetchEmergencyTypes, requestConfig]
  );

  const toggleEmergencyType = useCallback(
    async (id, filters = { query: "", status: "all" }) => {
      setSaving(true);
      setError("");

      try {
        const response = await apiClient.patch(`/emergency-types/${id}/toggle`, {}, requestConfig);
        await fetchEmergencyTypes({ page: currentPage, ...filters });
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible cambiar el estado del tipo de emergencia."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [currentPage, fetchEmergencyTypes, requestConfig]
  );

  const hasTenantContext = useMemo(() => Boolean(activeCondominiumId), [activeCondominiumId]);

  return {
    emergencyTypes: items,
    loading,
    saving,
    error,
    currentPage,
    pagination,
    hasTenantContext,
    activeCondominiumId,
    setCurrentPage,
    fetchEmergencyTypes,
    createEmergencyType,
    updateEmergencyType,
    toggleEmergencyType,
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
