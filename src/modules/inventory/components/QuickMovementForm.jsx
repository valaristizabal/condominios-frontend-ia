import SearchableSelect from "../../../components/common/SearchableSelect";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

const inputBase =
  "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-300";

function QuickMovementForm({ products, form, onChange, onSubmit, saving, disabled }) {
  const consumableProducts = products.filter((product) => product?.type !== "asset");
  const productOptions = consumableProducts.map((product) => ({
    value: String(product.id),
    label: product.name || `Producto #${product.id}`,
  }));
  const movementTypeOptions = [
    { value: "entry", label: "Entrada" },
    { value: "exit", label: "Salida" },
  ];

  return (
    <div className="w-full rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-800">Movimiento rápido</h2>
      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-gray-700">Producto</span>
          <SearchableSelect
          value={form.product_id}
          onChange={(value) => onChange({ target: { name: "product_id", value: String(value) } })}
          options={productOptions}
          placeholder="Selecciona producto"
          searchPlaceholder="Buscar producto..."
          disabled={disabled || saving}
        />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-gray-700">Tipo de movimiento</span>
          <SearchableSelect
          value={form.type}
          onChange={(value) => onChange({ target: { name: "type", value: String(value) } })}
          options={movementTypeOptions}
          placeholder="Selecciona tipo"
          searchPlaceholder="Buscar tipo..."
          disabled={disabled || saving}
        />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-gray-700">Cantidad</span>
          <input
            name="quantity"
            type="number"
            min="1"
            value={form.quantity}
            onChange={onChange}
            className={inputBase}
            placeholder="Ingrese la cantidad"
            disabled={disabled || saving}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-gray-700">Observación</span>
          <textarea
            name="observations"
            rows={3}
            value={form.observations}
            onChange={onChange}
            className={`${inputBase} min-h-[90px] resize-y`}
            placeholder="Notas del movimiento (opcional)"
            disabled={disabled || saving}
          />
        </label>

        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || saving || consumableProducts.length === 0}
          className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700 disabled:opacity-70 sm:mx-auto sm:block sm:w-auto sm:px-6"
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
