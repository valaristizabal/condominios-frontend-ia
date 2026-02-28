function RecentActivityTable({ rows, placeholder }) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        <p className="text-sm font-semibold text-slate-700">Sin actividad reciente</p>
        <p className="mt-1 text-xs text-slate-500">
          {placeholder
            ? "Vista en modo placeholder hasta habilitar endpoint de actividad."
            : "No hay registros para mostrar."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full bg-white text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-3">Módulo</th>
            <th className="px-4 py-3">Evento</th>
            <th className="px-4 py-3">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-100">
              <td className="px-4 py-3 font-semibold text-slate-700">{row.module}</td>
              <td className="px-4 py-3 text-slate-600">{row.event}</td>
              <td className="px-4 py-3 text-slate-500">{row.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RecentActivityTable;

