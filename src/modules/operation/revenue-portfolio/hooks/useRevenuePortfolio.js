import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "../../../../services/apiClient";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";

const MAX_REVENUE_PORTFOLIO_PER_PAGE = 10;

export function useRevenuePortfolio({ period = "current" } = {}) {
  const { activeCondominiumId } = useActiveCondominium();

  const [summary, setSummary] = useState(null);
  const [portfolioStatus, setPortfolioStatus] = useState([]);
  const [collections, setCollections] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const [portfolioCharges, setPortfolioCharges] = useState([]);
  const [debtSummary, setDebtSummary] = useState([]);
  const [portfolioOwnersByApartment, setPortfolioOwnersByApartment] = useState({});

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
      setPortfolioCharges([]);
      setDebtSummary([]);
      setPortfolioOwnersByApartment({});
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [statusRes, collectionsRes, unitOptionsRes, chargesRows, debtSummaryRes, residentsRows] = await Promise.all([
        apiClient.get("/portfolio/portfolio-status", {
          ...(requestConfig || {}),
          params: { period, page: 1, per_page: MAX_REVENUE_PORTFOLIO_PER_PAGE },
        }),
        apiClient.get("/portfolio/collections", {
          ...(requestConfig || {}),
          params: {
            ...buildCollectionsQueryParams(period),
            page: 1,
            per_page: MAX_REVENUE_PORTFOLIO_PER_PAGE,
          },
        }),
        apiClient.get("/portfolio/unit-options", {
          ...(requestConfig || {}),
          params: { period },
        }),
        loadAllRows("/portfolio/charges", requestConfig, { period: "all" }),
        apiClient.get("/residents/debt-summary", requestConfig || {}),
        loadAllRows("/residents", requestConfig),
      ]);

      const statusPayload = statusRes?.data || {};
      const collectionsPayload = collectionsRes?.data || {};
      const unitsPayload = unitOptionsRes?.data || [];
      const debtPayload = debtSummaryRes?.data || [];

      setSummary(statusPayload?.kpis || null);
      setPortfolioStatus(Array.isArray(statusPayload?.data) ? statusPayload.data : []);
      setCollections(Array.isArray(collectionsPayload?.data) ? collectionsPayload.data : []);
      setUnitOptions(Array.isArray(unitsPayload) ? unitsPayload : []);
      setPortfolioCharges(Array.isArray(chargesRows) ? chargesRows : []);
      setDebtSummary(Array.isArray(debtPayload) ? debtPayload : []);
      setPortfolioOwnersByApartment(buildPortfolioOwnersByApartment(residentsRows));
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible cargar recaudo y cartera."));
      setSummary(null);
      setPortfolioStatus([]);
      setCollections([]);
      setUnitOptions([]);
      setPortfolioCharges([]);
      setDebtSummary([]);
      setPortfolioOwnersByApartment({});
    } finally {
      setLoading(false);
    }
  }, [activeCondominiumId, period, requestConfig]);

  const createCollection = useCallback(
    async ({ chargeId, amount, paymentDate, evidence, notes, refresh = true }) => {
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

        const createdCollection = response?.data;
        setCollections((prev) => mergeCollectionRecords(prev, [createdCollection]));

        if (refresh) {
          await loadData();
          setCollections((prev) => mergeCollectionRecords(prev, [createdCollection]));
        }

        return createdCollection;
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
    portfolioCharges,
    debtSummary,
    portfolioOwnersByApartment,
    loading,
    submitting,
    generating,
    error,
    fieldErrors,
    activeCondominiumId,
    hasTenantContext: Boolean(activeCondominiumId),
    loadData,
    createCollection,
    generateCurrentPortfolio,
    clearFieldError,
  };
}

async function loadAllRows(endpoint, requestConfig, params = {}) {
  const rows = [];
  let page = 1;
  let lastPage = 1;
  const perPage = Math.min(MAX_REVENUE_PORTFOLIO_PER_PAGE, 10);

  do {
    const response = await apiClient.get(endpoint, {
      ...(requestConfig || {}),
      params: {
        ...params,
        page,
        per_page: perPage,
      },
    });

    const payload = response?.data || {};
    const pageRows = Array.isArray(payload?.data) ? payload.data : [];
    rows.push(...pageRows);

    const reportedLastPage = Number(payload?.last_page || 1);
    lastPage = reportedLastPage > 0 ? reportedLastPage : 1;
    page += 1;
  } while (page <= lastPage);

  return rows;
}

function buildCollectionsQueryParams(period) {
  const normalizedPeriod = String(period || "").trim();

  if (["all", "historico", "historial"].includes(normalizedPeriod.toLowerCase())) {
    return { period: "all" };
  }

  const range = resolveMonthDateRange(normalizedPeriod);
  if (!range) {
    return { period: normalizedPeriod || "current" };
  }

  return {
    period: "all",
    date_from: range.dateFrom,
    date_to: range.dateTo,
  };
}

function resolveMonthDateRange(period) {
  if (!period || period === "current") {
    const today = new Date();
    return buildMonthDateRange(today.getFullYear(), today.getMonth() + 1);
  }

  const monthMatch = String(period).match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  if (!monthMatch) return null;

  const year = Number(monthMatch[1]);
  const month = Number(monthMatch[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return buildMonthDateRange(year, month);
}

function buildMonthDateRange(year, month) {
  const lastDay = new Date(year, month, 0).getDate();
  const monthLabel = String(month).padStart(2, "0");

  return {
    dateFrom: `${year}-${monthLabel}-01`,
    dateTo: `${year}-${monthLabel}-${String(lastDay).padStart(2, "0")}`,
  };
}

function mergeCollectionRecords(currentRecords, incomingRecords) {
  const merged = [];
  const seen = new Set();

  [...(Array.isArray(incomingRecords) ? incomingRecords : []), ...(Array.isArray(currentRecords) ? currentRecords : [])]
    .filter(Boolean)
    .forEach((record) => {
      const key = record?.id !== null && record?.id !== undefined ? String(record.id) : "";
      if (!key || seen.has(key)) return;

      seen.add(key);
      merged.push(record);
    });

  return merged;
}

function buildPortfolioOwnersByApartment(rows) {
  return (Array.isArray(rows) ? rows : []).reduce((accumulator, resident) => {
    const apartmentId = resident?.apartment_id ?? resident?.apartment?.id;
    if (apartmentId === null || apartmentId === undefined) {
      return accumulator;
    }

    const apartmentKey = String(apartmentId);
    const residentName = String(resident?.user?.full_name || resident?.full_name || "").trim();
    const ownerReferenceName = String(
      resident?.property_owner_full_name || resident?.property_owner_name || ""
    ).trim();
    const residentType = String(resident?.type || "").trim().toLowerCase();

    const current = accumulator[apartmentKey] || { priority: 0, name: "" };
    let next = current;

    if (residentType === "propietario" && residentName) {
      next = { priority: 3, name: residentName };
    } else if (ownerReferenceName && current.priority < 2) {
      next = { priority: 2, name: ownerReferenceName };
    } else if (residentName && current.priority < 1) {
      next = { priority: 1, name: residentName };
    }

    accumulator[apartmentKey] = next;
    return accumulator;
  }, {});
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
