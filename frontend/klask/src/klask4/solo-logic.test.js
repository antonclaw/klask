import assert from 'node:assert/strict';
import {
  calculateTotals,
  createSoloGame,
  createSoloModeState,
  submitSoloRound,
} from './solo-logic.js';

function testCreateSoloModeStateDefaults() {
  const state = createSoloModeState();
  assert.deepEqual(state, { games: [], activeGame: null });
}

function testCreateSoloModeStatePassThrough() {
  const existing = { games: [{ id: 1 }], activeGame: { foo: true } };
  const state = createSoloModeState(existing);
  assert.equal(state, existing);
}

function testCreateSoloGame() {
  const game = createSoloGame([1, 2, 3, 4]);
  assert.equal(game.playerIds.length, 4);
  assert.equal(game.rounds.length, 3);
  assert.equal(game.currentRound, 0);
  assert.equal(game.completed, false);
}

function testCreateSoloGameInvalidPlayers() {
  assert.throws(() => createSoloGame([1, 2, 3]), /Exactly 4 players required/);
}

function testSubmitSoloRoundAdvancesAndCompletes() {
  let game = createSoloGame([1, 2, 3, 4]);

  game = submitSoloRound(game, { 1: 0, 2: 1, 3: 2, 4: 3 });
  assert.equal(game.currentRound, 1);
  assert.equal(game.completed, false);

  game = submitSoloRound(game, { 1: 1, 2: 1, 3: 1, 4: 1 });
  assert.equal(game.currentRound, 2);
  assert.equal(game.completed, false);

  game = submitSoloRound(game, { 1: 5, 2: 4, 3: 3, 4: 2 });
  assert.equal(game.currentRound, 2);
  assert.equal(game.completed, true);
}

function testSubmitSoloRoundValidatesRangeAndType() {
  let game = createSoloGame([1, 2, 3, 4]);
  assert.throws(() => submitSoloRound(game, { 1: 0, 2: 1, 3: 2, 4: 6 }), /0 and 5/);
  assert.throws(() => submitSoloRound(game, { 1: 0, 2: 1, 3: 2, 4: 1.5 }), /0 and 5/);
}

function testSubmitSoloRoundRejectedWhenCompleted() {
  let game = createSoloGame([1, 2, 3, 4]);
  game.completed = true;
  assert.throws(() => submitSoloRound(game, { 1: 0, 2: 1, 3: 2, 4: 3 }), /already completed/);
}

function testCalculateTotals() {
  const game = createSoloGame([1, 2, 3, 4]);
  game.rounds = [
    { scores: { 1: 1, 2: 2, 3: 3, 4: 4 } },
    { scores: { 1: 0, 2: 1, 3: 2, 4: 3 } },
    { scores: { 1: 5, 2: 4, 3: 3, 4: 2 } },
  ];

  const totals = calculateTotals(game);
  assert.equal(totals.get(1), 6);
  assert.equal(totals.get(2), 7);
  assert.equal(totals.get(3), 8);
  assert.equal(totals.get(4), 9);
}

function run() {
  const tests = [
    testCreateSoloModeStateDefaults,
    testCreateSoloModeStatePassThrough,
    testCreateSoloGame,
    testCreateSoloGameInvalidPlayers,
    testSubmitSoloRoundAdvancesAndCompletes,
    testSubmitSoloRoundValidatesRangeAndType,
    testSubmitSoloRoundRejectedWhenCompleted,
    testCalculateTotals,
  ];

  let passed = 0;
  for (const test of tests) {
    test();
    passed++;
  }

  console.log(`solo-logic: ${passed} passed, 0 failed`);
}

run();
