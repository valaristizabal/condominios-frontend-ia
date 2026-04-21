import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BackButton from "../../../../components/common/BackButton";
import ExpenseFormCard from "../components/ExpenseFormCard";
import ExpenseFiltersBar from "../components/ExpenseFiltersBar";
import ExpenseSummaryCards from "../components/ExpenseSummaryCards";
import AdministrativeExpensesTable from "../components/AdministrativeExpensesTable";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import { createExpense, getExpenses } from "../services/expensesService";
import { exportAdministrativeExpensesWorkbook } from "./administrativeExpensesExcel";
import {
  expenseStatusOptions,
  expenseTypeOptions,
  paymentMethodOptions,
} from "../data/mockAdministrativeExpenses";

function createInitialFormState() {
  return {
    registeredAt: getTodayInputValue(),
    expenseType: "",
    amount: "",
    paymentMethod: "",
    observations: "",
    supportName: "",
    registeredBy: "",
  };
}

function AdministrativeExpensesPage() {
  const { activeCondominiumId } = useActiveCondominium();
  const [expenses, setExpenses] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [form, setForm] = useState(createInitialFormState);
  const [filters, setFilters] = useState({
    query: "",
    expenseType: "all",
    paymentMethod: "all",
  });
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);
  const [supportFileName, setSupportFileName] = useState("");
  const [supportFile, setSupportFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);
  const currentPeriod = useMemo(() => getCurrentPeriod(), []);

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

  const expenseTypeMap = useMemo(
    () => toOptionMap(expenseTypeOptions),
    []
  );
  const paymentMethodMap = useMemo(
    () => toOptionMap(paymentMethodOptions),
    []
  );
  const statusMap = useMemo(
    () => toOptionMap(expenseStatusOptions),
    []
  );

  const normalizedExpenses = useMemo(
    () =>
      expenses
        .map((expense) => ({
          ...expense,
          dateLabel: formatDate(expense.registeredAt),
          amountLabel: formatCurrency(expense.amount),
          expenseTypeLabel: expenseTypeMap[expense.expenseType] || "Gasto",
          paymentMethodLabel: paymentMethodMap[expense.paymentMethod] || "Metodo",
          statusLabel: statusMap[expense.status] || "Registrado",
        }))
        .sort((left, right) => new Date(right.registeredAt) - new Date(left.registeredAt)),
    [expenseTypeMap, expenses, paymentMethodMap, statusMap]
  );

  const filteredExpenses = normalizedExpenses;

  const summaryCards = useMemo(() => {
    const totalSpent = Number(kpis?.totalAmount ?? 0);
    const totalCount = Number(kpis?.totalCount ?? 0);
    const lastExpense = Number(kpis?.lastExpense ?? 0);

    return [
      {
        id: "total",
        label: "Total gastado",
        value: formatCurrency(totalSpent),
      },
      {
        id: "count",
        label: "Gastos registrados",
        value: String(totalCount),
      },
      {
        id: "latest",
        label: "Ultimo gasto",
        value: formatCurrency(lastExpense),
      },
    ];
  }, [kpis]);

  const loadExpenses = useCallback(async () => {
    if (!activeCondominiumId) {
      setExpenses([]);
      setKpis(null);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = await getExpenses(
        {
          period: currentPeriod,
          ...(filters.expenseType !== "all" ? { expenseType: filters.expenseType } : {}),
          ...(filters.paymentMethod !== "all" ? { paymentMethod: filters.paymentMethod } : {}),
          ...(String(filters.query || "").trim() ? { query: String(filters.query || "").trim() } : {}),
        },
        requestConfig
      );

      const rows = Array.isArray(payload?.data) ? payload.data : [];
      setExpenses(rows);
      setKpis(payload?.kpis || null);
    } catch (requestError) {
      setExpenses([]);
      setKpis(null);
      setError(normalizeApiError(requestError, "No fue posible cargar los gastos administrativos."));
    } finally {
      setLoading(false);
    }
  }, [activeCondominiumId, currentPeriod, filters.expenseType, filters.paymentMethod, filters.query, requestConfig]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  useEffect(() => {
    if (!selectedExpenseId && expenses.length > 0) {
      setSelectedExpenseId(expenses[0].id);
    }
  }, [expenses, selectedExpenseId]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFiltersChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      query: "",
      expenseType: "all",
      paymentMethod: "all",
    });
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("El archivo supera el maximo permitido de 5MB.");
      setSupportFile(null);
      setSupportFileName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setError("");
    setSupportFile(file);
    setSupportFileName(file.name);
    setForm((prev) => ({ ...prev, supportName: file.name }));
  };

  const handleResetForm = () => {
    setForm(createInitialFormState());
    setSupportFile(null);
    setSupportFileName("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!activeCondominiumId) {
      setError("No hay condominio activo.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const created = await createExpense(
        {
          registeredAt: form.registeredAt || getTodayInputValue(),
          expenseType: form.expenseType || expenseTypeOptions[0].value,
          amount: Number(form.amount || 0),
          paymentMethod: form.paymentMethod || paymentMethodOptions[0].value,
          observations: String(form.observations || "").trim(),
          registeredBy: String(form.registeredBy || "").trim() || "Sin responsable",
          status: supportFile ? "con-soporte" : "pendiente-soporte",
          support: supportFile,
        },
        requestConfig
      );

      await loadExpenses();
      setSelectedExpenseId(created?.id || null);
      handleResetForm();
    } catch (requestError) {
      setError(normalizeApiError(requestError, "No fue posible registrar el gasto."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewSupport = (row) => {
    setSelectedExpenseId(row.id);
    if (row?.supportUrl) {
      window.open(row.supportUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleExportExpenses = async () => {
    setExporting(true);
    setError("");

    try {
      await exportAdministrativeExpensesWorkbook({
        rows: filteredExpenses,
        fileName: "gastos_administrativos.xlsx",
      });
    } catch (exportError) {
      setError(normalizeApiError(exportError, "No fue posible descargar los gastos administrativos."));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
      <header>
        <div className="flex items-center gap-3">
          <BackButton variant="dashboard" />
          <h1 className="text-2xl font-extrabold text-slate-900">Gastos Administrativos</h1>
        </div>
      </header>

      <div className="mt-8">
        <ExpenseSummaryCards cards={summaryCards} />
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mt-8">
        <ExpenseFormCard
          form={form}
          expenseTypeOptions={expenseTypeOptions}
          paymentMethodOptions={paymentMethodOptions}
          fileName={supportFileName}
          fileInputRef={fileInputRef}
          onChange={handleFormChange}
          onPickFile={() => fileInputRef.current?.click()}
          onFileChange={handleFileChange}
          onReset={handleResetForm}
          onSubmit={handleSubmit}
          saving={submitting}
        />
      </div>

      <div className="mt-8">
        <ExpenseFiltersBar
          filters={filters}
          expenseTypeOptions={expenseTypeOptions}
          paymentMethodOptions={paymentMethodOptions}
          onChange={handleFiltersChange}
          onClear={handleClearFilters}
        />
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
            Cargando gastos administrativos...
          </div>
        ) : null}

        <AdministrativeExpensesTable
          rows={filteredExpenses}
          selectedId={selectedExpenseId}
          onViewSupport={handleViewSupport}
          onDownload={handleExportExpenses}
          downloading={exporting}
        />
      </div>
    </div>
  );
}

function toOptionMap(options) {
  return options.reduce((accumulator, option) => {
    accumulator[option.value] = option.label;
    return accumulator;
  }, {});
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

function getCurrentPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
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

export default AdministrativeExpensesPage;
