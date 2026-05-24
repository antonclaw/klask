import { createStateClient } from '../shared/api';

export const klask4Api = createStateClient({
  path: '/klask4/state',
  tokenKey: 'klask4_token',
});

export const { clearToken, hasToken, login, loadState, saveState } = klask4Api;
