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
          <p className="mt-1 text-sm text-slate-500">Resumen operativo de la propiedad</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            Contexto activo:{" "}
            {summary.activeCondominiumId ? `Propiedad #${summary.activeCondominiumId}` : "Sin propiedad"}
          </p>
        </div>
        {summary?.source !== "api" ? (
          <div className="flex flex-col items-end gap-1">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
              Datos de respaldo
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              Fuente contexto: {summary.contextSource}
            </span>
          </div>
        ) : null}
      </header>

      {error ? (
        <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <SectionTitle title="Gestion de personal" subtitle="Registro de ingresos y salidas del equipo operativo." />
        <QuickActions />
      </section>

      <section className="mb-8">
        <SectionTitle title="Indicadores rapidos" subtitle="Metricas clave del dia." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard
            label="Valor total inventario"
            value={formatCurrency(summary.kpis.inventory_total_value)}
            tone="emerald"
          />
          <KpiCard label="Vehiculos hoy" value={summary.kpis.vehicles_today} tone="indigo" />
          <KpiCard label="Visitantes dentro" value={summary.kpis.visitors_inside} tone="emerald" />
          <KpiCard label="Personal activo" value={summary.kpis.active_staff} tone="slate" />
          <KpiCard label="Residentes" value={summary.kpis.residents_count} tone="amber" />
          <KpiCard label="Emergencias abiertas" value={summary.kpis.emergencies_open} tone="red" />
          <KpiCard label="Novedades abiertas" value={summary.kpis.incidents_open} tone="indigo" />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <SectionTitle title="Actividad reciente" subtitle="Ultimos eventos del sistema." />
        <RecentActivityTable rows={summary.recentActivity} placeholder={summary.source !== "api"} />
      </section>
    </div>
  );
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default DashboardPage;
