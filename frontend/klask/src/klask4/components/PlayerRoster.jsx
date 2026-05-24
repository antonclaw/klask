import React, { useState } from 'react';
import AddPlayerForm from '../../shared/AddPlayerForm';

export default function PlayerRoster({ players, onAddPlayer }) {
  const [showForm, setShowForm] = useState(false);

  async function handleAdd(name) {
    await onAddPlayer(name);
    setShowForm(false);
  }


  return (
    <section>
      <button
        className="icon-btn add-player-btn circular-btn"
        onClick={() => setShowForm(!showForm)}
        title={showForm ? 'Cancel add player' : 'Add player'}
        aria-label={showForm ? 'Cancel add player' : 'Add player'}
      >
        {showForm ? '×' : '+'}
      </button>

      <h2>Players</h2>
      {showForm && (
        <AddPlayerForm onAddPlayer={handleAdd} />
      )}
      <div className="player-chips">
        {players.map(p => (
          <span key={p.id} className="player-chip">{p.name}</span>
        ))}
        {players.length === 0 && <p className="empty-text">No players yet. Add at least 4 to start a game.</p>}
      </div>
    </section>
  );
}
