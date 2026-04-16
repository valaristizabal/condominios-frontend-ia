import { useState } from "react";

const EMPTY_FORM = {
  full_name: "",
  document_number: "",
  email: "",
  password: "",
  phone: "",
  birth_date: "",
  role_id: "",
  position: "",
  contract_type: "planta",
  salary: "",
  financial_institution: "",
  account_type: "ahorros",
  account_number: "",
  eps: "",
  arl: "",
  contract_start_date: "",
  is_active: true,
};

function OperativeFormModal({ open, initialValues, roles = [], loading, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => buildInitialForm(initialValues));
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const isEditing = Boolean(initialValues);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const nextValue = type === "checkbox" ? checked : value;

    setForm((prev) => ({
      ...prev,
      [name]: name === "phone" || name === "document_number" ? String(nextValue).replace(/\D/g, "") : nextValue,
    }));

    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    const nextFieldErrors = {};
    const today = new Date().toISOString().slice(0, 10);

    if (!String(form.full_name || "").trim()) nextFieldErrors.full_name = "El nombre es obligatorio.";
    if (!String(form.document_number || "").trim()) nextFieldErrors.document_number = "El documento es obligatorio.";
    if (!String(form.email || "").trim()) nextFieldErrors.email = "El correo es obligatorio.";
    if (!isEditing && !String(form.password || "").trim()) nextFieldErrors.password = "La contraseña es obligatoria.";
    if (!String(form.role_id || "").trim()) nextFieldErrors.role_id = "Debes seleccionar un cargo.";

    const phone = String(form.phone || "").trim();
    if (phone && !/^\d{10,15}$/.test(phone)) {
      nextFieldErrors.phone = "El celular debe contener entre 10 y 15 números.";
    }

    const salaryText = String(form.salary ?? "").trim();
    if (salaryText !== "" && !(Number(salaryText) > 0)) {
      nextFieldErrors.salary = "El salario debe ser mayor a cero.";
    }

    const contractStartDate = String(form.contract_start_date || "").trim();
    if (contractStartDate && contractStartDate > today) {
      nextFieldErrors.contract_start_date = "La fecha de inicio no puede ser futura.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    try {
      const payload = {
        ...form,
        role_id: form.role_id ? Number(form.role_id) : null,
        salary: form.salary === "" ? null : Number(form.salary),
      };

      if (isEditing) {
        delete payload.password;
      }

      await onSubmit(payload);
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
      setError(normalizeOperativeError(err, "No fue posible guardar el operativo."));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/45 p-4">
      <div className="flex min-h-full items-end justify-center sm:items-center">
        <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
          <h3 className="text-lg font-extrabold text-slate-900">
            {isEditing ? "Editar operativo" : "Nuevo operativo"}
          </h3>

          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Field
                  label="Nombre completo"
                  name="full_name"
                  value={form.full_name ?? ""}
                  onChange={handleChange}
                  required
                />
                <FieldError message={fieldErrors.full_name} />
              </div>
              <div>
                <Field
                  label="Documento"
                  name="document_number"
                  value={form.document_number ?? ""}
                  onChange={handleChange}
                  inputMode="numeric"
                  required
                />
                <FieldError message={fieldErrors.document_number} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Field
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email ?? ""}
                  onChange={handleChange}
                  required
                />
                <FieldError message={fieldErrors.email} />
              </div>
              <div>
                <Field
                  label="Celular"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  value={form.phone ?? ""}
                  onChange={handleChange}
                />
                <FieldError message={fieldErrors.phone} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Fecha de nacimiento"
                name="birth_date"
                type="date"
                value={form.birth_date ?? ""}
                onChange={handleChange}
              />
              {!isEditing ? (
                <div>
                  <Field
                    label="Contrasena"
                    name="password"
                    type="password"
                    value={form.password ?? ""}
                    onChange={handleChange}
                    required
                  />
                  <FieldError message={fieldErrors.password} />
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Cargo (rol)</span>
                  <select
                    name="role_id"
                    value={form.role_id ?? ""}
                    onChange={handleChange}
                    required
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">Selecciona un cargo</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </label>
                <FieldError message={fieldErrors.role_id} />
              </div>
              <Field
                label="Cargo interno"
                name="position"
                value={form.position ?? ""}
                onChange={handleChange}
                placeholder="Opcional"
              />
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Tipo de contrato</span>
              <select
                name="contract_type"
                value={form.contract_type ?? "planta"}
                onChange={handleChange}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="planta">planta</option>
                <option value="contratista">contratista</option>
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Field
                  label="Salario"
                  name="salary"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.salary ?? ""}
                  onChange={handleChange}
                />
                <FieldError message={fieldErrors.salary} />
              </div>
              <Field
                label="Institucion financiera"
                name="financial_institution"
                value={form.financial_institution ?? ""}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Tipo de cuenta</span>
                <select
                  name="account_type"
                  value={form.account_type ?? "ahorros"}
                  onChange={handleChange}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="ahorros">ahorros</option>
                  <option value="corriente">corriente</option>
                </select>
              </label>
              <Field
                label="Numero de cuenta"
                name="account_number"
                value={form.account_number ?? ""}
                onChange={handleChange}
              />
              <FieldError message={fieldErrors.account_number} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="EPS"
                name="eps"
                value={form.eps ?? ""}
                onChange={handleChange}
              />
              <Field
                label="ARL"
                name="arl"
                value={form.arl ?? ""}
                onChange={handleChange}
              />
            </div>

            <div>
              <Field
                label="Inicio de contrato"
                name="contract_start_date"
                type="date"
                value={form.contract_start_date ?? ""}
                onChange={handleChange}
              />
              <FieldError message={fieldErrors.contract_start_date} />
            </div>

            <label className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm font-semibold text-slate-700">Activo</span>
              <input
                type="checkbox"
                name="is_active"
                checked={Boolean(form.is_active)}
                onChange={handleChange}
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
                className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
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

function FieldError({ message }) {
  if (!message) return null;

  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>;
}

function buildInitialForm(initialValues) {
  if (!initialValues) return EMPTY_FORM;

  return {
    full_name: initialValues.user?.full_name ?? "",
    document_number: initialValues.user?.document_number ?? "",
    email: initialValues.user?.email ?? "",
    password: "",
    phone: initialValues.user?.phone ?? "",
    birth_date: initialValues.user?.birth_date ? String(initialValues.user.birth_date).slice(0, 10) : "",
    role_id: initialValues.role?.id ? String(initialValues.role.id) : "",
    position: initialValues.position ?? "",
    contract_type: initialValues.contract_type ?? "planta",
    salary: initialValues.salary ?? "",
    financial_institution: initialValues.financial_institution ?? "",
    account_type: initialValues.account_type ?? "ahorros",
    account_number: initialValues.account_number ?? "",
    eps: initialValues.eps ?? "",
    arl: initialValues.arl ?? "",
    contract_start_date: initialValues.contract_start_date
      ? String(initialValues.contract_start_date).slice(0, 10)
      : "",
    is_active: Boolean(initialValues.is_active),
  };
}

function normalizeOperativeError(err, fallbackMessage) {
  const responseData = err?.response?.data;
  const errors = responseData?.errors;

  if (errors && typeof errors === "object") {
    const firstFieldErrors = Object.values(errors).find(
      (fieldErrors) => Array.isArray(fieldErrors) && fieldErrors.length > 0
    );
    if (firstFieldErrors) {
      return translateOperativeValidationMessage(String(firstFieldErrors[0]));
    }
  }

  const rawMessage = responseData?.message || err?.message || fallbackMessage;
  return translateOperativeValidationMessage(String(rawMessage));
}

function extractFieldErrors(err) {
  const errors = err?.response?.data?.errors;
  if (!errors || typeof errors !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [field, Array.isArray(messages) ? messages[0] : ""])
  );
}

function translateOperativeValidationMessage(message) {
  const normalized = String(message).trim().toLowerCase();

  if (normalized.includes("email has already been taken")) {
    return "Este correo ya está registrado en el sistema.";
  }

  if (normalized.includes("document_number has already been taken")) {
    return "Ya existe un operativo con este número de documento.";
  }

  return message;
}

export default OperativeFormModal;
