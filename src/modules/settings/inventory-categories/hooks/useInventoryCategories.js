import { useCallback, useEffect, useMemo, useState } from "react";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import apiClient from "../../../../services/apiClient";

export function useInventoryCategories() {
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

  const fetchInventoryCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/inventory-categories", requestConfig);
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible cargar categorías de inventario."));
    } finally {
      setLoading(false);
    }
  }, [requestConfig]);

  const createInventoryCategory = useCallback(
    async (payload) => {
      setSaving(true);
      setError("");
      try {
        const response = await apiClient.post("/inventory-categories", payload, requestConfig);
        await fetchInventoryCategories();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible crear la categoría."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchInventoryCategories, requestConfig]
  );

  const updateInventoryCategory = useCallback(
    async (id, payload) => {
      setSaving(true);
      setError("");
      try {
        const response = await apiClient.put(`/inventory-categories/${id}`, payload, requestConfig);
        await fetchInventoryCategories();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible actualizar la categoría."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchInventoryCategories, requestConfig]
  );

  const toggleInventoryCategory = useCallback(
    async (id) => {
      setSaving(true);
      setError("");
      try {
        const response = await apiClient.patch(`/inventory-categories/${id}/toggle`, {}, requestConfig);
        await fetchInventoryCategories();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible cambiar estado de la categoría."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchInventoryCategories, requestConfig]
  );

  useEffect(() => {
    fetchInventoryCategories();
  }, [fetchInventoryCategories]);

  return {
    inventoryCategories: items,
    loading,
    saving,
    error,
    hasTenantContext: Boolean(activeCondominiumId),
    activeCondominiumId,
    createInventoryCategory,
    updateInventoryCategory,
    toggleInventoryCategory,
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

