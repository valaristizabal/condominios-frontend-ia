import { useCallback, useMemo, useState } from "react";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import apiClient from "../../../../services/apiClient";

export function useInventoryCategories() {
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

  const fetchInventoryCategories = useCallback(
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
        const response = await apiClient.get("/inventory-categories", {
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
          await fetchInventoryCategories({ page: nextLastPage, query, status });
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
        setError(normalizeApiError(err, "No fue posible cargar categorias de inventario."));
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

  const createInventoryCategory = useCallback(
    async (payload, filters = { query: "", status: "all" }) => {
      setSaving(true);
      setError("");
      try {
        const response = await apiClient.post("/inventory-categories", payload, requestConfig);
        await fetchInventoryCategories({ page: currentPage, ...filters });
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible crear la categoria."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [currentPage, fetchInventoryCategories, requestConfig]
  );

  const updateInventoryCategory = useCallback(
    async (id, payload, filters = { query: "", status: "all" }) => {
      setSaving(true);
      setError("");
      try {
        const response = await apiClient.put(`/inventory-categories/${id}`, payload, requestConfig);
        await fetchInventoryCategories({ page: currentPage, ...filters });
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible actualizar la categoria."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [currentPage, fetchInventoryCategories, requestConfig]
  );

  const toggleInventoryCategory = useCallback(
    async (id, filters = { query: "", status: "all" }) => {
      setSaving(true);
      setError("");
      try {
        const response = await apiClient.patch(`/inventory-categories/${id}/toggle`, {}, requestConfig);
        await fetchInventoryCategories({ page: currentPage, ...filters });
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible cambiar estado de la categoria."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [currentPage, fetchInventoryCategories, requestConfig]
  );

  return {
    inventoryCategories: items,
    loading,
    saving,
    error,
    currentPage,
    pagination,
    hasTenantContext: Boolean(activeCondominiumId),
    activeCondominiumId,
    setCurrentPage,
    fetchInventoryCategories,
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
