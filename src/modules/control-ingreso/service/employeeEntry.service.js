import apiClient from "../../../services/apiClient";

export async function getEmployeeEntries(requestConfig, params = {}) {
  const response = await apiClient.get("/employee-entries", {
    ...(requestConfig || {}),
    params: {
      per_page: 10,
      ...params,
    },
  });
  return response.data || {};
}

export async function createEmployeeEntry(payload, requestConfig) {
  const response = await apiClient.post("/employee-entries", payload, requestConfig);
  return response.data;
}

export async function checkoutEmployeeEntry(entryId, requestConfig) {
  const response = await apiClient.put(`/employee-entries/checkout/${entryId}`, {}, requestConfig);
  return response.data;
}

export async function cancelEmployeeEntry(entryId, requestConfig) {
  const response = await apiClient.put(`/employee-entries/cancel/${entryId}`, {}, requestConfig);
  return response.data;
}
