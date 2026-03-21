import SearchableSelect from "../../../components/common/SearchableSelect";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

const inputBase =
  "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-300";

function QuickMovementForm({ products, form, onChange, onSubmit, saving, disabled }) {
  const selectedProduct = products.find((product) => String(product.id) === String(form.product_id));
  const isAsset = selectedProduct?.type === "asset";
  const movementTypeOptions = isAsset
    ? [{ value: "exit", label: "Salida" }]
    : [
        { value: "entry", label: "Entrada" },
        { value: "exit", label: "Salida" },
      ];
  const availableProducts = products.filter((product) => !product?.dado_de_baja);
  const productOptions = availableProducts.map((product) => ({
    value: String(product.id),
    label:
      product?.type === "asset"
        ? `${product.name || `Activo #${product.id}`} ${product.serial ? `- Serial ${product.serial}` : ""}`
        : product.name || `Producto #${product.id}`,
  }));
  const isAssetExit = form.type === "exit" && isAsset;

  return (
    <div className="w-full rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-800">Movimiento rápido</h2>
      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-gray-700">Producto o activo</span>
          <SearchableSelect
            value={form.product_id}
            onChange={(value) => onChange({ target: { name: "product_id", value: String(value) } })}
            options={productOptions}
            placeholder="Selecciona producto o activo"
            searchPlaceholder="Buscar producto o activo..."
            disabled={disabled || saving}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-gray-700">Tipo de movimiento</span>
          <SearchableSelect
            value={isAsset ? "exit" : form.type}
            onChange={(value) => onChange({ target: { name: "type", value: String(value) } })}
            options={movementTypeOptions}
            placeholder="Selecciona tipo"
            searchPlaceholder="Buscar tipo..."
            disabled={disabled || saving || isAsset}
          />
        </label>

        {isAsset ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Los activos fijos se manejan de forma individual. Solo puedes registrar una salida por activo.
          </div>
        ) : (
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
        )}

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
          disabled={disabled || saving || availableProducts.length === 0 || (!isAsset && !form.type)}
          className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700 disabled:opacity-70 sm:mx-auto sm:block sm:w-auto sm:px-6"
        >
          {(isAssetExit || form.type === "exit") ? (
            <ArrowDownCircle className="mr-2 inline h-5 w-5" />
          ) : (
            <ArrowUpCircle className="mr-2 inline h-5 w-5" />
          )}
          {saving ? "Registrando..." : "Registrar movimiento"}
        </button>
      </div>
    </div>
  );
}

export default QuickMovementForm;
