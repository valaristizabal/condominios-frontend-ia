import { useMemo, useRef, useState } from "react";
import BackButton from "../../../../components/common/BackButton";
import { useNotification } from "../../../../hooks/useNotification";
import ApartmentFormModal from "../components/ApartmentFormModal";
import ApartmentTable from "../components/ApartmentTable";
import { useApartments } from "../hooks/useApartments";

function ApartmentsPage() {
  const { success } = useNotification();
  const fileInputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [tower, setTower] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const filters = useMemo(() => ({ query, status, tower }), [query, status, tower]);

  const {
    apartments,
    currentPage,
    pagination,
    setCurrentPage,
    loading,
    saving,
    error,
    hasTenantContext,
    createApartment,
    updateApartment,
    toggleApartment,
    importApartmentsCsv,
  } = useApartments(filters);

  const towerOptions = useMemo(() => {
    const unique = Array.from(new Set(apartments.map((item) => item.tower).filter(Boolean)));
    return ["all", ...unique];
  }, [apartments]);

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
      await updateApartment(editing.id, payload);
      success("Inmueble actualizado correctamente.");
    } else {
      await createApartment(payload);
      success("Inmueble creado correctamente.");
    }
    closeModal();
  };

  const handleToggle = async (item) => {
    await toggleApartment(item.id);
    success(item.is_active ? "Inmueble desactivado correctamente." : "Inmueble activado correctamente.");
  };

  const openCsvPicker = () => {
    if (!hasTenantContext || saving) return;
    fileInputRef.current?.click();
  };

  const handleCsvChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      const result = await importApartmentsCsv(file);
      setImportResult(result);
      success(`Carga finalizada. Registros creados: ${Number(result?.created || 0)}.`);
    } catch {
      setImportResult(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-3">
        <BackButton variant="settings" />
      </div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Inmuebles</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleCsvChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={openCsvPicker}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-70"
            disabled={!hasTenantContext || saving}
          >
            Cargar CSV
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-70"
            disabled={!hasTenantContext || saving}
          >
            + Crear inmueble
          </button>
        </div>
      </header>

      {!hasTenantContext ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No hay propiedad activa para gestionar inmuebles.
        </p>
      ) : null}

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      {importResult ? (
        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-bold text-slate-900">
            Registros creados: <span className="text-indigo-700">{Number(importResult.created || 0)}</span>
          </p>

          {Array.isArray(importResult.errors) && importResult.errors.length > 0 ? (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-semibold text-amber-800">Errores encontrados</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-700">
                {importResult.errors.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-600">No se encontraron errores en la importacion.</p>
          )}
        </section>
      ) : null}

      <section className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <Field
          label="Buscar"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Numero, torre o tipo"
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
          label="Torre"
          value={tower}
          onChange={(event) => setTower(event.target.value)}
          options={towerOptions.map((item) => ({
            value: item,
            label: item === "all" ? "Todas" : item,
          }))}
        />
      </section>

      {loading ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          Cargando inmuebles...
        </div>
      ) : (
        <ApartmentTable
          rows={apartments}
          busy={saving}
          onEdit={openEdit}
          onToggle={handleToggle}
          currentPage={pagination.currentPage || currentPage}
          totalPages={pagination.lastPage || 1}
          totalItems={pagination.total || 0}
          loading={loading}
          onPageChange={setCurrentPage}
        />
      )}

      {modalOpen ? (
        <ApartmentFormModal
          key={editing ? `edit-ap-${editing.id}` : "create-ap"}
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

export default ApartmentsPage;
