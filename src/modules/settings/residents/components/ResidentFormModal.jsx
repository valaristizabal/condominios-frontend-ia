import { useState } from "react";

const EMPTY_FORM = {
  full_name: "",
  email: "",
  document_number: "",
  phone: "",
  birth_date: "",
  apartment_id: "",
  type: "propietario",
  is_active: true,
};

function ResidentFormModal({ open, initialValues, loading, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => buildInitialForm(initialValues));
  const [error, setError] = useState("");
  const isEditing = Boolean(initialValues);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (error) setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        document_number: form.document_number.trim(),
        phone: form.phone.trim() || null,
        birth_date: form.birth_date || null,
        apartment_id: form.apartment_id ? Number(form.apartment_id) : null,
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

          <Field
            label="ID de apartamento"
            name="apartment_id"
            type="number"
            value={form.apartment_id ?? ""}
            onChange={handleChange}
            required
          />

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Tipo</span>
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
              disabled={loading}
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
    is_active: Boolean(initialValues.is_active),
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

export default ResidentFormModal;
