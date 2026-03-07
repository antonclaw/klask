import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { addPlayer, buildStateForSave } from './game-logic.js';
import { saveState } from './api.js';
import LoginScreen from './components/LoginScreen.jsx';
import GameSetup from './components/GameSetup.jsx';
import { AppShell, LoadingScreen, ModeSwitchButtons, useLegacyKlaskStyles } from './components/AppShared.jsx';
import useKlask4Session from './hooks/useKlask4Session.js';
import {
  calculateProjectedTotals,
  calculateSoloPlayerStats,
  calculateTotals,
  createSoloGame,
  createSoloModeState,
  submitSoloRound,
} from './solo-logic.js';

function resolveSoloScreen(state) {
  const loadedSoloMode = createSoloModeState(state.extraFields?.soloMode);
  return loadedSoloMode.activeGame && !loadedSoloMode.activeGame.completed ? 'round' : 'main';
}

export default function SoloApp() {
  useLegacyKlaskStyles();

  const {
    screen,
    setScreen,
    players,
    setPlayers,
    games,
    activeGame,
    extraFields,
    setExtraFields,
    error,
    setError,
    saving,
    setSaving,
    handleLogin,
    handleLogout,
  } = useKlask4Session(resolveSoloScreen);

  const [soloMode, setSoloMode] = useState(createSoloModeState());
  const [draftScores, setDraftScores] = useState({});

  useEffect(() => {
    setSoloMode(createSoloModeState(extraFields?.soloMode));
  }, [extraFields]);

  const persist = useCallback(async (nextPlayers, nextSoloMode, cause) => {
    setSaving(true);
    try {
      const nextExtra = { ...extraFields, soloMode: nextSoloMode };
      const state = buildStateForSave(nextPlayers, games, activeGame, nextExtra);
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
  }, [activeGame, extraFields, games, setError, setExtraFields, setSaving, setScreen]);

  const handleSoloLogin = useCallback(async (username, password) => {
    const state = await handleLogin(username, password);
    const loadedSoloMode = createSoloModeState(state?.extraFields?.soloMode);
    setSoloMode(loadedSoloMode);
    setScreen(loadedSoloMode.activeGame && !loadedSoloMode.activeGame.completed ? 'round' : 'main');
  }, [handleLogin, setScreen]);

  async function handleAddPlayer(name) {
    const { newPlayers } = addPlayer(players, name);
    setPlayers(newPlayers);
    await persist(newPlayers, soloMode, `Add player: ${name}`);
  }

  function handleStartSetup() {
    if (soloMode.activeGame && !soloMode.activeGame.completed) {
      if (!window.confirm('There is an active game in progress. Abandon it and start a new one?')) {
        return;
      }
    }
    setScreen('setup');
  }

  async function handleStartGame(playerIds) {
    const newActive = createSoloGame(playerIds);
    const nextSoloMode = { ...soloMode, activeGame: newActive };
    setDraftScores({});
    await persist(players, nextSoloMode, 'Start new solo game');
    setScreen('round');
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

  async function cancelSoloGame() {
    if (!window.confirm('Cancel the current game?')) return;
    const nextSoloMode = { ...soloMode, activeGame: null };
    setDraftScores({});
    await persist(players, nextSoloMode, 'Cancel solo game');
    setScreen('main');
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
  const currentSoloGame = soloMode.activeGame;
  const totals = currentSoloGame ? calculateTotals(currentSoloGame) : new Map();
  const projectedTotals = currentSoloGame ? calculateProjectedTotals(currentSoloGame, draftScores) : new Map();
  const hasFullDraft = currentSoloGame ? currentSoloGame.playerIds.every((id) => Number.isInteger(draftScores[id])) : false;
  const liveRanking = currentSoloGame
    ? currentSoloGame.playerIds
      .map((id) => ({ id, name: playerMap.get(id) || `#${id}`, points: (hasFullDraft ? projectedTotals : totals).get(id) || 0 }))
      .sort((a, b) => a.points - b.points)
    : [];
  const playerStats = useMemo(() => calculateSoloPlayerStats(players, soloMode.games), [players, soloMode.games]);

  if (screen === 'loading') {
    return <LoadingScreen />;
  }

  if (screen === 'login') {
    return (
      <>
        <ModeSwitchButtons rightMode="team" rightLabel="Team Mode" />
        <LoginScreen title="🎮 Klask 4 Solo" onLogin={handleSoloLogin} />
      </>
    );
  }

  return (
    <AppShell
      rightMode="team"
      rightLabel="Team Mode"
      showModeSwitch={screen !== 'setup'}
      saving={saving}
      error={error}
      onDismissError={() => setError(null)}
    >
      {screen === 'main' && (
        <div className="main-screen">
          <button
            className="icon-btn logout-btn circular-btn"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
          >
            ⎋
          </button>

          <div className="top-bar">
            <h1>🎮 Klask 4 Solo</h1>
          </div>

          <div className="start-game-section">
            <button className="btn-start-game" disabled={players.length < 4} onClick={handleStartSetup}>Start Solo Game</button>
            {players.length < 4 && (
              <p className="hint-text">Add at least 4 players to start a game</p>
            )}
          </div>

          <section>
            <h2>Solo Player Stats</h2>
            {soloMode.games.length === 0 ? (
              <p className="empty-text">No completed solo games yet.</p>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Player</th>
                      <th>Games</th>
                      <th>Wins</th>
                      <th>Avg Pts</th>
                      <th>Best</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerStats.map((row, idx) => (
                      <tr key={row.playerId}>
                        <td>{idx + 1}</td>
                        <td>{row.name}</td>
                        <td>{row.gamesPlayed}</td>
                        <td>{row.wins}</td>
                        <td>{row.avgPoints ?? '—'}</td>
                        <td>{row.bestGamePoints ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
        <GameSetup
          players={players}
          onStartGame={handleStartGame}
          onAddPlayer={handleAddPlayer}
          onCancel={() => setScreen('main')}
        />
      )}

      {screen === 'round' && currentSoloGame && (
        <div className="round-screen">
          <h2>Solo Round {currentSoloGame.currentRound + 1} of 3</h2>
          <p className="setup-hint">Choose score 0-5 for each player (lower is better).</p>

          <div className="solo-score-grid">
            {currentSoloGame.playerIds.map((id) => (
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
          <button onClick={cancelSoloGame} className="btn-cancel">Cancel Game</button>

          <div className="solo-live-stats">
            <h3>Current Standings {hasFullDraft ? '(with selected round)' : '(submitted rounds only)'}</h3>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {liveRanking.map((row, idx) => (
                    <tr key={row.id}>
                      <td>{idx + 1}</td>
                      <td>{row.name}</td>
                      <td>{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {screen === 'summary' && currentSoloGame && (
        <div className="game-end">
          <h2>Game Complete!</h2>
          <div className="trophy-section">
            <div className="trophy">&#127942;</div>
            <div className="winner-names">
              {currentSoloGame.playerIds
                .map((id) => ({ id, name: playerMap.get(id) || `#${id}`, points: totals.get(id) || 0 }))
                .sort((a, b) => a.points - b.points)[0]?.name}
            </div>
            <div className="winner-subtitle">Least points wins</div>
          </div>

          <h3>Final Standings</h3>
          <div className="final-standings">
            {currentSoloGame.playerIds
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
          {currentSoloGame.rounds.map((round, idx) => (
            <div className="round-detail" key={idx}>
              <span className="round-label">R{idx + 1}:</span>
              <span>{currentSoloGame.playerIds.map((id) => `${playerMap.get(id) || `#${id}`}: ${round.scores[id]}`).join(' | ')}</span>
            </div>
          ))}

          <button className="btn-primary" onClick={finishGame}>Back to Main</button>
        </div>
      )}
    </AppShell>
  );
}
