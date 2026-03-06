import { useMemo, useState } from "react";
import BackButton from "../../../../components/common/BackButton";
import VehicleIncidentFormModal from "../components/VehicleIncidentFormModal";
import VehicleIncidentTable from "../components/VehicleIncidentTable";
import { useVehicleIncidents } from "../hooks/useVehicleIncidents";

function VehicleIncidentsPage() {
  const {
    apartments,
    vehicleTypes,
    incidents,
    loadingInitial,
    loadingIncidents,
    submitting,
    resolvingIds,
    error,
    fieldErrors,
    activeCondominiumId,
    loadIncidents,
    createIncident,
    resolveIncident,
    clearFieldError,
  } = useVehicleIncidents();

  const [form, setForm] = useState({
    tipoVehiculo: "",
    placa: "",
    tipoUnidad: "",
    numeroUnidad: "",
    tipoNovedad: "ROBO",
    observaciones: "",
    photoList: [],
  });
  const [activeFilter, setActiveFilter] = useState("pending");

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
      observaciones: "",
      photoList: [],
    });
  };

  const resolveFilter = async (filter) => {
    if (filter === "pending") {
      await loadIncidents({ pending: true });
      return;
    }

    if (filter === "resolved") {
      await loadIncidents({ resolved: true });
      return;
    }

    await loadIncidents();
  };

  const loadWithFilter = async (filter) => {
    setActiveFilter(filter);
    await resolveFilter(filter);
  };

  const handleResolve = async (incidentId) => {
    await resolveIncident(incidentId);
    await resolveFilter(activeFilter);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!activeCondominiumId || submitting) return;

    const firstEvidence = form.photoList?.[0]?.file || null;

    try {
      await createIncident({
        vehicle_id: null,
        apartment_id: form.numeroUnidad ? Number(form.numeroUnidad) : null,
        plate: String(form.placa || "").trim().toUpperCase(),
        incident_type: incidentTypeMap[form.tipoNovedad] || "other",
        observations: form.observaciones || "",
        evidence: firstEvidence,
      });

      resetForm();
    } catch {
      // Error state is handled by hook and field errors.
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
          onRefresh={() => resolveFilter(activeFilter)}
        />
      </div>
    </div>
  );
}

export default VehicleIncidentsPage;
