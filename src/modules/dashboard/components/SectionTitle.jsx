function SectionTitle({ title, subtitle, right }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}

export default SectionTitle;

