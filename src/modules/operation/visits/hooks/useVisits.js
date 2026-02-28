import { useCallback, useEffect, useMemo, useState } from "react";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import apiClient from "../../../../services/apiClient";

export function useVisits() {
  const { activeCondominiumId } = useActiveCondominium();
  const [apartments, setApartments] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const loadApartments = useCallback(async () => {
    if (!activeCondominiumId) {
      setApartments([]);
      return;
    }

    const response = await apiClient.get("/apartments", requestConfig);
    setApartments(Array.isArray(response.data) ? response.data : []);
  }, [activeCondominiumId, requestConfig]);

  const loadVisits = useCallback(async () => {
    if (!activeCondominiumId) {
      setVisits([]);
      return;
    }

    const response = await apiClient.get("/visits", requestConfig);
    setVisits(Array.isArray(response.data) ? response.data : []);
  }, [activeCondominiumId, requestConfig]);

  const registerVisit = useCallback(
    async (values) => {
      if (!activeCondominiumId) return;

      setLoading(true);

      try {
        const formData = new FormData();
        formData.append("apartment_id", String(values.apartment_id));
        formData.append("full_name", values.full_name || "");
        formData.append("document_number", values.document_number || "");
        formData.append("phone", values.phone || "");
        formData.append("destination", values.destination || "");
        formData.append("background_check", values.background_check ? "1" : "0");
        formData.append("carried_items", values.carried_items || "");
        if (values.photo) {
          formData.append("photo", values.photo);
        }

        await apiClient.post(
          "/visits",
          formData,
          {
            ...requestConfig,
            headers: {
              ...(requestConfig?.headers || {}),
              "Content-Type": "multipart/form-data",
            },
          }
        );
        await loadVisits();
      } finally {
        setLoading(false);
      }
    },
    [activeCondominiumId, loadVisits, requestConfig]
  );

  const checkout = useCallback(
    async (visitId) => {
      if (!activeCondominiumId) return;

      await apiClient.patch(`/visits/${visitId}/checkout`, {}, requestConfig);
      await loadVisits();
    },
    [activeCondominiumId, loadVisits, requestConfig]
  );

  useEffect(() => {
    loadApartments();
    loadVisits();
  }, [loadApartments, loadVisits]);

  return {
    apartments,
    visits,
    loading,
    registerVisit,
    checkout,
  };
}
