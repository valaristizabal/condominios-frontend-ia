import { Link, useParams } from "react-router-dom";
import { useAuthContext } from "../../../context/useAuthContext";
import { hasModuleAccess } from "../../../utils/roles";

function QuickActions() {
  const { id } = useParams();
  const { user } = useAuthContext();
  const basePath = id ? `/condominio/${id}` : "";
  const canSeeEmployeeEntries = hasModuleAccess(user, "employee-entries");

  if (!canSeeEmployeeEntries) {
    return null;
  }

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
