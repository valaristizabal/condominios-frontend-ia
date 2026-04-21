import { useState } from "react";
import { Download, Eye, MessageSquareText, X } from "lucide-react";

const statusStyles = {
  registrado: "border-blue-200 bg-blue-50 text-blue-700",
  "con-soporte": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "pendiente-soporte": "border-amber-200 bg-amber-50 text-amber-700",
};

function AdministrativeExpensesTable({
  rows = [],
  selectedId = null,
  onViewSupport,
  onDownload,
  downloading = false,
}) {
  const [selectedObservationRow, setSelectedObservationRow] = useState(null);

  const getObservationLabel = (value) => {
    const normalized = String(value || "").trim();
    return normalized || "Sin observaciones";
  };

  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-slate-400">
            Historial
          </p>
          <h2 className="mt-2 text-xl font-bold text-gray-800">Historial de gastos</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {rows.length} registros
          </span>

          <button
            type="button"
            onClick={onDownload}
            disabled={downloading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Download className="h-4 w-4" />
            {downloading ? "Descargando..." : "Descargar gastos"}
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100">
        {rows.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm font-semibold text-slate-500">
            No hay gastos que coincidan con los filtros aplicados.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-4">Fecha</th>
                    <th className="px-5 py-4">Tipo de gasto</th>
                    <th className="px-5 py-4">Valor</th>
                    <th className="px-5 py-4">Medio de pago</th>
                    <th className="px-5 py-4">Registrado por</th>
                    <th className="px-5 py-4">Estado</th>
                    <th className="px-5 py-4">Accion</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row) => {
                    const isSelected = row.id === selectedId;
                    const hasSupport = Boolean(String(row.supportName || "").trim());

                    return (
                      <tr
                        key={row.id}
                        className={["border-t border-gray-100", isSelected ? "bg-slate-50/80" : ""].join(" ")}
                      >
                        <td className="px-5 py-4 text-sm font-semibold text-slate-600">{row.dateLabel}</td>
                        <td className="px-5 py-4 font-bold text-slate-900">{row.expenseTypeLabel}</td>
                        <td className="px-5 py-4 text-sm font-bold text-slate-900">{row.amountLabel}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-slate-600">{row.paymentMethodLabel}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-slate-600">{row.registeredBy}</td>
                        <td className="px-5 py-4">
                          <span
                            className={[
                              "inline-flex rounded-full border px-3 py-1 text-xs font-extrabold",
                              statusStyles[row.status] || statusStyles.registrado,
                            ].join(" ")}
                          >
                            {row.statusLabel}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col items-stretch justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedObservationRow(row)}
                              disabled={!String(row.observations || "").trim()}
                              className={[
                                "inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-extrabold transition",
                                String(row.observations || "").trim()
                                  ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                  : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400",
                              ].join(" ")}
                            >
                              <MessageSquareText className="h-3.5 w-3.5" />
                              Ver observaciones
                            </button>

                            <button
                              type="button"
                              onClick={() => hasSupport && onViewSupport?.(row)}
                              disabled={!hasSupport}
                              className={[
                                "inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-extrabold transition",
                                hasSupport
                                  ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                  : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400",
                              ].join(" ")}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Ver soporte
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-3 lg:hidden">
              {rows.map((row) => {
                const isSelected = row.id === selectedId;
                const hasSupport = Boolean(String(row.supportName || "").trim());

                return (
                  <article
                    key={row.id}
                    className={[
                      "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
                      isSelected ? "ring-2 ring-blue-100" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">{row.expenseTypeLabel}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{row.registeredBy}</p>
                      </div>

                      <span
                        className={[
                          "inline-flex rounded-full border px-3 py-1 text-[11px] font-extrabold",
                          statusStyles[row.status] || statusStyles.registrado,
                        ].join(" ")}
                      >
                        {row.statusLabel}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3">
                      <div>
                        <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                          Fecha
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900">{row.dateLabel}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                          Valor
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900">{row.amountLabel}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                          Medio
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900">{row.paymentMethodLabel}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <button
                        type="button"
                        onClick={() => String(row.observations || "").trim() && setSelectedObservationRow(row)}
                        disabled={!String(row.observations || "").trim()}
                        className={[
                          "w-full rounded-xl border px-3 py-2 text-xs font-extrabold transition",
                          String(row.observations || "").trim()
                            ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400",
                        ].join(" ")}
                      >
                        Ver observaciones
                      </button>

                      <button
                        type="button"
                        onClick={() => hasSupport && onViewSupport?.(row)}
                        disabled={!hasSupport}
                        className={[
                          "w-full rounded-xl border px-3 py-2 text-xs font-extrabold transition",
                          hasSupport
                            ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400",
                        ].join(" ")}
                      >
                        Ver soporte
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>

      {selectedObservationRow ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/35 px-4">
          <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-7 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-slate-400">
                  Observaciones
                </p>
                <h3 className="mt-2 text-xl font-bold text-gray-800">
                  {selectedObservationRow.expenseTypeLabel}
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {selectedObservationRow.registeredBy}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedObservationRow(null)}
                className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                aria-label="Cerrar observaciones"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold leading-6 text-slate-700">
                {getObservationLabel(selectedObservationRow.observations)}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default AdministrativeExpensesTable;
