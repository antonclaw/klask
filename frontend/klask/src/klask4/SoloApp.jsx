import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { addPlayer, buildStateForSave, loadStateFromData } from './game-logic.js';
import { clearToken, hasToken, loadState, login, saveState } from './api.js';
import LoginScreen from './components/LoginScreen.jsx';
import {
  calculateTotals,
  createSoloGame,
  createSoloModeState,
  submitSoloRound,
} from './solo-logic.js';

function getModeHref(pathname, mode) {
  if (pathname.includes('/frontend/klask/dist/') || pathname.endsWith('/klask-4.html') || pathname.endsWith('/klask-4-solo.html')) {
    if (mode === 'klask') return './index.html?from=klask4';
    if (mode === 'team') return './klask-4.html';
    return './klask-4-solo.html';
  }

  if (mode === 'klask') return '/?from=klask4';
  if (mode === 'team') return '/klask-4';
  return '/klask-4-solo';
}

export default function SoloApp() {
  const [screen, setScreen] = useState('loading');
  const [players, setPlayers] = useState([]);
  const [teamGames, setTeamGames] = useState([]);
  const [teamActiveGame, setTeamActiveGame] = useState(null);
  const [extraFields, setExtraFields] = useState({});
  const [soloMode, setSoloMode] = useState(createSoloModeState());
  const [selectedPlayers, setSelectedPlayers] = useState(new Set());
  const [draftScores, setDraftScores] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const persist = useCallback(async (nextPlayers, nextSoloMode, cause) => {
    setSaving(true);
    try {
      const nextExtra = { ...extraFields, soloMode: nextSoloMode };
      const state = buildStateForSave(nextPlayers, teamGames, teamActiveGame, nextExtra);
      await saveState(state, cause);
      setExtraFields(nextExtra);
      setSoloMode(nextSoloMode);
    } catch (err) {
      setError(err.message);
      if (err.message === 'Unauthorized') {
        setScreen('login');
      }
    } finally {
      setSaving(false);
    }
  }, [extraFields, teamActiveGame, teamGames]);

  useEffect(() => {
    if (!hasToken()) {
      setScreen('login');
      return;
    }

    loadState()
      .then((data) => {
        const state = loadStateFromData(data);
        setPlayers(state.players);
        setTeamGames(state.games);
        setTeamActiveGame(state.activeGame);
        setExtraFields(state.extraFields || {});

        const loadedSoloMode = createSoloModeState(state.extraFields?.soloMode);
        setSoloMode(loadedSoloMode);

        if (loadedSoloMode.activeGame && !loadedSoloMode.activeGame.completed) {
          setScreen('round');
        } else {
          setScreen('main');
        }
      })
      .catch((err) => {
        if (err.message === 'Unauthorized') {
          setScreen('login');
        } else {
          setError(err.message);
          setScreen('login');
        }
      });
  }, []);

  async function handleLogin(username, password) {
    await login(username, password);
    const data = await loadState();
    const state = loadStateFromData(data);
    setPlayers(state.players);
    setTeamGames(state.games);
    setTeamActiveGame(state.activeGame);
    setExtraFields(state.extraFields || {});

    const loadedSoloMode = createSoloModeState(state.extraFields?.soloMode);
    setSoloMode(loadedSoloMode);
    setScreen(loadedSoloMode.activeGame && !loadedSoloMode.activeGame.completed ? 'round' : 'main');
  }

  function handleLogout() {
    clearToken();
    setScreen('login');
  }

  async function handleAddPlayer(name) {
    const { newPlayers } = addPlayer(players, name);
    setPlayers(newPlayers);
    await persist(newPlayers, soloMode, `Add player: ${name}`);
  }

  function handleStartSetup() {
    const initial = soloMode.activeGame?.playerIds || players.slice(0, 4).map((p) => p.id);
    setSelectedPlayers(new Set(initial));
    setScreen('setup');
  }

  async function handleStartGame() {
    const ids = [...selectedPlayers];
    const newActive = createSoloGame(ids);
    const nextSoloMode = { ...soloMode, activeGame: newActive };
    setDraftScores({});
    await persist(players, nextSoloMode, 'Start new solo game');
    setScreen('round');
  }

  function togglePlayer(id) {
    const next = new Set(selectedPlayers);
    if (next.has(id)) {
      next.delete(id);
    } else if (next.size < 4) {
      next.add(id);
    }
    setSelectedPlayers(next);
  }

  function setScore(playerId, value) {
    setDraftScores((prev) => ({ ...prev, [playerId]: value }));
  }

  async function submitRound() {
    const active = soloMode.activeGame;
    if (!active) return;

    const roundScores = {};
    for (const id of active.playerIds) {
      if (!Number.isInteger(draftScores[id])) {
        setError('Select score (0-5) for every player');
        return;
      }
      roundScores[id] = draftScores[id];
    }

    const updated = submitSoloRound(active, roundScores);
    const nextSoloMode = { ...soloMode, activeGame: updated };
    setDraftScores({});
    await persist(players, nextSoloMode, `Submit solo round ${active.currentRound + 1}`);
    setScreen(updated.completed ? 'summary' : 'round');
  }

  async function finishGame() {
    const active = soloMode.activeGame;
    if (!active) return;

    const completed = {
      date: new Date().toISOString(),
      playerIds: [...active.playerIds],
      rounds: active.rounds.map((r) => ({ scores: { ...r.scores } })),
    };

    const nextSoloMode = {
      games: [...soloMode.games, completed],
      activeGame: null,
    };

    await persist(players, nextSoloMode, 'Complete solo game');
    setScreen('main');
  }

  const playerMap = useMemo(() => new Map(players.map((p) => [p.id, p.name])), [players]);
  const activeGame = soloMode.activeGame;
  const totals = activeGame ? calculateTotals(activeGame) : new Map();

  if (screen === 'loading') {
    return <div className="loading-screen"><div className="loading-text">Loading...</div></div>;
  }

  if (screen === 'login') {
    return (
      <>
        <a className="switch-app-btn switch-app-btn-top-left" href={getModeHref(window.location.pathname, 'klask')}>Klask</a>
        <a className="switch-app-btn switch-app-btn-top-right" href={getModeHref(window.location.pathname, 'team')}>Team Mode</a>
        <LoginScreen onLogin={handleLogin} />
      </>
    );
  }

  return (
    <div className="app-container">
      <a className="switch-app-btn switch-app-btn-top-left" href={getModeHref(window.location.pathname, 'klask')}>Klask</a>
      <a className="switch-app-btn switch-app-btn-top-right" href={getModeHref(window.location.pathname, 'team')}>Team Mode</a>

      {saving && <div className="saving-indicator">Saving...</div>}
      {error && (
        <div className="error-banner">
          {error}
          <button className="btn-dismiss" onClick={() => setError(null)}>x</button>
        </div>
      )}

      {screen === 'main' && (
        <div className="main-screen">
          <div className="top-bar">
            <h1>Klask-4 Solo</h1>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </div>

          <section>
            <div className="section-header">
              <h2>Players ({players.length})</h2>
            </div>
            <div className="add-player-form" style={{ display: 'flex', gap: 8 }}>
              <input id="soloPlayerName" type="text" placeholder="Player name" />
              <button onClick={() => {
                const input = document.getElementById('soloPlayerName');
                const value = input.value.trim();
                if (!value) return;
                handleAddPlayer(value);
                input.value = '';
              }}>Add</button>
            </div>
            <div className="player-chips">
              {players.map((p) => <span className="player-chip" key={p.id}>{p.name}</span>)}
            </div>
          </section>

          <section>
            <button className="btn-start-game" disabled={players.length < 4} onClick={handleStartSetup}>Start Solo Game</button>
          </section>

          <section>
            <h2>Solo Game History</h2>
            {soloMode.games.length === 0 ? (
              <p className="empty-text">No completed solo games yet.</p>
            ) : (
              <div className="history-list">
                {[...soloMode.games].reverse().map((game, idx) => {
                  const gameTotals = calculateTotals(game);
                  const ranking = game.playerIds
                    .map((id) => ({ id, name: playerMap.get(id) || `#${id}`, points: gameTotals.get(id) || 0 }))
                    .sort((a, b) => a.points - b.points);

                  return (
                    <div className="history-item" key={idx}>
                      <div className="history-header">
                        <span className="history-date">{new Date(game.date).toLocaleString()}</span>
                        <span>{ranking[0].name} won ({ranking[0].points} pts)</span>
                      </div>
                      <div className="history-rounds">
                        {ranking.map((r) => <div key={r.id}>{r.name}: {r.points}</div>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {screen === 'setup' && (
        <div className="game-setup">
          <h2>Select 4 Players</h2>
          <p className="setup-hint">{selectedPlayers.size}/4 selected</p>
          <div className="toggle-grid">
            {players.map((p) => (
              <button key={p.id} className={`toggle-btn${selectedPlayers.has(p.id) ? ' active' : ''}`} onClick={() => togglePlayer(p.id)}>{p.name}</button>
            ))}
          </div>
          <div className="button-row">
            <button className="btn-secondary" onClick={() => setScreen('main')}>Cancel</button>
            <button disabled={selectedPlayers.size !== 4} onClick={handleStartGame}>Start</button>
          </div>
        </div>
      )}

      {screen === 'round' && activeGame && (
        <div className="round-screen">
          <h2>Solo Round {activeGame.currentRound + 1} of 3</h2>
          <p className="setup-hint">Choose score 0-5 for each player (lower is better).</p>

          <div className="solo-score-grid">
            {activeGame.playerIds.map((id) => (
              <div className="solo-score-row" key={id}>
                <div className="solo-player-name">{playerMap.get(id) || `#${id}`}</div>
                <div className="score-row">
                  {Array.from({ length: 6 }, (_, value) => (
                    <button
                      key={value}
                      className={`score-circle${draftScores[id] === value ? ' active' : ''}`}
                      onClick={() => setScore(id, value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button className="btn-submit" onClick={submitRound}>Submit Round</button>
        </div>
      )}

      {screen === 'summary' && activeGame && (
        <div className="game-end">
          <h2>Solo Game Summary</h2>
          <div className="final-standings">
            {activeGame.playerIds
              .map((id) => ({ id, name: playerMap.get(id) || `#${id}`, points: totals.get(id) || 0 }))
              .sort((a, b) => a.points - b.points)
              .map((row, idx) => (
                <div className={`final-row${idx === 0 ? ' highlight' : ''}`} key={row.id}>
                  <span className="rank">#{idx + 1}</span>
                  <span className="name">{row.name}</span>
                  <span className="stat">{row.points} pts</span>
                </div>
              ))}
          </div>

          <h3>Round Details</h3>
          {activeGame.rounds.map((round, idx) => (
            <div className="round-detail" key={idx}>
              <span className="round-label">R{idx + 1}:</span>
              <span>{activeGame.playerIds.map((id) => `${playerMap.get(id) || `#${id}`}: ${round.scores[id]}`).join(' | ')}</span>
            </div>
          ))}

          <button className="btn-primary" onClick={finishGame}>Back to Main</button>
        </div>
      )}
    </div>
  );
}
