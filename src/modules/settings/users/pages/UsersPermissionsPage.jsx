import { useEffect, useMemo, useState } from "react";
import BackButton from "../../../../components/common/BackButton";
import { useActiveCondominium } from "../../../../context/useActiveCondominium";
import { useAuthContext } from "../../../../context/useAuthContext";
import apiClient from "../../../../services/apiClient";
import {
  AVAILABLE_MODULES,
  canManageUserPermissions,
  isSuperUser,
  isTenantAdminRole,
} from "../../../../utils/roles";

const MODULE_LABELS = {
  visits: "Visitantes",
  vehicles: "Vehiculos",
  "vehicle-incidents": "Novedades vehiculares",
  "employee-entries": "Ingreso personal",
  correspondences: "Correspondencia",
  emergencies: "Emergencias",
  cleaning: "Aseo",
  inventory: "Inventario",
  settings: "Ajustes",
};

function UsersPermissionsPage() {
  const { user } = useAuthContext();
  const { activeCondominiumId } = useActiveCondominium();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");
  const [targetUser, setTargetUser] = useState(null);
  const [permissionDraft, setPermissionDraft] = useState({});

  const canManage = canManageUserPermissions(user);

  const requestConfig = useMemo(
    () =>
      activeCondominiumId
        ? {
            headers: {
              "X-Active-Condominium-Id": String(activeCondominiumId),
            },
          }
        : undefined,
    [activeCondominiumId]
  );

  const filteredUsers = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    const nonAdminUsers = users.filter((item) => !isAdminUser(item));
    if (!q) return nonAdminUsers;

    return nonAdminUsers.filter((item) => {
      const name = String(item?.full_name || "").toLowerCase();
      const email = String(item?.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [query, users]);

  const loadUsers = async () => {
    if (!activeCondominiumId) return;
    if (!canManage) return;

    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/users", requestConfig);
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible cargar usuarios."));
    } finally {
      setLoading(false);
    }
  };

  const openPermissionsModal = async (target) => {
    if (!target?.id || !canManage || !activeCondominiumId) return;

    setSaving(true);
    setError("");
    try {
      const response = await apiClient.get(`/users/${target.id}/module-permissions`, requestConfig);
      const payload = Array.isArray(response.data) ? response.data : [];
      const initialDraft = {};

      AVAILABLE_MODULES.forEach((module) => {
        const match = payload.find((item) => item?.module === module);
        initialDraft[module] = Boolean(match?.can_view);
      });

      setPermissionDraft(initialDraft);
      setTargetUser(target);
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible cargar permisos del usuario."));
    } finally {
      setSaving(false);
    }
  };

  const closePermissionsModal = () => {
    if (saving) return;
    setTargetUser(null);
    setPermissionDraft({});
  };

  const handleSavePermissions = async () => {
    if (!targetUser?.id || !canManage || !activeCondominiumId) return;

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = AVAILABLE_MODULES.map((module) => ({
        module,
        can_view: Boolean(permissionDraft[module]),
      }));

      await apiClient.post(`/users/${targetUser.id}/module-permissions`, payload, requestConfig);
      setSuccess("Permisos actualizados correctamente.");
      closePermissionsModal();
    } catch (err) {
      setError(normalizeApiError(err, "No fue posible guardar permisos."));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCondominiumId, canManage]);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-3">
        <BackButton variant="settings" />
      </div>

      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Usuarios y permisos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Configura modulos visibles por usuario en la propiedad activa.
          </p>
        </div>
      </header>

      {!activeCondominiumId ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No hay propiedad activa para gestionar permisos.
        </p>
      ) : null}

      {!canManage ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No tienes permisos para administrar permisos de modulos.
        </p>
      ) : null}

      {success ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <Field
          label="Buscar usuario"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nombre o email"
        />
        <div className="flex items-end">
          <button
            type="button"
            onClick={loadUsers}
            disabled={loading || !activeCondominiumId || !canManage}
            className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-70"
          >
            {loading ? "Cargando..." : "Recargar"}
          </button>
        </div>
      </section>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-semibold text-slate-800">{item.full_name || "-"}</td>
                <td className="px-4 py-3 text-slate-600">{item.email || "-"}</td>
                <td className="px-4 py-3 text-slate-600">{item?.roles?.[0]?.name || "-"}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => openPermissionsModal(item)}
                    disabled={!canManage || saving}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                  >
                    Permisos
                  </button>
                </td>
              </tr>
            ))}
            {!filteredUsers.length ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No hay usuarios para mostrar.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {targetUser ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-4 sm:items-center">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900">Permisos de modulos</h3>
            <p className="mt-1 text-sm text-slate-500">
              Usuario: <span className="font-semibold text-slate-700">{targetUser?.full_name || "-"}</span>
            </p>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {AVAILABLE_MODULES.map((module) => (
                <label
                  key={module}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <span className="text-sm font-semibold text-slate-700">{MODULE_LABELS[module] || module}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(permissionDraft[module])}
                    onChange={(event) =>
                      setPermissionDraft((prev) => ({
                        ...prev,
                        [module]: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-300"
                  />
                </label>
              ))}
            </div>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleSavePermissions}
                disabled={saving}
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-70"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
              <button
                type="button"
                onClick={closePermissionsModal}
                disabled={saving}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-70"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        {...props}
        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  );
}

function normalizeApiError(err, fallbackMessage) {
  const responseData = err?.response?.data;
  const errors = responseData?.errors;

  if (errors && typeof errors === "object") {
    const firstFieldErrors = Object.values(errors).find(
      (fieldErrors) => Array.isArray(fieldErrors) && fieldErrors.length > 0
    );
    if (firstFieldErrors) {
      return String(firstFieldErrors[0]);
    }
  }

  return responseData?.message || err?.message || fallbackMessage;
}

function isAdminUser(userItem) {
  const roles = [];

  if (typeof userItem?.role === "string" && userItem.role.trim()) {
    roles.push(userItem.role);
  }

  if (Array.isArray(userItem?.roles)) {
    userItem.roles.forEach((roleItem) => {
      if (typeof roleItem === "string" && roleItem.trim()) {
        roles.push(roleItem);
        return;
      }

      if (typeof roleItem?.name === "string" && roleItem.name.trim()) {
        roles.push(roleItem.name);
      }
    });
  }

  return roles.some((roleName) => isSuperUser(roleName) || isTenantAdminRole(roleName));
}

export default UsersPermissionsPage;
