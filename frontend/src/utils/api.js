/**
 * api.js — thin fetch wrapper that:
 *   - prefixes every request with /api
 *   - attaches the JWT access token
 *   - transparently refreshes the token on 401 and retries once
 *   - on unrecoverable 401 clears tokens and redirects to /
 */

import { API_BASE_URL } from '../config.js';

const BASE = `${API_BASE_URL}/api`;

// ── token helpers ────────────────────────────────────────────────
export function getToken()        { return localStorage.getItem('access_token'); }
export function getRefreshToken() { return localStorage.getItem('refresh_token'); }

export function setTokens(access, refresh) {
  localStorage.setItem('access_token', access);
  if (refresh) localStorage.setItem('refresh_token', refresh);
}

export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

// ── token refresh ────────────────────────────────────────────────
async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error('No refresh token');

  const res = await fetch(`${BASE}/auth/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    clearTokens();
    throw new Error('Token refresh failed');
  }

  const data = await res.json();
  setTokens(data.access, data.refresh);
  return data.access;
}

// ── core request ─────────────────────────────────────────────────
async function request(path, options = {}, retry = true) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  // Attempt a single token refresh on 401
  if (res.status === 401 && retry) {
    // Only try refresh if we actually have a refresh token stored.
    // Without one this is a genuine credential error (wrong password, etc.)
    // — throw the response body directly so callers get the real message.
    if (!getRefreshToken()) {
      throw body ?? { detail: `HTTP ${res.status}` };
    }
    try {
      const newToken = await refreshAccessToken();
      return request(path, {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${newToken}` },
      }, false);
    } catch {
      clearTokens();
      window.dispatchEvent(new CustomEvent('algomind:auth-expired'));
      throw new Error('Session expired. Please log in again.');
    }
  }

  if (res.status === 204) return null;

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    // Throw the parsed error body so callers can read field-level errors
    throw body ?? { detail: `HTTP ${res.status}` };
  }

  return body;
}

// ── multipart form upload (for avatar etc.) ──────────────────────
async function requestForm(path, formData, method = 'PATCH') {
  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // Do NOT set Content-Type — let the browser set the boundary for multipart
  const res = await fetch(`${BASE}${path}`, { method, headers, body: formData });
  if (res.status === 204) return null;
  const body = await res.json().catch(() => null);
  if (!res.ok) throw body ?? { detail: `HTTP ${res.status}` };
  return body;
}

// ── public API ───────────────────────────────────────────────────
const api = {
  get:       (path)            => request(path),
  post:      (path, body)      => request(path, { method: 'POST',  body: JSON.stringify(body) }),
  put:       (path, body)      => request(path, { method: 'PUT',   body: JSON.stringify(body) }),
  patch:     (path, body)      => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete:    (path)            => request(path, { method: 'DELETE' }),
  patchForm: (path, formData)  => requestForm(path, formData, 'PATCH'),
  // expose token helpers so AuthContext can use them
  getToken,
  getRefreshToken,
  setTokens,
  clearTokens,
};

export default api;
