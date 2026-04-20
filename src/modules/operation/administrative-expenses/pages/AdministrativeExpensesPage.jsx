import { useMemo, useRef, useState } from "react";
import BackButton from "../../../../components/common/BackButton";
import ExpenseFormCard from "../components/ExpenseFormCard";
import ExpenseFiltersBar from "../components/ExpenseFiltersBar";
import ExpenseSummaryCards from "../components/ExpenseSummaryCards";
import AdministrativeExpensesTable from "../components/AdministrativeExpensesTable";
import {
  expenseStatusOptions,
  expenseTypeOptions,
  mockAdministrativeExpenses,
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
  const [expenses, setExpenses] = useState(mockAdministrativeExpenses);
  const [form, setForm] = useState(createInitialFormState);
  const [filters, setFilters] = useState({
    query: "",
    expenseType: "all",
    paymentMethod: "all",
  });
  const [selectedExpenseId, setSelectedExpenseId] = useState(mockAdministrativeExpenses[0]?.id || null);
  const [supportFileName, setSupportFileName] = useState("");

  const fileInputRef = useRef(null);

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

  const filteredExpenses = useMemo(() => {
    const query = String(filters.query || "").trim().toLowerCase();

    return normalizedExpenses.filter((expense) => {
      if (filters.expenseType !== "all" && expense.expenseType !== filters.expenseType) return false;
      if (filters.paymentMethod !== "all" && expense.paymentMethod !== filters.paymentMethod) return false;

      if (!query) return true;

      const searchable = [
        expense.expenseTypeLabel,
        expense.paymentMethodLabel,
        expense.registeredBy,
        expense.observations,
        expense.statusLabel,
        expense.supportName,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [filters.expenseType, filters.paymentMethod, filters.query, normalizedExpenses]);

  const summaryCards = useMemo(() => {
    const totalSpent = expenses.reduce((accumulator, expense) => accumulator + Number(expense.amount || 0), 0);
    const latestExpense = [...expenses].sort(
      (left, right) => new Date(right.registeredAt) - new Date(left.registeredAt)
    )[0];

    return [
      {
        id: "total",
        label: "Total gastado",
        value: formatCurrency(totalSpent),
      },
      {
        id: "count",
        label: "Gastos registrados",
        value: String(expenses.length),
      },
      {
        id: "latest",
        label: "Ultimo gasto",
        value: latestExpense ? formatCurrency(latestExpense.amount) : "$0",
      },
    ];
  }, [expenses]);

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

    setSupportFileName(file.name);
    setForm((prev) => ({ ...prev, supportName: file.name }));
  };

  const handleResetForm = () => {
    setForm(createInitialFormState());
    setSupportFileName("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextExpense = {
      id: `ga-local-${Date.now()}`,
      registeredAt: form.registeredAt || getTodayInputValue(),
      expenseType: form.expenseType || expenseTypeOptions[0].value,
      amount: Number(form.amount || 0),
      paymentMethod: form.paymentMethod || paymentMethodOptions[0].value,
      observations: String(form.observations || "").trim(),
      supportName: form.supportName || "",
      registeredBy: String(form.registeredBy || "").trim() || "Sin responsable",
      status: form.supportName ? "con-soporte" : "pendiente-soporte",
    };

    setExpenses((prev) => [nextExpense, ...prev]);
    setSelectedExpenseId(nextExpense.id);
    setForm(createInitialFormState());
    setSupportFileName("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <BackButton variant="dashboard" className="mt-1 shrink-0" />

        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-[2rem]">
            Gastos Administrativos
          </h1>
        </div>
      </header>

      <div className="mt-8">
        <ExpenseSummaryCards cards={summaryCards} />
      </div>

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
        <AdministrativeExpensesTable
          rows={filteredExpenses}
          selectedId={selectedExpenseId}
          onViewSupport={(row) => setSelectedExpenseId(row.id)}
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

export default AdministrativeExpensesPage;
