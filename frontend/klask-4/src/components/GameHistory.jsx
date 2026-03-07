import React from 'react';

export default function GameHistory({ games, players }) {
  const playerMap = Object.fromEntries(players.map(p => [p.id, p.name]));

  if (games.length === 0) {
    return (
      <section>
        <h2>Game History</h2>
        <p className="empty-text">No completed games yet.</p>
      </section>
    );
  }

  return (
    <section>
      <h2>Game History</h2>
      <div className="history-list">
        {[...games].reverse().map((game, gi) => (
          <div key={gi} className="history-item">
            <div className="history-header">
              <span className="history-date">
                {new Date(game.date).toLocaleDateString()}
              </span>
              <span className="history-players">
                {game.playerIds.map(id => playerMap[id] || `#${id}`).join(', ')}
              </span>
            </div>
            <div className="history-rounds">
              {game.rounds.map((r, ri) => (
                <div key={ri} className="history-round">
                  <span className={r.score1 > r.score2 ? 'winner' : ''}>
                    {r.team1.map(id => playerMap[id] || `#${id}`).join(' & ')}
                  </span>
                  <span className="history-score">{r.score1}-{r.score2}</span>
                  <span className={r.score2 > r.score1 ? 'winner' : ''}>
                    {r.team2.map(id => playerMap[id] || `#${id}`).join(' & ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
