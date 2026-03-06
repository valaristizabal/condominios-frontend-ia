import VisitFormModal from "../components/VisitFormModal";
import VisitTable from "../components/VisitTable";
import { useVisits } from "../hooks/useVisits";
import BackButton from "../../../../components/common/BackButton";

function UserPlusIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M15 8a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-7 0a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm7 2c-2.67 0-8 1.34-8 4v2h10v-2c0-.72.22-1.37.6-1.95A12.6 12.6 0 0 0 15 10Zm6 2h-2v-2h-2v2h-2v2h2v2h2v-2h2Z"
      />
    </svg>
  );
}

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
  const { apartments, visits, loading, registerVisit, checkout } = useVisits();

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <BackButton variant="dashboard" />
          <h1 className="text-2xl font-extrabold text-slate-900">Visitantes</h1>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <UserPlusIcon className="h-[18px] w-[18px] text-emerald-600" />
              <h2 className="text-lg font-semibold text-slate-800">Nuevo ingreso</h2>
            </div>

            <VisitFormModal apartments={apartments} onSubmit={registerVisit} loading={loading} />
          </div>

          <div>
            <div className="mb-6 flex items-center gap-3">
              <ActivityIcon className="h-[18px] w-[18px] text-indigo-600" />
              <h2 className="text-lg font-semibold text-slate-800">Visitantes en tiempo real</h2>
            </div>

            <VisitTable visits={visits} onCheckout={checkout} />
          </div>
        </div>
      </div>
    </div>
  );
}
