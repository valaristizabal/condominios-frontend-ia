import { useEffect, useState } from "react";
import { useCleaningRecords } from "./useCleaningRecords";

const inputBase =
  "w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition";

function CleaningRecordsPage() {
  const {
    hasTenantContext,
    getInitialData,
    getChecklistItems,
    createCleaningRecord,
    toggleChecklistItem,
    completeCleaningRecord,
  } = useCleaningRecords();

  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [items, setItems] = useState([]);
  const [areas, setAreas] = useState([]);
  const [operatives, setOperatives] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [selectedOperativeId, setSelectedOperativeId] = useState("");
  const [observationText, setObservationText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadInitialData();
  }, [hasTenantContext]);

  const loadInitialData = async () => {
    if (!hasTenantContext) {
      setAreas([]);
      setOperatives([]);
      setRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const initialData = await getInitialData();
      setAreas(initialData.areas);
      setOperatives(initialData.operatives);
      setRecords(initialData.records);
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible cargar el modulo de aseo."));
    } finally {
      setLoading(false);
    }
  };

  const selectRecord = async (record) => {
    setSelectedRecord(record);
    setObservationText(record?.observations || "");
    setError("");

    try {
      const checklist = await getChecklistItems(record.id);
      setItems(checklist);
    } catch (err) {
      setItems([]);
      setError(normalizeApiError(err, "No fue posible cargar checklist del registro."));
    }
  };

  const createRecord = async () => {
    if (!selectedAreaId || !selectedOperativeId) return;

    setSaving(true);
    setError("");

    try {
      const newRecord = await createCleaningRecord({
        cleaning_area_id: Number(selectedAreaId),
        operative_id: Number(selectedOperativeId),
        cleaning_date: new Date().toISOString().slice(0, 10),
      });

      const checklist = await getChecklistItems(newRecord.id);

      setRecords((prev) => [newRecord, ...prev]);
      setSelectedRecord(newRecord);
      setItems(checklist);
      setSelectedAreaId("");
      setSelectedOperativeId("");
      setObservationText("");
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible crear la limpieza."));
    } finally {
      setSaving(false);
    }
  };

  const toggleTask = async (item) => {
    if (!selectedRecord) return;
    setSaving(true);
    setError("");

    try {
      await toggleChecklistItem(selectedRecord.id, item.id, item.completed);
      const updatedItems = await getChecklistItems(selectedRecord.id);
      setItems(updatedItems);
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible actualizar la tarea."));
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async () => {
    if (!selectedRecord) return;

    setSaving(true);
    setError("");

    try {
      const updated = await completeCleaningRecord(selectedRecord.id, {
        observations: String(observationText || "").trim(),
      });

      setSelectedRecord(updated);
      setRecords((prev) => prev.map((record) => (record.id === updated.id ? updated : record)));
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible finalizar la limpieza."));
    } finally {
      setSaving(false);
    }
  };

  const completed = items.filter((item) => item.completed).length;
  const total = items.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

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
                onClick={() => selectRecord(record)}
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
            {items.map((item) => (
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
            ))}
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
