import { useEffect, useState } from "react";

function CleaningAreaChecklistManager({
  open,
  area,
  items,
  loading,
  saving,
  onClose,
  onRefresh,
  onAddItem,
  onDeleteItem,
}) {
  const [itemName, setItemName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setItemName("");
    setError("");
  }, [open, area?.id]);

  useEffect(() => {
    if (!open || !area?.id) return;
    onRefresh(area.id).catch(() => undefined);
  }, [open, area?.id, onRefresh]);

  if (!open || !area) return null;

  const handleAddItem = async (event) => {
    event.preventDefault();
    setError("");

    const cleanName = String(itemName || "").trim();
    if (!cleanName) {
      setError("El nombre del item es obligatorio.");
      return;
    }

    try {
      await onAddItem(area.id, { item_name: cleanName });
      setItemName("");
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible agregar el item."));
    }
  };

  const handleDelete = async (itemId) => {
    setError("");

    try {
      await onDeleteItem(area.id, itemId);
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible eliminar el item."));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/45">
      <aside className="h-full w-full max-w-lg overflow-y-auto bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Checklist de area</h3>
            <p className="mt-1 text-sm text-slate-500">{area.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            Cerrar
          </button>
        </div>

        <form className="mt-4 flex gap-2" onSubmit={handleAddItem}>
          <input
            value={itemName}
            onChange={(event) => setItemName(event.target.value)}
            placeholder="Nuevo item de checklist"
            maxLength={255}
            className="h-10 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-70"
          >
            {saving ? "Guardando..." : "Agregar"}
          </button>
        </form>

        {error ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-4 rounded-xl border border-slate-200">
          {loading ? (
            <p className="p-4 text-sm text-slate-500">Cargando checklist...</p>
          ) : !items.length ? (
            <p className="p-4 text-sm text-slate-500">No hay items para esta area.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-sm text-slate-700">{item.item_name}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={saving}
                    className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
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

export default CleaningAreaChecklistManager;
