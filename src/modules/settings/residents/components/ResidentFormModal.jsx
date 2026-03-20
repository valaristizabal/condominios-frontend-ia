import { useEffect, useMemo, useState } from "react";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import apiClient from "../../../../services/apiClient";

const EMPTY_FORM = {
  full_name: "",
  email: "",
  document_number: "",
  phone: "",
  birth_date: "",
  unit_type_id: "",
  apartment_id: "",
  type: "propietario",
  is_active: true,
};

function ResidentFormModal({ open, initialValues, loading, onCancel, onSubmit }) {
  const { activeCondominiumId } = useActiveCondominium();
  const [form, setForm] = useState(() => buildInitialForm(initialValues));
  const [unitTypes, setUnitTypes] = useState([]);
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
        const [unitTypesRows, apartmentsRows] = await Promise.all([
          loadAllRows("/unit-types"),
          loadAllRows("/apartments"),
        ]);

        if (cancelled) return;

        setUnitTypes(unitTypesRows);
        setApartments(apartmentsRows);
      } catch (err) {
        if (!cancelled) {
          setUnitTypes([]);
          setApartments([]);
          setError(normalizeApiError(err, "No fue posible cargar tipos y inmuebles."));
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

  useEffect(() => {
    if (!open || !apartments.length) return;

    if (!form.unit_type_id && form.apartment_id) {
      const selectedApartment = apartments.find((item) => String(item.id) === String(form.apartment_id));
      if (selectedApartment?.unit_type_id) {
        setForm((prev) => ({
          ...prev,
          unit_type_id: String(selectedApartment.unit_type_id),
        }));
      }
    }
  }, [apartments, form.apartment_id, form.unit_type_id, open]);

  const filteredApartments = useMemo(() => {
    if (!form.unit_type_id) return [];

    return apartments.filter((item) => String(item.unit_type_id) === String(form.unit_type_id));
  }, [apartments, form.unit_type_id]);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((prev) => {
      if (name === "unit_type_id") {
        return {
          ...prev,
          unit_type_id: value,
          apartment_id: "",
        };
      }

      return {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
    });

    if (error) setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const fullName = String(form.full_name || "").trim();
    const email = String(form.email || "").trim();
    const documentNumber = String(form.document_number || "").trim();
    const unitTypeId = Number(form.unit_type_id);
    const apartmentId = Number(form.apartment_id);

    if (!fullName || !email || !documentNumber) {
      setError("Nombre, email y documento son obligatorios.");
      return;
    }

    if (!unitTypeId) {
      setError("Debes seleccionar el tipo de inmueble.");
      return;
    }

    if (!apartmentId) {
      setError("Debes seleccionar el inmueble.");
      return;
    }

    const apartmentMatchesUnitType = apartments.some(
      (item) =>
        Number(item.id) === apartmentId &&
        Number(item.unit_type_id) === unitTypeId
    );

    if (!apartmentMatchesUnitType) {
      setError("El inmueble seleccionado no corresponde al tipo de inmueble elegido.");
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
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl">
        <h3 className="text-lg font-extrabold text-slate-900">
          {isEditing ? "Editar residente" : "Nuevo residente"}
        </h3>

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
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Tipo de inmueble</span>
              <select
                name="unit_type_id"
                value={form.unit_type_id ?? ""}
                onChange={handleChange}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
                disabled={catalogLoading}
              >
                <option value="">{catalogLoading ? "Cargando..." : "Selecciona tipo"}</option>
                {unitTypes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Inmueble</span>
              <select
                name="apartment_id"
                value={form.apartment_id ?? ""}
                onChange={handleChange}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
                disabled={catalogLoading || !form.unit_type_id}
              >
                <option value="">
                  {!form.unit_type_id
                    ? "Primero selecciona tipo"
                    : catalogLoading
                    ? "Cargando..."
                    : "Selecciona inmueble"}
                </option>
                {filteredApartments.map((item) => (
                  <option key={item.id} value={item.id}>
                    {buildApartmentLabel(item)}
                  </option>
                ))}
              </select>
            </label>
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
    unit_type_id: initialValues.apartment?.unit_type_id
      ? String(initialValues.apartment.unit_type_id)
      : "",
    apartment_id: initialValues.apartment_id ? String(initialValues.apartment_id) : "",
    type: initialValues.type ?? "propietario",
    is_active: Boolean(initialValues.is_active),
  };
}

function buildApartmentLabel(apartment) {
  const number = apartment?.number ?? "-";
  const tower = apartment?.tower ? `Torre: ${apartment.tower}` : "Torre: Sin torre";
  const floor = apartment?.floor ?? "-";
  return `${number} | ${tower} | Piso: ${floor}`;
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

export default ResidentFormModal;

