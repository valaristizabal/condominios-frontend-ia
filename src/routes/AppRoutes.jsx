import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthContext } from "../context/useAuthContext";
import LoginPage from "../modules/auth/pages/LoginPage";
import ApartmentsSettingsPage from "../modules/settings/pages/ApartmentsSettingsPage";
import CleaningSettingsPage from "../modules/settings/pages/CleaningSettingsPage";
import SettingsPage from "../modules/settings/pages/SettingsPage";
import CondominiumsPage from "../modules/condominiums/pages/CondominiumsPage";
import DashboardPage from "../modules/dashboard/pages/DashboardPage";
import OperativesPage from "../modules/settings/operatives/pages/OperativesPage";
import ResidentsPage from "../modules/settings/residents/pages/ResidentsPage";
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
        path="/settings"
        element={
          <TenantRoute>
            <TenantLayout>
              <SettingsPage />
            </TenantLayout>
          </TenantRoute>
        }
      />
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
        path="/settings/operatives"
        element={
          <TenantRoute>
            <TenantLayout>
              <OperativesPage />
            </TenantLayout>
          </TenantRoute>
        }
      />
      <Route
        path="/settings/apartments"
        element={
          <TenantRoute>
            <TenantLayout>
              <ApartmentsSettingsPage />
            </TenantLayout>
          </TenantRoute>
        }
      />
      <Route
        path="/settings/cleaning"
        element={
          <TenantRoute>
            <TenantLayout>
              <CleaningSettingsPage />
            </TenantLayout>
          </TenantRoute>
        }
      />
      <Route
        path="/settings/residents"
        element={
          <TenantRoute>
            <TenantLayout>
              <ResidentsPage />
            </TenantLayout>
          </TenantRoute>
        }
      />
      <Route
        path="/condominio/:id/settings"
        element={
          <ProtectedRoute>
            <TenantLayout>
              <SettingsPage />
            </TenantLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominio/:id/dashboard"
        element={
          <ProtectedRoute>
            <TenantLayout>
              <DashboardPage />
            </TenantLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominio/:id/settings/operatives"
        element={
          <ProtectedRoute>
            <TenantLayout>
              <OperativesPage />
            </TenantLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominio/:id/settings/apartments"
        element={
          <ProtectedRoute>
            <TenantLayout>
              <ApartmentsSettingsPage />
            </TenantLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominio/:id/settings/cleaning"
        element={
          <ProtectedRoute>
            <TenantLayout>
              <CleaningSettingsPage />
            </TenantLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominio/:id/settings/residents"
        element={
          <ProtectedRoute>
            <TenantLayout>
              <ResidentsPage />
            </TenantLayout>
          </ProtectedRoute>
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

  return <Navigate to={user.role === "super_admin" ? "/condominiums" : "/settings"} replace />;
}

export default AppRoutes;
