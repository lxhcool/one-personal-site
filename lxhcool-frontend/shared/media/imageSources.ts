export type ThumbnailOptions = {
  width: 96 | 160 | 240 | 320 | 480 | 720 | 960 | 1280;
  height?: 96 | 160 | 240 | 320 | 480 | 720 | 960 | 1280;
  fit?: 'cover' | 'inside';
};

export function resolvePublicImageUrl(url: string, apiBaseUrl: string) {
  if (/^https?:\/\//i.test(url) || !url.startsWith('/') || url.startsWith('/images/')) return url;

  try {
    const apiUrl = new URL(apiBaseUrl);
    const apiPath = apiUrl.pathname.replace(/\/+$/, '');

    if (url.startsWith('/api/')) {
      return apiPath === '/api'
        ? `${apiUrl.origin}${url}`
        : `${apiBaseUrl}${url.slice('/api'.length)}`;
    }
  } catch {
    // Fall back to direct concatenation for non-absolute API bases.
  }

  return `${apiBaseUrl}${url}`;
}

export function createThumbnailUrl(url: string, apiBaseUrl: string, options: ThumbnailOptions) {
  const fullUrl = resolvePublicImageUrl(url, apiBaseUrl);

  try {
    const apiUrl = new URL(apiBaseUrl);
    const imageUrl = new URL(fullUrl, apiUrl);
    const match = imageUrl.pathname.match(/^\/(?:api\/)?uploads\/images\/([^/]+)$/);
    const localAliases = new Set(['localhost', '127.0.0.1', '::1']);
    const sameBackend = imageUrl.origin === apiUrl.origin
      || (localAliases.has(imageUrl.hostname) && localAliases.has(apiUrl.hostname) && imageUrl.port === apiUrl.port);
    if (!sameBackend || !match) return fullUrl;

    const params = new URLSearchParams({
      width: String(options.width),
      fit: options.fit ?? 'inside',
    });
    if (options.height) params.set('height', String(options.height));

    return `${apiBaseUrl}/public/media/images/${encodeURIComponent(match[1])}/thumbnail?${params.toString()}`;
  } catch {
    return fullUrl;
  }
}
