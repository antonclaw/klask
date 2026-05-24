const API_URL = import.meta.env.VITE_API_URL || (location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api');

type CreateStateClientOptions = {
  path: string;
  tokenKey: string;
  credentials?: RequestCredentials;
};

export function createStateClient({ path, tokenKey, credentials }: CreateStateClientOptions) {
  const getToken = () => localStorage.getItem(tokenKey);
  const setToken = (token: string) => localStorage.setItem(tokenKey, token);
  const clearToken = () => localStorage.removeItem(tokenKey);
  const hasToken = () => !!getToken();
  const authHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  async function login(username: string, password: string) {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error('Invalid credentials');
    const { token } = await res.json();
    setToken(token);
    return token as string;
  }

  async function loadState<T = unknown>() {
    const res = await fetch(`${API_URL}${path}`, { headers: authHeaders(), credentials });
    if (res.status === 401) {
      clearToken();
      throw new Error('Unauthorized');
    }
    if (!res.ok) throw new Error('Failed to load state');
    return res.json() as Promise<T>;
  }

  async function saveState<T>(state: T, cause: string) {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      credentials,
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ ...(state as object), cause }),
    });
    if (res.status === 401) {
      clearToken();
      throw new Error('Unauthorized');
    }
    if (!res.ok) throw new Error('Failed to save state');
    return res.json();
  }

  return { clearToken, hasToken, login, loadState, saveState };
}
