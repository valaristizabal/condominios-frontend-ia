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
      ROBO: "robo",
      DANIO: "danio",
      OTRO: "otro",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto w-full max-w-7xl space-y-8 px-8 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                onClick={() => window.history.back()}
              >
                ←
              </button>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Gestión de accesos</p>
            </div>

            <h1 className="mt-3 text-3xl font-bold text-slate-900">Novedades Vehiculares</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-500">
              Reporta incidencias vehiculares, adjunta evidencia y resuelve casos en tiempo real.
            </p>
          </div>
        </div>

        {!activeCondominiumId ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-700">
            No hay condominio activo para gestionar novedades vehiculares.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">{error}</div>
        ) : null}

        {loadingInitial ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-500">
            Cargando datos iniciales...
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
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
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
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
      </div>
    </div>
  );
}

export default VehicleIncidentsPage;
