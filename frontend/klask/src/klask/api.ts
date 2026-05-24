import { createStateClient } from '../shared/api';

export const klaskApi = createStateClient({
  path: '/state',
  tokenKey: 'klask_auth_token',
  credentials: 'include',
});

export const { clearToken, hasToken, login, loadState, saveState } = klaskApi;
