import { useEffect, useMemo, useState } from "react";
import SearchableSelect from "../../../components/common/SearchableSelect";

function EmergencyFormModal({ open, loading, emergencyTypes = [], fieldErrors = {}, onCancel, onSubmit, onFieldChange }) {
  const [form, setForm] = useState({
    emergency_type_id: "",
    event_location: "",
    description: "",
    event_date: "",
  });
  const [error, setError] = useState("");

  const hasTypes = useMemo(() => emergencyTypes.length > 0, [emergencyTypes]);

  const emergencyTypeOptions = useMemo(
    () => emergencyTypes.map((item) => ({ value: String(item.id), label: `${item.name} (${item.level})` })),
    [emergencyTypes]
  );

  useEffect(() => {
    if (!open) return;
    const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setForm({
      emergency_type_id: emergencyTypes[0]?.id ? String(emergencyTypes[0].id) : "",
      event_location: "",
      description: "",
      event_date: nowLocal,
    });
    setError("");
  }, [open, emergencyTypes]);

  if (!open) return null;

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    onFieldChange?.(name);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.emergency_type_id) {
      setError("Debes seleccionar un tipo de emergencia.");
      return;
    }

    if (!form.event_date) {
      setError("La fecha del evento es obligatoria.");
      return;
    }

    try {
      await onSubmit({
        emergency_type_id: Number(form.emergency_type_id),
        event_type: resolveEventType(form.emergency_type_id, emergencyTypes),
        event_location: form.event_location.trim(),
        description: form.description.trim(),
        event_date: form.event_date,
      });
    } catch (err) {
      setError(err?.response?.data?.message || "No fue posible registrar la emergencia.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-4 sm:items-center">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl">
        <h3 className="text-lg font-extrabold text-slate-900">Registrar emergencia</h3>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Tipo de emergencia</span>
              <SearchableSelect
                value={form.emergency_type_id}
                onChange={(value) => setField("emergency_type_id", String(value))}
                options={emergencyTypeOptions}
                placeholder={hasTypes ? "Seleccione tipo..." : "Sin tipos activos"}
                searchPlaceholder="Buscar tipo de emergencia..."
                disabled={!hasTypes}
              />
              <FieldError message={fieldErrors.emergency_type_id} />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Fecha y hora</span>
              <input
                type="datetime-local"
                value={form.event_date}
                onChange={(event) => setField("event_date", event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <FieldError message={fieldErrors.event_date} />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Ubicación</span>
            <input
              value={form.event_location}
              onChange={(event) => setField("event_location", event.target.value)}
              maxLength={255}
              placeholder="Ej: Torre B - Lobby"
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <FieldError message={fieldErrors.event_location} />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Descripción</span>
            <textarea
              value={form.description}
              onChange={(event) => setField("description", event.target.value)}
              rows={4}
              placeholder="Describe lo ocurrido..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <FieldError message={fieldErrors.description} />
          </label>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !hasTypes}
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

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-semibold text-red-600">{message}</p>;
}

function resolveEventType(typeId, emergencyTypes = []) {
  const selectedType = emergencyTypes.find((item) => String(item.id) === String(typeId));
  const resolved = String(selectedType?.name || "").trim();
  return resolved || "Emergencia general";
}

export default EmergencyFormModal;
