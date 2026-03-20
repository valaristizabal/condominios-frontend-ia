import { Camera } from "lucide-react";

export default function ImageUploadPrompt({
  title = "Tomar / Cargar fotografía",
  description = "Toque aquí para activar cámara o cargar imagen",
}) {
  return (
    <div className="space-y-2">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
        <Camera className="h-5 w-5" />
      </div>
      <p className="text-sm font-extrabold text-slate-900">{title}</p>
      <p className="text-xs font-semibold text-slate-500">{description}</p>
    </div>
  );
}
