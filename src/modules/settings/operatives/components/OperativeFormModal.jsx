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
  contract_start_date: "",
  is_active: true,
};

function OperativeFormModal({ open, initialValues, roles = [], loading, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => buildInitialForm(initialValues));
  const [error, setError] = useState("");
  const isEditing = Boolean(initialValues);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

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
      const message =
        err?.response?.data?.message || err?.message || "No fue posible guardar el operativo.";
      setError(message);
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
              <Field
                label="Nombre completo"
                name="full_name"
                value={form.full_name ?? ""}
                onChange={handleChange}
                required
              />
              <Field
                label="Documento"
                name="document_number"
                value={form.document_number ?? ""}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Email"
                name="email"
                type="email"
                value={form.email ?? ""}
                onChange={handleChange}
                required
              />
              <Field
                label="Telefono"
                name="phone"
                value={form.phone ?? ""}
                onChange={handleChange}
              />
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
                <Field
                  label="Contrasena"
                  name="password"
                  type="password"
                  value={form.password ?? ""}
                  onChange={handleChange}
                  required
                />
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
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
              <Field
                label="Salario"
                name="salary"
                type="number"
                min="0"
                step="0.01"
                value={form.salary ?? ""}
                onChange={handleChange}
              />
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
            </div>

            <Field
              label="Inicio de contrato"
              name="contract_start_date"
              type="date"
              value={form.contract_start_date ?? ""}
              onChange={handleChange}
            />

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
    contract_start_date: initialValues.contract_start_date
      ? String(initialValues.contract_start_date).slice(0, 10)
      : "",
    is_active: Boolean(initialValues.is_active),
  };
}

export default OperativeFormModal;
