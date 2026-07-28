export function readString(
  raw: Record<string, unknown>,
  key: string,
  fallback = '',
) {
  const value = raw[key];
  return typeof value === 'string' ? value : fallback;
}

export function readBoolean(
  raw: Record<string, unknown>,
  key: string,
  fallback = false,
) {
  const value = raw[key];
  return typeof value === 'boolean' ? value : fallback;
}

export function readNumber(
  raw: Record<string, unknown>,
  key: string,
  fallback = 0,
) {
  const value = raw[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function readArray<T>(
  raw: Record<string, unknown>,
  key: string,
  fallback: T[] = [],
) {
  const value = raw[key];
  return Array.isArray(value) ? (value as T[]) : fallback;
}
