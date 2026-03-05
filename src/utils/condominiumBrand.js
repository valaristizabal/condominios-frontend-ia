function getApiOrigin() {
  const baseUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
  return String(baseUrl).replace(/\/api\/?$/, "");
}

export function resolveCondominiumLogo(condominium) {
  const direct = condominium?.logo_url || condominium?.image_url || null;
  if (direct) return direct;

  const path = condominium?.logo_path;
  if (!path) return null;
  if (/^(https?:\/\/|data:image)/i.test(path)) return path;

  return `${getApiOrigin()}/storage/${String(path).replace(/^\/+/, "")}`;
}
