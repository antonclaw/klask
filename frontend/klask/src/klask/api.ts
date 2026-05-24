import { createStateClient } from '../shared/api';
import { AUTH_TOKEN_KEY, LEGACY_AUTH_TOKEN_KEYS } from '../shared/auth';

export const klaskApi = createStateClient({
  path: '/state',
  tokenKey: AUTH_TOKEN_KEY,
  legacyTokenKeys: LEGACY_AUTH_TOKEN_KEYS,
  credentials: 'include',
});

export const { clearToken, hasToken, login, loadState, saveState } = klaskApi;
