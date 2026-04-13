import { useMemo, useState } from "react";

const DEFAULT_AVATAR_SRC = "/image/default-avatar.svg";

function PropertyLogo({
  src,
  alt = "Imagen",
  size = 44,
  variant = "circle",
  className = "",
  fit = "cover",
}) {
  const [hasError, setHasError] = useState(false);
  const normalizedSize = Number.isFinite(Number(size)) ? Number(size) : 44;
  const radiusClass = variant === "squircle" ? "rounded-2xl" : "rounded-full";
  const fitClass = fit === "contain" ? "object-contain" : "object-cover";

  const resolvedSrc = useMemo(() => {
    if (!src || hasError) {
      return DEFAULT_AVATAR_SRC;
    }

    return src;
  }, [hasError, src]);

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
      <img
        src={resolvedSrc}
        alt={alt}
        className={`h-full w-full ${fitClass} object-center`}
        onError={() => {
          if (resolvedSrc !== DEFAULT_AVATAR_SRC) {
            setHasError(true);
          }
        }}
        loading="lazy"
      />
    </div>
  );
}

export default PropertyLogo;
