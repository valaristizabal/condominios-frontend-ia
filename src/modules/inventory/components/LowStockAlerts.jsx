import { AlertTriangle } from "lucide-react";

function LowStockAlerts({ products }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-800">Alertas de Reposición</h2>
      <div className="mt-4 space-y-3">
        {products.map((product) => (
          <div key={product.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-amber-900">{product.name}</p>
                <p className="mt-1 text-xs font-semibold text-amber-700">
                  Stock: {product.stock_actual ?? product.stock ?? 0} / Mínimo: {product.minimum_stock ?? 0}
                </p>
              </div>
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <button
              type="button"
              className="mt-3 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-700"
            >
              Comprar
            </button>
          </div>
        ))}
        {products.length === 0 ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            No hay productos en nivel crítico.
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default LowStockAlerts;

