import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "../../../../services/apiClient";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";

export function useResidents() {
  const { activeCondominiumId } = useActiveCondominium();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadResidents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get("/residents", {
        params: activeCondominiumId ? { condominium_id: activeCondominiumId } : undefined,
      });
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "No fue posible cargar residentes.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [activeCondominiumId]);

  const createResident = useCallback(async (payload) => {
    setSaving(true);
    try {
      const response = await apiClient.post("/residents", payload);
      setItems((prev) => [response.data, ...prev]);
      return response.data;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateResident = useCallback(async (id, payload) => {
    setSaving(true);
    try {
      const response = await apiClient.put(`/residents/${id}`, payload);
      setItems((prev) => prev.map((item) => (item.id === id ? response.data : item)));
      return response.data;
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    loadResidents();
  }, [loadResidents]);

  const hasTenantContext = useMemo(() => Boolean(activeCondominiumId), [activeCondominiumId]);

  return {
    residents: items,
    loading,
    saving,
    error,
    hasTenantContext,
    activeCondominiumId,
    loadResidents,
    createResident,
    updateResident,
  };
}

