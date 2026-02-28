import { useCallback, useEffect, useMemo, useState } from "react";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import apiClient from "../../../../services/apiClient";

export function useUnitTypes() {
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

  const fetchUnitTypes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get("/unit-types", requestConfig);
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible cargar tipos de unidad."));
    } finally {
      setLoading(false);
    }
  }, [requestConfig]);

  const createUnitType = useCallback(
    async (payload) => {
      setSaving(true);
      setError("");

      try {
        const response = await apiClient.post("/unit-types", payload, requestConfig);
        await fetchUnitTypes();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible crear el tipo de unidad."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchUnitTypes, requestConfig]
  );

  const updateUnitType = useCallback(
    async (id, payload) => {
      setSaving(true);
      setError("");

      try {
        const response = await apiClient.put(`/unit-types/${id}`, payload, requestConfig);
        await fetchUnitTypes();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible actualizar el tipo de unidad."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchUnitTypes, requestConfig]
  );

  const toggleUnitType = useCallback(
    async (id) => {
      setSaving(true);
      setError("");

      try {
        const response = await apiClient.patch(`/unit-types/${id}/toggle`, {}, requestConfig);
        await fetchUnitTypes();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible cambiar el estado del tipo de unidad."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchUnitTypes, requestConfig]
  );

  useEffect(() => {
    fetchUnitTypes();
  }, [fetchUnitTypes]);

  const hasTenantContext = useMemo(() => Boolean(activeCondominiumId), [activeCondominiumId]);

  return {
    unitTypes: items,
    loading,
    saving,
    error,
    hasTenantContext,
    activeCondominiumId,
    fetchUnitTypes,
    createUnitType,
    updateUnitType,
    toggleUnitType,
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

