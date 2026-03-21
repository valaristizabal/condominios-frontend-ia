import { useEffect, useMemo, useState } from "react";

const PER_PAGE = 10;

function MovementHistory({ rows }) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return rows.slice(start, start + PER_PAGE);
  }, [currentPage, rows]);

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-800">Historial de Movimientos</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Hora</th>
              <th className="px-4 py-3">Fecha entrada</th>
              <th className="px-4 py-3">Fecha salida</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Cantidad</th>
              <th className="px-4 py-3">Costo unitario</th>
              <th className="px-4 py-3">Valor mov.</th>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Observación</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, idx) => (
              <tr key={`${row.id}-${idx}`} className="border-t border-gray-100">
                <td className="px-4 py-3 text-gray-700">{row.id ?? "-"}</td>
                <td className="px-4 py-3 text-gray-700">{formatDate(row.movement_date || row.created_at)}</td>
                <td className="px-4 py-3 text-gray-700">{formatTime(row.created_at)}</td>
                <td className="px-4 py-3 text-gray-700">{formatDateTime(row.fecha_entrada)}</td>
                <td className="px-4 py-3 text-gray-700">{formatDateTime(row.fecha_salida)}</td>
                <td className="px-4 py-3 font-semibold text-gray-800">{row.product_name || "-"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      row.type === "entry" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {row.type === "entry" ? "Entrada" : "Salida"}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-800">{row.quantity}</td>
                <td className="px-4 py-3 text-gray-700">{formatCurrency(row.product_unit_cost)}</td>
                <td className="px-4 py-3 text-gray-700">{formatCurrency(row.movement_estimated_value)}</td>
                <td className="px-4 py-3 text-gray-700">{resolveUserLabel(row)}</td>
                <td className="px-4 py-3 text-gray-700">{String(row.observations || "").trim() || "-"}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-6 text-center text-sm font-semibold text-gray-500">
                  Sin movimientos registrados.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {rows.length > PER_PAGE ? (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row">
          <p className="text-xs font-semibold text-slate-500">
            Pagina {currentPage} de {totalPages} ({rows.length} movimientos)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
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
  return date.toLocaleDateString("es-CO");
}

function formatTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.toLocaleDateString("es-CO")} ${date.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function resolveUserLabel(row) {
  const user = row.registeredBy || row.registered_by || null;
  if (!user) return "-";
  if (user.full_name && user.email) return `${user.full_name} (${user.email})`;
  return user.full_name || user.email || "-";
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "-";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "-";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default MovementHistory;
