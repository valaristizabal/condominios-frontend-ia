import { useState } from "react";
import VisitFormModal from "../components/VisitFormModal";
import VisitTable from "../components/VisitTable";
import { useVisits } from "../hooks/useVisits";
import BackButton from "../../../../components/common/BackButton";
import { useNotification } from "../../../../hooks/useNotification";

function ActivityIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 13h4l2-6 4 12 2-6h6v-2h-4l-2 6-4-12-2 6H3Z"
      />
    </svg>
  );
}

export default function VisitsPage() {
  const {
    unitTypes,
    apartments,
    activeVisits,
    historyVisits,
    loading,
    registerVisit,
    checkout,
    activePage,
    historyPage,
    activePagination,
    historyPagination,
    setActivePage,
    setHistoryPage,
  } = useVisits();
  const { success, error } = useNotification();
  const [activeTab, setActiveTab] = useState("actuales");

  const handleRegisterVisit = async (values) => {
    try {
      await registerVisit(values);
      success("Visitante registrado correctamente.");
    } catch (requestError) {
      const message = normalizeVisitError(requestError, "No fue posible registrar el visitante.");
      error(message);
      throw requestError;
    }
  };

  const handleCheckout = async (visitId) => {
    try {
      await checkout(visitId);
      success("Salida registrada correctamente.");
    } catch (requestError) {
      const message = normalizeVisitError(requestError, "No fue posible registrar la salida.");
      error(message);
      throw requestError;
    }
  };

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <BackButton variant="dashboard" />
          <h1 className="text-2xl font-extrabold text-slate-900">Visitantes</h1>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <VisitFormModal
              unitTypes={unitTypes}
              apartments={apartments}
              onSubmit={handleRegisterVisit}
              loading={loading}
            />
          </div>

          <div>
            <div className="mb-6 flex items-center gap-3">
              <ActivityIcon className="h-[18px] w-[18px] text-indigo-600" />
              <h2 className="text-lg font-semibold text-slate-800">Visualizar visitantes</h2>
            </div>

            <div className="mb-4 rounded-2xl bg-slate-100 p-2">
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold sm:text-sm">
                <button
                  type="button"
                  onClick={() => setActiveTab("actuales")}
                  className={[
                    "rounded-xl py-2 transition",
                    activeTab === "actuales" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:bg-white/60",
                  ].join(" ")}
                >
                  Actuales
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("historial")}
                  className={[
                    "rounded-xl py-2 transition",
                    activeTab === "historial" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:bg-white/60",
                  ].join(" ")}
                >
                  Historial
                </button>
              </div>
            </div>

            {activeTab === "actuales" ? (
              <VisitTable
                visits={activeVisits}
                onCheckout={handleCheckout}
                loading={loading}
                currentPage={activePage}
                totalPages={activePagination.lastPage}
                totalItems={activePagination.total}
                onPageChange={setActivePage}
                title="Visitantes actuales"
                subtitle="Control en tiempo real"
                description="Registra la salida para mantener el control del acceso."
                emptyTitle="Sin visitantes activos"
                emptyDescription="Cuando registres ingresos, apareceran aqui para controlar la salida."
              />
            ) : (
              <VisitTable
                visits={historyVisits}
                loading={loading}
                currentPage={historyPage}
                totalPages={historyPagination.lastPage}
                totalItems={historyPagination.total}
                onPageChange={setHistoryPage}
                title="Historial de visitantes"
                subtitle="Registro de salidas"
                description="Consulta las visitas finalizadas de la propiedad activa."
                emptyTitle="Sin historial de visitantes"
                emptyDescription="Todavia no hay salidas registradas."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function normalizeVisitError(error, fallbackMessage) {
  const responseData = error?.response?.data;
  const fieldErrors = responseData?.errors;

  if (fieldErrors && typeof fieldErrors === "object") {
    const firstFieldErrors = Object.values(fieldErrors).find(
      (messages) => Array.isArray(messages) && messages.length > 0
    );
    if (firstFieldErrors) {
      return String(firstFieldErrors[0]);
    }
  }

  return responseData?.message || error?.message || fallbackMessage;
}
