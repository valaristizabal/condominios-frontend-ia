import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "../../../../services/apiClient";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";

export function useOperatives() {
  const { activeCondominiumId } = useActiveCondominium();
  const [items, setItems] = useState([]);
  const [roles, setRoles] = useState([]);
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

  const loadOperatives = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get("/operatives", requestConfig);
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "No fue posible cargar operativos.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [requestConfig]);

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
      setItems((prev) => [response.data, ...prev]);
      return response.data;
    } finally {
      setSaving(false);
    }
  }, [requestConfig]);

  const updateOperative = useCallback(async (id, payload) => {
    setSaving(true);
    try {
      const response = await apiClient.put(`/operatives/${id}`, payload, requestConfig);
      setItems((prev) => prev.map((item) => (item.id === id ? response.data : item)));
      return response.data;
    } finally {
      setSaving(false);
    }
  }, [requestConfig]);

  useEffect(() => {
    loadOperatives();
  }, [loadOperatives]);

  useEffect(() => {
    loadOperativeRoles();
  }, [loadOperativeRoles]);

  const hasTenantContext = useMemo(() => Boolean(activeCondominiumId), [activeCondominiumId]);

  return {
    operatives: items,
    operativeRoles: roles,
    loading,
    saving,
    error,
    hasTenantContext,
    activeCondominiumId,
    loadOperatives,
    createOperative,
    updateOperative,
  };
}
