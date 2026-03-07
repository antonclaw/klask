import React from 'react';
import PlayerRoster from './PlayerRoster.jsx';
import PlayerStats from './PlayerStats.jsx';
import PairStats from './PairStats.jsx';
import GameHistory from './GameHistory.jsx';

export default function MainScreen({ players, games, onAddPlayer, onStartSetup, onLogout }) {
  const canStartGame = players.length >= 4;

  return (
    <div className="main-screen">
      <div className="top-bar">
        <h1>Klask 4</h1>
        <button className="btn-logout" onClick={onLogout}>Logout</button>
      </div>

      <PlayerRoster players={players} onAddPlayer={onAddPlayer} />

      <div className="start-game-section">
        <button
          onClick={onStartSetup}
          disabled={!canStartGame}
          className="btn-start-game"
        >
          Start New Game
        </button>
        {!canStartGame && (
          <p className="hint-text">Add at least 4 players to start a game</p>
        )}
      </div>

      <PlayerStats players={players} games={games} />
      <PairStats players={players} games={games} />
      <GameHistory games={games} players={players} />
    </div>
  );
}
