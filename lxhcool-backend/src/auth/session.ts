import { createHmac, timingSafeEqual } from 'node:crypto';
import { requireJwtSecret } from '../config/env';

export type SessionPayload = {
  sub: string;
  email: string;
  exp: number;
};

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function getSecret() {
  return requireJwtSecret();
}

export function signSession(payload: SessionPayload) {
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac('sha256', getSecret()).update(body).digest('base64url');
  return `${body}.${signature}`;
}

export function verifySession(token?: string): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  const expected = createHmac('sha256', getSecret()).update(body).digest('base64url');
  if (signature.length !== expected.length) return null;
  const isValid = timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!isValid) return null;

  const payload = JSON.parse(base64UrlDecode(body)) as SessionPayload;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}
