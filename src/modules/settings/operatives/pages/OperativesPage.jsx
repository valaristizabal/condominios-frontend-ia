import { useMemo, useState } from "react";
import BackButton from "../../../../components/common/BackButton";
import ChangeUserPasswordModal from "../../../../components/common/ChangeUserPasswordModal";
import { useAuthContext } from "../../../../context/useAuthContext";
import OperativeFormModal from "../components/OperativeFormModal";
import OperativeTable from "../components/OperativeTable";
import { useOperatives } from "../hooks/useOperatives";
import { isSuperUser, isTenantAdminRole } from "../../../../utils/roles";

function OperativesPage() {
  const { user } = useAuthContext();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [contractType, setContractType] = useState("all");
  const filters = useMemo(() => ({ query, status, contractType }), [contractType, query, status]);

  const {
    operatives,
    operativeRoles,
    currentPage,
    pagination,
    setCurrentPage,
    loading,
    saving,
    error,
    hasTenantContext,
    createOperative,
    updateOperative,
    changeUserPassword,
  } = useOperatives(filters);

  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [passwordModalTarget, setPasswordModalTarget] = useState(null);

  const canChangePassword = useMemo(() => {
    if (user?.is_platform_admin === true) return true;
    return isSuperUser(user?.role) || isTenantAdminRole(user?.role);
  }, [user?.is_platform_admin, user?.role]);

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

  const openPasswordModal = (item) => {
    if (!canChangePassword) return;
    setSuccess("");
    setPasswordModalTarget(item);
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
      await updateOperative(editing.id, payload);
      setSuccess("Operativo actualizado correctamente.");
    } else {
      await createOperative(payload);
      setSuccess("Operativo creado correctamente.");
    }
    closeModal();
  };

  const handlePasswordSubmit = async (payload) => {
    const targetUserId = Number(passwordModalTarget?.user_id || passwordModalTarget?.user?.id || 0);
    if (!targetUserId) {
      throw new Error("No se pudo identificar el usuario a actualizar.");
    }

    await changeUserPassword(targetUserId, payload);
    setSuccess("Contraseña actualizada correctamente.");
    closePasswordModal();
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-3">
        <BackButton variant="settings" />
      </div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Operativos</h1>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
          disabled={!hasTenantContext}
        >
          + Nuevo Operativo
        </button>
      </header>

      {!hasTenantContext ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No hay propiedad activa para gestionar operativos.
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

      <section className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <Field
          label="Buscar"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nombre"
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
          label="Tipo contrato"
          value={contractType}
          onChange={(e) => setContractType(e.target.value)}
          options={[
            { value: "all", label: "Todos" },
            { value: "planta", label: "Planta" },
            { value: "contratista", label: "Contratista" },
          ]}
        />
      </section>

      {loading ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          Cargando operativos...
        </div>
      ) : (
        <OperativeTable
          rows={operatives}
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
        <OperativeFormModal
          key={editing ? `edit-op-${editing.id}` : "create-op"}
          open={modalOpen}
          initialValues={editing}
          roles={operativeRoles}
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

export default OperativesPage;
