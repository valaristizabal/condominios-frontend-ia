import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthContext } from "../context/useAuthContext";
import LoginPage from "../modules/auth/pages/LoginPage";
import ApartmentsPage from "../modules/ajustes/apartments/pages/ApartmentsPage";
import UnitTypesPage from "../modules/settings/unit-types/pages/UnitTypesPage";
import CleaningSettingsPage from "../modules/settings/pages/CleaningSettingsPage";
import SettingsPage from "../modules/settings/pages/SettingsPage";
import CondominiumsPage from "../modules/condominiums/pages/CondominiumsPage";
import DashboardPage from "../modules/dashboard/pages/DashboardPage";
import VisitsPage from "../modules/operation/visits/pages/VisitsPage";
import OperativesPage from "../modules/settings/operatives/pages/OperativesPage";
import ResidentsPage from "../modules/settings/residents/pages/ResidentsPage";
import PlatformLayout from "../layouts/PlatformLayout";
import TenantLayout from "../layouts/TenantLayout";
import ProtectedRoute from "./ProtectedRoute";
import SuperAdminRoute from "./SuperAdminRoute";
import TenantRoute from "./TenantRoute";
import { isSuperUser } from "../utils/roles";

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
        path="/visits"
        element={
          <TenantRoute>
            <TenantLayout>
              <VisitsPage />
            </TenantLayout>
          </TenantRoute>
        }
      />
      <Route
        path="/settings/apartments"
        element={
          <TenantRoute>
            <TenantLayout>
              <ApartmentsPage />
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
        path="/settings/unit-types"
        element={
          <TenantRoute>
            <TenantLayout>
              <UnitTypesPage />
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
            <SuperAdminRoute>
              <TenantLayout>
                <SettingsPage />
              </TenantLayout>
            </SuperAdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominio/:id/dashboard"
        element={
          <ProtectedRoute>
            <SuperAdminRoute>
              <TenantLayout>
                <DashboardPage />
              </TenantLayout>
            </SuperAdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominio/:id/settings/operatives"
        element={
          <ProtectedRoute>
            <SuperAdminRoute>
              <TenantLayout>
                <OperativesPage />
              </TenantLayout>
            </SuperAdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominio/:id/visits"
        element={
          <ProtectedRoute>
            <SuperAdminRoute>
              <TenantLayout>
                <VisitsPage />
              </TenantLayout>
            </SuperAdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominio/:id/settings/apartments"
        element={
          <ProtectedRoute>
            <SuperAdminRoute>
              <TenantLayout>
                <ApartmentsPage />
              </TenantLayout>
            </SuperAdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominio/:id/settings/cleaning"
        element={
          <ProtectedRoute>
            <SuperAdminRoute>
              <TenantLayout>
                <CleaningSettingsPage />
              </TenantLayout>
            </SuperAdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominio/:id/settings/unit-types"
        element={
          <ProtectedRoute>
            <SuperAdminRoute>
              <TenantLayout>
                <UnitTypesPage />
              </TenantLayout>
            </SuperAdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominio/:id/settings/residents"
        element={
          <ProtectedRoute>
            <SuperAdminRoute>
              <TenantLayout>
                <ResidentsPage />
              </TenantLayout>
            </SuperAdminRoute>
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

  return <Navigate to={isSuperUser(user?.role) ? "/condominiums" : "/settings"} replace />;
}

export default AppRoutes;
