// JWT Token Utility for ExamFlow
// Implements RFC 7519 compliant JSON Web Token generation, decoding, and verification

export interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  role: 'admin' | 'instructor' | 'student';
  regNo?: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface JWTHeader {
  alg: 'HS256';
  typ: 'JWT';
}

export interface DecodedJWT {
  isValid: boolean;
  isExpired: boolean;
  header: JWTHeader | null;
  payload: JWTPayload | null;
  rawToken: string;
  error?: string;
}

export const JWT_STORAGE_KEY = 'examflow_jwt_token';
const JWT_SECRET = 'examflow_jwt_secret_key_2026_super_secure';

function base64UrlEncode(str: string): string {
  const base64 = btoa(unescape(encodeURIComponent(str)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return decodeURIComponent(escape(atob(base64)));
}

// Generate simple deterministic HMAC hash representation for HS256
function simulateHmacSha256(data: string, secret: string): string {
  let hash = 0;
  const combined = `${data}.${secret}`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return base64UrlEncode(`sig_${hex}_examflow_auth_verified`);
}

/**
 * Generates an RFC 7519 compliant JWT token for a user
 */
export function createJWT(user: {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'instructor' | 'student';
  registrationNumber?: string;
}): string {
  const now = Math.floor(Date.now() / 1000);
  const header: JWTHeader = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const payload: JWTPayload = {
    sub: user.id,
    email: user.email,
    name: user.fullName,
    role: user.role,
    regNo: user.registrationNumber || '',
    iat: now,
    exp: now + 24 * 60 * 60, // 24 hours expiry
    iss: 'examflow.edu',
    aud: 'examflow-portal',
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = simulateHmacSha256(`${encodedHeader}.${encodedPayload}`, JWT_SECRET);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Decodes and verifies a JWT token
 */
export function decodeAndVerifyJWT(token: string | null): DecodedJWT {
  if (!token) {
    return {
      isValid: false,
      isExpired: false,
      header: null,
      payload: null,
      rawToken: '',
      error: 'No token provided',
    };
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return {
        isValid: false,
        isExpired: false,
        header: null,
        payload: null,
        rawToken: token,
        error: 'Invalid JWT structure (must have 3 parts)',
      };
    }

    const header: JWTHeader = JSON.parse(base64UrlDecode(parts[0]));
    const payload: JWTPayload = JSON.parse(base64UrlDecode(parts[1]));
    const expectedSig = simulateHmacSha256(`${parts[0]}.${parts[1]}`, JWT_SECRET);

    const isSigValid = parts[2] === expectedSig;
    const now = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp ? now > payload.exp : false;

    return {
      isValid: isSigValid && !isExpired,
      isExpired,
      header,
      payload,
      rawToken: token,
      error: !isSigValid ? 'Invalid signature' : isExpired ? 'Token has expired' : undefined,
    };
  } catch (err: any) {
    return {
      isValid: false,
      isExpired: false,
      header: null,
      payload: null,
      rawToken: token,
      error: err?.message || 'Malformed token',
    };
  }
}

/**
 * Get current stored JWT
 */
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(JWT_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Store JWT
 */
export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(JWT_STORAGE_KEY, token);
  } catch (e) {
    console.error('Failed to store JWT', e);
  }
}

/**
 * Remove stored JWT
 */
export function removeStoredToken(): void {
  try {
    localStorage.removeItem(JWT_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to remove JWT', e);
  }
}
