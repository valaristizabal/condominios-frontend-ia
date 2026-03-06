import { useEffect, useMemo, useRef, useState } from "react";

const Card = ({ children, className = "" }) => (
  <div className={`rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
    {children}
  </div>
);

const Label = ({ children }) => <p className="text-sm font-semibold text-slate-700">{children}</p>;

const Hint = ({ children }) => <p className="mt-2 text-xs font-semibold text-slate-500">{children}</p>;

const ErrorText = ({ children }) => <p className="mt-2 text-sm text-red-600">{children}</p>;

const inputBase =
  "w-full h-14 rounded-2xl bg-white px-4 text-slate-900 outline-none focus:ring-2 border";

function CameraIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M9 4 7.17 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.17L15 4H9Zm3 14a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"
      />
    </svg>
  );
}

function ShieldCheckIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="m12 2 8 3v6c0 5.25-3.44 10.15-8 11-4.56-.85-8-5.75-8-11V5l8-3Zm-1 12 5-5-1.41-1.41L11 11.17l-1.59-1.59L8 11l3 3Z"
      />
    </svg>
  );
}

function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = "Selecciona...",
  searchPlaceholder = "Buscar...",
  disabled = false,
  hasError = false,
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
    if (!open) {
      setSearchTerm("");
    }
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={[
          "flex h-14 w-full items-center justify-between rounded-2xl border bg-white px-4 text-left text-slate-900 outline-none focus:ring-2",
          hasError ? "border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-blue-200",
          disabled ? "cursor-not-allowed bg-slate-100 text-slate-500" : "",
        ].join(" ")}
      >
        <span className={selectedOption ? "text-slate-900" : "text-slate-500"}>
          {selectedOption?.label || placeholder}
        </span>
        <span className="text-slate-400">{open ? "▲" : "▼"}</span>
      </button>

      {open ? (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 p-2">
            <input
              autoFocus
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
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

export default function VisitFormModal({ apartments = [], onSubmit, loading }) {
  const fileRef = useRef(null);

  const [fullName, setFullName] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [unitTypeId, setUnitTypeId] = useState("");
  const [apartmentId, setApartmentId] = useState("");
  const [objects, setObjects] = useState("");
  const [antecedentesConsultados, setAntecedentesConsultados] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceName, setEvidenceName] = useState("");
  const [errors, setErrors] = useState({});

  const apartmentsOptions = useMemo(() => apartments || [], [apartments]);
  const unitTypeOptions = useMemo(() => {
    const map = new Map();
    for (const apartment of apartmentsOptions) {
      const id = apartment?.unit_type_id;
      const name = apartment?.unit_type?.name || apartment?.unitType?.name || "Sin tipo";
      if (id && !map.has(String(id))) {
        map.set(String(id), { id: String(id), name });
      }
    }
    return Array.from(map.values());
  }, [apartmentsOptions]);

  const filteredApartments = useMemo(() => {
    if (!unitTypeId) return [];
    return apartmentsOptions.filter((item) => String(item?.unit_type_id) === String(unitTypeId));
  }, [apartmentsOptions, unitTypeId]);
  const unitTypeSelectOptions = useMemo(
    () => unitTypeOptions.map((unitType) => ({ value: unitType.id, label: unitType.name })),
    [unitTypeOptions]
  );
  const apartmentSelectOptions = useMemo(
    () =>
      filteredApartments.map((apartment) => ({
        value: apartment.id,
        label: apartment.name || apartment.number || `Apto ${apartment.id}`,
      })),
    [filteredApartments]
  );

  const canSubmit =
    fullName.trim() &&
    document.trim() &&
    phone.trim() &&
    apartmentId &&
    antecedentesConsultados &&
    !loading;

  const validate = () => {
    const next = {};
    if (!fullName.trim()) next.fullName = "Ingresa el nombre completo.";
    if (!document.trim()) next.document = "Ingresa el documento.";
    if (!phone.trim()) next.phone = "Ingresa el celular.";
    if (!unitTypeId) next.unitTypeId = "Selecciona el tipo de unidad.";
    if (!apartmentId) next.apartmentId = "Selecciona el apartamento destino.";
    if (!antecedentesConsultados) {
      next.antecedentes = "Debes confirmar que consultaste antecedentes.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const openPicker = () => fileRef.current?.click();

  const onFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      alert("Selecciona una imagen válida.");
      event.target.value = "";
      return;
    }

    const url = URL.createObjectURL(file);
    setEvidenceUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setEvidenceName(file.name);
  };

  const clearEvidence = () => {
    setEvidenceUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
    setEvidenceName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const selectedApartment = apartmentsOptions.find((item) => String(item.id) === String(apartmentId));
    const resolvedDestination =
      selectedApartment?.number ? `Apto ${selectedApartment.number}` : `Apto ${apartmentId}`;

    await onSubmit?.({
      apartment_id: Number(apartmentId),
      full_name: fullName.trim(),
      document_number: document.trim(),
      phone: phone.trim(),
      destination: resolvedDestination,
      carried_items: objects.trim(),
      background_check: antecedentesConsultados,
      photo: fileRef.current?.files?.[0] || null,
    });

    setFullName("");
    setDocument("");
    setPhone("");
    setUnitTypeId("");
    setApartmentId("");
    setObjects("");
    setAntecedentesConsultados(false);
    setErrors({});
    clearEvidence();
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Registro</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Nueva visita</h2>
            <p className="mt-1 text-sm text-slate-500">
              Captura evidencia, registra datos y valida antecedentes.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <Label>Evidencia fotográfica</Label>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

          {evidenceUrl ? (
            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <img src={evidenceUrl} alt="Evidencia" className="h-[220px] w-full object-cover" />
              <div className="flex items-center justify-between gap-3 p-3">
                <p className="truncate text-xs text-slate-600">{evidenceName}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openPicker}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Cambiar
                  </button>
                  <button
                    type="button"
                    onClick={clearEvidence}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={openPicker}
              className="mt-3 w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center transition hover:bg-slate-100"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                <CameraIcon className="h-5 w-5 text-slate-600" />
              </div>
              <p className="text-sm font-extrabold text-slate-900">Tomar / Cargar fotografía</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Para la demo puedes cargar una imagen desde tu computador
              </p>
            </button>
          )}

          <Hint>Recomendado: capturar rostro del visitante para soporte de seguridad.</Hint>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <Label>Nombre completo</Label>
            <input
              className={`${inputBase} ${
                errors.fullName ? "border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-blue-200"
              }`}
              placeholder="Ej. Ana María Pérez"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
            {errors.fullName && <ErrorText>{errors.fullName}</ErrorText>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Documento</Label>
              <input
                className={`${inputBase} ${
                  errors.document ? "border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-blue-200"
                }`}
                placeholder="Ej. 1094..."
                value={document}
                onChange={(event) => setDocument(event.target.value)}
              />
              {errors.document && <ErrorText>{errors.document}</ErrorText>}
            </div>

            <div>
              <Label>Celular</Label>
              <input
                className={`${inputBase} ${
                  errors.phone ? "border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-blue-200"
                }`}
                placeholder="Ej. 300..."
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
              {errors.phone && <ErrorText>{errors.phone}</ErrorText>}
            </div>
          </div>

          <div>
            <Label>Tipo de unidad</Label>
            <SearchableSelect
              value={unitTypeId}
              hasError={Boolean(errors.unitTypeId)}
              placeholder="Selecciona tipo de unidad"
              searchPlaceholder="Buscar tipo de unidad..."
              options={unitTypeSelectOptions}
              onChange={(nextValue) => {
                setUnitTypeId(String(nextValue));
                setApartmentId("");
              }}
            />
            {errors.unitTypeId && <ErrorText>{errors.unitTypeId}</ErrorText>}
          </div>

          <div>
            <Label>Apartamento destino</Label>
            <SearchableSelect
              value={apartmentId}
              disabled={!unitTypeId}
              hasError={Boolean(errors.apartmentId)}
              placeholder={!unitTypeId ? "Primero selecciona tipo de unidad" : "Selecciona apartamento"}
              searchPlaceholder="Buscar apartamento..."
              options={apartmentSelectOptions}
              onChange={(nextValue) => setApartmentId(String(nextValue))}
            />
            {errors.apartmentId && <ErrorText>{errors.apartmentId}</ErrorText>}
          </div>

          <div>
            <Label>Objetos que trae</Label>
            <textarea
              className="w-full min-h-[110px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Ej. maleta, portátil, caja..."
              value={objects}
              onChange={(event) => setObjects(event.target.value)}
            />
          </div>

        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={() =>
              window.open("https://antecedentes.policia.gov.co:7005/WebJudicial/", "_blank")
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50"
            disabled={loading}
          >
            <div className="flex items-center justify-center gap-2">
              <ShieldCheckIcon className="h-[18px] w-[18px] text-emerald-600" />
              Consultar antecedentes
            </div>
          </button>

          <div className="mt-4 flex items-center gap-3">
            <input
              id="antecedentes"
              type="checkbox"
              className="h-4 w-4"
              checked={antecedentesConsultados}
              onChange={(event) => setAntecedentesConsultados(event.target.checked)}
            />
            <label htmlFor="antecedentes" className="text-sm font-semibold text-slate-700">
              Antecedentes consultados
            </label>
          </div>

          {errors.antecedentes && <ErrorText>{errors.antecedentes}</ErrorText>}
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full rounded-2xl py-4 text-sm font-extrabold shadow-sm transition ${
              canSubmit
                ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99]"
                : "cursor-not-allowed bg-slate-200 text-slate-500"
            }`}
          >
            {loading ? "Guardando..." : "Registrar ingreso"}
          </button>

          <p className="mt-3 text-xs font-semibold text-slate-500">
            Para habilitar el registro, completa los campos y confirma antecedentes.
          </p>
        </div>
      </Card>
    </div>
  );
}
