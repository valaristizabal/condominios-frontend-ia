import apiClient from "../../../services/apiClient";

export async function getProducts(requestConfig, inventoryId) {
  const response = await apiClient.get("/products", {
    ...(requestConfig || {}),
    params: {
      inventory_id: inventoryId,
    },
  });
  return Array.isArray(response.data) ? response.data : [];
}

export async function getInventories(requestConfig) {
  const response = await apiClient.get("/inventories", requestConfig);
  return Array.isArray(response.data) ? response.data : [];
}

export async function getInventoryCategories(requestConfig) {
  const response = await apiClient.get("/inventory-categories?active=1", requestConfig);
  return Array.isArray(response.data) ? response.data : [];
}

export async function createProduct(payload, requestConfig) {
  const response = await apiClient.post("/products", payload, requestConfig);
  return response.data;
}

export async function registerEntry(payload, requestConfig) {
  const response = await apiClient.post("/inventory-movements/entry", payload, requestConfig);
  return response.data;
}

export async function registerExit(payload, requestConfig) {
  const response = await apiClient.post("/inventory-movements/exit", payload, requestConfig);
  return response.data;
}

export async function getProductMovements(productId, requestConfig) {
  const response = await apiClient.get(`/products/${productId}/movements`, requestConfig);
  return Array.isArray(response.data) ? response.data : [];
}

export async function getLowStockProducts(requestConfig) {
  const response = await apiClient.get("/inventory/low-stock", requestConfig);
  return Array.isArray(response.data) ? response.data : [];
}
