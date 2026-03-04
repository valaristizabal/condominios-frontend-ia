import { Pencil, Trash } from "lucide-react";

function ProductTable({ products }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-800">Listado de Productos</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Stock actual</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const status = resolveStockStatus(product);
              return (
                <tr key={product.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-semibold text-gray-800">{product.name || "-"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                      {product.type === "asset" ? "Activo fijo" : "Consumible"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{product.category || "-"}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{product.stock_actual ?? product.stock ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}>{status.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2 text-gray-400">
                      <button type="button" className="rounded-lg bg-gray-100 p-2" disabled>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" className="rounded-lg bg-gray-100 p-2" disabled>
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function resolveStockStatus(product) {
  const stock = Number(product?.stock_actual ?? product?.stock ?? 0);
  const minimum = Number(product?.minimum_stock ?? 0);
  if (stock <= 0) {
    return { label: "Sin stock", className: "bg-red-100 text-red-700" };
  }
  if (stock <= minimum) {
    return { label: "Bajo", className: "bg-amber-100 text-amber-700" };
  }
  return { label: "Correcto", className: "bg-emerald-100 text-emerald-700" };
}

export default ProductTable;

