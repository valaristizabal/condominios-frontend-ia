import { useEffect, useMemo, useState } from "react";
import { ClipboardList, MapPin, User } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveCondominium } from "../../../context/useActiveCondominium";
import apiClient from "../../../services/apiClient";
import BackButton from "../../../components/common/BackButton";
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

  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
          <User className="h-4 w-4 text-slate-500" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-slate-900">{name}</p>
          <p className="text-[11px] font-semibold text-slate-500">
            {role} - {place}
          </p>
        </div>
      </div>
      <span
        className={[
          "rounded-xl px-3 py-1 text-xs font-extrabold",
          isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-700",
        ].join(" ")}
      >
        {time}
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

export default function ControlIngresoPage() {
  const { activeCondominiumId } = useActiveCondominium();
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState("");
  const [observations, setObservations] = useState("");
  const [activeTab, setActiveTab] = useState("turno");
  const [segment, setSegment] = useState("todos");
  const [error, setError] = useState("");

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
      const response = await apiClient.get("/operatives", requestConfig);
      const all = Array.isArray(response.data) ? response.data : [];
      return all.filter((item) => item?.is_active);
    },
  });

  const entriesQuery = useQuery({
    queryKey: ["employee-entries", activeCondominiumId],
    enabled: canQuery,
    queryFn: () => getEmployeeEntries(requestConfig),
  });

  const allOperatives = operativesQuery.data || [];
  const activeEntries = Array.isArray(entriesQuery.data?.active_entries) ? entriesQuery.data.active_entries : [];
  const historyEntries = Array.isArray(entriesQuery.data?.history_entries) ? entriesQuery.data.history_entries : [];

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

  const handleToggleAttendance = async () => {
    if (!selectedOperative?.id || saving || !activeCondominiumId) return;

    setError("");

    if (isPresent && activeEntryForSelected?.id) {
      await checkoutMutation.mutateAsync(activeEntryForSelected.id);
    } else {
      await createEntryMutation.mutateAsync({
        operative_id: selectedOperative.id,
        observations: observations.trim() || null,
      });
      setObservations("");
    }
  };

  const handleCancelEntry = async () => {
    if (!isPresent || !activeEntryForSelected?.id || saving || !activeCondominiumId) return;

    setError("");
    await cancelMutation.mutateAsync(activeEntryForSelected.id);
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
                <div className="flex items-center gap-3">
                  <select
                    className="w-full appearance-none bg-transparent text-sm font-bold text-slate-900 outline-none"
                    value={selectedId}
                    onChange={(event) => setSelectedId(event.target.value)}
                    disabled={!filteredOperatives.length || loading}
                  >
                    <option value="">{filteredOperatives.length ? "Seleccione empleado" : "Sin operarios activos"}</option>
                    {filteredOperatives.map((operative) => (
                      <option key={operative.id} value={operative.id}>
                        {operative.user?.full_name || "Operario"}
                      </option>
                    ))}
                  </select>
                  <div className="text-slate-400">▼</div>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedOperative?.position || "-"} - {selectedOperative?.contract_type || "-"}
                </p>
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
                    <span className="text-xs font-semibold text-slate-400">ID: {selectedOperative?.id || "-"}</span>
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
                  {isPresent ? "INSIDE" : "FUERA"}
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
                    {activeEntries.length}
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
                      activeEntries.map((entry) => (
                        <RowItem
                          key={entry.id}
                          name={entry?.operative?.user?.full_name || "Operario"}
                          role={entry?.operative?.position || "-"}
                          place={entry?.operative?.contract_type || "-"}
                          time={formatDateTime(entry?.check_in_at)}
                          status="active"
                        />
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                        No hay personal en turno.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 p-2">
                    {historyEntries.length ? (
                      historyEntries.map((entry) => (
                        <RowItem
                          key={entry.id}
                          name={entry?.operative?.user?.full_name || "Operario"}
                          role={entry?.operative?.position || "-"}
                          place={entry?.operative?.contract_type || "-"}
                          time={formatDateTime(entry?.check_out_at)}
                          status="completed"
                        />
                      ))
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
