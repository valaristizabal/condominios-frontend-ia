import { useEffect, useMemo, useRef, useState } from "react";
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
import SearchableSelect from "../../../components/common/SearchableSelect";
import { useNotification } from "../../../hooks/useNotification";
import {
  createProduct,
  deleteProduct,
  deactivateAsset,
  getInventories,
  getInventoryCategories,
  getLowStockProducts,
  getProductsWithMovements,
  getSuppliers,
  importProductsCsv,
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
    serial: "",
    location: "",
    is_active: "1",
  };
}

function validateProductForm(productForm, selectedInventoryId) {
  const errors = {};
  const inventoryId = String(productForm.inventory_id || selectedInventoryId || "").trim();
  const type = productForm.type === "asset" ? "asset" : "consumable";
  const unitCost = String(productForm.unit_cost ?? "").trim();
  const stock = String(productForm.stock ?? "").trim();
  const minimumStock = String(productForm.minimum_stock ?? "").trim();
  const assetCode = String(productForm.asset_code ?? "").trim();
  const serial = String(productForm.serial ?? "").trim();
  const location = String(productForm.location ?? "").trim();
  const isActive = String(productForm.is_active ?? "").trim();

  if (!String(productForm.name || "").trim()) errors.name = "El nombre es obligatorio";
  if (!inventoryId) errors.inventory_id = "La ubicación de inventario es obligatoria";
  if (!String(productForm.type || "").trim()) errors.type = "El tipo es obligatorio";
  if (!String(productForm.category_id || "").trim()) errors.category_id = "La categoría es obligatoria";
  if (!String(productForm.supplier_id || "").trim()) errors.supplier_id = "El proveedor es obligatorio";
  if (!unitCost) {
    errors.unit_cost = "El costo unitario es obligatorio";
  } else if (!Number.isFinite(Number(unitCost)) || Number(unitCost) < 0) {
    errors.unit_cost = "El costo unitario debe ser mayor o igual a 0";
  }
  if (isActive !== "1" && isActive !== "0") errors.is_active = "Debe seleccionar si el producto está activo";

  if (type === "consumable") {
    if (!stock) {
      errors.stock = "Debe ingresar el stock para productos consumibles";
    } else if (!Number.isInteger(Number(stock)) || Number(stock) < 0) {
      errors.stock = "El stock debe ser un número entero mayor o igual a 0";
    }

    if (!minimumStock) {
      errors.minimum_stock = "Debe ingresar el stock mínimo para productos consumibles";
    } else if (!Number.isInteger(Number(minimumStock)) || Number(minimumStock) < 0) {
      errors.minimum_stock = "El stock mínimo debe ser un número entero mayor o igual a 0";
    }
  }

  if (type === "asset") {
    if (!assetCode) errors.asset_code = "El código de activo es obligatorio";
    if (!serial) errors.serial = "El serial es obligatorio para activos fijos";
    if (!location) errors.location = "La ubicación es obligatoria para activos fijos";
  }

  return errors;
}

