const inputClassName =
  "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-200";

function ExpenseFiltersBar({
  filters,
  expenseTypeOptions,
  paymentMethodOptions,
  onChange,
  onClear,
}) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <input
          name="query"
          value={filters.query}
          onChange={onChange}
          placeholder="Buscar"
          className={inputClassName}
        />

        <select
          name="expenseType"
          value={filters.expenseType}
          onChange={onChange}
          className={inputClassName}
        >
          <option value="all">Tipo de gasto</option>
          {expenseTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          name="paymentMethod"
          value={filters.paymentMethod}
          onChange={onChange}
          className={inputClassName}
        >
          <option value="all">Medio de pago</option>
          {paymentMethodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onClear}
          className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          Limpiar filtros
        </button>
      </div>
    </section>
  );
}

export default ExpenseFiltersBar;
