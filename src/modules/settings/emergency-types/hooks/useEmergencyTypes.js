import { useCallback, useEffect, useMemo, useState } from "react";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import apiClient from "../../../../services/apiClient";

export function useEmergencyTypes() {
  const { activeCondominiumId } = useActiveCondominium();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const fetchEmergencyTypes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get("/emergency-types", requestConfig);
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible cargar tipos de emergencia."));
    } finally {
      setLoading(false);
    }
  }, [requestConfig]);

  const createEmergencyType = useCallback(
    async (payload) => {
      setSaving(true);
      setError("");

      try {
        const response = await apiClient.post("/emergency-types", payload, requestConfig);
        await fetchEmergencyTypes();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible crear el tipo de emergencia."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchEmergencyTypes, requestConfig]
  );

  const updateEmergencyType = useCallback(
    async (id, payload) => {
      setSaving(true);
      setError("");

      try {
        const response = await apiClient.put(`/emergency-types/${id}`, payload, requestConfig);
        await fetchEmergencyTypes();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible actualizar el tipo de emergencia."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchEmergencyTypes, requestConfig]
  );

  const toggleEmergencyType = useCallback(
    async (id) => {
      setSaving(true);
      setError("");

      try {
        const response = await apiClient.patch(`/emergency-types/${id}/toggle`, {}, requestConfig);
        await fetchEmergencyTypes();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible cambiar el estado del tipo de emergencia."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchEmergencyTypes, requestConfig]
  );

  useEffect(() => {
    fetchEmergencyTypes();
  }, [fetchEmergencyTypes]);

  const hasTenantContext = useMemo(() => Boolean(activeCondominiumId), [activeCondominiumId]);

  return {
    emergencyTypes: items,
    loading,
    saving,
    error,
    hasTenantContext,
    activeCondominiumId,
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
