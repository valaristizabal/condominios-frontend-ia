import { useMemo, useState } from "react";
import EmergencyFormModal from "../components/EmergencyFormModal";
import EmergencyTable from "../components/EmergencyTable";
import { useEmergencies } from "../hooks/useEmergencies";

function EmergenciesPage() {
  const {
    emergencies,
    emergencyTypes,
    loading,
    saving,
    actingIds,
    error,
    fieldErrors,
    activeCondominiumId,
    fetchEmergencies,
    createEmergency,
    markInProgress,
    closeEmergency,
    clearFieldError,
  } = useEmergencies();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return emergencies.filter((item) => {
      const typeName = String(item?.emergency_type?.name || item?.emergencyType?.name || "").toLowerCase();
      const eventType = String(item?.event_type || "").toLowerCase();
      const location = String(item?.event_location || "").toLowerCase();
      const matchQuery = !normalized || typeName.includes(normalized) || eventType.includes(normalized) || location.includes(normalized);
      const normalizedStatus = String(item?.status || "").toUpperCase();
      const matchStatus = status === "all" || normalizedStatus === status;
      return matchQuery && matchStatus;
    });
  }, [emergencies, query, status]);

  const handleCreate = async (payload) => {
    await createEmergency(payload);
    setModalOpen(false);
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Emergencias</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestion y seguimiento de eventos de emergencia del condominio.
            {activeCondominiumId ? ` Contexto: #${activeCondominiumId}` : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          disabled={!activeCondominiumId || saving}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-70"
        >
          + Registrar emergencia
        </button>
      </header>

      {!activeCondominiumId ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No hay condominio activo para gestionar emergencias.
        </p>
      ) : null}

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <section className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <Field
          label="Buscar"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tipo, evento o ubicacion"
        />

        <Select
          label="Estado"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          options={[
            { value: "all", label: "Todos" },
            { value: "OPEN", label: "Abiertas" },
            { value: "IN_PROGRESS", label: "En proceso" },
            { value: "CLOSED", label: "Cerradas" },
          ]}
        />
      </section>

      <EmergencyTable
        rows={filteredRows}
        loading={loading}
        actingIds={actingIds}
        onProgress={markInProgress}
        onClose={closeEmergency}
        onRefresh={fetchEmergencies}
      />

      {modalOpen ? (
        <EmergencyFormModal
          open={modalOpen}
          loading={saving}
          emergencyTypes={emergencyTypes}
          fieldErrors={fieldErrors}
          onCancel={() => {
            if (!saving) setModalOpen(false);
          }}
          onFieldChange={clearFieldError}
          onSubmit={handleCreate}
        />
      ) : null}
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        {...props}
        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <select
        value={value}
        onChange={onChange}
        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default EmergenciesPage;
