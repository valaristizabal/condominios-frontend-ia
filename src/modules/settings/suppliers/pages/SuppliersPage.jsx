import { useEffect, useState } from "react";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import { useNotification } from "../../../../hooks/useNotification";
import { useSuppliers } from "../hooks/useSuppliers";

const EMPTY_FORM = {
  name: "",
  rut: "",
  contact_name: "",
  phone: "",
  email: "",
  address: "",
  certificacion_bancaria_file: null,
  documento_representante_legal_file: null,
  certificacion_bancaria: "",
  documento_representante_legal: "",
  is_active: true,
};

function SuppliersPage() {
  const { activeCondominiumId } = useActiveCondominium();
  const {
    suppliers,
    loading,
    saving,
    error,
    currentPage,
    pagination,
    hasTenantContext,
    setCurrentPage,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deactivateSupplier,
  } = useSuppliers();
  const { success, error: notifyError, warning } = useNotification();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [localError, setLocalError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!activeCondominiumId) return;
    fetchSuppliers({ page: currentPage, query, status });
  }, [activeCondominiumId, currentPage, fetchSuppliers, query, status]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, status, activeCondominiumId, setCurrentPage]);

  const openCreate = () => {
    setEditing(null);
    setLocalError("");
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setLocalError("");
    setForm({
      name: item?.name || "",
      rut: item?.rut || "",
      contact_name: item?.contact_name || "",
      phone: item?.phone || "",
      email: item?.email || "",
      address: item?.address || "",
      certificacion_bancaria_file: null,
      documento_representante_legal_file: null,
      certificacion_bancaria: item?.certificacion_bancaria || "",
      documento_representante_legal: item?.documento_representante_legal || "",
      is_active: Boolean(item?.is_active),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setLocalError("");
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    const cleanName = String(form.name || "").trim();
    if (!cleanName) {
      const message = "El nombre del proveedor es obligatorio.";
      setLocalError(message);
      warning(message);
      return;
    }

    const payload = {
      name: cleanName,
      rut: String(form.rut || "").trim() || null,
      contact_name: String(form.contact_name || "").trim() || null,
      phone: String(form.phone || "").trim() || null,
      email: String(form.email || "").trim() || null,
      address: String(form.address || "").trim() || null,
      certificacion_bancaria: form.certificacion_bancaria || null,
      documento_representante_legal: form.documento_representante_legal || null,
      certificacion_bancaria_file: form.certificacion_bancaria_file || undefined,
      documento_representante_legal_file: form.documento_representante_legal_file || undefined,
      is_active: Boolean(form.is_active),
    };

    try {
      const filters = { query, status };
      if (editing) {
        await updateSupplier(editing.id, payload, filters);
        success("Proveedor actualizado correctamente.");
      } else {
        await createSupplier(payload, filters);
        success("Proveedor creado correctamente.");
      }
      closeModal();
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "No fue posible guardar el proveedor.";
      setLocalError(message);
      notifyError(message);
    }
  };

  const handleToggle = async (item) => {
    const filters = { query, status };
    try {
      if (item.is_active) {
        await deactivateSupplier(item.id, filters);
        success("Proveedor desactivado correctamente.");
        return;
      }
      await updateSupplier(item.id, { is_active: true }, filters);
      success("Proveedor activado correctamente.");
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "No fue posible actualizar el proveedor.";
      setLocalError(message);
      notifyError(message);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Proveedores</h1>
          <p className="mt-1 text-sm text-slate-500">
            Administra los proveedores que suministran productos al inventario.
            {activeCondominiumId ? ` Contexto: #${activeCondominiumId}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-70"
          disabled={!hasTenantContext || saving}
        >
          + Crear proveedor
        </button>
      </header>

      {!hasTenantContext ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No hay propiedad activa para gestionar proveedores.
        </p>
      ) : null}

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <section className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <Field label="Buscar" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre o contacto" />
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
          Cargando proveedores...
        </div>
      ) : suppliers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="font-semibold text-slate-700">No hay proveedores registrados para esta propiedad.</p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
          >
            Crear proveedor
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">RUT</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Telefono</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Documentos</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-800">{item.name || "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{item.rut || "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{item.contact_name || "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{item.phone || "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{item.email || "-"}</td>
                  <td className="px-4 py-3 text-slate-700">
                    <div className="flex flex-col gap-1">
                      <DocumentLink href={item.certificacion_bancaria_url} label="Certificación bancaria" />
                      <DocumentLink href={item.documento_representante_legal_url} label="Representante legal" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        item.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {item.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                        disabled={saving}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggle(item)}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                        disabled={saving}
                      >
                        {item.is_active ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-4 sm:items-center">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900">{editing ? "Editar proveedor" : "Nuevo proveedor"}</h3>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field
                label="Nombre"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Nombre del proveedor"
              />
              <Field
                label="RUT"
                value={form.rut}
                onChange={(event) => setForm((prev) => ({ ...prev, rut: event.target.value }))}
                placeholder="RUT"
              />
              <Field
                label="Contacto"
                value={form.contact_name}
                onChange={(event) => setForm((prev) => ({ ...prev, contact_name: event.target.value }))}
                placeholder="Nombre de contacto"
              />
              <Field
                label="Telefono"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="Telefono"
              />
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="Email"
              />
              <div className="md:col-span-2">
                <Field
                  label="Direccion"
                  value={form.address}
                  onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                  placeholder="Direccion"
                />
              </div>
              <FileField
                label="Certificación bancaria"
                fileName={form.certificacion_bancaria_file?.name || fileNameFromPath(form.certificacion_bancaria)}
                link={editing?.certificacion_bancaria_url || null}
                onChange={(file) =>
                  setForm((prev) => ({
                    ...prev,
                    certificacion_bancaria_file: file,
                    certificacion_bancaria: file ? "" : prev.certificacion_bancaria,
                  }))
                }
              />
              <FileField
                label="Documento representante legal"
                fileName={
                  form.documento_representante_legal_file?.name || fileNameFromPath(form.documento_representante_legal)
                }
                link={editing?.documento_representante_legal_url || null}
                onChange={(file) =>
                  setForm((prev) => ({
                    ...prev,
                    documento_representante_legal_file: file,
                    documento_representante_legal: file ? "" : prev.documento_representante_legal,
                  }))
                }
              />
              <label className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 md:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Activo</span>
                <input
                  type="checkbox"
                  checked={Boolean(form.is_active)}
                  onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                  className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-300"
                />
              </label>
            </div>

            {localError ? (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{localError}</p>
            ) : null}

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-70"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-70"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
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

function FileField({ label, fileName, link, onChange }) {
  return (
    <label className="block md:col-span-2">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <input
          type="file"
          onChange={(event) => onChange(event.target.files?.[0] || null)}
          className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
        />
        {fileName ? <p className="mt-2 text-sm text-slate-600">Archivo: {fileName}</p> : null}
        {link ? (
          <a href={link} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-indigo-700">
            Ver archivo actual
          </a>
        ) : null}
      </div>
    </label>
  );
}

function DocumentLink({ href, label }) {
  if (!href) return <span className="text-slate-400">-</span>;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-indigo-700 hover:text-indigo-800">
      {label}
    </a>
  );
}

function fileNameFromPath(path) {
  if (!path) return "";
  const parts = String(path).split(/[\\/]/);
  return parts[parts.length - 1] || "";
}

export default SuppliersPage;
