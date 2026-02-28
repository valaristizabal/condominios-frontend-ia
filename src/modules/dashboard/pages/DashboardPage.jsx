import SectionTitle from "../components/SectionTitle";
import KpiCard from "../components/KpiCard";
import QuickActions from "../components/QuickActions";
import RecentActivityTable from "../components/RecentActivityTable";
import { useDashboard } from "../hooks/useDashboard";

function DashboardPage() {
  const { summary, loading, error } = useDashboard();

  if (loading) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        Cargando dashboard...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Panel Principal</h1>
          <p className="mt-1 text-sm text-slate-500">Resumen operativo del condominio</p>
        </div>
        {summary?.source === "placeholder" ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
            Datos placeholder
          </span>
        ) : null}
      </header>

      {error ? (
        <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <SectionTitle
          title="Gestión de personal"
          subtitle="Registro de ingresos y salidas del equipo operativo."
        />
        <QuickActions />
      </section>

      <section className="mb-8">
        <SectionTitle title="Indicadores rápidos" subtitle="Métricas clave del día." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard label="Vehículos hoy" value={summary.kpis.vehicles_today} tone="indigo" />
          <KpiCard label="Visitantes hoy" value={summary.kpis.visitors_today} tone="emerald" />
          <KpiCard label="Personal activo" value={summary.kpis.active_staff} tone="slate" />
          <KpiCard label="Paquetes pendientes" value={summary.kpis.pending_packages} tone="amber" />
          <KpiCard label="Emergencias abiertas" value={summary.kpis.emergencies_open} tone="red" />
          <KpiCard label="Novedades abiertas" value={summary.kpis.incidents_open} tone="indigo" />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <SectionTitle title="Actividad reciente" subtitle="Últimos eventos del sistema." />
        <RecentActivityTable rows={summary.recentActivity} placeholder={summary.source === "placeholder"} />
      </section>
    </div>
  );
}

export default DashboardPage;

