import { useEffect, useMemo, useRef, useState } from "react";

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-2 text-xs font-semibold text-red-600">{message}</p>;
}

export default function DeliveryModal({
  open = false,
  item = null,
  residents = [],
  loading = false,
  fieldErrors = {},
  onClose,
  onSubmit,
  clearFieldError,
}) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const drawModeRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [residentReceiverId, setResidentReceiverId] = useState("");

  useEffect(() => {
    if (!open) return;

    const canvas = canvasRef.current;
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
    isDrawingRef.current = false;
    setIsDrawing(false);
    setHasSignature(false);
    setResidentReceiverId("");
  }, [open]);

  const title = useMemo(
    () => `${item?.courier || "Mensajería"} • ${item?.unit || "Unidad"}`,
    [item]
  );

  if (!open) return null;

  const getPoint = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const touch = event.touches?.[0] || event.changedTouches?.[0];
    const clientX = touch ? touch.clientX : event.clientX;
    const clientY = touch ? touch.clientY : event.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (event) => {
    event.preventDefault();
    drawModeRef.current = "pointer";
    const canvas = canvasRef.current;
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
    setIsDrawing(true);
    setHasSignature(true);
    clearFieldError?.("digital_signature");
  };

  const draw = (event) => {
    event.preventDefault();
    if (!isDrawingRef.current || drawModeRef.current !== "pointer") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const point = getPoint(event);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const endDrawing = (event) => {
    event?.preventDefault?.();
    if (!isDrawingRef.current || drawModeRef.current !== "pointer") return;
    isDrawingRef.current = false;
    drawModeRef.current = null;
    setIsDrawing(false);
  };

  const startDrawingMouse = (event) => {
    event.preventDefault();
    if (drawModeRef.current && drawModeRef.current !== "mouse") return;

    drawModeRef.current = "mouse";

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const point = getPoint(event);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    isDrawingRef.current = true;
    setIsDrawing(true);
    setHasSignature(true);
    clearFieldError?.("digital_signature");
  };

  const drawMouse = (event) => {
    event.preventDefault();
    if (!isDrawingRef.current || drawModeRef.current !== "mouse") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const point = getPoint(event);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const endDrawingMouse = (event) => {
    event?.preventDefault?.();
    if (!isDrawingRef.current || drawModeRef.current !== "mouse") return;
    isDrawingRef.current = false;
    drawModeRef.current = null;
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    isDrawingRef.current = false;
    drawModeRef.current = null;
    setIsDrawing(false);
    setHasSignature(false);
    clearFieldError?.("digital_signature");
  };

  const handleSubmit = async () => {
    if (!hasSignature || !residentReceiverId) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = hasSignature ? canvas.toDataURL("image/png") : "";
    await onSubmit?.(Number(residentReceiverId), dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              Entrega de paquete
            </p>
            <h3 className="mt-2 text-xl font-extrabold text-slate-900">Confirmar entrega</h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">{title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-slate-700">Residente que recibe</p>
          <select
            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
            value={residentReceiverId}
            onChange={(event) => {
              setResidentReceiverId(event.target.value);
              clearFieldError?.("resident_receiver_id");
            }}
          >
            <option value="">Seleccione residente</option>
            {residents.map((resident) => (
              <option key={resident.id} value={resident.id}>
                {resident.label}
              </option>
            ))}
          </select>
          <FieldError message={fieldErrors.resident_receiver_id} />
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-slate-700">Firma digital</p>
          <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50">
            <canvas
              ref={canvasRef}
              className="h-44 w-full cursor-crosshair block"
              onMouseDown={startDrawingMouse}
              onMouseMove={drawMouse}
              onMouseUp={endDrawingMouse}
              onMouseLeave={endDrawingMouse}
            />
          </div>
          <FieldError message={fieldErrors.digital_signature} />

          <div className="mt-2">
            <button
              type="button"
              onClick={clearSignature}
              className="text-xs font-extrabold text-rose-700 hover:text-rose-800"
            >
              Limpiar firma
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !hasSignature || !residentReceiverId}
            className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Entregando..." : "Registrar entrega"}
          </button>
        </div>
        {!hasSignature || !residentReceiverId ? (
          <p className="mt-2 text-right text-xs font-semibold text-slate-500">
            Debes seleccionar residente y firmar antes de registrar la entrega.
          </p>
        ) : null}
      </div>
    </div>
  );
}
