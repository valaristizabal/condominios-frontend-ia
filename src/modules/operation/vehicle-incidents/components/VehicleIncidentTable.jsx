function VehicleIncidentTable({
  incidents = [],
  loading = false,
  resolvingIds = {},
  onResolve,
  activeFilter = "pending",
  onFilterChange,
  onRefresh,
}) {
  return (
    <div className="px-4 max-w-3xl mx-auto mt-6 pb-12">
      <div className="flex items-center justify-between mb-3 gap-3">
        <h2 className="text-base font-extrabold text-gray-900">Novedades reportadas</h2>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
        >
          Actualizar
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <FilterChip
          label="Pendientes"
          active={activeFilter === "pending"}
          onClick={() => onFilterChange?.("pending")}
        />
        <FilterChip
          label="Resueltas"
          active={activeFilter === "resolved"}
          onClick={() => onFilterChange?.("resolved")}
        />
        <FilterChip label="Todas" active={activeFilter === "all"} onClick={() => onFilterChange?.("all")} />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm font-semibold text-gray-500">
          Cargando novedades...
        </div>
      ) : !incidents.length ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm font-semibold text-gray-500">
          No hay novedades para este filtro.
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-gray-700">Placa</th>
                <th className="px-4 py-3 text-left font-bold text-gray-700">Tipo</th>
                <th className="px-4 py-3 text-left font-bold text-gray-700">Unidad</th>
                <th className="px-4 py-3 text-left font-bold text-gray-700">Estado</th>
                <th className="px-4 py-3 text-right font-bold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident) => (
                <tr key={incident.id} className="border-t border-gray-100 align-top">
                  <td className="px-4 py-3 text-gray-800">
                    <p className="font-semibold">{incident.plate || "-"}</p>
                    {incident.observations ? (
                      <p className="mt-1 text-xs text-gray-500 max-w-[220px] truncate">{incident.observations}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-gray-800">{incident.incident_type || "-"}</td>
                  <td className="px-4 py-3 text-gray-800">{incident?.apartment?.number || "-"}</td>
                  <td className="px-4 py-3 text-gray-800">
                    {incident.resolved ? (
                      <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                        Resuelto
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {incident.evidence_path ? (
                        <a
                          href={buildEvidenceUrl(incident.evidence_path)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                        >
                          Ver evidencia
                        </a>
                      ) : null}

                      {!incident.resolved ? (
                        <button
                          type="button"
                          onClick={() => onResolve?.(incident.id)}
                          disabled={Boolean(resolvingIds[incident.id])}
                          className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 disabled:opacity-60"
                        >
                          {resolvingIds[incident.id] ? "Resolviendo..." : "Resolver"}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-bold border transition ${
        active ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}

function buildEvidenceUrl(evidencePath) {
  if (!evidencePath) return "#";

  if (String(evidencePath).startsWith("http")) {
    return evidencePath;
  }

  const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
  const baseUrl = apiUrl.replace(/\/api\/?$/, "");

  return `${baseUrl}/storage/${String(evidencePath).replace(/^\/+/, "")}`;
}

export default VehicleIncidentTable;
