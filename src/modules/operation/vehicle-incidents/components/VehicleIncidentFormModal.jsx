import { useMemo, useRef } from "react";
import { Camera, Car, HeartCrack, MessageSquare, MoreHorizontal, Shield, TriangleAlert, X } from "lucide-react";
import SearchableSelect from "../../../../components/common/SearchableSelect";
const inputBase =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

const SectionTitle = ({ icon, title, eyebrow }) => (
  <div className="flex items-start gap-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">{icon}</div>
    <div>
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{eyebrow}</p> : null}
      <h2 className="mt-0.5 text-base font-bold text-slate-900">{title}</h2>
    </div>
  </div>
);

const Label = ({ children }) => <label className="text-sm font-semibold text-slate-700">{children}</label>;

const IncidentOption = ({ icon, label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition",
      selected ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50",
    ].join(" ")}
  >
    <div className="flex items-center gap-3">
      <div className="text-slate-600">{icon}</div>
      <div className="text-sm font-semibold text-slate-900">{label}</div>
    </div>
    <div
      className={[
        "flex h-5 w-5 items-center justify-center rounded-full border",
        selected ? "border-blue-600" : "border-slate-300",
      ].join(" ")}
    >
      {selected ? <div className="h-2.5 w-2.5 rounded-full bg-blue-600" /> : null}
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
          apartments.map((apartment) => [
            apartment?.unit_type?.name || apartment?.unitType?.name,
            apartment?.unit_type?.name || apartment?.unitType?.name,
          ])
        ).values(),
      ].filter(Boolean),
    [apartments]
  );

  const filteredApartments = useMemo(
    () =>
      apartments.filter(
        (apartment) =>
          String(apartment?.unit_type?.name || apartment?.unitType?.name || "") === String(form.tipoUnidad || "")
      ),
    [apartments, form.tipoUnidad]
  );

  const pickPhoto = () => fileRef.current?.click();

  const onPhotoChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoList((prev) => [...prev, { file, src: String(reader.result || "") }]);
      };

      reader.readAsDataURL(file);
    });

    clearFieldError?.("evidence");
    clearFieldError?.("evidences");
    event.target.value = "";
  };

  const removePhotoAt = (idx) => {
    setPhotoList((prev) => prev.filter((_, index) => index !== idx));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <SectionTitle icon={<Car className="h-5 w-5" />} eyebrow="Registro" title="Información del vehículo" />

        <div className="space-y-2">
          <Label>Tipo de vehículo</Label>
          <SearchableSelect
            value={form.tipoVehiculo}
            options={vehicleTypes.map((type) => ({
              value: String(type.id),
              label: type.name,
            }))}
            placeholder="Seleccione tipo"
            searchPlaceholder="Buscar tipo..."
            onChange={(value) => setField("tipoVehiculo", value)}
          />
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
            <SearchableSelect
              value={form.tipoUnidad}
              options={uniqueUnitTypes.map((type) => ({
                value: type,
                label: type,
              }))}
              placeholder="Seleccione tipo"
              searchPlaceholder="Buscar tipo..."
              onChange={(value) => {
                setField("tipoUnidad", value);
                setField("numeroUnidad", "");
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Número</Label>
            <SearchableSelect
              value={form.numeroUnidad}
              options={filteredApartments.map((apartment) => ({
                value: String(apartment.id),
                label: apartment.number,
              }))}
              disabled={!form.tipoUnidad}
              placeholder={!form.tipoUnidad ? "Primero seleccione tipo" : "Seleccione unidad"}
              searchPlaceholder="Buscar unidad..."
              onChange={(value) => {
                setField("numeroUnidad", value);
                clearFieldError?.("apartment_id");
              }}
            />
            <FieldError message={fieldErrors.apartment_id} />
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <SectionTitle icon={<TriangleAlert className="h-5 w-5" />} eyebrow="Clasificación" title="Tipo de novedad" />

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
          icon={<MoreHorizontal className="h-5 w-5" />}
          label="Otro"
          selected={form.tipoNovedad === "OTRO"}
          onClick={() => {
            setField("tipoNovedad", "OTRO");
            clearFieldError?.("incident_type");
          }}
        />
        {form.tipoNovedad === "OTRO" ? (
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <Label>¿Cuál otro?</Label>
            <input
              className={inputBase}
              placeholder="Escriba el tipo de novedad..."
              value={form.detalleOtro || ""}
              onChange={(event) => setField("detalleOtro", event.target.value)}
            />
          </div>
        ) : null}
        <FieldError message={fieldErrors.incident_type} />
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <SectionTitle icon={<MessageSquare className="h-5 w-5" />} eyebrow="Detalle" title="Observaciones generales" />

        <textarea
          className="min-h-[130px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          placeholder="Describa los detalles..."
          value={form.observaciones}
          onChange={(event) => {
            setField("observaciones", event.target.value);
            clearFieldError?.("observations");
          }}
        />
        <FieldError message={fieldErrors.observations} />
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <SectionTitle icon={<Camera className="h-5 w-5" />} eyebrow="Soporte" title="Evidencia fotográfica" />

        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onPhotoChange} />

        <div className="flex gap-3 overflow-x-auto">
          <button
            type="button"
            onClick={pickPhoto}
            className="flex h-24 min-w-[112px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
          >
            <Camera className="mb-1 h-5 w-5 text-slate-500" />
            Añadir
          </button>

          {form.photoList.map((photoItem, idx) => (
            <div key={idx} className="relative h-24 min-w-[112px] overflow-hidden rounded-xl border border-slate-200 bg-white">
              <img src={photoItem.src} alt="Evidencia" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhotoAt(idx)}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <FieldError message={fieldErrors.evidence || fieldErrors.evidences} />
      </section>

      <div className="flex flex-col items-center">
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-rose-600 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:px-6"
        >
          {submitting ? "Reportando..." : "Reportar Novedad con Vehículo"}
        </button>
        <p className="mt-2 text-center text-xs font-semibold text-slate-500">
          Completa los campos para registrar la novedad con evidencia.
        </p>
      </div>
    </form>
  );
}

export default VehicleIncidentFormModal;
