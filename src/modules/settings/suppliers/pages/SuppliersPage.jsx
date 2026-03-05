import { useMemo, useState } from "react";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import { useSuppliers } from "../hooks/useSuppliers";

const EMPTY_FORM = {
  name: "",
  contact_name: "",
  phone: "",
  email: "",
  address: "",
  is_active: true,
};

function SuppliersPage() {
  const { activeCondominiumId } = useActiveCondominium();
  const { suppliers, loading, saving, error, hasTenantContext, createSupplier, updateSupplier, deactivateSupplier } =
    useSuppliers();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [localError, setLocalError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return suppliers.filter((item) => {
      const matchQuery =
        !normalizedQuery ||
        String(item.name || "").toLowerCase().includes(normalizedQuery) ||
        String(item.contact_name || "").toLowerCase().includes(normalizedQuery);
      const matchStatus = status === "all" || (status === "active" ? item.is_active : !item.is_active);
      return matchQuery && matchStatus;
    });
  }, [query, status, suppliers]);

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
      contact_name: item?.contact_name || "",
      phone: item?.phone || "",
      email: item?.email || "",
      address: item?.address || "",
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
      setLocalError("El nombre del proveedor es obligatorio.");
      return;
    }

    const payload = {
      name: cleanName,
      contact_name: String(form.contact_name || "").trim() || null,
      phone: String(form.phone || "").trim() || null,
      email: String(form.email || "").trim() || null,
      address: String(form.address || "").trim() || null,
      is_active: Boolean(form.is_active),
    };

    try {
      if (editing) {
        await updateSupplier(editing.id, payload);
      } else {
        await createSupplier(payload);
      }
      closeModal();
    } catch (err) {
      setLocalError(err?.response?.data?.message || err?.message || "No fue posible guardar el proveedor.");
    }
  };

  const handleToggle = async (item) => {
    if (item.is_active) {
      await deactivateSupplier(item.id);
      return;
    }
    await updateSupplier(item.id, { is_active: true });
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
      ) : filtered.length === 0 ? (
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
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Telefono</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-800">{item.name || "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{item.contact_name || "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{item.phone || "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{item.email || "-"}</td>
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

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-4 sm:items-center">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900">
              {editing ? "Editar proveedor" : "Nuevo proveedor"}
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field
                label="Nombre"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Nombre del proveedor"
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
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {localError}
              </p>
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

export default SuppliersPage;
