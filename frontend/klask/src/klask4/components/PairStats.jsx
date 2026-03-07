import React from 'react';
import { calculatePairStats } from '../game-logic.js';

export default function PairStats({ players, games }) {
  const stats = calculatePairStats(players, games);

  if (games.length === 0 || stats.length === 0) {
    return (
      <section>
        <h2>Pair Stats</h2>
        <p className="empty-text">No completed games yet.</p>
      </section>
    );
  }

  const bestWinPct = stats[0].winPercent;

  return (
    <section>
      <h2>Pair Stats</h2>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Pair</th>
              <th>Win/Total</th>
              <th>Win %</th>
              <th>Avg Score</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s, i) => (
              <tr key={s.pair.join('-')} className={s.winPercent === bestWinPct ? 'best-pair' : ''}>
                <td>{i + 1}</td>
                <td>{s.names.join(' & ')}</td>
                <td>{s.roundsWon}/{s.roundsPlayed}</td>
                <td>{s.winPercent}%</td>
                <td>{s.avgScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
