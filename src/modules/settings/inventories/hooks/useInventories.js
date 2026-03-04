import { useCallback, useEffect, useMemo, useState } from "react";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import apiClient from "../../../../services/apiClient";

export function useInventories() {
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

  const fetchInventories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/inventories", requestConfig);
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible cargar inventarios."));
    } finally {
      setLoading(false);
    }
  }, [requestConfig]);

  const createInventory = useCallback(
    async (payload) => {
      setSaving(true);
      setError("");
      try {
        const response = await apiClient.post("/inventories", payload, requestConfig);
        await fetchInventories();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible crear el inventario."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchInventories, requestConfig]
  );

  const updateInventory = useCallback(
    async (id, payload) => {
      setSaving(true);
      setError("");
      try {
        const response = await apiClient.put(`/inventories/${id}`, payload, requestConfig);
        await fetchInventories();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible actualizar el inventario."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchInventories, requestConfig]
  );

  const toggleInventory = useCallback(
    async (id) => {
      setSaving(true);
      setError("");
      try {
        const response = await apiClient.patch(`/inventories/${id}/toggle`, {}, requestConfig);
        await fetchInventories();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible cambiar estado del inventario."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchInventories, requestConfig]
  );

  useEffect(() => {
    fetchInventories();
  }, [fetchInventories]);

  return {
    inventories: items,
    loading,
    saving,
    error,
    hasTenantContext: Boolean(activeCondominiumId),
    activeCondominiumId,
    fetchInventories,
    createInventory,
    updateInventory,
    toggleInventory,
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

