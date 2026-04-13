import { useCallback, useEffect, useMemo, useState } from "react";
import { useActiveCondominium } from "../../../context/useActiveCondominium";
import apiClient from "../../../services/apiClient";

export function useEmergencies() {
  const { activeCondominiumId } = useActiveCondominium();
  const [emergencies, setEmergencies] = useState([]);
  const [emergencyTypes, setEmergencyTypes] = useState([]);
  const [areas, setAreas] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [emergenciesPage, setEmergenciesPage] = useState(1);
  const [emergenciesPagination, setEmergenciesPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
  });
  const [contactsPage, setContactsPage] = useState(1);
  const [contactsPagination, setContactsPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 6,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actingIds, setActingIds] = useState({});
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

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

  const fetchEmergencyTypes = useCallback(async () => {
    if (!activeCondominiumId) {
      setEmergencyTypes([]);
      return;
    }

    try {
      const response = await apiClient.get("/emergency-types", requestConfig);
      const rows = Array.isArray(response.data) ? response.data : [];
      setEmergencyTypes(rows.filter((item) => item?.is_active));
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible cargar tipos de emergencia."));
      setEmergencyTypes([]);
    }
  }, [activeCondominiumId, requestConfig]);

  const fetchAreas = useCallback(async () => {
    if (!activeCondominiumId) {
      setAreas([]);
      return;
    }

    try {
      const response = await apiClient.get("/areas", requestConfig);
      const rows = Array.isArray(response.data) ? response.data : [];
      setAreas(rows);
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible cargar las areas."));
      setAreas([]);
    }
  }, [activeCondominiumId, requestConfig]);

  const fetchApartments = useCallback(async () => {
    if (!activeCondominiumId) {
      setApartments([]);
      return;
    }

    try {
      const rows = await loadAllRows("/apartments", requestConfig);
      setApartments(rows);
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible cargar las unidades."));
      setApartments([]);
    }
  }, [activeCondominiumId, requestConfig]);

  const fetchEmergencyContacts = useCallback(async (page = contactsPage) => {
    if (!activeCondominiumId) {
      setEmergencyContacts([]);
      setContactsPage(1);
      setContactsPagination({
        currentPage: 1,
        lastPage: 1,
        perPage: 6,
        total: 0,
      });
      return;
    }

    try {
      const response = await apiClient.get("/emergency-contacts", {
        ...(requestConfig || {}),
        params: {
          status: "active",
          page,
          per_page: 6,
        },
      });
      const payload = response?.data || {};
      const rows = Array.isArray(payload?.data) ? payload.data : [];
      const nextCurrentPage = Number(payload?.current_page || page || 1);
      const nextLastPage = Math.max(1, Number(payload?.last_page || 1));

      if (nextCurrentPage > nextLastPage) {
        await fetchEmergencyContacts(nextLastPage);
        return;
      }

      setEmergencyContacts(rows.filter((item) => item?.is_active));
      setContactsPagination({
        currentPage: nextCurrentPage,
        lastPage: nextLastPage,
        perPage: Number(payload?.per_page || 6),
        total: Number(payload?.total || rows.length),
      });
      setContactsPage(nextCurrentPage);
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible cargar contactos de emergencia."));
      setEmergencyContacts([]);
      setContactsPage(1);
      setContactsPagination({
        currentPage: 1,
        lastPage: 1,
        perPage: 6,
        total: 0,
      });
    }
  }, [activeCondominiumId, contactsPage, requestConfig]);

  const fetchEmergencies = useCallback(async (page = emergenciesPage) => {
    if (!activeCondominiumId) {
      setEmergencies([]);
      setEmergenciesPagination({
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        total: 0,
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get("/emergencies", {
        ...(requestConfig || {}),
        params: {
          page,
          per_page: 10,
        },
      });
      const payload = response?.data || {};
      const rows = Array.isArray(payload?.data) ? payload.data : [];
      setEmergencies(rows);
      setEmergenciesPagination({
        currentPage: Number(payload?.current_page || page || 1),
        lastPage: Math.max(1, Number(payload?.last_page || 1)),
        perPage: Number(payload?.per_page || 10),
        total: Number(payload?.total || rows.length),
      });
      setEmergenciesPage(Number(payload?.current_page || page || 1));
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible cargar emergencias."));
      setEmergencies([]);
      setEmergenciesPagination({
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        total: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [activeCondominiumId, emergenciesPage, requestConfig]);

  const createEmergency = useCallback(
    async (payload) => {
      setSaving(true);
      setError("");
      setFieldErrors({});

      try {
        const response = await apiClient.post("/emergencies", payload, requestConfig);
        await fetchEmergencies(1);
        return response.data;
      } catch (err) {
        setFieldErrors(extractFieldErrors(err));
        setError(normalizeApiError(err, "No fue posible registrar la emergencia."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchEmergencies, requestConfig]
  );

  const markInProgress = useCallback(
    async (id) => {
      if (!id) return;
      setActingIds((prev) => ({ ...prev, [id]: true }));
      setError("");

      try {
        await apiClient.patch(`/emergencies/${id}/progress`, {}, requestConfig);
        await fetchEmergencies(emergenciesPage);
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible actualizar la emergencia."));
        throw err;
      } finally {
        setActingIds((prev) => ({ ...prev, [id]: false }));
      }
    },
    [emergenciesPage, fetchEmergencies, requestConfig]
  );

  const closeEmergency = useCallback(
    async (id) => {
      if (!id) return;
      setActingIds((prev) => ({ ...prev, [id]: true }));
      setError("");

      try {
        await apiClient.patch(`/emergencies/${id}/close`, {}, requestConfig);
        await fetchEmergencies(emergenciesPage);
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible cerrar la emergencia."));
        throw err;
      } finally {
        setActingIds((prev) => ({ ...prev, [id]: false }));
      }
    },
    [emergenciesPage, fetchEmergencies, requestConfig]
  );

  const clearFieldError = useCallback((field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  useEffect(() => {
    fetchEmergencyTypes();
    fetchAreas();
    fetchApartments();
  }, [fetchEmergencyTypes, fetchAreas, fetchApartments]);

  useEffect(() => {
    fetchEmergencies(emergenciesPage);
  }, [emergenciesPage, fetchEmergencies]);

  useEffect(() => {
    fetchEmergencyContacts(contactsPage);
  }, [contactsPage, fetchEmergencyContacts]);

  return {
    emergencies,
    emergencyTypes,
    areas,
    apartments,
    emergencyContacts,
    emergenciesPage,
    emergenciesPagination,
    contactsPage,
    contactsPagination,
    loading,
    saving,
    actingIds,
    error,
    fieldErrors,
    activeCondominiumId,
    fetchEmergencies,
    setEmergenciesPage,
    setContactsPage,
    createEmergency,
    markInProgress,
    closeEmergency,
    clearFieldError,
  };
}

async function loadAllRows(endpoint, requestConfig) {
  const rows = [];
  let page = 1;
  let lastPage = 1;

  do {
    const response = await apiClient.get(endpoint, {
      ...(requestConfig || {}),
      params: {
        page,
        per_page: 10,
      },
    });

    const payload = response?.data || {};
    const pageRows = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
    rows.push(...pageRows);
    lastPage = Math.max(1, Number(payload?.last_page || 1));
    page += 1;
  } while (page <= lastPage);

  return rows;
}

function extractFieldErrors(err) {
  const errors = err?.response?.data?.errors;
  if (!errors || typeof errors !== "object") return {};

  const normalized = {};
  Object.entries(errors).forEach(([field, messages]) => {
    if (Array.isArray(messages) && messages.length > 0) {
      normalized[field] = String(messages[0]);
    }
  });

  return normalized;
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
