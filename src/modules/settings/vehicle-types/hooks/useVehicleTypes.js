import { useCallback, useEffect, useMemo, useState } from "react";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import apiClient from "../../../../services/apiClient";

export function useVehicleTypes() {
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

  const fetchVehicleTypes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get("/vehicle-types", requestConfig);
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible cargar tipos de vehiculo."));
    } finally {
      setLoading(false);
    }
  }, [requestConfig]);

  const createVehicleType = useCallback(
    async (payload) => {
      setSaving(true);
      setError("");

      try {
        const response = await apiClient.post("/vehicle-types", payload, requestConfig);
        await fetchVehicleTypes();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible crear el tipo de vehiculo."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchVehicleTypes, requestConfig]
  );

  const updateVehicleType = useCallback(
    async (id, payload) => {
      setSaving(true);
      setError("");

      try {
        const response = await apiClient.put(`/vehicle-types/${id}`, payload, requestConfig);
        await fetchVehicleTypes();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible actualizar el tipo de vehiculo."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchVehicleTypes, requestConfig]
  );

  const toggleVehicleType = useCallback(
    async (id) => {
      setSaving(true);
      setError("");

      try {
        const response = await apiClient.patch(`/vehicle-types/${id}/toggle`, {}, requestConfig);
        await fetchVehicleTypes();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible cambiar el estado del tipo de vehiculo."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchVehicleTypes, requestConfig]
  );

  useEffect(() => {
    fetchVehicleTypes();
  }, [fetchVehicleTypes]);

  const hasTenantContext = useMemo(() => Boolean(activeCondominiumId), [activeCondominiumId]);

  return {
    vehicleTypes: items,
    loading,
    saving,
    error,
    hasTenantContext,
    activeCondominiumId,
    fetchVehicleTypes,
    createVehicleType,
    updateVehicleType,
    toggleVehicleType,
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

