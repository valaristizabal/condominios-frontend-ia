import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BackButton from "../../../components/common/BackButton";
import { useActiveCondominium } from "../../../context/useActiveCondominium";
import apiClient from "../../../services/apiClient";
import { exportInventoryWorkbook } from "./inventoryExcel";

function Card({ children, className = "" }) {
  return (
    <div className={["rounded-3xl border border-slate-200 bg-white p-5 shadow-sm", className].join(" ")}>
      {children}
    </div>
  );
}

function ItemRow({ title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:bg-slate-50 active:scale-[0.99]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-700">
          <span className="text-xs font-extrabold">{title.slice(0, 2).toUpperCase()}</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-slate-900">{title}</p>
          <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{description}</p>
        </div>
      </div>

      <ChevronRightIcon />
    </button>
  );
}

function InventorySettingsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { activeCondominiumId } = useActiveCondominium();
  const basePath = id ? `/condominio/${id}` : "";
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const resolvedCondominiumId = useMemo(() => {
    const contextId = Number(activeCondominiumId);
    if (Number.isFinite(contextId) && contextId > 0) return contextId;
    const routeId = Number(id);
    if (Number.isFinite(routeId) && routeId > 0) return routeId;
    return null;
  }, [activeCondominiumId, id]);

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

  const handleExportInventory = async () => {
    if (!resolvedCondominiumId || exporting) return;
    setExporting(true);
    setError("");

    try {
      let page = 1;
      let lastPage = 1;
      const rows = [];

      do {
        const response = await apiClient.get("/inventory/products-with-movements", {
          ...(requestConfig || {}),
          params: {
            page,
            per_page: 10,
          },
        });

        const payload = response?.data || {};
        const pageRows = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];

        rows.push(...pageRows);
        lastPage = Math.max(1, Number(payload?.last_page || 1));
        page += 1;
      } while (page <= lastPage);

      await exportInventoryWorkbook({
        products: rows,
        fileName: `inventario-${new Date().toISOString().slice(0, 10)}.xlsx`,
        condominiumLabel: `Propiedad #${resolvedCondominiumId}`,
      });
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible exportar el inventario."));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-4">
        <BackButton variant="settings" />
      </div>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Configuracion</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-900">Inventario</h1>
      </div>

      <Card>
        <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Configuracion de inventario</p>
        <div className="mt-4">
          <button
            type="button"
            onClick={handleExportInventory}
            disabled={!resolvedCondominiumId || exporting}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {exporting ? "Exportando..." : "Exportar inventario"}
          </button>
        </div>
        {error ? (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {error}
          </p>
        ) : null}
        <div className="mt-4 space-y-3">
          <ItemRow
            title="Productos"
            description="Crea y edita productos del inventario. Solo administradores."
            onClick={() => navigate(`${basePath}/settings/inventory/products`)}
          />
          <ItemRow
            title="Ubicaciones de inventario"
            description="Configura las ubicaciones fisicas (bodegas o areas) donde se almacenan los productos del inventario."
            onClick={() => navigate(`${basePath}/settings/inventories`)}
          />
          <ItemRow
            title="Categorias de inventario"
            description="Configura categorias de productos para inventario"
            onClick={() => navigate(`${basePath}/settings/inventory-categories`)}
          />
          <ItemRow
            title="Proveedores"
            description="Administra los proveedores que suministran productos al inventario."
            onClick={() => navigate(`${basePath}/settings/suppliers`)}
          />
        </div>
      </Card>
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-400" aria-hidden="true">
      <path fill="currentColor" d="m9.29 6.71 1.42-1.42L17.41 12l-6.7 6.71-1.42-1.42L14.59 12 9.29 6.71Z" />
    </svg>
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

export default InventorySettingsPage;
