import { useCallback, useMemo, useState } from "react";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import apiClient from "../../../../services/apiClient";

export function useEmergencyContacts() {
  const { activeCondominiumId } = useActiveCondominium();
  const [items, setItems] = useState([]);
  const [emergencyTypes, setEmergencyTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 6,
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

  const fetchEmergencyContacts = useCallback(
    async ({ page = 1, query = "", status = "all", emergencyTypeId = "" } = {}) => {
      if (!activeCondominiumId) {
        setItems([]);
        setEmergencyTypes([]);
        setLoading(false);
        setError("");
        setWarning("");
        setCurrentPage(1);
        setPagination({
          currentPage: 1,
          lastPage: 1,
          perPage: 6,
          total: 0,
        });
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await apiClient.get("/emergency-contacts", {
          ...(requestConfig || {}),
          params: {
            page,
            per_page: 6,
            q: String(query || "").trim() || undefined,
            status: status || "all",
            emergency_type_id: emergencyTypeId || undefined,
          },
        });

        const payload = response?.data || {};
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        const nextCurrentPage = Number(payload?.current_page || page || 1);
        const nextLastPage = Math.max(1, Number(payload?.last_page || 1));

        if (nextCurrentPage > nextLastPage) {
          await fetchEmergencyContacts({ page: nextLastPage, query, status, emergencyTypeId });
          return;
        }

        setItems(rows);
        setPagination({
          currentPage: nextCurrentPage,
          lastPage: nextLastPage,
          perPage: Number(payload?.per_page || 6),
          total: Number(payload?.total || rows.length),
        });
        setCurrentPage(nextCurrentPage);
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible cargar contactos de emergencia."));
        setItems([]);
        setCurrentPage(1);
        setPagination({
          currentPage: 1,
          lastPage: 1,
          perPage: 6,
          total: 0,
        });
      } finally {
        setLoading(false);
      }
    },
    [activeCondominiumId, requestConfig]
  );

  const fetchEmergencyTypes = useCallback(async () => {
    if (!activeCondominiumId) {
      setEmergencyTypes([]);
      return;
    }

    try {
      const response = await apiClient.get("/emergency-types", requestConfig);
      setEmergencyTypes(Array.isArray(response.data) ? response.data : []);
    } catch (_err) {
      setEmergencyTypes([]);
    }
  }, [activeCondominiumId, requestConfig]);

  const createEmergencyContact = useCallback(
    async (payload, filters = { query: "", status: "all", emergencyTypeId: "" }) => {
      setSaving(true);
      setError("");
      setWarning("");

      try {
        const response = await apiClient.post("/emergency-contacts", payload, requestConfig);
        await fetchEmergencyContacts({ page: currentPage, ...filters });
        setWarning(String(response?.data?.warning || ""));
        return response.data?.data ?? response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible crear el contacto de emergencia."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [currentPage, fetchEmergencyContacts, requestConfig]
  );

  const updateEmergencyContact = useCallback(
    async (id, payload, filters = { query: "", status: "all", emergencyTypeId: "" }) => {
      setSaving(true);
      setError("");
      setWarning("");

      try {
        const response = await apiClient.put(`/emergency-contacts/${id}`, payload, requestConfig);
        await fetchEmergencyContacts({ page: currentPage, ...filters });
        setWarning(String(response?.data?.warning || ""));
        return response.data?.data ?? response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible actualizar el contacto de emergencia."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [currentPage, fetchEmergencyContacts, requestConfig]
  );

  const toggleEmergencyContact = useCallback(
    async (id, filters = { query: "", status: "all", emergencyTypeId: "" }) => {
      setSaving(true);
      setError("");

      try {
        const response = await apiClient.patch(`/emergency-contacts/${id}/toggle`, {}, requestConfig);
        await fetchEmergencyContacts({ page: currentPage, ...filters });
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible cambiar el estado del contacto de emergencia."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [currentPage, fetchEmergencyContacts, requestConfig]
  );

  const hasTenantContext = useMemo(() => Boolean(activeCondominiumId), [activeCondominiumId]);

  return {
    emergencyContacts: items,
    emergencyTypes,
    loading,
    saving,
    error,
    warning,
    currentPage,
    pagination,
    hasTenantContext,
    activeCondominiumId,
    setCurrentPage,
    fetchEmergencyContacts,
    fetchEmergencyTypes,
    createEmergencyContact,
    updateEmergencyContact,
    toggleEmergencyContact,
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
