import { useMemo } from "react";
import { useEffect, useState } from "react";
import CleaningChecklistItemList from "./CleaningChecklistItemList";

function CleaningRecordDetails({
  open,
  record,
  loading,
  saving,
  onClose,
  onToggleChecklistItem,
  onFinalize,
}) {
  const [observationText, setObservationText] = useState("");
  const resolvedItems = useMemo(() => record?.checklistItems || [], [record]);

  const completedCount = useMemo(
    () => resolvedItems.filter((item) => Boolean(item.completed)).length,
    [resolvedItems]
  );
  const totalCount = resolvedItems.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isCompleted = String(record?.status || "").toLowerCase() === "completed";
  const canFinalize = !isCompleted && totalCount > 0 && completedCount === totalCount;

  useEffect(() => {
    setObservationText(record?.observations || "");
  }, [record?.id, record?.observations]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/45">
      <aside className="h-full w-full max-w-2xl overflow-y-auto bg-white p-5 shadow-2xl">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Detalle de limpieza</h3>
            <p className="mt-1 text-sm text-slate-500">
              {record?.cleaningArea?.name || "Area"} - {record?.cleaning_date || "-"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            Cerrar
          </button>
        </header>

        <section className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
          <Metric label="Operativo" value={record?.operative?.user?.full_name || "-"} />
          <Metric label="Estado" value={isCompleted ? "Completado" : "Pendiente"} />
          <Metric label="Progreso" value={`${progress}%`} />
        </section>

        <section className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-800">Checklist</p>
            <p className="text-xs font-semibold text-slate-500">
              {completedCount} / {totalCount} completados
            </p>
          </div>

          <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-emerald-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {loading ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-500">
              Cargando detalle...
            </div>
          ) : (
            <CleaningChecklistItemList
              items={resolvedItems}
              canEdit={!isCompleted && !saving}
              onToggleItem={onToggleChecklistItem}
            />
          )}
        </section>

        {isCompleted ? (
          <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Observaciones</p>
            <p className="mt-1 text-sm text-slate-700">{record?.observations || "Sin observacion final."}</p>
          </section>
        ) : (
          <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Observacion final</p>
            <textarea
              value={observationText}
              onChange={(event) => setObservationText(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="Describe el resultado general de la limpieza..."
            />
          </section>
        )}

        <footer className="mt-5">
          <button
            type="button"
            disabled={!canFinalize || saving || !String(observationText || "").trim()}
            onClick={() => onFinalize(String(observationText || "").trim())}
            className={[
              "w-full rounded-xl px-4 py-2.5 text-sm font-bold",
              canFinalize && !saving && String(observationText || "").trim()
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "cursor-not-allowed bg-slate-200 text-slate-500",
            ].join(" ")}
          >
            {saving ? "Finalizando..." : "Finalizar limpieza"}
          </button>
          {!isCompleted && (!canFinalize || !String(observationText || "").trim()) ? (
            <p className="mt-2 text-center text-xs font-semibold text-slate-500">
              Debes marcar todos los items y escribir observacion para finalizar.
            </p>
          ) : null}
        </footer>
      </aside>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

export default CleaningRecordDetails;
