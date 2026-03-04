import { useEffect, useMemo, useState } from "react";

function CleaningRecordFormModal({ open, areas, operatives, loading, onCancel, onSubmit }) {
  const [form, setForm] = useState({
    cleaning_area_id: "",
    operative_id: "",
    cleaning_date: "",
    observations: "",
  });
  const [error, setError] = useState("");

  const areaOptions = useMemo(
    () =>
      (areas || []).map((item) => ({
        value: String(item.id),
        label: item.name || `Area #${item.id}`,
      })),
    [areas]
  );

  const operativeOptions = useMemo(
    () =>
      (operatives || []).map((item) => ({
        value: String(item.id),
        label: item?.user?.full_name || `Operativo #${item.id}`,
      })),
    [operatives]
  );

  useEffect(() => {
    if (!open) return;
    setForm({
      cleaning_area_id: "",
      operative_id: "",
      cleaning_date: toDateInput(new Date()),
      observations: "",
    });
    setError("");
  }, [open]);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.cleaning_area_id || !form.operative_id || !form.cleaning_date) {
      setError("Area, operativo y fecha son obligatorios.");
      return;
    }

    try {
      await onSubmit({
        cleaning_area_id: Number(form.cleaning_area_id),
        operative_id: Number(form.operative_id),
        cleaning_date: form.cleaning_date,
        observations: String(form.observations || "").trim() || null,
      });
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible crear el registro de limpieza."));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-4 sm:items-center">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl">
        <h3 className="text-lg font-extrabold text-slate-900">Nuevo registro de limpieza</h3>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Area de limpieza</span>
            <select
              name="cleaning_area_id"
              value={form.cleaning_area_id}
              onChange={handleChange}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              required
            >
              <option value="">Selecciona un area</option>
              {areaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Operativo</span>
            <select
              name="operative_id"
              value={form.operative_id}
              onChange={handleChange}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              required
            >
              <option value="">Selecciona un operativo</option>
              {operativeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Fecha</span>
            <input
              type="date"
              name="cleaning_date"
              value={form.cleaning_date}
              onChange={handleChange}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Observaciones</span>
            <textarea
              name="observations"
              value={form.observations}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="Opcional"
            />
          </label>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-70"
            >
              {loading ? "Guardando..." : "Crear registro"}
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

function toDateInput(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

export default CleaningRecordFormModal;
