import { useEffect, useMemo, useRef, useState } from "react";

const inputBase =
  "w-full h-12 rounded-2xl bg-white border border-slate-200 px-4 text-slate-900 outline-none focus:ring-2 focus:ring-blue-200";

export default function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  disabled = false,
  className = "",
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedOption = useMemo(
    () => options.find((option) => String(option.value) === String(value)) || null,
    [options, value]
  );

  const visibleOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => String(option.label || "").toLowerCase().includes(term));
  }, [options, searchTerm]);

  useEffect(() => {
    if (!open) return undefined;

    const handleOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  useEffect(() => {
    if (!open) setSearchTerm("");
  }, [open]);

  return (
    <div ref={rootRef} className={className}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={[
          inputBase,
          "flex items-center justify-between text-left",
          disabled ? "cursor-not-allowed bg-slate-100 text-slate-500" : "",
        ].join(" ")}
      >
        <span className={selectedOption ? "text-slate-900" : "text-slate-500"}>
          {selectedOption?.label || placeholder}
        </span>
        <span className="text-slate-400">{open ? "▲" : "▼"}</span>
      </button>

      {open ? (
        <div className="relative z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
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
                  onMouseDown={(event) => {
                    event.preventDefault();
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
