export function createSoloModeState(existing) {
  return existing || { games: [], activeGame: null };
}

export function createSoloGame(playerIds) {
  if (playerIds.length !== 4) {
    throw new Error('Exactly 4 players required');
  }
  return {
    playerIds: [...playerIds],
    rounds: [
      { scores: null },
      { scores: null },
      { scores: null },
    ],
    currentRound: 0,
    completed: false,
  };
}

export function submitSoloRound(game, roundScores) {
  if (game.completed) {
    throw new Error('Game is already completed');
  }

  const ids = game.playerIds;
  for (const id of ids) {
    const value = roundScores[id];
    if (!Number.isInteger(value) || value < 0 || value > 5) {
      throw new Error('Each player score must be an integer between 0 and 5');
    }
  }

  const rounds = game.rounds.map((r, idx) => (
    idx === game.currentRound ? { scores: { ...roundScores } } : { ...r, scores: r.scores ? { ...r.scores } : null }
  ));

  const nextRound = game.currentRound + 1;
  const completed = nextRound >= rounds.length;

  return {
    ...game,
    playerIds: [...ids],
    rounds,
    currentRound: completed ? game.currentRound : nextRound,
    completed,
  };
}

export function calculateTotals(game) {
  const totals = new Map(game.playerIds.map((id) => [id, 0]));
  for (const round of game.rounds) {
    if (!round.scores) continue;
    for (const id of game.playerIds) {
      totals.set(id, totals.get(id) + (round.scores[id] || 0));
    }
  }
  return totals;
}
