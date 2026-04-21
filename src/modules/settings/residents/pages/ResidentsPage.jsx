import { useMemo, useRef, useState } from "react";
import BackButton from "../../../../components/common/BackButton";
import ChangeUserPasswordModal from "../../../../components/common/ChangeUserPasswordModal";
import { useAuthContext } from "../../../../context/useAuthContext";
import { useNotification } from "../../../../hooks/useNotification";
import ResidentFormModal from "../components/ResidentFormModal";
import ResidentTable from "../components/ResidentTable";
import { useResidents } from "../hooks/useResidents";
import { isSuperUser, isTenantAdminRole } from "../../../../utils/roles";

function ResidentsPage() {
  const fileInputRef = useRef(null);
  const { user } = useAuthContext();
  const { success: notifySuccess } = useNotification();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [residentType, setResidentType] = useState("all");
  const [propertyType, setPropertyType] = useState("all");
  const filters = useMemo(
    () => ({ query, status, residentType, propertyType }),
    [propertyType, query, residentType, status]
  );
  const {
    residents,
    currentPage,
    pagination,
    setCurrentPage,
    loading,
    saving,
    error,
    hasTenantContext,
    createResident,
    updateResident,
    previewResidentsCsv,
    importResidentsCsv,
    changeUserPassword,
  } = useResidents(filters);
  const [success, setSuccess] = useState("");
  const [importResult, setImportResult] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [autoCreateUnits, setAutoCreateUnits] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [passwordModalTarget, setPasswordModalTarget] = useState(null);
  const canChangePassword = useMemo(() => {
    if (user?.is_platform_admin === true) return true;
    return isSuperUser(user?.role) || isTenantAdminRole(user?.role);
  }, [user?.is_platform_admin, user?.role]);

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

  const clearFilters = () => {
    setSuccess("");
    setImportResult(null);
    setImportPreview(null);
    setImportFile(null);
    setQuery("");
    setStatus("all");
    setResidentType("all");
    setPropertyType("all");
  };

  const openCreate = () => {
    setSuccess("");
    setImportResult(null);
    setImportPreview(null);
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setSuccess("");
    setImportResult(null);
    setImportPreview(null);
    setEditing(item);
    setModalOpen(true);
  };

  const openPasswordModal = (item) => {
    if (!canChangePassword) return;
    setSuccess("");
    setImportResult(null);
    setImportPreview(null);
    setPasswordModalTarget(item);
  };

  const openCsvPicker = () => {
    if (!hasTenantContext || saving) return;
    fileInputRef.current?.click();
  };

  const handleCsvChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setImportFile(file);
    setAutoCreateUnits(false);
    setImportResult(null);
    setSuccess("");

    try {
      const preview = await previewResidentsCsv(file, { autoCreateUnits: false });
      setImportPreview(preview);
    } catch {
      setImportFile(null);
      setImportPreview(null);
      setImportResult(null);
    }
  };

  const handleAutoCreateUnitsChange = async (event) => {
    const checked = event.target.checked;
    setAutoCreateUnits(checked);
    setImportResult(null);

    if (!importFile) return;

    try {
      const preview = await previewResidentsCsv(importFile, { autoCreateUnits: checked });
      setImportPreview(preview);
    } catch {
      setImportPreview(null);
    }
  };

  const cancelImportPreview = () => {
    if (saving) return;
    setImportFile(null);
    setImportPreview(null);
    setAutoCreateUnits(false);
  };

  const confirmImport = async () => {
    if (!importFile || saving || !importPreview?.can_import) return;

    try {
      const result = await importResidentsCsv(importFile, { autoCreateUnits });
      setImportResult(result);
      setSuccess(
        `Importacion finalizada. Creados: ${Number(result?.created || 0)}. Actualizados: ${Number(result?.updated || 0)}. Fallidos: ${Number(result?.failed || 0)}. Unidades creadas: ${Number(result?.created_units || 0)}.`
      );
      setImportFile(null);
      setImportPreview(null);
      setAutoCreateUnits(false);
    } catch {
      setImportResult(null);
    }
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
  };

  const closePasswordModal = () => {
    if (saving) return;
    setPasswordModalTarget(null);
  };

  const handleSubmit = async (payload) => {
    if (editing) {
      await updateResident(editing.id, payload);
      notifySuccess("Residente actualizado correctamente.");
      setSuccess("Residente actualizado correctamente.");
    } else {
      await createResident(payload);
      notifySuccess("Residente creado correctamente.");
      setSuccess("Residente creado correctamente.");
    }
    closeModal();
  };

  const handlePasswordSubmit = async (payload) => {
    const targetUserId = Number(passwordModalTarget?.user_id || passwordModalTarget?.user?.id || 0);
    if (!targetUserId) {
      throw new Error("No se pudo identificar el usuario a actualizar.");
    }

    await changeUserPassword(targetUserId, payload);
    notifySuccess("Contrase?a actualizada correctamente.");
    setSuccess("Contrasena actualizada correctamente.");
    closePasswordModal();
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-3">
        <BackButton variant="settings" />
      </div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Residentes</h1>
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
            + Nuevo residente
          </button>
        </div>
      </header>

      {!hasTenantContext ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No hay propiedad activa para gestionar residentes.
        </p>
      ) : null}


      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      {importResult ? (
        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-bold text-slate-900">
            Creados: <span className="text-emerald-700">{Number(importResult.created || 0)}</span>
            {" | "}
            Actualizados: <span className="text-indigo-700">{Number(importResult.updated || 0)}</span>
            {" | "}
            Fallidos: <span className="text-rose-700">{Number(importResult.failed || 0)}</span>
            {" | "}
            Unidades creadas: <span className="text-emerald-700">{Number(importResult.created_units || 0)}</span>
          </p>
          {Array.isArray(importResult.warnings) && importResult.warnings.length > 0 ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-700">
              {importResult.warnings.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {Array.isArray(importResult.errors) && importResult.errors.length > 0 ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-rose-700">
              {importResult.errors.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-600">No se encontraron errores en la importacion.</p>
          )}
        </section>
      ) : null}

      {importPreview ? (
        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Validacion previa CSV</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{importFile?.name || "Archivo CSV"}</p>
            </div>
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={autoCreateUnits}
                onChange={handleAutoCreateUnitsChange}
                disabled={saving}
              />
              Crear unidades faltantes automáticamente
            </label>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
            <PreviewMetric label="Filas" value={importPreview?.summary?.total_rows} />
            <PreviewMetric label="Validas" value={importPreview?.summary?.valid_rows} tone="emerald" />
            <PreviewMetric label="Con error" value={importPreview?.summary?.error_rows} tone="rose" />
            <PreviewMetric label="Unidades nuevas" value={importPreview?.summary?.new_units} tone="amber" />
            <PreviewMetric label="Crear residentes" value={importPreview?.summary?.residents_to_create} />
            <PreviewMetric label="Actualizar" value={importPreview?.summary?.residents_to_update} />
          </div>

          {Array.isArray(importPreview.units_to_create) && importPreview.units_to_create.length > 0 ? (
            <div className="mt-4 rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Unidades nuevas detectadas</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {importPreview.units_to_create.map((unit) => (
                  <li key={`${unit.tower}-${unit.number}-${unit.unit_type}`}>
                    Torre {unit.tower} - {unit.number} ({unit.unit_type})
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {Array.isArray(importPreview.warnings) && importPreview.warnings.length > 0 ? (
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-amber-700">
              {importPreview.warnings.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}

          {Array.isArray(importPreview.errors) && importPreview.errors.length > 0 ? (
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-rose-700">
              {importPreview.errors.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={cancelImportPreview}
              disabled={saving}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-70"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmImport}
              disabled={saving || !importPreview?.can_import}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-70"
            >
              {saving ? "Importando..." : "Importar residentes"}
            </button>
          </div>
        </section>
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
          Mostrando {residents.length} de {pagination.total || residents.length} residentes
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
        <ResidentTable
          rows={residents}
          busy={saving}
          onEdit={openEdit}
          onChangePassword={openPasswordModal}
          canChangePassword={canChangePassword}
          currentPage={pagination.currentPage || currentPage}
          totalPages={pagination.lastPage || 1}
          totalItems={pagination.total || 0}
          loading={loading}
          onPageChange={setCurrentPage}
        />
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

      {passwordModalTarget && canChangePassword ? (
        <ChangeUserPasswordModal
          open={Boolean(passwordModalTarget)}
          loading={saving}
          targetLabel={passwordModalTarget?.user?.full_name || passwordModalTarget?.full_name || "-"}
          onCancel={closePasswordModal}
          onSubmit={handlePasswordSubmit}
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

function PreviewMetric({ label, value, tone = "slate" }) {
  const valueClass =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "rose"
        ? "text-rose-700"
        : tone === "amber"
          ? "text-amber-700"
          : "text-slate-900";

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={["mt-1 text-lg font-extrabold", valueClass].join(" ")}>{Number(value || 0)}</p>
    </div>
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

