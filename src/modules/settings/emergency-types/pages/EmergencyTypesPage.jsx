import { useEffect, useState } from "react";
import BackButton from "../../../../components/common/BackButton";
import { useNotification } from "../../../../hooks/useNotification";
import EmergencyTypeFormModal from "../components/EmergencyTypeFormModal";
import EmergencyTypeTable from "../components/EmergencyTypeTable";
import { useEmergencyTypes } from "../hooks/useEmergencyTypes";

function EmergencyTypesPage() {
  const { success } = useNotification();
  const {
    emergencyTypes,
    loading,
    saving,
    error,
    hasTenantContext,
    currentPage,
    pagination,
    setCurrentPage,
    fetchEmergencyTypes,
    createEmergencyType,
    updateEmergencyType,
    toggleEmergencyType,
  } = useEmergencyTypes();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (!hasTenantContext) return;
    fetchEmergencyTypes({ page: currentPage, query, status });
  }, [currentPage, fetchEmergencyTypes, hasTenantContext, query, status]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, status, hasTenantContext, setCurrentPage]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (payload) => {
    const filters = { query, status };
    if (editing) {
      await updateEmergencyType(editing.id, payload, filters);
      success("Tipo de emergencia actualizado correctamente.");
    } else {
      await createEmergencyType(payload, filters);
      success("Tipo de emergencia creado correctamente.");
    }
    closeModal();
  };

  const handleToggle = async (item) => {
    await toggleEmergencyType(item.id, { query, status });
    success(item.is_active ? "Tipo de emergencia desactivado correctamente." : "Tipo de emergencia activado correctamente.");
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-3">
        <BackButton variant="settings" />
      </div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Tipos de Emergencia</h1>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-70"
          disabled={!hasTenantContext || saving}
        >
          + Crear tipo de emergencia
        </button>
      </header>

      {!hasTenantContext ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No hay propiedad activa para gestionar tipos de emergencia.
        </p>
      ) : null}

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <section className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <Field label="Buscar" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre" />

        <Select
          label="Estado"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          options={[
            { value: "all", label: "Todos" },
            { value: "active", label: "Activos" },
            { value: "inactive", label: "Inactivos" },
          ]}
        />
      </section>

      {loading ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          Cargando tipos de emergencia...
        </div>
      ) : (
        <EmergencyTypeTable rows={emergencyTypes} busy={saving} onEdit={openEdit} onToggle={handleToggle} />
      )}

      {pagination.lastPage > 1 ? (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row">
          <p className="text-xs font-semibold text-slate-500">
            Pagina {pagination.currentPage} de {pagination.lastPage} ({pagination.total} registros)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={loading || pagination.currentPage <= 1}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(pagination.lastPage, prev + 1))}
              disabled={loading || pagination.currentPage >= pagination.lastPage}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : null}

      {modalOpen ? (
        <EmergencyTypeFormModal
          key={editing ? `edit-et-${editing.id}` : "create-et"}
          open={modalOpen}
          initialValues={editing}
          loading={saving}
          onCancel={closeModal}
          onSubmit={handleSubmit}
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

export default EmergencyTypesPage;