function InventoryPage({ allowProductManagement = false, showOperationTools = true }) {
  const { activeCondominiumId } = useActiveCondominium();
  const { user } = useAuthContext();
  const { id: routeCondominiumId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success: notifySuccess, error: notifyError, warning } = useNotification();
  const fileInputRef = useRef(null);

  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
  });
  const [error, setError] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [assetToDeactivate, setAssetToDeactivate] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [productForm, setProductForm] = useState(buildEmptyProductForm());
  const [productFormTouched, setProductFormTouched] = useState(false);
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
  const inventoryOptions = useMemo(
    () => inventories.map((inventory) => ({ value: String(inventory.id), label: inventory.name })),
    [inventories]
  );
  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: String(category.id), label: category.name })),
    [categories]
  );
  const supplierOptions = useMemo(
    () => suppliers.map((supplier) => ({ value: String(supplier.id), label: supplier.name })),
    [suppliers]
  );
  const productTypeOptions = useMemo(
    () => [
      { value: "consumable", label: "Consumible" },
      { value: "asset", label: "Activo fijo" },
    ],
    []
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
    queryFn: () =>
      getProductsWithMovements(requestConfig, Number(selectedInventoryId), currentPage, 10, {
        isActive: showOperationTools ? true : undefined,
      }),
  });

  const products = useMemo(
    () => productsWithMovementsQuery.data?.products ?? EMPTY_LIST,
    [productsWithMovementsQuery.data?.products]
  );
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
    setMovementForm((prev) => {
      if (!products.length) {
        return prev.product_id ? { ...prev, product_id: "" } : prev;
      }
      if (!prev.product_id) return prev;
      const exists = products.some((product) => String(product.id) === String(prev.product_id));
      return exists ? prev : { ...prev, product_id: "" };
    });
  }, [products]);

  useEffect(() => {
    const next = productsWithMovementsQuery.data?.pagination;
    if (!next) {
      setPagination({ currentPage: 1, lastPage: 1, perPage: 10, total: 0 });
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
        queryClient.invalidateQueries({ queryKey: ["inventory", "products-with-movements", resolvedCondominiumId, selectedInventoryId] }),
        queryClient.invalidateQueries({ queryKey: ["inventory", "low-stock", resolvedCondominiumId, selectedInventoryId] }),
      ]);
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, payload }) => updateProduct(id, payload, requestConfig),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventory", "products-with-movements", resolvedCondominiumId, selectedInventoryId] }),
        queryClient.invalidateQueries({ queryKey: ["inventory", "low-stock", resolvedCondominiumId, selectedInventoryId] }),
      ]);
    },
  });

  const registerMovementMutation = useMutation({
    mutationFn: async ({ type, payload }) => {
      if (type === "entry") return registerEntry(payload, requestConfig);
      return registerExit(payload, requestConfig);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventory", "products-with-movements", resolvedCondominiumId, selectedInventoryId] }),
        queryClient.invalidateQueries({ queryKey: ["inventory", "low-stock", resolvedCondominiumId, selectedInventoryId] }),
      ]);
    },
  });

  const deactivateAssetMutation = useMutation({
    mutationFn: (productId) => deactivateAsset(productId, requestConfig),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventory", "products-with-movements", resolvedCondominiumId, selectedInventoryId] }),
        queryClient.invalidateQueries({ queryKey: ["inventory", "low-stock", resolvedCondominiumId, selectedInventoryId] }),
      ]);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (productId) => deleteProduct(productId, requestConfig),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventory", "products-with-movements", resolvedCondominiumId, selectedInventoryId] }),
        queryClient.invalidateQueries({ queryKey: ["inventory", "low-stock", resolvedCondominiumId, selectedInventoryId] }),
      ]);
    },
  });

  const importProductsMutation = useMutation({
    mutationFn: (file) => importProductsCsv(file, requestConfig),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventory", "products-with-movements", resolvedCondominiumId] }),
        queryClient.invalidateQueries({ queryKey: ["inventory", "low-stock", resolvedCondominiumId] }),
      ]);
    },
  });

  const savingMovement = registerMovementMutation.isPending;
  const savingProduct = createProductMutation.isPending || updateProductMutation.isPending || deleteProductMutation.isPending;
  const importingProducts = importProductsMutation.isPending;
  const isEditing = Boolean(editingProductId);
  const canManageProducts = allowProductManagement && canAccessInventorySettings(user);
  const missingProductDependencies = useMemo(() => {
    const missing = [];
    if (inventories.length === 0) missing.push("ubicaciones");
    if (categories.length === 0) missing.push("categorias");
    if (suppliers.length === 0) missing.push("proveedores");
    return missing;
  }, [categories.length, inventories.length, suppliers.length]);
  const canCreateProducts = canManageProducts && missingProductDependencies.length === 0;
  const productFormErrors = useMemo(
    () => validateProductForm(productForm, selectedInventoryId),
    [productForm, selectedInventoryId]
  );
  const isProductFormComplete = Object.keys(productFormErrors).length === 0;

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
    setEditingProductId(null);
    setProductForm(buildEmptyProductForm(selectedInventoryId));
    setProductFormTouched(false);
    setShowAddProduct(true);
  };

  const openEditProduct = (product) => {
    setError("");
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
      serial: String(product.serial || ""),
      location: String(product.location || ""),
      is_active: product.is_active ? "1" : "0",
    });
    setProductFormTouched(false);
    setShowAddProduct(true);
  };

  const closeProductForm = () => {
    if (savingProduct) return;
    setShowAddProduct(false);
    setEditingProductId(null);
    setProductFormTouched(false);
    setProductForm(buildEmptyProductForm(selectedInventoryId));
  };

  const handleMovementChange = (event) => {
    const { name, value } = event.target;
    setMovementForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "type") {
        next.product_id = "";
      }
      if (name === "product_id") {
        const selectedProduct = products.find((product) => String(product.id) === String(value));
        if (selectedProduct?.type === "asset") {
          next.type = "exit";
          next.quantity = "1";
        }
      }
      return next;
    });
  };

  const handleProductChange = (event) => {
    const { name, value } = event.target;
    setProductFormTouched(true);
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const openCsvPicker = () => {
    if (!canCreateProducts || importingProducts) return;
    fileInputRef.current?.click();
  };

  const handleCsvChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setError("");

    try {
      const result = await importProductsMutation.mutateAsync(file);
      setImportResult(result);
      notifySuccess(`Carga finalizada. Registros exitosos: ${Number(result?.registros_exitosos || 0)}.`);
    } catch (err) {
      setImportResult(null);
      const message = normalizeApiError(err, "No fue posible importar el archivo CSV.");
      setError(message);
      notifyError(message);
    }
  };

  const handleRegisterMovement = async () => {
    const selectedProduct = products.find((product) => String(product.id) === String(movementForm.product_id));
    const movementQuantity = movementForm.type === "exit" && selectedProduct?.type === "asset" ? 1 : Number(movementForm.quantity);

    if (!movementForm.product_id || !movementForm.type || movementQuantity <= 0) {
      warning("Selecciona producto, tipo de movimiento y una cantidad valida.");
      return;
    }

    setError("");

    try {
      const payload = {
        product_id: Number(movementForm.product_id),
        quantity: movementQuantity,
        observations: String(movementForm.observations || "").trim() || null,
      };

      await registerMovementMutation.mutateAsync({ type: movementForm.type, payload });
      await queryClient.invalidateQueries({ queryKey: ["inventory", "products-with-movements", resolvedCondominiumId, selectedInventoryId, currentPage] });

      notifySuccess("Movimiento registrado correctamente.");
      setMovementForm({ product_id: "", type: "", quantity: "", observations: "" });
    } catch (err) {
      const message = normalizeApiError(err, "No fue posible registrar el movimiento.");
      setError(message);
      notifyError(message);
    }
  };

  const handleSaveProduct = async () => {
    setProductFormTouched(true);

    if (missingProductDependencies.length > 0) {
      const message = `Antes de crear productos debes configurar: ${missingProductDependencies.join(", ")}.`;
      setError(message);
      warning(message);
      return;
    }

    if (!isProductFormComplete) {
      warning("Completa los campos obligatorios del producto.");
      return;
    }

    const type = productForm.type === "asset" ? "asset" : "consumable";
    const inventoryId = Number(productForm.inventory_id || selectedInventoryId);
    const parsedUnitCost = Number(productForm.unit_cost);

    setError("");

    try {
      const payload = {
        inventory_id: inventoryId,
        name: productForm.name.trim(),
        type,
        category_id: productForm.category_id ? Number(productForm.category_id) : null,
        supplier_id: productForm.supplier_id ? Number(productForm.supplier_id) : null,
        stock: type === "asset" ? 1 : Math.max(0, Number(productForm.stock || 0)),
        minimum_stock: type === "consumable" ? Math.max(0, Number(productForm.minimum_stock || 0)) : 0,
        unit_cost:
          productForm.unit_cost === "" || productForm.unit_cost === null || productForm.unit_cost === undefined
            ? null
            : Number.isFinite(parsedUnitCost)
              ? Math.max(0, parsedUnitCost)
              : null,
        asset_code: type === "asset" ? String(productForm.asset_code || "").trim() || null : null,
        serial: type === "asset" ? String(productForm.serial || "").trim() || null : null,
        location: type === "asset" ? String(productForm.location || "").trim() || null : null,
        is_active: String(productForm.is_active) === "1",
      };

      if (isEditing) {
        await updateProductMutation.mutateAsync({ id: editingProductId, payload });
        notifySuccess("Producto actualizado correctamente.");
      } else {
        await createProductMutation.mutateAsync(payload);
        notifySuccess("Producto creado correctamente.");
      }

      closeProductForm();
    } catch (err) {
      const fallback = isEditing ? "No fue posible actualizar el producto." : "No fue posible crear el producto.";
      const message = normalizeApiError(err, fallback);
      setError(message);
      notifyError(message);
    }
  };

  const handleConfirmDeactivateAsset = async () => {
    if (!assetToDeactivate) return;
    try {
      await deactivateAssetMutation.mutateAsync(assetToDeactivate.id);
      notifySuccess("Activo fijo dado de baja correctamente.");
      setAssetToDeactivate(null);
    } catch (err) {
      const message = normalizeApiError(err, "No fue posible dar de baja el activo fijo.");
      setError(message);
      notifyError(message);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;

    setError("");

    try {
      await deleteProductMutation.mutateAsync(productToDelete.id);
      notifySuccess("Producto desactivado correctamente.");
      setProductToDelete(null);
    } catch (err) {
      const message = normalizeApiError(err, "No fue posible desactivar el producto.");
      setError(message);
      notifyError(message);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Inventario</h1>
        </div>
        {canManageProducts ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCsvChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={openCsvPicker}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-70"
              disabled={!resolvedCondominiumId || !selectedInventoryId || !canCreateProducts || importingProducts}
            >
              {importingProducts ? "Importando..." : "Cargar CSV"}
            </button>
            <button
              type="button"
              onClick={openCreateProduct}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              disabled={!resolvedCondominiumId || !selectedInventoryId || !canCreateProducts}
            >
              <PlusCircle className="mr-2 inline h-5 w-5" />
              Añadir producto
            </button>
          </div>
        ) : null}
      </header>

      <section className="mt-6 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <label className="block text-sm font-semibold text-gray-700">Inventario activo</label>
        <SearchableSelect
          value={selectedInventoryId}
          onChange={(value) => setSelectedInventoryId(String(value))}
          options={inventoryOptions}
          placeholder="Seleccione inventario"
          searchPlaceholder="Buscar inventario..."
          disabled={!resolvedCondominiumId || inventories.length === 0}
          className="mt-2 w-full max-w-md"
        />
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

      {canManageProducts && missingProductDependencies.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          Antes de crear productos debes configurar: {missingProductDependencies.join(", ")}.
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>
      ) : null}

      {importResult ? (
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-900">
            <p>
              Total de filas: <span className="text-slate-700">{Number(importResult.total_filas || 0)}</span>
            </p>
            <p>
              Registros exitosos: <span className="text-emerald-700">{Number(importResult.registros_exitosos || 0)}</span>
            </p>
            <p>
              Registros fallidos: <span className="text-rose-700">{Array.isArray(importResult.registros_fallidos) ? importResult.registros_fallidos.length : 0}</span>
            </p>
          </div>

          {Array.isArray(importResult.registros_fallidos) && importResult.registros_fallidos.length > 0 ? (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-semibold text-amber-800">Errores encontrados</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-700">
                {importResult.registros_fallidos.map((item, index) => (
                  <li key={`${item.fila}-${index}`}>Fila {item.fila}: {item.error}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-600">No se encontraron errores en la importacion.</p>
          )}
        </section>
      ) : null}

      {showAddProduct && canManageProducts ? (
        <section className="mt-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <button
            type="button"
            onClick={closeProductForm}
            className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Regresar
          </button>
          <h2 className="text-xl font-bold text-gray-800">{isEditing ? "Editar producto" : "Nuevo producto"}</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Ubicacion de inventario</label>
              <SearchableSelect
                value={productForm.inventory_id}
                onChange={(value) => handleProductChange({ target: { name: "inventory_id", value: String(value) } })}
                options={inventoryOptions}
                placeholder="Seleccione ubicacion"
                searchPlaceholder="Buscar inventario..."
              />
              {productFormTouched && productFormErrors.inventory_id ? (
                <p className="mt-1 text-xs font-semibold text-red-600">{productFormErrors.inventory_id}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Nombre</label>
              <input
                name="name"
                value={productForm.name}
                onChange={handleProductChange}
                className={`w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 ${
                  productFormTouched && productFormErrors.name ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-blue-300"
                }`}
                placeholder="Nombre"
              />
              {productFormTouched && productFormErrors.name ? (
                <p className="mt-1 text-xs font-semibold text-red-600">{productFormErrors.name}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Tipo</label>
              <SearchableSelect
                value={productForm.type}
                onChange={(value) => handleProductChange({ target: { name: "type", value: String(value) } })}
                options={productTypeOptions}
                placeholder="Seleccione tipo"
                searchPlaceholder="Buscar tipo..."
              />
              {productFormTouched && productFormErrors.type ? (
                <p className="mt-1 text-xs font-semibold text-red-600">{productFormErrors.type}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Categoria</label>
              <SearchableSelect
                value={productForm.category_id}
                onChange={(value) => handleProductChange({ target: { name: "category_id", value: String(value) } })}
                options={categoryOptions}
                placeholder="Seleccione categoria"
                searchPlaceholder="Buscar categoria..."
              />
              {productFormTouched && productFormErrors.category_id ? (
                <p className="mt-1 text-xs font-semibold text-red-600">{productFormErrors.category_id}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Proveedor</label>
              <SearchableSelect
                value={productForm.supplier_id}
                onChange={(value) => handleProductChange({ target: { name: "supplier_id", value: String(value) } })}
                options={supplierOptions}
                placeholder="Seleccione proveedor"
                searchPlaceholder="Buscar proveedor..."
              />
              {productFormTouched && productFormErrors.supplier_id ? (
                <p className="mt-1 text-xs font-semibold text-red-600">{productFormErrors.supplier_id}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Activo</label>
              <SearchableSelect
                value={productForm.is_active}
                onChange={(value) => handleProductChange({ target: { name: "is_active", value: String(value) } })}
                options={[
                  { value: "1", label: "Activo" },
                  { value: "0", label: "Inactivo" },
                ]}
                placeholder="Seleccione estado"
                searchPlaceholder="Buscar estado..."
              />
              {productFormTouched && productFormErrors.is_active ? (
                <p className="mt-1 text-xs font-semibold text-red-600">{productFormErrors.is_active}</p>
              ) : null}
            </div>

            {productForm.type === "consumable" ? (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Stock</label>
                <input
                  name="stock"
                  type="number"
                  min="0"
                  value={productForm.stock}
                  onChange={handleProductChange}
                  className={`w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 ${
                    productFormTouched && productFormErrors.stock ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-blue-300"
                  }`}
                  placeholder="Stock"
                />
                {productFormTouched && productFormErrors.stock ? (
                  <p className="mt-1 text-xs font-semibold text-red-600">{productFormErrors.stock}</p>
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 md:col-span-2">
                Los activos fijos se manejan individualmente (cantidad = 1).
              </div>
            )}

            {productForm.type === "consumable" ? (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Stock minimo de alerta</label>
                <input
                  name="minimum_stock"
                  type="number"
                  min="0"
                  value={productForm.minimum_stock}
                  onChange={handleProductChange}
                  className={`w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 ${
                    productFormTouched && productFormErrors.minimum_stock ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-blue-300"
                  }`}
                  placeholder="Stock minimo de alerta"
                />
                {productFormTouched && productFormErrors.minimum_stock ? (
                  <p className="mt-1 text-xs font-semibold text-red-600">{productFormErrors.minimum_stock}</p>
                ) : null}
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
                className={`w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 ${
                  productFormTouched && productFormErrors.unit_cost ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-blue-300"
                }`}
                placeholder="Costo unitario"
              />
              {productFormTouched && productFormErrors.unit_cost ? (
                <p className="mt-1 text-xs font-semibold text-red-600">{productFormErrors.unit_cost}</p>
              ) : null}
            </div>

            {productForm.type === "asset" ? (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Codigo de activo</label>
                  <input
                    name="asset_code"
                    value={productForm.asset_code}
                    onChange={handleProductChange}
                    className={`w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 ${
                      productFormTouched && productFormErrors.asset_code ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-blue-300"
                    }`}
                    placeholder="Codigo de activo"
                  />
                  {productFormTouched && productFormErrors.asset_code ? (
                    <p className="mt-1 text-xs font-semibold text-red-600">{productFormErrors.asset_code}</p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Serial</label>
                  <input
                    name="serial"
                    value={productForm.serial}
                    onChange={handleProductChange}
                    className={`w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 ${
                      productFormTouched && productFormErrors.serial ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-blue-300"
                    }`}
                    placeholder="Serial"
                  />
                  {productFormTouched && productFormErrors.serial ? (
                    <p className="mt-1 text-xs font-semibold text-red-600">{productFormErrors.serial}</p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Ubicacion</label>
                  <input
                    name="location"
                    value={productForm.location}
                    onChange={handleProductChange}
                    className={`w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 ${
                      productFormTouched && productFormErrors.location ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-blue-300"
                    }`}
                    placeholder="Ubicacion"
                  />
                  {productFormTouched && productFormErrors.location ? (
                    <p className="mt-1 text-xs font-semibold text-red-600">{productFormErrors.location}</p>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
          {suppliers.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-700">No hay proveedores registrados para esta propiedad.</p>
              <button
                type="button"
                onClick={() => navigate(routeCondominiumId ? `/condominio/${routeCondominiumId}/settings/suppliers` : "/settings/suppliers")}
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
              disabled={savingProduct || !isProductFormComplete}
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
            onDelete={setProductToDelete}
            onDeactivate={setAssetToDeactivate}
            saving={savingProduct}
            canEdit={canManageProducts}
            canDeactivate={canManageProducts}
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

      {productToDelete ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900">Desactivar producto</h3>
            <p className="mt-2 text-sm text-slate-600">
              Vas a desactivar el producto <span className="font-semibold text-slate-800">{productToDelete.name}</span>. Ya no estará disponible para nuevas operaciones.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                disabled={deleteProductMutation.isPending}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-70"
              >
                {deleteProductMutation.isPending ? "Procesando..." : "Confirmar"}
              </button>
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={deleteProductMutation.isPending}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {assetToDeactivate ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900">Dar de baja activo fijo</h3>
            <p className="mt-2 text-sm text-slate-600">
              Vas a marcar como inactivo el activo <span className="font-semibold text-slate-800">{assetToDeactivate.name}</span>
              {assetToDeactivate.serial ? ` (Serial ${assetToDeactivate.serial})` : ""}. No podrá recibir movimientos nuevos.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleConfirmDeactivateAsset}
                disabled={deactivateAssetMutation.isPending}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-70"
              >
                {deactivateAssetMutation.isPending ? "Procesando..." : "Confirmar baja"}
              </button>
              <button
                type="button"
                onClick={() => setAssetToDeactivate(null)}
                disabled={deactivateAssetMutation.isPending}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
