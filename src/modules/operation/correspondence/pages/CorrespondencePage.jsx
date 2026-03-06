import { useMemo, useRef, useState } from "react";
import BackButton from "../../../../components/common/BackButton";
import CorrespondenceFormModal from "../components/CorrespondenceFormModal";
import CorrespondenceTable from "../components/CorrespondenceTable";
import DeliveryModal from "../components/DeliveryModal";
import { useCorrespondence } from "../hooks/useCorrespondence";

const Kicker = ({ children }) => (
  <p className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">
    {children}
  </p>
);

const Title = ({ children }) => (
  <h1 className="mt-2 text-2xl font-extrabold text-slate-900 leading-tight">
    {children}
  </h1>
);

export default function CorrespondencePage() {
  const {
    apartments,
    residents,
    correspondences,
    loadingInitial,
    submitting,
    delivering,
    error,
    fieldErrors,
    deliveryFieldErrors,
    activeCondominiumId,
    createCorrespondence,
    deliverCorrespondence,
    clearFieldError,
    clearDeliveryFieldError,
  } = useCorrespondence();

  const couriers = useMemo(
    () => ["Servientrega", "Interrapidísimo", "Coordinadora"],
    []
  );

  const [form, setForm] = useState({
    courier: "Servientrega",
    unitTypeId: "",
    unitId: "",
    packageType: "documento",
    receiverType: "seguridad",
    receiverName: "",
    notes: "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [localErrors, setLocalErrors] = useState({});
  const [deliveryItem, setDeliveryItem] = useState(null);

  const fileRef = useRef(null);

  const apartmentsOptions = useMemo(
    () =>
      apartments.map((apartment) => ({
        id: apartment.id,
        label: apartment.name || apartment.number || `Apto ${apartment.id}`,
        unitTypeId: String(apartment?.unit_type_id || ""),
      })),
    [apartments]
  );

  const unitTypeOptions = useMemo(() => {
    const map = new Map();
    apartments.forEach((apartment) => {
      const id = String(apartment?.unit_type_id || "");
      const name = apartment?.unit_type?.name || apartment?.unitType?.name || "";
      if (id && name && !map.has(id)) {
        map.set(id, { value: id, label: name });
      }
    });
    return Array.from(map.values());
  }, [apartments]);

  const filteredApartmentOptions = useMemo(() => {
    if (!form.unitTypeId) return [];
    return apartmentsOptions
      .filter((item) => String(item.unitTypeId) === String(form.unitTypeId))
      .map((item) => ({ value: String(item.id), label: item.label }));
  }, [apartmentsOptions, form.unitTypeId]);

  const recent = useMemo(
    () =>
      correspondences.map((item) => ({
        id: item.id,
        courier: item.courier_company,
        unit: item?.apartment?.number ? `Apto ${item.apartment.number}` : "Unidad",
        type: formatPackageType(item.package_type),
        status: item.status || (item.delivered ? "DELIVERED" : "RECEIVED_BY_SECURITY"),
        receiver:
          item?.resident_receiver?.user?.full_name ||
          item?.resident_receiver?.user?.name ||
          "-",
        delivered: (item.status || "") === "DELIVERED" || Boolean(item.delivered),
        date: formatDate(item.created_at),
        signatureUrl: item.signature_url || null,
        raw: item,
      })),
    [correspondences]
  );

  const residentOptions = useMemo(
    () =>
      residents.map((resident) => ({
        id: resident.id,
        label:
          resident?.user?.full_name ||
          resident?.user?.name ||
          resident?.full_name ||
          `Residente ${resident.id}`,
      })),
    [residents]
  );

  const canSubmit =
    form.courier &&
    form.unitTypeId &&
    form.unitId &&
    form.packageType;

  const onPickPhoto = (file) => {
    setPhotoFile(file || null);
    clearFieldError("evidence_photo");

    if (!file) {
      setPhotoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
      });
      return;
    }

    const url = URL.createObjectURL(file);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "unitId") clearFieldError("apartment_id");
    if (name === "receiverType") {
      setLocalErrors((prev) => ({ ...prev, receiverType: "", signature: "" }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSubmit || !activeCondominiumId || submitting) return;

    const nextLocalErrors = {};
    if (!form.receiverType) {
      nextLocalErrors.receiverType = "Selecciona quién recibe.";
    }
    if (form.receiverType === "dueno" && !signatureDataUrl) {
      nextLocalErrors.signature = "La firma es obligatoria cuando recibe el dueño.";
    }

    setLocalErrors(nextLocalErrors);
    if (Object.keys(nextLocalErrors).length > 0) return;

    try {
      const created = await createCorrespondence({
        courier_company: form.courier,
        package_type: form.packageType,
        apartment_id: Number(form.unitId),
        evidence_photo: photoFile,
        digital_signature: form.receiverType === "dueno" ? signatureDataUrl || null : null,
      });

      if (form.receiverType === "dueno" && created?.id) {
        const ownerResident = residents.find(
          (resident) =>
            String(resident?.apartment_id || "") === String(form.unitId) &&
            String(resident?.type || "").toLowerCase() === "propietario"
        );

        if (ownerResident?.id) {
          await deliverCorrespondence(created.id, ownerResident.id, signatureDataUrl);
        } else {
          setLocalErrors({
            receiverType: "No se encontró un residente propietario para esta unidad.",
          });
          return;
        }
      }

      setForm({
        courier: "Servientrega",
        unitTypeId: "",
        unitId: "",
        packageType: "documento",
        receiverType: "seguridad",
        receiverName: "",
        notes: "",
      });
      clearPhoto();
      setSignatureDataUrl("");
      setLocalErrors({});
    } catch {
      // Errors are handled by hook state.
    }
  };

  const handleDeliver = async (residentReceiverId, digitalSignature) => {
    if (!deliveryItem?.id || delivering) return;

    try {
      await deliverCorrespondence(deliveryItem.id, residentReceiverId, digitalSignature);
      setDeliveryItem(null);
    } catch {
      // Errors are handled by hook state.
    }
  };

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="mb-3">
            <BackButton variant="dashboard" />
          </div>
          <Kicker>Gestión de accesos</Kicker>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Title>Correspondencia</Title>
            </div>
          </div>
        </div>

        {!activeCondominiumId ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-700">
            No hay propiedad activa para gestionar correspondencia.
          </div>
        ) : null}

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {loadingInitial ? (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-500">
            Cargando datos iniciales...
          </div>
        ) : null}

        <div className="flex flex-col gap-6">
          <CorrespondenceFormModal
            unitTypes={unitTypeOptions}
            couriers={couriers}
            form={form}
            fileRef={fileRef}
            photoPreview={photoPreview}
            fieldErrors={{ ...fieldErrors, ...localErrors }}
            canSubmit={canSubmit}
            submitting={submitting}
            onChange={handleChange}
            onCourierChange={(value) => {
              setForm((prev) => ({ ...prev, courier: String(value) }));
              clearFieldError("courier_company");
            }}
            onUnitTypeChange={(value) => {
              setForm((prev) => ({
                ...prev,
                unitTypeId: String(value),
                unitId: "",
              }));
              clearFieldError("apartment_id");
            }}
            onUnitChange={(value) => {
              setForm((prev) => ({ ...prev, unitId: String(value) }));
              clearFieldError("apartment_id");
            }}
            apartments={filteredApartmentOptions}
            onPickPhotoClick={() => fileRef.current?.click()}
            onPickPhoto={onPickPhoto}
            onClearPhoto={clearPhoto}
            onPackageTypeChange={(packageType) => {
              setForm((prev) => ({ ...prev, packageType }));
              clearFieldError("package_type");
            }}
            onReceiverTypeChange={(receiverType) => {
              setForm((prev) => ({ ...prev, receiverType }));
              setLocalErrors((prev) => ({ ...prev, receiverType: "", signature: "" }));
              if (receiverType === "seguridad") {
                setSignatureDataUrl("");
              }
            }}
            onSubmit={handleSubmit}
            onSignatureChange={(nextValue) => {
              setSignatureDataUrl(nextValue || "");
              clearFieldError("digital_signature");
            }}
          />

          <CorrespondenceTable
            recent={recent}
            onRequestDeliver={(item) => {
              if ((item?.status || "RECEIVED_BY_SECURITY") === "RECEIVED_BY_SECURITY") {
                setDeliveryItem(item.raw);
                clearDeliveryFieldError("digital_signature");
                clearDeliveryFieldError("resident_receiver_id");
              }
            }}
          />
        </div>
      </div>

      <DeliveryModal
        open={Boolean(deliveryItem)}
        item={
          deliveryItem
            ? {
                courier: deliveryItem.courier_company,
                unit: deliveryItem?.apartment?.number ? `Apto ${deliveryItem.apartment.number}` : "Unidad",
              }
            : null
        }
        loading={delivering}
        fieldErrors={deliveryFieldErrors}
        residents={residentOptions}
        onClose={() => setDeliveryItem(null)}
        onSubmit={handleDeliver}
        clearFieldError={clearDeliveryFieldError}
      />
    </div>
  );
}

function formatPackageType(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "paquete") return "Paquete";
  if (normalized === "documento") return "Documento";
  return value || "Documento";
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-CO");
}
