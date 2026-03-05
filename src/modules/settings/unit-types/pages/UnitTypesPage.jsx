import { useMemo, useState } from "react";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import UnitTypeFormModal from "../components/UnitTypeFormModal";
import UnitTypeTable from "../components/UnitTypeTable";
import { useUnitTypes } from "../hooks/useUnitTypes";

function UnitTypesPage() {
  const { activeCondominiumId } = useActiveCondominium();
  const { unitTypes, loading, saving, error, hasTenantContext, createUnitType, updateUnitType, toggleUnitType } =
    useUnitTypes();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return unitTypes.filter((item) => {
      const matchQuery = !normalizedQuery || String(item.name || "").toLowerCase().includes(normalizedQuery);
      const matchStatus = status === "all" || (status === "active" ? item.is_active : !item.is_active);
      return matchQuery && matchStatus;
    });
  }, [query, status, unitTypes]);

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
    if (editing) {
      await updateUnitType(editing.id, payload);
    } else {
      await createUnitType(payload);
    }
    closeModal();
  };

  const handleToggle = async (item) => {
    await toggleUnitType(item.id);
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Tipos de Unidad</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestion de tipos de unidad de la propiedad.
            {activeCondominiumId ? ` Contexto: #${activeCondominiumId}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-70"
          disabled={!hasTenantContext || saving}
        >
          + Crear tipo de unidad
        </button>
      </header>

      {!hasTenantContext ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No hay propiedad activa para gestionar tipos de unidad.
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
          placeholder="Nombre"
        />

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
          Cargando tipos de unidad...
        </div>
      ) : (
        <UnitTypeTable rows={filtered} busy={saving} onEdit={openEdit} onToggle={handleToggle} />
      )}

      {modalOpen ? (
        <UnitTypeFormModal
          key={editing ? `edit-ut-${editing.id}` : "create-ut"}
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

export default UnitTypesPage;

