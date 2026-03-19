import { useCallback, useEffect, useMemo, useState } from "react";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import apiClient from "../../../../services/apiClient";

export function useSuppliers() {
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

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/suppliers", requestConfig);
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible cargar proveedores."));
    } finally {
      setLoading(false);
    }
  }, [requestConfig]);

  const createSupplier = useCallback(
    async (payload) => {
      setSaving(true);
      setError("");
      try {
        const response = await apiClient.post("/suppliers", payload, {
          ...(requestConfig || {}),
          headers: {
            ...(requestConfig?.headers || {}),
            "Content-Type": "multipart/form-data",
          },
        });
        await fetchSuppliers();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible crear el proveedor."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchSuppliers, requestConfig]
  );

  const updateSupplier = useCallback(
    async (id, payload) => {
      setSaving(true);
      setError("");
      try {
        const response = await apiClient.post(`/suppliers/${id}?_method=PUT`, payload, {
          ...(requestConfig || {}),
          headers: {
            ...(requestConfig?.headers || {}),
            "Content-Type": "multipart/form-data",
          },
        });
        await fetchSuppliers();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible actualizar el proveedor."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchSuppliers, requestConfig]
  );

  const deactivateSupplier = useCallback(
    async (id) => {
      setSaving(true);
      setError("");
      try {
        const response = await apiClient.delete(`/suppliers/${id}`, requestConfig);
        await fetchSuppliers();
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible desactivar el proveedor."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchSuppliers, requestConfig]
  );

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  return {
    suppliers: items,
    loading,
    saving,
    error,
    hasTenantContext: Boolean(activeCondominiumId),
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
