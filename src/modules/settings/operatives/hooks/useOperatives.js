import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "../../../../services/apiClient";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";

export function useOperatives(filters = {}) {
  const { activeCondominiumId } = useActiveCondominium();
  const [items, setItems] = useState([]);
  const [roles, setRoles] = useState([]);
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
  const normalizedContractType = String(filters?.contractType || "all");

  const loadOperatives = useCallback(async (page = 1) => {
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

      if (normalizedContractType !== "all") {
        params.contract_type = normalizedContractType;
      }

      const response = await apiClient.get("/operatives", {
        ...(requestConfig || {}),
        params,
      });

      const payload = response?.data || {};
      const rows = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];

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
      const message = err?.response?.data?.message || err?.message || "No fue posible cargar operativos.";
      setError(message);
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
  }, [normalizedContractType, normalizedQuery, normalizedStatus, requestConfig]);

  const loadOperativeRoles = useCallback(async () => {
    try {
      const response = await apiClient.get("/operatives/roles", requestConfig);
      setRoles(Array.isArray(response.data) ? response.data : []);
    } catch {
      setRoles([]);
    }
  }, [requestConfig]);

  const createOperative = useCallback(async (payload) => {
    setSaving(true);
    try {
      const response = await apiClient.post("/operatives", payload, requestConfig);
      setCurrentPage(1);
      await loadOperatives(1);
      return response.data;
    } finally {
      setSaving(false);
    }
  }, [loadOperatives, requestConfig]);

  const updateOperative = useCallback(async (id, payload) => {
    setSaving(true);
    try {
      const response = await apiClient.put(`/operatives/${id}`, payload, requestConfig);
      await loadOperatives(currentPage);
      return response.data;
    } finally {
      setSaving(false);
    }
  }, [currentPage, loadOperatives, requestConfig]);

  const changeUserPassword = useCallback(async (userId, payload) => {
    setSaving(true);
    try {
      const response = await apiClient.patch(`/users/${userId}/change-password`, payload, requestConfig);
      return response.data;
    } finally {
      setSaving(false);
    }
  }, [requestConfig]);

  useEffect(() => {
    loadOperatives(currentPage);
  }, [currentPage, loadOperatives]);

  useEffect(() => {
    loadOperativeRoles();
  }, [loadOperativeRoles]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCondominiumId, normalizedQuery, normalizedStatus, normalizedContractType]);

  const hasTenantContext = useMemo(() => Boolean(activeCondominiumId), [activeCondominiumId]);

  return {
    operatives: items,
    operativeRoles: roles,
    currentPage,
    pagination,
    setCurrentPage,
    loading,
    saving,
    error,
    hasTenantContext,
    activeCondominiumId,
    loadOperatives,
    createOperative,
    updateOperative,
    changeUserPassword,
  };
}
