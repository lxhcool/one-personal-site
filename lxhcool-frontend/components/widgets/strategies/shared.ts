import { readArray, readBoolean, readNumber, readString } from '~/shared/widgets/lib/config';

export function resolveAssetUrl(url?: string | null, apiBaseUrl?: string) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (!url.startsWith('/')) return url;
  return `${apiBaseUrl ?? ''}${url}`;
}

export function readConfigString(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return typeof value === 'string' ? value : '';
}

export function readObject(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export { readArray, readBoolean, readNumber, readString };
