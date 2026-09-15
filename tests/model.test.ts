import { test } from 'node:test';
import assert from 'node:assert/strict';
import { puzzles, initialState, transition, actions, destinations, key, won, Session } from '../src/games/adjacent/model.ts';
import type { State, Puzzle, Action } from '../src/games/adjacent/model.ts';
import { parseSave } from '../src/shared/save.ts';
import { solve, returnAnalysis } from './design-analysis.ts';

function search(p: Puzzle, allowed = (_s: State, _a: Action) => true) {
  const queue: { state: State; path: Action[] }[] = [{ state: initialState(p), path: [] }], seen = new Set<string>();
  for (let n = 0; n < queue.length; n++) {
    const { state, path } = queue[n];
    if (seen.has(key(state))) continue; seen.add(key(state));
    if (won(state)) return path;
    for (const action of actions(p, state)) {
      if (!allowed(state, action)) continue;
      const next = transition(p, state, action);
      if (next !== state) queue.push({ state: next, path: [...path, action] });
    }
  }
  return null;
}

for (const [i, p] of puzzles.entries()) {
  test(`Puzzle ${i + 1}: complete return, required instruments, and undo`, () => {
    const solution = search(p); assert.ok(solution); console.log(`SOLUTION ${i + 1}: ${JSON.stringify(solution)}`);
    const game = new Session(p), snapshots = [structuredClone(game.state)];
    for (const action of solution) { assert.equal(game.act(action), true); snapshots.push(structuredClone(game.state)); }
    assert.equal(won(game.state), true);
    assert.equal(game.state.parcel, true);
    assert.equal(game.act({ type: 'travel', room: 5 }), false);
    for (let n = snapshots.length - 2; n >= 0; n--) { assert.ok(game.undo()); assert.deepEqual(game.state, snapshots[n]); }
    assert.equal(game.undo(), false);
    for (const action of solution.slice(0, 4)) game.act(action);
    game.restart(); assert.deepEqual(game.state, initialState(p)); assert.equal(game.history.length, 0);
    assert.equal(search(p, (s, a) => !(s.parcel && a.type === 'set')), null, 'return must require reconfiguration');
    for (const instrument of p.instruments) {
      assert.equal(search(p, (s, a) => !(s.room === instrument.room && a.type === 'set')), null, `instrument in room ${instrument.room} must matter`);
    }
  });
  test(`Puzzle ${i + 1}: every reachable state obeys travel and fixed control targets`, () => {
    const queue = [initialState(p)], seen = new Set<string>();
    for (let n = 0; n < queue.length; n++) {
      const state = queue[n]; if (seen.has(key(state))) continue; seen.add(key(state));
      const before = structuredClone(state);
      for (let room = -1; room <= 6; room++) {
        const next = transition(p, state, { type: 'travel', room });
        const legal = !won(state) && destinations(state).includes(room);
        assert.equal(next !== state, legal);
        if (legal) { assert.equal(state.temperatures[state.room], state.temperatures[next.room]); assert.deepEqual(next.temperatures, state.temperatures); queue.push(next); }
      }
      for (const value of [0, 1, 2] as const) {
        const next = transition(p, state, { type: 'set', value });
        if (next !== state) {
          const control = p.instruments.find(c => c.room === state.room)!;
          assert.ok(control); assert.ok(control.settings.includes(value));
          next.temperatures.forEach((t, r) => assert.equal(t, control.targets.includes(r) ? value : state.temperatures[r]));
          assert.equal(next.room, state.room); assert.equal(next.parcel, state.parcel); queue.push(next);
        }
      }
      assert.deepEqual(state, before, 'transition never mutates its input');
    }
    console.log(`EXHAUSTIVE ${i + 1}: ${seen.size} reachable states`);
  });
}
test('save validation preserves only valid settings and distinct challenge completions', () => {
  assert.deepEqual(parseSave('{'), { version: 1, muted: false, reduced: false, completed: [], ballastCompleted: [], ballastEdition: 2, ballastStamp: false });


  assert.deepEqual(parseSave(null, true).reduced, true);
  assert.deepEqual(parseSave(JSON.stringify({ version: 1, muted: true, reduced: false, completed: [0, 0, 1, 2, 6, -1, '1', null] })), { version: 1, muted: true, reduced: false, completed: [0, 1, 2], ballastCompleted: [], ballastEdition: 2, ballastStamp: false });
});

test('Third puzzle requires preparation before pickup, not just a longer forced chain', () => {
  const puzzle = puzzles[2], game = new Session(puzzle);
  // The tempting route is legal and reaches the case. It cannot complete a round trip.
  game.act({ type: 'travel', room: 1 });
  game.act({ type: 'set', value: 2 });
  game.act({ type: 'travel', room: 5 });
  assert.equal(game.state.parcel, true);
  assert.equal(solve(puzzle, game.state), null);
  game.undo(); game.undo();
  assert.notEqual(solve(puzzle, game.state), null, 'undo recovers a viable planning position');
  const metrics = returnAnalysis(puzzle);
  assert.equal(metrics.pickup, 3);
  assert.equal(metrics.preparedPickup, 11);
  assert.ok(metrics.safe > 0 && metrics.trapped > 0);
  // At the first relay visit, both settings are legal and alter access.
  const relay = transition(puzzle, initialState(puzzle), { type: 'travel', room: 4 });
  for (const value of [0, 1] as const) {
    const changed = transition(puzzle, relay, { type: 'set', value });
    assert.notEqual(changed, relay);
    assert.notDeepEqual(destinations(changed), destinations(relay));
  }
  console.log(`RETURN PLANNING: ${JSON.stringify(metrics)}`);
});
