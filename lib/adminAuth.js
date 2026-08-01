export const ADMIN_SESSION_COOKIE = 'clinsaude_admin_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET não configurado no ambiente.');
  }
  return secret;
}

async function getSigningKey() {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex) {
  const bytes = hex.match(/.{1,2}/g) || [];
  return Uint8Array.from(bytes.map((b) => parseInt(b, 16)));
}

export async function createAdminSessionToken() {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = String(expiresAt);
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return `${payload}.${toHex(signature)}`;
}

export async function isValidAdminSessionToken(token) {
  if (!token) return false;
  const [payload, signatureHex] = token.split('.');
  if (!payload || !signatureHex) return false;
  if (!Number.isFinite(Number(payload)) || Number(payload) <= Date.now()) return false;

  const key = await getSigningKey();
  return crypto.subtle.verify('HMAC', key, fromHex(signatureHex), new TextEncoder().encode(payload));
}

export function checkAdminPassword(password) {
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected) && password === expected;
}
