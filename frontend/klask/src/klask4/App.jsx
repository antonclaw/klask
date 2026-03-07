import React, { useState, useEffect, useCallback } from 'react';
import { login, loadState, saveState, hasToken, clearToken } from './api.js';
import {
  createGame,
  submitRoundScore,
  addPlayer,
  buildStateForSave,
  loadStateFromData,
} from './game-logic.js';
import LoginScreen from './components/LoginScreen.jsx';
import MainScreen from './components/MainScreen.jsx';
import GameSetup from './components/GameSetup.jsx';
import RoundScreen from './components/RoundScreen.jsx';
import RoundResults from './components/RoundResults.jsx';
import GameEnd from './components/GameEnd.jsx';

// Screens: loading, login, main, setup, round, roundResults, gameEnd
export default function App() {
  const [screen, setScreen] = useState('loading');
  const [players, setPlayers] = useState([]);
  const [games, setGames] = useState([]);
  const [activeGame, setActiveGame] = useState(null);
  const [lastRoundIndex, setLastRoundIndex] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const persist = useCallback(async (newPlayers, newGames, newActiveGame, cause) => {
    setSaving(true);
    try {
      const state = buildStateForSave(newPlayers, newGames, newActiveGame);
      await saveState(state, cause);
    } catch (err) {
      setError(err.message);
      if (err.message === 'Unauthorized') {
        setScreen('login');
      }
    } finally {
      setSaving(false);
    }
  }, []);

  // Load state on mount
  useEffect(() => {
    if (!hasToken()) {
      setScreen('login');
      return;
    }

    loadState()
      .then(data => {
        const state = loadStateFromData(data);
        setPlayers(state.players);
        setGames(state.games);
        setActiveGame(state.activeGame);

        if (state.activeGame && !state.activeGame.completed) {
          setScreen('round');
        } else {
          setScreen('main');
        }
      })
      .catch(err => {
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
    setGames(state.games);
    setActiveGame(state.activeGame);

    if (state.activeGame && !state.activeGame.completed) {
      setScreen('round');
    } else {
      setScreen('main');
    }
  }

  function handleLogout() {
    clearToken();
    setPlayers([]);
    setGames([]);
    setActiveGame(null);
    setScreen('login');
  }

  async function handleAddPlayer(name) {
    const { newPlayers } = addPlayer(players, name);
    setPlayers(newPlayers);
    await persist(newPlayers, games, activeGame, `Add player: ${name}`);
  }

  function handleStartSetup() {
    if (activeGame && !activeGame.completed) {
      if (!window.confirm('There is an active game in progress. Abandon it and start a new one?')) {
        return;
      }
    }
    setScreen('setup');
  }

  async function handleStartGame(playerIds) {
    const game = createGame(playerIds);
    setActiveGame(game);
    setScreen('round');
    await persist(players, games, game, 'Start new game');
  }

  async function handleSubmitScore(score1, score2) {
    const updated = submitRoundScore(activeGame, score1, score2);
    const roundIdx = activeGame.currentRound;
    setActiveGame(updated);
    setLastRoundIndex(roundIdx);
    setScreen(updated.completed ? 'gameEnd' : 'roundResults');
    await persist(players, games, updated, `Submit round ${roundIdx + 1} score: ${score1}-${score2}`);
  }

  async function handleNextRound() {
    if (activeGame.completed) {
      setScreen('gameEnd');
    } else {
      setScreen('round');
    }
  }

  async function handleCancelGame() {
    if (!window.confirm('Cancel the current game?')) return;
    setActiveGame(null);
    setScreen('main');
    await persist(players, games, null, 'Cancel game');
  }

  async function handleFinishGame() {
    const completedGame = {
      date: new Date().toISOString(),
      playerIds: [...activeGame.playerIds],
      rounds: activeGame.rounds.map(r => ({
        team1: [...r.team1],
        team2: [...r.team2],
        score1: r.score1,
        score2: r.score2,
      })),
    };
    const newGames = [...games, completedGame];
    setGames(newGames);
    setActiveGame(null);
    setScreen('main');
    await persist(players, newGames, null, 'Complete game');
  }

  function getMainAppHref() {
    const path = window.location.pathname;
    if (path.includes('/frontend/klask/dist/')) {
      return './index.html';
    }
    if (path.endsWith('/klask-4.html')) {
      return './index.html';
    }
    return '/';
  }

  if (screen === 'loading') {
    return <div className="loading-screen"><div className="loading-text">Loading...</div></div>;
  }

  if (screen === 'login') {
    return (
      <>
        <a className="switch-app-btn switch-app-btn-top-left" href={getMainAppHref()}>Klask</a>
        <LoginScreen onLogin={handleLogin} />
      </>
    );
  }

  return (
    <div className="app-container">
      <a className="switch-app-btn switch-app-btn-top-left" href={getMainAppHref()}>Klask</a>
      {saving && <div className="saving-indicator">Saving...</div>}
      {error && (
        <div className="error-banner">
          {error}
          <button className="btn-dismiss" onClick={() => setError(null)}>x</button>
        </div>
      )}

      {screen === 'main' && (
        <MainScreen
          players={players}
          games={games}
          onAddPlayer={handleAddPlayer}
          onStartSetup={handleStartSetup}
          onLogout={handleLogout}
        />
      )}

      {screen === 'setup' && (
        <GameSetup
          players={players}
          onStartGame={handleStartGame}
          onCancel={() => setScreen('main')}
        />
      )}

      {screen === 'round' && activeGame && !activeGame.completed && (
        <RoundScreen
          game={activeGame}
          players={players}
          onSubmitScore={handleSubmitScore}
          onCancel={handleCancelGame}
        />
      )}

      {screen === 'roundResults' && activeGame && lastRoundIndex !== null && (
        <RoundResults
          game={activeGame}
          players={players}
          roundIndex={lastRoundIndex}
          onNext={handleNextRound}
        />
      )}

      {screen === 'gameEnd' && activeGame && (
        <GameEnd
          game={activeGame}
          players={players}
          onFinish={handleFinishGame}
        />
      )}
    </div>
  );
}
