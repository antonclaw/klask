// @ts-nocheck
import React, { useCallback } from 'react';
import { saveState } from './api';
import { addPlayer, createGame, submitRoundScore, buildStateForSave } from './game-logic';
import { LoginScreen } from '../shared/AppShared';
import MainScreen from './components/MainScreen';
import GameSetup from './components/GameSetup';
import RoundScreen from './components/RoundScreen';
import GameEnd from './components/GameEnd';
import { AppShell, LoadingScreen, ModeSwitchButtons } from './components/AppShared';
import useKlask4Session from './hooks/useKlask4Session';

function resolveTeamScreen(state) {
  if (state.activeGame && state.activeGame.completed) return 'gameEnd';
  return state.activeGame && !state.activeGame.completed ? 'round' : 'main';
}

// Screens: loading, login, main, setup, round, gameEnd
export default function App() {
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
    if (!updated.completed) {
      setActiveGame(updated);
      setScreen('round');
      await persist(players, games, updated, `Submit round ${roundIdx + 1} score: ${score1}-${score2}`);
      return;
    }
    setActiveGame(updated);
    setScreen('gameEnd');
    await persist(players, games, updated, `Submit round ${roundIdx + 1} score: ${score1}-${score2}`);
  }

  async function handleCancelGame() {
    if (!window.confirm('Cancel the current game?')) return;
    setActiveGame(null);
    setScreen('main');
    await persist(players, games, null, 'Cancel game');
  }

  async function handleFinishGame() {
    if (!activeGame || !activeGame.completed) return;
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
      showModeSwitch={screen === 'main'}
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
