import { useEffect, useMemo, useState } from "react";
import { useCleaningAreas } from "./useCleaningAreas";

const inputBase =
  "w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200";

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

function CleaningAreasPage() {
  const {
    cleaningAreas,
    checklistsByArea,
    loading,
    saving,
    checklistSaving,
    error,
    hasTenantContext,
    createCleaningArea,
    updateCleaningArea,
    toggleCleaningArea,
    fetchChecklistByArea,
    addChecklistItem,
    removeChecklistItem,
  } = useCleaningAreas();

  const [newAreaName, setNewAreaName] = useState("");
  const [editingAreaId, setEditingAreaId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [checklistAreaId, setChecklistAreaId] = useState(null);
  const [newTaskTextByArea, setNewTaskTextByArea] = useState({});
  const [localError, setLocalError] = useState("");
  const [success, setSuccess] = useState("");

  const checklist = useMemo(() => {
    if (!checklistAreaId) return [];
    return checklistsByArea[checklistAreaId] || [];
  }, [checklistAreaId, checklistsByArea]);

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
      await createCleaningArea({
        name: cleanName,
      });
      setNewAreaName("");
      setSuccess("Area creada correctamente.");
    } catch (err) {
      setLocalError(normalizeApiError(err, "No fue posible crear el area."));
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
      setSuccess("Area actualizada correctamente.");
    } catch (err) {
      setLocalError(normalizeApiError(err, "No fue posible actualizar el area."));
    }
  };

  const onToggleActive = async (area) => {
    setLocalError("");
    setSuccess("");

    try {
      await toggleCleaningArea(area.id);
      setSuccess(area.is_active ? "Area desactivada correctamente." : "Area activada correctamente.");
    } catch (err) {
      setLocalError(normalizeApiError(err, "No fue posible cambiar estado del area."));
    }
  };

  const openChecklist = async (areaId) => {
    if (checklistAreaId === areaId) {
      setChecklistAreaId(null);
      return;
    }
    setChecklistAreaId(areaId);
  };

  const addTask = async (areaId) => {
    const cleanTask = String(newTaskTextByArea[areaId] || "").trim();
    if (!cleanTask) return;

    setLocalError("");
    setSuccess("");

    try {
      await addChecklistItem(areaId, { item_name: cleanTask });
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
      await removeChecklistItem(areaId, taskId);
      setSuccess("Tarea eliminada del checklist.");
    } catch (err) {
      setLocalError(normalizeApiError(err, "No fue posible eliminar tarea."));
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <div className="bg-white border-b border-gray-100">
        <div className="px-4 pt-4 pb-3 flex items-start gap-3 max-w-3xl mx-auto">
          <button
            type="button"
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center mt-0.5"
            onClick={() => window.history.back()}
          >
            {"←"}
          </button>

          <div>
            <h1 className="text-xl font-extrabold text-blue-700">Parametrizacion de Aseo</h1>
            <div className="text-xs tracking-widest text-gray-500 font-bold">AJUSTES DE CONDOMINIO</div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-10 max-w-3xl mx-auto">
        <div className="pt-6">
          <h2 className="text-3xl font-extrabold text-gray-900">Gestion de Areas</h2>
          <p className="text-gray-600 mt-2">
            Configure las zonas y protocolos de limpieza de su copropiedad.
          </p>
        </div>

        {!hasTenantContext ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            No hay condominio activo para gestionar areas de aseo.
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
              +
            </div>
            <div className="text-lg font-extrabold text-gray-900">Nueva Area</div>
          </div>

          <div className="mt-4 space-y-2">
            <Label>Nombre del area</Label>
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
            Guardar Area
          </button>
        </div>

        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 text-sm font-semibold text-gray-500">
              Cargando areas...
            </div>
          ) : (
            cleaningAreas.map((area) => {
              const isEditing = editingAreaId === area.id;
              const currentTaskText = newTaskTextByArea[area.id] || "";

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
                        {"✎"}
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

                          {checklist.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center bg-white p-3 rounded-xl mb-2 shadow-sm"
                            >
                              <span>{item.item_name}</span>
                              <button
                                onClick={() => deleteTask(area.id, item.id)}
                                disabled={checklistSaving}
                                className="text-red-500 font-bold disabled:opacity-70"
                              >
                                Eliminar
                              </button>
                            </div>
                          ))}

                          <div className="flex gap-2 mt-3">
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
                              disabled={checklistSaving}
                            />
                            <button
                              onClick={() => addTask(area.id)}
                              disabled={checklistSaving}
                              className="bg-blue-600 text-white px-4 rounded-2xl font-bold disabled:opacity-70"
                            >
                              +
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
