import { Navigate } from "react-router-dom";
import { useAuthContext } from "../context/useAuthContext";

function TenantRoute({ children }) {
  const { user, authLoading } = useAuthContext();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef1f6]">
        <p className="text-lg font-semibold text-slate-600">Cargando sesión...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === "super_admin") {
    return <Navigate to="/condominiums" replace />;
  }

  return children;
}

export default TenantRoute;

