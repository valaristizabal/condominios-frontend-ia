import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

const inputBase =
  "w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition";

function QuickMovementForm({ products, form, onChange, onSubmit, saving, disabled }) {
  const consumableProducts = products.filter((product) => product?.type !== "asset");

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-800">Movimiento rapido</h2>
      <div className="mt-5 space-y-4">
        <select
          name="product_id"
          value={form.product_id}
          onChange={onChange}
          className={inputBase}
          disabled={disabled || saving}
        >
          <option value="">Producto</option>
          {consumableProducts.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>

        <select name="type" value={form.type} onChange={onChange} className={inputBase} disabled={disabled || saving}>
          <option value="">Tipo de movimiento</option>
          <option value="entry">Entrada</option>
          <option value="exit">Salida</option>
        </select>

        <input
          name="quantity"
          type="number"
          min="1"
          value={form.quantity}
          onChange={onChange}
          className={inputBase}
          placeholder="Cantidad"
          disabled={disabled || saving}
        />

        <textarea
          name="observations"
          rows={3}
          value={form.observations}
          onChange={onChange}
          className={`${inputBase} min-h-[90px]`}
          placeholder="Observacion"
          disabled={disabled || saving}
        />

        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || saving || consumableProducts.length === 0}
          className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700 disabled:opacity-70"
        >
          {form.type === "entry" ? (
            <ArrowUpCircle className="mr-2 inline h-5 w-5" />
          ) : (
            <ArrowDownCircle className="mr-2 inline h-5 w-5" />
          )}
          {saving ? "Registrando..." : "Registrar movimiento"}
        </button>
      </div>
    </div>
  );
}

export default QuickMovementForm;
