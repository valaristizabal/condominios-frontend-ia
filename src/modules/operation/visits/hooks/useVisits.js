import { useCallback, useEffect, useMemo, useState } from "react";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import apiClient from "../../../../services/apiClient";

export function useVisits() {
  const { activeCondominiumId } = useActiveCondominium();
  const [apartments, setApartments] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
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

  const loadApartments = useCallback(async () => {
    if (!activeCondominiumId) {
      setApartments([]);
      return;
    }

    const response = await apiClient.get("/apartments", requestConfig);
    setApartments(Array.isArray(response.data) ? response.data : []);
  }, [activeCondominiumId, requestConfig]);

  const loadVisits = useCallback(async (page = 1) => {
    if (!activeCondominiumId) {
      setVisits([]);
      setPagination({
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        total: 0,
      });
      return;
    }

    const response = await apiClient.get("/visits", {
      ...(requestConfig || {}),
      params: {
        page,
        per_page: 10,
      },
    });

    const payload = response?.data || {};
    const rows = Array.isArray(payload?.data) ? payload.data : [];
    const nextCurrentPage = Number(payload?.current_page || page || 1);
    const nextLastPage = Number(payload?.last_page || 1);
    const normalizedLastPage = nextLastPage > 0 ? nextLastPage : 1;

    setVisits(rows);
    setPagination({
      currentPage: nextCurrentPage,
      lastPage: normalizedLastPage,
      perPage: Number(payload?.per_page || 10),
      total: Number(payload?.total || rows.length),
    });

    if (nextCurrentPage > normalizedLastPage) {
      setCurrentPage(normalizedLastPage);
    }
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
        setCurrentPage(1);
        await loadVisits(1);
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
      await loadVisits(currentPage);
    },
    [activeCondominiumId, currentPage, loadVisits, requestConfig]
  );

  useEffect(() => {
    loadApartments();
  }, [loadApartments]);

  useEffect(() => {
    loadVisits(currentPage);
  }, [currentPage, loadVisits]);

  return {
    apartments,
    visits,
    loading,
    currentPage,
    pagination,
    setCurrentPage,
    registerVisit,
    checkout,
  };
}
