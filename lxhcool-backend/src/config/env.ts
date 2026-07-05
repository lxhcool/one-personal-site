const INVALID_SECRET_VALUES = new Set(['change-me', 'dev-only-change-me']);

export function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required backend environment variable: ${name}`);
  }
  return value;
}

export function requireJwtSecret() {
  const secret = requireEnv('JWT_SECRET');
  if (INVALID_SECRET_VALUES.has(secret) || secret.length < 32) {
    throw new Error('JWT_SECRET must be a strong secret with at least 32 characters');
  }
  return secret;
}

export function requirePort() {
  const raw = requireEnv('PORT');
  const port = Number(raw);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('PORT must be a valid TCP port');
  }
  return port;
}
