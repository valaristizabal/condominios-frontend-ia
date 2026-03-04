function EmergencyTypeTable({ rows, busy, onEdit, onToggle }) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="font-semibold text-slate-700">No hay tipos de emergencia registrados</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Nivel</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.id} className="border-t border-slate-100">
              <td className="px-4 py-3 font-semibold text-slate-800">{item.name || "-"}</td>
              <td className="px-4 py-3 text-slate-700">
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${levelBadgeClass(item.level)}`}>
                  {item.level || "-"}
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
    </div>
  );
}

function levelBadgeClass(level = "") {
  const normalizedLevel = String(level).toUpperCase();

  if (normalizedLevel === "BAJO") return "bg-emerald-100 text-emerald-700";
  if (normalizedLevel === "MEDIO") return "bg-amber-100 text-amber-700";
  if (normalizedLevel === "ALTO") return "bg-orange-100 text-orange-700";
  if (normalizedLevel === "CRITICO") return "bg-red-100 text-red-700";

  return "bg-slate-100 text-slate-700";
}

export default EmergencyTypeTable;
