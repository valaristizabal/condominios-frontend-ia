import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthContext } from "../context/useAuthContext";
import LoginPage from "../modules/auth/pages/LoginPage";
import CondominiumsPage from "../modules/condominiums/pages/CondominiumsPage";
import DashboardPage from "../modules/dashboard/pages/DashboardPage";
import PlatformLayout from "../layouts/PlatformLayout";
import TenantLayout from "../layouts/TenantLayout";
import ProtectedRoute from "./ProtectedRoute";
import SuperAdminRoute from "./SuperAdminRoute";
import TenantRoute from "./TenantRoute";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <TenantRoute>
            <TenantLayout>
              <DashboardPage />
            </TenantLayout>
          </TenantRoute>
        }
      />
      <Route
        path="/condominiums"
        element={
          <ProtectedRoute>
            <SuperAdminRoute>
              <PlatformLayout>
                <CondominiumsPage />
              </PlatformLayout>
            </SuperAdminRoute>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

function HomeRedirect() {
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

  return <Navigate to={user.role === "super_admin" ? "/condominiums" : "/dashboard"} replace />;
}

export default AppRoutes;
