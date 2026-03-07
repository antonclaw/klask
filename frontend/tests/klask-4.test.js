/* ===============================
   KLASK-4 TESTS
================================ */

function getKlask4Tests() {
    return [
        testLoadStateFromLegacyChallengerId,
        testLoadStateWithNoCandidateInfo,
        testCalculateChampionshipDurationNullChampion,
        testCalculateChampionDaysForPeriodWithNullEndDate,
        testConsumeCandidateWindowSkipsWhenCandidateDoesNotMatch,
        testCalculateStatsWithIdlePlayerAndInvalidChampionHistory
    ];
}

function testLoadStateFromLegacyChallengerId() {
    const legacyState = {
        players: [{ id: 1, name: 'Alice' }],
        championship: {
            championId: 1,
            challengerId: 42
        },
        games: [],
        championshipHistory: []
    };

    loadStateFromData(legacyState);

    assertEquals(championship.championId, 1, 'Champion should be loaded');
    assert(championship.candidate !== null, 'Candidate should be reconstructed from challengerId');
    assertEquals(championship.candidate.playerId, 42, 'Candidate playerId should come from challengerId');
    assertEquals(championship.candidate.remainingGames, 2, 'Reconstructed candidate should have 2 remaining games');
}

function testLoadStateWithNoCandidateInfo() {
    const state = {
        players: [{ id: 1, name: 'Alice' }],
        championship: {
            championId: 1
        },
        games: [],
        championshipHistory: []
    };

    loadStateFromData(state);

    assertEquals(championship.candidate, null, 'Candidate should be null when neither candidate nor challengerId exists');
}

function testCalculateChampionshipDurationNullChampion() {
    const duration = calculateChampionshipDuration(null);
    assertEquals(duration, null, 'Null championId should return null duration');
}

function testCalculateChampionDaysForPeriodWithNullEndDate() {
    addPlayerToState('Alice');
    const aliceId = players[0].id;

    games.push({
        date: '2024-01-01T10:00:00Z',
        player1Id: aliceId,
        player2Id: 999,
        score1: 6,
        score2: 4
    });

    const days = calculateChampionDaysForPeriod(aliceId, new Date('2023-12-31T00:00:00Z'), null);
    assertEquals(days, 0, 'Current implementation returns 0 when endDate is null');
}

function testConsumeCandidateWindowSkipsWhenCandidateDoesNotMatch() {
    championship.championId = 1;
    championship.candidate = { playerId: 2, remainingGames: 2 };

    consumeCandidateWindowIfNeeded(1, 2, 3, false, false);

    assertEquals(championship.candidate.remainingGames, 2, 'Mismatched candidateAtStartId should not consume window');
}

function testCalculateStatsWithIdlePlayerAndInvalidChampionHistory() {
    addPlayerToState('Alice');
    addPlayerToState('Bob');
    addPlayerToState('Idle');
    const aliceId = players[0].id;
    const bobId = players[1].id;
    const idleId = players[2].id;

    games.push({
        date: '2024-01-01T10:00:00Z',
        player1Id: aliceId,
        player2Id: bobId,
        score1: 6,
        score2: 4
    });

    championshipHistory.push({
        date: '2024-01-01T09:00:00Z',
        newChampionId: null,
        previousChampionId: null,
        reason: 'manual'
    });

    championshipHistory.push({
        date: '2024-01-01T09:30:00Z',
        newChampionId: 999999,
        previousChampionId: null,
        reason: 'manual'
    });

    const stats = calculateStats();
    const idleStats = stats.find(s => s.name === 'Idle');

    assert(idleStats !== undefined, 'Idle player stats should exist');
    assertEquals(idleStats.totalGames, 0, 'Idle player should have zero games');
    assertEquals(idleStats.winPercent, 0, 'Idle player winPercent should be 0');
    assertEquals(idleStats.pointPercent, 0, 'Idle player pointPercent should be 0');
    assertEquals(idleStats.name === 'Idle' && idleId > 0, true, 'Idle player id should be valid');
}
