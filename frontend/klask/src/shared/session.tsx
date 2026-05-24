import React from 'react';

type StateClient<TRawState> = {
  clearToken: () => void;
  hasToken: () => boolean;
  login: (username: string, password: string) => Promise<unknown>;
  loadState: () => Promise<TRawState>;
};

type UseStateSessionOptions<TRawState, TState, TScreen extends string> = {
  client: StateClient<TRawState>;
  deserialize: (raw: TRawState) => TState;
  resolveScreen: (state: TState) => TScreen;
  loginScreen: TScreen;
};

export function useStateSession<TRawState, TState extends Record<string, any>, TScreen extends string>({
  client,
  deserialize,
  resolveScreen,
  loginScreen,
}: UseStateSessionOptions<TRawState, TState, TScreen>) {
  const [screen, setScreen] = React.useState<TScreen | 'loading'>('loading');
  const [state, setState] = React.useState<TState | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const applyLoadedState = React.useCallback((raw: TRawState) => {
    const next = deserialize(raw);
    setState(next);
    setScreen(resolveScreen(next));
    return next;
  }, [deserialize, resolveScreen]);

  const loadSession = React.useCallback(async () => {
    try {
      return applyLoadedState(await client.loadState());
    } catch (err) {
      if (err instanceof Error && err.message !== 'Unauthorized') setError(err.message);
      setScreen(loginScreen);
      return null;
    }
  }, [applyLoadedState, client, loginScreen]);

  React.useEffect(() => {
    if (!client.hasToken()) {
      setScreen(loginScreen);
      return;
    }
    void loadSession();
  }, [client, loadSession, loginScreen]);

  const handleLogin = React.useCallback(async (username: string, password: string) => {
    await client.login(username, password);
    return applyLoadedState(await client.loadState());
  }, [applyLoadedState, client]);

  const handleLogout = React.useCallback(() => {
    client.clearToken();
    setState(null);
    setScreen(loginScreen);
  }, [client, loginScreen]);

  return { screen, setScreen, state, setState, error, setError, saving, setSaving, loadSession, handleLogin, handleLogout };
}
