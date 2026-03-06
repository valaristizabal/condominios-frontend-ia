import { useMemo, useState } from "react";
import { Ambulance, Building2, Flame, Phone, Shield, Siren } from "lucide-react";
import BackButton from "../../../components/common/BackButton";
import { useEmergencies } from "../hooks/useEmergencies";

const inputBase =
  "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-200";

const Card = ({ children, className = "" }) => (
  <div className={["rounded-3xl border border-slate-200 bg-white p-6 shadow-sm", className].join(" ")}>{children}</div>
);

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-600">{icon}</div>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    </div>
  );
}

function EmergencyContactCard({ icon, title, phoneNumber }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold uppercase tracking-widest text-slate-500">{title}</p>
          <p className="truncate text-base font-extrabold text-slate-900">{phoneNumber}</p>
        </div>
      </div>

      <a
        href={`tel:${phoneNumber}`}
        className="mt-4 inline-flex rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-extrabold text-blue-700 transition hover:bg-blue-100"
      >
        Llamar
      </a>
    </div>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-2 text-xs font-semibold text-red-600">{message}</p>;
}

function formatNow() {
  const d = new Date();
  const date = d.toLocaleDateString("es-CO");
  const time = d.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date}, ${time} (Automático)`;
}

function localDatetimeNow() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function EmergenciesPage() {
  const {
    emergencyTypes,
    emergencyContacts,
    saving,
    error,
    fieldErrors,
    activeCondominiumId,
    createEmergency,
    clearFieldError,
  } = useEmergencies();

  const [form, setForm] = useState({
    emergency_type_id: "",
    event_location: "",
    description: "",
    event_date: localDatetimeNow(),
  });
  const [localError, setLocalError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
      setLocalError("No hay propiedad activa para reportar emergencias.");
      return;
    }

    if (!form.emergency_type_id || !form.event_date) {
      setLocalError("Completa tipo de emergencia y fecha.");
      return;
    }

    try {
      await createEmergency({
        emergency_type_id: Number(form.emergency_type_id),
        event_type: resolveEventType(form.emergency_type_id, emergencyTypes),
        event_location: form.event_location.trim(),
        description: form.description.trim(),
        event_date: form.event_date,
      });

      setForm(() => ({
        emergency_type_id: "",
        event_location: "",
        description: "",
        event_date: localDatetimeNow(),
      }));
      setShowSuccessModal(true);
    } catch {
      // Error state is handled by hook state.
    }
  };

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <header>
          <div className="flex items-center gap-3">
            <BackButton variant="dashboard" />
            <h1 className="text-2xl font-extrabold text-slate-900">Emergencias</h1>
          </div>
        </header>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          Usa este formulario solo para reportar incidentes críticos que requieren atención inmediata.
        </div>

        {!activeCondominiumId ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-700">
            No hay propiedad activa para gestionar emergencias.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>
        ) : null}

        {localError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{localError}</div>
        ) : null}

        <div className="grid grid-cols-1 items-start gap-6">
          <Card>
            <SectionTitle icon={<Siren className="h-5 w-5" />} title="Reportar incidente" />

            <form id="emergencyForm" onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Tipo de emergencia</label>
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
                <label className="text-sm font-semibold text-slate-700">Lugar del evento</label>
                <select
                  className={inputBase}
                  value={form.event_location}
                  onChange={(event) => setField("event_location", event.target.value)}
                >
                  <option value="">Seleccione ubicación...</option>
                  <option>Lobby</option>
                  <option>Parqueadero</option>
                  <option>Piscina</option>
                  <option>Gimnasio</option>
                  <option>Inmueble</option>
                  <option>Zona común</option>
                </select>
                <FieldError message={fieldErrors.event_location} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Descripción</label>
                <textarea
                  className={`${inputBase} min-h-[120px] py-3`}
                  placeholder="Detalles del incidente..."
                  value={form.description}
                  onChange={(event) => setField("description", event.target.value)}
                />
                <FieldError message={fieldErrors.description} />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <ClockIcon />
                  {formatDateLabel(form.event_date)}
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Hora de registro: {formatRegistrationHour(form.event_date)}
                </p>
              </div>

              <button
                type="submit"
                form="emergencyForm"
                disabled={saving || !activeCondominiumId}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 sm:mx-auto sm:w-auto sm:px-6"
              >
                <AlertIcon />
                {saving ? "Reportando..." : "Reportar emergencia"}
              </button>
            </form>
          </Card>

          <Card>
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">DIRECTORIO</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">Contactos de emergencia</h2>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {emergencyContacts.length ? (
                emergencyContacts.map((contact) => (
                  <EmergencyContactCard
                    key={contact.id}
                    icon={resolveEmergencyIcon(contact.icon)}
                    title={contact.name || "Servicio"}
                    phoneNumber={contact.phone_number || "-"}
                  />
                ))
              ) : (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                  No hay contactos de emergencia configurados para esta propiedad.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {showSuccessModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900">Registro exitoso</h3>
            <p className="mt-3 text-sm font-semibold text-slate-600">
              {"La emergencia fue registrada con \u00E9xito. Podr\u00E1 consultar la informaci\u00F3n al descargar la minuta."}
            </p>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-extrabold text-white transition hover:bg-blue-700"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
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

  const datePart = date.toLocaleDateString("es-CO");
  const timePart = date.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart}, ${timePart} (Automático)`;
}

function formatRegistrationHour(datetimeValue) {
  const date = datetimeValue ? new Date(datetimeValue) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  }

  return date.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveEventType(typeId, emergencyTypes = []) {
  const selectedType = emergencyTypes.find((item) => String(item.id) === String(typeId));
  const resolved = String(selectedType?.name || "").trim();
  return resolved || "Emergencia general";
}

function resolveEmergencyIcon(iconName) {
  const iconClass = "h-5 w-5";
  const normalized = String(iconName || "").toLowerCase();

  if (normalized === "flame") return <Flame className={iconClass} />;
  if (normalized === "ambulance") return <Ambulance className={iconClass} />;
  if (normalized === "siren") return <Siren className={iconClass} />;
  if (normalized === "building2") return <Building2 className={iconClass} />;
  if (normalized === "phone") return <Phone className={iconClass} />;

  return <Shield className={iconClass} />;
}
