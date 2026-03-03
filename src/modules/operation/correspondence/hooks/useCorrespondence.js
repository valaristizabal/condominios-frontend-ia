import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "../../../../services/apiClient";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";

export function useCorrespondence() {
  const { activeCondominiumId } = useActiveCondominium();
  const [apartments, setApartments] = useState([]);
  const [residents, setResidents] = useState([]);
  const [items, setItems] = useState([]);
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

  const loadInitialData = useCallback(async () => {
    if (!activeCondominiumId) {
      setApartments([]);
      setResidents([]);
      setItems([]);
      return;
    }

    setLoadingInitial(true);
    setError("");

    try {
      const [apartmentsRes, residentsRes, correspondencesRes] = await Promise.all([
        apiClient.get("/apartments", requestConfig),
        apiClient.get("/residents", requestConfig),
        apiClient.get("/correspondences", requestConfig),
      ]);

      setApartments(Array.isArray(apartmentsRes.data) ? apartmentsRes.data : []);
      setResidents(Array.isArray(residentsRes.data) ? residentsRes.data : []);
      setItems(Array.isArray(correspondencesRes.data) ? correspondencesRes.data : []);
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible cargar correspondencia."));
      setApartments([]);
      setResidents([]);
      setItems([]);
    } finally {
      setLoadingInitial(false);
    }
  }, [activeCondominiumId, requestConfig]);

  const loadCorrespondences = useCallback(async () => {
    if (!activeCondominiumId) {
      setItems([]);
      return;
    }

    const response = await apiClient.get("/correspondences", requestConfig);
    setItems(Array.isArray(response.data) ? response.data : []);
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

        await loadCorrespondences();
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
    async (id, residentReceiverId, digitalSignature) => {
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

        await loadCorrespondences();
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
    [activeCondominiumId, loadCorrespondences, requestConfig]
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

  return {
    apartments,
    residents,
    correspondences: items,
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
