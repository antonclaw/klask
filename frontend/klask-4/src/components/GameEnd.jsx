import React from 'react';
import { calculateGameResults } from '../game-logic.js';

export default function GameEnd({ game, players, onFinish }) {
  const playerMap = Object.fromEntries(players.map(p => [p.id, p.name]));
  const results = calculateGameResults(game);

  const standings = game.playerIds
    .map(id => ({
      id,
      name: playerMap[id] || `#${id}`,
      ...results.get(id),
    }))
    .sort((a, b) => b.roundsWon - a.roundsWon);

  const maxWins = standings[0].roundsWon;
  const winners = standings.filter(s => s.roundsWon === maxWins);

  return (
    <div className="game-end">
      <h2>Game Complete!</h2>

      <div className="trophy-section">
        <div className="trophy">&#127942;</div>
        <div className="winner-names">
          {winners.map(w => w.name).join(' & ')}
        </div>
        <div className="winner-subtitle">
          {winners.length > 1 ? 'Tied for most wins!' : 'Most rounds won!'}
        </div>
      </div>

      <h3>Final Standings</h3>
      <div className="final-standings">
        {standings.map((s, i) => (
          <div key={s.id} className={`final-row${s.roundsWon === maxWins ? ' highlight' : ''}`}>
            <span className="rank">#{i + 1}</span>
            <span className="name">{s.name}</span>
            <span className="stat">{s.roundsWon} / {s.roundsPlayed} rounds won</span>
          </div>
        ))}
      </div>

      <h3>Round Details</h3>
      {game.rounds.map((r, i) => (
        <div key={i} className="round-detail">
          <span className="round-label">R{i + 1}:</span>
          <span className={r.score1 > r.score2 ? 'winner' : ''}>
            {r.team1.map(id => playerMap[id]).join(' & ')}
          </span>
          <span className="detail-score">{r.score1}-{r.score2}</span>
          <span className={r.score2 > r.score1 ? 'winner' : ''}>
            {r.team2.map(id => playerMap[id]).join(' & ')}
          </span>
        </div>
      ))}

      <button onClick={onFinish} className="btn-primary">Back to Main</button>
    </div>
  );
}
