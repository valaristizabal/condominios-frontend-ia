import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

const inputBase =
  "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-300";

function QuickMovementForm({ products, form, onChange, onSubmit, saving, disabled }) {
  const consumableProducts = products.filter((product) => product?.type !== "asset");
  const assetProducts = products.filter((product) => product?.type === "asset" && !product?.dado_de_baja && product?.is_active !== false);
  const availableProducts =
    form.type === "entry" ? consumableProducts : form.type === "exit" ? [...consumableProducts, ...assetProducts] : [];
  const selectedProduct = availableProducts.find((product) => String(product.id) === String(form.product_id));
  const isAssetSelection = selectedProduct?.type === "asset";

  return (
    <div className="w-full rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-800">Movimiento rápido</h2>
      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-gray-700">Tipo de movimiento</span>
          <select name="type" value={form.type} onChange={onChange} className={inputBase} disabled={disabled || saving}>
            <option value="">Seleccione el tipo</option>
            <option value="entry">Entrada</option>
            <option value="exit">Salida</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-gray-700">
            {form.type === "exit" ? "Producto o activo" : "Producto"}
          </span>
          <select
            name="product_id"
            value={form.product_id}
            onChange={onChange}
            className={inputBase}
            disabled={disabled || saving || !form.type}
          >
            <option value="">{form.type === "exit" ? "Seleccione producto o activo" : "Seleccione un producto"}</option>
            {availableProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.type === "asset"
                  ? `${product.name}${product.serial ? ` N° Serial ${product.serial}` : ""}`
                  : product.name}
              </option>
            ))}
          </select>
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
            placeholder={isAssetSelection ? "Cantidad fija para activos" : "Ingrese la cantidad"}
            disabled={disabled || saving || isAssetSelection}
          />
        </label>

        {isAssetSelection ? (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700">
            La salida de activos fijos se registra individualmente. Se usará cantidad 1.
          </div>
        ) : null}

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
          disabled={disabled || saving || availableProducts.length === 0}
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
