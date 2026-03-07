import React, { useState } from 'react';

export default function GameSetup({ players, onStartGame, onCancel }) {
  const [selected, setSelected] = useState(() => new Set(players.slice(0, 4).map(p => p.id)));

  function toggle(id) {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else if (next.size < 4) {
      next.add(id);
    }
    setSelected(next);
  }

  const canStart = selected.size === 4;

  return (
    <div className="game-setup">
      <h2>Select 4 Players</h2>
      <p className="setup-hint">{selected.size}/4 selected</p>
      <div className="toggle-grid">
        {players.map(p => (
          <button
            key={p.id}
            className={`toggle-btn${selected.has(p.id) ? ' active' : ''}`}
            onClick={() => toggle(p.id)}
          >
            {p.name}
          </button>
        ))}
      </div>
      <div className="button-row">
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
        <button onClick={() => onStartGame([...selected])} disabled={!canStart}>
          Start Game
        </button>
      </div>
    </div>
  );
}
