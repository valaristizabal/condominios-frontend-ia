import { Building, Building2, House, Landmark, Store } from "lucide-react";

function UnitTypeTable({
  rows,
  busy,
  onEdit,
  onToggle,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  loading = false,
  onPageChange,
}) {
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="font-semibold text-slate-700">No hay tipos de unidad registrados</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Comportamiento</th>
            <th className="px-4 py-3">Subunidades</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.id} className="border-t border-slate-100">
              <td className="px-4 py-3 font-semibold text-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{iconByType(item.name)}</span>
                  <span>{item.name || "-"}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-700">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                  {describeBehavior(item)}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-700">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                  {item.apartments_count ?? 0}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    item.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {item.is_active ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                    disabled={busy}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggle(item)}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                    disabled={busy}
                  >
                    {item.is_active ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 ? (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
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

function iconByType(name = "") {
  const normalizedName = String(name).toLowerCase();

  if (normalizedName.includes("apart")) return <Building2 className="h-5 w-5" />;
  if (normalizedName.includes("cas")) return <House className="h-5 w-5" />;
  if (normalizedName.includes("pen")) return <Building className="h-5 w-5" />;
  if (normalizedName.includes("oficina")) return <Landmark className="h-5 w-5" />;
  if (normalizedName.includes("local")) return <Store className="h-5 w-5" />;

  return <Building2 className="h-5 w-5" />;
}

function describeBehavior(item) {
  if (item?.requires_parent) return "Unidad anexa";
  if (item?.allows_residents) return "Unidad principal";
  return "Unidad independiente";
}

export default UnitTypeTable;
