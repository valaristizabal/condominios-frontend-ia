const Card = ({ children, className = "" }) => (
  <div className={`rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
    {children}
  </div>
);

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
      <p className="text-sm font-extrabold text-slate-900">Sin visitantes activos</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">
        Cuando registres ingresos, aparecerán aquí para controlar la salida.
      </p>
    </div>
  );
}

function Row({ visit, onCheckout, loading = false }) {
  const name = visit?.full_name || "Visitante";
  const doc = visit?.document_number || "";
  const aptObject = visit?.apartment;

  const apt =
    visit?.apartment_name ||
    (aptObject
      ? `Torre ${aptObject.tower} - Apto ${aptObject.number}`
      : visit?.apartment_id
      ? `Apto ${visit.apartment_id}`
      : "");

  const time = visit?.check_in_at || visit?.created_at || "";
  const ingresoLabel = formatDateTime(time);
  const salidaLabel = formatDateTime(visit?.check_out_at);
  const permanenciaLabel = formatStay(visit?.stay_minutes, visit?.check_in_at, visit?.check_out_at);
  const isInside = visit?.status === "INSIDE";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="min-w-0 flex items-center gap-3 sm:gap-4">
        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          {visit.photo ? (
            <img src={resolvePhotoUrl(visit.photo)} alt="Foto visitante" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-slate-200" />
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{name}</p>

          <p className="truncate text-xs text-slate-500">
            {doc ? `Doc: ${doc} - ` : ""}
            {apt || "Destino no definido"}
          </p>

          <div className="mt-1 space-y-1 text-[11px] text-slate-400">
            {ingresoLabel ? <p>Ingreso: {ingresoLabel}</p> : null}
            {salidaLabel ? <p>Salida: {salidaLabel}</p> : null}
            {permanenciaLabel ? <p>Permanencia: {permanenciaLabel}</p> : null}
          </div>
        </div>
      </div>

      <div className="flex w-full items-center sm:w-auto">
        {isInside ? (
          <button
            type="button"
            onClick={() => onCheckout?.(visit.id)}
            disabled={loading}
            className="w-full whitespace-nowrap rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 sm:w-auto"
          >
            {loading ? "Registrando..." : "Registrar salida"}
          </button>
        ) : (
          <span className="whitespace-nowrap rounded-xl border border-green-200 bg-green-100 px-3 py-2 text-xs font-bold text-green-700">
            Cerrada
          </span>
        )}
      </div>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  const datePart = parsed.toLocaleDateString("es-CO");
  const timePart = parsed.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${datePart} ${timePart}`;
}

function formatStay(stayMinutes, checkInAt, checkOutAt) {
  let totalMinutes = Number.isFinite(Number(stayMinutes)) ? Math.round(Number(stayMinutes)) : null;

  if (totalMinutes === null && checkInAt && checkOutAt) {
    const checkInDate = new Date(checkInAt);
    const checkOutDate = new Date(checkOutAt);

    if (!Number.isNaN(checkInDate.getTime()) && !Number.isNaN(checkOutDate.getTime())) {
      totalMinutes = Math.max(0, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 60000));
    }
  }

  if (totalMinutes === null) return "";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours} h ${minutes} min`;
  }

  return `${minutes} min`;
}

export default function VisitTable({
  visits = [],
  onCheckout,
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Control en tiempo real
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            Visitantes actuales ({totalItems || 0})
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Registra la salida para mantener el control del acceso.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {!visits || visits.length === 0 ? (
          <EmptyState />
        ) : (
          visits.map((visit) => (
            <Row
              key={visit.id || `${visit.document_number}-${visit.created_at}`}
              visit={visit}
              onCheckout={onCheckout}
              loading={loading}
            />
          ))
        )}
      </div>

      {totalPages > 1 ? (
        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row">
          <p className="text-xs font-semibold text-slate-500">
            Página {currentPage} de {totalPages}
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

function resolvePhotoUrl(photoPath) {
  if (!photoPath) return "";
  if (/^https?:\/\//i.test(photoPath)) return photoPath;

  const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
  const baseUrl = apiUrl.replace(/\/api\/?$/, "");
  return `${baseUrl}/storage/${String(photoPath).replace(/^\/+/, "")}`;
}
