import { useEffect, useMemo, useRef, useState } from "react";

const statusStyles = {
  "Al dia": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Saldo pendiente": "border-amber-200 bg-amber-50 text-amber-700",
  "Saldo a favor": "border-sky-200 bg-sky-50 text-sky-700",
  "En mora": "border-rose-200 bg-rose-50 text-rose-700",
};

const FILTER_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "al-dia", label: "Al dia" },
  { value: "pendiente", label: "Saldo pendiente" },
  { value: "favor", label: "Saldo a favor" },
  { value: "mora", label: "En mora" },
];

function PortfolioStatusTable({
  rows = [],
  selectedId = null,
  loading = false,
  statusFilter = "todos",
  onStatusFilterChange,
}) {
  const filteredRows = useMemo(() => {
    if (statusFilter === "todos") return rows;
    if (statusFilter === "al-dia") return rows.filter((row) => row.status === "Al dia");
    if (statusFilter === "pendiente") return rows.filter((row) => row.status === "Saldo pendiente");
    if (statusFilter === "favor") return rows.filter((row) => row.status === "Saldo a favor");
    if (statusFilter === "mora") return rows.filter((row) => row.status === "En mora");
    return rows;
  }, [rows, statusFilter]);

  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-slate-400">
            Cartera
          </p>
          <h2 className="mt-2 text-xl font-bold text-gray-800">Estado de cartera</h2>
          <p className="mt-1 text-sm text-slate-500">
            Vista general del estado actual de cada inmueble y su comportamiento de pago.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-[280px] sm:items-end">
          <StatusFilterSelect
            value={statusFilter}
            onChange={(value) => onStatusFilterChange?.(String(value))}
            options={FILTER_OPTIONS}
            placeholder="Filtrar estado..."
          />
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {filteredRows.length} unidades
          </span>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100">
        {loading ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm font-semibold text-slate-500">
            Cargando estado de cartera...
          </div>
        ) : null}

        {!loading && filteredRows.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm font-semibold text-slate-500">
            No hay inmuebles con este estado.
          </div>
        ) : null}

        {!loading && filteredRows.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-4">Unidad / Apto</th>
                    <th className="px-5 py-4">Propietario</th>
                    <th className="px-5 py-4">Dia de corte</th>
                    <th className="px-5 py-4">Valor corte</th>
                    <th className="px-5 py-4">Saldo pendiente</th>
                    <th className="px-5 py-4">Saldo a favor</th>
                    <th className="px-5 py-4">Fecha de vencimiento</th>
                    <th className="px-5 py-4">Dias en mora</th>
                    <th className="px-5 py-4">Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((row) => {
                    const isSelected = row.id === selectedId;

                    return (
                      <tr
                        key={row.id}
                        className={["border-t border-gray-100", isSelected ? "bg-slate-50/80" : ""].join(" ")}
                      >
                        <td className="px-5 py-4 font-bold text-slate-900">{row.unit}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-slate-600">{row.owner}</td>
                        <td className="px-5 py-4 text-sm font-bold text-slate-900">{formatCutoffDay(row?.dueDate)}</td>
                        <td className="px-5 py-4 text-sm font-bold text-slate-900">{row?.cutoffValueLabel || "$0"}</td>
                        <td className="px-5 py-4 text-sm font-bold text-slate-900">{row?.pendingBalanceLabel || "$0"}</td>
                        <td className="px-5 py-4 text-sm font-bold text-emerald-700">{row?.creditBalanceLabel || "$0"}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-slate-600">{row.dueDateLabel}</td>
                        <td className="px-5 py-4 text-sm font-bold text-slate-900">{row.daysOverdueLabel}</td>
                        <td className="px-5 py-4 text-center align-middle">
                          <div className="flex w-full items-center justify-center">
                            <span
                              className={[
                                "inline-flex items-center justify-center rounded-full border px-3 py-1 text-center text-xs font-extrabold",
                                statusStyles[row.status] || statusStyles["Al dia"],
                              ].join(" ")}
                            >
                              {row.status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-3 xl:hidden">
              {filteredRows.map((row) => {
                const isSelected = row.id === selectedId;

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
                        <p className="text-sm font-extrabold text-slate-900">{row.unit}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{row.owner}</p>
                      </div>

                      <span
                        className={[
                          "inline-flex rounded-full border px-3 py-1 text-[11px] font-extrabold",
                          statusStyles[row.status] || statusStyles["Al dia"],
                        ].join(" ")}
                      >
                        {row.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3">
                      <StatusMetric label="Dia de corte" value={formatCutoffDay(row?.dueDate)} />
                      <StatusMetric label="Valor corte" value={row?.cutoffValueLabel || "$0"} />
                      <StatusMetric label="Saldo pendiente" value={row?.pendingBalanceLabel || "$0"} />
                      <StatusMetric label="Saldo a favor" value={row?.creditBalanceLabel || "$0"} tone="emerald" />
                      <StatusMetric label="Vencimiento" value={row.dueDateLabel} />
                      <StatusMetric label="Dias en mora" value={row.daysOverdueLabel} />
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

export default PortfolioStatusTable;

function StatusFilterSelect({ value, onChange, options = [], placeholder = "Seleccionar..." }) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => String(option.value) === String(value)) || null,
    [options, value]
  );

  useEffect(() => {
    if (!open) return undefined;

    const handleOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  return (
    <div ref={rootRef} className="relative z-10 w-full">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-left text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-200"
      >
        <span className={selectedOption ? "text-slate-900" : "text-slate-500"}>
          {selectedOption?.label || placeholder}
        </span>
        <span className="text-slate-400">{open ? "^" : "v"}</span>
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <div className="p-1">
            {options.map((option) => (
              <button
                key={String(option.value)}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange?.(option.value);
                  setOpen(false);
                }}
                className={[
                  "block w-full rounded-xl px-3 py-2 text-left text-sm transition",
                  String(option.value) === String(value)
                    ? "bg-blue-50 font-semibold text-blue-700"
                    : "text-slate-700 hover:bg-slate-100",
                ].join(" ")}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatusMetric({ label, value, tone = "slate" }) {
  return (
    <div>
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className={["mt-1 text-sm font-bold", tone === "emerald" ? "text-emerald-700" : "text-slate-900"].join(" ")}>
        {value}
      </p>
    </div>
  );
}

function formatCutoffDay(value) {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";

  return String(date.getDate());
}
