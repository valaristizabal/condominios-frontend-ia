import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCleaningRecords } from "./useCleaningRecords";

const inputBase =
  "w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition";

function CleaningRecordsPage() {
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
  const [error, setError] = useState("");

  const initialDataQuery = useQuery({
    queryKey: ["cleaning", "initial", tenantCacheKey],
    enabled: hasTenantContext,
    queryFn: getInitialData,
  });

  const areas = initialDataQuery.data?.areas || [];
  const operatives = initialDataQuery.data?.operatives || [];
  const records = initialDataQuery.data?.records || [];

  useEffect(() => {
    if (!records.length) {
      setSelectedRecordId(null);
      return;
    }

    if (selectedRecordId && records.some((record) => record.id === selectedRecordId)) {
      return;
    }

    setSelectedRecordId(records[0].id);
  }, [records, selectedRecordId]);

  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedRecordId) || null,
    [records, selectedRecordId]
  );

  useEffect(() => {
    if (!selectedRecord) {
      setObservationText("");
      return;
    }

    setObservationText(selectedRecord?.observations || "");
  }, [selectedRecordId]);

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
      setError("");
    },
    onError: (err) => {
      setError(normalizeApiError(err, "No fue posible crear la limpieza."));
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: ({ recordId, itemId, currentCompleted }) =>
      toggleChecklistItem(recordId, itemId, currentCompleted),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cleaning", "checklist", tenantCacheKey, selectedRecordId] });
      setError("");
    },
    onError: (err) => {
      setError(normalizeApiError(err, "No fue posible actualizar la tarea."));
    },
  });

  const completeRecordMutation = useMutation({
    mutationFn: ({ recordId, observations }) => completeCleaningRecord(recordId, { observations }),
    onSuccess: async (updated) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cleaning", "initial", tenantCacheKey] }),
        queryClient.invalidateQueries({ queryKey: ["cleaning", "checklist", tenantCacheKey, selectedRecordId] }),
      ]);
      if (updated?.id) setSelectedRecordId(updated.id);
      setError("");
    },
    onError: (err) => {
      setError(normalizeApiError(err, "No fue posible finalizar la limpieza."));
    },
  });

  useEffect(() => {
    const queryError = initialDataQuery.error || checklistQuery.error;
    if (!queryError) return;
    setError(normalizeApiError(queryError, "No fue posible cargar el modulo de aseo."));
  }, [initialDataQuery.error, checklistQuery.error]);

  const createRecord = async () => {
    if (!selectedAreaId || !selectedOperativeId) return;

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

    await completeRecordMutation.mutateAsync({
      recordId: selectedRecordId,
      observations: String(observationText || "").trim(),
    });
  };

  const completed = items.filter((item) => item.completed).length;
  const total = items.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  const loading = initialDataQuery.isLoading;
  const checklistLoading = checklistQuery.isLoading;
  const saving = createRecordMutation.isPending || toggleTaskMutation.isPending || completeRecordMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#EEF2F7] p-8 max-w-6xl mx-auto space-y-12">
      <div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Modulo de Aseo</h1>
        <p className="text-gray-500 mt-2 text-lg">Control y seguimiento operativo de limpieza</p>
      </div>

      {!hasTenantContext ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          No hay condominio activo para operar este modulo.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <div className="bg-white p-8 rounded-3xl shadow-md border border-gray-100 space-y-6">
        <h2 className="text-xl font-bold text-gray-800">Nueva Limpieza</h2>

        <div className="grid md:grid-cols-2 gap-5">
          <select
            value={selectedAreaId}
            onChange={(event) => setSelectedAreaId(event.target.value)}
            className={inputBase}
            disabled={!hasTenantContext || saving || loading}
          >
            <option value="">Seleccione area</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>

          <select
            value={selectedOperativeId}
            onChange={(event) => setSelectedOperativeId(event.target.value)}
            className={inputBase}
            disabled={!hasTenantContext || saving || loading}
          >
            <option value="">Seleccione operario</option>
            {operatives.map((operative) => (
              <option key={operative.id} value={operative.id}>
                {operative.user?.full_name || "Operario"}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={createRecord}
          disabled={!hasTenantContext || saving || loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white px-8 py-3 rounded-2xl font-semibold transition shadow-sm"
        >
          {saving ? "Procesando..." : "Crear Limpieza"}
        </button>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Historial de Limpiezas</h2>

        {loading ? (
          <div className="bg-white p-6 rounded-3xl border border-gray-100 text-sm text-gray-500">
            Cargando registros...
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {records.map((record) => (
              <div
                key={record.id}
                onClick={() => setSelectedRecordId(record.id)}
                className={`cursor-pointer p-6 rounded-3xl border transition shadow-sm ${
                  selectedRecord?.id === record.id
                    ? "border-blue-500 bg-blue-50"
                    : record.status === "completed"
                      ? "border-green-200 bg-green-50"
                      : "bg-white hover:border-blue-300"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-800">{record.cleaningArea?.name || "Area"}</span>
                    <span className="text-xs text-gray-400 mt-1">
                      {record.operative?.user?.full_name || "Operario"}
                    </span>
                  </div>

                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      record.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {record.status === "completed" ? "COMPLETADO" : "PENDIENTE"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedRecord ? (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              {selectedRecord.cleaningArea?.name || "Area de limpieza"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {selectedRecord.operative?.user?.full_name || "Operario"} {" · "}
              {selectedRecord.created_at
                ? new Date(selectedRecord.created_at).toLocaleString("es-CO", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : ""}
            </p>
          </div>

          <div>
            <div className="flex justify-between text-sm font-medium text-gray-600">
              <span>Progreso</span>
              <span>{percent}%</span>
            </div>
            <div className="mt-3 h-3 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  percent === 100 ? "bg-green-600" : "bg-blue-500"
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <div className="space-y-4">
            {checklistLoading ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                Cargando checklist...
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                  <span className={item.completed ? "line-through text-gray-400" : "text-gray-800"}>
                    {item.item_name}
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(item.completed)}
                    disabled={selectedRecord.status === "completed" || saving}
                    onChange={() => toggleTask(item)}
                    className="w-5 h-5 accent-blue-600"
                  />
                </div>
              ))
            )}
          </div>

          {selectedRecord.status === "completed" ? (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Observacion Final</h3>
              <div className="bg-gray-100 p-5 rounded-2xl text-gray-800">
                {selectedRecord.observations || "Sin observacion."}
              </div>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Observacion Final</h3>
                <textarea
                  className={`${inputBase} min-h-[140px]`}
                  placeholder="Describe el resultado general de la limpieza..."
                  value={observationText}
                  onChange={(event) => setObservationText(event.target.value)}
                  disabled={saving}
                />
              </div>

              <button
                onClick={handleFinish}
                disabled={percent !== 100 || !String(observationText || "").trim() || saving}
                className={`w-full py-3 rounded-2xl font-bold transition ${
                  percent === 100 && String(observationText || "").trim() && !saving
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                }`}
              >
                {saving ? "Procesando..." : "Finalizar Limpieza"}
              </button>
            </>
          )}
        </div>
      ) : null}
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
