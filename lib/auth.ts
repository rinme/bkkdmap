import { cookies } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'bkk_admin_token';
const DEFAULT_SECRET = 'bangkok-50-districts-super-secure-jwt-key-2026';
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

function getSecretKey(): string {
  return process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || DEFAULT_SECRET;
}

export function getExpectedPassword(): string {
  return process.env.ADMIN_PASSWORD || 'bkk2026';
}

export function verifyAdminPassword(password: string): boolean {
  const expected = getExpectedPassword();
  return typeof password === 'string' && password === expected;
}

// Minimal zero-dependency Web Crypto HMAC-SHA256 Token
async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

export async function createAdminSessionToken(): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    role: 'admin',
    iss: 'bangkok-district-tracker',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + TOKEN_MAX_AGE
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;

  const key = await getCryptoKey(getSecretKey());
  const enc = new TextEncoder();
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data));

  // Convert signature buffer to base64url
  const sigArray = Array.from(new Uint8Array(signature));
  const sigStr = String.fromCharCode(...sigArray);
  const sigB64 = base64UrlEncode(sigStr);

  return `${data}.${sigB64}`;
}

export async function verifyAdminSessionToken(token: string | undefined): Promise<boolean> {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [headerB64, payloadB64, sigB64] = parts;
  const data = `${headerB64}.${payloadB64}`;

  try {
    const payloadJson = JSON.parse(base64UrlDecode(payloadB64));
    if (payloadJson.role !== 'admin') return false;
    if (payloadJson.exp && payloadJson.exp < Math.floor(Date.now() / 1000)) {
      return false; // Expired
    }

    const key = await getCryptoKey(getSecretKey());
    const enc = new TextEncoder();
    const sigBinary = Uint8Array.from(base64UrlDecode(sigB64), (c) => c.charCodeAt(0));

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBinary,
      enc.encode(data)
    );

    return isValid;
  } catch (err) {
    return false;
  }
}

export async function isAuthenticatedAdmin(): Promise<boolean> {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminSessionToken(token);
}

export async function verifyAdminToken(req?: any): Promise<boolean> {
  try {
    if (req && typeof req.cookies?.get === 'function') {
      const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
      if (token) {
        return verifyAdminSessionToken(token);
      }
    }
  } catch {}
  return isAuthenticatedAdmin();
}

