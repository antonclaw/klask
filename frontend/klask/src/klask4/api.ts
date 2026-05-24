import { createStateClient } from '../shared/api';
import { AUTH_TOKEN_KEY, LEGACY_AUTH_TOKEN_KEYS } from '../shared/auth';

export const klask4Api = createStateClient({
  path: '/klask4/state',
  tokenKey: AUTH_TOKEN_KEY,
  legacyTokenKeys: LEGACY_AUTH_TOKEN_KEYS,
});

export const { clearToken, hasToken, login, loadState, saveState } = klask4Api;
