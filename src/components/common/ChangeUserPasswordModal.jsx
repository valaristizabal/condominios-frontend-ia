import { useEffect, useState } from "react";

function ChangeUserPasswordModal({ open, loading, targetLabel, onCancel, onSubmit }) {
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setPassword("");
    setPasswordConfirmation("");
    setError("");
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const cleanPassword = String(password || "");
    const cleanConfirmation = String(passwordConfirmation || "");

    if (cleanPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (cleanPassword !== cleanConfirmation) {
      setError("La confirmación de contraseña no coincide.");
      return;
    }

    try {
      await onSubmit({
        password: cleanPassword,
        password_confirmation: cleanConfirmation,
      });
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible actualizar la contraseña."));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-4 sm:items-center">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl">
        <h3 className="text-lg font-extrabold text-slate-900">Cambiar contraseña</h3>
        <p className="mt-1 text-sm text-slate-500">
          Usuario: <span className="font-semibold text-slate-700">{targetLabel || "-"}</span>
        </p>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <Field
            label="Nueva contraseña"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <Field
            label="Confirmar contraseña"
            type="password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            required
          />

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

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        {...props}
        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />
    </label>
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

export default ChangeUserPasswordModal;
