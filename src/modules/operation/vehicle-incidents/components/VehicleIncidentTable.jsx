function VehicleIncidentTable({
  incidents = [],
  loading = false,
  resolvingIds = {},
  onResolve,
  activeFilter = "pending",
  onFilterChange,
  onRefresh,
}) {
  const visibleIncidents =
    activeFilter === "all"
      ? [...incidents].sort((a, b) => Number(Boolean(a?.resolved)) - Number(Boolean(b?.resolved)))
      : incidents;

  return (
    <div className="space-y-5 rounded-3xl border border-slate-200 bg-[#f3f4f6] p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Control en tiempo real</p>
          <h2 className="mt-1 text-[34px] leading-none font-bold text-slate-900 md:text-[36px]">Novedades reportadas</h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-full border border-slate-300 bg-[#f6f7f9] px-5 py-2 text-sm font-extrabold text-slate-700 transition hover:bg-white"
        >
          Actualizar
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
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
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-500">
          Cargando novedades...
        </div>
      ) : !incidents.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-500">
          No hay novedades para este filtro.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-300 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[#f4f4f5]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-600">Placa</th>
                <th className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-600">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-600">Unidad</th>
                <th className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-600">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-extrabold uppercase tracking-wide text-slate-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibleIncidents.map((incident) => (
                <tr key={incident.id} className="align-top border-t border-slate-200">
                  <td className="px-4 py-3 text-slate-800">
                    <p className="font-semibold">{incident.plate || "-"}</p>
                    {incident.observations ? (
                      <p className="mt-1 max-w-[220px] truncate text-xs text-slate-500">{incident.observations}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{formatIncidentType(incident.incident_type)}</td>
                  <td className="px-4 py-3 text-slate-700">{incident?.apartment?.number || "-"}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {incident.resolved ? (
                      <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-700">
                        Resuelto
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-700">
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
                          className="rounded-2xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50"
                        >
                          Ver evidencia
                        </a>
                      ) : null}

                      {!incident.resolved ? (
                        <button
                          type="button"
                          onClick={() => onResolve?.(incident.id)}
                          disabled={Boolean(resolvingIds[incident.id])}
                          className="rounded-2xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
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
      className={`rounded-full border px-4 py-1.5 text-sm font-extrabold transition ${
        active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-[#f6f7f9] text-slate-700 hover:bg-white"
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

function formatIncidentType(value) {
  const normalized = String(value || "").trim().toLowerCase();

  if (!normalized) return "-";
  if (normalized === "unauthorized" || normalized === "robo") return "Robo";
  if (normalized === "damage" || normalized === "danio") return "Daño";
  if (normalized === "other" || normalized === "otro") return "Otro";

  return String(value);
}

export default VehicleIncidentTable;
