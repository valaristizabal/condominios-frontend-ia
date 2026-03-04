import { useMemo, useRef } from "react";
import { Camera, Car, HeartCrack, MessageSquare, Shield, TriangleAlert, X } from "lucide-react";

const inputBase =
  "w-full h-14 rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none focus:ring-2 focus:ring-blue-200";

const SectionTitle = ({ icon, title, eyebrow }) => (
  <div className="flex items-start gap-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">{icon}</div>
    <div>
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{eyebrow}</p> : null}
      <h2 className="mt-0.5 text-lg font-bold text-slate-900">{title}</h2>
    </div>
  </div>
);

const Label = ({ children }) => <label className="text-sm font-semibold text-slate-700">{children}</label>;

const IncidentOption = ({ icon, label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full border rounded-2xl px-4 py-4 flex items-center justify-between transition ${
      selected ? "border-blue-600 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-100"
    }`}
  >
    <div className="flex items-center gap-3">
      <div className="text-xl">{icon}</div>
      <div className="text-base font-semibold text-slate-900">{label}</div>
    </div>
    <div
      className={`w-6 h-6 rounded-full border flex items-center justify-center ${
        selected ? "border-blue-600" : "border-slate-300"
      }`}
    >
      {selected ? <div className="w-3 h-3 rounded-full bg-blue-600" /> : null}
    </div>
  </button>
);

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs font-semibold text-red-600">{message}</p>;
}

function VehicleIncidentFormModal({
  form,
  setField,
  setPhotoList,
  vehicleTypes = [],
  apartments = [],
  fieldErrors = {},
  submitting = false,
  onSubmit,
  clearFieldError,
}) {
  const fileRef = useRef(null);

  const uniqueUnitTypes = useMemo(
    () =>
      [
        ...new Map(
          apartments.map((apt) => [apt?.unit_type?.id || apt?.unitType?.id, apt?.unit_type?.name || apt?.unitType?.name])
        ).values(),
      ].filter(Boolean),
    [apartments]
  );

  const pickPhoto = () => fileRef.current?.click();

  const onPhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoList((prev) => [...prev, { file, src: String(reader.result || "") }]);
      clearFieldError?.("evidence");
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const removePhotoAt = (idx) => {
    setPhotoList((prev) => prev.filter((_, index) => index !== idx));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionTitle icon={<Car className="h-5 w-5" />} eyebrow="Registro" title="Información del Vehículo" />

        <div className="space-y-2">
          <Label>Tipo de vehículo</Label>
          <select
            className={inputBase + " py-3"}
            value={form.tipoVehiculo}
            onChange={(event) => {
              setField("tipoVehiculo", event.target.value);
            }}
          >
            <option value="">Seleccione tipo</option>
            {vehicleTypes.map((type) => (
              <option key={type.id} value={String(type.id)}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Placa del vehículo</Label>
          <input
            className={inputBase}
            placeholder="ABC-123"
            value={form.placa}
            onChange={(event) => {
              setField("placa", event.target.value);
              clearFieldError?.("plate");
            }}
          />
          <FieldError message={fieldErrors.plate} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Tipo de unidad</Label>
            <select
              className={inputBase + " py-3"}
              value={form.tipoUnidad}
              onChange={(event) => {
                setField("tipoUnidad", event.target.value);
                setField("numeroUnidad", "");
              }}
            >
              <option value="">Seleccione tipo</option>
              {uniqueUnitTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Número</Label>
            <select
              className={inputBase + " py-3"}
              value={form.numeroUnidad}
              onChange={(event) => {
                setField("numeroUnidad", event.target.value);
                clearFieldError?.("apartment_id");
              }}
            >
              <option value="">Seleccione unidad</option>
              {apartments
                .filter((apartment) => (apartment?.unit_type?.name || apartment?.unitType?.name) === form.tipoUnidad)
                .map((apartment) => (
                  <option key={apartment.id} value={String(apartment.id)}>
                    {apartment.number}
                  </option>
                ))}
            </select>
            <FieldError message={fieldErrors.apartment_id} />
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionTitle icon={<TriangleAlert className="h-5 w-5" />} eyebrow="Clasificación" title="Tipo de Novedad" />

        <IncidentOption
          icon={<Shield className="h-5 w-5" />}
          label="Robo"
          selected={form.tipoNovedad === "ROBO"}
          onClick={() => {
            setField("tipoNovedad", "ROBO");
            clearFieldError?.("incident_type");
          }}
        />
        <IncidentOption
          icon={<HeartCrack className="h-5 w-5" />}
          label="Daño"
          selected={form.tipoNovedad === "DANIO"}
          onClick={() => {
            setField("tipoNovedad", "DANIO");
            clearFieldError?.("incident_type");
          }}
        />
        <IncidentOption
          icon="…"
          label="Otro"
          selected={form.tipoNovedad === "OTRO"}
          onClick={() => {
            setField("tipoNovedad", "OTRO");
            clearFieldError?.("incident_type");
          }}
        />
        <FieldError message={fieldErrors.incident_type} />
      </div>

      <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionTitle icon={<MessageSquare className="h-5 w-5" />} eyebrow="Detalle" title="Observaciones Generales" />

        <textarea
          className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Describa los detalles..."
          value={form.observaciones}
          onChange={(event) => {
            setField("observaciones", event.target.value);
            clearFieldError?.("observations");
          }}
        />
        <FieldError message={fieldErrors.observations} />
      </div>

      <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <SectionTitle icon={<Camera className="h-5 w-5" />} eyebrow="Soporte" title="Evidencia Fotográfica" />

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />

        <div className="flex gap-3 overflow-x-auto">
          <button
            type="button"
            onClick={pickPhoto}
            className="flex h-[96px] min-w-[120px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100"
          >
            <Camera className="h-6 w-6 text-slate-400" />
            <div className="text-xs font-extrabold text-slate-700">AÑADIR</div>
          </button>

          {form.photoList.map((photoItem, idx) => (
            <div key={idx} className="relative h-[96px] min-w-[120px] overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <img src={photoItem.src} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhotoAt(idx)}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <FieldError message={fieldErrors.evidence} />
      </div>

      <div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-blue-600 py-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Reportando..." : "Reportar Novedad"}
        </button>
        <p className="mt-3 text-center text-xs font-semibold text-slate-500">
          Completa los campos para registrar la novedad con evidencia.
        </p>
      </div>
    </form>
  );
}

export default VehicleIncidentFormModal;

