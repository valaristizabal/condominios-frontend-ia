import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "../../../../services/apiClient";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";

export function useRevenuePortfolio({ period = "current" } = {}) {
  const { activeCondominiumId } = useActiveCondominium();

  const [summary, setSummary] = useState(null);
  const [portfolioStatus, setPortfolioStatus] = useState([]);
  const [collections, setCollections] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
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

  const loadData = useCallback(async () => {
    if (!activeCondominiumId) {
      setSummary(null);
      setPortfolioStatus([]);
      setCollections([]);
      setUnitOptions([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [summaryRes, statusRes, collectionsRes, unitOptionsRes] = await Promise.all([
        apiClient.get("/portfolio/summary", {
          ...(requestConfig || {}),
          params: { period },
        }),
        apiClient.get("/portfolio/portfolio-status", {
          ...(requestConfig || {}),
          params: { period, page: 1, per_page: 10 },
        }),
        apiClient.get("/portfolio/collections", {
          ...(requestConfig || {}),
          params: { period, page: 1, per_page: 10 },
        }),
        apiClient.get("/portfolio/unit-options", {
          ...(requestConfig || {}),
          params: { period },
        }),
      ]);

      const summaryPayload = summaryRes?.data || null;
      const statusPayload = statusRes?.data || {};
      const collectionsPayload = collectionsRes?.data || {};
      const unitsPayload = unitOptionsRes?.data || [];

      setSummary(summaryPayload);
      setPortfolioStatus(Array.isArray(statusPayload?.data) ? statusPayload.data : []);
      setCollections(Array.isArray(collectionsPayload?.data) ? collectionsPayload.data : []);
      setUnitOptions(Array.isArray(unitsPayload) ? unitsPayload : []);
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible cargar recaudo y cartera."));
      setSummary(null);
      setPortfolioStatus([]);
      setCollections([]);
      setUnitOptions([]);
    } finally {
      setLoading(false);
    }
  }, [activeCondominiumId, period, requestConfig]);

  const createCollection = useCallback(
    async ({ chargeId, amount, paymentDate, evidence, notes }) => {
      if (!activeCondominiumId) {
        throw new Error("No hay condominio activo.");
      }

      setSubmitting(true);
      setError("");
      setFieldErrors({});

      try {
        const formData = new FormData();
        formData.append("charge_id", String(chargeId));
        formData.append("amount", String(amount));
        formData.append("payment_date", String(paymentDate));

        if (notes) {
          formData.append("notes", String(notes));
        }

        if (evidence) {
          formData.append("evidence", evidence);
        }

        const response = await apiClient.post("/portfolio/collections", formData, {
          ...(requestConfig || {}),
          headers: {
            ...(requestConfig?.headers || {}),
            "Content-Type": "multipart/form-data",
          },
        });

        await loadData();
        return response?.data;
      } catch (err) {
        const nextFieldErrors = extractFieldErrors(err);
        if (Object.keys(nextFieldErrors).length > 0) {
          setFieldErrors(nextFieldErrors);
        }
        setError(normalizeApiError(err, "No fue posible registrar el recaudo."));
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [activeCondominiumId, loadData, requestConfig]
  );

  const clearFieldError = useCallback((fieldName) => {
    setFieldErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }, []);

  const generateCurrentPortfolio = useCallback(
    async () => {
      if (!activeCondominiumId) {
        throw new Error("No hay condominio activo.");
      }

      setGenerating(true);
      setError("");

      try {
        const response = await apiClient.post(
          "/portfolio/generate-current",
          {},
          requestConfig
        );

        await loadData();
        return response?.data;
      } catch (err) {
        setError(normalizeApiError(err, "No fue posible generar la cartera mensual."));
        throw err;
      } finally {
        setGenerating(false);
      }
    },
    [activeCondominiumId, loadData, requestConfig]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    summary,
    portfolioStatus,
    collections,
    unitOptions,
    loading,
    submitting,
    generating,
    error,
    fieldErrors,
    hasTenantContext: Boolean(activeCondominiumId),
    loadData,
    createCollection,
    generateCurrentPortfolio,
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
