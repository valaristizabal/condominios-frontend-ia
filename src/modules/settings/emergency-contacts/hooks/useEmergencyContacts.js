import { useCallback, useEffect, useMemo, useState } from "react";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import apiClient from "../../../../services/apiClient";

export function useEmergencyContacts() {
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

  const fetchEmergencyContacts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get("/emergency-contacts", requestConfig);
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible cargar contactos de emergencia."));
    } finally {
      setLoading(false);
    }
  }, [requestConfig]);

  const createEmergencyContact = useCallback(
    async (payload) => {
      setSaving(true);
      setError("");

      try {
        const response = await apiClient.post("/emergency-contacts", payload, requestConfig);
        await fetchEmergencyContacts();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible crear el contacto de emergencia."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchEmergencyContacts, requestConfig]
  );

  const updateEmergencyContact = useCallback(
    async (id, payload) => {
      setSaving(true);
      setError("");

      try {
        const response = await apiClient.put(`/emergency-contacts/${id}`, payload, requestConfig);
        await fetchEmergencyContacts();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible actualizar el contacto de emergencia."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchEmergencyContacts, requestConfig]
  );

  const toggleEmergencyContact = useCallback(
    async (id) => {
      setSaving(true);
      setError("");

      try {
        const response = await apiClient.patch(`/emergency-contacts/${id}/toggle`, {}, requestConfig);
        await fetchEmergencyContacts();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible cambiar el estado del contacto de emergencia."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchEmergencyContacts, requestConfig]
  );

  useEffect(() => {
    fetchEmergencyContacts();
  }, [fetchEmergencyContacts]);

  const hasTenantContext = useMemo(() => Boolean(activeCondominiumId), [activeCondominiumId]);

  return {
    emergencyContacts: items,
    loading,
    saving,
    error,
    hasTenantContext,
    activeCondominiumId,
    fetchEmergencyContacts,
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
