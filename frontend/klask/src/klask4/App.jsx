import React, { useCallback, useState } from 'react';
import { saveState } from './api.js';
import { addPlayer, createGame, submitRoundScore, buildStateForSave } from './game-logic.js';
import LoginScreen from './components/LoginScreen.jsx';
import MainScreen from './components/MainScreen.jsx';
import GameSetup from './components/GameSetup.jsx';
import RoundScreen from './components/RoundScreen.jsx';
import RoundResults from './components/RoundResults.jsx';
import GameEnd from './components/GameEnd.jsx';
import { AppShell, LoadingScreen, ModeSwitchButtons, useLegacyKlaskStyles } from './components/AppShared.jsx';
import useKlask4Session from './hooks/useKlask4Session.js';

function resolveTeamScreen(state) {
  return state.activeGame && !state.activeGame.completed ? 'round' : 'main';
}

// Screens: loading, login, main, setup, round, roundResults, gameEnd
export default function App() {
  useLegacyKlaskStyles();

  const {
    screen,
    setScreen,
    players,
    setPlayers,
    games,
    setGames,
    activeGame,
    setActiveGame,
    extraFields,
    error,
    setError,
    saving,
    setSaving,
    handleLogin,
    handleLogout,
  } = useKlask4Session(resolveTeamScreen);

  const [lastRoundIndex, setLastRoundIndex] = useState(null);

  const persist = useCallback(async (newPlayers, newGames, newActiveGame, cause) => {
    setSaving(true);
    try {
      const state = buildStateForSave(newPlayers, newGames, newActiveGame, extraFields);
      await saveState(state, cause);
    } catch (err) {
      setError(err.message);
      if (err.message === 'Unauthorized') {
        setScreen('login');
      }
    } finally {
      setSaving(false);
    }
  }, [extraFields, setError, setSaving, setScreen]);

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

  function handleNextRound() {
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
      rounds: activeGame.rounds.map((r) => ({
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

  if (screen === 'loading') {
    return <LoadingScreen />;
  }

  if (screen === 'login') {
    return (
      <>
        <ModeSwitchButtons rightMode="solo" rightLabel="Solo Mode" />
        <LoginScreen title="🎮 Klask 4" onLogin={handleLogin} />
      </>
    );
  }

  return (
    <AppShell
      rightMode="solo"
      rightLabel="Solo Mode"
      showModeSwitch={screen !== 'setup'}
      saving={saving}
      error={error}
      onDismissError={() => setError(null)}
    >
      {screen === 'main' && (
        <MainScreen
          players={players}
          games={games}
          onStartSetup={handleStartSetup}
          onLogout={handleLogout}
        />
      )}

      {screen === 'setup' && (
        <GameSetup
          players={players}
          onStartGame={handleStartGame}
          onAddPlayer={handleAddPlayer}
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
    </AppShell>
  );
}
