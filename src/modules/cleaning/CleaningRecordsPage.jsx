import { useEffect, useMemo, useState } from "react";
import { useCleaningRecords } from "./useCleaningRecords";

const inputBase =
  "w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200";

const Label = ({ children }) => (
  <label className="text-sm text-gray-700 font-medium">{children}</label>
);

const SectionTitle = ({ icon, title, rightChip }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700">
        {icon}
      </div>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
    </div>

    {rightChip ? (
      <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
        {rightChip}
      </span>
    ) : null}
  </div>
);

const todayISO = () => {
  const d = new Date();
  return d.toISOString().split("T")[0];
};

const nowHHMM = () => {
  const d = new Date();
  return d.toTimeString().slice(0, 5);
};

export default function CleaningRecordsPage() {
  const { areas, operatives, saving, error, hasTenantContext, createCleaningRecord } = useCleaningRecords();

  const [success, setSuccess] = useState("");
  const [localError, setLocalError] = useState("");
  const [form, setForm] = useState({
    areaId: "",
    operatorId: "",
    date: todayISO(),
    time: nowHHMM(),
    observations: "",
  });

  const activeAreas = useMemo(() => (areas || []).filter((item) => item?.is_active !== false), [areas]);

  useEffect(() => {
    if (!error) return;
    setLocalError(error);
  }, [error]);

  const setField = (name, value) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const handleCancel = () => {
    setForm({
      areaId: "",
      operatorId: "",
      date: todayISO(),
      time: nowHHMM(),
      observations: "",
    });
    setSuccess("");
    setLocalError("");
  };

  const handleSave = async () => {
    if (!form.areaId || !form.operatorId || !form.date) {
      setLocalError("Debes seleccionar area, operario y fecha.");
      return;
    }

    setLocalError("");
    setSuccess("");

    try {
      const observations = String(form.observations || "").trim();
      const payload = {
        cleaning_area_id: Number(form.areaId),
        operative_id: Number(form.operatorId),
        cleaning_date: form.date,
        observations: observations
          ? `Hora: ${form.time || "--:--"} | ${observations}`
          : `Hora: ${form.time || "--:--"}`,
      };

      await createCleaningRecord(payload);
      handleCancel();
      setSuccess("Registro guardado correctamente.");
    } catch (err) {
      setLocalError(normalizeApiError(err, "Error guardando registro."));
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <button
          type="button"
          className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
          onClick={() => window.history.back()}
        >
          {"←"}
        </button>

        <h1 className="text-xl font-extrabold text-gray-900">
          Seguimiento de Aseo y Limpieza
        </h1>
      </div>

      <div className="px-4 pb-10 max-w-3xl mx-auto space-y-8">
        {!hasTenantContext ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            No hay condominio activo para operar el modulo de aseo.
          </div>
        ) : null}

        {localError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {localError}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="space-y-4">
          <SectionTitle icon="⚙️" title="Configuracion" />

          <div className="space-y-2">
            <Label>Area de Limpieza</Label>
            <select
              className={inputBase}
              value={form.areaId}
              onChange={(event) => setField("areaId", event.target.value)}
              disabled={!hasTenantContext || saving}
            >
              <option value="">Seleccione el area</option>
              {activeAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Operario Responsable</Label>
            <select
              className={inputBase}
              value={form.operatorId}
              onChange={(event) => setField("operatorId", event.target.value)}
              disabled={!hasTenantContext || saving}
            >
              <option value="">Seleccione el operario</option>
              {operatives.map((operative) => (
                <option key={operative.id} value={operative.id}>
                  {operative.user?.full_name || "Operario"} ({operative.position || "Sin rol"})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <SectionTitle icon="📝" title="Registro" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <input
                type="date"
                className={inputBase}
                value={form.date}
                onChange={(event) => setField("date", event.target.value)}
                disabled={!hasTenantContext || saving}
              />
            </div>

            <div className="space-y-2">
              <Label>Hora</Label>
              <input
                type="time"
                className={inputBase}
                value={form.time}
                onChange={(event) => setField("time", event.target.value)}
                disabled={!hasTenantContext || saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observaciones</Label>
            <textarea
              className={`${inputBase} min-h-[120px]`}
              value={form.observations}
              onChange={(event) => setField("observations", event.target.value)}
              disabled={!hasTenantContext || saving}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="w-full bg-white border border-gray-200 rounded-2xl py-4 font-extrabold text-gray-800 hover:bg-gray-50 disabled:opacity-70"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!hasTenantContext || saving}
            className="w-full bg-blue-600 text-white rounded-2xl py-4 font-extrabold shadow-lg hover:bg-blue-700 disabled:opacity-70"
          >
            {saving ? "Guardando..." : "Guardar Seguimiento"}
          </button>
        </div>
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
