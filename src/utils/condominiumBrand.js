function getApiOrigin() {
  const baseUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
  return String(baseUrl).replace(/\/api\/?$/, "");
}

export function buildStorageUrl(path) {
  if (!path) return null;
  if (/^(https?:\/\/|data:image)/i.test(path)) return path;
  return `${getApiOrigin()}/storage/${String(path).replace(/^\/+/, "")}`;
}

function appendVersion(url, condominium) {
  if (!url) return url;

  const stamp = condominium?.updated_at || condominium?.updatedAt || null;
  if (!stamp) return url;

  const normalized = Number.isNaN(Date.parse(stamp)) ? String(stamp) : String(Date.parse(stamp));
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${encodeURIComponent(normalized)}`;
}

export function resolveCondominiumLogo(condominium) {
  if (!condominium) return null;

  // Prefer logo_path because it is stable against APP_URL misconfiguration.
  const fromPath = buildStorageUrl(condominium.logo_path);
  const fromUrl = buildStorageUrl(condominium.logo_url || condominium.image_url || null);
  const resolved = fromPath || fromUrl;

  return appendVersion(resolved, condominium);
}
