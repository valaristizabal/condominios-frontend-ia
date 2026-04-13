import { useEffect, useMemo, useState } from "react";
import { ClipboardList, MapPin, User } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveCondominium } from "../../../context/useActiveCondominium";
import apiClient from "../../../services/apiClient";
import BackButton from "../../../components/common/BackButton";
import SearchableSelect from "../../../components/common/SearchableSelect";
import { useNotification } from "../../../hooks/useNotification";
import HybridAttendanceButton from "../components/HybridAttendanceButton";
import {
  cancelEmployeeEntry,
  checkoutEmployeeEntry,
  createEmployeeEntry,
  getEmployeeEntries,
} from "../service/employeeEntry.service";

const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>
);

const SectionTitle = ({ title, subtitle }) => (
  <div>
    {subtitle ? <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{subtitle}</p> : null}
    <h1 className="mt-1 text-2xl font-bold text-slate-900">{title}</h1>
  </div>
);

function Segmented({ value, onChange }) {
  const items = [
    { key: "todos", label: "TODOS" },
    { key: "planta", label: "PLANTA" },
    { key: "contratista", label: "CONTRATISTAS" },
  ];

  return (
    <div className="rounded-2xl bg-slate-100 p-2">
      <div className="grid grid-cols-3 gap-2 text-xs font-semibold sm:text-sm">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={[
              "rounded-xl py-2 transition",
              value === item.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:bg-white/60",
            ].join(" ")}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RowItem({ name, role, place, time, status = "active" }) {
  const isActive = status === "active";
  const isCancelled = status === "cancelled";
  const statusLabel = isActive ? time : isCancelled ? "Cancelado" : time;

  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
          <User className="h-4 w-4 text-slate-500" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-slate-900">{name}</p>
          <p className="text-[11px] font-semibold text-slate-500">{formatRowMeta(role, place)}</p>
        </div>
      </div>
      <span
        className={[
          "rounded-xl px-3 py-1 text-xs font-extrabold",
          isActive
            ? "bg-emerald-50 text-emerald-700"
            : isCancelled
              ? "bg-rose-50 text-rose-700"
              : "bg-slate-200 text-slate-700",
        ].join(" ")}
      >
        {statusLabel}
      </span>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function extractErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

function resolveEntryName(entry) {
  return (
    entry?.operative?.user?.full_name ||
    entry?.operative?.full_name ||
    entry?.user?.full_name ||
    entry?.full_name ||
    "Operario"
  );
}

function resolveEntryRole(entry) {
  return (
    entry?.operative?.position ||
    entry?.position ||
    entry?.role ||
    entry?.operative?.role ||
    "-"
  );
}

function resolveEntryPlace(entry) {
  return (
    entry?.operative?.contract_type ||
    entry?.contract_type ||
    entry?.place ||
    entry?.operative?.place ||
    ""
  );
}

function formatRowMeta(role, place) {
  const parts = [role, place]
    .map((value) => String(value || "").trim())
    .filter((value) => value && value !== "-");

  return parts.length ? parts.join(" - ") : "Sin detalle adicional";
}

export default function ControlIngresoPage() {
  const { activeCondominiumId } = useActiveCondominium();
  const queryClient = useQueryClient();
  const { success, error: notifyError, warning } = useNotification();

  const [selectedId, setSelectedId] = useState("");
  const [observations, setObservations] = useState("");
  const [activeTab, setActiveTab] = useState("turno");
  const [segment, setSegment] = useState("todos");
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  const requestConfig = useMemo(
    () =>
      activeCondominiumId
        ? {
            headers: {
              "X-Active-Condominium-Id": String(activeCondominiumId),
            },
          }
        : undefined,
    [activeCondominiumId]
  );

  const canQuery = Boolean(activeCondominiumId);

  const operativesQuery = useQuery({
    queryKey: ["control-ingreso", "operatives", activeCondominiumId],
    enabled: canQuery,
    queryFn: async () => {
      const response = await apiClient.get("/employee-entries/bootstrap-data", requestConfig);
      const payload = response?.data || {};
      return Array.isArray(payload.operatives) ? payload.operatives : [];
    },
  });

  const entriesQuery = useQuery({
    queryKey: ["employee-entries", activeCondominiumId, activePage, historyPage],
    enabled: canQuery,
    queryFn: () =>
      getEmployeeEntries(requestConfig, {
        active_page: activePage,
        history_page: historyPage,
      }),
  });

  const allOperatives = operativesQuery.data || [];
  const activeEntries = Array.isArray(entriesQuery.data?.active_entries?.data) ? entriesQuery.data.active_entries.data : [];
  const historyEntries = Array.isArray(entriesQuery.data?.history_entries?.data)
    ? entriesQuery.data.history_entries.data
    : [];
  const activeEntriesPagination = {
    currentPage: Number(entriesQuery.data?.active_entries?.current_page || activePage || 1),
    lastPage: Number(entriesQuery.data?.active_entries?.last_page || 1),
    total: Number(entriesQuery.data?.active_entries?.total || 0),
  };
  const historyEntriesPagination = {
    currentPage: Number(entriesQuery.data?.history_entries?.current_page || historyPage || 1),
    lastPage: Number(entriesQuery.data?.history_entries?.last_page || 1),
    total: Number(entriesQuery.data?.history_entries?.total || 0),
  };

  const filteredOperatives = useMemo(() => {
    if (segment === "todos") return allOperatives;
    return allOperatives.filter((item) => String(item?.contract_type || "").toLowerCase() === segment);
  }, [allOperatives, segment]);

  useEffect(() => {
    setSelectedId((prev) => {
      if (!prev) return "";
      const hasSelected = filteredOperatives.some((item) => String(item.id) === String(prev));
      return hasSelected ? prev : "";
    });
  }, [filteredOperatives]);

  const selectedOperative = useMemo(
    () => filteredOperatives.find((item) => String(item.id) === String(selectedId)),
    [filteredOperatives, selectedId]
  );

  const operativeOptions = useMemo(
    () =>
      filteredOperatives.map((operative) => ({
        value: String(operative.id),
        label: operative.user?.full_name || "Operario",
      })),
    [filteredOperatives]
  );

  const activeEntryForSelected = useMemo(
    () => activeEntries.find((entry) => String(entry?.operative_id) === String(selectedId)),
    [activeEntries, selectedId]
  );

  const isPresent = Boolean(activeEntryForSelected);

  const mutationOptions = {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["employee-entries", activeCondominiumId] });
    },
    onError: (requestError) => {
      setError(extractErrorMessage(requestError, "No fue posible procesar el registro."));
    },
  };

  const createEntryMutation = useMutation({
    mutationFn: (payload) => createEmployeeEntry(payload, requestConfig),
    ...mutationOptions,
  });

  const checkoutMutation = useMutation({
    mutationFn: (entryId) => checkoutEmployeeEntry(entryId, requestConfig),
    ...mutationOptions,
  });

  const cancelMutation = useMutation({
    mutationFn: (entryId) => cancelEmployeeEntry(entryId, requestConfig),
    ...mutationOptions,
  });

  const saving = createEntryMutation.isPending || checkoutMutation.isPending || cancelMutation.isPending;

  useEffect(() => {
    const queryError = operativesQuery.error || entriesQuery.error;
    if (!queryError) return;
    setError(extractErrorMessage(queryError, "No se pudo cargar el control de ingreso."));
  }, [operativesQuery.error, entriesQuery.error]);

  useEffect(() => {
    setActivePage(1);
    setHistoryPage(1);
  }, [activeCondominiumId]);

  const handleToggleAttendance = async () => {
    if (saving || !activeCondominiumId) return;
    if (!selectedOperative?.id) {
      warning("Selecciona un empleado para registrar la accion.");
      return;
    }

    setError("");

    try {
      if (isPresent && activeEntryForSelected?.id) {
        await checkoutMutation.mutateAsync(activeEntryForSelected.id);
        success("Salida registrada correctamente.");
      } else {
        await createEntryMutation.mutateAsync({
          operative_id: selectedOperative.id,
          observations: observations.trim() || null,
        });
        setObservations("");
        setSelectedId("");
        success("Ingreso registrado correctamente.");
      }
    } catch (requestError) {
      notifyError(extractErrorMessage(requestError, "No fue posible procesar el registro."));
    }
  };

  const handleCancelEntry = async () => {
    if (saving || !activeCondominiumId) return;
    if (!isPresent || !activeEntryForSelected?.id) {
      warning("No hay un ingreso activo para cancelar.");
      return;
    }

    setError("");
    try {
      await cancelMutation.mutateAsync(activeEntryForSelected.id);
      success("Ingreso cancelado correctamente.");
    } catch (requestError) {
      notifyError(extractErrorMessage(requestError, "No fue posible procesar el registro."));
    }
  };

  const loading = operativesQuery.isLoading || entriesQuery.isLoading;

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <BackButton variant="dashboard" className="mb-3" />
          <SectionTitle title="Ingreso de personal" />
        </div>

        {!activeCondominiumId ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No hay propiedad activa para gestionar ingresos de personal.
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-6">
          <div className="space-y-6">
            <Segmented value={segment} onChange={setSegment} />

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Seleccionar empleado</p>

              <Card className="p-3">
                <SearchableSelect
                  value={selectedId}
                  onChange={(value) => setSelectedId(String(value))}
                  options={operativeOptions}
                  placeholder={filteredOperatives.length ? "Seleccione empleado" : "Sin operarios activos"}
                  searchPlaceholder="Buscar empleado..."
                  disabled={!filteredOperatives.length || loading}
                />
                {selectedOperative ? (
                  <p className="mt-3 text-xs text-slate-500">
                    {[selectedOperative.position, selectedOperative.contract_type].filter(Boolean).join(" - ") || "Operario activo"}
                  </p>
                ) : null}
              </Card>
            </div>

            <Card className="rounded-3xl p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                  <User className="h-7 w-7 text-slate-500" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
                      {selectedOperative?.contract_type?.toUpperCase() || "OPERARIO"}
                    </span>
                  </div>

                  <h2 className="mt-2 text-lg font-extrabold leading-tight text-slate-900">
                    {selectedOperative?.user?.full_name || "Seleccione un empleado"}
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-slate-600">{selectedOperative?.position || "-"}</p>

                  <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <MapPin size={14} className="text-blue-500" />
                    <span>{selectedOperative?.user?.email || "Sin correo"}</span>
                  </div>
                </div>
              </div>

              <div className="my-4 h-px bg-slate-100" />

              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Observaciones</p>
              <textarea
                value={observations}
                onChange={(event) => setObservations(event.target.value)}
                rows={3}
                placeholder="Observaciones del ingreso (opcional)"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />

              <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-xs font-bold uppercase text-slate-500">Estado</span>
                <span
                  className={[
                    "rounded-full px-3 py-1 text-xs font-extrabold",
                    isPresent ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700",
                  ].join(" ")}
                >
                  {isPresent ? "DENTRO" : "FUERA"}
                </span>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-3xl p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Registro</p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <HybridAttendanceButton isPresent={isPresent} disabled={saving || !selectedOperative} onToggle={handleToggleAttendance} />
                <button
                  type="button"
                  disabled={!isPresent || saving}
                  onClick={handleCancelEntry}
                  className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-extrabold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  CANCELAR INGRESO
                </button>
              </div>
            </Card>

            <Card className="rounded-3xl p-3">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("turno")}
                  className={[
                    "rounded-xl py-2 text-xs font-extrabold uppercase tracking-wide transition",
                    activeTab === "turno" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:bg-white/60",
                  ].join(" ")}
                >
                  Personal en turno
                  <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] text-slate-700">
                    {activeEntriesPagination.total}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("historial")}
                  className={[
                    "rounded-xl py-2 text-xs font-extrabold uppercase tracking-wide transition",
                    activeTab === "historial" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:bg-white/60",
                  ].join(" ")}
                >
                  Historial salidas
                </button>
              </div>

              <div className="mt-3">
                {loading ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    Cargando datos...
                  </div>
                ) : activeTab === "turno" ? (
                  <div className="space-y-3 p-2">
                    {activeEntries.length ? (
                      <>
                        {activeEntries.map((entry) => (
                          <RowItem
                            key={entry.id}
                            name={resolveEntryName(entry)}
                            role={resolveEntryRole(entry)}
                            place={resolveEntryPlace(entry)}
                            time={formatDateTime(entry?.check_in_at)}
                            status="active"
                          />
                        ))}
                        {activeEntriesPagination.lastPage > 1 ? (
                          <div className="mt-2 flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 sm:flex-row">
                            <p className="text-xs font-semibold text-slate-500">
                              Página {activeEntriesPagination.currentPage} de {activeEntriesPagination.lastPage}
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setActivePage((prev) => Math.max(1, prev - 1))}
                                disabled={loading || activeEntriesPagination.currentPage <= 1}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Anterior
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setActivePage((prev) =>
                                    Math.min(activeEntriesPagination.lastPage, prev + 1)
                                  )
                                }
                                disabled={loading || activeEntriesPagination.currentPage >= activeEntriesPagination.lastPage}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Siguiente
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                        No hay personal en turno.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 p-2">
                    {historyEntries.length ? (
                      <>
                        {historyEntries.map((entry) => (
                          <RowItem
                            key={entry.id}
                            name={resolveEntryName(entry)}
                            role={resolveEntryRole(entry)}
                            place={resolveEntryPlace(entry)}
                            time={formatDateTime(entry?.check_out_at || entry?.updated_at)}
                            status={entry?.status === "cancelled" ? "cancelled" : "completed"}
                          />
                        ))}
                        {historyEntriesPagination.lastPage > 1 ? (
                          <div className="mt-2 flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 sm:flex-row">
                            <p className="text-xs font-semibold text-slate-500">
                              Pagina {historyEntriesPagination.currentPage} de {historyEntriesPagination.lastPage}
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                                disabled={loading || historyEntriesPagination.currentPage <= 1}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Anterior
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setHistoryPage((prev) =>
                                    Math.min(historyEntriesPagination.lastPage, prev + 1)
                                  )
                                }
                                disabled={loading || historyEntriesPagination.currentPage >= historyEntriesPagination.lastPage}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Siguiente
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                        Aún no hay historial de salidas.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-2 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <ClipboardList className="h-3.5 w-3.5" />
                Resumen de asistencia de la propiedad activa
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
