import { Link, useParams } from "react-router-dom";

function QuickActions() {
  const { id } = useParams();
  const basePath = id ? `/condominio/${id}` : "";

  return (
    <div className="max-w-sm">
      <Link
        to={`${basePath}/employee-entries`}
        className="block rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 transition hover:bg-blue-100"
      >
        <p className="text-sm font-semibold text-slate-800">Control de personal</p>
      </Link>
    </div>
  );
}

export default QuickActions;
