export function normalizeRoleName(roleName) {
  return String(roleName || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_\s]+/g, " ")
    .trim();
}

export function isSuperUser(roleName) {
  const normalized = normalizeRoleName(roleName);
  return normalized === "super usuario" || normalized === "super admin";
}

export function isTenantAdminRole(roleName) {
  const normalized = normalizeRoleName(roleName);
  return (
    normalized === "administrador propiedad" ||
    normalized === "administrador_propiedad" ||
    normalized === "admin condominio" ||
    normalized === "admin_condominio"
  );
}

export function isInventoryOperatorRole(roleName) {
  const normalized = normalizeRoleName(roleName);
  if (isTenantAdminRole(roleName)) return true;

  return (
    normalized.includes("operativ") ||
    normalized.includes("seguridad") ||
    normalized.includes("vigilante") ||
    normalized.includes("porteria")
  );
}

export function canAccessInventoryOperation(user) {
  if (!user) return false;
  if (isSuperUser(user?.role)) return true;
  return isInventoryOperatorRole(user?.role);
}

export function canAccessInventorySettings(user) {
  if (!user) return false;
  if (isSuperUser(user?.role)) return true;
  return isTenantAdminRole(user?.role);
}

