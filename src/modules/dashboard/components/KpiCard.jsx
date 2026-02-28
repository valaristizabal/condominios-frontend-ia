function KpiCard({ label, value, tone = "indigo" }) {
  const toneStyles = {
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    red: "bg-red-50 text-red-700 border-red-100",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`mb-3 inline-flex rounded-xl border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${toneStyles[tone]}`}
      >
        {label}
      </div>
      <p className="text-3xl font-extrabold leading-none text-slate-900">{value}</p>
    </article>
  );
}

export default KpiCard;

