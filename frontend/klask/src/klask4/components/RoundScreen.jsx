import React, { useState } from 'react';
import { calculateGameResults } from '../game-logic.js';

export default function RoundScreen({ game, players, onSubmitScore, onCancel }) {
  const [score1, setScore1] = useState(null);
  const [score2, setScore2] = useState(null);

  const round = game.rounds[game.currentRound];
  const playerMap = Object.fromEntries(players.map(p => [p.id, p.name]));

  const team1Names = round.team1.map(id => playerMap[id] || `#${id}`);
  const team2Names = round.team2.map(id => playerMap[id] || `#${id}`);

  function selectScore(team, value) {
    if (team === 1) {
      const newScore1 = score1 === value ? null : value;
      setScore1(newScore1);
      // Auto-set other team to 10 (or clear if deselecting)
      setScore2(newScore1 !== null && newScore1 < 10 ? 10 : null);
    } else {
      const newScore2 = score2 === value ? null : value;
      setScore2(newScore2);
      setScore1(newScore2 !== null && newScore2 < 10 ? 10 : null);
    }
  }

  function handleSubmit() {
    if (score1 === null || score2 === null || score1 === score2) return;
    onSubmitScore(score1, score2);
    setScore1(null);
    setScore2(null);
  }

  const canSubmit = score1 !== null && score2 !== null && score1 !== score2;
  const results = calculateGameResults(game);
  const standings = game.playerIds
    .map((id) => {
      const stats = results.get(id) || { roundsWon: 0, roundsPlayed: 0 };
      return {
        id,
        name: playerMap[id] || `#${id}`,
        roundsWon: stats.roundsWon,
        roundsPlayed: stats.roundsPlayed,
      };
    })
    .sort((a, b) => b.roundsWon - a.roundsWon || b.roundsPlayed - a.roundsPlayed || a.name.localeCompare(b.name));

  return (
    <div className="round-screen">
      <h2>Round {game.currentRound + 1} of 3</h2>

      <div className="matchup">
        <div className="team">
          <div className="team-label">Team 1</div>
          <div className="team-players">{team1Names.join(' & ')}</div>
          <div className="score-row">
            {Array.from({ length: 11 }, (_, i) => (
              <button
                key={i}
                className={`score-circle${score1 === i ? ' active' : ''}`}
                onClick={() => selectScore(1, i)}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div className="vs">VS</div>

        <div className="team">
          <div className="team-label">Team 2</div>
          <div className="team-players">{team2Names.join(' & ')}</div>
          <div className="score-row">
            {Array.from({ length: 11 }, (_, i) => (
              <button
                key={i}
                className={`score-circle${score2 === i ? ' active' : ''}`}
                onClick={() => selectScore(2, i)}
              >
                {i}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button onClick={handleSubmit} disabled={!canSubmit} className="btn-submit">
        Submit Score
      </button>
      <button onClick={onCancel} className="btn-cancel">Cancel Game</button>

      <div className="team-live-stats">
        <h3>Current Standings</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Won</th>
                <th>Win %</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, idx) => {
                const winPercent = row.roundsPlayed > 0 ? Math.round((row.roundsWon / row.roundsPlayed) * 100) : 0;
                return (
                  <tr key={row.id}>
                    <td>{idx + 1}</td>
                    <td>{row.name}</td>
                    <td>{row.roundsWon}</td>
                    <td>{winPercent}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
