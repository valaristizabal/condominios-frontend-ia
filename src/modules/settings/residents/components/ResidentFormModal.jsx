import { useState } from "react";

const EMPTY_FORM = {
  user_id: "",
  apartment_id: "",
  type: "propietario",
  is_active: true,
};

function ResidentFormModal({ open, initialValues, loading, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => initialValues || EMPTY_FORM);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await onSubmit({
        ...form,
        user_id: form.user_id ? Number(form.user_id) : null,
        apartment_id: form.apartment_id ? Number(form.apartment_id) : null,
      });
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "No fue posible guardar el residente.";
      setError(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-4 sm:items-center">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl">
        <h3 className="text-lg font-extrabold text-slate-900">
          {initialValues ? "Editar residente" : "Nuevo residente"}
        </h3>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <Field
            label="ID de usuario"
            name="user_id"
            type="number"
            value={form.user_id ?? ""}
            onChange={handleChange}
            required
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

export default ResidentFormModal;
