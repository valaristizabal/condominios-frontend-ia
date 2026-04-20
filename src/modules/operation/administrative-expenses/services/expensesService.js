import apiClient from "../../../../services/apiClient";

export async function getExpenses(params = {}, requestConfig) {
  const response = await apiClient.get("/expenses", {
    ...(requestConfig || {}),
    params,
  });

  return response?.data || { kpis: null, data: [] };
}

export async function createExpense(data, requestConfig) {
  const payload = toExpensePayload(data);

  const response = await apiClient.post("/expenses", payload, {
    ...(requestConfig || {}),
    headers: {
      ...(requestConfig?.headers || {}),
      "Content-Type": "multipart/form-data",
    },
  });

  return response?.data;
}

export async function updateExpense(id, data, requestConfig) {
  const payload = toExpensePayload(data);

  const response = await apiClient.put(`/expenses/${id}`, payload, {
    ...(requestConfig || {}),
    headers: {
      ...(requestConfig?.headers || {}),
      "Content-Type": "multipart/form-data",
    },
  });

  return response?.data;
}

export async function deleteExpense(id, requestConfig) {
  const response = await apiClient.delete(`/expenses/${id}`, requestConfig);
  return response?.data;
}

function toExpensePayload(data = {}) {
  const formData = new FormData();

  appendIfDefined(formData, "registeredAt", data.registeredAt);
  appendIfDefined(formData, "expenseType", data.expenseType);
  appendIfDefined(formData, "amount", data.amount);
  appendIfDefined(formData, "paymentMethod", data.paymentMethod);
  appendIfDefined(formData, "observations", data.observations);
  appendIfDefined(formData, "registeredBy", data.registeredBy);
  appendIfDefined(formData, "status", data.status);

  if (data.support instanceof File) {
    formData.append("support", data.support);
  }

  if (data.removeSupport !== undefined) {
    formData.append("removeSupport", data.removeSupport ? "1" : "0");
  }

  return formData;
}

function appendIfDefined(formData, key, value) {
  if (value === undefined || value === null) {
    return;
  }

  formData.append(key, String(value));
}
