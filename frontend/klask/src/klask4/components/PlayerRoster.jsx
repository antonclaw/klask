import React, { useState } from 'react';

export default function PlayerRoster({ players, onAddPlayer }) {
  const [name, setName] = useState('');
  const [showForm, setShowForm] = useState(false);

  function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onAddPlayer(name.trim());
    setName('');
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
        <form className="add-player-form" onSubmit={handleAdd}>
          <input
            type="text"
            placeholder="Player name"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={!name.trim()}>Add</button>
        </form>
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
