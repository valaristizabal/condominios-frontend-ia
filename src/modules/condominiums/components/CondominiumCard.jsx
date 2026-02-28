function CondominiumCard({ condominium, onEnter, onEdit, onToggle }) {
  const statusLabel = condominium?.is_active ? "Activo" : "Inactivo";
  const statusClass = condominium?.is_active
    ? "bg-emerald-100 text-emerald-700"
    : "bg-slate-200 text-slate-600";

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative h-36 bg-slate-100">
        {condominium?.image_url ? (
          <img
            src={condominium.image_url}
            alt={condominium.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-100">
            <BuildingIcon />
          </div>
        )}

        <span
          className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <h3 className="line-clamp-1 text-lg font-extrabold text-slate-900">{condominium.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{condominium.type || "Sin tipo definido"}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <InfoItem label="Torres/Bloques" value={condominium.tower || "-"} />
          <InfoItem label="Pisos" value={condominium.floors ?? "-"} />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEnter(condominium)}
            className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => onEdit(condominium)}
            className="flex-1 rounded-xl bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => onToggle(condominium)}
            className="flex-1 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            {condominium?.is_active ? "Desactivar" : "Activar"}
          </button>
        </div>
      </div>
    </article>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10 fill-slate-400" aria-hidden="true">
      <path d="M3 21h18v-2h-2V3H5v16H3v2Zm4-2V5h10v14H7Zm2-10h2v2H9V9Zm4 0h2v2h-2V9Zm-4 4h2v2H9v-2Zm4 0h2v2h-2v-2Z" />
    </svg>
  );
}

export default CondominiumCard;
