import { useState } from "react";

const INITIAL_FORM = {
  name: "",
  tenant_code: "",
  type: "",
  tower: "",
  floors: "",
  common_areas: "",
  address: "",
  contact_info: "",
  is_active: true,
};

function toFormValues(initialValues) {
  if (!initialValues) {
    return INITIAL_FORM;
  }

  return {
    name: initialValues.name || "",
    tenant_code: initialValues.tenant_code || "",
    type: initialValues.type || "",
    tower: initialValues.tower || "",
    floors: initialValues.floors ?? "",
    common_areas: initialValues.common_areas || "",
    address: initialValues.address || "",
    contact_info: initialValues.contact_info || "",
    is_active: Boolean(initialValues.is_active),
  };
}

function CondominiumForm({ initialValues, loading, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => toFormValues(initialValues));
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const payload = {
      ...form,
      floors: form.floors === "" ? null : Number(form.floors),
      type: form.type || null,
      tower: form.tower || null,
      common_areas: form.common_areas || null,
      address: form.address || null,
      contact_info: form.contact_info || null,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "No fue posible guardar el condominio.";
      setError(message);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Field
        label="Nombre del Condominio"
        name="name"
        placeholder="Ej. Residencial Las Palmeras"
        value={form.name}
        onChange={handleChange}
        required
      />

      <Field
        label="Tenant Code"
        name="tenant_code"
        placeholder="ej-residencial-laspalmeras"
        value={form.tenant_code}
        onChange={handleChange}
        required
      />

      <Field
        label="Tipo de Condominio"
        name="type"
        placeholder="Residencial, Comercial, Mixto"
        value={form.type}
        onChange={handleChange}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Torres / Bloques"
          name="tower"
          placeholder="Ej. Torre A, Torre B"
          value={form.tower}
          onChange={handleChange}
        />
        <Field
          label="Número de Pisos"
          name="floors"
          type="number"
          min="1"
          placeholder="0"
          value={form.floors}
          onChange={handleChange}
        />
      </div>

      <TextArea
        label="Áreas Comunes"
        name="common_areas"
        placeholder="Describe áreas comunes del condominio..."
        value={form.common_areas}
        onChange={handleChange}
      />

      <Field
        label="Dirección Completa"
        name="address"
        placeholder="Calle, Número, Ciudad, Estado"
        value={form.address}
        onChange={handleChange}
      />

      <TextArea
        label="Información de Contacto"
        name="contact_info"
        placeholder="Teléfonos de administración, correos, etc."
        value={form.contact_info}
        onChange={handleChange}
      />

      <label className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
        <span className="text-sm font-semibold text-slate-700">Condominio activo</span>
        <input
          type="checkbox"
          name="is_active"
          checked={form.is_active}
          onChange={handleChange}
          className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-300"
        />
      </label>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-xl bg-[#174abf] px-4 py-3 text-sm font-bold text-white hover:bg-[#123ea3] disabled:opacity-70"
        >
          {loading ? "Guardando..." : "Guardar Condominio"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
        >
          Cancelar
        </button>
      </div>
    </form>
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

function TextArea({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        {...props}
        rows={3}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  );
}

export default CondominiumForm;
