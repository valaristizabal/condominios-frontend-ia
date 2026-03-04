import { useEffect, useMemo, useState } from "react";
import { PlusCircle } from "lucide-react";
import { useParams } from "react-router-dom";
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
  getProductMovements,
  getProducts,
  registerEntry,
  registerExit,
} from "../services/inventory.service";

function InventoryPage() {
  const { activeCondominiumId } = useActiveCondominium();
  const { id: routeCondominiumId } = useParams();

  const [inventories, setInventories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingMovement, setSavingMovement] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
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

  useEffect(() => {
    loadInventoriesAndCategories();
  }, [resolvedCondominiumId]);

  useEffect(() => {
    loadInventoryData();
  }, [resolvedCondominiumId, selectedInventoryId]);

  const loadInventoriesAndCategories = async () => {
    if (!resolvedCondominiumId) {
      setInventories([]);
      setCategories([]);
      setSelectedInventoryId("");
      setProducts([]);
      setLowStockProducts([]);
      setMovements([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [inventoriesResponse, categoriesResponse] = await Promise.all([
        getInventories(requestConfig),
        getInventoryCategories(requestConfig),
      ]);

      setInventories(inventoriesResponse);
      setCategories(categoriesResponse);

      if (inventoriesResponse.length === 0) {
        setSelectedInventoryId("");
        setProducts([]);
        setLowStockProducts([]);
        setMovements([]);
      } else {
        setSelectedInventoryId((prev) => {
          const exists = inventoriesResponse.some((item) => String(item.id) === String(prev));
          if (exists && prev) return prev;
          return String(inventoriesResponse[0].id);
        });
      }

    } catch (err) {
      setError(normalizeApiError(err, "No fue posible cargar inventarios."));
    } finally {
      setLoading(false);
    }
  };

  const loadInventoryData = async () => {
    if (!resolvedCondominiumId || !selectedInventoryId) {
      setProducts([]);
      setLowStockProducts([]);
      setMovements([]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const productsResponse = await getProducts(requestConfig, Number(selectedInventoryId));
      setProducts(productsResponse);

      const lowStockResponse = await getLowStockProducts(requestConfig);
      setLowStockProducts(
        lowStockResponse.filter((product) => String(product.inventory_id) === String(selectedInventoryId))
      );

      const movementResults = await Promise.all(
        productsResponse.slice(0, 20).map(async (product) => {
          const rows = await getProductMovements(product.id, requestConfig);
          return rows.map((movement) => ({
            ...movement,
            product_name: product.name,
          }));
        })
      );

      const merged = movementResults.flat().sort((a, b) => {
        const aDate = new Date(a.movement_date || a.created_at || 0).getTime();
        const bDate = new Date(b.movement_date || b.created_at || 0).getTime();
        return bDate - aDate;
      });
      setMovements(merged.slice(0, 30));

      if (productsResponse.length === 0) {
        setMovementForm((prev) => ({ ...prev, product_id: "" }));
      }
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible cargar inventario."));
    } finally {
      setLoading(false);
    }
  };

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
    setSavingMovement(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        product_id: Number(movementForm.product_id),
        quantity: Number(movementForm.quantity),
        observations: String(movementForm.observations || "").trim() || null,
      };
      if (movementForm.type === "entry") {
        await registerEntry(payload, requestConfig);
      } else {
        await registerExit(payload, requestConfig);
      }
      setSuccess("Movimiento registrado correctamente.");
      setMovementForm({
        product_id: "",
        type: "",
        quantity: "",
        observations: "",
      });
      await loadInventoryData();
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible registrar el movimiento."));
    } finally {
      setSavingMovement(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!productForm.name.trim()) return;
    const inventoryId = Number(selectedInventoryId);
    if (!inventoryId) {
      setError("Selecciona un inventario activo para crear el producto.");
      return;
    }

    setSavingProduct(true);
    setError("");
    setSuccess("");
    try {
      await createProduct(
        {
          inventory_id: inventoryId,
          name: productForm.name.trim(),
          category_id: productForm.category_id ? Number(productForm.category_id) : null,
          type: productForm.type,
          minimum_stock: Number(productForm.minimum_stock || 0),
          stock: Number(productForm.stock || 0),
          asset_code: productForm.type === "asset" ? productForm.asset_code || null : null,
          location: productForm.location || null,
        },
        requestConfig
      );
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
      await loadInventoryData();
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible crear el producto."));
    } finally {
      setSavingProduct(false);
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
          No hay condominio activo para operar este módulo.
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
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Categoría</label>
              <select
                name="category_id"
                value={productForm.category_id}
                onChange={handleProductChange}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">Seleccione categoría</option>
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
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Stock mínimo de alerta</label>
              <input
                name="minimum_stock"
                type="number"
                min="0"
                value={productForm.minimum_stock}
                onChange={handleProductChange}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Stock mínimo de alerta"
              />
              <p className="mt-1 text-xs font-semibold text-gray-500">
                Cuando el stock sea menor a este valor se generará alerta de reposición.
              </p>
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

            {productForm.type === "asset" ? (
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Código de activo</label>
                <input
                  name="asset_code"
                  value={productForm.asset_code}
                  onChange={handleProductChange}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="Código de activo"
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
