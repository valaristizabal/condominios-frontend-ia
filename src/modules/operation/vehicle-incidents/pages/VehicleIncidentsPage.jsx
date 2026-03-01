import { useMemo, useState } from "react";
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!activeCondominiumId || submitting) {
      return;
    }

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
    <div className="min-h-screen bg-white pb-32">
      <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button
          type="button"
          className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
          onClick={() => window.history.back()}
        >
          ←
        </button>
        <h1 className="text-xl font-extrabold text-gray-900">Novedades Vehiculares</h1>
      </div>

      {!activeCondominiumId ? (
        <div className="px-4 max-w-3xl mx-auto mt-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-700">
            No hay condominio activo para gestionar novedades vehiculares.
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="px-4 max-w-3xl mx-auto mt-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>
        </div>
      ) : null}

      {loadingInitial ? (
        <div className="px-4 max-w-3xl mx-auto mt-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm font-semibold text-gray-500">
            Cargando datos iniciales...
          </div>
        </div>
      ) : null}

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
        onResolve={resolveIncident}
        activeFilter={activeFilter}
        onFilterChange={loadWithFilter}
        onRefresh={() => resolveFilter(activeFilter)}
      />
    </div>
  );
}

export default VehicleIncidentsPage;
