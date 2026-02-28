import { useCallback, useEffect, useMemo, useState } from "react";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import apiClient from "../../../../services/apiClient";

export function useApartments() {
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

  const fetchApartments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get("/apartments", requestConfig);
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible cargar apartamentos."));
    } finally {
      setLoading(false);
    }
  }, [requestConfig]);

  const createApartment = useCallback(
    async (payload) => {
      setSaving(true);
      setError("");
      try {
        const response = await apiClient.post("/apartments", payload, requestConfig);
        await fetchApartments();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible crear el apartamento."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchApartments, requestConfig]
  );

  const updateApartment = useCallback(
    async (id, payload) => {
      setSaving(true);
      setError("");
      try {
        const response = await apiClient.put(`/apartments/${id}`, payload, requestConfig);
        await fetchApartments();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible actualizar el apartamento."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchApartments, requestConfig]
  );

  const toggleApartment = useCallback(
    async (id) => {
      setSaving(true);
      setError("");
      try {
        const response = await apiClient.patch(`/apartments/${id}/toggle`, {}, requestConfig);
        await fetchApartments();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible cambiar el estado del apartamento."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchApartments, requestConfig]
  );

  useEffect(() => {
    fetchApartments();
  }, [fetchApartments]);

  const hasTenantContext = useMemo(() => Boolean(activeCondominiumId), [activeCondominiumId]);

  return {
    apartments: items,
    loading,
    saving,
    error,
    hasTenantContext,
    activeCondominiumId,
    fetchApartments,
    createApartment,
    updateApartment,
    toggleApartment,
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

