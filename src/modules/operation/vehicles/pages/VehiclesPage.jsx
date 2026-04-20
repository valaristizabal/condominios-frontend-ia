import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import apiClient from "../../../../services/apiClient";
import BackButton from "../../../../components/common/BackButton";
import ImageViewer from "../../../../components/common/ImageViewer";
import ImageUploadPrompt from "../../../../components/common/ImageUploadPrompt";
import PropertyLogo from "../../../../components/common/PropertyLogo";
import { normalizeRoleName } from "../../../../utils/roles";
import { buildStorageUrl } from "../../../../utils/condominiumBrand";
import { useNotification } from "../../../../hooks/useNotification";

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

function toVehicleFormData(payload, includeMethodOverride = false) {
  const formData = new FormData();

  if (includeMethodOverride) {
    formData.append("_method", "PUT");
  }

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined) return;

    if (value === null) {
      formData.append(key, "");
      return;
    }

    if (typeof File !== "undefined" && value instanceof File) {
      formData.append(key, value);
      return;
    }

    if (typeof value === "boolean") {
      formData.append(key, value ? "1" : "0");
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
}

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
  const { success, error, warning } = useNotification();

  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    tipoUsuario: "",
    tienePlaca: true,
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
  const [activeEntriesPage, setActiveEntriesPage] = useState(1);
  const [historyEntriesPage, setHistoryEntriesPage] = useState(1);
  const [activeTab, setActiveTab] = useState("actuales");
  const [activeVehicleImage, setActiveVehicleImage] = useState({ imageUrl: "", title: "" });
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
      const vehicleTypesPayload =
        bootstrap.vehicle_types ?? bootstrap.vehicleTypes ?? bootstrap.data?.vehicle_types ?? bootstrap.data?.vehicleTypes;
      const unitTypesPayload =
        bootstrap.units ?? bootstrap.unitTypes ?? bootstrap.data?.units ?? bootstrap.data?.unitTypes;
      const apartmentsPayload = bootstrap.apartments ?? bootstrap.data?.apartments;
      const operativesPayload = bootstrap.operatives ?? bootstrap.data?.operatives;

      return {
        vehicleTypes: Array.isArray(vehicleTypesPayload) ? vehicleTypesPayload : [],
        unitTypes: Array.isArray(unitTypesPayload) ? unitTypesPayload : [],
        apartments: Array.isArray(apartmentsPayload) ? apartmentsPayload : [],
        operatives: Array.isArray(operativesPayload) ? operativesPayload : [],
      };
    },
  });

  const vehicleTypes = initialQuery.data?.vehicleTypes || [];
  const unitTypes = initialQuery.data?.unitTypes || [];
  const apartments = initialQuery.data?.apartments || [];
  const securityUsers = useMemo(() => {
    const operatives = initialQuery.data?.operatives || [];

    return operatives
      .filter((operative) => isSecurityOperative(operative))
      .map((operative) => operative?.user)
      .filter((securityUser) => securityUser?.id)
      .map((securityUser) => ({ id: securityUser.id, full_name: securityUser.full_name || "Sin nombre" }));
  }, [initialQuery.data?.operatives]);

  const activeEntriesQuery = useQuery({
    queryKey: ["vehicles", "active-entries", activeCondominiumId, activeEntriesPage],
    enabled: canQuery,
    queryFn: async () => {
      const entriesRes = await apiClient.get("/vehicle-entries", {
        ...(requestConfig || {}),
        params: {
          only_active: 1,
          status: "INSIDE",
          per_page: 10,
          page: activeEntriesPage,
        },
      });

      const payload = entriesRes?.data || {};
      const list = Array.isArray(payload?.data) ? payload.data : [];

      return {
        list: list.filter((entry) => entry?.status === "INSIDE"),
        currentPage: Number(payload?.current_page || activeEntriesPage || 1),
        lastPage: Math.max(1, Number(payload?.last_page || 1)),
        total: Number(payload?.total || list.length),
      };
    },
  });
  const historyEntriesQuery = useQuery({
    queryKey: ["vehicles", "history-entries", activeCondominiumId, historyEntriesPage],
    enabled: canQuery,
    queryFn: async () => {
      const entriesRes = await apiClient.get("/vehicle-entries", {
        ...(requestConfig || {}),
        params: {
          status: "OUTSIDE", 
          per_page: 10,
          page: historyEntriesPage,
        },
      });

      const payload = entriesRes?.data || {};
      const list = Array.isArray(payload?.data) ? payload.data : [];

      return {
        list: list.filter((entry) => entry?.status === "OUTSIDE"),
        currentPage: Number(payload?.current_page || historyEntriesPage || 1),
        lastPage: Math.max(1, Number(payload?.last_page || 1)),
        total: Number(payload?.total || list.length),
      };
    },
  });
  const activeEntries = activeEntriesQuery.data?.list || [];
  const activeEntriesPagination = useMemo(
    () => ({
      currentPage: Number(activeEntriesQuery.data?.currentPage || activeEntriesPage || 1),
      lastPage: Number(activeEntriesQuery.data?.lastPage || 1),
      total: Number(activeEntriesQuery.data?.total || 0),
    }),
    [activeEntriesPage, activeEntriesQuery.data]
  );
  const historyEntries = historyEntriesQuery.data?.list || [];
  const historyEntriesPagination = useMemo(
    () => ({
      currentPage: Number(historyEntriesQuery.data?.currentPage || historyEntriesPage || 1),
      lastPage: Number(historyEntriesQuery.data?.lastPage || 1),
      total: Number(historyEntriesQuery.data?.total || 0),
    }),
    [historyEntriesPage, historyEntriesQuery.data]
  );
  const queryError = initialQuery.error || activeEntriesQuery.error || historyEntriesQuery.error;

  useEffect(() => {
    if (!queryError) return;
    setGlobalError(normalizeApiError(queryError, "Error cargando datos del módulo."));
  }, [queryError]);

  useEffect(() => {
    setActiveEntriesPage(1);
    setHistoryEntriesPage(1);
  }, [activeCondominiumId]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((prev) => {
      if (name === "tienePlaca") {
        return { ...prev, tienePlaca: checked, placa: checked ? prev.placa : "" };
      }
      if (name === "unitTypeId") {
        return { ...prev, unitTypeId: value, apartmentId: "" };
      }
      return { ...prev, [name]: type === "checkbox" ? checked : value };
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
      tienePlaca: true,
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
      const hasPlate = Boolean(payload.tienePlaca);
      const plate = hasPlate ? normalizePlate(payload.placa) : null;
      let vehicle = null;

      if (hasPlate && plate) {
        const vehiclesRes = await apiClient.get(`/vehicles?plate=${encodeURIComponent(plate)}`, requestConfig);
        const vehicles = Array.isArray(vehiclesRes.data) ? vehiclesRes.data : [];
        vehicle = vehicles.find((row) => String(row?.plate || "").toUpperCase() === plate);
      }

      const baseVehiclePayload = {
        vehicle_type_id: Number(payload.vehicleTypeId),
        apartment_id: payload.apartmentId ? Number(payload.apartmentId) : null,
        has_plate: hasPlate,
        plate,
        owner_type: ownerTypeMap[payload.tipoUsuario],
        is_active: true,
      };

      const hasPhoto = typeof File !== "undefined" && payload.evidenceFile instanceof File;

      if (!vehicle) {
        const createPayload = hasPhoto ? { ...baseVehiclePayload, photo: payload.evidenceFile } : baseVehiclePayload;
        const newVehicleRes = hasPhoto
          ? await apiClient.post("/vehicles", toVehicleFormData(createPayload), {
              ...requestConfig,
              headers: { ...(requestConfig?.headers || {}), "Content-Type": "multipart/form-data" },
            })
          : await apiClient.post("/vehicles", createPayload, requestConfig);
        vehicle = newVehicleRes.data;
      } else if (hasPhoto) {
        const updatePayload = {
          ...baseVehiclePayload,
          photo: payload.evidenceFile,
        };

        const updateVehicleRes = await apiClient.put(`/vehicles/${vehicle.id}`, toVehicleFormData(updatePayload), {
          ...requestConfig,
          headers: { ...(requestConfig?.headers || {}), "Content-Type": "multipart/form-data" },
        });
        vehicle = updateVehicleRes.data;
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
      setActiveEntriesPage(1);
      setHistoryEntriesPage(1);
      await queryClient.invalidateQueries({ queryKey: ["vehicles", "active-entries", activeCondominiumId] });
      await queryClient.invalidateQueries({ queryKey: ["vehicles", "history-entries", activeCondominiumId] });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: (entryId) => apiClient.patch(`/vehicle-entries/${entryId}/checkout`, {}, requestConfig),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["vehicles", "active-entries", activeCondominiumId] });
      await queryClient.invalidateQueries({ queryKey: ["vehicles", "history-entries", activeCondominiumId] });
    },
  });

  const onRegisterIngreso = async (event) => {
    event.preventDefault();
    if (submitting || !activeCondominiumId) return;

    const plate = form.tienePlaca ? normalizePlate(form.placa) : null;
    if (!form.tipoUsuario || !form.vehicleTypeId || (form.tienePlaca && !plate)) {
      warning(
        form.tienePlaca
          ? "Completa los campos obligatorios: Tipo de usuario, ¿Tiene placa?, Placa y Tipo de vehiculo."
          : "Completa los campos obligatorios: Tipo de usuario, ¿Tiene placa? y Tipo de vehiculo."
      );
      return;
    }

    setSubmitting(true);
    setGlobalError("");

    try {
      await registerEntryMutation.mutateAsync({ ...form, placa: plate, evidenceFile });
      resetForm();
      success("Ingreso registrado correctamente.");
    } catch (err) {
      const message = normalizeApiError(err, "Error registrando ingreso.");
      setGlobalError(message);
      error(message);
    } finally {
      setSubmitting(false);
    }
  };

  async function onCheckoutEntry(entry) {
    if (!entry?.id || !activeCondominiumId) return;

    try {
      await checkoutMutation.mutateAsync(entry.id);
      success("Salida registrada correctamente.");
    } catch (err) {
      const message = normalizeApiError(err, "Error registrando salida.");
      setGlobalError(message);
      error(message);
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
  const loadingHistory = historyEntriesQuery.isLoading;

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="mt-1 flex items-center gap-3">
            <BackButton variant="dashboard" />
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Vehículos</h1>
            </div>
          </div>
        </div>

        {!activeCondominiumId ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            No hay propiedad activa para gestionar ingresos vehiculares.
          </div>
        ) : null}

        {globalError ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {globalError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 items-start">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">REGISTRO</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">Nuevo ingreso</h2>
                <p className="mt-1 text-sm text-slate-500">Completa los datos y registra el ingreso del vehículo.</p>
              </div>

              {loadingInit ? <SmallTag>Cargando...</SmallTag> : <SmallTag>Formulario</SmallTag>}
            </div>

            <form onSubmit={onRegisterIngreso} className="mt-6 space-y-5">
              <div>
                <FieldLabel>Evidencia fotográfica</FieldLabel>
                <div className="mt-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onEvidenceChange} />

                  {!evidencePreview ? (
                    <>
                      <ImageUploadPrompt
                        title="Tomar / Cargar fotografía"
                        description="Para la demo puedes cargar una imagen desde tu computador"
                      />

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
                      <div className="mt-3 mx-auto w-full max-w-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                        <img src={evidencePreview} alt="Evidencia" className="h-40 w-full object-cover" />
                        <div className="flex items-center justify-between gap-3 p-3">
                          <p className="truncate text-xs text-slate-600">
                            {evidenceFile?.name || "Imagen seleccionada"}
                          </p>
                          <div className="flex items-center gap-2">
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
                        </div>
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
                  <FieldLabel>¿Tiene placa?</FieldLabel>
                  <label className={`${inputBase} mt-2 flex items-center gap-3`}>
                    <input
                      name="tienePlaca"
                      type="checkbox"
                      checked={form.tienePlaca}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
                    />
                    <span>{form.tienePlaca ? "Sí, tiene placa" : "No tiene placa"}</span>
                  </label>
                </div>

                <div>
                  <FieldLabel>Tipo de vehículo</FieldLabel>
                  <SearchableSelect
                    className="mt-2"
                    value={form.vehicleTypeId}
                    options={vehicleTypeOptions}
                    placeholder="Seleccionar tipo..."
                    searchPlaceholder="Buscar tipo de veh?culo..."
                    onChange={(value) => setForm((prev) => ({ ...prev, vehicleTypeId: String(value) }))}
                  />
                </div>
              </div>

              {form.tienePlaca ? (
                <div>
                  <FieldLabel>Placa del vehículo</FieldLabel>
                  <input
                    name="placa"
                    value={form.placa}
                    onChange={handleChange}
                    placeholder="ABC-123"
                    className={`${inputBase} mt-2`}
                  />
                </div>
              ) : null}

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
                  placeholder="Ej: Vehículo con golpe en puerta derecha..."
                  className={`${inputBase} mt-2 min-h-[110px] py-3`}
                />
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-4">
                <button
                  type="submit"
                  disabled={submitting || !activeCondominiumId}
                  className={[
                    "w-full rounded-2xl py-4 text-sm font-extrabold shadow-sm transition sm:w-auto sm:px-6",
                    submitting || !activeCondominiumId
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99]",
                  ].join(" ")}
                >
                  {submitting ? "Registrando..." : "Registrar ingreso"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate(id ? `/condominio/${id}/vehiculos/novedad` : "/vehiculos/novedad")}
                  className="w-full rounded-2xl border border-rose-300 bg-rose-600 py-3 text-xs font-extrabold text-white transition hover:bg-rose-700 sm:w-auto sm:px-6"
                >
                  Reportar Novedad con Vehículo
                </button>
              </div>

              <p className="text-center text-xs font-semibold text-slate-400">
                Completa los campos obligatorios para habilitar el registro.
              </p>
            </form>
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">VISUALIZAR VEHICULOS</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {activeTab === "actuales"
                    ? `Vehículos actuales (${activeEntriesPagination.total})`
                    : `Historial de vehículos (${historyEntriesPagination.total})`}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {activeTab === "actuales"
                    ? "Registra la salida para mantener el control del parqueadero."
                    : "Consulta los registros de ingreso y salida del parqueadero."}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  activeTab === "actuales" ? activeEntriesQuery.refetch() : historyEntriesQuery.refetch()
                }
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-50"
              >
                Actualizar
              </button>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-100 p-2">
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold sm:text-sm">
                <button
                  type="button"
                  onClick={() => setActiveTab("actuales")}
                  className={[
                    "rounded-xl py-2 transition",
                    activeTab === "actuales" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:bg-white/60",
                  ].join(" ")}
                >
                  Actuales
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("historial")}
                  className={[
                    "rounded-xl py-2 transition",
                    activeTab === "historial" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:bg-white/60",
                  ].join(" ")}
                >
                  Historial
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {activeTab === "actuales" && loadingActive ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                  Cargando vehículos activos...
                </div>
              ) : activeTab === "historial" && loadingHistory ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                  Cargando historial de vehículos...
                </div>
              ) : activeTab === "actuales" && !activeEntries.length ? (
                <EmptyState
                  title="Sin vehículos activos"
                  subtitle="Cuando registres ingresos, aparecerén aquí para controlar la salida."
                />
              ) : activeTab === "historial" && !historyEntries.length ? (
                <EmptyState
                  title="Sin historial de vehículos"
                  subtitle="Todav?a no hay salidas registradas."
                />
              ) : (
                (activeTab === "actuales" ? activeEntries : historyEntries).map((entry) => {
                  const plate = entry?.vehicle?.plate || "-";
                  const ownerType = entry?.vehicle?.owner_type || "-";
                  const vehicleImage = buildStorageUrl(
                    entry?.vehicle?.photo_path ||
                      entry?.vehicle?.photoPath ||
                      entry?.vehicle?.image_path ||
                      entry?.vehicle?.imagePath ||
                      entry?.vehicle?.image_url ||
                      entry?.vehicle?.imageUrl ||
                      entry?.vehicle?.photo_url ||
                      entry?.vehicle?.photoUrl ||
                      entry?.vehicle?.vehicleType?.image_url ||
                      entry?.vehicle?.vehicleType?.imageUrl ||
                      ""
                  );
                  const unit =
                    entry?.vehicle?.apartment?.number || entry?.vehicle?.apartment_id || entry?.vehicle?.apartmentId || "-";
                  const createdAt = entry?.check_in_at || entry?.created_at || "";
                  const checkoutAt = entry?.check_out_at || entry?.updated_at || "";

                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {vehicleImage ? (
                          <button
                            type="button"
                            onClick={() => setActiveVehicleImage({ imageUrl: vehicleImage, title: `Vehiculo ${plate}` })}
                            className="shrink-0"
                          >
                            <PropertyLogo
                              src={vehicleImage}
                              alt={`Vehiculo ${plate}`}
                              size={44}
                              variant="squircle"
                              className="shrink-0"
                            />
                          </button>
                        ) : (
                          <PropertyLogo
                            src={vehicleImage}
                            alt={`Vehiculo ${plate}`}
                            size={44}
                            variant="squircle"
                            className="shrink-0"
                          />
                        )}

                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-slate-900">{plate}</p>
                          <p className="truncate text-[11px] font-semibold text-slate-500">{`Tipo: ${ownerType} - Unidad: ${unit}`}</p>
                          {createdAt ? (
                            <p className="truncate text-[11px] font-semibold text-slate-400">
                              Entr?: {String(createdAt).slice(0, 19).replace("T", " ")}
                            </p>
                          ) : null}
                          {activeTab === "historial" && checkoutAt ? (
                            <p className="truncate text-[11px] font-semibold text-slate-400">
                              Sali?: {String(checkoutAt).slice(0, 19).replace("T", " ")}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {activeTab === "actuales" ? (
                        <button
                          type="button"
                          onClick={() => onCheckoutEntry(entry)}
                          className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-extrabold text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
                        >
                          Registrar salida
                        </button>
                      ) : (
                        <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-700">
                          Salida registrada
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {(activeTab === "actuales" ? activeEntriesPagination.lastPage : historyEntriesPagination.lastPage) > 1 ? (
              <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row">
                <p className="text-xs font-semibold text-slate-500">
                  P?gina {activeTab === "actuales" ? activeEntriesPagination.currentPage : historyEntriesPagination.currentPage} de {activeTab === "actuales" ? activeEntriesPagination.lastPage : historyEntriesPagination.lastPage}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      activeTab === "actuales"
                        ? setActiveEntriesPage((prev) => Math.max(1, prev - 1))
                        : setHistoryEntriesPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={
                      (activeTab === "actuales" ? loadingActive : loadingHistory) ||
                      (activeTab === "actuales"
                        ? activeEntriesPagination.currentPage <= 1
                        : historyEntriesPagination.currentPage <= 1)
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      activeTab === "actuales"
                        ? setActiveEntriesPage((prev) => Math.min(activeEntriesPagination.lastPage, prev + 1))
                        : setHistoryEntriesPage((prev) => Math.min(historyEntriesPagination.lastPage, prev + 1))
                    }
                    disabled={
                      (activeTab === "actuales" ? loadingActive : loadingHistory) ||
                      (activeTab === "actuales"
                        ? activeEntriesPagination.currentPage >= activeEntriesPagination.lastPage
                        : historyEntriesPagination.currentPage >= historyEntriesPagination.lastPage)
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            ) : null}
          </Card>
        </div>
      </div>

      <ImageViewer
        open={Boolean(activeVehicleImage.imageUrl)}
        imageUrl={activeVehicleImage.imageUrl}
        title={activeVehicleImage.title}
        onClose={() => setActiveVehicleImage({ imageUrl: "", title: "" })}
      />
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

function isSecurityOperative(operative) {
  const roleName = normalizeRoleName(operative?.role?.name || "");
  const positionName = normalizeRoleName(operative?.position || "");
  const searchable = `${roleName} ${positionName}`.trim();

  return (
    searchable.includes("seguridad") ||
    searchable.includes("vigilante") ||
    searchable.includes("porteria") ||
    searchable.includes("portería")
  );
}

export default VehiclesPage;

