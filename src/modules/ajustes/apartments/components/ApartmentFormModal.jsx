import { useEffect, useMemo, useState } from "react";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import apiClient from "../../../../services/apiClient";

function ApartmentFormModal({ open, initialValues, loading, onCancel, onSubmit }) {
  const { activeCondominiumId } = useActiveCondominium();
  const [form, setForm] = useState({
    tower: "",
    number: "",
    floor: "",
    unit_type_id: "",
    is_active: true,
  });
  const [unitTypes, setUnitTypes] = useState([]);
  const [fetchingUnitTypes, setFetchingUnitTypes] = useState(false);
  const [error, setError] = useState("");

  const isEditing = useMemo(() => Boolean(initialValues), [initialValues]);

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

    setForm({
      tower: initialValues?.tower ?? "",
      number: initialValues?.number ?? "",
      floor: initialValues?.floor ?? "",
      unit_type_id: initialValues?.unit_type_id
        ? String(initialValues.unit_type_id)
        : initialValues?.unitType?.id
        ? String(initialValues.unitType.id)
        : "",
      is_active:
        typeof initialValues?.is_active === "boolean" ? Boolean(initialValues.is_active) : true,
    });
    setError("");
  }, [initialValues, open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const loadUnitTypes = async () => {
      setFetchingUnitTypes(true);
      try {
        const response = await apiClient.get("/unit-types", requestConfig);
        if (!cancelled) {
          setUnitTypes(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setUnitTypes([]);
          setError(normalizeApiError(err, "No fue posible cargar tipos de unidad."));
        }
      } finally {
        if (!cancelled) {
          setFetchingUnitTypes(false);
        }
      }
    };

    loadUnitTypes();

    return () => {
      cancelled = true;
    };
  }, [open, requestConfig]);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (error) setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const number = String(form.number || "").trim();
    const tower = String(form.tower || "").trim();
    const floorText = String(form.floor || "").trim();
    const unitTypeId = Number(form.unit_type_id);

    if (!number) {
      setError("El nÃºmero del inmueble es obligatorio.");
      return;
    }

    if (number.length > 50) {
      setError("El nÃºmero no puede superar 50 caracteres.");
      return;
    }

    if (tower.length > 50) {
      setError("La torre no puede superar 50 caracteres.");
      return;
    }

    if (!unitTypeId) {
      setError("Debes seleccionar un tipo de unidad.");
      return;
    }

    const floorNumber = floorText === "" ? null : Number(floorText);
    if (floorNumber !== null && !Number.isInteger(floorNumber)) {
      setError("El piso debe ser un nÃºmero entero.");
      return;
    }

    try {
      await onSubmit({
        unit_type_id: unitTypeId,
        number,
        tower: tower || null,
        floor: floorNumber,
        is_active: Boolean(form.is_active),
      });
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible guardar el inmueble."));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-4 sm:items-center">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl">
        <h3 className="text-lg font-extrabold text-slate-900">
          {isEditing ? "Editar inmueble" : "Nuevo inmueble"}
        </h3>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Numero"
              name="number"
              value={form.number}
              onChange={handleChange}
              placeholder="Ej: 1204"
              maxLength={50}
              required
            />
            <Field
              label="Torre"
              name="tower"
              value={form.tower}
              onChange={handleChange}
              placeholder="Ej: Torre A"
              maxLength={50}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Piso"
              name="floor"
              type="number"
              step="1"
              value={form.floor}
              onChange={handleChange}
              placeholder="Ej: 12"
            />

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Tipo de unidad</span>
              <select
                name="unit_type_id"
                value={form.unit_type_id}
                onChange={handleChange}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
                disabled={fetchingUnitTypes}
              >
                <option value="">{fetchingUnitTypes ? "Cargando tipos..." : "Seleccione tipo"}</option>
                {unitTypes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

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
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || fetchingUnitTypes}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-70"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-70"
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

export default ApartmentFormModal;

