import { Navigate } from "react-router-dom";
import { useAuthContext } from "../context/useAuthContext";
import { canAccessInventoryOperation } from "../utils/roles";

function InventoryOperationRoute({ children }) {
  const { user, authLoading } = useAuthContext();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef1f6]">
        <p className="text-lg font-semibold text-slate-600">Cargando sesión...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!canAccessInventoryOperation(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default InventoryOperationRoute;

