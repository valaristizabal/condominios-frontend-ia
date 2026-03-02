const Card = ({ children, className = "" }) => (
  <div
    className={[
      "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm",
      className,
    ].join(" ")}
  >
    {children}
  </div>
);

const SectionTitle = ({ icon, title, desc }) => (
  <div className="flex items-start gap-3">
    <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-sm font-extrabold text-slate-900">{title}</p>
      {desc ? <p className="mt-1 text-xs font-semibold text-slate-500">{desc}</p> : null}
    </div>
  </div>
);

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
      <p className="text-sm font-extrabold text-slate-900">Sin registros recientes</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">
        Cuando registres entregas, aparecerán aquí para consulta rápida.
      </p>
    </div>
  );
}

function Row({ item, onRequestDeliver }) {
  const isReceived = (item?.status || "") === "RECEIVED_BY_SECURITY";
  const isDelivered = (item?.status || "") === "DELIVERED" || item?.delivered;

  return (
    <div
      className={[
        "flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4",
        isReceived ? "hover:bg-slate-50" : "",
      ].join(" ")}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold text-slate-900">
          {item?.courier || "Mensajería"} • {item?.unit || "Unidad"}
        </p>
        <p className="truncate text-[11px] font-semibold text-slate-500">
          {item?.type || "Documento"} • Recibe: {item?.receiver || "—"}
        </p>
        {isDelivered && item?.signatureUrl ? (
          <div className="mt-2">
            <img
              src={item.signatureUrl}
              alt="Firma digital"
              className="h-10 w-28 rounded-lg border border-slate-200 bg-white object-contain"
            />
          </div>
        ) : null}
      </div>
      <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700">
        {item?.date || "—"}
      </span>

      {isReceived ? (
        <button
          type="button"
          onClick={() => onRequestDeliver?.(item)}
          className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-blue-700 hover:bg-blue-100"
        >
          Entregar
        </button>
      ) : null}

      {isDelivered ? (
        <span className="rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-extrabold text-emerald-700">
          Entregado
        </span>
      ) : null}
    </div>
  );
}

export default function CorrespondenceTable({ recent = [], onRequestDeliver }) {
  return (
    <Card>
      <SectionTitle
        icon="🕘"
        title="Últimos registros"
        desc="Consulta rápida de correspondencias registradas recientemente."
      />

      <div className="mt-6 space-y-3">
        {!recent || recent.length === 0 ? (
          <EmptyState />
        ) : (
          recent.map((r, idx) => (
            <Row key={r?.id ?? idx} item={r} onRequestDeliver={onRequestDeliver} />
          ))
        )}
      </div>
    </Card>
  );
}
