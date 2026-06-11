// Tiny fetch wrapper that injects the JWT and surfaces server error messages.
const TOKEN_KEY = 'nouvel_token';

// Where the API lives. Defaults to a same-origin "/api" (Vite proxy in dev,
// Express static serve in prod). Set VITE_API_BASE to a deployed backend URL
// (e.g. https://nouvel.onrender.com/api) so every machine shares ONE database
// and journal entries persist the same on every computer.
const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}
