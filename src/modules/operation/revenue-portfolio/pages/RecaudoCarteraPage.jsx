import { useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import BackButton from "../../../../components/common/BackButton";
import CollectionFormCard from "../components/CollectionFormCard";
import CollectionsTable from "../components/CollectionsTable";
import PortfolioStatusTable from "../components/PortfolioStatusTable";
import SummaryCards from "../components/SummaryCards";
import {
  collectionUnitOptions,
  mockCollections,
  portfolioStatusRecords,
  revenueSummaryCards,
} from "../data/mockCollections";

function createInitialFormState() {
  return {
    unitId: "",
    owner: "",
    amount: "",
    collectedAt: getTodayInputValue(),
  };
}

function RecaudoCarteraPage() {
  const [collections, setCollections] = useState(mockCollections);
  const [form, setForm] = useState(createInitialFormState);
  const [errors, setErrors] = useState({});
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [selectedRecordId, setSelectedRecordId] = useState(mockCollections[0]?.id || null);
  const [detailMode, setDetailMode] = useState("view");
  const [activeTab, setActiveTab] = useState("estado");

  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  const selectedRecord = useMemo(
    () => collections.find((record) => record.id === selectedRecordId) || null,
    [collections, selectedRecordId]
  );

  const records = useMemo(
    () =>
      collections.map((record) => ({
        ...record,
        amountLabel: formatCurrency(record.amount),
        dateLabel: formatDate(record.collectedAt),
      })),
    [collections]
  );

  const portfolioStatus = useMemo(
    () =>
      portfolioStatusRecords.map((record) => ({
        ...record,
        dueDateLabel: formatDate(record.dueDate),
        daysOverdueLabel: Number(record.daysOverdue || 0) > 0 ? `${record.daysOverdue} dias` : "-",
      })),
    []
  );

  const unitOptions = useMemo(
    () =>
      collectionUnitOptions.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    []
  );

  const unitById = useMemo(
    () =>
      collectionUnitOptions.reduce((accumulator, option) => {
        accumulator[option.value] = option;
        return accumulator;
      }, {}),
    []
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleUnitChange = (value) => {
    const nextUnit = unitById[value];

    setForm((prev) => ({
      ...prev,
      unitId: String(value),
      owner: nextUnit?.owner || prev.owner,
    }));
    setErrors((prev) => ({ ...prev, unitId: "", owner: "" }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFileError("El archivo supera el maximo permitido de 5MB.");
      setFileName("");
      event.target.value = "";
      return;
    }

    setFileError("");
    setFileName(file.name);
  };

  const handleReset = () => {
    setForm(createInitialFormState());
    setErrors({});
    setFileError("");
    setFileName("");
    setDetailMode("view");
    setSelectedRecordId(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleView = (record) => {
    setSelectedRecordId(record.id);
    setDetailMode("view");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!form.unitId) nextErrors.unitId = "Selecciona una unidad.";
    if (!String(form.owner || "").trim()) nextErrors.owner = "Ingresa el propietario.";
    if (!Number(form.amount)) nextErrors.amount = "Ingresa un valor valido.";
    if (!form.collectedAt) nextErrors.collectedAt = "Selecciona una fecha.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || fileError) return;

    const unitInfo = unitById[form.unitId];
    const normalizedAmount = Number(form.amount);
    const nextRecord = {
      id: detailMode === "edit" && selectedRecord ? selectedRecord.id : `rc-local-${Date.now()}`,
      unitId: form.unitId,
      unit: unitInfo?.unit || "Unidad sin definir",
      owner: String(form.owner || "").trim(),
      amount: normalizedAmount,
      collectedAt: form.collectedAt,
      status: detailMode === "edit" && selectedRecord ? selectedRecord.status : "Recaudado",
      evidenceName: fileName || "sin-adjunto",
    };

    setCollections((prev) => {
      if (detailMode === "edit" && selectedRecord) {
        return prev.map((item) => (item.id === selectedRecord.id ? nextRecord : item));
      }

      return [nextRecord, ...prev];
    });

    setSelectedRecordId(nextRecord.id);
    setDetailMode("view");
    setForm(createInitialFormState());
    setErrors({});
    setFileError("");
    setFileName("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const scrollToForm = () => {
    setDetailMode("view");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-start gap-4 sm:gap-5">
          <BackButton variant="dashboard" className="mt-1 shrink-0" />

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Recaudo y Cartera
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-[2rem]">
              Gestion de Cartera
            </h1>
          </div>
        </div>
      </header>

      <div className="mt-8">
        <SummaryCards cards={revenueSummaryCards} />
      </div>

      <div className="mt-8 space-y-8">
        <div ref={formRef}>
          <CollectionFormCard
            form={form}
            unitOptions={unitOptions}
            errors={errors}
            fileName={fileName}
            fileError={fileError}
            selectedRecord={
              selectedRecord
                ? {
                    ...selectedRecord,
                    amountLabel: formatCurrency(selectedRecord.amount),
                    dateLabel: formatDate(selectedRecord.collectedAt),
                  }
                : null
            }
            detailMode={detailMode}
            fileInputRef={fileInputRef}
            onChange={handleChange}
            onUnitChange={handleUnitChange}
            onPickFile={() => fileInputRef.current?.click()}
            onFileChange={handleFileChange}
            onSubmit={handleSubmit}
            onReset={handleReset}
          />
        </div>

        <section className="rounded-3xl border border-gray-100 bg-white p-3 shadow-sm">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-2 text-xs font-semibold sm:text-sm">
            <button
              type="button"
              onClick={() => setActiveTab("estado")}
              className={[
                "rounded-xl px-4 py-3 transition",
                activeTab === "estado" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:bg-white/60",
              ].join(" ")}
            >
              Estado de cartera
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("historial")}
              className={[
                "rounded-xl px-4 py-3 transition",
                activeTab === "historial" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:bg-white/60",
              ].join(" ")}
            >
              Historial de recaudos
            </button>
          </div>
        </section>

        {activeTab === "estado" ? (
          <PortfolioStatusTable
            rows={portfolioStatus}
            selectedId={selectedRecordId}
            onView={handleView}
          />
        ) : (
          <CollectionsTable
            records={records}
            selectedId={selectedRecordId}
            onView={handleView}
          />
        )}
      </div>

      <button
        type="button"
        onClick={scrollToForm}
        className="fixed bottom-6 right-6 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700 active:scale-[0.98]"
        aria-label="Registrar recaudo"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getTodayInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default RecaudoCarteraPage;
