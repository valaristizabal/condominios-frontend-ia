import { useMemo, useState } from "react";

function PropertyLogo({
  src,
  alt = "Propiedad",
  size = 44,
  variant = "circle",
  className = "",
  fit = "cover",
}) {
  const [hasError, setHasError] = useState(false);
  const normalizedSize = Number.isFinite(Number(size)) ? Number(size) : 44;
  const showImage = Boolean(src) && !hasError;
  const initials = useMemo(() => getInitials(alt), [alt]);

  const radiusClass = variant === "squircle" ? "rounded-2xl" : "rounded-full";
  const fitClass = fit === "contain" ? "object-contain" : "object-cover";

  return (
    <div
      className={[
        "relative flex items-center justify-center overflow-hidden bg-slate-100 ring-1 ring-slate-200",
        radiusClass,
        className,
      ].join(" ")}
      style={{ width: `${normalizedSize}px`, height: `${normalizedSize}px` }}
      aria-label={alt}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          className={`h-full w-full ${fitClass} object-center`}
          onError={() => setHasError(true)}
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-500">
          {initials ? (
            <span className="text-xs font-extrabold uppercase tracking-wide">{initials}</span>
          ) : (
            <BuildingIcon />
          )}
        </div>
      )}
    </div>
  );
}

function getInitials(label) {
  const value = String(label || "").trim();
  if (!value) return "";

  const words = value.split(/\s+/).filter(Boolean);
  if (!words.length) return "";

  if (words.length === 1) {
    return words[0].slice(0, 2);
  }

  return `${words[0][0] || ""}${words[1][0] || ""}`;
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M3 21h18v-2h-2V3H5v16H3v2Zm4-2V5h10v14H7Zm2-10h2v2H9V9Zm4 0h2v2h-2V9Zm-4 4h2v2H9v-2Zm4 0h2v2h-2v-2Z" />
    </svg>
  );
}

export default PropertyLogo;
