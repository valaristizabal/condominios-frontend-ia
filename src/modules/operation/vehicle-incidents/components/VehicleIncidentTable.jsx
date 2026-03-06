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
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Control en tiempo real</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">Novedades reportadas</h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
        >
          Actualizar
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <FilterChip label="Pendientes" active={activeFilter === "pending"} onClick={() => onFilterChange?.("pending")} />
        <FilterChip label="Resueltas" active={activeFilter === "resolved"} onClick={() => onFilterChange?.("resolved")} />
        <FilterChip label="Todas" active={activeFilter === "all"} onClick={() => onFilterChange?.("all")} />
      </div>

      {loading ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
          Cargando novedades...
        </div>
      ) : !incidents.length ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
          No hay novedades para este filtro.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Placa</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Unidad</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibleIncidents.map((incident) => (
                <tr key={incident.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-3 text-slate-800">
                    <p className="font-semibold">{incident.plate || "-"}</p>
                    {incident.observations ? (
                      <p className="mt-1 max-w-[240px] truncate text-xs text-slate-500">{incident.observations}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{formatIncidentType(incident.incident_type)}</td>
                  <td className="px-4 py-3 text-slate-700">{incident?.apartment?.number || "-"}</td>
                  <td className="px-4 py-3">
                    {incident.resolved ? (
                      <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                        Resuelto
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {incident.evidence_path ? (
                        <a
                          href={buildEvidenceUrl(incident.evidence_path)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          Ver evidencia
                        </a>
                      ) : null}

                      {!incident.resolved ? (
                        <button
                          type="button"
                          onClick={() => onResolve?.(incident.id)}
                          disabled={Boolean(resolvingIds[incident.id])}
                          className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
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
    </section>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1.5 text-xs font-bold transition",
        active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function buildEvidenceUrl(evidencePath) {
  if (!evidencePath) return "#";
  if (String(evidencePath).startsWith("http")) return evidencePath;

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
