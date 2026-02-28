import { useCallback, useEffect, useState } from "react";
import apiClient from "../../../services/apiClient";

export function useCondominiums() {
  const [condominiums, setCondominiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadCondominiums = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get("/condominiums");
      setCondominiums(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "No fue posible cargar condominios.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCondominium = useCallback(async (payload) => {
    setSaving(true);
    try {
      const response = await apiClient.post("/condominiums", payload);
      setCondominiums((prev) => [response.data, ...prev]);
      return response.data;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateCondominium = useCallback(async (id, payload) => {
    setSaving(true);
    try {
      const response = await apiClient.put(`/condominiums/${id}`, payload);
      setCondominiums((prev) => prev.map((item) => (item.id === id ? response.data : item)));
      return response.data;
    } finally {
      setSaving(false);
    }
  }, []);

  const toggleCondominiumStatus = useCallback(async (id) => {
    const response = await apiClient.patch(`/condominiums/${id}/toggle`);
    const updated = response?.data?.data;
    if (updated) {
      setCondominiums((prev) => prev.map((item) => (item.id === id ? updated : item)));
    }
    return response.data;
  }, []);

  useEffect(() => {
    loadCondominiums();
  }, [loadCondominiums]);

  return {
    condominiums,
    loading,
    error,
    saving,
    loadCondominiums,
    createCondominium,
    updateCondominium,
    toggleCondominiumStatus,
  };
}

