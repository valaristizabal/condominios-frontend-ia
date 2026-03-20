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
  const { unitTypes, apartments, visits, loading, registerVisit, checkout, currentPage, pagination, setCurrentPage } =
    useVisits();
  const { success, error } = useNotification();

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
              <h2 className="text-lg font-semibold text-slate-800">Visitantes en tiempo real</h2>
            </div>

            <VisitTable
              visits={visits}
              onCheckout={handleCheckout}
              loading={loading}
              currentPage={currentPage}
              totalPages={pagination.lastPage}
              totalItems={pagination.total}
              onPageChange={setCurrentPage}
            />
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
