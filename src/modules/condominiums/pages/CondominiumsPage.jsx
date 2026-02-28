import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../context/useAuthContext";
import CondominiumCard from "../components/CondominiumCard";
import CondominiumForm from "../components/CondominiumForm";
import { useCondominiums } from "../hooks/useCondominiums";

function CondominiumsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const {
    condominiums,
    loading,
    error,
    saving,
    createCondominium,
    updateCondominium,
    toggleCondominiumStatus,
  } = useCondominiums();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCondominium, setEditingCondominium] = useState(null);
  const [actionError, setActionError] = useState("");

  const counts = useMemo(() => {
    const active = condominiums.filter((item) => item.is_active).length;
    const inactive = condominiums.length - active;
    return { total: condominiums.length, active, inactive };
  }, [condominiums]);

  const openCreateModal = () => {
    setActionError("");
    setEditingCondominium(null);
    setIsModalOpen(true);
  };

  const openEditModal = (condominium) => {
    setActionError("");
    setEditingCondominium(condominium);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setEditingCondominium(null);
  };

  const handleSubmit = async (payload) => {
    if (editingCondominium) {
      await updateCondominium(editingCondominium.id, payload);
    } else {
      await createCondominium(payload);
    }
    closeModal();
  };

  const handleToggle = async (condominium) => {
    setActionError("");
    try {
      await toggleCondominiumStatus(condominium.id);
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "No fue posible cambiar el estado.";
      setActionError(message);
    }
  };

  const handleEnter = (condominium) => {
    navigate(`/condominio/${condominium.id}/dashboard`);
  };

  return (
    <main className="min-h-screen bg-[#eef1f6] px-4 pb-24 pt-5 md:px-8">
      <section className="mx-auto max-w-6xl">
        <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">Gestión de Condominios</p>
            <h1 className="text-2xl font-extrabold text-slate-900">Condominios</h1>
            <p className="mt-1 text-sm text-slate-500">
              Sesión: <span className="font-semibold">{user?.full_name || user?.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <section className="mb-5 grid grid-cols-3 gap-3">
          <StatCard label="Total" value={counts.total} />
          <StatCard label="Activos" value={counts.active} accent="text-emerald-600" />
          <StatCard label="Inactivos" value={counts.inactive} accent="text-slate-500" />
        </section>

        <div className="mb-5">
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-xl bg-[#174abf] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(23,74,191,0.35)] hover:bg-[#123ea3]"
          >
            + Nuevo Condominio
          </button>
        </div>

        {error ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {actionError ? (
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {actionError}
          </p>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Cargando condominios...
          </div>
        ) : condominiums.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-lg font-semibold text-slate-700">No hay condominios registrados</p>
            <p className="mt-2 text-sm text-slate-500">Crea el primer condominio para empezar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {condominiums.map((condominium) => (
              <CondominiumCard
                key={condominium.id}
                condominium={condominium}
                onEnter={handleEnter}
                onEdit={openEditModal}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/45 p-4 sm:items-center">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-slate-900">
                {editingCondominium ? "Editar Condominio" : "Nuevo Condominio"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                Cerrar
              </button>
            </div>

            <CondominiumForm
              key={editingCondominium ? `edit-${editingCondominium.id}` : "create"}
              initialValues={editingCondominium}
              loading={saving}
              onCancel={closeModal}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}

function StatCard({ label, value, accent = "text-indigo-600" }) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${accent}`}>{value}</p>
    </div>
  );
}

export default CondominiumsPage;
