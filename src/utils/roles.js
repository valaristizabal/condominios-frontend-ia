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

