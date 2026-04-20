import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import BackButton from "../../../../components/common/BackButton";
import { useNotification } from "../../../../hooks/useNotification";
import CollectionFormCard from "../components/CollectionFormCard";
import CollectionsTable from "../components/CollectionsTable";
import PortfolioStatusTable from "../components/PortfolioStatusTable";
import SummaryCards from "../components/SummaryCards";
import { useRevenuePortfolio } from "../hooks/useRevenuePortfolio";

function createInitialFormState() {
  return {
    unitId: "",
    owner: "",
    amount: "",
    collectedAt: getTodayInputValue(),
  };
}
function getCurrentPeriod() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')

  return `${year}-${month}`
}

function RecaudoCarteraPage() {
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentPeriod());
  const {
    summary,
    portfolioStatus: portfolioStatusRows,
    collections,
    unitOptions: rawUnitOptions,
    debtSummary,
    loading,
    submitting,
    generating,
    error,
    createCollection,
    generateCurrentPortfolio,
  } = useRevenuePortfolio({ period: selectedPeriod });
  const { success: notifySuccess, error: notifyError, warning: notifyWarning } = useNotification();

  const [form, setForm] = useState(createInitialFormState);
  const [errors, setErrors] = useState({});
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [detailMode, setDetailMode] = useState("view");
  const [activeTab, setActiveTab] = useState("estado");

  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  const records = useMemo(
    () =>
      collections.map((record) => ({
        id: record?.id,
        unit: record?.unit || record?.unidad || "Unidad sin definir",
        owner: record?.owner || record?.propietario || "-",
        amount: Number(record?.amount ?? record?.valor ?? 0),
        collectedAt: record?.payment_date || record?.fecha_recaudo || null,
        evidenceUrl: record?.evidence_url || null,
        evidenceName: record?.evidence_name || null,
        amountLabel: formatCurrency(record?.amount ?? record?.valor ?? 0),
        dateLabel: formatDate(record?.payment_date || record?.fecha_recaudo),
      })),
    [collections]
  );

  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedRecordId) || null,
    [records, selectedRecordId]
  );

  useEffect(() => {
    if (!selectedRecordId && records.length > 0) {
      setSelectedRecordId(records[0].id);
    }
  }, [records, selectedRecordId]);

  const portfolioStatus = useMemo(
    () => {
      const debtByApartment = (Array.isArray(debtSummary) ? debtSummary : []).reduce((accumulator, item) => {
        const apartmentKey = normalizeApartmentKey(item?.apartment);
        if (!apartmentKey) return accumulator;

        const nextDebt = Number(item?.debt ?? 0);
        accumulator[apartmentKey] = Number.isFinite(nextDebt) ? nextDebt : 0;
        return accumulator;
      }, {});

      return portfolioStatusRows.map((row) => {
        const unit = row?.unit || row?.unidad || "Unidad sin definir";
        const debtValue = Number(debtByApartment[normalizeApartmentKey(unit)] ?? 0);

        return {
        id: row?.id,
        unit,
        owner: row?.owner || row?.propietario || "-",
        dueDate: row?.due_date || row?.fecha_vencimiento || null,
        debt: debtValue,
        debtLabel: formatCurrency(debtValue),
        daysOverdue: Number(row?.days_overdue ?? row?.dias_en_mora ?? 0),
        status: mapBackendStatusToLabel(row?.status || row?.estado),
        dueDateLabel: formatDate(row?.due_date || row?.fecha_vencimiento),
        daysOverdueLabel:
          Number(row?.days_overdue ?? row?.dias_en_mora ?? 0) > 0
            ? `${Number(row?.days_overdue ?? row?.dias_en_mora ?? 0)} dias`
            : "-",
      };
      });
    },
    [debtSummary, portfolioStatusRows]
  );

  const summaryCards = useMemo(() => createSummaryCards(summary), [summary]);

  const unitOptions = useMemo(
    () =>
      rawUnitOptions.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    [rawUnitOptions]
  );

  const unitById = useMemo(
    () =>
      rawUnitOptions.reduce((accumulator, option) => {
        accumulator[String(option.value)] = option;
        return accumulator;
      }, {}),
    [rawUnitOptions]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => {
      const next = { ...prev };
      if (name === "unitId") {
        delete next.unitId;
      } else if (name === "amount") {
        delete next.amount;
      } else if (name === "collectedAt") {
        delete next.collectedAt;
      } else if (name === "owner") {
        delete next.owner;
      }
      return next;
    });
  };

  const handleUnitChange = (value) => {
    const nextUnit = unitById[String(value)];

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
      setEvidenceFile(null);
      event.target.value = "";
      return;
    }

    setFileError("");
    setFileName(file.name);
    setEvidenceFile(file);
  };

  const handleReset = () => {
    setForm(createInitialFormState());
    setErrors({});
    setFileError("");
    setFileName("");
    setEvidenceFile(null);
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

  const handleOpenEvidence = (record) => {
    if (!record?.evidenceUrl) {
      setFileError("Este recaudo no tiene comprobante disponible.");
      return;
    }

    window.open(record.evidenceUrl, "_blank", "noopener,noreferrer");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!form.unitId) nextErrors.unitId = "Selecciona una unidad.";
    if (!String(form.owner || "").trim()) nextErrors.owner = "Ingresa el propietario.";
    if (!Number(form.amount) || Number(form.amount) <= 0) nextErrors.amount = "Ingresa un valor valido.";
    if (!form.collectedAt) nextErrors.collectedAt = "Selecciona una fecha.";

    const unitInfo = unitById[String(form.unitId)];
    if (form.unitId && !unitInfo?.charge_id) {
      nextErrors.unitId = "La unidad no tiene deuda mensual activa para registrar recaudo.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || fileError) return;

    try {
      const created = await createCollection({
        chargeId: unitInfo?.charge_id,
        amount: Number(form.amount),
        paymentDate: form.collectedAt,
        evidence: evidenceFile || null,
      });

      setSelectedRecordId(created?.id || null);
      setDetailMode("view");
      setForm(createInitialFormState());
      setErrors({});
      setFileError("");
      setFileName("");
      setEvidenceFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        ...mapBackendErrorsToForm(err),
      }));
    }
  };

  const scrollToForm = () => {
    setDetailMode("view");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleGeneratePortfolio = async () => {
    try {
      const response = await generateCurrentPortfolio();
      const createdCount = Number(response?.total_creados || 0);
      const skippedCount = Number(response?.total_omitidos || 0);
      const responseMessage = String(response?.message || "").trim();

      if (createdCount === 0) {
        notifyWarning(
          responseMessage || `La cartera del mes actual ya fue generada. Omitidos: ${skippedCount}.`
        );
        return;
      }

      notifySuccess(
        responseMessage || `Cartera generada correctamente. Creados: ${createdCount}. Omitidos: ${skippedCount}.`
      );
    } catch (requestError) {
      notifyError(
        normalizeApiError(requestError, "No fue posible generar la cartera mensual.")
      );
    }
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
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[170px] flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Periodo</span>
            <input
              type="month"
              value={selectedPeriod}
              onChange={(event) => setSelectedPeriod(event.target.value || getCurrentPeriod())}
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <button
            type="button"
            onClick={handleGeneratePortfolio}
            disabled={generating || loading}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {generating ? "Generando..." : "Generar cartera"}
          </button>
        </div>
      </header>

      {error ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mt-8">
        <SummaryCards cards={summaryCards} />
      </div>

      <div className="mt-8 space-y-8">
        <div ref={formRef}>
          <CollectionFormCard
            form={form}
            unitOptions={unitOptions}
            errors={errors}
            fileName={fileName}
            fileError={fileError}
            selectedRecord={selectedRecord}
            detailMode={detailMode}
            fileInputRef={fileInputRef}
            onChange={handleChange}
            onUnitChange={handleUnitChange}
            onPickFile={() => fileInputRef.current?.click()}
            onFileChange={handleFileChange}
            onSubmit={handleSubmit}
            onReset={handleReset}
            saving={submitting}
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
          <PortfolioStatusTable rows={portfolioStatus} selectedId={selectedRecordId} loading={loading} />
        ) : (
          <CollectionsTable
            records={records}
            selectedId={selectedRecordId}
            loading={loading}
            onView={handleView}
            onOpenEvidence={handleOpenEvidence}
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

function createSummaryCards(summary) {
  const totalCharged = Number(summary?.total_charged ?? 0);
  const totalCollected = Number(summary?.total_collected ?? summary?.total_recaudado ?? 0);
  const pendingPortfolio = Number(summary?.total_pending ?? summary?.pending_portfolio ?? summary?.cartera_pendiente ?? 0);
  const collectionRate = Number(summary?.porcentaje_recaudo ?? 0);

  return [
    {
      id: "charged",
      label: "Total facturado",
      value: formatCurrency(totalCharged),
      tone: "blue",
      icon: "wallet",
    },
    {
      id: "collected",
      label: "Total recaudado",
      value: formatCurrency(totalCollected),
      tone: "amber",
      icon: "portfolio",
    },
    {
      id: "pending",
      label: "Total pendiente",
      value: formatCurrency(pendingPortfolio),
      tone: "red",
      icon: "overdue",
    },
    {
      id: "rate",
      label: "Porcentaje recaudo",
      value: `${collectionRate.toFixed(2)}%`,
      tone: "emerald",
      icon: "calendar",
    },
  ];
}

function mapBackendStatusToLabel(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "en_mora") return "En mora";
  if (normalized === "proximo_a_vencer") return "Proximo a vencer";
  return "Al dia";
}

function mapBackendErrorsToForm(err) {
  const fieldErrors = err?.response?.data?.errors;
  if (!fieldErrors || typeof fieldErrors !== "object") return {};

  const next = {};

  if (fieldErrors.charge_id?.[0]) {
    next.unitId = String(fieldErrors.charge_id[0]);
  }

  if (fieldErrors.amount?.[0]) {
    next.amount = String(fieldErrors.amount[0]);
  }

  if (fieldErrors.payment_date?.[0]) {
    next.collectedAt = String(fieldErrors.payment_date[0]);
  }

  if (fieldErrors.evidence?.[0]) {
    next.file = String(fieldErrors.evidence[0]);
  }

  return next;
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

function normalizeApartmentKey(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

export default RecaudoCarteraPage;
