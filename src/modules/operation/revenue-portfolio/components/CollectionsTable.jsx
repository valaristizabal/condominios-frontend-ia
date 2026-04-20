import { Eye } from "lucide-react";

function CollectionsTable({ records = [], selectedId = null, onView, onOpenEvidence, loading = false }) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-slate-400">
            Historial
          </p>
          <h2 className="mt-2 text-xl font-bold text-gray-800">Historial de recaudos</h2>
          <p className="mt-1 text-sm text-slate-500">
            Registros de recaudos aplicados en el periodo seleccionado.
          </p>
        </div>

        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {records.length} registros
        </span>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100">
        {loading ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm font-semibold text-slate-500">
            Cargando historial de recaudos...
          </div>
        ) : null}

        {!loading && records.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm font-semibold text-slate-500">
            No hay recaudos registrados.
          </div>
        ) : null}

        {!loading && records.length > 0 ? (
          <>
        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-5 py-4">Unidad/Apto</th>
                <th className="px-5 py-4">Propietario</th>
                <th className="px-5 py-4">Valor recaudado</th>
                <th className="px-5 py-4">Fecha recaudo</th>
                <th className="px-5 py-4">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {records.map((record) => {
                const isSelected = record.id === selectedId;

                return (
                  <tr
                    key={record.id}
                    className={["border-t border-gray-100", isSelected ? "bg-slate-50/80" : ""].join(" ")}
                  >
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">{record.unit}</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-600">{record.owner}</td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-900">{record.amountLabel}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-600">{record.dateLabel}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            onView?.(record);
                            onOpenEvidence?.(record);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Ver comprobante
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
          {records.map((record) => {
            const isSelected = record.id === selectedId;

            return (
              <article
                key={record.id}
                className={[
                  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
                  isSelected ? "ring-2 ring-blue-100" : "",
                ].join(" ")}
              >
                <div>
                  <p className="text-sm font-extrabold text-slate-900">{record.unit}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{record.owner}</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                      Valor
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">{record.amountLabel}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                      Fecha
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">{record.dateLabel}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      onView?.(record);
                      onOpenEvidence?.(record);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 transition hover:bg-slate-50"
                  >
                    Ver comprobante
                  </button>
                </div>
              </article>
            );
          })}
        </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

export default CollectionsTable;
