import { useMemo, useState } from "react";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import ResidentFormModal from "../components/ResidentFormModal";
import ResidentTable from "../components/ResidentTable";
import { useResidents } from "../hooks/useResidents";

function ResidentsPage() {
  const { activeCondominiumId } = useActiveCondominium();
  const { residents, loading, saving, error, hasTenantContext, createResident, updateResident } =
    useResidents();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [residentType, setResidentType] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => {
    return residents.filter((item) => {
      const name = (item.user?.full_name || item.full_name || "").toLowerCase();
      const apartment = String(item.apartment?.number || item.apartment_number || "").toLowerCase();
      const q = query.trim().toLowerCase();
      const matchQuery = !q || name.includes(q) || apartment.includes(q);
      const matchStatus =
        status === "all" || (status === "active" ? item.is_active : !item.is_active);
      const matchType = residentType === "all" || item.type === residentType;
      return matchQuery && matchStatus && matchType;
    });
  }, [query, residents, residentType, status]);

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
      await updateResident(editing.id, payload);
    } else {
      await createResident(payload);
    }
    closeModal();
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Residentes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestión de residentes del condominio.
            {activeCondominiumId ? ` Contexto: #${activeCondominiumId}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
          disabled={!hasTenantContext}
        >
          + Nuevo Residente
        </button>
      </header>

      {!hasTenantContext ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No hay condominio activo para gestionar residentes.
        </p>
      ) : null}

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <Field
          label="Buscar"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nombre o apto"
        />

        <Select
          label="Estado"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[
            { value: "all", label: "Todos" },
            { value: "active", label: "Activos" },
            { value: "inactive", label: "Inactivos" },
          ]}
        />

        <Select
          label="Tipo residente"
          value={residentType}
          onChange={(e) => setResidentType(e.target.value)}
          options={[
            { value: "all", label: "Todos" },
            { value: "propietario", label: "Propietario" },
            { value: "arrendatario", label: "Arrendatario" },
          ]}
        />
      </section>

      {loading ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          Cargando residentes...
        </div>
      ) : (
        <ResidentTable rows={filtered} onEdit={openEdit} />
      )}

      {modalOpen ? (
        <ResidentFormModal
          key={editing ? `edit-res-${editing.id}` : "create-res"}
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
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
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
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
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

export default ResidentsPage;
