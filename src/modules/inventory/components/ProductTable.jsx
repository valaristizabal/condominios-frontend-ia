import { Ban, Pencil, Trash } from "lucide-react";

function ProductTable({
  products,
  onEdit,
  onDeactivate,
  saving = false,
  canEdit = true,
  canDeactivate = false,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  loading = false,
  onPageChange,
}) {
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-800">Listado de Productos</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Serial</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Ubicación</th>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Costo unitario</th>
              <th className="px-4 py-3">Valor total</th>
              <th className="px-4 py-3">Estado</th>
              {canEdit ? <th className="px-4 py-3 text-right">Acciones</th> : null}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const status = resolveStockStatus(product);
              return (
                <tr key={product.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-semibold text-gray-800">{product.name || "-"}</td>
                  <td className="px-4 py-3 text-gray-700">{product.serial || "-"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                      {product.type === "asset" ? "Activo fijo" : "Consumible"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{product.category || "-"}</td>
                  <td className="px-4 py-3 text-gray-700">{product.location || "-"}</td>
                  <td className="px-4 py-3 text-gray-700">{product.supplier?.name || "-"}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{product.stock_actual ?? product.stock ?? 0}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{formatCurrency(product.unit_cost)}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{formatCurrency(product.total_value)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}>{status.label}</span>
                  </td>
                  {canEdit ? (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2 text-gray-400">
                        <button
                          type="button"
                          className="rounded-lg bg-gray-100 p-2"
                          disabled={!onEdit || saving}
                          onClick={() => onEdit?.(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" className="rounded-lg bg-gray-100 p-2" disabled>
                          <Trash className="h-4 w-4" />
                        </button>
                        {canDeactivate && product.type === "asset" && !product.dado_de_baja ? (
                          <button
                            type="button"
                            className="rounded-lg bg-red-50 p-2 text-red-700"
                            disabled={saving}
                            onClick={() => onDeactivate?.(product)}
                            title="Dar de baja"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row">
          <p className="text-xs font-semibold text-slate-500">
            Pagina {currentPage} de {totalPages} ({totalItems} registros)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => canGoPrev && onPageChange?.(currentPage - 1)}
              disabled={!canGoPrev || loading}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => canGoNext && onPageChange?.(currentPage + 1)}
              disabled={!canGoNext || loading}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function resolveStockStatus(product) {
  if (product?.type === "asset") {
    if (product?.dado_de_baja) {
      return { label: "INACTIVO", className: "bg-red-100 text-red-700" };
    }
    return { label: product?.is_active ? "Activo" : "Inactivo", className: "bg-slate-100 text-slate-700" };
  }

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

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "-";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "-";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default ProductTable;
