import { useEffect, useMemo, useState } from "react";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import apiClient from "../../../../services/apiClient";

const EMPTY_FORM = {
  full_name: "",
  email: "",
  document_number: "",
  phone: "",
  birth_date: "",
  apartment_id: "",
  type: "propietario",
  administration_fee: "",
  administration_due_day: "",
  property_owner_full_name: "",
  property_owner_document_number: "",
  property_owner_email: "",
  property_owner_phone: "",
  property_owner_birth_date: "",
  is_active: true,
};

function ResidentFormModal({ open, initialValues, loading, onCancel, onSubmit }) {
  const { activeCondominiumId } = useActiveCondominium();
  const [form, setForm] = useState(() => buildInitialForm(initialValues));
  const [apartments, setApartments] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [error, setError] = useState("");
  const isEditing = Boolean(initialValues);

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

  useEffect(() => {
    if (!open) return;
    setForm(buildInitialForm(initialValues));
    setError("");
  }, [initialValues, open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const loadAllRows = async (path) => {
      let page = 1;
      let lastPage = 1;
      const rows = [];

      do {
        const response = await apiClient.get(path, {
          ...(requestConfig || {}),
          params: {
            page,
            per_page: 10,
          },
        });

        const payload = response?.data;
        const pageRows = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

        rows.push(...pageRows);

        if (Array.isArray(payload)) {
          lastPage = 1;
        } else {
          lastPage = Number(payload?.last_page || 1);
        }

        page += 1;
      } while (page <= lastPage);

      return rows;
    };

    const loadCatalogs = async () => {
      setCatalogLoading(true);
      try {
        const apartmentsRows = await loadAllRows("/apartments");
        if (cancelled) return;
        setApartments(apartmentsRows);
      } catch (err) {
        if (!cancelled) {
          setApartments([]);
          setError(normalizeApiError(err, "No fue posible cargar apartamentos."));
        }
      } finally {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      }
    };

    loadCatalogs();

    return () => {
      cancelled = true;
    };
  }, [open, requestConfig]);

  const primaryApartments = useMemo(
    () => apartments.filter((item) => Boolean((item?.unit_type || item?.unitType)?.allows_residents)),
    [apartments]
  );

  const selectedApartment = useMemo(
    () => primaryApartments.find((item) => String(item.id) === String(form.apartment_id)),
    [form.apartment_id, primaryApartments]
  );

  const relatedUnits = useMemo(() => {
    if (!selectedApartment) return [];
    return Array.isArray(selectedApartment.children) ? selectedApartment.children : [];
  }, [selectedApartment]);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (name === "type" && value === "propietario") {
      setForm((prev) => ({
        ...prev,
        type: value,
        property_owner_full_name: "",
        property_owner_document_number: "",
        property_owner_email: "",
        property_owner_phone: "",
        property_owner_birth_date: "",
      }));

      if (error) setError("");
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (error) setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const fullName = String(form.full_name || "").trim();
    const email = String(form.email || "").trim();
    const documentNumber = String(form.document_number || "").trim();
    const apartmentId = Number(form.apartment_id);
    const administrationDueDayRaw = String(form.administration_due_day || "").trim();
    const hasAdministrationDueDay = administrationDueDayRaw !== "";
    const administrationDueDay = hasAdministrationDueDay ? parseInt(administrationDueDayRaw, 10) : null;

    if (!fullName || !email || !documentNumber) {
      setError("Nombre, email y documento son obligatorios.");
      return;
    }

    if (!apartmentId) {
      setError("Debes seleccionar un inmueble.");
      return;
    }

    if (
      hasAdministrationDueDay &&
      (!Number.isInteger(administrationDueDay) || administrationDueDay < 1 || administrationDueDay > 31)
    ) {
      setError("El día de vencimiento de administración debe estar entre 1 y 31.");
      return;
    }

    if (form.type === "arrendatario") {
      const ownerFullName = String(form.property_owner_full_name || "").trim();
      const ownerDocumentNumber = String(form.property_owner_document_number || "").trim();
      const ownerEmail = String(form.property_owner_email || "").trim();

      if (!ownerFullName || !ownerDocumentNumber || !ownerEmail) {
        setError("Para arrendatarios debes completar nombre, documento y correo del propietario.");
        return;
      }
    }

    const apartmentExists = primaryApartments.some((item) => Number(item.id) === apartmentId);
    if (!apartmentExists) {
      setError("Solo se pueden registrar residentes en inmuebles cuyo tipo permita residentes directos.");
      return;
    }

    try {
      const payload = {
        full_name: fullName,
        email,
        document_number: documentNumber,
        phone: String(form.phone || "").trim() || null,
        birth_date: form.birth_date || null,
        apartment_id: apartmentId,
        type: form.type,
        administration_fee:
          String(form.administration_fee || "").trim() === ""
            ? null
            : Number(form.administration_fee),
        administration_due_day: administrationDueDay,
        property_owner_full_name:
          form.type === "arrendatario" ? String(form.property_owner_full_name || "").trim() || null : null,
        property_owner_document_number:
          form.type === "arrendatario" ? String(form.property_owner_document_number || "").trim() || null : null,
        property_owner_email:
          form.type === "arrendatario" ? String(form.property_owner_email || "").trim() || null : null,
        property_owner_phone:
          form.type === "arrendatario" ? String(form.property_owner_phone || "").trim() || null : null,
        property_owner_birth_date:
          form.type === "arrendatario" ? form.property_owner_birth_date || null : null,
        is_active: Boolean(form.is_active),
      };

      await onSubmit(payload);
    } catch (err) {
      const message = normalizeApiError(err, "No fue posible guardar el residente.");
      setError(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-4 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <h3 className="text-lg font-extrabold text-slate-900">
          {isEditing ? "Editar residente" : "Nuevo residente"}
        </h3>
        <span className="mt-1 text-sm text-slate-600">
          Ingrese los datos de la persona que habita el inmueble. 
          Si el residente es arrendatario, complete más abajo la información del propietario.</span>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Nombre completo"
              name="full_name"
              value={form.full_name ?? ""}
              onChange={handleChange}
              required
            />
            <Field
              label="Documento"
              name="document_number"
              value={form.document_number ?? ""}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Email"
              name="email"
              type="email"
              value={form.email ?? ""}
              onChange={handleChange}
              required
            />
            <Field
              label="Telefono"
              name="phone"
              value={form.phone ?? ""}
              onChange={handleChange}
            />
          </div>

          <Field
            label="Fecha de nacimiento"
            name="birth_date"
            type="date"
            value={form.birth_date ?? ""}
            onChange={handleChange}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Valor administracion"
              name="administration_fee"
              type="number"
              min="0"
              step="0.01"
              value={form.administration_fee ?? ""}
              onChange={handleChange}
            />
            <Field
              label="Vencimiento administracion"
              name="administration_due_day"
              type="number"
              min="1"
              max="31"
              step="1"
              placeholder="Día de vencimiento (1-31)"
              value={form.administration_due_day || ""}
              onChange={handleChange}
            />
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Inmueble principal</span>
            <select
              name="apartment_id"
              value={form.apartment_id ?? ""}
              onChange={handleChange}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              required
              disabled={catalogLoading}
            >
              <option value="">{catalogLoading ? "Cargando..." : "Selecciona inmueble"}</option>
              {primaryApartments.map((item) => (
                <option key={item.id} value={item.id}>
                  {buildApartmentLabel(item)}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">Unidades relacionadas</p>
            {relatedUnits.length > 0 ? (
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {relatedUnits.map((item) => (
                  <li key={item.id} className="rounded-lg bg-white px-3 py-2">
                    {buildRelatedUnitLabel(item)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                Este inmueble no tiene unidades relacionadas.
              </p>
            )}
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Tipo de residente</span>
            <select
              name="type"
              value={form.type ?? "propietario"}
              onChange={handleChange}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="propietario">propietario</option>
              <option value="arrendatario">arrendatario</option>
            </select>
          </label>

          {form.type === "arrendatario" ? (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Datos del propietario</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Nombre propietario"
                  name="property_owner_full_name"
                  value={form.property_owner_full_name ?? ""}
                  onChange={handleChange}
                  required
                />
                <Field
                  label="Documento propietario"
                  name="property_owner_document_number"
                  value={form.property_owner_document_number ?? ""}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Email propietario"
                  name="property_owner_email"
                  type="email"
                  value={form.property_owner_email ?? ""}
                  onChange={handleChange}
                  required
                />
                <Field
                  label="Telefono propietario"
                  name="property_owner_phone"
                  value={form.property_owner_phone ?? ""}
                  onChange={handleChange}
                />
              </div>
              <Field
                label="Fecha nacimiento propietario"
                name="property_owner_birth_date"
                type="date"
                value={form.property_owner_birth_date ?? ""}
                onChange={handleChange}
              />
            </div>
          ) : null}

          <label className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <span className="text-sm font-semibold text-slate-700">Activo</span>
            <input
              type="checkbox"
              name="is_active"
              checked={Boolean(form.is_active)}
              onChange={handleChange}
              className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-300"
            />
          </label>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || catalogLoading}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-70"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        {...props}
        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  );
}

function buildInitialForm(initialValues) {
  if (!initialValues) return EMPTY_FORM;

  return {
    full_name: initialValues.user?.full_name ?? "",
    email: initialValues.user?.email ?? "",
    document_number: initialValues.user?.document_number ?? "",
    phone: initialValues.user?.phone ?? "",
    birth_date: initialValues.user?.birth_date
      ? String(initialValues.user.birth_date).slice(0, 10)
      : "",
    apartment_id: initialValues.apartment_id ? String(initialValues.apartment_id) : "",
    type: initialValues.type ?? "propietario",
    administration_fee:
      initialValues.administration_fee !== null && initialValues.administration_fee !== undefined
        ? String(initialValues.administration_fee)
        : "",
    administration_due_day: normalizeAdministrationDueDay(
      initialValues.administration_due_day ?? initialValues.administrationDueDay
    ),
    property_owner_full_name: initialValues.property_owner_full_name ?? "",
    property_owner_document_number: initialValues.property_owner_document_number ?? "",
    property_owner_email: initialValues.property_owner_email ?? "",
    property_owner_phone: initialValues.property_owner_phone ?? "",
    property_owner_birth_date: initialValues.property_owner_birth_date
      ? String(initialValues.property_owner_birth_date).slice(0, 10)
      : "",
    is_active: Boolean(initialValues.is_active),
  };
}

function buildApartmentLabel(apartment) {
  const number = apartment?.number ?? "-";
  const tower = apartment?.tower ? `Torre: ${apartment.tower}` : "Torre: Sin torre";
  const floor = apartment?.floor ?? "-";
  return `${number} | ${tower} | Piso: ${floor}`;
}

function buildRelatedUnitLabel(unit) {
  const typeName = unit?.unit_type?.name || unit?.unitType?.name || "Unidad";
  return `${typeName}: ${unit?.number || "-"} | Torre: ${unit?.tower || "Sin torre"} | Piso: ${unit?.floor ?? "-"}`;
}

function normalizeAdministrationDueDay(value) {
  if (value === null || value === undefined || value === "") return "";
  const day = parseInt(String(value), 10);
  if (!Number.isInteger(day)) return "";
  return String(day);
}

function normalizeApiError(err, fallbackMessage) {
  const responseData = err?.response?.data;
  const errors = responseData?.errors;

  if (errors && typeof errors === "object") {
    const firstFieldErrors = Object.values(errors).find(
      (fieldErrors) => Array.isArray(fieldErrors) && fieldErrors.length > 0
    );
    if (firstFieldErrors) {
      return translateValidationMessage(String(firstFieldErrors[0]));
    }
  }

  return String(responseData?.message || err?.message || fallbackMessage || "");
}

function translateValidationMessage(message) {
  const rawMessage = String(message || "");
  const trimmedMessage = rawMessage.trim();

  const takenMatch = trimmedMessage.match(/^the\s+(.+?)\s+has already been taken\.?$/i);
  if (takenMatch) {
    const fieldLabel = resolveFieldLabel(takenMatch[1]);
    return fieldLabel
      ? "Ya existe un registro con ese " + fieldLabel + "."
      : "Ya existe un registro con esos datos.";
  }

  const requiredMatch = trimmedMessage.match(/^the\s+(.+?)\s+field is required\.?$/i);
  if (requiredMatch) {
    const fieldLabel = resolveFieldLabel(requiredMatch[1]);
    return fieldLabel
      ? "El campo " + fieldLabel + " es obligatorio."
      : "Este campo es obligatorio.";
  }

  const emailMatch = trimmedMessage.match(/^the\s+(.+?)\s+must be a valid email address\.?$/i);
  if (emailMatch) {
    const fieldLabel = resolveFieldLabel(emailMatch[1]);
    return fieldLabel
      ? "El campo " + fieldLabel + " debe ser un correo valido."
      : "Debes ingresar un correo valido.";
  }

  return rawMessage;
}

function resolveFieldLabel(fieldName) {
  const normalizedField = String(fieldName || "").toLowerCase();

  const labels = {
    email: "correo",
    phone: "telefono",
    number: "numero",
    tower: "torre",
    apartment_id: "apartamento",
    apartment: "inmueble",
    document_number: "documento",
  };

  const cleanField = normalizedField.replace(/_/g, " ").trim();
  return labels[normalizedField] || cleanField;
}

export default ResidentFormModal;
