export function getRequiredPublicRuntimeConfig() {
  const config = useRuntimeConfig();
  const apiBaseUrl = config.public.apiBaseUrl;
  const siteUrl = config.public.siteUrl;
  const adminUrl = config.public.adminUrl;

  if (!apiBaseUrl) {
    throw new Error('Missing required env: NUXT_PUBLIC_API_BASE_URL');
  }

  if (!siteUrl) {
    throw new Error('Missing required env: NUXT_PUBLIC_SITE_URL');
  }

  return {
    apiBaseUrl: resolveLocalUrl(String(apiBaseUrl)),
    siteUrl: String(siteUrl).replace(/\/+$/, ''),
    adminUrl: resolveLocalUrl(String(adminUrl || 'http://127.0.0.1:5173')),
  };
}

function resolveLocalUrl(value: string) {
  const normalized = value.replace(/\/+$/, '');

  if (import.meta.server) return normalized;

  try {
    const url = new URL(normalized);
    const pageHost = window.location.hostname;
    const isLocalTarget = url.hostname === '127.0.0.1' || url.hostname === 'localhost';
    const isLocalPage = pageHost === '127.0.0.1' || pageHost === 'localhost';

    if (isLocalTarget && isLocalPage && url.hostname !== pageHost) {
      url.hostname = pageHost;
      return url.toString().replace(/\/+$/, '');
    }
  } catch {
    return normalized;
  }

  return normalized;
}
