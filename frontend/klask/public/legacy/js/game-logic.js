/* ===============================
   STATE
================================ */

const players = [];
const championship = {
    championId: null,
    candidate: null // { playerId, remainingGames }
};
const games = [];
const championshipHistory = [];

/* ===============================
   BUSINESS LOGIC
================================ */

function durationInDays(end, start) {
    const hours = (end - start) / (1000 * 60 * 60);
    return Math.floor((hours + 12) / 24);
}

function calculateChampionshipDuration(championId) {
    if (!championId) return null;

    const previousChampionshipEvent = championshipHistory
        .slice()
        .reverse()
        .find(e => e.newChampionId === championId);

    if (!previousChampionshipEvent) return null;

    const start = new Date(previousChampionshipEvent.date);
    const end = new Date();
    return durationInDays(end, start);
}

// Calculate champion days for a specific championship period
function calculateChampionDaysForPeriod(championId, startDate, endDate) {
    const defendedDays = new Set();
    const endDayKey = endDate ? new Date(endDate).toDateString() : null;

    games.forEach(game => {
        const gameDate = new Date(game.date);
        const gameDayKey = new Date(gameDate).toDateString();

        // Exclude games on the day the championship ended
        if (gameDayKey === endDayKey) return;

        if (gameDate >= startDate && gameDate < endDate) {
            if (game.player1Id === championId || game.player2Id === championId) {
                defendedDays.add(gameDayKey);
            }
        }
    });

    return defendedDays.size;
}

function addPlayerToState(name) {
    // Use Date.now() + players.length to ensure unique IDs even in quick succession
    const player = {
        id: Date.now() + players.length,
        name
    };
    players.push(player);
    return player;
}

function championChangedToday(today) {
    if (championshipHistory.length <= 0) return false;

    const lastEvent = championshipHistory[championshipHistory.length - 1];
    const lastEventDate = new Date(lastEvent.date).toDateString();

    return lastEventDate === today;

}

function countTodayGamesBetween(playerAId, playerBId, today) {
    let count = 0;
    for (let i = games.length - 1; i >= 0; i--) {
        const g = games[i];
        const gDate = new Date(g.date).toDateString();
        if (gDate !== today) break;

        const hasA = g.player1Id === playerAId || g.player2Id === playerAId;
        const hasB = g.player1Id === playerBId || g.player2Id === playerBId;
        if (hasA && hasB) count++;
    }
    return count;
}

function tryConvertCandidateOnChampionWin(winnerId, previousChampionId, now, championAlreadyChangedToday) {
    if (!championship.candidate || championship.candidate.playerId !== winnerId) return false;
    if (championAlreadyChangedToday) return false;

    championshipHistory.push({
        date: now,
        newChampionId: winnerId,
        previousChampionId,
        reason: 'game'
    });

    championship.championId = winnerId;
    championship.candidate = null;
    return true;
}

function maybeStartCandidateWindow(winnerId, championId, today) {
    if (championship.candidate) return false;

    const gamesVsChampionToday = countTodayGamesBetween(winnerId, championId, today);
    const gamesVsChampionBeforeThis = Math.max(0, gamesVsChampionToday - 1);
    if (gamesVsChampionBeforeThis !== 0) return false;

    championship.candidate = {
        playerId: winnerId,
        remainingGames: 2
    };
    return true;
}

function consumeCandidateWindowIfNeeded(p1Id, p2Id, candidateAtStartId, candidateStartedThisGame, championChanged) {
    if (championChanged || !candidateAtStartId || candidateStartedThisGame) return;
    if (!championship.candidate || championship.candidate.playerId !== candidateAtStartId) return;

    const candidatePlayed = p1Id === candidateAtStartId || p2Id === candidateAtStartId;
    const gameVsChampion = p1Id === championship.championId || p2Id === championship.championId;
    if (!candidatePlayed || !gameVsChampion) return;

    championship.candidate.remainingGames -= 1;
    if (championship.candidate.remainingGames <= 0) {
        championship.candidate = null;
    }
}

function processMatchResult(p1Id, p2Id, score1, score2) {
    const winnerId = score1 > score2 ? p1Id : p2Id;
    const loserId = score1 > score2 ? p2Id : p1Id;

    const currentDate = new Date();
    const today = currentDate.toDateString();
    const now = currentDate.toISOString();

    const candidateAtStartId = championship.candidate ? championship.candidate.playerId : null;

    const previousGameDay = games.length ? new Date(games[games.length - 1].date).toDateString() : null;
    if (previousGameDay && previousGameDay !== today) {
        championship.candidate = null;
    }

    games.push({
        date: now,
        player1Id: p1Id,
        player2Id: p2Id,
        score1,
        score2
    });

    const championAlreadyChangedToday = championChangedToday(today);
    let championChanged = false;
    let candidateStartedThisGame = false;

    if (!championship.championId) {
        championship.championId = winnerId;
    } else if (championship.championId === loserId) {
        championChanged = tryConvertCandidateOnChampionWin(winnerId, loserId, now, championAlreadyChangedToday);
        if (!championChanged) {
            candidateStartedThisGame = maybeStartCandidateWindow(winnerId, loserId, today);
        }
    }

    consumeCandidateWindowIfNeeded(p1Id, p2Id, candidateAtStartId, candidateStartedThisGame, championChanged);

    return {championChanged};
}

