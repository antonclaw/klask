import { useCallback, useEffect, useState } from 'react';
import { clearToken, hasToken, loadState, login } from '../api.js';
import { loadStateFromData } from '../game-logic.js';

export default function useKlask4Session(resolveScreen) {
  const [screen, setScreen] = useState('loading');
  const [players, setPlayers] = useState([]);
  const [games, setGames] = useState([]);
  const [activeGame, setActiveGame] = useState(null);
  const [extraFields, setExtraFields] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const applyLoadedState = useCallback((data) => {
    const state = loadStateFromData(data);
    setPlayers(state.players);
    setGames(state.games);
    setActiveGame(state.activeGame);
    setExtraFields(state.extraFields || {});
    setScreen(resolveScreen(state));
    return state;
  }, [resolveScreen]);

  const loadSession = useCallback(async () => {
    try {
      const data = await loadState();
      return applyLoadedState(data);
    } catch (err) {
      if (err.message === 'Unauthorized') {
        setScreen('login');
      } else {
        setError(err.message);
        setScreen('login');
      }
      return null;
    }
  }, [applyLoadedState]);

  useEffect(() => {
    if (!hasToken()) {
      setScreen('login');
      return;
    }
    loadSession();
  }, [loadSession]);

  const handleLogin = useCallback(async (username, password) => {
    await login(username, password);
    const data = await loadState();
    return applyLoadedState(data);
  }, [applyLoadedState]);

  const handleLogout = useCallback(() => {
    clearToken();
    setPlayers([]);
    setGames([]);
    setActiveGame(null);
    setExtraFields({});
    setScreen('login');
  }, []);

  return {
    screen,
    setScreen,
    players,
    setPlayers,
    games,
    setGames,
    activeGame,
    setActiveGame,
    extraFields,
    setExtraFields,
    error,
    setError,
    saving,
    setSaving,
    loadSession,
    handleLogin,
    handleLogout,
  };
}
