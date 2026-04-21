import { Paperclip, Upload } from "lucide-react";
import SearchableSelect from "../../../../components/common/SearchableSelect";

const inputClassName =
  "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-200";

function Field({ label, error, children }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-slate-700">{label}</span>
        {error ? <span className="text-xs font-bold text-rose-600">{error}</span> : null}
      </div>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function CollectionFormCard({
  form,
  unitOptions,
  errors,
  fileName,
  fileError,
  detailMode,
  financialInfo,
  paymentPreview,
  fileInputRef,
  onChange,
  onUnitChange,
  onPickFile,
  onFileChange,
  onSubmit,
  onReset,
  saving = false,
}) {
  const isEditing = detailMode === "edit";

  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Registrar Recaudo</h2>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          Limpiar
        </button>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <Field label="Unidad" error={errors.unitId}>
          <SearchableSelect
            value={form.unitId}
            onChange={onUnitChange}
            options={unitOptions}
            placeholder="Seleccionar unidad..."
            searchPlaceholder="Buscar unidad..."
          />
        </Field>

        {financialInfo ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FinancialItem label="Periodo actual" value={financialInfo.period || "-"} />
              <FinancialItem label="Valor del corte" value={financialInfo.cutoffValueLabel} />
              <FinancialItem label="Saldo pendiente actual" value={financialInfo.pendingBalanceLabel} tone="rose" />
              <FinancialItem label="Saldo a favor actual" value={financialInfo.creditBalanceLabel} tone="emerald" />
            </div>
          </div>
        ) : null}

        <Field label="Nombre propietario" error={errors.owner}>
          <input
            name="owner"
            value={form.owner}
            onChange={onChange}
            placeholder="Nombre del propietario"
            className={inputClassName}
          />
        </Field>

        <Field label="Valor recaudado" error={errors.amount}>
          <input
            name="amount"
            type="number"
            min="0"
            step="1000"
            value={form.amount}
            onChange={onChange}
            placeholder="Ej: 850000"
            className={inputClassName}
          />
        </Field>

        {paymentPreview ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
              Resultado esperado
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FinancialItem label="Nuevo saldo pendiente" value={paymentPreview.pendingBalanceLabel} tone="rose" />
              <FinancialItem label="Nuevo saldo a favor" value={paymentPreview.creditBalanceLabel} tone="emerald" />
              <FinancialItem label="Estado resultante" value={paymentPreview.status} />
            </div>
          </div>
        ) : null}

        <Field label="Fecha recaudo" error={errors.collectedAt}>
          <input
            name="collectedAt"
            type="date"
            value={form.collectedAt}
            onChange={onChange}
            className={inputClassName}
          />
        </Field>

        <Field label="Evidencia de pago" error={fileError || errors.file}>
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              onChange={onFileChange}
            />

            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-white p-3 text-slate-500 shadow-sm">
                <Paperclip className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">PDF o imagen (Max 5MB)</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                </p>

                <button
                  type="button"
                  onClick={onPickFile}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-800 transition hover:bg-slate-50"
                >
                  <Upload className="h-4 w-4" />
                  Subir archivo
                </button>

                {fileName ? (
                  <p className="mt-3 truncate text-xs font-bold text-blue-700">{fileName}</p>
                ) : null}
              </div>
            </div>
          </div>
        </Field>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99]"
        >
          {saving ? "Guardando..." : isEditing ? "Actualizar registro" : "Guardar registro"}
        </button>
      </form>
    </section>
  );
}

export default CollectionFormCard;

function FinancialItem({ label, value, tone = "slate" }) {
  const valueClassName =
    tone === "rose"
      ? "text-rose-700"
      : tone === "emerald"
        ? "text-emerald-700"
        : "text-slate-900";

  return (
    <div>
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={["mt-1 text-sm font-bold", valueClassName].join(" ")}>{value || "-"}</p>
    </div>
  );
}
