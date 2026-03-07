import React from 'react';
import { calculatePlayerStats } from '../game-logic.js';

export default function PlayerStats({ players, games }) {
  const stats = calculatePlayerStats(players, games);

  if (games.length === 0) {
    return (
      <section>
        <h2>Player Stats</h2>
        <p className="empty-text">No completed games yet.</p>
      </section>
    );
  }

  return (
    <section>
      <h2>Player Stats</h2>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Win/Total</th>
              <th>Win %</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s, i) => (
              <tr key={s.playerId}>
                <td>{i + 1}</td>
                <td>{s.name}</td>
                <td>{s.roundsWon}/{s.roundsPlayed}</td>
                <td>{s.winPercent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
