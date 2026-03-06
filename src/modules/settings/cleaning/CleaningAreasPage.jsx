import { useEffect, useMemo, useRef, useState } from "react";
import { PlusCircle } from "lucide-react";
import BackButton from "../../../components/common/BackButton";
import { useCleaningAreas } from "./useCleaningAreas";

const inputBase =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

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

const Label = ({ children }) => <label className="text-sm font-semibold text-slate-700">{children}</label>;

const Badge = ({ active }) => (
  <span
    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
      active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
    }`}
  >
    {active ? "Activo" : "Inactivo"}
  </span>
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
  const newAreaInputRef = useRef(null);

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

  const focusCreateInput = () => {
    newAreaInputRef.current?.focus();
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-3">
        <BackButton variant="settings" />
      </div>

      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Aseo</h1>
        </div>
        <button
          type="button"
          onClick={focusCreateInput}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-70"
          disabled={!hasTenantContext || saving}
        >
          + Nueva área
        </button>
      </header>

      {!hasTenantContext ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No hay propiedad activa para gestionar áreas de aseo.
        </p>
      ) : null}

      {error || localError ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {localError || error}
        </p>
      ) : null}

      {success ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-extrabold text-slate-900">Crear área</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label>Nombre del área</Label>
            <input
              ref={newAreaInputRef}
              className={inputBase}
              placeholder="Ej: Lobby, Gimnasio, Piscina"
              value={newAreaName}
              onChange={(event) => setNewAreaName(event.target.value)}
              disabled={!hasTenantContext || saving}
            />
          </div>

          <button
            type="button"
            onClick={onCreateArea}
            disabled={!hasTenantContext || saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-70 sm:w-auto"
          >
            <PlusCircle className="h-4 w-4" />
            Guardar
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-extrabold text-slate-900">Áreas registradas</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
            {cleaningAreas.length} {cleaningAreas.length === 1 ? "área" : "áreas"}
          </span>
        </div>

        {loading ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            Cargando áreas...
          </div>
        ) : cleaningAreas.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            Aún no hay áreas registradas.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {cleaningAreas.map((area) => {
              const isEditing = editingAreaId === area.id;
              const currentTaskText = newTaskTextByArea[area.id] || "";
              const scheduleConfig = taskScheduleByArea[area.id] || defaultTaskSchedule;

              return (
                <article key={area.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="space-y-2">
                          <Label>Nombre</Label>
                          <input
                            className={inputBase}
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                            disabled={saving}
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={saveEdit}
                              disabled={saving}
                              className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-70"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={saving}
                              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-70"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-extrabold text-slate-900">{area.name || "-"}</p>
                          <Badge active={Boolean(area.is_active)} />
                        </div>
                      )}
                    </div>

                    {!isEditing ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openChecklist(area.id)}
                          disabled={saving}
                          className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                        >
                          {checklistAreaId === area.id ? "Cerrar checklist" : "Checklist"}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(area)}
                          disabled={saving}
                          className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleActive(area)}
                          disabled={saving}
                          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                        >
                          {area.is_active ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {!isEditing && checklistAreaId === area.id ? (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                      {!checklist.length ? (
                        <p className="mb-3 text-sm text-slate-500">No hay tareas configuradas.</p>
                      ) : null}

                      {checklist.map((item) => {
                        const linkedSchedule = linkedScheduleByChecklistItemId[item.id];
                        return (
                          <div key={item.id} className="mb-2 rounded-lg border border-slate-200 bg-white p-3 last:mb-0">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm text-slate-800">{item.item_name}</span>
                              <button
                                type="button"
                                onClick={() => deleteTask(area.id, item.id)}
                                disabled={checklistSaving || scheduleSaving}
                                className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-70"
                              >
                                Eliminar
                              </button>
                            </div>

                            {linkedSchedule ? (
                              <p className="mt-2 text-xs text-slate-500">
                                Programada:{" "}
                                {frequencyLabelByValue[linkedSchedule.frequency_type] || linkedSchedule.frequency_type}
                                {Number(linkedSchedule.repeat_interval || 1) > 1
                                  ? ` (cada ${linkedSchedule.repeat_interval})`
                                  : ""}
                                {" - "}
                                {linkedSchedule.start_date}
                                {linkedSchedule.end_date ? ` al ${linkedSchedule.end_date}` : ""}
                              </p>
                            ) : (
                              <p className="mt-2 text-xs text-amber-600">Sin programación (solo manual).</p>
                            )}
                          </div>
                        );
                      })}

                      <div className="mt-3 space-y-3 rounded-xl border border-blue-100 bg-blue-50/40 p-3">
                        <p className="text-sm font-extrabold text-blue-700">Nueva tarea + calendario</p>

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

                        <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={Boolean(scheduleConfig.enabled)}
                            onChange={(event) => setTaskScheduleField(area.id, "enabled", event.target.checked)}
                            className="h-4 w-4 accent-indigo-600"
                            disabled={checklistSaving || scheduleSaving}
                          />
                          Programar con calendario
                        </label>

                        {scheduleConfig.enabled ? (
                          <>
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                              <select
                                className={inputBase}
                                value={scheduleConfig.frequency_type}
                                onChange={(event) => setTaskScheduleField(area.id, "frequency_type", event.target.value)}
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
                                onChange={(event) => setTaskScheduleField(area.id, "repeat_interval", event.target.value)}
                                disabled={checklistSaving || scheduleSaving}
                              />
                            </div>

                            {scheduleConfig.frequency_type === "weekly" ? (
                              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                {WEEK_DAYS.map((day) => {
                                  const checked = scheduleConfig.days_of_week.includes(day.value);
                                  return (
                                    <button
                                      key={day.value}
                                      type="button"
                                      onClick={() => toggleTaskScheduleDay(area.id, day.value)}
                                      className={[
                                        "rounded-lg px-3 py-2 text-xs font-bold transition",
                                        checked
                                          ? "border border-indigo-600 bg-indigo-600 text-white"
                                          : "border border-slate-300 bg-white text-slate-700 hover:border-indigo-400",
                                      ].join(" ")}
                                      disabled={checklistSaving || scheduleSaving}
                                    >
                                      {day.label}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : null}

                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                              <input
                                type="date"
                                className={inputBase}
                                value={scheduleConfig.start_date}
                                onChange={(event) => setTaskScheduleField(area.id, "start_date", event.target.value)}
                                disabled={checklistSaving || scheduleSaving}
                              />

                              <input
                                type="date"
                                className={inputBase}
                                value={scheduleConfig.end_date}
                                onChange={(event) => setTaskScheduleField(area.id, "end_date", event.target.value)}
                                disabled={checklistSaving || scheduleSaving}
                              />
                            </div>
                          </>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => addTask(area.id)}
                          disabled={checklistSaving || scheduleSaving}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-70 sm:w-auto"
                        >
                          <PlusCircle className="h-4 w-4" />
                          Crear tarea
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
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
