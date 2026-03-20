import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "../../../../services/apiClient";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";

export function useVehicleIncidents() {
  const { activeCondominiumId } = useActiveCondominium();

  const [apartments, setApartments] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [incidents, setIncidents] = useState([]);

  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resolvingIds, setResolvingIds] = useState({});
  const [incidentsPagination, setIncidentsPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
  });

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

  const loadInitialData = useCallback(async () => {
    if (!activeCondominiumId) {
      setApartments([]);
      setVehicleTypes([]);
      return;
    }

    setLoadingInitial(true);
    setError("");

    try {
      const [apartmentsRes, vehicleTypesRes] = await Promise.all([
        apiClient.get("/apartments", requestConfig),
        apiClient.get("/vehicle-types?active=1", requestConfig),
      ]);

      setApartments(Array.isArray(apartmentsRes.data) ? apartmentsRes.data : []);
      setVehicleTypes(Array.isArray(vehicleTypesRes.data) ? vehicleTypesRes.data : []);
    } catch (err) {
      setError(normalizeApiError(err, "Error cargando datos iniciales."));
      setApartments([]);
      setVehicleTypes([]);
    } finally {
      setLoadingInitial(false);
    }
  }, [activeCondominiumId, requestConfig]);

  const loadIncidents = useCallback(
    async (filters = {}, page = 1) => {
      if (!activeCondominiumId) {
        setIncidents([]);
        setIncidentsPagination({
          currentPage: 1,
          lastPage: 1,
          perPage: 10,
          total: 0,
        });
        return;
      }

      setLoadingIncidents(true);
      setError("");

      try {
        const query = new URLSearchParams();

        if (filters.pending) query.set("pending", "1");
        if (filters.resolved) query.set("resolved", "1");
        query.set("per_page", "10");
        query.set("page", String(page));

        const endpoint = query.size
          ? `/vehicle-incidents?${query.toString()}`
          : "/vehicle-incidents";

        const response = await apiClient.get(endpoint, requestConfig);
        const payload = response?.data || {};
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        const nextCurrentPage = Number(payload?.current_page || page || 1);
        const nextLastPage = Math.max(1, Number(payload?.last_page || 1));

        if (nextCurrentPage > nextLastPage) {
          await loadIncidents(filters, nextLastPage);
          return;
        }

        setIncidents(rows);
        setIncidentsPagination({
          currentPage: nextCurrentPage,
          lastPage: nextLastPage,
          perPage: Number(payload?.per_page || 10),
          total: Number(payload?.total || rows.length),
        });
      } catch (err) {
        setError(normalizeApiError(err, "Error cargando novedades vehiculares."));
        setIncidents([]);
        setIncidentsPagination({
          currentPage: 1,
          lastPage: 1,
          perPage: 10,
          total: 0,
        });
      } finally {
        setLoadingIncidents(false);
      }
    },
    [activeCondominiumId, requestConfig]
  );

  const createIncident = useCallback(
    async (payload) => {
      setSubmitting(true);
      setError("");
      setFieldErrors({});

      try {
        const formData = new FormData();

        if (payload.vehicle_id) {
          formData.append("vehicle_id", String(payload.vehicle_id));
        }

        if (payload.apartment_id) {
          formData.append("apartment_id", String(payload.apartment_id));
        }

        if (payload.plate) {
          formData.append("plate", String(payload.plate));
        }

        formData.append("incident_type", String(payload.incident_type || ""));
        formData.append("observations", String(payload.observations || ""));

        if (payload.evidence) {
          formData.append("evidence", payload.evidence);
        }

        const response = await apiClient.post("/vehicle-incidents", formData, {
          ...requestConfig,
          headers: {
            ...(requestConfig?.headers || {}),
            "Content-Type": "multipart/form-data",
          },
        });

        return response.data;
      } catch (err) {
        const nextFieldErrors = extractFieldErrors(err);

        if (Object.keys(nextFieldErrors).length > 0) {
          setFieldErrors(nextFieldErrors);
        }

        setError(normalizeApiError(err, "No fue posible registrar la novedad."));
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [requestConfig]
  );

  const resolveIncident = useCallback(
    async (incidentId) => {
      if (!incidentId) return;

      setResolvingIds((prev) => ({ ...prev, [incidentId]: true }));
      setError("");

      try {
        await apiClient.patch(`/vehicle-incidents/${incidentId}/resolve`, {}, requestConfig);
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible resolver la novedad."));
        throw err;
      } finally {
        setResolvingIds((prev) => ({ ...prev, [incidentId]: false }));
      }
    },
    [requestConfig]
  );

  const clearFieldError = useCallback((fieldName) => {
    setFieldErrors((prev) => {
      if (!prev[fieldName]) return prev;

      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }, []);

  useEffect(() => {
    loadInitialData();
    loadIncidents({ pending: true });
  }, [loadIncidents, loadInitialData]);

  return {
    apartments,
    vehicleTypes,
    incidents,
    loadingInitial,
    loadingIncidents,
    submitting,
    resolvingIds,
    incidentsPagination,
    error,
    fieldErrors,
    activeCondominiumId,
    loadInitialData,
    loadIncidents,
    createIncident,
    resolveIncident,
    clearFieldError,
  };
}

function extractFieldErrors(err) {
  const errors = err?.response?.data?.errors;

  if (!errors || typeof errors !== "object") {
    return {};
  }

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
