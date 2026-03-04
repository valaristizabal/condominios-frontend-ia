import { Link, useParams } from "react-router-dom";

function QuickActions() {
  const { id } = useParams();
  const basePath = id ? `/condominio/${id}` : "";

  const actions = [
    { title: "Registro de visitantes", status: "Proximamente" },
    { title: "Ingreso de vehiculos", status: "Proximamente" },
    { title: "Correspondencia", status: "Proximamente" },
    { title: "Control de personal", status: "Activo", to: `${basePath}/employee-entries` },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {actions.map((action) =>
        action.to ? (
          <Link
            key={action.title}
            to={action.to}
            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 transition hover:bg-blue-100"
          >
            <p className="text-sm font-semibold text-slate-800">{action.title}</p>
            <p className="mt-1 text-xs text-blue-700">{action.status}</p>
          </Link>
        ) : (
          <div key={action.title} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">{action.title}</p>
            <p className="mt-1 text-xs text-slate-500">{action.status}</p>
          </div>
        )
      )}
    </div>
  );
}

export default QuickActions;
