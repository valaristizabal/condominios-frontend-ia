import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "../../../../services/apiClient";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";

export function useResidents() {
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

  const loadResidents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get("/residents", requestConfig);
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      const message = normalizeApiError(
        err,
        "No fue posible cargar residentes."
      );
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [requestConfig]);

  const createResident = useCallback(async (payload) => {
    setSaving(true);
    setError("");
    try {
      const response = await apiClient.post("/residents", payload, requestConfig);
      await loadResidents();
      return response.data;
    } catch (err) {
      const message = normalizeApiError(
        err,
        "No fue posible crear el residente."
      );
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [loadResidents, requestConfig]);

  const updateResident = useCallback(async (id, payload) => {
    setSaving(true);
    setError("");
    try {
      const response = await apiClient.put(`/residents/${id}`, payload, requestConfig);
      await loadResidents();
      return response.data;
    } catch (err) {
      const message = normalizeApiError(
        err,
        "No fue posible actualizar el residente."
      );
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [loadResidents, requestConfig]);

  const changeUserPassword = useCallback(async (userId, payload) => {
    setSaving(true);
    setError("");
    try {
      const response = await apiClient.patch(`/users/${userId}/change-password`, payload, requestConfig);
      return response.data;
    } catch (err) {
      const message = normalizeApiError(
        err,
        "No fue posible actualizar la contraseña."
      );
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [requestConfig]);

  useEffect(() => {
    loadResidents();
  }, [loadResidents]);

  const hasTenantContext = useMemo(() => Boolean(activeCondominiumId), [activeCondominiumId]);

  return {
    residents: items,
    loading,
    saving,
    error,
    hasTenantContext,
    activeCondominiumId,
    loadResidents,
    createResident,
    updateResident,
    changeUserPassword,
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
