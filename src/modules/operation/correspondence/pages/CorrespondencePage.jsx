import { useMemo, useRef, useState } from "react";
import BackButton from "../../../../components/common/BackButton";
import CorrespondenceFormModal from "../components/CorrespondenceFormModal";
import CorrespondenceTable from "../components/CorrespondenceTable";
import DeliveryModal from "../components/DeliveryModal";
import { useCorrespondence } from "../hooks/useCorrespondence";
import { useNotification } from "../../../../hooks/useNotification";
import { normalizeRoleName } from "../../../../utils/roles";

const Title = ({ children }) => (
  <h1 className="mt-2 text-2xl font-extrabold text-slate-900 leading-tight">
    {children}
  </h1>
);

export default function CorrespondencePage() {
  const { success, error: notifyError } = useNotification();
  const {
    apartments,
    residents,
    operatives,
    correspondences,
    currentPage,
    pagination,
    setCurrentPage,
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
    () => [
      "Otro",
      "Servientrega",
      "Inter Rapidísimo",
      "Coordinadora",
      "4-72",
      "TCC",
      "Envía",
      "Deprisa",
    ],
    []
  );

  const [form, setForm] = useState({
    courier: "Servientrega",
    courierOther: "",
    unitTypeId: "",
    unitId: "",
    packageType: "documento",
    receiverType: "seguridad",
    securityUserId: "",
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

  const filteredResidentOptions = useMemo(() => {
    const selectedApartmentId = String(form.unitId || "");

    const options = residents
      .filter((resident) => !selectedApartmentId || String(resident?.apartment_id || "") === selectedApartmentId)
      .map((resident) => ({
        value: String(resident.id),
        label:
          resident?.user?.full_name ||
          resident?.user?.name ||
          resident?.full_name ||
          `Residente ${resident.id}`,
      }));

    return options.sort((a, b) => String(a.label || "").localeCompare(String(b.label || ""), "es"));
  }, [form.unitId, residents]);

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
        receiverDocument:
          item?.resident_receiver?.user?.document_number ||
          item?.resident_receiver?.document_number ||
          "",
        delivered: (item.status || "") === "DELIVERED" || Boolean(item.delivered),
        date: formatDate(item.created_at),
        deliveredAt: item.delivered_at ? formatTime(item.delivered_at) : "",
        evidencePhotoUrl: item.evidence_photo_url || null,
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

  const securityUserOptions = useMemo(
    () =>
      (operatives || [])
        .filter((operative) => isSecurityOperative(operative))
        .map((operative) => operative?.user)
        .filter((user) => user?.id)
        .map((user) => ({
          value: String(user.id),
          label: user.full_name || "Sin nombre",
        })),
    [operatives]
  );

  const canSubmit =
    form.courier &&
    (form.courier !== "Otro" || String(form.courierOther || "").trim()) &&
    form.unitTypeId &&
    form.unitId &&
    form.packageType &&
    form.securityUserId;

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
    if (name === "courierOther") {
      clearFieldError("courier_company");
      setLocalErrors((prev) => ({ ...prev, courierOther: "" }));
    }
    if (name === "receiverType") {
      setLocalErrors((prev) => ({ ...prev, receiverType: "", signature: "" }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSubmit || !activeCondominiumId || submitting) return;

    const nextLocalErrors = {};
    if (form.courier === "Otro" && !String(form.courierOther || "").trim()) {
      nextLocalErrors.courierOther = "Ingresa la empresa de mensajería.";
    }
    if (!form.receiverType) {
      nextLocalErrors.receiverType = "Selecciona quién recibe.";
    }
    if (form.receiverType === "dueno" && !signatureDataUrl) {
      nextLocalErrors.signature = "La firma es obligatoria cuando recibe el dueño.";
    }

    setLocalErrors(nextLocalErrors);
    if (Object.keys(nextLocalErrors).length > 0) return;

    try {
      const resolvedCourierCompany =
        form.courier === "Otro" ? String(form.courierOther || "").trim() : form.courier;

      if (form.receiverType === "dueno" && !String(form.receiverName || "").trim()) {
        setLocalErrors({
          receiverName: "Escribe el nombre del destinatario.",
        });
        return;
      }

      await createCorrespondence({
        courier_company: resolvedCourierCompany,
        package_type: form.packageType,
        apartment_id: Number(form.unitId),
        received_by_id: Number(form.securityUserId),
        evidence_photo: photoFile,
        resident_receiver_id: form.receiverType === "dueno" ? Number(form.receiverName) : null,
        digital_signature: form.receiverType === "dueno" ? signatureDataUrl || null : null,
        deliver_immediately: form.receiverType === "dueno",
      });

      setForm({
        courier: "Servientrega",
        courierOther: "",
        unitTypeId: "",
        unitId: "",
        packageType: "documento",
        receiverType: "seguridad",
        securityUserId: "",
        receiverName: "",
        notes: "",
      });
      clearPhoto();
      setSignatureDataUrl("");
      setLocalErrors({});
      success(form.receiverType === "dueno" ? "Correspondencia entregada correctamente." : "Correspondencia registrada correctamente.");
    } catch (requestError) {
      notifyError(normalizeCorrespondenceError(requestError, "No fue posible registrar la correspondencia."));
    }
  };

  const handleDeliver = async (residentReceiverId, digitalSignature) => {
    if (!deliveryItem?.id || delivering) return;

    try {
      await deliverCorrespondence(deliveryItem.id, residentReceiverId, digitalSignature);
      setDeliveryItem(null);
      success("Entrega registrada correctamente.");
    } catch (requestError) {
      notifyError(normalizeCorrespondenceError(requestError, "No fue posible registrar la entrega."));
    }
  };

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="mb-3">
            <BackButton variant="dashboard" />
          </div>
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
              const nextCourier = String(value);
              setForm((prev) => ({
                ...prev,
                courier: nextCourier,
                courierOther: nextCourier === "Otro" ? prev.courierOther : "",
              }));
              setLocalErrors((prev) => ({ ...prev, courierOther: "" }));
              clearFieldError("courier_company");
            }}
            onUnitTypeChange={(value) => {
              setForm((prev) => ({
                ...prev,
                unitTypeId: String(value),
                unitId: "",
                receiverName: "",
              }));
              clearFieldError("apartment_id");
            }}
            onUnitChange={(value) => {
              setForm((prev) => ({ ...prev, unitId: String(value), receiverName: "" }));
              clearFieldError("apartment_id");
            }}
            apartments={filteredApartmentOptions}
            residents={filteredResidentOptions}
            onPickPhotoClick={() => fileRef.current?.click()}
            onPickPhoto={onPickPhoto}
            onClearPhoto={clearPhoto}
            onPackageTypeChange={(packageType) => {
              setForm((prev) => ({ ...prev, packageType }));
              clearFieldError("package_type");
            }}
            onReceiverTypeChange={(receiverType) => {
              setForm((prev) => ({
                ...prev,
                receiverType,
                receiverName: receiverType === "dueno" ? prev.receiverName : "",
              }));
              setLocalErrors((prev) => ({ ...prev, receiverType: "", signature: "" }));
              if (receiverType === "seguridad") {
                setSignatureDataUrl("");
              }
            }}
            securityUsers={securityUserOptions}
            onSecurityUserChange={(value) => {
              setForm((prev) => ({ ...prev, securityUserId: String(value) }));
              clearFieldError("received_by_id");
            }}
            onResidentReceiverChange={(value) => {
              setForm((prev) => ({ ...prev, receiverName: String(value) }));
              setLocalErrors((prev) => ({ ...prev, receiverName: "" }));
              clearFieldError("resident_receiver_id");
            }}
            onSubmit={handleSubmit}
            onSignatureChange={(nextValue) => {
              setSignatureDataUrl(nextValue || "");
              clearFieldError("digital_signature");
            }}
            signatureValue={signatureDataUrl}
          />

          <CorrespondenceTable
            recent={recent}
            loading={loadingInitial || delivering || submitting}
            currentPage={pagination.currentPage || currentPage}
            totalPages={pagination.lastPage || 1}
            totalItems={pagination.total || 0}
            onPageChange={setCurrentPage}
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

function isSecurityOperative(operative) {
  const roleName = normalizeRoleName(operative?.role?.name || "");
  const positionName = normalizeRoleName(operative?.position || "");
  const searchable = `${roleName} ${positionName}`.trim();

  return (
    searchable.includes("seguridad") ||
    searchable.includes("vigilante") ||
    searchable.includes("porteria")
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

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeCorrespondenceError(error, fallbackMessage) {
  const responseData = error?.response?.data;
  const fieldErrors = responseData?.errors;

  if (fieldErrors && typeof fieldErrors === "object") {
    const firstFieldErrors = Object.values(fieldErrors).find(
      (messages) => Array.isArray(messages) && messages.length > 0
    );
    if (firstFieldErrors) {
      return String(firstFieldErrors[0]);
    }
  }

  return responseData?.message || error?.message || fallbackMessage;
}
