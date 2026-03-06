import { useCallback, useMemo, useState } from "react";
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

  const loadInventories = useCallback(
    async (condominiumIdOverride) => {
      const resolvedCondominiumId = Number(condominiumIdOverride || activeCondominiumId);
      if (!resolvedCondominiumId) {
        setItems([]);
        setLoading(false);
        setError("");
        return;
      }

      setLoading(true);
      setError("");
      try {
        const response = await apiClient.get("/inventories", {
          headers: {
            "X-Active-Condominium-Id": String(resolvedCondominiumId),
          },
        });
        setItems(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible cargar ubicaciones de inventario."));
      } finally {
        setLoading(false);
      }
    },
    [activeCondominiumId]
  );

  const createInventory = useCallback(
    async (payload) => {
      if (!requestConfig) {
        const tenantError = new Error("No hay condominio activo para crear ubicaciones de inventario.");
        setError(tenantError.message);
        throw tenantError;
      }

      setSaving(true);
      setError("");
      try {
        const response = await apiClient.post("/inventories", payload, requestConfig);
        await loadInventories();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible crear la ubicacion de inventario."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [loadInventories, requestConfig]
  );

  const updateInventory = useCallback(
    async (id, payload) => {
      if (!requestConfig) {
        const tenantError = new Error("No hay condominio activo para actualizar ubicaciones de inventario.");
        setError(tenantError.message);
        throw tenantError;
      }

      setSaving(true);
      setError("");
      try {
        const response = await apiClient.put(`/inventories/${id}`, payload, requestConfig);
        await loadInventories();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible actualizar la ubicacion de inventario."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [loadInventories, requestConfig]
  );

  const toggleInventory = useCallback(
    async (id) => {
      if (!requestConfig) {
        const tenantError = new Error("No hay condominio activo para cambiar el estado de ubicaciones de inventario.");
        setError(tenantError.message);
        throw tenantError;
      }

      setSaving(true);
      setError("");
      try {
        const response = await apiClient.patch(`/inventories/${id}/toggle`, {}, requestConfig);
        await loadInventories();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible cambiar estado de la ubicacion de inventario."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [loadInventories, requestConfig]
  );

  return {
    inventories: items,
    loading,
    saving,
    error,
    hasTenantContext: Boolean(activeCondominiumId),
    activeCondominiumId,
    loadInventories,
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
