import { useEffect, useRef, useState } from "react";

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

function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  disabled = false,
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedOption =
    options.find((option) => String(option.value) === String(value)) || null;

  const visibleOptions = options.filter((option) =>
    String(option.label || "")
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase())
  );

  useEffect(() => {
    if (!open) return undefined;
    const onOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [open]);

  useEffect(() => {
    if (!open) setSearchTerm("");
  }, [open]);

  return (
    <div ref={rootRef} className="relative mt-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={[
          "flex h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-left text-slate-900 outline-none focus:ring-2 focus:ring-blue-200",
          disabled ? "cursor-not-allowed bg-slate-100 text-slate-500" : "",
        ].join(" ")}
      >
        <span className={selectedOption ? "text-slate-900" : "text-slate-500"}>
          {selectedOption?.label || placeholder}
        </span>
        <span className="text-slate-400">{open ? "▲" : "▼"}</span>
      </button>

      {open ? (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 p-2">
            <input
              autoFocus
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {visibleOptions.length ? (
              visibleOptions.map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => {
                    onChange?.(option.value);
                    setOpen(false);
                  }}
                  className={[
                    "block w-full rounded-xl px-3 py-2 text-left text-sm transition",
                    String(option.value) === String(value)
                      ? "bg-blue-50 font-semibold text-blue-700"
                      : "text-slate-700 hover:bg-slate-100",
                  ].join(" ")}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-slate-500">Sin resultados</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function CorrespondenceFormModal({
  apartments = [],
  unitTypes = [],
  couriers = [],
  form,
  fileRef,
  photoPreview,
  fieldErrors = {},
  canSubmit,
  submitting = false,
  onChange,
  onCourierChange,
  onUnitTypeChange,
  onUnitChange,
  onPickPhotoClick,
  onPickPhoto,
  onClearPhoto,
  onPackageTypeChange,
  onReceiverTypeChange,
  onSubmit,
  onSignatureChange,
}) {
  const signatureCanvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const drawModeRef = useRef(null);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = Math.max(Math.floor(rect.width * ratio), 1);
    canvas.height = Math.max(Math.floor(rect.height * ratio), 1);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
  }, []);

  const getPoint = (event) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startDrawing = (event) => {
    event.preventDefault();
    drawModeRef.current = "pointer";
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (typeof canvas.setPointerCapture === "function") {
      canvas.setPointerCapture(event.pointerId);
    }

    const point = getPoint(event);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    isDrawingRef.current = true;
    setHasSignature(true);
  };

  const draw = (event) => {
    event.preventDefault();
    if (!isDrawingRef.current || drawModeRef.current !== "pointer") return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const point = getPoint(event);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const endDrawing = () => {
    if (!isDrawingRef.current || drawModeRef.current !== "pointer") return;
    isDrawingRef.current = false;
    drawModeRef.current = null;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    onSignatureChange?.(canvas.toDataURL("image/png"));
  };

  const startDrawingMouse = (event) => {
    event.preventDefault();
    if (drawModeRef.current && drawModeRef.current !== "mouse") return;
    drawModeRef.current = "mouse";
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const point = getPoint(event);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    isDrawingRef.current = true;
    setHasSignature(true);
  };

  const drawMouse = (event) => {
    event.preventDefault();
    if (!isDrawingRef.current || drawModeRef.current !== "mouse") return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const point = getPoint(event);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const endDrawingMouse = () => {
    if (!isDrawingRef.current || drawModeRef.current !== "mouse") return;
    isDrawingRef.current = false;
    drawModeRef.current = null;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    onSignatureChange?.(canvas.toDataURL("image/png"));
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    isDrawingRef.current = false;
    drawModeRef.current = null;
    setHasSignature(false);
    onSignatureChange?.("");
  };

  return (
    <Card>
      <SectionTitle
        icon="📮"
        title="Nueva correspondencia"
        desc="Captura evidencia, selecciona destino y registra la entrega."
      />

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
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
          <Label>Empresa de mensajería</Label>
          <SearchableSelect
            value={form.courier}
            options={couriers.map((c) => ({ value: c, label: c }))}
            placeholder="Seleccione empresa"
            searchPlaceholder="Buscar empresa..."
            onChange={onCourierChange}
          />
          <FieldError message={fieldErrors.courier_company} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Tipo de unidad</Label>
            <SearchableSelect
              value={form.unitTypeId}
              options={unitTypes}
              placeholder="Seleccione tipo"
              searchPlaceholder="Buscar tipo de unidad..."
              onChange={onUnitTypeChange}
            />
            <FieldError message={fieldErrors.unit_type_id} />
          </div>

          <div>
            <Label>Unidad destino</Label>
            <SearchableSelect
              value={form.unitId}
              options={apartments}
              placeholder={!form.unitTypeId ? "Primero selecciona tipo" : "Seleccione unidad"}
              searchPlaceholder="Buscar unidad..."
              disabled={!form.unitTypeId}
              onChange={onUnitChange}
            />
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
          <Label>¿Quién recibe?</Label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onReceiverTypeChange?.("seguridad")}
              className={[
                "rounded-2xl border px-4 py-4 text-sm font-extrabold transition",
                form.receiverType === "seguridad"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              Seguridad
            </button>

            <button
              type="button"
              onClick={() => onReceiverTypeChange?.("dueno")}
              className={[
                "rounded-2xl border px-4 py-4 text-sm font-extrabold transition",
                form.receiverType === "dueno"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              Dueño
            </button>
          </div>
          <FieldError message={fieldErrors.receiverType} />
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

          {form.receiverType === "dueno" ? (
            <div className="mt-4">
              <Label>Firma de quien recibe</Label>
              <canvas
                ref={signatureCanvasRef}
                className="mt-2 h-40 w-full touch-none rounded-2xl border border-slate-200 bg-slate-50 cursor-crosshair"
                style={{ touchAction: "none" }}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={endDrawing}
                onPointerCancel={endDrawing}
                onPointerLeave={endDrawing}
                onMouseDown={startDrawingMouse}
                onMouseMove={drawMouse}
                onMouseUp={endDrawingMouse}
                onMouseLeave={endDrawingMouse}
              />
              <FieldError message={fieldErrors.digital_signature || fieldErrors.signature} />

              <div className="mt-2 flex justify-start">
                <GhostButton onClick={clearSignature}>
                  Limpiar firma
                </GhostButton>
              </div>
              {!hasSignature ? (
                <p className="mt-2 text-xs font-semibold text-slate-400">
                  Firma obligatoria cuando recibe el dueño.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
              Si recibe seguridad, la firma no es obligatoria en este paso.
            </div>
          )}

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
