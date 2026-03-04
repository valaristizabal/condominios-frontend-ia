import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import apiClient from "../../../../services/apiClient";

const Card = ({ children, className = "" }) => (
  <div className={["rounded-3xl border border-slate-200 bg-white p-6 shadow-sm", className].join(" ")}>{children}</div>
);

const SmallTag = ({ children }) => (
  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-extrabold text-slate-700">
    {children}
  </span>
);

const FieldLabel = ({ children }) => (
  <div className="flex items-center justify-between">
    <p className="text-sm font-semibold text-slate-700">{children}</p>
  </div>
);

const inputBase =
  "w-full h-12 rounded-2xl bg-white border border-slate-200 px-4 text-slate-900 outline-none focus:ring-2 focus:ring-blue-200";

function SearchableSelect({
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

function EmptyState({ title, subtitle }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
      <p className="text-sm font-extrabold text-slate-900">{title}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p>
    </div>
  );
}

function VehiclesPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { activeCondominiumId } = useActiveCondominium();
  const queryClient = useQueryClient();

  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    tipoUsuario: "",
    placa: "",
    vehicleTypeId: "",
    unitTypeId: "",
    apartmentId: "",
    responsable: "",
    observaciones: "",
  });

  const fileRef = useRef(null);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidencePreview, setEvidencePreview] = useState("");
  const [globalError, setGlobalError] = useState("");

  const requestConfig = useMemo(
    () =>
      activeCondominiumId
        ? {
            headers: {
              "X-Active-Condominium-Id": String(activeCondominiumId),
            },
          }
        : undefined,
    [activeCondominiumId]
  );

  const ownerTypeMap = useMemo(
    () => ({
      Residente: "resident",
      Visitante: "visitor",
      Proveedor: "provider",
      Mantenimiento: "provider",
    }),
    []
  );

  const canQuery = Boolean(activeCondominiumId);

  const initialQuery = useQuery({
    queryKey: ["vehicles", "catalogs", activeCondominiumId],
    enabled: canQuery,
    queryFn: async () => {
      const bootstrapRes = await apiClient.get("/vehicles/bootstrap-data", requestConfig);
      const bootstrap = bootstrapRes?.data || {};

      return {
        vehicleTypes: Array.isArray(bootstrap.vehicle_types) ? bootstrap.vehicle_types : [],
        unitTypes: Array.isArray(bootstrap.units) ? bootstrap.units : [],
        apartments: Array.isArray(bootstrap.apartments) ? bootstrap.apartments : [],
        operatives: Array.isArray(bootstrap.operatives) ? bootstrap.operatives : [],
      };
    },
  });

  const vehicleTypes = initialQuery.data?.vehicleTypes || [];
  const unitTypes = initialQuery.data?.unitTypes || [];
  const apartments = initialQuery.data?.apartments || [];
  const securityUsers = useMemo(() => {
    const operatives = initialQuery.data?.operatives || [];

    return operatives
      .filter((operative) => String(operative?.role?.name || "").toLowerCase().includes("seguridad"))
      .map((operative) => operative?.user)
      .filter((securityUser) => securityUser?.id)
      .map((securityUser) => ({ id: securityUser.id, full_name: securityUser.full_name || "Sin nombre" }));
  }, [initialQuery.data?.operatives]);

  const activeEntriesQuery = useQuery({
    queryKey: ["vehicles", "active-entries", activeCondominiumId],
    enabled: canQuery,
    queryFn: async () => {
      const entriesRes = await apiClient.get("/vehicle-entries?only_active=1&status=INSIDE", requestConfig);
      const list = Array.isArray(entriesRes.data)
        ? entriesRes.data
        : Array.isArray(entriesRes.data?.data)
          ? entriesRes.data.data
          : [];
      return list.filter((entry) => entry?.status === "INSIDE");
    },
  });

  const activeEntries = activeEntriesQuery.data || [];
  const queryError = initialQuery.error || activeEntriesQuery.error;

  useEffect(() => {
    if (!queryError) return;
    setGlobalError(normalizeApiError(queryError, "Error cargando datos del modulo."));
  }, [queryError]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => {
      if (name === "unitTypeId") {
        return { ...prev, unitTypeId: value, apartmentId: "" };
      }
      return { ...prev, [name]: value };
    });
  }

  const filteredApartments = useMemo(() => {
    if (!form.unitTypeId) return [];
    return apartments.filter((apt) => String(apt?.unit_type_id || "") === String(form.unitTypeId));
  }, [apartments, form.unitTypeId]);

  const userTypeOptions = useMemo(
    () => [
      { value: "Residente", label: "Residente" },
      { value: "Visitante", label: "Visitante" },
      { value: "Proveedor", label: "Proveedor" },
      { value: "Mantenimiento", label: "Mantenimiento" },
    ],
    []
  );

  const vehicleTypeOptions = useMemo(
    () =>
      vehicleTypes.map((type) => ({
        value: String(type.id),
        label: type.name,
      })),
    [vehicleTypes]
  );

  const unitTypeOptions = useMemo(
    () =>
      unitTypes.map((unitType) => ({
        value: String(unitType.id),
        label: unitType.name,
      })),
    [unitTypes]
  );

  const apartmentOptions = useMemo(
    () =>
      filteredApartments.map((apt) => ({
        value: String(apt.id),
        label: buildApartmentOption(apt),
      })),
    [filteredApartments]
  );

  const securityUserOptions = useMemo(
    () =>
      securityUsers.map((securityUser) => ({
        value: String(securityUser.id),
        label: securityUser.full_name,
      })),
    [securityUsers]
  );

  function resetForm() {
    setForm({
      tipoUsuario: "",
      placa: "",
      vehicleTypeId: "",
      unitTypeId: "",
      apartmentId: "",
      responsable: "",
      observaciones: "",
    });
    setEvidenceFile(null);
    setEvidencePreview("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function normalizePlate(value) {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "")
      .slice(0, 20);
  }

  const registerEntryMutation = useMutation({
    mutationFn: async (payload) => {
      const plate = normalizePlate(payload.placa);
      const vehiclesRes = await apiClient.get(`/vehicles?plate=${encodeURIComponent(plate)}`, requestConfig);
      const vehicles = Array.isArray(vehiclesRes.data) ? vehiclesRes.data : [];
      let vehicle = vehicles.find((row) => String(row?.plate || "").toUpperCase() === plate);

      if (!vehicle) {
        const newVehicleRes = await apiClient.post(
          "/vehicles",
          {
            vehicle_type_id: Number(payload.vehicleTypeId),
            apartment_id: payload.apartmentId ? Number(payload.apartmentId) : null,
            plate,
            owner_type: ownerTypeMap[payload.tipoUsuario],
            is_active: true,
          },
          requestConfig
        );
        vehicle = newVehicleRes.data;
      }

      await apiClient.post(
        "/vehicle-entries",
        {
          vehicle_id: vehicle.id,
          observations: payload.observaciones || "",
        },
        requestConfig
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["vehicles", "active-entries", activeCondominiumId] });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: (entryId) => apiClient.patch(`/vehicle-entries/${entryId}/checkout`, {}, requestConfig),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["vehicles", "active-entries", activeCondominiumId] });
    },
  });

  const onRegisterIngreso = async (event) => {
    event.preventDefault();
    if (submitting || !activeCondominiumId) return;

    const plate = normalizePlate(form.placa);
    if (!form.tipoUsuario || !plate || !form.vehicleTypeId) {
      alert("Completa los campos obligatorios: Tipo de usuario, Placa y Tipo de vehiculo.");
      return;
    }

    setSubmitting(true);
    setGlobalError("");

    try {
      await registerEntryMutation.mutateAsync({ ...form, placa: plate });
      resetForm();
      alert("Ingreso registrado correctamente");
    } catch (err) {
      const message = normalizeApiError(err, "Error registrando ingreso.");
      setGlobalError(message);
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  async function onCheckoutEntry(entry) {
    if (!entry?.id || !activeCondominiumId) return;

    const ok = confirm("Registrar salida de este vehiculo?");
    if (!ok) return;

    try {
      await checkoutMutation.mutateAsync(entry.id);
    } catch (err) {
      const message = normalizeApiError(err, "Error registrando salida.");
      setGlobalError(message);
      alert(message);
    }
  }

  function handlePickEvidence() {
    fileRef.current?.click();
  }

  function onEvidenceChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setEvidenceFile(file);
    setEvidencePreview(url);
  }

  function removeEvidence() {
    setEvidenceFile(null);
    setEvidencePreview("");
    if (fileRef.current) fileRef.current.value = "";
  }

  const loadingInit = initialQuery.isLoading;
  const loadingActive = activeEntriesQuery.isLoading;

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-6xl px-6 py-6">
        <div className="mb-6">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">GESTION DE ACCESOS</p>

          <div className="mt-1 flex items-center gap-3">
            <button
              type="button"
              className="h-10 w-10 rounded-2xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50 flex items-center justify-center"
              onClick={() => window.history.back()}
            >
              <span className="text-slate-700">{"<"}</span>
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Ingreso Vehicular</h1>
              <p className="mt-1 text-sm text-slate-500">Registra el ingreso y controla la salida en tiempo real.</p>
            </div>
          </div>
        </div>

        {!activeCondominiumId ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            No hay condominio activo para gestionar ingresos vehiculares.
          </div>
        ) : null}

        {globalError ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {globalError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">REGISTRO</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">Nuevo ingreso</h2>
                <p className="mt-1 text-sm text-slate-500">Completa los datos y registra el ingreso del vehiculo.</p>
              </div>

              {loadingInit ? <SmallTag>Cargando...</SmallTag> : <SmallTag>Formulario</SmallTag>}
            </div>

            <form onSubmit={onRegisterIngreso} className="mt-6 space-y-5">
              <div>
                <FieldLabel>Evidencia fotografica</FieldLabel>
                <div className="mt-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onEvidenceChange} />

                  {!evidencePreview ? (
                    <>
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                        <span className="text-blue-600">[ ]</span>
                      </div>
                      <p className="text-sm font-extrabold text-slate-900">Tomar / Cargar fotografia</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Para la demo puedes cargar una imagen desde tu computador
                      </p>

                      <button
                        type="button"
                        onClick={handlePickEvidence}
                        className="mt-4 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-50"
                      >
                        Cargar imagen
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="mx-auto w-full max-w-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <img src={evidencePreview} alt="Evidencia" className="h-40 w-full object-cover" />
                      </div>

                      <div className="mt-4 flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={handlePickEvidence}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-50"
                        >
                          Cambiar
                        </button>
                        <button
                          type="button"
                          onClick={removeEvidence}
                          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-extrabold text-rose-700 hover:bg-rose-100"
                        >
                          Quitar
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <p className="mt-2 text-xs font-semibold text-slate-400">
                  Recomendado: capturar la placa para soporte de seguridad.
                </p>
              </div>

              <div>
                <FieldLabel>Tipo de usuario</FieldLabel>
                <SearchableSelect
                  className="mt-2"
                  value={form.tipoUsuario}
                  options={userTypeOptions}
                  placeholder="Seleccionar tipo..."
                  searchPlaceholder="Buscar tipo de usuario..."
                  onChange={(value) => setForm((prev) => ({ ...prev, tipoUsuario: String(value) }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Placa del vehiculo</FieldLabel>
                  <input name="placa" value={form.placa} onChange={handleChange} placeholder="ABC-123" className={`${inputBase} mt-2`} />
                </div>

                <div>
                  <FieldLabel>Tipo de vehiculo</FieldLabel>
                  <SearchableSelect
                    className="mt-2"
                    value={form.vehicleTypeId}
                    options={vehicleTypeOptions}
                    placeholder="Seleccionar tipo..."
                    searchPlaceholder="Buscar tipo de vehiculo..."
                    onChange={(value) => setForm((prev) => ({ ...prev, vehicleTypeId: String(value) }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Tipo de unidad</FieldLabel>
                  <SearchableSelect
                    className="mt-2"
                    value={form.unitTypeId}
                    options={unitTypeOptions}
                    placeholder="Seleccionar tipo..."
                    searchPlaceholder="Buscar tipo de unidad..."
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        unitTypeId: String(value),
                        apartmentId: "",
                      }))
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Unidad</FieldLabel>
                  <SearchableSelect
                    className="mt-2"
                    value={form.apartmentId}
                    options={apartmentOptions}
                    placeholder={!form.unitTypeId ? "Primero selecciona tipo" : "Seleccionar unidad..."}
                    searchPlaceholder="Buscar unidad..."
                    disabled={!form.unitTypeId}
                    onChange={(value) => setForm((prev) => ({ ...prev, apartmentId: String(value) }))}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Responsable de turno</FieldLabel>
                <SearchableSelect
                  className="mt-2"
                  value={form.responsable}
                  options={securityUserOptions}
                  placeholder="Seleccionar responsable..."
                  searchPlaceholder="Buscar responsable..."
                  onChange={(value) => setForm((prev) => ({ ...prev, responsable: String(value) }))}
                />
              </div>

              <div>
                <FieldLabel>Observaciones</FieldLabel>
                <textarea
                  name="observaciones"
                  value={form.observaciones}
                  onChange={handleChange}
                  placeholder="Ej: Vehiculo con golpe en puerta derecha..."
                  className={`${inputBase} mt-2 min-h-[110px] py-3`}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !activeCondominiumId}
                className={[
                  "w-full rounded-2xl py-4 text-sm font-extrabold shadow-sm transition",
                  submitting || !activeCondominiumId
                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99]",
                ].join(" ")}
              >
                {submitting ? "Registrando..." : "Registrar ingreso"}
              </button>

              <p className="text-center text-xs font-semibold text-slate-400">
                Completa los campos obligatorios para habilitar el registro.
              </p>

              <button
                type="button"
                onClick={() => navigate(id ? `/condominio/${id}/vehiculos/novedad` : "/vehiculos/novedad")}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-xs font-extrabold text-slate-800 hover:bg-slate-50"
              >
                Reportar novedad
              </button>
            </form>
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">CONTROL EN TIEMPO REAL</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">Vehiculos actuales ({activeEntries.length})</h2>
                <p className="mt-1 text-sm text-slate-500">Registra la salida para mantener el control del parqueadero.</p>
              </div>

              <button
                type="button"
                onClick={() => activeEntriesQuery.refetch()}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-50"
              >
                Actualizar
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {loadingActive ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                  Cargando vehiculos activos...
                </div>
              ) : !activeEntries.length ? (
                <EmptyState
                  title="Sin vehiculos activos"
                  subtitle="Cuando registres ingresos, apareceran aqui para controlar la salida."
                />
              ) : (
                activeEntries.map((entry) => {
                  const plate = entry?.vehicle?.plate || "-";
                  const ownerType = entry?.vehicle?.owner_type || "-";
                  const unit =
                    entry?.vehicle?.apartment?.number || entry?.vehicle?.apartment_id || entry?.vehicle?.apartmentId || "-";
                  const createdAt = entry?.check_in_at || entry?.created_at || "";

                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-11 w-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                          {"CAR"}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-slate-900">{plate}</p>
                          <p className="truncate text-[11px] font-semibold text-slate-500">{`Tipo: ${ownerType} - Unidad: ${unit}`}</p>
                          {createdAt ? (
                            <p className="truncate text-[11px] font-semibold text-slate-400">
                              {String(createdAt).slice(0, 19).replace("T", " ")}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onCheckoutEntry(entry)}
                        className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-extrabold text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
                      >
                        Registrar salida
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function buildApartmentOption(apt) {
  const number = apt?.number ?? "-";
  const tower = apt?.tower ? `Torre: ${apt.tower}` : "Torre: Sin torre";
  const floor = apt?.floor ?? "-";
  return `${number} | ${tower} | Piso: ${floor}`;
}

function normalizeApiError(err, fallbackMessage) {
  const responseData = err?.response?.data;
  const errors = responseData?.errors;

  if (errors && typeof errors === "object") {
    const firstFieldErrors = Object.values(errors).find(
      (fieldErrors) => Array.isArray(fieldErrors) && fieldErrors.length > 0
    );
    if (firstFieldErrors) {
      return String(firstFieldErrors[0]);
    }
  }

  return responseData?.message || err?.message || fallbackMessage;
}

export default VehiclesPage;

