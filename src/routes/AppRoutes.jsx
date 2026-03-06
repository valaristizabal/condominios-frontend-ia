import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthContext } from "../context/useAuthContext";
import LoginPage from "../modules/auth/pages/LoginPage";
import ApartmentsPage from "../modules/ajustes/apartments/pages/ApartmentsPage";
import UnitTypesPage from "../modules/settings/unit-types/pages/UnitTypesPage";
import VehicleTypesPage from "../modules/settings/vehicle-types/pages/VehicleTypesPage";
import EmergencyTypesPage from "../modules/settings/emergency-types/pages/EmergencyTypesPage";
import EmergencyContactsPage from "../modules/settings/emergency-contacts/pages/EmergencyContactsPage";
import CleaningSettingsPage from "../modules/settings/pages/CleaningSettingsPage";
import InventorySettingsPage from "../modules/settings/pages/InventorySettingsPage";
import SettingsPage from "../modules/settings/pages/SettingsPage";
import CondominiumsPage from "../modules/condominiums/pages/CondominiumsPage";
import DashboardPage from "../modules/dashboard/pages/DashboardPage";
import EmergenciesPage from "../modules/emergencies/pages/EmergenciesPage";
import VisitsPage from "../modules/operation/visits/pages/VisitsPage";
import VehiclesPage from "../modules/operation/vehicles/pages/VehiclesPage";
import VehicleIncidentsPage from "../modules/operation/vehicle-incidents/pages/VehicleIncidentsPage";
import CorrespondencePage from "../modules/operation/correspondence/pages/CorrespondencePage";
import ControlIngresoPage from "../modules/control-ingreso/pages/ControlIngresoPage";
import CleaningRecordsPage from "../modules/cleaning/CleaningRecordsPage";
import InventoryPage from "../modules/inventory/pages/InventoryPage";
import InventoryCategoriesPage from "../modules/settings/inventory-categories/pages/InventoryCategoriesPage";
import InventoriesPage from "../modules/settings/inventories/pages/InventoriesPage";
import OperativesPage from "../modules/settings/operatives/pages/OperativesPage";
import ResidentsPage from "../modules/settings/residents/pages/ResidentsPage";
import SuppliersPage from "../modules/settings/suppliers/pages/SuppliersPage";
import UsersPermissionsPage from "../modules/settings/users/pages/UsersPermissionsPage";
import PlatformLayout from "../layouts/PlatformLayout";
import TenantLayout from "../layouts/TenantLayout";
import ProtectedRoute from "./ProtectedRoute";
import InventoryOperationRoute from "./InventoryOperationRoute";
import InventorySettingsRoute from "./InventorySettingsRoute";
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
        path="/emergencies"
        element={
          <TenantRoute>
            <TenantLayout>
              <EmergenciesPage />
            </TenantLayout>
          </TenantRoute>
        }
      />
      <Route
        path="/vehicles"
        element={
          <TenantRoute>
            <TenantLayout>
              <VehiclesPage />
            </TenantLayout>
          </TenantRoute>
        }
      />
      <Route
        path="/employee-entries"
        element={
          <TenantRoute>
            <TenantLayout>
              <ControlIngresoPage />
            </TenantLayout>
          </TenantRoute>
        }
      />
      <Route
        path="/correspondence"
        element={
          <TenantRoute>
            <TenantLayout>
              <CorrespondencePage />
            </TenantLayout>
          </TenantRoute>
        }
      />
      <Route
        path="/cleaning"
        element={
          <TenantRoute>
            <TenantLayout>
              <CleaningRecordsPage />
            </TenantLayout>
          </TenantRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <TenantRoute>
            <InventoryOperationRoute>
              <TenantLayout>
                <InventoryPage allowProductManagement={false} />
              </TenantLayout>
            </InventoryOperationRoute>
          </TenantRoute>
        }
      />
      <Route
        path="/vehiculos/novedad"
        element={
          <TenantRoute>
            <TenantLayout>
              <VehicleIncidentsPage />
            </TenantLayout>
          </TenantRoute>
        }
      />
      <Route
        path="/vehicle-incidents"
        element={
          <TenantRoute>
            <TenantLayout>
              <VehicleIncidentsPage />
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
        path="/settings/emergency-types"
        element={
          <TenantRoute>
            <TenantLayout>
              <EmergencyTypesPage />
            </TenantLayout>
          </TenantRoute>
        }
      />
      <Route
        path="/settings/emergency-contacts"
        element={
          <TenantRoute>
            <TenantLayout>
              <EmergencyContactsPage />
            </TenantLayout>
          </TenantRoute>
        }
      />
      <Route
        path="/settings/vehicle-types"
        element={
          <TenantRoute>
            <TenantLayout>
              <VehicleTypesPage />
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
        path="/settings/inventories"
        element={
          <TenantRoute>
            <InventorySettingsRoute>
              <TenantLayout>
                <InventoriesPage />
              </TenantLayout>
            </InventorySettingsRoute>
          </TenantRoute>
        }
      />
      <Route
        path="/settings/inventory"
        element={
          <TenantRoute>
            <InventorySettingsRoute>
              <TenantLayout>
                <InventorySettingsPage />
              </TenantLayout>
            </InventorySettingsRoute>
          </TenantRoute>
        }
      />
      <Route
        path="/settings/inventory/products"
        element={
          <TenantRoute>
            <InventorySettingsRoute>
              <TenantLayout>
                <InventoryPage allowProductManagement showOperationTools={false} />
              </TenantLayout>
            </InventorySettingsRoute>
          </TenantRoute>
        }
      />
      <Route
        path="/settings/inventory-categories"
        element={
          <TenantRoute>
            <InventorySettingsRoute>
              <TenantLayout>
                <InventoryCategoriesPage />
              </TenantLayout>
            </InventorySettingsRoute>
          </TenantRoute>
        }
      />
      <Route
        path="/settings/suppliers"
        element={
          <TenantRoute>
            <InventorySettingsRoute>
              <TenantLayout>
                <SuppliersPage />
              </TenantLayout>
            </InventorySettingsRoute>
          </TenantRoute>
        }
      />
      <Route
        path="/settings/users"
        element={
          <TenantRoute>
            <TenantLayout>
              <UsersPermissionsPage />
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
        path="/condominio/:id/emergencies"
        element={
          <ProtectedRoute>
            <SuperAdminRoute>
              <TenantLayout>
                <EmergenciesPage />
              </TenantLayout>
            </SuperAdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominio/:id/vehicles"
        element={
          <ProtectedRoute>
            <SuperAdminRoute>
              <TenantLayout>
                <VehiclesPage />
              </TenantLayout>
            </SuperAdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominio/:id/employee-entries"
        element={
          <ProtectedRoute>
            <SuperAdminRoute>
              <TenantLayout>
                <ControlIngresoPage />
              </TenantLayout>
            </SuperAdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominio/:id/correspondence"
        element={
          <ProtectedRoute>
            <SuperAdminRoute>
              <TenantLayout>
                <CorrespondencePage />
              </TenantLayout>
            </SuperAdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominio/:id/cleaning"
        element={
          <ProtectedRoute>
            <SuperAdminRoute>
              <TenantLayout>
                <CleaningRecordsPage />
              </TenantLayout>
            </SuperAdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominio/:id/inventory"
        element={
          <ProtectedRoute>
            <SuperAdminRoute>
              <TenantLayout>
                <InventoryPage allowProductManagement={false} />
              </TenantLayout>
            </SuperAdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominio/:id/vehiculos/novedad"
        element={
          <ProtectedRoute>
            <SuperAdminRoute>
              <TenantLayout>
                <VehicleIncidentsPage />
              </TenantLayout>
            </SuperAdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominio/:id/vehicle-incidents"
        element={
          <ProtectedRoute>
            <SuperAdminRoute>
              <TenantLayout>
                <VehicleIncidentsPage />
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
        path="/condominio/:id/settings/emergency-types"
        element={
          <ProtectedRoute>
            <SuperAdminRoute>
              <TenantLayout>
                <EmergencyTypesPage />
              </TenantLayout>
            </SuperAdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominio/:id/settings/emergency-contacts"
        element={
          <ProtectedRoute>
            <SuperAdminRoute>
              <TenantLayout>
                <EmergencyContactsPage />
              </TenantLayout>
            </SuperAdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominio/:id/settings/vehicle-types"
        element={
          <ProtectedRoute>
            <SuperAdminRoute>
              <TenantLayout>
                <VehicleTypesPage />
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
        path="/condominio/:id/settings/inventories"
        element={
          <ProtectedRoute>
            <SuperAdminRoute>
              <TenantLayout>
                <InventoriesPage />
              </TenantLayout>
            </SuperAdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominio/:id/settings/inventory"
        element={
          <ProtectedRoute>
            <SuperAdminRoute>
              <TenantLayout>
                <InventorySettingsPage />
              </TenantLayout>
            </SuperAdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominio/:id/settings/inventory/products"
        element={
          <ProtectedRoute>
            <SuperAdminRoute>
              <TenantLayout>
                <InventoryPage allowProductManagement showOperationTools={false} />
              </TenantLayout>
            </SuperAdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominio/:id/settings/inventory-categories"
        element={
          <ProtectedRoute>
            <SuperAdminRoute>
              <TenantLayout>
                <InventoryCategoriesPage />
              </TenantLayout>
            </SuperAdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominio/:id/settings/suppliers"
        element={
          <ProtectedRoute>
            <SuperAdminRoute>
              <TenantLayout>
                <SuppliersPage />
              </TenantLayout>
            </SuperAdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/condominio/:id/settings/users"
        element={
          <ProtectedRoute>
            <SuperAdminRoute>
              <TenantLayout>
                <UsersPermissionsPage />
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
