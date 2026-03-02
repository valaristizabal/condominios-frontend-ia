const Card = ({ children, className = "" }) => (
  <div
    className={[
      "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm",
      className,
    ].join(" ")}
  >
    {children}
  </div>
);

const SectionTitle = ({ icon, title, desc }) => (
  <div className="flex items-start gap-3">
    <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-sm font-extrabold text-slate-900">{title}</p>
      {desc ? <p className="mt-1 text-xs font-semibold text-slate-500">{desc}</p> : null}
    </div>
  </div>
);

const Label = ({ children }) => (
  <p className="text-sm font-semibold text-slate-700">{children}</p>
);

const Hint = ({ children }) => (
  <p className="text-xs font-semibold text-slate-400">{children}</p>
);

const inputBase =
  "mt-2 w-full h-12 rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none focus:ring-2 focus:ring-blue-200";

const textareaBase =
  "mt-2 w-full min-h-[110px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-200";

const PrimaryButton = ({ children, disabled, ...props }) => (
  <button
    {...props}
    disabled={disabled}
    className={[
      "w-full rounded-2xl py-4 text-sm font-extrabold shadow-xl transition",
      disabled
        ? "bg-slate-200 text-slate-500 cursor-not-allowed"
        : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99]",
    ].join(" ")}
  >
    {children}
  </button>
);

const GhostButton = ({ children, ...props }) => (
  <button
    {...props}
    className="text-xs font-extrabold text-rose-700 hover:text-rose-800"
    type="button"
  >
    {children}
  </button>
);

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-2 text-xs font-semibold text-red-600">{message}</p>;
}

export default function CorrespondenceFormModal({
  apartments = [],
  couriers = [],
  form,
  fileRef,
  signatureBoxRef,
  photoPreview,
  fieldErrors = {},
  canSubmit,
  submitting = false,
  onChange,
  onPickPhotoClick,
  onPickPhoto,
  onClearPhoto,
  onPackageTypeChange,
  onSubmit,
  onClearSignature,
}) {
  return (
    <Card>
      <SectionTitle
        icon="📮"
        title="Nueva correspondencia"
        desc="Captura evidencia, selecciona destino y registra la entrega."
      />

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Empresa de mensajería</Label>
            <select
              name="courier"
              value={form.courier}
              onChange={onChange}
              className={inputBase}
            >
              {couriers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <FieldError message={fieldErrors.courier_company} />
          </div>

          <div>
            <Label>Unidad destino</Label>
            <select
              name="unitId"
              value={form.unitId}
              onChange={onChange}
              className={inputBase}
            >
              <option value="">Seleccione unidad</option>
              {apartments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
            <FieldError message={fieldErrors.apartment_id} />
          </div>
        </div>

        <div>
          <Label>Tipo de paquete</Label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onPackageTypeChange("documento")}
              className={[
                "rounded-2xl border px-4 py-4 text-sm font-extrabold transition",
                form.packageType === "documento"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              📄 Documento
            </button>

            <button
              type="button"
              onClick={() => onPackageTypeChange("paquete")}
              className={[
                "rounded-2xl border px-4 py-4 text-sm font-extrabold transition",
                form.packageType === "paquete"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              📦 Paquete
            </button>
          </div>
          <FieldError message={fieldErrors.package_type} />
        </div>

        <div>
          <Label>Evidencia fotográfica</Label>
          <Hint>Para la demo puedes cargar una imagen desde tu computador.</Hint>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => onPickPhoto(event.target.files?.[0])}
          />

          <button
            type="button"
            onClick={onPickPhotoClick}
            className="mt-3 w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center hover:bg-slate-100 transition"
          >
            {photoPreview ? (
              <div className="space-y-3">
                <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <img
                    src={photoPreview}
                    alt="Evidencia"
                    className="h-48 w-full object-cover"
                  />
                </div>
                <p className="text-xs font-extrabold text-slate-700">
                  Cambiar fotografía
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                  📷
                </div>
                <p className="text-sm font-extrabold text-slate-900">
                  Tomar / Cargar fotografía
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  Toque aquí para activar cámara o cargar imagen
                </p>
              </div>
            )}
          </button>

          {photoPreview && (
            <div className="mt-2 flex justify-end">
              <GhostButton onClick={onClearPhoto}>Quitar foto</GhostButton>
            </div>
          )}
          <FieldError message={fieldErrors.evidence_photo} />
        </div>

        <div>
          <SectionTitle icon="✍️" title="Datos de entrega" />
          <div className="mt-4">
            <Label>Nombre del destinatario</Label>
            <input
              name="receiverName"
              value={form.receiverName}
              onChange={onChange}
              placeholder="Nombre completo"
              className={inputBase}
            />
            <FieldError message={fieldErrors.receiverName} />
          </div>

          <div className="mt-4">
            <Label>Firma de quien recibe</Label>
            <div
              ref={signatureBoxRef}
              className="mt-2 h-40 rounded-2xl border border-slate-200 bg-slate-50"
            />

            <div className="mt-2 flex justify-start">
              <GhostButton onClick={onClearSignature}>
                Limpiar firma
              </GhostButton>
            </div>
          </div>

          <div className="mt-4">
            <Label>Observaciones</Label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={onChange}
              placeholder="Notas adicionales (opcional)"
              className={textareaBase}
            />
          </div>
        </div>

        <PrimaryButton type="submit" disabled={!canSubmit || submitting}>
          {submitting ? "Registrando..." : "🧾 Registrar Entrega"}
        </PrimaryButton>

        {!canSubmit && (
          <p className="text-center text-xs font-semibold text-slate-400">
            Completa mensajería, unidad, tipo y destinatario para habilitar el registro.
          </p>
        )}
      </form>
    </Card>
  );
}
