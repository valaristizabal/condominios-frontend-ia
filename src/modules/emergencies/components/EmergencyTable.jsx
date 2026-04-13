function EmergencyTable({
  rows = [],
  loading = false,
  actingIds = {},
  onProgress,
  onClose,
  onRefresh,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  onPageChange,
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        Cargando emergencias...
      </div>
    );
  }

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">Emergencias registradas</h2>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
        >
          Actualizar
        </button>
      </div>

      {!rows.length ? (
        <div className="p-8 text-center text-sm font-semibold text-slate-500">No hay emergencias registradas.</div>
      ) : (
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Tipo de emergencia</th>
              <th className="px-4 py-3">Descripcion</th>
              <th className="px-4 py-3">Ubicacion</th>
              <th className="px-4 py-3">Unidad</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Accion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-slate-100 align-top">
                <td className="px-4 py-3 text-slate-700">{formatDate(item.event_date)}</td>
                <td className="px-4 py-3 text-slate-800">
                  <p className="font-semibold">{item?.emergency_type?.name || item?.emergencyType?.name || "-"}</p>
                  <p className="text-xs text-slate-500">{item.event_type || "-"}</p>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  <p className="max-w-[260px] whitespace-pre-wrap break-words">{item.description || "-"}</p>
                </td>
                <td className="px-4 py-3 text-slate-700">{item.event_location || "-"}</td>
                <td className="px-4 py-3 text-slate-700">{formatApartment(item.apartment)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusBadgeClass(item.status)}`}>
                    {statusLabel(item.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {item.status === "OPEN" ? (
                    <button
                      type="button"
                      onClick={() => onProgress?.(item.id)}
                      disabled={Boolean(actingIds[item.id])}
                      className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-200 disabled:opacity-60"
                    >
                      {actingIds[item.id] ? "Procesando..." : "Marcar en proceso"}
                    </button>
                  ) : null}

                  {item.status === "IN_PROGRESS" ? (
                    <button
                      type="button"
                      onClick={() => onClose?.(item.id)}
                      disabled={Boolean(actingIds[item.id])}
                      className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-200 disabled:opacity-60"
                    >
                      {actingIds[item.id] ? "Cerrando..." : "Cerrar"}
                    </button>
                  ) : null}

                  {item.status === "CLOSED" ? (
                    <span className="text-xs font-semibold text-slate-500">Sin acciones</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
          <p className="text-xs font-semibold text-slate-500">
            Pagina {currentPage} de {totalPages} ({totalItems} registros)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => canGoPrev && onPageChange?.(currentPage - 1)}
              disabled={!canGoPrev}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => canGoNext && onPageChange?.(currentPage + 1)}
              disabled={!canGoNext}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusLabel(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "OPEN") return "Abierta";
  if (normalized === "IN_PROGRESS") return "En proceso";
  if (normalized === "CLOSED") return "Cerrada";
  return normalized || "-";
}

function statusBadgeClass(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "OPEN") return "bg-red-100 text-red-700";
  if (normalized === "IN_PROGRESS") return "bg-amber-100 text-amber-700";
  if (normalized === "CLOSED") return "bg-emerald-100 text-emerald-700";
  return "bg-slate-100 text-slate-700";
}

function formatApartment(apartment) {
  if (!apartment) return "-";

  const unitTypeName = apartment?.unit_type?.name || apartment?.unitType?.name || "";
  const number = apartment?.number || "";

  return [unitTypeName, number].filter(Boolean).join(" ") || number || unitTypeName || "-";
}

export default EmergencyTable;
