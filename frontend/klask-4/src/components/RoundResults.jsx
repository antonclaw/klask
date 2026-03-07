import React from 'react';
import { getRoundWinners, calculateGameResults } from '../game-logic.js';

export default function RoundResults({ game, players, roundIndex, onNext }) {
  const playerMap = Object.fromEntries(players.map(p => [p.id, p.name]));
  const round = game.rounds[roundIndex];
  const winners = getRoundWinners(round);
  const winnerNames = winners ? winners.map(id => playerMap[id] || `#${id}`).join(' & ') : '';

  // Current standings
  const results = calculateGameResults({
    ...game,
    rounds: game.rounds.slice(0, roundIndex + 1),
  });

  const standings = game.playerIds
    .map(id => ({
      name: playerMap[id] || `#${id}`,
      ...results.get(id),
    }))
    .sort((a, b) => b.roundsWon - a.roundsWon);

  return (
    <div className="round-results">
      <h2>Round {roundIndex + 1} Result</h2>

      <div className="result-matchup">
        <span className={round.score1 > round.score2 ? 'winner' : ''}>
          {round.team1.map(id => playerMap[id]).join(' & ')}
        </span>
        <span className="result-score">{round.score1} - {round.score2}</span>
        <span className={round.score2 > round.score1 ? 'winner' : ''}>
          {round.team2.map(id => playerMap[id]).join(' & ')}
        </span>
      </div>

      <div className="winner-banner">
        {winnerNames} win this round!
      </div>

      <h3>Standings</h3>
      <div className="standings">
        {standings.map((s, i) => (
          <div key={i} className="standing-row">
            <span className="standing-name">{s.name}</span>
            <span className="standing-stat">{s.roundsWon}</span>
          </div>
        ))}
      </div>

      <button onClick={onNext}>
        {game.completed ? 'See Final Results' : `Next Round (${game.currentRound + 1}/3)`}
      </button>
    </div>
  );
}
