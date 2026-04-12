import { useState } from "react";
import { resolveCondominiumLogo } from "../../../utils/condominiumBrand";

const INITIAL_FORM = {
  name: "",
  tenant_code: "",
  type: "",
  tower: "",
  floors: "",
  address: "",
  contact_info: "",
  expiration_date: "",
  is_active: true,
};

function resolveLogoPreview(initialValues) {
  return resolveCondominiumLogo(initialValues) || initialValues?.image_url || "";
}

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
    address: initialValues.address || "",
    contact_info: initialValues.contact_info || "",
    expiration_date: initialValues.expiration_date ? String(initialValues.expiration_date).slice(0, 10) : "",
    is_active: Boolean(initialValues.is_active),
  };
}

function CondominiumForm({ initialValues, loading, onCancel, onSubmit }) {
  const isEditing = Boolean(initialValues?.id);
  const [form, setForm] = useState(() => toFormValues(initialValues));
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(() => resolveLogoPreview(initialValues));
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    setForm((prev) => {
      const nextValue = type === "checkbox" ? checked : value;
      const next = {
        ...prev,
        [name]: nextValue,
      };

      if (name === "name" && !isEditing) {
        next.tenant_code = toTenantCode(nextValue);
      }

      return next;
    });
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (logoPreview && logoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview);
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const payload = {
      ...form,
      tenant_code: form.tenant_code || toTenantCode(form.name),
      floors: form.floors === "" ? null : Number(form.floors),
      type: form.type || null,
      tower: form.tower || null,
      address: form.address || null,
      contact_info: form.contact_info || null,
      expiration_date: form.expiration_date || null,
    };

    if (logoFile) {
      payload.logo = logoFile;
    }

    try {
      await onSubmit(payload);
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "No fue posible guardar la propiedad.";
      setError(message);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Field
        label="Nombre de la Propiedad"
        name="name"
        placeholder="Ej. Residencial Las Palmeras"
        value={form.name}
        onChange={handleChange}
        required
      />

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">Logo de la propiedad</span>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo de la propiedad" className="h-full w-full object-cover" />
            ) : (
              <BuildingIcon />
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-100 file:px-3 file:py-2 file:text-xs file:font-bold file:text-indigo-700 hover:file:bg-indigo-200"
          />
        </div>
      </label>

      <Field
        label="Tipo de Propiedad"
        name="type"
        placeholder="Residencial, Comercial, Mixto"
        value={form.type}
        onChange={handleChange}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Torres / Bloques"
          name="tower"
          placeholder="Ej. 2, 3, 4"
          value={form.tower}
          onChange={handleChange}
        />
        <Field
          label="Numero de Pisos"
          name="floors"
          type="number"
          min="1"
          placeholder="0"
          value={form.floors}
          onChange={handleChange}
        />
      </div>

      <Field
        label="Direccion Completa"
        name="address"
        placeholder="Calle, Numero, Ciudad, Estado"
        value={form.address}
        onChange={handleChange}
      />

      <Field
        label="Fecha de vencimiento"
        name="expiration_date"
        type="date"
        value={form.expiration_date}
        onChange={handleChange}
      />

      <TextArea
        label="Informacion de Contacto"
        name="contact_info"
        placeholder="Telefonos de administracion, correos, etc."
        value={form.contact_info}
        onChange={handleChange}
      />

      <label className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
        <span className="text-sm font-semibold text-slate-700">Propiedad activa</span>
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
          {loading ? "Guardando..." : "Guardar Propiedad"}
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

function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 fill-slate-300" aria-hidden="true">
      <path d="M3 21h18v-2h-2V3H5v16H3v2Zm4-2V5h10v14H7Zm2-10h2v2H9V9Zm4 0h2v2h-2V9Zm-4 4h2v2H9v-2Zm4 0h2v2h-2v-2Z" />
    </svg>
  );
}

function toTenantCode(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export default CondominiumForm;
