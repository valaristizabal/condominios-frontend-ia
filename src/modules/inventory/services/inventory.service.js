import apiClient from "../../../services/apiClient";

export async function getProducts(requestConfig, inventoryId) {
  const response = await apiClient.get("/products", {
    ...(requestConfig || {}),
    params: {
      inventory_id: inventoryId,
    },
  });
  return toRows(response.data);
}

export async function getProductsWithMovements(requestConfig, inventoryId, perPage = 20) {
  const response = await apiClient.get("/inventory/products-with-movements", {
    ...(requestConfig || {}),
    params: {
      inventory_id: inventoryId,
      per_page: perPage,
    },
  });

  const rows = toRows(response.data);
  const movements = rows
    .flatMap((product) =>
      Array.isArray(product?.last_movements)
        ? product.last_movements.map((movement) => ({
            ...movement,
            product_name: product.name,
            product_unit_cost: product.unit_cost,
            movement_estimated_value:
              product.unit_cost === null || product.unit_cost === undefined
                ? null
                : Number(movement?.quantity || 0) * Number(product.unit_cost),
          }))
        : []
    )
    .sort((a, b) => {
      const aDate = new Date(a.movement_date || a.created_at || 0).getTime();
      const bDate = new Date(b.movement_date || b.created_at || 0).getTime();
      return bDate - aDate;
    })
    .slice(0, 30);

  return { products: rows, movements };
}

export async function getInventories(requestConfig) {
  const response = await apiClient.get("/inventories", requestConfig);
  return Array.isArray(response.data) ? response.data : [];
}

export async function getInventoryCategories(requestConfig) {
  const response = await apiClient.get("/inventory-categories?active=1", requestConfig);
  return Array.isArray(response.data) ? response.data : [];
}

export async function getSuppliers(requestConfig) {
  const response = await apiClient.get("/suppliers?active=1", requestConfig);
  return Array.isArray(response.data) ? response.data : [];
}

export async function createProduct(payload, requestConfig) {
  const response = await apiClient.post("/products", payload, requestConfig);
  return response.data;
}

export async function updateProduct(productId, payload, requestConfig) {
  const response = await apiClient.put(`/products/${productId}`, payload, requestConfig);
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
  return toRows(response.data);
}

export async function getLowStockProducts(requestConfig) {
  const response = await apiClient.get("/inventory/low-stock", requestConfig);
  return toRows(response.data);
}

function toRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}
