import { useMemo, useState } from "react";
import { Ambulance, Building2, Flame, Phone, Shield, Siren } from "lucide-react";
import BackButton from "../../../components/common/BackButton";
import SearchableSelect from "../../../components/common/SearchableSelect";
import { useNotification } from "../../../hooks/useNotification";
import EmergencyTable from "../components/EmergencyTable";
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

function EmergencyContactCard({ icon, title, phoneNumber, emergencyType }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold uppercase tracking-widest text-slate-500">{title}</p>
          <p className="truncate text-base font-extrabold text-slate-900">{phoneNumber}</p>
          {emergencyType ? <p className="mt-1 truncate text-xs font-semibold text-slate-500">{emergencyType}</p> : null}
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

function localDatetimeNow() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function EmergenciesPage() {
  const { success, error: notifyError, warning } = useNotification();
  const {
    emergencyTypes,
    areas,
    apartments,
    emergencies,
    emergenciesPage,
    emergenciesPagination,
    emergencyContacts,
    contactsPage,
    contactsPagination,
    loading,
    saving,
    actingIds,
    error,
    fieldErrors,
    activeCondominiumId,
    createEmergency,
    fetchEmergencies,
    setEmergenciesPage,
    markInProgress,
    closeEmergency,
    setContactsPage,
    clearFieldError,
  } = useEmergencies();

  const [form, setForm] = useState({
    emergency_type_id: "",
    unitTypeId: "",
    apartment_id: "",
    event_location: "",
    description: "",
    event_date: localDatetimeNow(),
  });
  const [localError, setLocalError] = useState("");
  const [localFieldErrors, setLocalFieldErrors] = useState({});

  const hasTypes = useMemo(() => emergencyTypes.length > 0, [emergencyTypes]);

  const emergencyTypeOptions = useMemo(
    () => emergencyTypes.map((item) => ({ value: String(item.id), label: item.name })),
    [emergencyTypes]
  );

  const locationOptions = useMemo(
    () => areas.map((area) => ({ value: area.name, label: area.name })),
    [areas]
  );

  const unitTypeOptions = useMemo(() => {
    const map = new Map();
    apartments.forEach((apartment) => {
      const id = String(apartment?.unit_type_id || "");
      const name = apartment?.unit_type?.name || apartment?.unitType?.name || "";
      if (id && name && !map.has(id)) {
        map.set(id, { value: id, label: name });
      }
    });
    return Array.from(map.values());
  }, [apartments]);

  const filteredApartmentOptions = useMemo(() => {
    if (!form.unitTypeId) return [];
    return apartments
      .filter((apartment) => String(apartment?.unit_type_id || "") === String(form.unitTypeId))
      .map((apartment) => ({
        value: String(apartment.id),
        label: apartment.name || apartment.number || `Unidad ${apartment.id}`,
      }));
  }, [apartments, form.unitTypeId]);

  const setField = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "unitTypeId" ? { apartment_id: "" } : {}),
    }));
    setLocalFieldErrors((prev) => ({ ...prev, [name]: "", ...(name === "unitTypeId" ? { apartment_id: "" } : {}) }));
    clearFieldError?.(name);
    setLocalError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError("");

    if (!activeCondominiumId) {
      const message = "No hay propiedad activa para reportar emergencias.";
      setLocalError(message);
      warning(message);
      return;
    }

    const nextLocalFieldErrors = {};
    if (!form.unitTypeId) nextLocalFieldErrors.unitTypeId = "Selecciona el tipo de unidad.";
    if (!form.apartment_id) nextLocalFieldErrors.apartment_id = "Selecciona el numero de unidad.";
    if (!form.emergency_type_id) nextLocalFieldErrors.emergency_type_id = "Selecciona el tipo de emergencia.";
    if (!form.description.trim()) nextLocalFieldErrors.description = "Describe la emergencia.";

    setLocalFieldErrors(nextLocalFieldErrors);

    if (Object.keys(nextLocalFieldErrors).length > 0) {
      const message = "Completa tipo de unidad, numero de unidad, tipo de emergencia y descripcion.";
      setLocalError(message);
      warning(message);
      return;
    }

    try {
      await createEmergency({
        emergency_type_id: Number(form.emergency_type_id),
        apartment_id: Number(form.apartment_id),
        event_type: resolveEventType(form.emergency_type_id, emergencyTypes),
        event_location: form.event_location.trim(),
        description: form.description.trim(),
        event_date: form.event_date,
      });

      setForm(() => ({
        emergency_type_id: "",
        unitTypeId: "",
        apartment_id: "",
        event_location: "",
        description: "",
        event_date: localDatetimeNow(),
      }));
      setLocalFieldErrors({});
      success("Emergencia registrada correctamente.");
    } catch (requestError) {
      notifyError(normalizeEmergencyError(requestError, "No fue posible registrar la emergencia."));
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
                <SearchableSelect
                  value={form.emergency_type_id}
                  onChange={(value) => setField("emergency_type_id", String(value))}
                  options={emergencyTypeOptions}
                  placeholder={hasTypes ? "Seleccione tipo..." : "Sin tipos activos"}
                  searchPlaceholder="Buscar tipo de emergencia..."
                  disabled={!hasTypes}
                />
                <FieldError message={fieldErrors.emergency_type_id || localFieldErrors.emergency_type_id} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Tipo de unidad</label>
                  <SearchableSelect
                    value={form.unitTypeId}
                    onChange={(value) => setField("unitTypeId", String(value))}
                    options={unitTypeOptions}
                    placeholder={unitTypeOptions.length ? "Seleccione tipo..." : "Sin tipos disponibles"}
                    searchPlaceholder="Buscar tipo de unidad..."
                    disabled={!unitTypeOptions.length}
                  />
                  <FieldError message={localFieldErrors.unitTypeId} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Numero de unidad</label>
                  <SearchableSelect
                    value={form.apartment_id}
                    onChange={(value) => setField("apartment_id", String(value))}
                    options={filteredApartmentOptions}
                    placeholder={!form.unitTypeId ? "Primero seleccione tipo" : "Seleccione unidad..."}
                    searchPlaceholder="Buscar unidad..."
                    disabled={!form.unitTypeId}
                  />
                  <FieldError message={fieldErrors.apartment_id || localFieldErrors.apartment_id} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Lugar del evento</label>
                <SearchableSelect
                  value={form.event_location}
                  onChange={(value) => setField("event_location", String(value))}
                  options={locationOptions}
                  placeholder={locationOptions.length ? "Seleccione ubicacion..." : "Sin areas activas"}
                  searchPlaceholder="Buscar ubicacion..."
                  disabled={!locationOptions.length}
                />
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
                <FieldError message={fieldErrors.description || localFieldErrors.description} />
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

          <EmergencyTable
            rows={emergencies}
            loading={loading}
            actingIds={actingIds}
            onProgress={markInProgress}
            onClose={closeEmergency}
            onRefresh={() => fetchEmergencies(emergenciesPage)}
            currentPage={emergenciesPagination.currentPage}
            totalPages={emergenciesPagination.lastPage}
            totalItems={emergenciesPagination.total}
            onPageChange={setEmergenciesPage}
          />

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
                    emergencyType={contact.emergency_type?.name || ""}
                  />
                ))
              ) : (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                  No hay contactos de emergencia configurados para esta propiedad.
                </div>
              )}
            </div>

            {contactsPagination.lastPage > 1 ? (
              <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row">
                <p className="text-xs font-semibold text-slate-500">
                  Pagina {contactsPagination.currentPage} de {contactsPagination.lastPage} ({contactsPagination.total} registros)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setContactsPage(Math.max(1, contactsPage - 1))}
                    disabled={contactsPagination.currentPage <= 1}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactsPage(Math.min(contactsPagination.lastPage, contactsPage + 1))}
                    disabled={contactsPagination.currentPage >= contactsPagination.lastPage}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            ) : null}
          </Card>
        </div>
      </div>

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

function normalizeEmergencyError(error, fallbackMessage) {
  const responseData = error?.response?.data;
  const fieldErrors = responseData?.errors;

  if (fieldErrors && typeof fieldErrors === "object") {
    const firstFieldErrors = Object.values(fieldErrors).find(
      (messages) => Array.isArray(messages) && messages.length > 0
    );
    if (firstFieldErrors) {
      return String(firstFieldErrors[0]);
    }
  }

  return responseData?.message || error?.message || fallbackMessage;
}
