import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const ROUTE_BY_VARIANT = {
  dashboard: "dashboard",
  settings: "settings",
  vehicles: "vehicles",
  inventorySettings: "settings/inventory",
};

function BackButton({ to, variant = "dashboard", label = "Atrás", className = "" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const basePath = id ? `/condominio/${id}` : "";

  const routeSegment = ROUTE_BY_VARIANT[variant];
  const resolvedTarget =
    to || (routeSegment ? (basePath ? `${basePath}/${routeSegment}` : `/${routeSegment}`) : null);

  const handleClick = () => {
    if (resolvedTarget) {
      navigate(resolvedTarget);
      return;
    }

    navigate(-1);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      className={[
        "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50",
        className,
      ].join(" ")}
    >
      <ArrowLeft className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}

export default BackButton;
