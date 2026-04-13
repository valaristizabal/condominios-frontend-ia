import { useCallback, useEffect, useMemo, useState } from "react";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import apiClient from "../../../../services/apiClient";

export function useVisits() {
  const { activeCondominiumId } = useActiveCondominium();
  const [unitTypes, setUnitTypes] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [activeVisits, setActiveVisits] = useState([]);
  const [historyVisits, setHistoryVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [activePagination, setActivePagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
  });
  const [historyPagination, setHistoryPagination] = useState({
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

  const loadBootstrapData = useCallback(async () => {
    if (!activeCondominiumId) {
      setUnitTypes([]);
      setApartments([]);
      return;
    }

    const response = await apiClient.get("/visits/bootstrap-data", requestConfig);
    const payload = response?.data || {};

    setUnitTypes(Array.isArray(payload?.unit_types) ? payload.unit_types : []);
    setApartments(Array.isArray(payload?.apartments) ? payload.apartments : []);
  }, [activeCondominiumId, requestConfig]);

  const loadVisits = useCallback(async ({ active = 1, history = 1 } = {}) => {
    if (!activeCondominiumId) {
      setActiveVisits([]);
      setHistoryVisits([]);
      setActivePagination({
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        total: 0,
      });
      setHistoryPagination({
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        total: 0,
      });
      return;
    }

    const [activeResponse, historyResponse] = await Promise.all([
      apiClient.get("/visits", {
        ...(requestConfig || {}),
        params: {
          page: active,
          per_page: 10,
          status: "INSIDE",
        },
      }),
      apiClient.get("/visits", {
        ...(requestConfig || {}),
        params: {
          page: history,
          per_page: 10,
          status: "OUTSIDE",
        },
      }),
    ]);

    const applyPagination = (payload, requestedPage, setRows, setState, setPage) => {
      const rows = Array.isArray(payload?.data) ? payload.data : [];
      const nextCurrentPage = Number(payload?.current_page || requestedPage || 1);
      const nextLastPage = Number(payload?.last_page || 1);
      const normalizedLastPage = nextLastPage > 0 ? nextLastPage : 1;

      setRows(rows);
      setState({
        currentPage: nextCurrentPage,
        lastPage: normalizedLastPage,
        perPage: Number(payload?.per_page || 10),
        total: Number(payload?.total || rows.length),
      });

      if (nextCurrentPage > normalizedLastPage) {
        setPage(normalizedLastPage);
      }
    };

    applyPagination(activeResponse?.data || {}, active, setActiveVisits, setActivePagination, setActivePage);
    applyPagination(historyResponse?.data || {}, history, setHistoryVisits, setHistoryPagination, setHistoryPage);
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
        setActivePage(1);
        await loadVisits({ active: 1, history: historyPage });
      } catch (error) {
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [activeCondominiumId, historyPage, loadVisits, requestConfig]
  );

  const checkout = useCallback(
    async (visitId) => {
      if (!activeCondominiumId) return;

      await apiClient.patch(`/visits/${visitId}/checkout`, {}, requestConfig);
      await loadVisits({ active: activePage, history: historyPage });
    },
    [activeCondominiumId, activePage, historyPage, loadVisits, requestConfig]
  );

  useEffect(() => {
    loadBootstrapData();
  }, [loadBootstrapData]);

  useEffect(() => {
    loadVisits({ active: activePage, history: historyPage });
  }, [activePage, historyPage, loadVisits]);

  return {
    unitTypes,
    apartments,
    activeVisits,
    historyVisits,
    loading,
    activePage,
    historyPage,
    activePagination,
    historyPagination,
    setActivePage,
    setHistoryPage,
    registerVisit,
    checkout,
  };
}
