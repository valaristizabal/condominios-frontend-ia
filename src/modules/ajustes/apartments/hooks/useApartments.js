import { useCallback, useEffect, useMemo, useState } from "react";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import apiClient from "../../../../services/apiClient";

export function useApartments(filters = {}) {
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
  const normalizedTower = String(filters?.tower || "all");

  const fetchApartments = useCallback(async (page = 1) => {
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

      if (normalizedTower && normalizedTower !== "all") {
        params.tower = normalizedTower;
      }

      const response = await apiClient.get("/apartments", {
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
      setError(normalizeApiError(err, "No fue posible cargar inmuebles."));
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
  }, [normalizedQuery, normalizedStatus, normalizedTower, requestConfig]);

  const createApartment = useCallback(
    async (payload) => {
      setSaving(true);
      setError("");
      try {
        const response = await apiClient.post("/apartments", payload, requestConfig);
        setCurrentPage(1);
        await fetchApartments(1);
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible crear el inmueble."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchApartments, requestConfig]
  );

  const updateApartment = useCallback(
    async (id, payload) => {
      setSaving(true);
      setError("");
      try {
        const response = await apiClient.put(`/apartments/${id}`, payload, requestConfig);
        await fetchApartments(currentPage);
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible actualizar el inmueble."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [currentPage, fetchApartments, requestConfig]
  );

  const toggleApartment = useCallback(
    async (id) => {
      setSaving(true);
      setError("");
      try {
        const response = await apiClient.patch(`/apartments/${id}/toggle`, {}, requestConfig);
        await fetchApartments(currentPage);
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible cambiar el estado del inmueble."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [currentPage, fetchApartments, requestConfig]
  );

  const importApartmentsCsv = useCallback(
    async (file) => {
      setSaving(true);
      setError("");

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await apiClient.post("/inmuebles/import", formData, {
          ...(requestConfig || {}),
          headers: {
            ...(requestConfig?.headers || {}),
            "Content-Type": "multipart/form-data",
          },
        });

        await fetchApartments(1);
        setCurrentPage(1);
        return response.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible importar el archivo CSV."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchApartments, requestConfig]
  );

  useEffect(() => {
    fetchApartments(currentPage);
  }, [currentPage, fetchApartments]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCondominiumId, normalizedQuery, normalizedStatus, normalizedTower]);

  const hasTenantContext = useMemo(() => Boolean(activeCondominiumId), [activeCondominiumId]);

  return {
    apartments: items,
    currentPage,
    pagination,
    setCurrentPage,
    loading,
    saving,
    error,
    hasTenantContext,
    activeCondominiumId,
    fetchApartments,
    createApartment,
    updateApartment,
    toggleApartment,
    importApartmentsCsv,
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
