function MovementHistory({ rows }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-800">Historial de Movimientos</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Cantidad</th>
              <th className="px-4 py-3">Usuario</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={`${row.id}-${idx}`} className="border-t border-gray-100">
                <td className="px-4 py-3 text-gray-700">{formatDate(row.movement_date || row.created_at)}</td>
                <td className="px-4 py-3 font-semibold text-gray-800">{row.product_name || "-"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      row.type === "entry" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {row.type === "entry" ? "Entrada" : "Salida"}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-800">{row.quantity}</td>
                <td className="px-4 py-3 text-gray-700">
                  {row.registeredBy?.full_name || row.registered_by?.full_name || row.registered_by?.email || "-"}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm font-semibold text-gray-500">
                  Sin movimientos registrados.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("es-CO");
}

export default MovementHistory;
