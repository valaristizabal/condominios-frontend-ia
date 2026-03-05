import { useEffect, useMemo, useState } from "react";
import { PlusCircle } from "lucide-react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveCondominium } from "../../../context/useActiveCondominium";
import InventoryStats from "../components/InventoryStats";
import ProductTable from "../components/ProductTable";
import QuickMovementForm from "../components/QuickMovementForm";
import MovementHistory from "../components/MovementHistory";
import LowStockAlerts from "../components/LowStockAlerts";
import {
  createProduct,
  getInventories,
  getInventoryCategories,
  getLowStockProducts,
  getProductsWithMovements,
  registerEntry,
  registerExit,
} from "../services/inventory.service";

const EMPTY_LIST = [];

function InventoryPage() {
  const { activeCondominiumId } = useActiveCondominium();
  const { id: routeCondominiumId } = useParams();
  const queryClient = useQueryClient();

  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    category_id: "",
    type: "",
    minimum_stock: "",
    stock: "",
    asset_code: "",
    location: "",
  });
  const [movementForm, setMovementForm] = useState({
    product_id: "",
    type: "",
    quantity: "",
    observations: "",
  });

  const resolvedCondominiumId = useMemo(() => {
    const contextId = Number(activeCondominiumId);
    if (Number.isFinite(contextId) && contextId > 0) return contextId;
    const routeId = Number(routeCondominiumId);
    if (Number.isFinite(routeId) && routeId > 0) return routeId;
    return null;
  }, [activeCondominiumId, routeCondominiumId]);

  const requestConfig = useMemo(
    () =>
      resolvedCondominiumId
        ? {
            headers: {
              "X-Active-Condominium-Id": String(resolvedCondominiumId),
            },
          }
        : undefined,
    [resolvedCondominiumId]
  );

  const canQuery = Boolean(resolvedCondominiumId);

  const inventoriesAndCategoriesQuery = useQuery({
    queryKey: ["inventory", "catalogs", resolvedCondominiumId],
    enabled: canQuery,
    queryFn: async () => {
      const [inventoriesResponse, categoriesResponse] = await Promise.all([
        getInventories(requestConfig),
        getInventoryCategories(requestConfig),
      ]);

      return {
        inventories: inventoriesResponse,
        categories: categoriesResponse,
      };
    },
  });

  const inventories = useMemo(
    () => inventoriesAndCategoriesQuery.data?.inventories ?? EMPTY_LIST,
    [inventoriesAndCategoriesQuery.data?.inventories]
  );
  const categories = useMemo(
    () => inventoriesAndCategoriesQuery.data?.categories ?? EMPTY_LIST,
    [inventoriesAndCategoriesQuery.data?.categories]
  );

  useEffect(() => {
    if (!inventories.length) {
      setSelectedInventoryId((prev) => (prev ? "" : prev));
      return;
    }

    setSelectedInventoryId((prev) => {
      const exists = inventories.some((item) => String(item.id) === String(prev));
      if (exists && prev) return prev;
      return String(inventories[0].id);
    });
  }, [inventories]);

  const productsWithMovementsQuery = useQuery({
    queryKey: ["inventory", "products-with-movements", resolvedCondominiumId, selectedInventoryId],
    enabled: canQuery && Boolean(selectedInventoryId),
    queryFn: () => getProductsWithMovements(requestConfig, Number(selectedInventoryId), 20),
  });

  const products = useMemo(
    () => productsWithMovementsQuery.data?.products ?? EMPTY_LIST,
    [productsWithMovementsQuery.data?.products]
  );

  useEffect(() => {
    setMovementForm((prev) => {
      if (!products.length) {
        return prev.product_id ? { ...prev, product_id: "" } : prev;
      }

      if (!prev.product_id) return prev;

      const exists = products.some((product) => String(product.id) === String(prev.product_id));
      return exists ? prev : { ...prev, product_id: "" };
    });
  }, [products]);

  const lowStockQuery = useQuery({
    queryKey: ["inventory", "low-stock", resolvedCondominiumId, selectedInventoryId],
    enabled: canQuery && Boolean(selectedInventoryId),
    queryFn: async () => {
      const response = await getLowStockProducts(requestConfig);
      return response.filter((product) => String(product.inventory_id) === String(selectedInventoryId));
    },
  });

  const lowStockProducts = useMemo(() => lowStockQuery.data ?? EMPTY_LIST, [lowStockQuery.data]);
  const movements = useMemo(
    () => productsWithMovementsQuery.data?.movements ?? EMPTY_LIST,
    [productsWithMovementsQuery.data?.movements]
  );

  const loading =
    inventoriesAndCategoriesQuery.isLoading ||
    productsWithMovementsQuery.isLoading ||
    lowStockQuery.isLoading;

  useEffect(() => {
    const queryError =
      inventoriesAndCategoriesQuery.error || productsWithMovementsQuery.error || lowStockQuery.error;

    if (!queryError) return;

    setError(normalizeApiError(queryError, "No fue posible cargar inventario."));
  }, [
    inventoriesAndCategoriesQuery.error,
    productsWithMovementsQuery.error,
    lowStockQuery.error,
  ]);

  const createProductMutation = useMutation({
    mutationFn: (payload) => createProduct(payload, requestConfig),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventory", "products-with-movements", resolvedCondominiumId, selectedInventoryId] }),
        queryClient.invalidateQueries({ queryKey: ["inventory", "low-stock", resolvedCondominiumId, selectedInventoryId] }),
      ]);
    },
  });

  const registerMovementMutation = useMutation({
    mutationFn: async ({ type, payload }) => {
      if (type === "entry") {
        return registerEntry(payload, requestConfig);
      }
      return registerExit(payload, requestConfig);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventory", "products-with-movements", resolvedCondominiumId, selectedInventoryId] }),
        queryClient.invalidateQueries({ queryKey: ["inventory", "low-stock", resolvedCondominiumId, selectedInventoryId] }),
      ]);
    },
  });

  const savingMovement = registerMovementMutation.isPending;
  const savingProduct = createProductMutation.isPending;

  const stats = useMemo(() => {
    const consumables = products.filter((p) => p.type !== "asset").length;
    const assets = products.filter((p) => p.type === "asset").length;
    return {
      totalProducts: products.length,
      consumables,
      assets,
      lowStock: lowStockProducts.length,
    };
  }, [products, lowStockProducts]);

  const handleMovementChange = (event) => {
    const { name, value } = event.target;
    setMovementForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductChange = (event) => {
    const { name, value } = event.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterMovement = async () => {
    if (!movementForm.product_id || !movementForm.type || Number(movementForm.quantity) <= 0) return;

    setError("");
    setSuccess("");

    try {
      const payload = {
        product_id: Number(movementForm.product_id),
        quantity: Number(movementForm.quantity),
        observations: String(movementForm.observations || "").trim() || null,
      };

      await registerMovementMutation.mutateAsync({
        type: movementForm.type,
        payload,
      });

      setSuccess("Movimiento registrado correctamente.");
      setMovementForm({
        product_id: "",
        type: "",
        quantity: "",
        observations: "",
      });
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible registrar el movimiento."));
    }
  };

  const handleCreateProduct = async () => {
    if (!productForm.name.trim()) return;

    const inventoryId = Number(selectedInventoryId);
    if (!inventoryId) {
      setError("Selecciona un inventario activo para crear el producto.");
      return;
    }

    setError("");
    setSuccess("");

    try {
      await createProductMutation.mutateAsync({
        inventory_id: inventoryId,
        name: productForm.name.trim(),
        category_id: productForm.category_id ? Number(productForm.category_id) : null,
        type: productForm.type,
        minimum_stock: Number(productForm.minimum_stock || 0),
        stock: Number(productForm.stock || 0),
        asset_code: productForm.type === "asset" ? productForm.asset_code || null : null,
        location: productForm.location || null,
      });

      setShowAddProduct(false);
      setProductForm({
        name: "",
        category_id: "",
        type: "",
        minimum_stock: "",
        stock: "",
        asset_code: "",
        location: "",
      });
      setSuccess("Producto creado correctamente.");
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible crear el producto."));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#EEF2F7] p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Inventario</h1>
          <p className="mt-2 text-lg text-gray-500">Control de productos, consumibles y activos del condominio</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddProduct((prev) => !prev)}
          className="rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
          disabled={!resolvedCondominiumId || !selectedInventoryId}
        >
          <PlusCircle className="mr-2 inline h-5 w-5" />
          Añadir Producto
        </button>
      </header>

      <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <label className="block text-sm font-semibold text-gray-700">Inventario activo</label>
        <select
          value={selectedInventoryId}
          onChange={(event) => setSelectedInventoryId(event.target.value)}
          className="mt-2 w-full max-w-md rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition"
          disabled={!resolvedCondominiumId || inventories.length === 0}
        >
          <option value="">Seleccione inventario</option>
          {inventories.map((inventory) => (
            <option key={inventory.id} value={inventory.id}>
              {inventory.name}
            </option>
          ))}
        </select>
      </section>

      {!resolvedCondominiumId ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          No hay condominio activo para operar este modulo.
        </div>
      ) : null}

      {resolvedCondominiumId && inventories.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          No hay inventarios activos configurados para este condominio.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {success}
        </div>
      ) : null}

      {showAddProduct ? (
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800">Nuevo producto</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Nombre</label>
              <input
                name="name"
                value={productForm.name}
                onChange={handleProductChange}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Nombre"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Categoria</label>
              <select
                name="category_id"
                value={productForm.category_id}
                onChange={handleProductChange}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">Seleccione categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Tipo</label>
              <select
                name="type"
                value={productForm.type}
                onChange={handleProductChange}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">Seleccione tipo</option>
                <option value="consumable">Consumible</option>
                <option value="asset">Activo fijo</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Stock inicial</label>
              <input
                name="stock"
                type="number"
                min="0"
                value={productForm.stock}
                onChange={handleProductChange}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Stock inicial"
              />
              <p className="mt-1 text-xs font-semibold text-gray-500">Cantidad disponible al crear el producto.</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Stock minimo de alerta</label>
              <input
                name="minimum_stock"
                type="number"
                min="0"
                value={productForm.minimum_stock}
                onChange={handleProductChange}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Stock minimo de alerta"
              />
              <p className="mt-1 text-xs font-semibold text-gray-500">
                Cuando el stock sea menor a este valor se generara alerta de reposicion.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Ubicacion</label>
              <input
                name="location"
                value={productForm.location}
                onChange={handleProductChange}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Ubicacion"
              />
            </div>

            {productForm.type === "asset" ? (
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Codigo de activo</label>
                <input
                  name="asset_code"
                  value={productForm.asset_code}
                  onChange={handleProductChange}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="Codigo de activo"
                />
              </div>
            ) : null}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleCreateProduct}
              disabled={savingProduct}
              className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-70"
            >
              {savingProduct ? "Guardando..." : "Guardar producto"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddProduct(false)}
              className="rounded-2xl bg-gray-100 px-5 py-2.5 text-sm font-bold text-gray-700"
            >
              Cancelar
            </button>
          </div>
        </section>
      ) : null}

      <InventoryStats stats={stats} />

      {loading ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-6 text-sm font-semibold text-gray-500 shadow-sm">
          Cargando inventario...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <ProductTable products={products} />
            <MovementHistory rows={movements} />
          </div>
          <div className="space-y-6">
            <QuickMovementForm
              products={products}
              form={movementForm}
              onChange={handleMovementChange}
              onSubmit={handleRegisterMovement}
              saving={savingMovement}
              disabled={!resolvedCondominiumId || !selectedInventoryId}
            />
            <LowStockAlerts products={lowStockProducts} />
          </div>
        </div>
      )}
    </div>
  );
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

export default InventoryPage;
