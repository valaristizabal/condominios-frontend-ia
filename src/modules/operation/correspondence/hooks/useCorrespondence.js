import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "../../../../services/apiClient";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";

export function useCorrespondence() {
  const { activeCondominiumId } = useActiveCondominium();
  const [apartments, setApartments] = useState([]);
  const [residents, setResidents] = useState([]);
  const [operatives, setOperatives] = useState([]);
  const [items, setItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
  });
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [deliveryFieldErrors, setDeliveryFieldErrors] = useState({});

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

  const loadCorrespondences = useCallback(async (page = 1) => {
    if (!activeCondominiumId) {
      setItems([]);
      setPagination({
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        total: 0,
      });
      return;
    }

    const response = await apiClient.get("/correspondences", {
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
  }, [activeCondominiumId, requestConfig]);

  const loadInitialData = useCallback(async () => {
    if (!activeCondominiumId) {
      setApartments([]);
      setResidents([]);
      setOperatives([]);
      setItems([]);
      setPagination({
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        total: 0,
      });
      return;
    }

    setLoadingInitial(true);
    setError("");

    try {
      const bootstrapRes = await apiClient.get("/correspondences/bootstrap-data", requestConfig);
      const payload = bootstrapRes?.data || {};

      setApartments(Array.isArray(payload?.apartments) ? payload.apartments : []);
      setResidents(Array.isArray(payload?.residents) ? payload.residents : []);
      setOperatives(Array.isArray(payload?.operatives) ? payload.operatives : []);
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible cargar correspondencia."));
      setApartments([]);
      setResidents([]);
      setOperatives([]);
      setItems([]);
      setPagination({
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        total: 0,
      });
    } finally {
      setLoadingInitial(false);
    }
  }, [activeCondominiumId, requestConfig]);

  const createCorrespondence = useCallback(
    async (payload) => {
      if (!activeCondominiumId) return;

      setSubmitting(true);
      setError("");
      setFieldErrors({});

      try {
        const formData = new FormData();

        formData.append("courier_company", String(payload.courier_company || ""));
        formData.append("package_type", String(payload.package_type || ""));
        formData.append("apartment_id", String(payload.apartment_id || ""));
        if (payload.digital_signature) {
          formData.append("digital_signature", String(payload.digital_signature));
        }
        if (payload.resident_receiver_id) {
          formData.append("resident_receiver_id", String(payload.resident_receiver_id));
        }
        if (payload.received_by_id) {
          formData.append("received_by_id", String(payload.received_by_id));
        }
        if (payload.deliver_immediately) {
          formData.append("deliver_immediately", "1");
        }

        if (payload.evidence_photo) {
          formData.append("evidence_photo", payload.evidence_photo);
        }

        const response = await apiClient.post("/correspondences", formData, {
          ...requestConfig,
          headers: {
            ...(requestConfig?.headers || {}),
            "Content-Type": "multipart/form-data",
          },
        });

        setCurrentPage(1);
        await loadCorrespondences(1);
        return response.data;
      } catch (err) {
        const nextErrors = extractFieldErrors(err);
        if (Object.keys(nextErrors).length) {
          setFieldErrors(nextErrors);
        }
        setError(normalizeApiError(err, "No fue posible registrar la correspondencia."));
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [activeCondominiumId, loadCorrespondences, requestConfig]
  );

  const deliverCorrespondence = useCallback(
    async (id, residentReceiverId, digitalSignature, targetPage = currentPage) => {
      if (!activeCondominiumId || !id) return;

      setDelivering(true);
      setError("");
      setDeliveryFieldErrors({});

      try {
        await apiClient.patch(
          `/correspondences/${id}/deliver`,
          {
            resident_receiver_id: residentReceiverId,
            digital_signature: digitalSignature || null,
          },
          requestConfig
        );

        await loadCorrespondences(targetPage);
      } catch (err) {
        const nextErrors = extractFieldErrors(err);
        if (Object.keys(nextErrors).length) {
          setDeliveryFieldErrors(nextErrors);
        }
        setError(normalizeApiError(err, "No fue posible registrar la entrega."));
        throw err;
      } finally {
        setDelivering(false);
      }
    },
    [activeCondominiumId, currentPage, loadCorrespondences, requestConfig]
  );

  const clearFieldError = useCallback((fieldName) => {
    setFieldErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }, []);

  const clearDeliveryFieldError = useCallback((fieldName) => {
    setDeliveryFieldErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    loadCorrespondences(currentPage);
  }, [currentPage, loadCorrespondences]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCondominiumId]);

  return {
    apartments,
    residents,
    operatives,
    correspondences: items,
    currentPage,
    pagination,
    setCurrentPage,
    loadingInitial,
    submitting,
    delivering,
    error,
    fieldErrors,
    deliveryFieldErrors,
    activeCondominiumId,
    loadCorrespondences,
    createCorrespondence,
    deliverCorrespondence,
    clearFieldError,
    clearDeliveryFieldError,
  };
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
