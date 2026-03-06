import { useNavigate, useParams } from "react-router-dom";
import BackButton from "../../../components/common/BackButton";

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
  const basePath = id ? `/condominio/${id}` : "";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-4">
        <BackButton variant="settings" />
      </div>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Configuración</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-900">Inventario</h1>
      </div>

      <Card>
        <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Configuración de inventario</p>
        <div className="mt-4 space-y-3">
          <ItemRow
            title="Ubicaciones de inventario"
            description="Configura las ubicaciones físicas (bodegas o áreas) donde se almacenan los productos del inventario."
            onClick={() => navigate(`${basePath}/settings/inventories`)}
          />
          <ItemRow
            title="Categorías de inventario"
            description="Configura categorías de productos para inventario"
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

export default InventorySettingsPage;

