import { useMemo, useRef } from "react";

const inputBase =
  "w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200";

const SectionTitle = ({ icon, title }) => (
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700">{icon}</div>
    <h2 className="text-lg font-bold text-gray-900">{title}</h2>
  </div>
);

const Label = ({ children }) => <label className="text-sm text-gray-700 font-medium">{children}</label>;

const IncidentOption = ({ icon, label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full border rounded-2xl px-4 py-4 flex items-center justify-between transition ${
      selected ? "border-blue-600 bg-white shadow-sm" : "border-gray-200 bg-white hover:bg-gray-50"
    }`}
  >
    <div className="flex items-center gap-3">
      <div className="text-xl">{icon}</div>
      <div className="text-base font-semibold text-gray-900">{label}</div>
    </div>
    <div
      className={`w-6 h-6 rounded-full border flex items-center justify-center ${
        selected ? "border-blue-600" : "border-gray-300"
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
    <form onSubmit={onSubmit} className="px-4 max-w-3xl mx-auto space-y-6">
      <div className="pt-6 space-y-4">
        <SectionTitle icon="🚙" title="Información del Vehículo" />

        <div className="space-y-2">
          <Label>Tipo de vehículo</Label>
          <select
            className={inputBase}
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de unidad</Label>
            <select
              className={inputBase}
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
              className={inputBase}
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

      <div className="space-y-3">
        <SectionTitle icon="⚠️" title="Tipo de Novedad" />

        <IncidentOption
          icon="🛡️"
          label="Robo"
          selected={form.tipoNovedad === "ROBO"}
          onClick={() => {
            setField("tipoNovedad", "ROBO");
            clearFieldError?.("incident_type");
          }}
        />
        <IncidentOption
          icon="💔"
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

      <div className="space-y-3">
        <SectionTitle icon="📝" title="Observaciones Generales" />

        <textarea
          className={`${inputBase} min-h-[140px]`}
          placeholder="Describa los detalles..."
          value={form.observaciones}
          onChange={(event) => {
            setField("observaciones", event.target.value);
            clearFieldError?.("observations");
          }}
        />
        <FieldError message={fieldErrors.observations} />
      </div>

      <div className="space-y-3">
        <SectionTitle icon="📷" title="Evidencia Fotográfica" />

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />

        <div className="flex gap-3 overflow-x-auto">
          <button
            type="button"
            onClick={pickPhoto}
            className="min-w-[120px] h-[96px] border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100"
          >
            <div className="text-2xl text-gray-400">📸</div>
            <div className="text-xs font-extrabold text-gray-700">AÑADIR</div>
          </button>

          {form.photoList.map((photoItem, idx) => (
            <div key={idx} className="relative min-w-[120px] h-[96px] rounded-2xl overflow-hidden border border-gray-200">
              <img src={photoItem.src} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhotoAt(idx)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <FieldError message={fieldErrors.evidence} />
      </div>

      <div className="fixed left-0 right-0 bottom-6 z-50 flex justify-center px-4">
        <button
          type="submit"
          disabled={submitting}
          className="w-full max-w-3xl bg-blue-600 text-white rounded-2xl py-4 font-extrabold shadow-2xl hover:bg-blue-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {submitting ? "Reportando..." : "Reportar Novedad"}
        </button>
      </div>
    </form>
  );
}

export default VehicleIncidentFormModal;
