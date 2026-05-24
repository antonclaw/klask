import React from 'react';

type AddPlayerFormProps = {
  className?: string;
  onAddPlayer: (name: string) => Promise<void> | void;
  onDone?: () => void;
};

export default function AddPlayerForm({ className = 'add-player-form', onAddPlayer, onDone }: AddPlayerFormProps) {
  const [name, setName] = React.useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await onAddPlayer(trimmed);
    setName('');
    onDone?.();
  }

  return (
    <form className={className} onSubmit={submit}>
      <input
        type="text"
        placeholder="Player name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        autoFocus
      />
      <button type="submit" disabled={!name.trim()}>Add</button>
    </form>
  );
}
