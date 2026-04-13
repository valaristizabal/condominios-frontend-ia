import { useMemo, useState } from "react";
import BackButton from "../../../../components/common/BackButton";
import VehicleIncidentFormModal from "../components/VehicleIncidentFormModal";
import VehicleIncidentTable from "../components/VehicleIncidentTable";
import { useVehicleIncidents } from "../hooks/useVehicleIncidents";
import { useNotification } from "../../../../hooks/useNotification";

function VehicleIncidentsPage() {
  const {
    apartments,
    vehicleTypes,
    incidents,
    loadingInitial,
    loadingIncidents,
    submitting,
    resolvingIds,
    incidentsPagination,
    error,
    fieldErrors,
    activeCondominiumId,
    loadIncidents,
    createIncident,
    resolveIncident,
    clearFieldError,
  } = useVehicleIncidents();
  const { success, error: notifyError, warning } = useNotification();

  const [form, setForm] = useState({
    tipoVehiculo: "",
    placa: "",
    tipoUnidad: "",
    numeroUnidad: "",
    tipoNovedad: "ROBO",
    detalleOtro: "",
    observaciones: "",
    photoList: [],
  });
  const [activeFilter, setActiveFilter] = useState("pending");
  const [currentPage, setCurrentPage] = useState(1);

  const incidentTypeMap = useMemo(
    () => ({
      ROBO: "unauthorized",
      DANIO: "damage",
      OTRO: "other",
    }),
    []
  );

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const setPhotoList = (updater) => {
    setForm((prev) => ({
      ...prev,
      photoList: typeof updater === "function" ? updater(prev.photoList) : updater,
    }));
  };

  const resetForm = () => {
    setForm({
      tipoVehiculo: "",
      placa: "",
      tipoUnidad: "",
      numeroUnidad: "",
      tipoNovedad: "ROBO",
      detalleOtro: "",
      observaciones: "",
      photoList: [],
    });
  };

  const resolveFilter = async (filter, page = 1) => {
    if (filter === "pending") {
      await loadIncidents({ pending: true }, page);
      return;
    }

    if (filter === "resolved") {
      await loadIncidents({ resolved: true }, page);
      return;
    }

    await loadIncidents({}, page);
  };

  const loadWithFilter = async (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
    await resolveFilter(filter, 1);
  };

  const handleResolve = async (incidentId) => {
    await resolveIncident(incidentId);
    await resolveFilter(activeFilter, currentPage);
  };

  const handlePageChange = async (nextPage) => {
    const safePage = Math.max(1, Number(nextPage || 1));
    setCurrentPage(safePage);
    await resolveFilter(activeFilter, safePage);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!activeCondominiumId || submitting) return;

    const evidenceFiles = Array.isArray(form.photoList) ? form.photoList.map((item) => item?.file).filter(Boolean) : [];
    const plate = String(form.placa || "").trim().toUpperCase();
    const isOther = form.tipoNovedad === "OTRO";
    const otherDetail = String(form.detalleOtro || "").trim();
    const observations = String(form.observaciones || "").trim();

    if (
      !form.tipoVehiculo ||
      !plate ||
      !form.tipoUnidad ||
      !form.numeroUnidad ||
      !form.tipoNovedad ||
      !observations ||
      (isOther && !otherDetail) ||
      !evidenceFiles.length
    ) {
      warning(
        isOther
          ? "Completa todos los campos obligatorios, incluyendo el detalle de 'Otro' y al menos una evidencia."
          : "Completa todos los campos obligatorios y adjunta al menos una evidencia."
      );
      return;
    }

    const finalObservations =
      isOther && otherDetail
        ? observations
          ? `Otro: ${otherDetail}\n\n${observations}`
          : `Otro: ${otherDetail}`
        : observations;

    try {
      await createIncident({
        vehicle_id: null,
        apartment_id: form.numeroUnidad ? Number(form.numeroUnidad) : null,
        plate,
        incident_type: incidentTypeMap[form.tipoNovedad] || "other",
        observations: finalObservations,
        evidences: evidenceFiles,
        evidence: evidenceFiles[0] || null,
      });

      resetForm();
      setCurrentPage(1);
      await resolveFilter(activeFilter, 1);
      success("Novedad vehicular registrada correctamente.");
    } catch (requestError) {
      const message = normalizeIncidentError(requestError, "No fue posible registrar la novedad vehicular.");
      notifyError(message);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <div className="mb-3">
          <BackButton variant="vehicles" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Gestión de accesos</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-900">Novedades vehiculares</h1>
      </header>

      {!activeCondominiumId ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          No hay propiedad activa para gestionar novedades vehiculares.
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>
      ) : null}

      {loadingInitial ? (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500">
          Cargando datos iniciales...
        </div>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-6">
        <VehicleIncidentFormModal
          form={form}
          setField={setField}
          setPhotoList={setPhotoList}
          vehicleTypes={vehicleTypes}
          apartments={apartments}
          fieldErrors={fieldErrors}
          submitting={submitting}
          clearFieldError={clearFieldError}
          onSubmit={handleSubmit}
        />

        <VehicleIncidentTable
          incidents={incidents}
          loading={loadingIncidents}
          resolvingIds={resolvingIds}
          onResolve={handleResolve}
          activeFilter={activeFilter}
          onFilterChange={loadWithFilter}
          onRefresh={() => resolveFilter(activeFilter, currentPage)}
          currentPage={currentPage}
          totalPages={incidentsPagination.lastPage}
          totalItems={incidentsPagination.total}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}

export default VehicleIncidentsPage;

function normalizeIncidentError(error, fallbackMessage) {
  const responseData = error?.response?.data;
  const errors = responseData?.errors;

  if (errors && typeof errors === "object") {
    const firstFieldErrors = Object.values(errors).find(
      (messages) => Array.isArray(messages) && messages.length > 0
    );
    if (firstFieldErrors) {
      return String(firstFieldErrors[0]);
    }
  }

  return responseData?.message || error?.message || fallbackMessage;
}
