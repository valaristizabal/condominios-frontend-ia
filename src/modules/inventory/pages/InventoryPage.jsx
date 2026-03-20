import { useEffect, useMemo, useState } from "react";
import { PlusCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveCondominium } from "../../../context/useActiveCondominium";
import { useAuthContext } from "../../../context/useAuthContext";
import InventoryStats from "../components/InventoryStats";
import ProductTable from "../components/ProductTable";
import QuickMovementForm from "../components/QuickMovementForm";
import MovementHistory from "../components/MovementHistory";
import LowStockAlerts from "../components/LowStockAlerts";
import { canAccessInventorySettings } from "../../../utils/roles";
import {
  createProduct,
  getInventories,
  getInventoryCategories,
  getLowStockProducts,
  getProductsWithMovements,
  getSuppliers,
  registerEntry,
  registerExit,
  updateProduct,
} from "../services/inventory.service";

const EMPTY_LIST = [];

function buildEmptyProductForm(inventoryId = "") {
  return {
    inventory_id: inventoryId ? String(inventoryId) : "",
    name: "",
    type: "consumable",
    category_id: "",
    supplier_id: "",
    stock: "",
    minimum_stock: "",
    unit_cost: "",
    asset_code: "",
    location: "",
  };
}

function InventoryPage({ allowProductManagement = false, showOperationTools = true }) {
  const { activeCondominiumId } = useActiveCondominium();
  const { user } = useAuthContext();
  const { id: routeCondominiumId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState(buildEmptyProductForm());
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
      let suppliersResponse = [];
      try {
        suppliersResponse = await getSuppliers(requestConfig);
      } catch {
        suppliersResponse = [];
      }

      return {
        inventories: inventoriesResponse,
        categories: categoriesResponse,
        suppliers: suppliersResponse,
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
  const suppliers = useMemo(
    () => inventoriesAndCategoriesQuery.data?.suppliers ?? EMPTY_LIST,
    [inventoriesAndCategoriesQuery.data?.suppliers]
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

  useEffect(() => {
    if (!showAddProduct || editingProductId) return;
    setProductForm((prev) => ({
      ...prev,
      inventory_id: selectedInventoryId ? String(selectedInventoryId) : "",
    }));
  }, [editingProductId, selectedInventoryId, showAddProduct]);

  const productsWithMovementsQuery = useQuery({
    queryKey: ["inventory", "products-with-movements", resolvedCondominiumId, selectedInventoryId, currentPage],
    enabled: canQuery && Boolean(selectedInventoryId),
    queryFn: () => getProductsWithMovements(requestConfig, Number(selectedInventoryId), currentPage, 10),
  });

  const products = useMemo(
    () => productsWithMovementsQuery.data?.products ?? EMPTY_LIST,
    [productsWithMovementsQuery.data?.products]
  );

  const consumableProducts = useMemo(
    () => products.filter((product) => product?.type !== "asset"),
    [products]
  );

  useEffect(() => {
    setMovementForm((prev) => {
      if (!consumableProducts.length) {
        return prev.product_id ? { ...prev, product_id: "" } : prev;
      }

      if (!prev.product_id) return prev;

      const exists = consumableProducts.some((product) => String(product.id) === String(prev.product_id));
      return exists ? prev : { ...prev, product_id: "" };
    });
  }, [consumableProducts]);

  const lowStockQuery = useQuery({
    queryKey: ["inventory", "low-stock", resolvedCondominiumId, selectedInventoryId],
    enabled: showOperationTools && canQuery && Boolean(selectedInventoryId),
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

  useEffect(() => {
    const next = productsWithMovementsQuery.data?.pagination;
    if (!next) {
      setPagination({
        currentPage: 1,
        lastPage: 1,
        perPage: 10,
        total: 0,
      });
      return;
    }

    const normalizedLastPage = Number(next.lastPage || 1) > 0 ? Number(next.lastPage) : 1;
    const normalizedCurrentPage = Number(next.currentPage || currentPage || 1);

    setPagination({
      currentPage: normalizedCurrentPage,
      lastPage: normalizedLastPage,
      perPage: Number(next.perPage || 10),
      total: Number(next.total || 0),
    });

    if (normalizedCurrentPage > normalizedLastPage) {
      setCurrentPage(normalizedLastPage);
    }
  }, [currentPage, productsWithMovementsQuery.data?.pagination]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedInventoryId, resolvedCondominiumId]);

  const loading =
    inventoriesAndCategoriesQuery.isLoading ||
    productsWithMovementsQuery.isLoading ||
    (showOperationTools && lowStockQuery.isLoading);

  useEffect(() => {
    const queryError =
      inventoriesAndCategoriesQuery.error ||
      productsWithMovementsQuery.error ||
      (showOperationTools ? lowStockQuery.error : null);

    if (!queryError) return;

    setError(normalizeApiError(queryError, "No fue posible cargar inventario."));
  }, [inventoriesAndCategoriesQuery.error, lowStockQuery.error, productsWithMovementsQuery.error, showOperationTools]);

  const createProductMutation = useMutation({
    mutationFn: (payload) => createProduct(payload, requestConfig),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["inventory", "products-with-movements", resolvedCondominiumId, selectedInventoryId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["inventory", "low-stock", resolvedCondominiumId, selectedInventoryId],
        }),
      ]);
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, payload }) => updateProduct(id, payload, requestConfig),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["inventory", "products-with-movements", resolvedCondominiumId, selectedInventoryId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["inventory", "low-stock", resolvedCondominiumId, selectedInventoryId],
        }),
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
        queryClient.invalidateQueries({
          queryKey: ["inventory", "products-with-movements", resolvedCondominiumId, selectedInventoryId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["inventory", "low-stock", resolvedCondominiumId, selectedInventoryId],
        }),
      ]);
    },
  });

  const savingMovement = registerMovementMutation.isPending;
  const savingProduct = createProductMutation.isPending || updateProductMutation.isPending;
  const isEditing = Boolean(editingProductId);
  const canManageProducts = allowProductManagement && canAccessInventorySettings(user);

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

  const calculatedTotalValue = useMemo(() => {
    const stock = Number(productForm.stock || 0);
    const unitCost = Number(productForm.unit_cost);
    if (!Number.isFinite(unitCost) || unitCost < 0) return null;
    return stock * unitCost;
  }, [productForm.stock, productForm.unit_cost]);

  const openCreateProduct = () => {
    setError("");
    setSuccess("");
    setEditingProductId(null);
    setProductForm(buildEmptyProductForm(selectedInventoryId));
    setShowAddProduct(true);
  };

  const openEditProduct = (product) => {
    setError("");
    setSuccess("");
    setEditingProductId(product.id);
    setProductForm({
      inventory_id: String(product.inventory_id ?? selectedInventoryId ?? ""),
      name: String(product.name || ""),
      type: String(product.type || "consumable"),
      category_id: product.category_id ? String(product.category_id) : "",
      supplier_id: product.supplier_id ? String(product.supplier_id) : "",
      stock: String(product.stock_actual ?? product.stock ?? 0),
      minimum_stock: String(product.minimum_stock ?? 0),
      unit_cost: product.unit_cost !== null && product.unit_cost !== undefined ? String(product.unit_cost) : "",
      asset_code: String(product.asset_code || ""),
      location: String(product.location || ""),
    });
    setShowAddProduct(true);
  };

  const closeProductForm = () => {
    if (savingProduct) return;
    setShowAddProduct(false);
    setEditingProductId(null);
    setProductForm(buildEmptyProductForm(selectedInventoryId));
  };

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

      await queryClient.invalidateQueries({
        queryKey: ["inventory", "products-with-movements", resolvedCondominiumId, selectedInventoryId, currentPage],
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

  const handleSaveProduct = async () => {
    if (!productForm.name.trim()) return;

    const inventoryId = Number(productForm.inventory_id || selectedInventoryId);
    if (!inventoryId) {
      setError("Selecciona una ubicaciÃ³n de inventario para guardar el producto.");
      return;
    }

    const type = productForm.type === "asset" ? "asset" : "consumable";
    const parsedUnitCost = Number(productForm.unit_cost);

    setError("");
    setSuccess("");

    try {
      const payload = {
        inventory_id: inventoryId,
        name: productForm.name.trim(),
        type,
        category_id: productForm.category_id ? Number(productForm.category_id) : null,
        supplier_id: productForm.supplier_id ? Number(productForm.supplier_id) : null,
        stock: Math.max(0, Number(productForm.stock || 0)),
        minimum_stock: type === "consumable" ? Math.max(0, Number(productForm.minimum_stock || 0)) : 0,
        unit_cost:
          productForm.unit_cost === "" || productForm.unit_cost === null || productForm.unit_cost === undefined
            ? null
            : Number.isFinite(parsedUnitCost)
              ? Math.max(0, parsedUnitCost)
              : null,
        asset_code: type === "asset" ? String(productForm.asset_code || "").trim() || null : null,
        location: type === "asset" ? String(productForm.location || "").trim() || null : null,
      };

      if (isEditing) {
        await updateProductMutation.mutateAsync({
          id: editingProductId,
          payload,
        });
        setSuccess("Producto actualizado correctamente.");
      } else {
        await createProductMutation.mutateAsync(payload);
        setSuccess("Producto creado correctamente.");
      }

      closeProductForm();
    } catch (err) {
      const fallback = isEditing ? "No fue posible actualizar el producto." : "No fue posible crear el producto.";
      setError(normalizeApiError(err, fallback));
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Inventario</h1>
        </div>
        {canManageProducts ? (
          <button
            type="button"
            onClick={openCreateProduct}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            disabled={!resolvedCondominiumId || !selectedInventoryId}
          >
            <PlusCircle className="mr-2 inline h-5 w-5" />
            Añadir producto
          </button>
        ) : null}
      </header>

      <section className="mt-6 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
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
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          No hay propiedad activa para operar este modulo.
        </div>
      ) : null}

      {resolvedCondominiumId && inventories.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          No hay inventarios activos configurados para esta propiedad.
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>
      ) : null}

      {success ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {success}
        </div>
      ) : null}

      {showAddProduct && canManageProducts ? (
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800">{isEditing ? "Editar producto" : "Nuevo producto"}</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Ubicación de inventario</label>
              <select
                name="inventory_id"
                value={productForm.inventory_id}
                onChange={handleProductChange}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">Seleccione ubicaciÃ³n</option>
                {inventories.map((inventory) => (
                  <option key={inventory.id} value={inventory.id}>
                    {inventory.name}
                  </option>
                ))}
              </select>
            </div>

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
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Tipo</label>
              <select
                name="type"
                value={productForm.type}
                onChange={handleProductChange}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="consumable">Consumible</option>
                <option value="asset">Activo fijo</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Categorí­a</label>
              <select
                name="category_id"
                value={productForm.category_id}
                onChange={handleProductChange}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">Seleccione categorí­a</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Proveedor</label>
              <select
                name="supplier_id"
                value={productForm.supplier_id}
                onChange={handleProductChange}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">Seleccione proveedor</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Stock</label>
              <input
                name="stock"
                type="number"
                min="0"
                value={productForm.stock}
                onChange={handleProductChange}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Stock"
              />
            </div>

            {productForm.type === "consumable" ? (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Stock mí­nimo de alerta</label>
                <input
                  name="minimum_stock"
                  type="number"
                  min="0"
                  value={productForm.minimum_stock}
                  onChange={handleProductChange}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="Stock mí­nimo de alerta"
                />
              </div>
            ) : null}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Costo unitario</label>
              <input
                name="unit_cost"
                type="number"
                min="0"
                step="0.01"
                value={productForm.unit_cost}
                onChange={handleProductChange}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Costo unitario"
              />
            </div>

            {productForm.type === "asset" ? (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Código de activo</label>
                  <input
                    name="asset_code"
                    value={productForm.asset_code}
                    onChange={handleProductChange}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="Código de activo"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Ubicación</label>
                  <input
                    name="location"
                    value={productForm.location}
                    onChange={handleProductChange}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="Ubicación"
                  />
                </div>
              </>
            ) : null}
          </div>

          {suppliers.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-700">No hay proveedores registrados para esta propiedad.</p>
              <button
                type="button"
                onClick={() =>
                  navigate(routeCondominiumId ? `/condominio/${routeCondominiumId}/settings/suppliers` : "/settings/suppliers")
                }
                className="mt-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
              >
                Crear proveedor
              </button>
            </div>
          ) : null}

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Valor total calculado</p>
            <p className="mt-1 text-lg font-extrabold text-slate-800">{formatCurrency(calculatedTotalValue)}</p>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={handleSaveProduct}
              disabled={savingProduct}
              className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-70"
            >
              {savingProduct ? "Guardando..." : isEditing ? "Actualizar producto" : "Guardar producto"}
            </button>
            <button
              type="button"
              onClick={closeProductForm}
              className="rounded-2xl bg-gray-100 px-5 py-2.5 text-sm font-bold text-gray-700"
            >
              Cancelar
            </button>
          </div>
        </section>
      ) : null}

      {showOperationTools ? (
        <div className="mt-6">
          <InventoryStats stats={stats} />
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-6 text-sm font-semibold text-gray-500 shadow-sm">
          Cargando inventario...
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <ProductTable
            products={products}
            onEdit={openEditProduct}
            saving={savingProduct}
            canEdit={canManageProducts}
            currentPage={pagination.currentPage || currentPage}
            totalPages={pagination.lastPage || 1}
            totalItems={pagination.total || 0}
            loading={productsWithMovementsQuery.isLoading}
            onPageChange={setCurrentPage}
          />
          {showOperationTools ? (
            <>
              <QuickMovementForm
                products={products}
                form={movementForm}
                onChange={handleMovementChange}
                onSubmit={handleRegisterMovement}
                saving={savingMovement}
                disabled={!resolvedCondominiumId || !selectedInventoryId}
              />
              <MovementHistory rows={movements} />
              <LowStockAlerts products={lowStockProducts} />
            </>
          ) : null}
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

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "-";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "-";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default InventoryPage;



