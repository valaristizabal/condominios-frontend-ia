import { useEffect, useMemo, useState } from "react";

function InventoryFormModal({ open, initialValues, loading, onCancel, onSubmit }) {
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");

  const isEditing = useMemo(() => Boolean(initialValues), [initialValues]);

  useEffect(() => {
    if (!open) return;
    setName(initialValues?.name ?? "");
    setIsActive(
      typeof initialValues?.is_active === "boolean" ? Boolean(initialValues.is_active) : true
    );
    setError("");
  }, [initialValues, open]);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const cleanName = name.trim();
    if (!cleanName) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (cleanName.length > 255) {
      setError("El nombre no puede superar 255 caracteres.");
      return;
    }

    try {
      await onSubmit({
        name: cleanName,
        is_active: isActive,
      });
    } catch (err) {
      const message = normalizeApiError(err, "No fue posible guardar el inventario.");
      setError(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
        <h3 className="text-lg font-extrabold text-slate-900">
          {isEditing ? "Editar inventario" : "Nuevo inventario"}
        </h3>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Nombre</span>
            <input
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={255}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="Ej: Bodega principal"
              required
            />
          </label>

          <label className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <span className="text-sm font-semibold text-slate-700">Activo</span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
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

export default InventoryFormModal;

