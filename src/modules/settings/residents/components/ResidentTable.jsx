function ResidentTable({
  rows,
  busy,
  onEdit,
  onChangePassword,
  canChangePassword = false,
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
        <p className="font-semibold text-slate-700">No hay residentes registrados</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Tipo inmueble</th>
            <th className="px-4 py-3">Inmueble</th>
            <th className="px-4 py-3">Tipo residente</th>
            <th className="px-4 py-3">Administracion</th>
            <th className="px-4 py-3">Vence</th>
            <th className="px-4 py-3">Propietario (ref)</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.id} className="border-t border-slate-100">
              <td className="px-4 py-3">
                <p className="font-semibold text-slate-800">{item.user?.full_name || item.full_name || "-"}</p>
                <p className="text-xs text-slate-500">{item.user?.document_number || "-"}</p>
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                  {resolveUnitTypeName(item)}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600">
                <p className="font-semibold text-slate-800">{item.apartment?.number || item.apartment_number || "-"}</p>
                <p className="text-xs text-slate-500">
                  {"Torre: " + (item.apartment?.tower || "Sin torre") + " | Piso: " + (item.apartment?.floor ?? "-")}
                </p>
                {Array.isArray(item.apartment?.children) && item.apartment.children.length > 0 ? (
                  <p className="mt-1 text-xs text-blue-600">
                    {item.apartment.children.map((child) => {
                      const typeName = child?.unit_type?.name || child?.unitType?.name || "Unidad";
                      return `${typeName} ${child?.number || "-"}`;
                    }).join(" | ")}
                  </p>
                ) : null}
              </td>
              <td className="px-4 py-3 text-slate-600">{formatResidentType(item.type)}</td>
              <td className="px-4 py-3 text-slate-600">{formatCurrency(item.administration_fee)}</td>
              <td className="px-4 py-3 text-slate-600">{formatDueDay(item.administration_due_day)}</td>
              <td className="px-4 py-3 text-slate-600">
                {item.property_owner_full_name || item.property_owner_name || "-"}
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
                  {canChangePassword ? (
                    <button
                      type="button"
                      onClick={() => onChangePassword?.(item)}
                      disabled={busy}
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                    >
                      Cambiar contraseña
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    disabled={busy}
                    className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                  >
                    Editar
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

function resolveUnitTypeName(resident) {
  return (
    resident?.apartment?.unit_type?.name ||
    resident?.apartment?.unitType?.name ||
    "Sin tipo"
  );
}

function formatResidentType(type) {
  if (type === "propietario") return "Propietario";
  if (type === "arrendatario") return "Arrendatario";
  return type || "-";
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

function formatDueDay(value) {
  if (value === null || value === undefined || value === "") return "-";
  const day = Number(value);
  if (!Number.isInteger(day) || day < 1 || day > 31) return "-";
  return `Dia ${day}`;
}

export default ResidentTable;
