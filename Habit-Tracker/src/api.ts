/**
 * Minimal authenticated fetch wrapper for the Django JWT backend.
 *
 * - Stores access/refresh tokens in localStorage (simplejwt pairs).
 * - Attaches `Authorization: Bearer <access>` to every request.
 * - On a 401, attempts one silent refresh via /api/auth/token/refresh/ and
 *   retries the original request once. If that fails, clears the session.
 */

const ACCESS_KEY = 'habitpulse_access_token';
const REFRESH_KEY = 'habitpulse_refresh_token';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
}

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function saveTokens(access: string, refresh: string): void {
  try {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  } catch {
    /* storage unavailable - session lives for this page only */
  }
}

export function clearTokens(): void {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    /* noop */
  }
}

export function hasSession(): boolean {
  return getAccessToken() !== null;
}

async function refreshTokens(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch('/api/auth/token/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data.access) return false;
    try {
      localStorage.setItem(ACCESS_KEY, data.access);
    } catch {
      /* noop */
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Drop-in replacement for window.fetch that adds JWT auth headers and
 * transparently retries once after a token refresh.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  retry = true
): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(input, { ...init, headers });

  if (res.status === 401 && retry && getRefreshToken()) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      return apiFetch(input, init, false);
    }
    clearTokens();
    // Notify the app that the session has expired.
    window.dispatchEvent(new Event('habitpulse_session_expired'));
  }
  return res;
}

/** POST credentials, persist tokens, and return the user profile. */
export async function login(
  identifier: string,
  password: string
): Promise<AuthUser> {
  const res = await fetch('/api/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: identifier, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access) {
    throw new Error(
      data.detail || data.non_field_errors?.[0] || 'Login failed. Check your credentials.'
    );
  }
  saveTokens(data.access, data.refresh);
  return data.user as AuthUser;
}

/** Create an account, persist tokens, and return the user profile. */
export async function register(
  username: string,
  email: string,
  password: string
): Promise<AuthUser> {
  const res = await fetch('/api/auth/register/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access) {
    const firstError = data.username?.[0] || data.email?.[0] || data.password?.[0];
    throw new Error(firstError || data.detail || 'Registration failed.');
  }
  saveTokens(data.access, data.refresh);
  return data.user as AuthUser;
}

/** Validate the stored access token and return the user, or null. */
export async function fetchMe(): Promise<AuthUser | null> {
  if (!hasSession()) return null;
  try {
    const res = await apiFetch('/api/auth/me/');
    if (!res.ok) return null;
    const data = await res.json();
    return data as AuthUser;
  } catch {
    return null;
  }
}

/** Log out locally (SimpleJWT stateless tokens simply expire server-side). */
export function logout(): void {
  clearTokens();
}
