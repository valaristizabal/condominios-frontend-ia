import VisitFormModal from "../components/VisitFormModal";
import VisitTable from "../components/VisitTable";
import { useVisits } from "../hooks/useVisits";

function UsersIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M16 11a4 4 0 1 0-2.83-6.83A4 4 0 0 0 16 11ZM8 11a4 4 0 1 0-2.83-6.83A4 4 0 0 0 8 11Zm8 2c-2.32 0-7 1.16-7 3.5V19h14v-2.5C23 14.16 18.32 13 16 13Zm-8 0c-.3 0-.66.02-1.05.05C4.96 13.2 1 14.13 1 16.5V19h6v-2.5c0-1.2.61-2.2 1.67-2.98A9.53 9.53 0 0 0 8 13Z"
      />
    </svg>
  );
}

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto w-full max-w-7xl space-y-10 px-8 py-10">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <UsersIcon className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Gestión de accesos
            </p>
          </div>

          <h1 className="mt-3 text-3xl font-bold text-slate-900">Registro de Visitantes</h1>

          <p className="mt-2 max-w-xl text-sm text-slate-500">
            Controla ingresos en tiempo real, registra evidencia fotográfica y administra salidas
            de manera segura.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <UserPlusIcon className="h-[18px] w-[18px] text-emerald-600" />
              <h2 className="text-lg font-semibold text-slate-800">Nuevo Ingreso</h2>
            </div>

            <VisitFormModal apartments={apartments} onSubmit={registerVisit} loading={loading} />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <ActivityIcon className="h-[18px] w-[18px] text-indigo-600" />
              <h2 className="text-lg font-semibold text-slate-800">Visitantes en Tiempo Real</h2>
            </div>

            <VisitTable visits={visits} onCheckout={checkout} />
          </div>
        </div>
      </div>
    </div>
  );
}
