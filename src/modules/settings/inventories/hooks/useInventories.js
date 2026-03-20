import { useCallback, useMemo, useState } from "react";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import apiClient from "../../../../services/apiClient";

export function useInventories() {
  const { activeCondominiumId } = useActiveCondominium();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 12,
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

  const loadInventories = useCallback(
    async ({ page = 1, query = "", status = "all" } = {}) => {
      if (!activeCondominiumId) {
        setItems([]);
        setLoading(false);
        setError("");
        setCurrentPage(1);
        setPagination({
          currentPage: 1,
          lastPage: 1,
          perPage: 12,
          total: 0,
        });
        return;
      }

      setLoading(true);
      setError("");
      try {
        const response = await apiClient.get("/inventories", {
          ...(requestConfig || {}),
          params: {
            page,
            per_page: 12,
            q: String(query || "").trim() || undefined,
            status: status || "all",
          },
        });

        const payload = response?.data || {};
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        const nextCurrentPage = Number(payload?.current_page || page || 1);
        const nextLastPage = Math.max(1, Number(payload?.last_page || 1));

        if (nextCurrentPage > nextLastPage) {
          await loadInventories({ page: nextLastPage, query, status });
          return;
        }

        setItems(rows);
        setPagination({
          currentPage: nextCurrentPage,
          lastPage: nextLastPage,
          perPage: Number(payload?.per_page || 12),
          total: Number(payload?.total || rows.length),
        });
        setCurrentPage(nextCurrentPage);
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible cargar ubicaciones de inventario."));
        setItems([]);
        setCurrentPage(1);
        setPagination({
          currentPage: 1,
          lastPage: 1,
          perPage: 12,
          total: 0,
        });
      } finally {
        setLoading(false);
      }
    },
    [activeCondominiumId, requestConfig]
  );

  const createInventory = useCallback(
    async (payload, filters = { query: "", status: "all" }) => {
      if (!requestConfig) {
        const tenantError = new Error("No hay condominio activo para crear ubicaciones de inventario.");
        setError(tenantError.message);
        throw tenantError;
      }

      setSaving(true);
      setError("");
      try {
        const response = await apiClient.post("/inventories", payload, requestConfig);
        await loadInventories({ page: currentPage, ...filters });
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible crear la ubicacion de inventario."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [currentPage, loadInventories, requestConfig]
  );

  const updateInventory = useCallback(
    async (id, payload, filters = { query: "", status: "all" }) => {
      if (!requestConfig) {
        const tenantError = new Error("No hay condominio activo para actualizar ubicaciones de inventario.");
        setError(tenantError.message);
        throw tenantError;
      }

      setSaving(true);
      setError("");
      try {
        const response = await apiClient.put(`/inventories/${id}`, payload, requestConfig);
        await loadInventories({ page: currentPage, ...filters });
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible actualizar la ubicacion de inventario."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [currentPage, loadInventories, requestConfig]
  );

  const toggleInventory = useCallback(
    async (id, filters = { query: "", status: "all" }) => {
      if (!requestConfig) {
        const tenantError = new Error("No hay condominio activo para cambiar el estado de ubicaciones de inventario.");
        setError(tenantError.message);
        throw tenantError;
      }

      setSaving(true);
      setError("");
      try {
        const response = await apiClient.patch(`/inventories/${id}/toggle`, {}, requestConfig);
        await loadInventories({ page: currentPage, ...filters });
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible cambiar estado de la ubicacion de inventario."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [currentPage, loadInventories, requestConfig]
  );

  return {
    inventories: items,
    loading,
    saving,
    error,
    currentPage,
    pagination,
    hasTenantContext: Boolean(activeCondominiumId),
    activeCondominiumId,
    setCurrentPage,
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
