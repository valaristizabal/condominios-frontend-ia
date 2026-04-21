import { useEffect, useMemo, useRef, useState } from "react";
import { Download } from "lucide-react";
import BackButton from "../../../../components/common/BackButton";
import { useNotification } from "../../../../hooks/useNotification";
import CollectionFormCard from "../components/CollectionFormCard";
import CollectionsTable from "../components/CollectionsTable";
import PortfolioStatusTable from "../components/PortfolioStatusTable";
import SummaryCards from "../components/SummaryCards";
import { useRevenuePortfolio } from "../hooks/useRevenuePortfolio";
import { exportRevenuePortfolioWorkbook } from "./revenuePortfolioExcel";

const CREDIT_STORAGE_KEY = "genaccess.revenuePortfolio.creditBalances.v2";

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
    portfolioCharges,
    debtSummary,
    portfolioOwnersByApartment,
    loading,
    submitting,
    generating,
    error,
    activeCondominiumId,
    loadData,
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
  const [statusFilter, setStatusFilter] = useState("todos");
  const [exporting, setExporting] = useState(false);
  const [creditBalances, setCreditBalances] = useState({});
  const [localHistoryRecords, setLocalHistoryRecords] = useState([]);

  const fileInputRef = useRef(null);

  const backendRecords = useMemo(
    () =>
      collections.map((record) => normalizeCollectionRecord(record, portfolioOwnersByApartment)),
    [collections, portfolioOwnersByApartment]
  );

  const records = useMemo(() => {
    const hiddenBackendIds = new Set(
      localHistoryRecords.flatMap((record) => record.backendCollectionIds || []).map((id) => String(id))
    );
    const visibleBackendRecords = backendRecords.filter(
      (record) => !hiddenBackendIds.has(String(record.backendId))
    );

    return [...localHistoryRecords, ...visibleBackendRecords].sort(compareCollectionRecords);
  }, [backendRecords, localHistoryRecords]);

  const chargesByApartment = useMemo(
    () => groupChargesByApartment(portfolioCharges),
    [portfolioCharges]
  );

  const debtSummaryByApartment = useMemo(
    () => buildDebtSummaryByApartment(debtSummary),
    [debtSummary]
  );

  useEffect(() => {
    if (!selectedRecordId && records.length > 0) {
      setSelectedRecordId(records[0].id);
    }
  }, [records, selectedRecordId]);

  useEffect(() => {
    setCreditBalances(readStoredCreditBalances(activeCondominiumId));
    setLocalHistoryRecords([]);
  }, [activeCondominiumId, selectedPeriod]);

  const portfolioStatus = useMemo(
    () => {
      return portfolioStatusRows.map((row) => {
        const unit = row?.unit || row?.unidad || "Unidad sin definir";
        const apartmentKey = getApartmentKey(row) || normalizeApartmentKey(unit);
        const chargeRows = chargesByApartment[apartmentKey] || [];
        const debtInfo = debtSummaryByApartment[apartmentKey] || debtSummaryByApartment[normalizeApartmentKey(unit)] || null;
        const financialState = resolveUnitFinancialState({
          row,
          chargeRows,
          debtInfo,
          storedCredit: Number(creditBalances[apartmentKey] || 0),
        });

        return {
          id: row?.id,
          apartmentKey,
          unit,
          owner: resolvePortfolioOwner(row, portfolioOwnersByApartment),
          dueDate: row?.due_date || row?.fecha_vencimiento || null,
          cutoffValue: financialState.cutoffValue,
          cutoffValueLabel: formatCurrency(financialState.cutoffValue),
          debt: financialState.pendingBalance,
          debtLabel: formatCurrency(financialState.pendingBalance),
          pendingBalance: financialState.pendingBalance,
          pendingBalanceLabel: formatCurrency(financialState.pendingBalance),
          creditBalance: financialState.creditBalance,
          creditBalanceLabel: formatCurrency(financialState.creditBalance),
          daysOverdue: Number(row?.days_overdue ?? row?.dias_en_mora ?? 0),
          status: financialState.status,
          dueDateLabel: formatDate(row?.due_date || row?.fecha_vencimiento),
          daysOverdueLabel:
            Number(row?.days_overdue ?? row?.dias_en_mora ?? 0) > 0
              ? `${Number(row?.days_overdue ?? row?.dias_en_mora ?? 0)} dias`
              : "-",
        };
      });
    },
    [chargesByApartment, creditBalances, debtSummaryByApartment, portfolioOwnersByApartment, portfolioStatusRows]
  );

  const summaryCards = useMemo(() => createSummaryCards(summary), [summary]);

  const unitOptions = useMemo(
    () =>
      rawUnitOptions.map((option) => ({
        value: String(option.apartment_id),
        label: option.unit_label || option.label || "Unidad sin definir",
      })),
    [rawUnitOptions]
  );

  const unitById = useMemo(
    () =>
      rawUnitOptions.reduce((accumulator, option) => {
        accumulator[String(option.apartment_id ?? option.value)] = option;
        return accumulator;
      }, {}),
    [rawUnitOptions]
  );

  const selectedUnitFinancialInfo = useMemo(() => {
    const unitInfo = unitById[String(form.unitId)];
    if (!unitInfo) return null;

    const unit = unitInfo?.unit || unitInfo?.unidad || unitInfo?.label || "";
    const apartmentKey = getApartmentKey(unitInfo) || normalizeApartmentKey(unit);
    const chargeRows = chargesByApartment[apartmentKey] || [];
    const debtInfo = debtSummaryByApartment[apartmentKey] || debtSummaryByApartment[normalizeApartmentKey(unit)] || null;
    const financialState = resolveUnitFinancialState({
      row: unitInfo,
      chargeRows,
      debtInfo,
      storedCredit: Number(creditBalances[apartmentKey] || 0),
    });

    return {
      ...financialState,
      apartmentKey,
      period: unitInfo?.period || selectedPeriod,
      dueDate: unitInfo?.due_date || unitInfo?.fecha_vencimiento || null,
      cutoffValueLabel: formatCurrency(financialState.cutoffValue),
      pendingBalanceLabel: formatCurrency(financialState.pendingBalance),
      creditBalanceLabel: formatCurrency(financialState.creditBalance),
    };
  }, [chargesByApartment, creditBalances, debtSummaryByApartment, form.unitId, selectedPeriod, unitById]);

  const paymentPreview = useMemo(() => {
    if (!selectedUnitFinancialInfo) return null;

    const paymentAmount = Number(form.amount || 0);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) return null;

    const nextState = calculateProjectedPaymentState({
      totalBackendPending: selectedUnitFinancialInfo.totalBackendPending,
      availableCredit: selectedUnitFinancialInfo.availableCredit,
      paymentAmount,
      dueDate: selectedUnitFinancialInfo.dueDate,
    });

    return {
      ...nextState,
      pendingBalanceLabel: formatCurrency(nextState.pendingBalance),
      creditBalanceLabel: formatCurrency(nextState.creditBalance),
    };
  }, [form.amount, selectedUnitFinancialInfo]);

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
      owner: resolvePortfolioOwner(nextUnit, portfolioOwnersByApartment) || prev.owner,
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
    const paymentAmount = Number(form.amount);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) nextErrors.amount = "Ingresa un valor valido.";
    if (!form.collectedAt) nextErrors.collectedAt = "Selecciona una fecha.";

    const unitInfo = unitById[String(form.unitId)];
    if (form.unitId && !unitInfo?.charge_id) {
      nextErrors.unitId = "La unidad no tiene deuda mensual activa para registrar recaudo.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || fileError) return;

    try {
      const apartmentKey = getApartmentKey(unitInfo) || normalizeApartmentKey(unitInfo?.unit || unitInfo?.label);
      const chargeRows = chargesByApartment[apartmentKey] || [];
      const allocationSource = chargeRows.length > 0 ? chargeRows : [unitInfo];
      const allocations = buildPaymentAllocations(allocationSource, paymentAmount);
      let remainingCredit = roundMoney(
        paymentAmount - allocations.reduce((total, allocation) => total + allocation.amount, 0)
      );
      const createdCollections = [];

      for (const allocation of allocations) {
        const created = await createCollection({
          chargeId: allocation.chargeId,
          amount: allocation.amount,
          paymentDate: form.collectedAt,
          evidence: evidenceFile || null,
          refresh: false,
        });
        if (created?.id) {
          createdCollections.push(created);
        }
      }

      if (remainingCredit > 0) {
        setCreditBalances((prev) => {
          const next = {
            ...prev,
            [apartmentKey]: roundMoney(Number(prev[apartmentKey] || 0) + remainingCredit),
          };
          writeStoredCreditBalances(activeCondominiumId, next);
          return next;
        });
      }

      const submittedRecord = buildSubmittedHistoryRecord({
        unitInfo,
        owner: form.owner,
        amount: paymentAmount,
        collectedAt: form.collectedAt,
        createdCollections,
        fileName,
        portfolioOwnersByApartment,
      });

      const shouldShowSubmittedRecord = isDateInSelectedPeriod(form.collectedAt, selectedPeriod);

      if (shouldShowSubmittedRecord) {
        setLocalHistoryRecords((prev) => [submittedRecord, ...prev]);
        setSelectedRecordId(submittedRecord.id);
      } else {
        setSelectedRecordId(null);
      }
      setDetailMode("view");
      setForm(createInitialFormState());
      setErrors({});
      setFileError("");
      setFileName("");
      setEvidenceFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await loadData();

      if (remainingCredit > 0) {
        notifySuccess(`Recaudo aplicado. Saldo a favor generado: ${formatCurrency(remainingCredit)}.`);
      }
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        ...mapBackendErrorsToForm(err),
      }));
    }
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

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportRevenuePortfolioWorkbook({
        portfolioRows: portfolioStatus,
        collectionRows: records,
        period: selectedPeriod,
        fileName: "gestion_cartera.xlsx",
      });
      notifySuccess("Archivo descargado correctamente.");
    } catch (exportError) {
      notifyError(normalizeApiError(exportError, "No fue posible descargar el archivo."));
    } finally {
      setExporting(false);
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
        <div>
          <CollectionFormCard
            form={form}
            unitOptions={unitOptions}
            errors={errors}
            fileName={fileName}
            fileError={fileError}
            detailMode={detailMode}
            financialInfo={selectedUnitFinancialInfo}
            paymentPreview={paymentPreview}
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
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid flex-1 grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-2 text-xs font-semibold sm:text-sm">
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

            <button
              type="button"
              onClick={handleExport}
              disabled={loading || exporting}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Download className="h-4 w-4" />
              {exporting ? "Descargando..." : "Descargar cartera"}
            </button>
          </div>
        </section>

        {activeTab === "estado" ? (
          <PortfolioStatusTable
            rows={portfolioStatus}
            selectedId={selectedRecordId}
            loading={loading}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
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

function buildSubmittedHistoryRecord({
  unitInfo,
  owner,
  amount,
  collectedAt,
  createdCollections = [],
  fileName = "",
  portfolioOwnersByApartment,
}) {
  const firstCreated = createdCollections[0] || null;
  const generatedId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id: generatedId,
    backendCollectionIds: createdCollections.map((record) => record.id).filter(Boolean),
    unit:
      unitInfo?.unit_label ||
      unitInfo?.label ||
      unitInfo?.unit ||
      unitInfo?.unidad ||
      firstCreated?.unit ||
      firstCreated?.unidad ||
      resolveApartmentLabelFromObject(firstCreated?.apartment) ||
      "Unidad sin definir",
    owner: resolveSubmittedHistoryOwner({
      unitInfo,
      firstCreated,
      typedOwner: owner,
      portfolioOwnersByApartment,
    }),
    amount: normalizeMoney(amount),
    collectedAt,
    evidenceUrl: firstCreated?.evidence_url || null,
    evidenceName: firstCreated?.evidence_name || fileName || null,
    amountLabel: formatCurrency(amount),
    dateLabel: formatDate(collectedAt),
    localCreatedAt: Date.now(),
  };
}

function normalizeCollectionRecord(record, portfolioOwnersByApartment) {
  const amount = normalizeMoney(record?.amount ?? record?.valor ?? record?.amount_paid ?? 0);
  const collectedAt = resolveCollectionDate(record);

  return {
    id: record?.id,
    backendId: record?.id,
    apartmentKey: getApartmentKey(record),
    unit:
      record?.unit ||
      record?.unidad ||
      resolveApartmentLabelFromObject(record?.apartment) ||
      record?.apartment?.label ||
      record?.apartment?.name ||
      "Unidad sin definir",
    owner: resolvePortfolioOwner(record, portfolioOwnersByApartment),
    amount,
    collectedAt,
    evidenceUrl: record?.evidence_url || record?.evidenceUrl || null,
    evidenceName: record?.evidence_name || record?.evidenceName || null,
    amountLabel: formatCurrency(amount),
    dateLabel: formatDate(collectedAt),
    createdAt: record?.created_at || null,
  };
}

function resolveCollectionDate(record) {
  const value =
    record?.payment_date ||
    record?.fecha_recaudo ||
    record?.collectedAt ||
    record?.paymentDate ||
    record?.created_at;

  return value ? String(value).slice(0, 10) : null;
}

function resolveApartmentLabelFromObject(apartment) {
  if (!apartment || typeof apartment !== "object") return "";

  const tower = String(apartment?.tower || "").trim();
  const number = String(apartment?.number || "").trim();

  if (tower && number) return `Torre ${tower}-${number}`;
  if (number) return `Apto ${number}`;
  return "";
}

function resolveSubmittedHistoryOwner({
  unitInfo,
  firstCreated,
  typedOwner,
  portfolioOwnersByApartment,
}) {
  const candidates = [
    resolveMappedPortfolioOwner(firstCreated, portfolioOwnersByApartment),
    resolveMappedPortfolioOwner(unitInfo, portfolioOwnersByApartment),
    firstCreated?.owner,
    firstCreated?.propietario,
    unitInfo?.owner,
    unitInfo?.propietario,
    typedOwner,
  ];

  const resolved = candidates.find((value) => String(value || "").trim() && String(value).trim() !== "-");
  return resolved ? String(resolved).trim() : "-";
}

function compareCollectionRecords(left, right) {
  const rightDate = new Date(`${right?.collectedAt || ""}T00:00:00`).getTime();
  const leftDate = new Date(`${left?.collectedAt || ""}T00:00:00`).getTime();
  const safeRightDate = Number.isNaN(rightDate) ? 0 : rightDate;
  const safeLeftDate = Number.isNaN(leftDate) ? 0 : leftDate;

  if (safeRightDate !== safeLeftDate) {
    return safeRightDate - safeLeftDate;
  }

  return getCollectionOrderValue(right) - getCollectionOrderValue(left);
}

function getCollectionOrderValue(record) {
  const value = Number(record?.localCreatedAt ?? record?.id ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function groupChargesByApartment(rows) {
  return (Array.isArray(rows) ? rows : []).reduce((accumulator, charge) => {
    const normalizedCharge = normalizeCharge(charge);
    if (!normalizedCharge.apartmentKey) return accumulator;

    if (!accumulator[normalizedCharge.apartmentKey]) {
      accumulator[normalizedCharge.apartmentKey] = [];
    }

    accumulator[normalizedCharge.apartmentKey].push(normalizedCharge);
    accumulator[normalizedCharge.apartmentKey].sort(compareChargesByAge);
    return accumulator;
  }, {});
}

function buildDebtSummaryByApartment(rows) {
  return (Array.isArray(rows) ? rows : []).reduce((accumulator, item) => {
    const apartmentKey = getApartmentKey(item);
    const labelKey = normalizeApartmentKey(item?.apartment || item?.unit || item?.unidad || "");
    const debtInfo = {
      debt: normalizeMoney(item?.debt ?? item?.saldo_pendiente ?? 0),
      totalCharges: normalizeMoney(item?.total_charges ?? item?.total_cargos ?? 0),
      totalPayments: normalizeMoney(item?.total_payments ?? item?.total_pagos ?? 0),
      credit: resolveExplicitCredit(item),
    };

    if (apartmentKey) accumulator[apartmentKey] = debtInfo;
    if (labelKey) accumulator[labelKey] = debtInfo;
    return accumulator;
  }, {});
}

function resolveUnitFinancialState({ row, chargeRows = [], debtInfo = null, storedCredit = 0 }) {
  const normalizedRow = normalizeCharge(row);
  const charges = chargeRows.length > 0 ? chargeRows : [normalizedRow].filter((charge) => charge.chargeId);
  const backendPendingFromCharges = charges.reduce(
    (total, charge) => total + Math.max(normalizeMoney(charge.balance), 0),
    0
  );
  const backendCreditFromCharges = charges.reduce(
    (total, charge) => total + Math.max(-normalizeMoney(charge.balance), 0),
    0
  );
  const debtValue = normalizeMoney(debtInfo?.debt);
  const totalBackendPending = roundMoney(Math.max(backendPendingFromCharges, Math.max(debtValue, 0)));
  const availableCredit = roundMoney(
    Math.max(storedCredit, 0) +
      backendCreditFromCharges +
      Math.max(-debtValue, 0) +
      resolveExplicitCredit(row) +
      normalizeMoney(debtInfo?.credit)
  );
  const pendingBalance = roundMoney(Math.max(totalBackendPending - availableCredit, 0));
  const creditBalance = roundMoney(Math.max(availableCredit - totalBackendPending, 0));
  const dueDate = row?.due_date || row?.fecha_vencimiento || normalizedRow.dueDate;
  const daysOverdue = normalizeMoney(row?.days_overdue ?? row?.dias_en_mora ?? 0);

  return {
    cutoffValue: normalizeMoney(row?.amount_total ?? row?.cutoff_value ?? row?.valor_corte ?? normalizedRow.amountTotal),
    totalBackendPending,
    availableCredit,
    pendingBalance,
    creditBalance,
    status: resolveFinancialStatus({ pendingBalance, creditBalance, dueDate, daysOverdue }),
  };
}

function calculateProjectedPaymentState({ totalBackendPending, availableCredit, paymentAmount, dueDate }) {
  const nextCreditPool = roundMoney(normalizeMoney(availableCredit) + normalizeMoney(paymentAmount));
  const pendingBalance = roundMoney(Math.max(normalizeMoney(totalBackendPending) - nextCreditPool, 0));
  const creditBalance = roundMoney(Math.max(nextCreditPool - normalizeMoney(totalBackendPending), 0));

  return {
    pendingBalance,
    creditBalance,
    status: resolveFinancialStatus({ pendingBalance, creditBalance, dueDate }),
  };
}

function buildPaymentAllocations(rows, amount) {
  let remaining = normalizeMoney(amount);
  const sourceRows = Array.isArray(rows) ? rows : [];
  const charges = sourceRows
    .map(normalizeCharge)
    .filter((charge) => charge.chargeId && normalizeMoney(charge.balance) > 0)
    .sort(compareChargesByAge);

  const allocations = [];

  if (charges.length === 0) {
    const firstChargeId = sourceRows
      .map((row) => normalizeCharge(row))
      .find((charge) => charge.chargeId)?.chargeId;

    if (firstChargeId && remaining > 0) {
      return [
        {
          chargeId: firstChargeId,
          amount: roundMoney(remaining),
        },
      ];
    }

    return allocations;
  }

  for (const charge of charges) {
    if (remaining <= 0) break;

    const allocationAmount = roundMoney(Math.min(remaining, normalizeMoney(charge.balance)));
    if (allocationAmount <= 0) continue;

    allocations.push({
      chargeId: charge.chargeId,
      amount: allocationAmount,
    });
    remaining = roundMoney(remaining - allocationAmount);
  }

  return allocations;
}

function normalizeCharge(charge) {
  const amountTotal = normalizeMoney(charge?.amount_total ?? charge?.amountTotal ?? charge?.valor_corte ?? 0);
  const amountPaid = normalizeMoney(charge?.amount_paid ?? charge?.amountPaid ?? 0);
  const rawBalance = charge?.balance ?? charge?.saldo_pendiente;
  const balance = rawBalance !== null && rawBalance !== undefined ? normalizeMoney(rawBalance) : roundMoney(amountTotal - amountPaid);

  return {
    chargeId: charge?.charge_id ?? charge?.id ?? null,
    apartmentKey: getApartmentKey(charge),
    period: charge?.period || "",
    dueDate: charge?.due_date || charge?.fecha_vencimiento || "",
    amountTotal,
    balance,
  };
}

function compareChargesByAge(left, right) {
  const leftPeriod = String(left?.period || "");
  const rightPeriod = String(right?.period || "");
  if (leftPeriod !== rightPeriod) return leftPeriod.localeCompare(rightPeriod);

  const leftDueDate = String(left?.dueDate || "");
  const rightDueDate = String(right?.dueDate || "");
  if (leftDueDate !== rightDueDate) return leftDueDate.localeCompare(rightDueDate);

  return Number(left?.chargeId || 0) - Number(right?.chargeId || 0);
}

function resolveFinancialStatus({ pendingBalance, creditBalance, dueDate, daysOverdue = 0 }) {
  if (normalizeMoney(creditBalance) > 0) return "Saldo a favor";
  if (normalizeMoney(pendingBalance) <= 0) return "Al dia";
  if (normalizeMoney(daysOverdue) > 0 || isPastDueDate(dueDate)) return "En mora";
  return "Saldo pendiente";
}

function isPastDueDate(value) {
  if (!value) return false;

  const dueDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(dueDate.getTime())) return false;

  const today = new Date();
  const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return dueDate.getTime() < currentDate.getTime();
}

function resolveExplicitCredit(row) {
  const candidates = [
    row?.saldo_a_favor,
    row?.credit_balance,
    row?.balance_credit,
    row?.favor_balance,
    row?.overpayment,
  ];

  return candidates.reduce((total, value) => total + Math.max(normalizeMoney(value), 0), 0);
}

function getApartmentKey(row) {
  const value = row?.apartment_id ?? row?.apartment?.id ?? row?.value;
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

function normalizeMoney(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return roundMoney(number);
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function isDateInSelectedPeriod(dateValue, selectedPeriod) {
  const normalizedDate = String(dateValue || "").slice(0, 10);
  const normalizedPeriod = String(selectedPeriod || "").trim();

  if (!normalizedDate) return false;
  if (["all", "historico", "historial"].includes(normalizedPeriod.toLowerCase())) return true;
  if (normalizedPeriod === "current" || normalizedPeriod === "") {
    return normalizedDate.startsWith(getCurrentPeriod());
  }

  return normalizedDate.startsWith(normalizedPeriod.slice(0, 7));
}

function readStoredCreditBalances(condominiumId) {
  if (typeof window === "undefined") return {};

  try {
    const rawValue = window.localStorage.getItem(CREDIT_STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : {};
    if (!parsedValue || typeof parsedValue !== "object") return {};
    const balances = parsedValue[getCreditStorageScope(condominiumId)] || {};
    if (!balances || typeof balances !== "object") return {};

    return Object.entries(balances).reduce((accumulator, [key, value]) => {
      const amount = normalizeMoney(value);
      if (amount > 0) accumulator[key] = amount;
      return accumulator;
    }, {});
  } catch {
    return {};
  }
}

function writeStoredCreditBalances(condominiumId, value) {
  if (typeof window === "undefined") return;

  try {
    const rawValue = window.localStorage.getItem(CREDIT_STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : {};
    const nextValue = parsedValue && typeof parsedValue === "object" ? parsedValue : {};
    nextValue[getCreditStorageScope(condominiumId)] = value || {};
    window.localStorage.setItem(CREDIT_STORAGE_KEY, JSON.stringify(nextValue));
  } catch {
    // localStorage can fail in private browsing; the in-memory state still keeps the UI consistent for the session.
  }
}

function getCreditStorageScope(condominiumId) {
  return condominiumId ? String(condominiumId) : "default";
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

function resolvePortfolioOwner(row, ownersByApartment) {
  const mappedOwner = resolveMappedPortfolioOwner(row, ownersByApartment);
  if (mappedOwner) return mappedOwner;

  return row?.owner || row?.propietario || "-";
}

function resolveMappedPortfolioOwner(row, ownersByApartment) {
  const apartmentId = row?.apartment_id ?? row?.apartment?.id ?? row?.value;
  if (apartmentId !== null && apartmentId !== undefined) {
    const resolvedOwner = ownersByApartment?.[String(apartmentId)]?.name;
    if (String(resolvedOwner || "").trim()) {
      return String(resolvedOwner).trim();
    }
  }

  return "";
}

export default RecaudoCarteraPage;
