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
  const [propertyType, setPropertyType] = useState("all");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const propertyTypeOptions = useMemo(() => {
    const unique = Array.from(
      new Set(
        residents
          .map((item) => resolveUnitTypeName(item))
          .filter(Boolean)
      )
    );
    return ["all", ...unique];
  }, [residents]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return residents.filter((item) => {
      const apartmentNumber = String(item.apartment?.number || item.apartment_number || "").toLowerCase();
      const tower = String(item.apartment?.tower || "").toLowerCase();
      const floor = String(item.apartment?.floor ?? "").toLowerCase();
      const unitType = String(resolveUnitTypeName(item)).toLowerCase();
      const name = String(item.user?.full_name || item.full_name || "").toLowerCase();
      const matchQuery = !q || `${name} ${apartmentNumber} ${tower} ${floor} ${unitType}`.includes(q);
      const matchStatus =
        status === "all" || (status === "active" ? item.is_active : !item.is_active);
      const matchResidentType = residentType === "all" || item.type === residentType;
      const matchPropertyType =
        propertyType === "all" || resolveUnitTypeName(item) === propertyType;

      return matchQuery && matchStatus && matchResidentType && matchPropertyType;
    });
  }, [propertyType, query, residentType, residents, status]);

  const clearFilters = () => {
    setQuery("");
    setStatus("all");
    setResidentType("all");
    setPropertyType("all");
  };

  const openCreate = () => {
    setSuccess("");
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setSuccess("");
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
      setSuccess("Residente actualizado correctamente.");
    } else {
      await createResident(payload);
      setSuccess("Residente creado correctamente.");
    }
    closeModal();
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Residentes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestion de residentes de la propiedad.
            {activeCondominiumId ? ` Contexto: #${activeCondominiumId}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-70"
          disabled={!hasTenantContext || saving}
        >
          + Nuevo residente
        </button>
      </header>

      {!hasTenantContext ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No hay propiedad activa para gestionar residentes.
        </p>
      ) : null}

      {success ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <Field
          label="Buscar"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nombre, apto, torre, piso, tipo"
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

        <Select
          label="Tipo residente"
          value={residentType}
          onChange={(event) => setResidentType(event.target.value)}
          options={[
            { value: "all", label: "Todos" },
            { value: "propietario", label: "Propietario" },
            { value: "arrendatario", label: "Arrendatario" },
          ]}
        />

        <Select
          label="Tipo inmueble"
          value={propertyType}
          onChange={(event) => setPropertyType(event.target.value)}
          options={propertyTypeOptions.map((item) => ({
            value: item,
            label: item === "all" ? "Todos" : item,
          }))}
        />
      </section>

      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-500">
          Mostrando {filtered.length} de {residents.length} residentes
        </p>
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Limpiar filtros
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          Cargando residentes...
        </div>
      ) : (
        <ResidentTable rows={filtered} busy={saving} onEdit={openEdit} />
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

function resolveUnitTypeName(resident) {
  return (
    resident?.apartment?.unit_type?.name ||
    resident?.apartment?.unitType?.name ||
    "Sin tipo"
  );
}

export default ResidentsPage;

