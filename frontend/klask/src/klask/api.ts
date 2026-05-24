const TOKEN_KEY = 'klask_auth_token';
const API_URL = import.meta.env.VITE_API_URL || (location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api');

function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setToken(token: string) { localStorage.setItem(TOKEN_KEY, token); }
export function clearToken() { localStorage.removeItem(TOKEN_KEY); }
export function hasToken() { return !!getToken(); }
function authHeaders() { const token = getToken(); return token ? { Authorization: `Bearer ${token}` } : {}; }

export async function login(username: string, password: string) {
  const res = await fetch(`${API_URL}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
  if (!res.ok) throw new Error('Invalid credentials');
  const { token } = await res.json();
  setToken(token);
}
export async function loadState() {
  const res = await fetch(`${API_URL}/state`, { headers: authHeaders(), credentials: 'include' });
  if (res.status === 401) { clearToken(); throw new Error('Unauthorized'); }
  if (!res.ok) throw new Error('Failed to load state');
  return res.json();
}
export async function saveState(state: unknown, cause: string) {
  const res = await fetch(`${API_URL}/state`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ ...(state as object), cause }) });
  if (res.status === 401) { clearToken(); throw new Error('Unauthorized'); }
  if (!res.ok) throw new Error('Failed to save state');
  return res.json();
}
