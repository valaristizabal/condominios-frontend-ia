import { useCallback, useEffect, useMemo, useState } from "react";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import apiClient from "../../../../services/apiClient";

export function useUnitTypes(filters = {}) {
  const { activeCondominiumId } = useActiveCondominium();
  const [items, setItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
  });
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

  const normalizedQuery = String(filters?.query || "").trim();
  const normalizedStatus = String(filters?.status || "all");

  const fetchUnitTypes = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");

    try {
      const params = {
        page,
        per_page: 10,
      };

      if (normalizedQuery) {
        params.q = normalizedQuery;
      }

      if (normalizedStatus === "active") {
        params.is_active = 1;
      } else if (normalizedStatus === "inactive") {
        params.is_active = 0;
      }

      const response = await apiClient.get("/unit-types", {
        ...(requestConfig || {}),
        params,
      });

      const payload = response?.data || {};
      const rows = Array.isArray(payload?.data) ? payload.data : [];
      const nextCurrentPage = Number(payload?.current_page || page || 1);
      const nextLastPage = Number(payload?.last_page || 1);
      const normalizedLastPage = nextLastPage > 0 ? nextLastPage : 1;

      setItems(rows);
      setPagination({
        currentPage: nextCurrentPage,
        lastPage: normalizedLastPage,
        perPage: Number(payload?.per_page || 10),
        total: Number(payload?.total || rows.length),
      });

      if (nextCurrentPage > normalizedLastPage) {
        setCurrentPage(normalizedLastPage);
      }
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible cargar tipos de unidad."));
      setItems([]);
      setPagination({
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        total: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [normalizedQuery, normalizedStatus, requestConfig]);

  const createUnitType = useCallback(
    async (payload) => {
      setSaving(true);
      setError("");

      try {
        const response = await apiClient.post("/unit-types", payload, requestConfig);
        setCurrentPage(1);
        await fetchUnitTypes(1);
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
        await fetchUnitTypes(currentPage);
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible actualizar el tipo de unidad."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [currentPage, fetchUnitTypes, requestConfig]
  );

  const toggleUnitType = useCallback(
    async (id) => {
      setSaving(true);
      setError("");

      try {
        const response = await apiClient.patch(`/unit-types/${id}/toggle`, {}, requestConfig);
        await fetchUnitTypes(currentPage);
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible cambiar el estado del tipo de unidad."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [currentPage, fetchUnitTypes, requestConfig]
  );

  useEffect(() => {
    fetchUnitTypes(currentPage);
  }, [currentPage, fetchUnitTypes]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCondominiumId, normalizedQuery, normalizedStatus]);

  const hasTenantContext = useMemo(() => Boolean(activeCondominiumId), [activeCondominiumId]);

  return {
    unitTypes: items,
    currentPage,
    pagination,
    setCurrentPage,
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
