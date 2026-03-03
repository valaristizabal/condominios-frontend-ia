import { useMemo, useState } from "react";
import { useEmergencies } from "../hooks/useEmergencies";

const inputBase =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-200";

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-50 text-red-600">{icon}</div>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    </div>
  );
}

function EmergencyContactCard({ icon, bgColor, iconColor, title, subtitle }) {
  return (
    <div className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${bgColor}`}>
        <div className={iconColor}>{icon}</div>
      </div>
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{title}</div>
        <div className="text-base font-extrabold text-slate-900">{subtitle}</div>
      </div>
    </div>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-2 text-xs font-semibold text-red-600">{message}</p>;
}

function formatNow() {
  const d = new Date();
  const date = d.toLocaleDateString();
  const time = d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date}, ${time} (Automatico)`;
}

function localDatetimeNow() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function EmergenciesPage() {
  const { emergencyTypes, saving, error, fieldErrors, activeCondominiumId, createEmergency, clearFieldError } =
    useEmergencies();

  const [form, setForm] = useState({
    emergency_type_id: "",
    event_type: "",
    event_location: "",
    description: "",
    event_date: localDatetimeNow(),
  });
  const [localError, setLocalError] = useState("");

  const hasTypes = useMemo(() => emergencyTypes.length > 0, [emergencyTypes]);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    clearFieldError?.(name);
    setLocalError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError("");

    if (!activeCondominiumId) {
      setLocalError("No hay condominio activo para reportar emergencias.");
      return;
    }

    if (!form.emergency_type_id || !form.event_type.trim() || !form.event_date) {
      setLocalError("Completa tipo de emergencia, evento y fecha.");
      return;
    }

    try {
      await createEmergency({
        emergency_type_id: Number(form.emergency_type_id),
        event_type: form.event_type.trim(),
        event_location: form.event_location.trim(),
        description: form.description.trim(),
        event_date: form.event_date,
      });

      setForm((prev) => ({
        ...prev,
        event_type: "",
        event_location: "",
        description: "",
        event_date: localDatetimeNow(),
      }));
    } catch {
      // Error is handled by hook state.
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 pb-3 pt-4">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-2xl hover:bg-slate-100"
            onClick={() => window.history.back()}
            aria-label="Volver"
          >
            <ArrowLeftIcon />
          </button>

          <h1 className="text-xl font-extrabold text-slate-900">Gestion de Emergencias y Salud</h1>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-6 px-4 pb-[140px]">
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertIcon />
          <div className="text-sm font-medium">
            Usa este formulario solo para reportar incidentes criticos que requieren atencion inmediata.
          </div>
        </div>

        {!activeCondominiumId ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-700">
            No hay condominio activo para gestionar emergencias.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>
        ) : null}

        {localError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{localError}</div>
        ) : null}

        <form
          id="emergencyForm"
          onSubmit={handleSubmit}
          className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <SectionTitle icon={<span className="text-base">🚨</span>} title="Reportar Incidente" />

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Tipo de Emergencia</label>
            <select
              className={inputBase}
              value={form.emergency_type_id}
              onChange={(event) => setField("emergency_type_id", event.target.value)}
              disabled={!hasTypes}
            >
              <option value="">{hasTypes ? "Seleccione tipo..." : "Sin tipos activos"}</option>
              {emergencyTypes.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {item.name}
                </option>
              ))}
            </select>
            <FieldError message={fieldErrors.emergency_type_id} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Lugar del Evento</label>
            <select
              className={inputBase}
              value={form.event_location}
              onChange={(event) => setField("event_location", event.target.value)}
            >
              <option value="">Seleccione ubicacion...</option>
              <option>Lobby</option>
              <option>Parqueadero</option>
              <option>Piscina</option>
              <option>Gimnasio</option>
              <option>Apartamento</option>
              <option>Zona Comun</option>
            </select>
            <FieldError message={fieldErrors.event_location} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Descripcion</label>
            <textarea
              className={`${inputBase} min-h-[120px]`}
              placeholder="Detalles del incidente..."
              value={form.description}
              onChange={(event) => setField("description", event.target.value)}
            />
            <FieldError message={fieldErrors.description} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Tipo de evento</label>
            <input
              className={inputBase}
              value={form.event_type}
              onChange={(event) => setField("event_type", event.target.value)}
              placeholder="Ej: Convulsion"
            />
            <FieldError message={fieldErrors.event_type} />
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <ClockIcon />
            {formatDateLabel(form.event_date)}
          </div>
        </form>

        <div className="space-y-4 pt-6">
          <div className="text-sm font-extrabold uppercase tracking-widest text-slate-600">Contactos de Emergencia</div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <EmergencyContactCard
              icon="🛡️"
              bgColor="bg-blue-50"
              iconColor="text-blue-600"
              title="Policia"
              subtitle="Cuadrante Zona"
            />
            <EmergencyContactCard
              icon="🔥"
              bgColor="bg-orange-50"
              iconColor="text-orange-600"
              title="Bomberos"
              subtitle="Linea Directa"
            />
            <EmergencyContactCard
              icon="🚑"
              bgColor="bg-red-50"
              iconColor="text-red-600"
              title="Ambulancia"
              subtitle="Urgencias"
            />
            <EmergencyContactCard icon="🧯" bgColor="bg-amber-50" iconColor="text-amber-600" title="Gas" subtitle="Emergencias Gas" />
            <EmergencyContactCard icon="⚡" bgColor="bg-yellow-50" iconColor="text-yellow-700" title="Energia" subtitle="Fallas Electricas" />
            <EmergencyContactCard icon="💧" bgColor="bg-cyan-50" iconColor="text-cyan-600" title="Acueducto" subtitle="Danos de Agua" />
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-6 left-0 right-0 z-50">
        <div className="pointer-events-auto mx-auto max-w-3xl px-4">
          <button
            type="submit"
            form="emergencyForm"
            disabled={saving || !activeCondominiumId}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-extrabold text-white shadow-xl transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <AlertIcon />
            {saving ? "Reportando..." : "Reportar Emergencia"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current text-slate-600" aria-hidden="true">
      <path d="m10.7 5.3-1.4 1.4L13.6 11H3v2h10.6l-4.3 4.3 1.4 1.4L17.4 12l-6.7-6.7Z" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M12 3 1.8 20h20.4L12 3Zm1 13h-2v2h2v-2Zm0-7h-2v5h2V9Z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-slate-500" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 10.59 3.3 3.3-1.42 1.41L11 13V7h2v5.59Z" />
    </svg>
  );
}

function formatDateLabel(datetimeValue) {
  if (!datetimeValue) return formatNow();
  const date = new Date(datetimeValue);
  if (Number.isNaN(date.getTime())) return formatNow();

  const datePart = date.toLocaleDateString();
  const timePart = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart}, ${timePart} (Automatico)`;
}
