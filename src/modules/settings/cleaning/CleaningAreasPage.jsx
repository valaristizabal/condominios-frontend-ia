import { useEffect, useMemo, useRef, useState } from "react";
import { PlusCircle } from "lucide-react";
import BackButton from "../../../components/common/BackButton";
import { useNotification } from "../../../hooks/useNotification";
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

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente" },
  { value: "in_progress", label: "En proceso" },
  { value: "completed", label: "Completada" },
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

const todayISO = () => new Date().toISOString().split("T")[0];

const defaultTaskDraft = {
  item_name: "",
  assigned_user_id: "",
  frequency_type: "weekly",
  repeat_interval: 1,
  days_of_week: [1],
  start_date: todayISO(),
  end_date: "",
  status: "pending",
};

function CleaningAreasPage() {
  const { success: notifySuccess } = useNotification();
  const {
    cleaningAreas,
    cleaningOperatives,
    cleaningSchedules,
    checklistsByArea,
    loading,
    saving,
    checklistSaving,
    error,
    currentPage,
    pagination,
    hasTenantContext,
    setCurrentPage,
    createCleaningArea,
    updateCleaningArea,
    toggleCleaningArea,
    fetchChecklistByArea,
    addChecklistItem,
    updateChecklistItem,
    removeChecklistItem,
  } = useCleaningAreas();

  const [newAreaName, setNewAreaName] = useState("");
  const [showCreateAreaForm, setShowCreateAreaForm] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [checklistAreaId, setChecklistAreaId] = useState(null);
  const [newTaskByArea, setNewTaskByArea] = useState({});
  const [editingTaskByArea, setEditingTaskByArea] = useState({});
  const [localError, setLocalError] = useState("");
  const newAreaInputRef = useRef(null);

  const checklist = useMemo(() => (checklistAreaId ? checklistsByArea[checklistAreaId] || [] : []), [checklistAreaId, checklistsByArea]);

  const linkedScheduleByChecklistItemId = useMemo(() => {
    const scheduleMap = {};
    const pattern = /\[checklist_item:(\d+)\]/;

    (cleaningSchedules || []).forEach((schedule) => {
      if (Number(schedule.cleaning_area_id) !== Number(checklistAreaId)) return;
      const match = String(schedule.description || "").match(pattern);
      if (!match) return;
      scheduleMap[Number(match[1])] = schedule;
    });

    return scheduleMap;
  }, [checklistAreaId, cleaningSchedules]);

  const operativeOptions = useMemo(
    () =>
      (cleaningOperatives || [])
        .filter((operative) => operative?.user_id || operative?.user?.id)
        .map((operative) => ({
          value: String(operative.user_id || operative.user?.id),
          label: operative.user?.full_name || operative.full_name || operative.position || "Operario",
        })),
    [cleaningOperatives]
  );

  useEffect(() => {
    if (!checklistAreaId) return;
    fetchChecklistByArea(checklistAreaId).catch(() => undefined);
  }, [checklistAreaId, fetchChecklistByArea]);

  const setTaskDraftField = (areaId, field, value, editing = false) => {
    const setter = editing ? setEditingTaskByArea : setNewTaskByArea;
    setter((prev) => ({
      ...prev,
      [areaId]: {
        ...(prev[areaId] || defaultTaskDraft),
        [field]: value,
      },
    }));
  };

  const toggleTaskDay = (areaId, dayValue, editing = false) => {
    const current = (editing ? editingTaskByArea[areaId] : newTaskByArea[areaId]) || defaultTaskDraft;
    const days = Array.isArray(current.days_of_week) ? current.days_of_week : [];
    const nextDays = days.includes(dayValue) ? days.filter((day) => day !== dayValue) : [...days, dayValue];
    setTaskDraftField(areaId, "days_of_week", nextDays.sort((a, b) => a - b), editing);
  };

  const onCreateArea = async () => {
    const cleanName = String(newAreaName || "").trim();
    if (!cleanName) return;

    setLocalError("");

    try {
      await createCleaningArea({ name: cleanName });
      setNewAreaName("");
      setShowCreateAreaForm(false);
      notifySuccess("Area creada correctamente.");
    } catch (err) {
      setLocalError(normalizeApiError(err, "No fue posible crear el área."));
    }
  };

  const startEditArea = (area) => {
    setEditingAreaId(area.id);
    setEditingName(area.name || "");
    setLocalError("");
  };

  const cancelEditArea = () => {
    setEditingAreaId(null);
    setEditingName("");
  };

  const saveEditArea = async () => {
    if (!editingAreaId || !String(editingName || "").trim()) return;

    setLocalError("");

    try {
      await updateCleaningArea(editingAreaId, { name: String(editingName).trim() });
      cancelEditArea();
      notifySuccess("Area actualizada correctamente.");
    } catch (err) {
      setLocalError(normalizeApiError(err, "No fue posible actualizar el área."));
    }
  };

  const onToggleArea = async (area) => {
    setLocalError("");

    try {
      await toggleCleaningArea(area.id);
      notifySuccess(area.is_active ? "Area desactivada correctamente." : "Area activada correctamente.");
    } catch (err) {
      setLocalError(normalizeApiError(err, "No fue posible cambiar estado del área."));
    }
  };

  const openChecklist = (areaId) => {
    if (checklistAreaId === areaId) {
      setChecklistAreaId(null);
      return;
    }

    setChecklistAreaId(areaId);
    setNewTaskByArea((prev) => ({
      ...prev,
      [areaId]: prev[areaId] || defaultTaskDraft,
    }));
  };

  const addTask = async (areaId) => {
    const draft = newTaskByArea[areaId] || defaultTaskDraft;
    if (!String(draft.item_name || "").trim()) {
      setLocalError("Debes ingresar el nombre de la tarea.");
      return;
    }
    if (!draft.start_date) {
      setLocalError("Debes seleccionar fecha de inicio.");
      return;
    }
    if (draft.frequency_type === "weekly" && !(draft.days_of_week || []).length) {
      setLocalError("Debes seleccionar al menos un día para frecuencia semanal.");
      return;
    }

    setLocalError("");

    try {
      await addChecklistItem(areaId, {
        item_name: String(draft.item_name).trim(),
        assigned_user_id: draft.assigned_user_id ? Number(draft.assigned_user_id) : null,
        frequency_type: draft.frequency_type,
        repeat_interval: Number(draft.repeat_interval || 1),
        days_of_week: draft.frequency_type === "weekly" ? draft.days_of_week : null,
        start_date: draft.start_date,
        end_date: draft.end_date || null,
        status: draft.status,
      });
      setNewTaskByArea((prev) => ({ ...prev, [areaId]: defaultTaskDraft }));
      notifySuccess("Tarea agregada al checklist.");
    } catch (err) {
      setLocalError(normalizeApiError(err, "No fue posible agregar tarea."));
    }
  };

  const startEditTask = (areaId, item) => {
    setEditingTaskByArea((prev) => ({
      ...prev,
      [areaId]: {
        id: item.id,
        item_name: item.item_name || "",
        assigned_user_id: item.assigned_user_id ? String(item.assigned_user_id) : "",
        frequency_type: item.frequency_type || "weekly",
        repeat_interval: item.repeat_interval || 1,
        days_of_week: Array.isArray(item.days_of_week) ? item.days_of_week : [1],
        start_date: item.start_date || todayISO(),
        end_date: item.end_date || "",
        status: item.status || "pending",
      },
    }));
  };

  const cancelEditTask = (areaId) => {
    setEditingTaskByArea((prev) => {
      const next = { ...prev };
      delete next[areaId];
      return next;
    });
  };

  const saveEditTask = async (areaId) => {
    const draft = editingTaskByArea[areaId];
    if (!draft?.id || !String(draft.item_name || "").trim()) return;

    setLocalError("");

    try {
      await updateChecklistItem(areaId, draft.id, {
        item_name: String(draft.item_name).trim(),
        assigned_user_id: draft.assigned_user_id ? Number(draft.assigned_user_id) : null,
        frequency_type: draft.frequency_type,
        repeat_interval: Number(draft.repeat_interval || 1),
        days_of_week: draft.frequency_type === "weekly" ? draft.days_of_week : null,
        start_date: draft.start_date,
        end_date: draft.end_date || null,
        status: draft.status,
      });
      cancelEditTask(areaId);
      notifySuccess("Tarea actualizada correctamente.");
    } catch (err) {
      setLocalError(normalizeApiError(err, "No fue posible actualizar tarea."));
    }
  };

  const deleteTask = async (areaId, taskId) => {
    setLocalError("");

    try {
      await removeChecklistItem(areaId, taskId);
      notifySuccess("Tarea eliminada del checklist.");
    } catch (err) {
      setLocalError(normalizeApiError(err, "No fue posible eliminar tarea."));
    }
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
          onClick={() => {
            setShowCreateAreaForm(true);
            window.setTimeout(() => newAreaInputRef.current?.focus(), 0);
          }}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-70"
          disabled={!hasTenantContext || saving || showCreateAreaForm}
        >
          + Nueva Área
        </button>
      </header>

      {!hasTenantContext ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No hay propiedad activa para gestionar Áreas de aseo.
        </p>
      ) : null}

      {error || localError ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {localError || error}
        </p>
      ) : null}

      {showCreateAreaForm ? (
        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-extrabold text-slate-900">Crear Área</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label>Nombre del Área</Label>
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
            <button
              type="button"
              onClick={() => {
                setShowCreateAreaForm(false);
                setNewAreaName("");
              }}
              className="inline-flex w-full items-center justify-center rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200 sm:w-auto"
            >
              Cancelar
            </button>
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-extrabold text-slate-900">Áreas registradas</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
            {pagination.total} {pagination.total === 1 ? "área" : "áreas"}
          </span>
        </div>

        {loading ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            Cargando Áreas...
          </div>
        ) : cleaningAreas.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            Aún no hay Áreas registradas.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {cleaningAreas.map((area) => {
              const isEditingArea = editingAreaId === area.id;
              const newTaskDraft = newTaskByArea[area.id] || defaultTaskDraft;
              const editingTask = editingTaskByArea[area.id] || null;

              return (
                <article key={area.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {isEditingArea ? (
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
                              onClick={saveEditArea}
                              disabled={saving}
                              className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-70"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditArea}
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

                    {!isEditingArea ? (
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
                          onClick={() => startEditArea(area)}
                          disabled={saving}
                          className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleArea(area)}
                          disabled={saving}
                          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                        >
                          {area.is_active ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {!isEditingArea && checklistAreaId === area.id ? (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                      {!checklist.length ? (
                        <p className="mb-3 text-sm text-slate-500">No hay tareas configuradas.</p>
                      ) : null}

                      {checklist.map((item) => {
                        const isEditingTask = editingTask?.id === item.id;
                        const linkedSchedule = linkedScheduleByChecklistItemId[item.id];

                        return (
                          <div key={item.id} className="mb-2 rounded-lg border border-slate-200 bg-white p-3 last:mb-0">
                            {isEditingTask ? (
                              <TaskEditor
                                draft={editingTask}
                                operativeOptions={operativeOptions}
                                onFieldChange={(field, value) => setTaskDraftField(area.id, field, value, true)}
                                onToggleDay={(day) => toggleTaskDay(area.id, day, true)}
                                onSave={() => saveEditTask(area.id)}
                                onCancel={() => cancelEditTask(area.id)}
                                busy={checklistSaving}
                              />
                            ) : (
                              <>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-800">{item.item_name}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                      Responsable: {item.assigned_user?.full_name || "Sin asignar"} | Estado: {statusLabel(item.status)}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => startEditTask(area.id, item)}
                                      disabled={checklistSaving}
                                      className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-70"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteTask(area.id, item.id)}
                                      disabled={checklistSaving}
                                      className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-70"
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </div>

                                <p className="mt-2 text-xs text-slate-500">
                                  Programada: {frequencyLabel(item.frequency_type)}
                                  {Number(item.repeat_interval || 1) > 1 ? ` (cada ${item.repeat_interval})` : ""}
                                  {" - "}
                                  {item.start_date || "-"}
                                  {item.end_date ? ` al ${item.end_date}` : ""}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  Última ejecución:{" "}
                                  {item.last_executed_at
                                    ? `${formatDateTime(item.last_executed_at)} por ${item.last_executed_by?.full_name || "sistema"}`
                                    : "Sin ejecuciones registradas"}
                                </p>
                                {linkedSchedule ? (
                                  <p className="mt-1 text-[11px] text-slate-400">Calendario sincronizado #{linkedSchedule.id}</p>
                                ) : null}
                              </>
                            )}
                          </div>
                        );
                      })}

                      <div className="mt-3 space-y-3 rounded-xl border border-blue-100 bg-blue-50/40 p-3">
                        <p className="text-sm font-extrabold text-blue-700">Nueva tarea</p>
                        <TaskEditor
                          draft={newTaskDraft}
                          operativeOptions={operativeOptions}
                          onFieldChange={(field, value) => setTaskDraftField(area.id, field, value)}
                          onToggleDay={(day) => toggleTaskDay(area.id, day)}
                          onSave={() => addTask(area.id)}
                          onCancel={() => setNewTaskByArea((prev) => ({ ...prev, [area.id]: defaultTaskDraft }))}
                          busy={checklistSaving}
                          createMode
                        />
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {pagination.lastPage > 1 ? (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row">
          <p className="text-xs font-semibold text-slate-500">
            Pagina {pagination.currentPage} de {pagination.lastPage} ({pagination.total} registros)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={loading || pagination.currentPage <= 1}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(pagination.lastPage, prev + 1))}
              disabled={loading || pagination.currentPage >= pagination.lastPage}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TaskEditor({ draft, operativeOptions, onFieldChange, onToggleDay, onSave, onCancel, busy, createMode = false }) {
  return (
    <div className="space-y-3">
      <input
        className={inputBase}
        value={draft.item_name || ""}
        onChange={(event) => onFieldChange("item_name", event.target.value)}
        placeholder="Nombre de la tarea"
        disabled={busy}
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <select
          className={inputBase}
          value={draft.assigned_user_id || ""}
          onChange={(event) => onFieldChange("assigned_user_id", event.target.value)}
          disabled={busy}
        >
          <option value="">Sin responsable</option>
          {operativeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          className={inputBase}
          value={draft.status || "pending"}
          onChange={(event) => onFieldChange("status", event.target.value)}
          disabled={busy}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <select
          className={inputBase}
          value={draft.frequency_type || "weekly"}
          onChange={(event) => onFieldChange("frequency_type", event.target.value)}
          disabled={busy}
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
          value={draft.repeat_interval || 1}
          onChange={(event) => onFieldChange("repeat_interval", event.target.value)}
          disabled={busy}
        />
      </div>
      {draft.frequency_type === "weekly" ? (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {WEEK_DAYS.map((day) => {
            const checked = (draft.days_of_week || []).includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => onToggleDay(day.value)}
                className={[
                  "rounded-lg px-3 py-2 text-xs font-bold transition",
                  checked
                    ? "border border-indigo-600 bg-indigo-600 text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:border-indigo-400",
                ].join(" ")}
                disabled={busy}
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
          value={draft.start_date || ""}
          onChange={(event) => onFieldChange("start_date", event.target.value)}
          disabled={busy}
        />
        <input
          type="date"
          className={inputBase}
          value={draft.end_date || ""}
          onChange={(event) => onFieldChange("end_date", event.target.value)}
          disabled={busy}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={busy}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-70"
        >
          {createMode ? "Crear tarea" : "Guardar tarea"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-70"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function frequencyLabel(value) {
  return FREQUENCY_OPTIONS.find((item) => item.value === value)?.label || value || "-";
}

function statusLabel(value) {
  return STATUS_OPTIONS.find((item) => item.value === value)?.label || value || "-";
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-CO");
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
