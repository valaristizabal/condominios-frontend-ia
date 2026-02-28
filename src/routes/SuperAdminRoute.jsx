import { Navigate } from "react-router-dom";
import { useAuthContext } from "../context/useAuthContext";

function SuperAdminRoute({ children }) {
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

  if (user?.role !== "super_admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default SuperAdminRoute;

