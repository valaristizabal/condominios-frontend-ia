import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import BackButton from "../../components/common/BackButton";
import ImageUploadPrompt from "../../components/common/ImageUploadPrompt";
import ImageViewer from "../../components/common/ImageViewer";
import SearchableSelect from "../../components/common/SearchableSelect";
import { useNotification } from "../../hooks/useNotification";
import { useCleaningRecords } from "./useCleaningRecords";

const inputBase =
  "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-200";

const Card = ({ children, className = "" }) => (
  <div className={["rounded-3xl border border-slate-200 bg-white p-6 shadow-sm", className].join(" ")}>{children}</div>
);

function CleaningRecordsPage() {
  const { success, error: notifyError, warning } = useNotification();
  const {
    hasTenantContext,
    tenantCacheKey,
    getInitialData,
    getChecklistItems,
    createCleaningRecord,
    toggleChecklistItem,
    completeCleaningRecord,
  } = useCleaningRecords();

  const queryClient = useQueryClient();

  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [selectedOperativeId, setSelectedOperativeId] = useState("");
  const [observationText, setObservationText] = useState("");
  const [evidenceItems, setEvidenceItems] = useState([]);
  const [activeEvidenceImage, setActiveEvidenceImage] = useState({ imageUrl: "", title: "" });
  const [error, setError] = useState("");

  const initialDataQuery = useQuery({
    queryKey: ["cleaning", "initial", tenantCacheKey],
    enabled: hasTenantContext,
    queryFn: getInitialData,
  });

  const areas = initialDataQuery.data?.areas || [];
  const operatives = initialDataQuery.data?.operatives || [];
  const records = initialDataQuery.data?.records || [];
  const areaOptions = useMemo(
    () => areas.map((area) => ({ value: String(area.id), label: area.name || `Area #${area.id}` })),
    [areas]
  );
  const operativeOptions = useMemo(
    () =>
      operatives.map((operative) => ({
        value: String(operative.id),
        label: operative.user?.full_name || "Operario",
      })),
    [operatives]
  );
  const areaNameById = useMemo(() => {
    const map = new Map();
    areas.forEach((area) => {
      map.set(String(area?.id), String(area?.name || ""));
    });
    return map;
  }, [areas]);

  useEffect(() => {
    if (!records.length) {
      setSelectedRecordId(null);
      return;
    }

    if (selectedRecordId && records.some((record) => record.id === selectedRecordId)) {
      return;
    }

    const todayRecord = records.find((record) => isTodayCleaningRecord(record));
    setSelectedRecordId(todayRecord?.id || null);
  }, [records, selectedRecordId]);

  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedRecordId) || null,
    [records, selectedRecordId]
  );

  useEffect(() => {
    if (!selectedRecord) {
      setObservationText("");
      clearEvidenceItems(setEvidenceItems);
      return;
    }

    setObservationText(selectedRecord?.observations || "");
  }, [selectedRecordId, selectedRecord]);

  const checklistQuery = useQuery({
    queryKey: ["cleaning", "checklist", tenantCacheKey, selectedRecordId],
    enabled: hasTenantContext && Boolean(selectedRecordId),
    queryFn: () => getChecklistItems(selectedRecordId),
  });

  const items = checklistQuery.data || [];

  const createRecordMutation = useMutation({
    mutationFn: createCleaningRecord,
    onSuccess: async (newRecord) => {
      await queryClient.invalidateQueries({ queryKey: ["cleaning", "initial", tenantCacheKey] });
      setSelectedRecordId(newRecord?.id || null);
      setSelectedAreaId("");
      setSelectedOperativeId("");
      setObservationText("");
      clearEvidenceItems(setEvidenceItems);
      setError("");
      success("Limpieza creada correctamente.");
    },
    onError: (err) => {
      const message = normalizeApiError(err, "No fue posible crear la limpieza.");
      setError(message);
      notifyError(message);
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: ({ recordId, itemId, currentCompleted }) =>
      toggleChecklistItem(recordId, itemId, currentCompleted),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cleaning", "checklist", tenantCacheKey, selectedRecordId] });
      setError("");
      success("Tarea de limpieza actualizada correctamente.");
    },
    onError: (err) => {
      const message = normalizeApiError(err, "No fue posible actualizar la tarea.");
      setError(message);
      notifyError(message);
    },
  });

  const completeRecordMutation = useMutation({
    mutationFn: ({ recordId, observations, evidences }) =>
      completeCleaningRecord(recordId, { observations, evidences }),
    onSuccess: async (updated) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cleaning", "initial", tenantCacheKey] }),
        queryClient.invalidateQueries({ queryKey: ["cleaning", "checklist", tenantCacheKey, selectedRecordId] }),
      ]);
      if (updated?.id) setSelectedRecordId(updated.id);
      clearEvidenceItems(setEvidenceItems);
      setError("");
      success("Limpieza finalizada correctamente.");
    },
    onError: (err) => {
      const message = normalizeApiError(err, "No fue posible finalizar la limpieza.");
      setError(message);
      notifyError(message);
    },
  });

  useEffect(() => {
    const queryError = initialDataQuery.error || checklistQuery.error;
    if (!queryError) return;
    setError(normalizeApiError(queryError, "No fue posible cargar el módulo de aseo."));
  }, [initialDataQuery.error, checklistQuery.error]);

  const createRecord = async () => {
    if (!selectedAreaId || !selectedOperativeId) {
      warning("Selecciona area y operario para crear la limpieza.");
      return;
    }

    await createRecordMutation.mutateAsync({
      cleaning_area_id: Number(selectedAreaId),
      operative_id: Number(selectedOperativeId),
      cleaning_date: new Date().toISOString().slice(0, 10),
    });
  };

  const toggleTask = async (item) => {
    if (!selectedRecordId) return;
    await toggleTaskMutation.mutateAsync({
      recordId: selectedRecordId,
      itemId: item.id,
      currentCompleted: item.completed,
    });
  };

  const handleFinish = async () => {
    if (!selectedRecordId) return;

    if (!evidenceItems.length) {
      warning("Debes adjuntar al menos una evidencia para finalizar la limpieza.");
      return;
    }

    await completeRecordMutation.mutateAsync({
      recordId: selectedRecordId,
      observations: String(observationText || "").trim(),
      evidences: evidenceItems.map((item) => item.file).filter(Boolean),
    });
  };

  const onEvidenceChange = (event) => {
    const files = Array.from(event.target.files || []).filter((file) => file?.type?.startsWith("image/"));
    if (!files.length) return;

    setEvidenceItems((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);

    event.target.value = "";
  };

  const removeEvidenceItem = (targetId) => {
    setEvidenceItems((prev) => {
      const target = prev.find((item) => item.id === targetId);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== targetId);
    });
  };

  const completed = items.filter((item) => item.completed).length;
  const total = items.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  const loading = initialDataQuery.isLoading;
  const checklistLoading = checklistQuery.isLoading;
  const saving = createRecordMutation.isPending || toggleTaskMutation.isPending || completeRecordMutation.isPending;

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <header>
          <div className="flex items-center gap-3">
            <BackButton variant="dashboard" />
            <h1 className="text-2xl font-extrabold text-slate-900">Aseo</h1>
          </div>
        </header>

        {!hasTenantContext ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            No hay propiedad activa para operar este módulo.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 items-start gap-6">
          <Card>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">REGISTRO</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">Nueva limpieza</h2>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SearchableSelect
                value={selectedAreaId}
                onChange={(value) => setSelectedAreaId(String(value))}
                options={areaOptions}
                placeholder="Seleccione área"
                searchPlaceholder="Buscar área..."
                disabled={!hasTenantContext || saving || loading}
              />

              <SearchableSelect
                value={selectedOperativeId}
                onChange={(value) => setSelectedOperativeId(String(value))}
                options={operativeOptions}
                placeholder="Seleccione operario"
                searchPlaceholder="Buscar operario..."
                disabled={!hasTenantContext || saving || loading}
              />
            </div>

            <button
              type="button"
              onClick={createRecord}
              disabled={!hasTenantContext || saving || loading}
              className="mt-5 w-full rounded-2xl bg-blue-600 px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-70 sm:mx-auto sm:block sm:w-auto"
            >
              {saving ? "Procesando..." : "Crear limpieza"}
            </button>
          </Card>

          <Card>
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">SEGUIMIENTO</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">Historial de limpiezas</h2>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                Cargando registros...
              </div>
            ) : records.length ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {records.map((record) => (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => setSelectedRecordId(record.id)}
                    className={[
                      "rounded-2xl border p-4 text-left transition",
                      selectedRecord?.id === record.id
                        ? "border-blue-300 bg-blue-50"
                        : record.status === "completed"
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-slate-200 bg-white hover:border-blue-200",
                    ].join(" ")}
                  >
                    <p className="truncate text-sm font-bold text-slate-900">{resolveCleaningAreaName(record, areaNameById) || "Area"}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                      {record.operative?.user?.full_name || "Operario"}
                    </p>
                    <span
                      className={[
                        "mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold",
                        record.status === "completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700",
                      ].join(" ")}
                    >
                      {record.status === "completed" ? "COMPLETADO" : "PENDIENTE"}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                No hay registros de limpieza.
              </div>
            )}
          </Card>
        </div>

        {selectedRecord ? (
          <Card>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                {resolveCleaningAreaName(selectedRecord, areaNameById) || "Area de limpieza"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {selectedRecord.operative?.user?.full_name || "Operario"} {" - "}
                {selectedRecord.created_at
                  ? new Date(selectedRecord.created_at).toLocaleString("es-CO", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : ""}
              </p>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
                <span>Progreso</span>
                <span>{percent}%</span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={["h-full transition-all", percent === 100 ? "bg-emerald-600" : "bg-blue-600"].join(" ")}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {checklistLoading ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  Cargando checklist...
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className={item.completed ? "line-through text-slate-400" : "text-slate-800"}>
                      {item.item_name}
                    </span>
                    <input
                      type="checkbox"
                      checked={Boolean(item.completed)}
                      disabled={selectedRecord.status === "completed" || saving}
                      onChange={() => toggleTask(item)}
                      className="h-5 w-5 accent-blue-600"
                    />
                  </div>
                ))
              )}
            </div>

            {selectedRecord.status === "completed" ? (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-600">Observación final</h3>
                <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
                  {selectedRecord.observations || "Sin observación."}
                </div>

                {Array.isArray(selectedRecord.evidence_urls) && selectedRecord.evidence_urls.length ? (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-slate-600">Evidencias</h3>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveEvidenceImage({
                          imageUrls: selectedRecord.evidence_urls,
                          title:
                            selectedRecord.evidence_urls.length > 1
                              ? `${selectedRecord.evidence_urls.length} evidencias adjuntas`
                              : "1 evidencia adjunta",
                        })
                      }
                      className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      {selectedRecord.evidence_urls.length > 1
                        ? `Ver evidencias (${selectedRecord.evidence_urls.length})`
                        : "Ver evidencia"}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-600">Observación final</h3>
                <textarea
                  className={`${inputBase} mt-2 min-h-[140px] py-3`}
                  placeholder="Describe el resultado general de la limpieza..."
                  value={observationText}
                  onChange={(event) => setObservationText(event.target.value)}
                  disabled={saving}
                />

                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-slate-600">Evidencias</h3>
                  <div className="mt-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4">
                    <input
                      id="cleaning-evidences-input"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={onEvidenceChange}
                    />

                    {!evidenceItems.length ? (
                      <button
                        type="button"
                        onClick={() => document.getElementById("cleaning-evidences-input")?.click()}
                        className="w-full rounded-2xl px-4 py-8 text-center transition hover:bg-slate-100"
                      >
                        <ImageUploadPrompt
                          title="Adjuntar evidencias"
                          description="Puedes cargar varias imagenes antes de finalizar la limpieza"
                        />
                      </button>
                    ) : (
                      <>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveEvidenceImage({
                                imageUrls: evidenceItems.map((item) => item.previewUrl).filter(Boolean),
                                title:
                                  evidenceItems.length > 1
                                    ? `${evidenceItems.length} evidencias adjuntas`
                                    : "1 evidencia adjunta",
                              })
                            }
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            {evidenceItems.length > 1 ? `Ver evidencias (${evidenceItems.length})` : "Ver evidencia"}
                          </button>

                          <button
                            type="button"
                            onClick={() => document.getElementById("cleaning-evidences-input")?.click()}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-50"
                          >
                            Agregar más evidencias
                          </button>

                          <button
                            type="button"
                            onClick={() => clearEvidenceItems(setEvidenceItems)}
                            className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-extrabold text-rose-700 hover:bg-rose-100"
                          >
                            Quitar todas
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={percent !== 100 || !String(observationText || "").trim() || !evidenceItems.length || saving}
                  className={[
                    "mt-4 w-full rounded-2xl py-3 text-sm font-extrabold transition sm:mx-auto sm:block sm:w-auto sm:px-6",
                    percent === 100 && String(observationText || "").trim() && evidenceItems.length && !saving
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "cursor-not-allowed bg-slate-200 text-slate-500",
                  ].join(" ")}
                >
                  {saving ? "Procesando..." : "Finalizar limpieza"}
                </button>
              </div>
            )}
          </Card>
        ) : hasTenantContext && !loading ? (
          <Card>
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              No hay una limpieza creada para hoy. Crea el registro del día para iniciar el checklist en estado pendiente.
            </div>
          </Card>
        ) : null}

        <ImageViewer
          open={Boolean(activeEvidenceImage.imageUrl) || (Array.isArray(activeEvidenceImage.imageUrls) && activeEvidenceImage.imageUrls.length > 0)}
          imageUrl={activeEvidenceImage.imageUrl}
          imageUrls={activeEvidenceImage.imageUrls}
          title={activeEvidenceImage.title}
          onClose={() => setActiveEvidenceImage({ imageUrl: "", imageUrls: [], title: "" })}
        />
      </div>
    </div>
  );
}

function normalizeApiError(err, fallbackMessage) {
  const responseData = err?.response?.data;
  const errors = responseData?.errors;

  if (errors && typeof errors === "object") {
    const firstFieldErrors = Object.values(errors).find(
      (fieldErrors) => Array.isArray(fieldErrors) && fieldErrors.length > 0
    );
    if (firstFieldErrors) {
      return String(firstFieldErrors[0]);
    }
  }

  return responseData?.message || err?.message || fallbackMessage;
}

export default CleaningRecordsPage;

function resolveCleaningAreaName(record, areaNameById) {
  const relationName = String(record?.cleaningArea?.name || "").trim();
  if (relationName) return relationName;

  const id = record?.cleaning_area_id ?? record?.cleaningArea?.id;
  if (id === null || id === undefined) return "";

  return String(areaNameById?.get(String(id)) || "").trim();
}

function isTodayCleaningRecord(record) {
  const cleaningDate = String(record?.cleaning_date || "").slice(0, 10);
  if (!cleaningDate) return false;

  const now = new Date();
  const localToday = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  return cleaningDate === localToday;
}

function clearEvidenceItems(setter) {
  setter((prev) => {
    prev.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    return [];
  });
}
