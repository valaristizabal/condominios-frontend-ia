import { useEffect, useMemo, useState } from "react";

function CleaningAreaFormModal({ open, initialValues, loading, onCancel, onSubmit }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");

  const isEditing = useMemo(() => Boolean(initialValues), [initialValues]);

  useEffect(() => {
    if (!open) return;

    setName(initialValues?.name ?? "");
    setDescription(initialValues?.description ?? "");
    setIsActive(
      typeof initialValues?.is_active === "boolean" ? Boolean(initialValues.is_active) : true
    );
    setError("");
  }, [initialValues, open]);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const cleanName = String(name || "").trim();
    if (!cleanName) {
      setError("El nombre del área es obligatorio.");
      return;
    }

    if (cleanName.length > 255) {
      setError("El nombre no puede superar 255 caracteres.");
      return;
    }

    try {
      await onSubmit({
        name: cleanName,
        description: String(description || "").trim() || null,
        is_active: isActive,
      });
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible guardar el área de aseo."));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
        <h3 className="text-lg font-extrabold text-slate-900">
          {isEditing ? "Editar área de aseo" : "Nueva área de aseo"}
        </h3>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Nombre</span>
            <input
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={255}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="Ej: Lobby principal"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Descripción</span>
            <textarea
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="Opcional"
            />
          </label>

          <label className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <span className="text-sm font-semibold text-slate-700">Activo</span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-300"
            />
          </label>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-70"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-70"
            >
              Cancelar
            </button>
          </div>
        </form>
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
      return translateValidationMessage(String(firstFieldErrors[0]));
    }
  }

  const rawMessage = String(responseData?.message || err?.message || fallbackMessage || "");
  const normalizedMessage = rawMessage.toLowerCase();

  if (
    normalizedMessage.includes("duplicate entry") ||
    normalizedMessage.includes("integrity constraint violation") ||
    normalizedMessage.includes("already exists")
  ) {
    const keyMatch = rawMessage.match(/for key ['"]?([^'"]+)['"]?/i);
    const keyName = String(keyMatch?.[1] || "");
    const normalizedKey = keyName.split(".").pop()?.replace(/_unique$/i, "") || "";
    const fieldName = normalizedKey.split("_").filter(Boolean).pop() || "";
    const fieldLabel = resolveFieldLabel(fieldName);

    if (fieldLabel) {
      return "Ya existe un registro con ese " + fieldLabel + ".";
    }

    return "Ya existe un registro con esos datos.";
  }

  return rawMessage || fallbackMessage;
}

function translateValidationMessage(message) {
  const rawMessage = String(message || "");
  const trimmedMessage = rawMessage.trim();
  const lowerMessage = trimmedMessage.toLowerCase();

  const takenMatch = trimmedMessage.match(/^the\s+(.+?)\s+has already been taken\.?$/i);
  if (takenMatch) {
    const fieldLabel = resolveFieldLabel(takenMatch[1]);
    return fieldLabel
      ? "Ya existe un registro con ese " + fieldLabel + "."
      : "Ya existe un registro con esos datos.";
  }

  const requiredMatch = trimmedMessage.match(/^the\s+(.+?)\s+field is required\.?$/i);
  if (requiredMatch) {
    const fieldLabel = resolveFieldLabel(requiredMatch[1]);
    return fieldLabel
      ? "El campo " + fieldLabel + " es obligatorio."
      : "Este campo es obligatorio.";
  }

  const emailMatch = trimmedMessage.match(/^the\s+(.+?)\s+must be a valid email address\.?$/i);
  if (emailMatch) {
    const fieldLabel = resolveFieldLabel(emailMatch[1]);
    return fieldLabel
      ? "El campo " + fieldLabel + " debe ser un correo valido."
      : "Debes ingresar un correo valido.";
  }

  return rawMessage;
}

function resolveFieldLabel(fieldName) {
  const normalizedField = String(fieldName || "").toLowerCase();

  const labels = {
    name: "nombre",
    email: "correo",
    phone: "telefono",
    mobile: "telefono",
    number: "numero",
    code: "codigo",
    asset_code: "codigo",
    tower: "torre",
    plate: "placa",
    description: "descripcion",
  };

  const cleanField = normalizedField.replace(/_/g, " ").trim();
  return labels[normalizedField] || cleanField;
}

export default CleaningAreaFormModal;
