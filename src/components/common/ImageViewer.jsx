function ImageViewer({ open = false, imageUrl = "", imageUrls = [], title, onClose }) {
  const normalizedImages = Array.isArray(imageUrls) && imageUrls.length > 0 ? imageUrls.filter(Boolean) : [imageUrl].filter(Boolean);

  if (!open || !normalizedImages.length) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Evidencias</p>
            <h3 className="text-lg font-bold text-slate-900">
              {title || (normalizedImages.length > 1 ? `${normalizedImages.length} imagenes adjuntas` : "1 imagen adjunta")}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {normalizedImages.map((currentImageUrl, index) => (
            <a
              key={`${currentImageUrl}-${index}`}
              href={currentImageUrl}
              target="_blank"
              rel="noreferrer"
              className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
            >
              <img src={currentImageUrl} alt={`Evidencia ${index + 1}`} className="h-64 w-full object-cover" />
              <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-white px-3 py-2">
                <span className="text-xs font-semibold text-slate-600">Evidencia {index + 1}</span>
                <span className="text-xs font-bold text-blue-700">Abrir</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ImageViewer;
