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

export function calculateProjectedTotals(game, draftScores) {
  const totals = calculateTotals(game);
  const currentRound = game.rounds[game.currentRound];

  if (!currentRound || currentRound.scores) {
    return totals;
  }

  const hasAllDraftScores = game.playerIds.every((id) => Number.isInteger(draftScores[id]) && draftScores[id] >= 0 && draftScores[id] <= 5);
  if (!hasAllDraftScores) {
    return totals;
  }

  for (const id of game.playerIds) {
    totals.set(id, totals.get(id) + draftScores[id]);
  }

  return totals;
}

export function calculateSoloPlayerStats(players, games) {
  const statsById = new Map(players.map((p) => [p.id, {
    playerId: p.id,
    name: p.name,
    gamesPlayed: 0,
    wins: 0,
    totalPoints: 0,
    bestGamePoints: null,
  }]));

  for (const game of games) {
    const totals = calculateTotals(game);
    const ranked = game.playerIds
      .map((id) => ({ id, points: totals.get(id) || 0 }))
      .sort((a, b) => a.points - b.points);
    const winnerPoints = ranked.length ? ranked[0].points : null;

    for (const entry of ranked) {
      const stat = statsById.get(entry.id);
      if (!stat) continue;

      stat.gamesPlayed += 1;
      stat.totalPoints += entry.points;
      if (stat.bestGamePoints === null || entry.points < stat.bestGamePoints) {
        stat.bestGamePoints = entry.points;
      }
      if (winnerPoints !== null && entry.points === winnerPoints) {
        stat.wins += 1;
      }
    }
  }

  return Array.from(statsById.values())
    .map((s) => ({
      ...s,
      avgPoints: s.gamesPlayed > 0 ? +(s.totalPoints / s.gamesPlayed).toFixed(2) : null,
    }))
    .sort((a, b) => {
      if (a.gamesPlayed === 0 && b.gamesPlayed === 0) return a.name.localeCompare(b.name);
      if (a.gamesPlayed === 0) return 1;
      if (b.gamesPlayed === 0) return -1;
      if (a.avgPoints !== b.avgPoints) return a.avgPoints - b.avgPoints;
      if (a.wins !== b.wins) return b.wins - a.wins;
      return a.name.localeCompare(b.name);
    });
}
