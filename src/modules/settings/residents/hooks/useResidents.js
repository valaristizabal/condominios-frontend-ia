import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "../../../../services/apiClient";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";

export function useResidents(filters = {}) {
  const { activeCondominiumId } = useActiveCondominium();
  const [items, setItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  const normalizedQuery = String(filters?.query || "").trim();
  const normalizedStatus = String(filters?.status || "all");
  const normalizedResidentType = String(filters?.residentType || "all");
  const normalizedPropertyType = String(filters?.propertyType || "all");

  const loadResidents = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");

    try {
      const params = {
        page,
        per_page: 10,
      };

      if (normalizedQuery) {
        params.q = normalizedQuery;
      }

      if (normalizedStatus === "active") {
        params.is_active = 1;
      } else if (normalizedStatus === "inactive") {
        params.is_active = 0;
      }

      if (normalizedResidentType !== "all") {
        params.type = normalizedResidentType;
      }

      if (normalizedPropertyType !== "all") {
        params.unit_type_name = normalizedPropertyType;
      }

      const response = await apiClient.get("/residents", {
        ...(requestConfig || {}),
        params,
      });

      const payload = response?.data || {};
      const rows = Array.isArray(payload?.data)
        ? payload.data.map((item) => ({
            ...item,
            administration_fee: item?.administration_fee ?? item?.administrationFee ?? null,
            administration_due_day: item?.administration_due_day ?? item?.administrationDueDay ?? null,
            property_owner_full_name:
              item?.property_owner_full_name ?? item?.propertyOwnerFullName ?? null,
            property_owner_document_number:
              item?.property_owner_document_number ?? item?.propertyOwnerDocumentNumber ?? null,
            property_owner_email: item?.property_owner_email ?? item?.propertyOwnerEmail ?? null,
            property_owner_phone: item?.property_owner_phone ?? item?.propertyOwnerPhone ?? null,
            property_owner_birth_date:
              item?.property_owner_birth_date ?? item?.propertyOwnerBirthDate ?? null,
          }))
        : [];
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
    } catch (err) {
      const message = normalizeApiError(err, "No fue posible cargar residentes.");
      setError(message);
      setItems([]);
      setPagination({
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        total: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [normalizedPropertyType, normalizedQuery, normalizedResidentType, normalizedStatus, requestConfig]);

  const createResident = useCallback(async (payload) => {
    setSaving(true);
    setError("");
    try {
      const response = await apiClient.post("/residents", payload, requestConfig);
      setCurrentPage(1);
      await loadResidents(1);
      return response.data;
    } catch (err) {
      const message = normalizeApiError(err, "No fue posible crear el residente.");
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [loadResidents, requestConfig]);

  const updateResident = useCallback(async (id, payload) => {
    setSaving(true);
    setError("");
    try {
      const response = await apiClient.put(`/residents/${id}`, payload, requestConfig);
      await loadResidents(currentPage);
      return response.data;
    } catch (err) {
      const message = normalizeApiError(err, "No fue posible actualizar el residente.");
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [currentPage, loadResidents, requestConfig]);

  const previewResidentsCsv = useCallback(async (file, { autoCreateUnits = false } = {}) => {
    setSaving(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("auto_create_units", autoCreateUnits ? "1" : "0");

      const response = await apiClient.post("/residents/import/preview", formData, {
        ...(requestConfig || {}),
        headers: {
          ...(requestConfig?.headers || {}),
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (err) {
      const message = normalizeApiError(err, "No fue posible validar el archivo CSV.");
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [requestConfig]);

  const importResidentsCsv = useCallback(async (file, { autoCreateUnits = false } = {}) => {
    setSaving(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("auto_create_units", autoCreateUnits ? "1" : "0");

      const response = await apiClient.post("/residents/import", formData, {
        ...(requestConfig || {}),
        headers: {
          ...(requestConfig?.headers || {}),
          "Content-Type": "multipart/form-data",
        },
      });

      setCurrentPage(1);
      await loadResidents(1);
      return response.data;
    } catch (err) {
      const message = normalizeApiError(err, "No fue posible importar el archivo CSV.");
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [loadResidents, requestConfig]);

  const changeUserPassword = useCallback(async (userId, payload) => {
    setSaving(true);
    setError("");
    try {
      const response = await apiClient.patch(`/users/${userId}/change-password`, payload, requestConfig);
      return response.data;
    } catch (err) {
      const message = normalizeApiError(err, "No fue posible actualizar la contraseña.");
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [requestConfig]);

  useEffect(() => {
    loadResidents(currentPage);
  }, [currentPage, loadResidents]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCondominiumId, normalizedQuery, normalizedStatus, normalizedResidentType, normalizedPropertyType]);

  const hasTenantContext = useMemo(() => Boolean(activeCondominiumId), [activeCondominiumId]);

  return {
    residents: items,
    currentPage,
    pagination,
    setCurrentPage,
    loading,
    saving,
    error,
    hasTenantContext,
    activeCondominiumId,
    loadResidents,
    createResident,
    updateResident,
    previewResidentsCsv,
    importResidentsCsv,
    changeUserPassword,
  };
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
