import React, { useState } from 'react';
import AddPlayerForm from '../../shared/AddPlayerForm';

function getNameSizeClass(name) {
  if (name.length > 16) return ' name-size-xs';
  if (name.length > 10) return ' name-size-sm';
  return '';
}

export default function GameSetup({ players, onStartGame, onCancel, onAddPlayer }) {
  const [selected, setSelected] = useState(() => new Set(players.slice(0, 4).map(p => p.id)));
  const [showAddForm, setShowAddForm] = useState(false);

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

  async function handleAddPlayer(name) {
    if (!onAddPlayer) return;
    await onAddPlayer(name);
    setShowAddForm(false);
  }


  return (
    <div className="game-setup">
      <button
        className="icon-btn add-player-btn circular-btn"
        onClick={() => setShowAddForm((prev) => !prev)}
        title={showAddForm ? 'Cancel add player' : 'Add player'}
        aria-label={showAddForm ? 'Cancel add player' : 'Add player'}
      >
        {showAddForm ? '×' : '+'}
      </button>

      <h2>Select 4 Players</h2>
      <p className="setup-hint">{selected.size}/4 selected</p>
      {showAddForm && (
        <AddPlayerForm className="add-player-form setup-add-player-form" onAddPlayer={handleAddPlayer} />
      )}
      <div className="toggle-grid">
        {players.map(p => (
          <button
            key={p.id}
            className={`toggle-btn${getNameSizeClass(p.name)}${selected.has(p.id) ? ' active' : ''}`}
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
