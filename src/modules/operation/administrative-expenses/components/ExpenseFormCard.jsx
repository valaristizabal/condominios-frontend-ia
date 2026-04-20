import { CalendarDays, Paperclip, Upload } from "lucide-react";

const inputClassName =
  "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-200";
const textareaClassName =
  "min-h-[112px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-200";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function ExpenseFormCard({
  form,
  expenseTypeOptions,
  paymentMethodOptions,
  fileName,
  saving = false,
  fileInputRef,
  onChange,
  onPickFile,
  onFileChange,
  onReset,
  onSubmit,
}) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Registrar gasto</h2>
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
        <Field label="Fecha de registro">
          <div className="relative">
            <input
              name="registeredAt"
              type="date"
              value={form.registeredAt}
              onChange={onChange}
              className={`${inputClassName} pr-12 [&::-webkit-calendar-picker-indicator]:opacity-0`}
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
              <CalendarDays className="h-4 w-4" />
            </span>
          </div>
        </Field>

        <Field label="Tipo de gasto">
          <select
            name="expenseType"
            value={form.expenseType}
            onChange={onChange}
            className={inputClassName}
          >
            <option value="">Seleccionar tipo...</option>
            {expenseTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Valor">
          <input
            name="amount"
            type="number"
            min="0"
            step="1000"
            value={form.amount}
            onChange={onChange}
            placeholder="Ej: 350000"
            className={inputClassName}
          />
        </Field>

        <Field label="Medio de pago">
          <select
            name="paymentMethod"
            value={form.paymentMethod}
            onChange={onChange}
            className={inputClassName}
          >
            <option value="">Seleccionar medio...</option>
            {paymentMethodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Responsable de registro">
          <input
            name="registeredBy"
            value={form.registeredBy}
            onChange={onChange}
            placeholder="Nombre del responsable"
            className={inputClassName}
          />
        </Field>

        <Field label="Observaciones">
          <textarea
            name="observations"
            value={form.observations}
            onChange={onChange}
            placeholder="Agregar observaciones del gasto"
            className={textareaClassName}
          />
        </Field>

        <Field label="Evidencia de pago">
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
          {saving ? "Guardando..." : "Guardar gasto"}
        </button>
      </form>
    </section>
  );
}

export default ExpenseFormCard;
