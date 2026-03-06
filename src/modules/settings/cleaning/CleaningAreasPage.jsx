import { useEffect, useMemo, useState } from "react";
import { Pencil, PlusCircle } from "lucide-react";
import BackButton from "../../../components/common/BackButton";
import { useCleaningAreas } from "./useCleaningAreas";

const inputBase =
  "w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200";

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Diaria" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensual" },
  { value: "custom", label: "Intervalo personalizado" },
];

const WEEK_DAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

const Label = ({ children }) => (
  <label className="text-sm text-gray-700 font-medium">{children}</label>
);

const Badge = ({ active }) => (
  <span
    className={`px-3 py-1 rounded-full text-xs font-black ${
      active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
    }`}
  >
    {active ? "ACTIVO" : "INACTIVO"}
  </span>
);

const IconCircle = ({ children }) => (
  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-black">
    {children}
  </div>
);

const todayISO = () => {
  const d = new Date();
  return d.toISOString().split("T")[0];
};

const defaultTaskSchedule = {
  enabled: true,
  frequency_type: "weekly",
  repeat_interval: 1,
  days_of_week: [1],
  start_date: todayISO(),
  end_date: "",
  is_active: true,
};

function CleaningAreasPage() {
  const {
    cleaningAreas,
    cleaningSchedules,
    checklistsByArea,
    loading,
    saving,
    scheduleSaving,
    checklistSaving,
    error,
    hasTenantContext,
    createCleaningArea,
    updateCleaningArea,
    toggleCleaningArea,
    fetchChecklistByArea,
    addChecklistItem,
    removeChecklistItem,
    createCleaningSchedule,
    removeCleaningSchedule,
  } = useCleaningAreas();

  const [newAreaName, setNewAreaName] = useState("");
  const [editingAreaId, setEditingAreaId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [checklistAreaId, setChecklistAreaId] = useState(null);
  const [newTaskTextByArea, setNewTaskTextByArea] = useState({});
  const [taskScheduleByArea, setTaskScheduleByArea] = useState({});
  const [localError, setLocalError] = useState("");
  const [success, setSuccess] = useState("");

  const checklist = useMemo(() => {
    if (!checklistAreaId) return [];
    return checklistsByArea[checklistAreaId] || [];
  }, [checklistAreaId, checklistsByArea]);

  const linkedScheduleByChecklistItemId = useMemo(() => {
    const scheduleMap = {};
    const pattern = /\[checklist_item:(\d+)\]/;

    (cleaningSchedules || []).forEach((schedule) => {
      if (Number(schedule.cleaning_area_id) !== Number(checklistAreaId)) return;
      const description = String(schedule.description || "");
      const match = description.match(pattern);
      if (!match) return;
      const checklistItemId = Number(match[1]);
      if (!Number.isFinite(checklistItemId)) return;
      scheduleMap[checklistItemId] = schedule;
    });

    return scheduleMap;
  }, [cleaningSchedules, checklistAreaId]);

  useEffect(() => {
    if (!checklistAreaId) return;
    fetchChecklistByArea(checklistAreaId).catch(() => undefined);
  }, [checklistAreaId, fetchChecklistByArea]);

  const onCreateArea = async () => {
    const cleanName = String(newAreaName || "").trim();
    if (!cleanName) return;

    setLocalError("");
    setSuccess("");

    try {
      await createCleaningArea({ name: cleanName });
      setNewAreaName("");
      setSuccess("Área creada correctamente.");
    } catch (err) {
      setLocalError(normalizeApiError(err, "No fue posible crear el área."));
    }
  };

  const startEdit = (area) => {
    setEditingAreaId(area.id);
    setEditingName(area.name || "");
    setLocalError("");
    setSuccess("");
  };

  const cancelEdit = () => {
    setEditingAreaId(null);
    setEditingName("");
  };

  const saveEdit = async () => {
    if (!editingAreaId || !String(editingName || "").trim()) return;

    setLocalError("");
    setSuccess("");

    try {
      await updateCleaningArea(editingAreaId, {
        name: String(editingName).trim(),
      });
      cancelEdit();
      setSuccess("Área actualizada correctamente.");
    } catch (err) {
      setLocalError(normalizeApiError(err, "No fue posible actualizar el área."));
    }
  };

  const onToggleActive = async (area) => {
    setLocalError("");
    setSuccess("");

    try {
      await toggleCleaningArea(area.id);
      setSuccess(area.is_active ? "Área desactivada correctamente." : "Área activada correctamente.");
    } catch (err) {
      setLocalError(normalizeApiError(err, "No fue posible cambiar estado del área."));
    }
  };

  const openChecklist = async (areaId) => {
    if (checklistAreaId === areaId) {
      setChecklistAreaId(null);
      return;
    }

    setChecklistAreaId(areaId);
    setTaskScheduleByArea((prev) => ({
      ...prev,
      [areaId]: prev[areaId] || defaultTaskSchedule,
    }));
  };

  const setTaskScheduleField = (areaId, field, value) => {
    setTaskScheduleByArea((prev) => ({
      ...prev,
      [areaId]: {
        ...(prev[areaId] || defaultTaskSchedule),
        [field]: value,
      },
    }));
  };

  const toggleTaskScheduleDay = (areaId, dayValue) => {
    const current = taskScheduleByArea[areaId] || defaultTaskSchedule;
    const exists = current.days_of_week.includes(dayValue);
    const nextDays = exists
      ? current.days_of_week.filter((day) => day !== dayValue)
      : [...current.days_of_week, dayValue];

    setTaskScheduleField(
      areaId,
      "days_of_week",
      nextDays.sort((a, b) => a - b)
    );
  };

  const addTask = async (areaId) => {
    const cleanTask = String(newTaskTextByArea[areaId] || "").trim();
    if (!cleanTask) return;

    const scheduleConfig = taskScheduleByArea[areaId] || defaultTaskSchedule;

    if (scheduleConfig.enabled && !scheduleConfig.start_date) {
      setLocalError("Debes seleccionar fecha de inicio para programar la tarea.");
      return;
    }

    if (scheduleConfig.enabled && scheduleConfig.frequency_type === "weekly" && !scheduleConfig.days_of_week.length) {
      setLocalError("Debes seleccionar al menos un día para frecuencia semanal.");
      return;
    }

    setLocalError("");
    setSuccess("");

    try {
      const createdTask = await addChecklistItem(areaId, { item_name: cleanTask });

      if (scheduleConfig.enabled) {
        await createCleaningSchedule({
          cleaning_area_id: Number(areaId),
          name: cleanTask,
          description: `[checklist_item:${createdTask?.id}]`,
          frequency_type: scheduleConfig.frequency_type,
          repeat_interval: Number(scheduleConfig.repeat_interval || 1),
          days_of_week: scheduleConfig.frequency_type === "weekly" ? scheduleConfig.days_of_week : null,
          start_date: scheduleConfig.start_date,
          end_date: scheduleConfig.end_date || null,
          is_active: Boolean(scheduleConfig.is_active),
        });
      }

      setNewTaskTextByArea((prev) => ({ ...prev, [areaId]: "" }));
      setSuccess("Tarea agregada al checklist.");
    } catch (err) {
      setLocalError(normalizeApiError(err, "No fue posible agregar tarea."));
    }
  };

  const deleteTask = async (areaId, taskId) => {
    setLocalError("");
    setSuccess("");

    try {
      const linkedSchedule = linkedScheduleByChecklistItemId[taskId];
      if (linkedSchedule?.id) {
        await removeCleaningSchedule(linkedSchedule.id);
      }

      await removeChecklistItem(areaId, taskId);
      setSuccess("Tarea eliminada del checklist.");
    } catch (err) {
      setLocalError(normalizeApiError(err, "No fue posible eliminar tarea."));
    }
  };

  const frequencyLabelByValue = useMemo(
    () => Object.fromEntries(FREQUENCY_OPTIONS.map((item) => [item.value, item.label])),
    []
  );

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <div className="bg-white border-b border-gray-100">
        <div className="px-4 pt-4 pb-3 flex items-start gap-3 max-w-3xl mx-auto">
          <BackButton variant="settings" />

          <div>
            <h1 className="text-xl font-extrabold text-blue-700">Aseo</h1>
          </div>
        </div>
      </div>

      <div className="px-4 pb-10 max-w-3xl mx-auto">
        <div className="pt-6" />

        {!hasTenantContext ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            No hay propiedad activa para gestionar áreas de aseo.
          </div>
        ) : null}

        {error || localError ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {localError || error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="mt-6 bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700 font-black">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div className="text-lg font-extrabold text-gray-900">Nueva área</div>
          </div>

          <div className="mt-4 space-y-2">
            <Label>Nombre del área</Label>
            <input
              className={inputBase}
              placeholder="Ej: Lobby, Gimnasio, Piscina..."
              value={newAreaName}
              onChange={(event) => setNewAreaName(event.target.value)}
              disabled={!hasTenantContext || saving}
            />
          </div>

          <button
            type="button"
            onClick={onCreateArea}
            disabled={!hasTenantContext || saving}
            className="mt-4 w-full bg-blue-600 text-white rounded-2xl py-4 font-extrabold shadow-lg hover:bg-blue-700 disabled:opacity-70"
          >
            Guardar área
          </button>
        </div>

        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 text-sm font-semibold text-gray-500">
              Cargando áreas...
            </div>
          ) : (
            cleaningAreas.map((area) => {
              const isEditing = editingAreaId === area.id;
              const currentTaskText = newTaskTextByArea[area.id] || "";
              const scheduleConfig = taskScheduleByArea[area.id] || defaultTaskSchedule;

              return (
                <div key={area.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center gap-4">
                    <IconCircle>{area.name?.[0]?.toUpperCase() || "A"}</IconCircle>

                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-2">
                          <Label>Nombre</Label>
                          <input
                            className={inputBase}
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                            disabled={saving}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-70"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={saving}
                              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 disabled:opacity-70"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="text-lg font-extrabold text-gray-900">{area.name}</div>
                            <Badge active={Boolean(area.is_active)} />
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            <button
                              onClick={() => onToggleActive(area)}
                              disabled={saving}
                              className="text-xs font-extrabold text-blue-700 hover:underline disabled:opacity-70"
                            >
                              {area.is_active ? "Desactivar" : "Activar"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {!isEditing ? (
                      <button
                        onClick={() => startEdit(area)}
                        disabled={saving}
                        className="w-10 h-10 rounded-2xl hover:bg-gray-100 flex items-center justify-center disabled:opacity-70"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>

                  {!isEditing ? (
                    <>
                      <button
                        onClick={() => openChecklist(area.id)}
                        disabled={saving}
                        className="mt-4 w-full rounded-2xl py-3 font-extrabold border border-blue-600 text-blue-700 hover:bg-blue-50 disabled:opacity-70"
                      >
                        Configurar Checklist
                      </button>

                      {checklistAreaId === area.id ? (
                        <div className="mt-4 bg-[#F7F9FC] p-4 rounded-2xl border border-gray-200">
                          {!checklist.length ? (
                            <div className="text-sm text-gray-500 mb-3">No hay tareas configuradas.</div>
                          ) : null}

                          {checklist.map((item) => {
                            const linkedSchedule = linkedScheduleByChecklistItemId[item.id];
                            return (
                              <div
                                key={item.id}
                                className="bg-white p-3 rounded-xl mb-2 shadow-sm border border-gray-100"
                              >
                                <div className="flex justify-between items-center gap-3">
                                  <span>{item.item_name}</span>
                                  <button
                                    onClick={() => deleteTask(area.id, item.id)}
                                    disabled={checklistSaving || scheduleSaving}
                                    className="text-red-500 font-bold disabled:opacity-70"
                                  >
                                    Eliminar
                                  </button>
                                </div>

                                {linkedSchedule ? (
                                  <div className="mt-2 text-xs text-gray-500">
                              Programada:{" "}
                                    {frequencyLabelByValue[linkedSchedule.frequency_type] || linkedSchedule.frequency_type}
                                    {Number(linkedSchedule.repeat_interval || 1) > 1
                                      ? ` (cada ${linkedSchedule.repeat_interval})`
                                      : ""}
                                    {" - "}
                                    {linkedSchedule.start_date}
                                    {linkedSchedule.end_date ? ` al ${linkedSchedule.end_date}` : ""}
                                  </div>
                                ) : (
                                  <div className="mt-2 text-xs text-amber-600">
                                    Sin programación (se ejecuta solo manual).
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-3 space-y-3">
                            <div className="text-sm font-extrabold text-blue-700">Nueva tarea + calendario</div>

                            <input
                              className={inputBase}
                              value={currentTaskText}
                              onChange={(event) =>
                                setNewTaskTextByArea((prev) => ({
                                  ...prev,
                                  [area.id]: event.target.value,
                                }))
                              }
                              placeholder="Nueva tarea..."
                              disabled={checklistSaving || scheduleSaving}
                            />

                            <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                              <input
                                type="checkbox"
                                checked={Boolean(scheduleConfig.enabled)}
                                onChange={(event) => setTaskScheduleField(area.id, "enabled", event.target.checked)}
                                className="h-4 w-4 accent-blue-600"
                                disabled={checklistSaving || scheduleSaving}
                              />
                              Programar con calendario
                            </label>

                            {scheduleConfig.enabled ? (
                              <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <select
                                    className={inputBase}
                                    value={scheduleConfig.frequency_type}
                                    onChange={(event) =>
                                      setTaskScheduleField(area.id, "frequency_type", event.target.value)
                                    }
                                    disabled={checklistSaving || scheduleSaving}
                                  >
                                    {FREQUENCY_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>

                                  <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    className={inputBase}
                                    value={scheduleConfig.repeat_interval}
                                    onChange={(event) =>
                                      setTaskScheduleField(area.id, "repeat_interval", event.target.value)
                                    }
                                    disabled={checklistSaving || scheduleSaving}
                                  />
                                </div>

                                {scheduleConfig.frequency_type === "weekly" ? (
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {WEEK_DAYS.map((day) => {
                                      const checked = scheduleConfig.days_of_week.includes(day.value);
                                      return (
                                        <button
                                          key={day.value}
                                          type="button"
                                          onClick={() => toggleTaskScheduleDay(area.id, day.value)}
                                          className={[
                                            "rounded-xl px-3 py-2 text-xs font-bold border transition",
                                            checked
                                              ? "bg-blue-600 text-white border-blue-600"
                                              : "bg-white text-gray-700 border-gray-200 hover:border-blue-300",
                                          ].join(" ")}
                                          disabled={checklistSaving || scheduleSaving}
                                        >
                                          {day.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                ) : null}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <input
                                    type="date"
                                    className={inputBase}
                                    value={scheduleConfig.start_date}
                                    onChange={(event) =>
                                      setTaskScheduleField(area.id, "start_date", event.target.value)
                                    }
                                    disabled={checklistSaving || scheduleSaving}
                                  />

                                  <input
                                    type="date"
                                    className={inputBase}
                                    value={scheduleConfig.end_date}
                                    onChange={(event) =>
                                      setTaskScheduleField(area.id, "end_date", event.target.value)
                                    }
                                    disabled={checklistSaving || scheduleSaving}
                                  />
                                </div>
                              </>
                            ) : null}

                            <button
                              onClick={() => addTask(area.id)}
                              disabled={checklistSaving || scheduleSaving}
                              className="w-full bg-blue-600 text-white px-4 py-3 rounded-2xl font-bold disabled:opacity-70"
                            >
                              <PlusCircle className="mr-2 inline h-5 w-5" />
                              Crear tarea
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
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

export default CleaningAreasPage;
