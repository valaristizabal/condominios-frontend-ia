import { useCallback, useMemo, useState } from "react";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import apiClient from "../../../../services/apiClient";

export function useSuppliers() {
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

  const fetchSuppliers = useCallback(
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
        const response = await apiClient.get("/suppliers", {
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
          await fetchSuppliers({ page: nextLastPage, query, status });
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
        setError(normalizeApiError(err, "No fue posible cargar proveedores."));
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

  const createSupplier = useCallback(
    async (payload, filters = { query: "", status: "all" }) => {
      setSaving(true);
      setError("");
      try {
        const response = await apiClient.post("/suppliers", toSupplierRequestBody(payload), {
          ...(requestConfig || {}),
          headers: {
            ...(requestConfig?.headers || {}),
            "Content-Type": "multipart/form-data",
          },
        });
        await fetchSuppliers({ page: currentPage, ...filters });
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible crear el proveedor."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [currentPage, fetchSuppliers, requestConfig]
  );

  const updateSupplier = useCallback(
    async (id, payload, filters = { query: "", status: "all" }) => {
      setSaving(true);
      setError("");
      try {
        const response = await apiClient.post(`/suppliers/${id}?_method=PUT`, toSupplierRequestBody(payload), {
          ...(requestConfig || {}),
          headers: {
            ...(requestConfig?.headers || {}),
            "Content-Type": "multipart/form-data",
          },
        });
        await fetchSuppliers({ page: currentPage, ...filters });
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible actualizar el proveedor."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [currentPage, fetchSuppliers, requestConfig]
  );

  const deactivateSupplier = useCallback(
    async (id, filters = { query: "", status: "all" }) => {
      setSaving(true);
      setError("");
      try {
        const response = await apiClient.delete(`/suppliers/${id}`, requestConfig);
        await fetchSuppliers({ page: currentPage, ...filters });
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible desactivar el proveedor."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [currentPage, fetchSuppliers, requestConfig]
  );

  return {
    suppliers: items,
    loading,
    saving,
    error,
    currentPage,
    pagination,
    hasTenantContext: Boolean(activeCondominiumId),
    activeCondominiumId,
    setCurrentPage,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deactivateSupplier,
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

function toSupplierRequestBody(payload) {
  const formData = new FormData();

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined) return;
    if (value === null) {
      formData.append(key, "");
      return;
    }
    if (value instanceof File) {
      formData.append(key, value);
      return;
    }
    formData.append(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value));
  });

  return formData;
}