function setChampion(newChampionId) {
    if (newChampionId !== championship.championId) {
        championshipHistory.push({
            date: new Date().toISOString(),
            newChampionId: newChampionId,
            previousChampionId: championship.championId,
            reason: 'manual'
        });
    }

    championship.championId = newChampionId;
    championship.candidate = null;
}

function removeGameFromHistory(index) {
    games.splice(index, 1);
}

function removeChampionshipEventFromHistory(index) {
    championshipHistory.splice(index, 1);
}

function calculateStats() {
    const stats = {};
    players.forEach(p => {
        stats[p.id] = {
            name: p.name,
            wins: 0,
            losses: 0,
            pointsWon: 0,
            pointsLost: 0,
            totalChampionDays: 0,
            maxChampionStreak: 0
        };
    });

    games.forEach(game => {
        const winnerId = game.score1 > game.score2 ? game.player1Id : game.player2Id;
        const loserId = game.score1 > game.score2 ? game.player2Id : game.player1Id;
        const winnerScore = Math.max(game.score1, game.score2);
        const loserScore = Math.min(game.score1, game.score2);

        if (stats[winnerId]) {
            stats[winnerId].wins++;
            stats[winnerId].pointsWon += winnerScore;
            stats[winnerId].pointsLost += loserScore;
        }
        if (stats[loserId]) {
            stats[loserId].losses++;
            stats[loserId].pointsWon += loserScore;
            stats[loserId].pointsLost += winnerScore;
        }
    });

    // Calculate championship days for each player
    // Only count days when the champion played at least one game
    championshipHistory.forEach((event, index) => {
        const championId = event.newChampionId;
        if (!championId || !stats[championId]) return;

        const startDate = new Date(event.date);

        // Find when this championship ended (next championship event)
        const nextEvent = championshipHistory[index + 1];
        const endDate = nextEvent ? new Date(nextEvent.date) : new Date();

        const days = calculateChampionDaysForPeriod(championId, startDate, endDate);

        stats[championId].totalChampionDays += days;
        if (days > stats[championId].maxChampionStreak) {
            stats[championId].maxChampionStreak = days;
        }
    });

    // Calculate percentages
    return Object.values(stats).map(s => {
        const totalGames = s.wins + s.losses;
        const winPercent = totalGames > 0 ? ((s.wins / totalGames) * 100).toFixed(1) : 0;
        const totalPoints = s.pointsWon + s.pointsLost;
        const pointPercent = totalPoints > 0 ? ((s.pointsWon / totalPoints) * 100).toFixed(1) : 0;

        return {
            ...s,
            totalGames,
            winPercent,
            pointPercent
        };
    });
}

function loadStateFromData(data) {
    players.length = 0;
    players.push(...data.players);

    championship.championId = data.championship.championId;
    championship.candidate = data.championship.candidate || (data.championship.challengerId
        ? { playerId: data.championship.challengerId, remainingGames: 2 }
        : null);
    games.length = 0;
    if (data.games) {
        games.push(...data.games);
    }

    championshipHistory.length = 0;
    if (data.championshipHistory) {
        championshipHistory.push(...data.championshipHistory);
    }
}

function getStateForSave() {
    return {
        players,
        championship: {
            ...championship
        },
        games,
        championshipHistory
    };
}

function calculateHeadToHead(playerId) {
    const opponentStats = {};

    // Initialize stats for all other players
    players.forEach(p => {
        if (p.id !== playerId) {
            opponentStats[p.id] = {
                name: p.name,
                gamesAgainst: 0,
                wins: 0,
                losses: 0,
                pointsFor: 0,
                pointsAgainst: 0
            };
        }
    });

    // Calculate head-to-head stats from games
    games.forEach(game => {
        let opponentId = null;
        let playerScore = 0;
        let opponentScore = 0;

        if (game.player1Id === playerId) {
            opponentId = game.player2Id;
            playerScore = game.score1;
            opponentScore = game.score2;
        } else if (game.player2Id === playerId) {
            opponentId = game.player1Id;
            playerScore = game.score2;
            opponentScore = game.score1;
        }

        if (opponentId && opponentStats[opponentId]) {
            opponentStats[opponentId].gamesAgainst++;
            opponentStats[opponentId].pointsFor += playerScore;
            opponentStats[opponentId].pointsAgainst += opponentScore;

            if (playerScore > opponentScore) {
                opponentStats[opponentId].wins++;
            } else {
                opponentStats[opponentId].losses++;
            }
        }
    });

    // Calculate derived stats and return as array
    return Object.values(opponentStats)
        .filter(s => s.gamesAgainst > 0)
        .map(s => ({
            name: s.name,
            gamesAgainst: s.gamesAgainst,
            winBalance: s.wins - s.losses,
            avgPointDiff: ((s.pointsFor - s.pointsAgainst) / s.gamesAgainst).toFixed(1)
        }))
        .sort((a, b) => b.gamesAgainst - a.gamesAgainst);
}
