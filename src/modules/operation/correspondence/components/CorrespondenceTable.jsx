import { Clock } from "lucide-react";

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
        Cuando registres entregas, apareceran aqui para consulta rapida.
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
          {item?.courier || "Mensajeria"} - {item?.unit || "Unidad"}
        </p>
        <p className="truncate text-[11px] font-semibold text-slate-500">
          Recibe: {item?.receiver || "-"}
        </p>
        {item?.receiverDocument ? (
          <p className="truncate text-[11px] font-semibold text-slate-500">
            Documento: {item.receiverDocument}
          </p>
        ) : null}
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
      <div className="flex shrink-0 flex-col items-end gap-2 self-center">
        <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700">
          {item?.date || "-"}
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
          <div className="flex flex-col items-end gap-1">
            <span className="rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-extrabold text-emerald-700">
              Entregado
            </span>
            {item?.deliveredAt ? (
              <span className="text-[11px] font-semibold text-slate-500">
                Hora: {item.deliveredAt}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function CorrespondenceTable({
  recent = [],
  onRequestDeliver,
  loading = false,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  onPageChange,
}) {
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <Card>
      <SectionTitle
        icon={<Clock className="h-5 w-5" />}
        title="Ultimos registros"
        desc="Consulta rapida de correspondencias registradas recientemente."
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

      {totalPages > 1 ? (
        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row">
          <p className="text-xs font-semibold text-slate-500">
            Pagina {currentPage} de {totalPages} ({totalItems} registros)
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => canGoPrev && onPageChange?.(currentPage - 1)}
              disabled={!canGoPrev || loading}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => canGoNext && onPageChange?.(currentPage + 1)}
              disabled={!canGoNext || loading}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
