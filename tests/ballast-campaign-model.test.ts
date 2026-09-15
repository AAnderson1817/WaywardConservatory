import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BallastSession, initialState, transition, step, forecast, releaseForecast, gatesFor, switchesFor, gateIsOpen, availableMinerals } from '../src/games/ballast/model.ts';
import type { Chamber, Mineral, Piece, State } from '../src/games/ballast/model.ts';
import { introLevels } from '../src/games/ballast/levels-intro.ts';

function fixture(): Chamber {
  return {
    title: 'Device laboratory', lesson: '', hint: '', hints: ['', '', ''],
    docks: [{ x: 100, y: 270, r: 35, name: 'Start' }, { x: 800, y: 270, r: 40, name: 'Receiver', exit: true }],
    walls: [],
    switches: [
      { id: 'a', mineral: 'north', rect: { x: 300, y: 80, w: 40, h: 20 } },
      { id: 'b', mineral: 'south', rect: { x: 600, y: 440, w: 40, h: 20 }, requires: ['a'] },
    ],
    gates: [
      { id: 'one', rect: { x: 400, y: 200, w: 20, h: 140 }, requires: ['a'] },
      { id: 'two', rect: { x: 700, y: 200, w: 20, h: 140 }, requires: ['a', 'b'] },
    ],
  };
}
function piece(id: number, mineral: Mineral, x: number, y: number): Piece {
  return { id, mineral, x, y, vx: 0, vy: 0, age: 0, resting: false };
}
function flying(c: Chamber, x: number, activated: string[] = []): State {
  return { ...initialState(c), x, phase: 'flying', departing: null, vx: 100, slots: ['east', null], activated };
}

test('Tutorial plate and gate normalize to the campaign device API without changing introductory solutions', () => {
  const c = introLevels[2];
  assert.deepEqual(switchesFor(c), [{ id: 'legacy', mineral: 'north', rect: c.plate }]);
  assert.deepEqual(gatesFor(c), [{ id: 'legacy', rect: c.gate, requires: ['legacy'] }]);
  const g = new BallastSession(c);
  g.act({ type: 'load', slot: 0, mineral: 'north' }); g.act({ type: 'load', slot: 1, mineral: 'east' }); g.act({ type: 'launch' });
  while (g.state.x < 350 && g.state.phase === 'flying') g.step();
  g.act({ type: 'eject', slot: 0 });
  for (let i = 0; i < 900 && g.state.phase === 'flying'; i++) g.step();
  assert.equal(g.state.phase, 'won'); assert.equal(g.state.gateOpen, true);
  assert.deepEqual(g.state.activated, ['legacy']);
});

test('Each switch accepts only its own directional mineral and never accepts the capsule', () => {
  const directions: Mineral[] = ['north', 'east', 'south', 'west'];
  for (const required of directions) for (const offered of directions) {
    const c = fixture(); c.gates = []; c.switches = [{ id: 'target', mineral: required, rect: { x: 460, y: 250, w: 40, h: 40 } }];
    const state = { ...initialState(c), pieces: [piece(0, offered, 480, 270)] };
    const next = step(c, state);
    assert.deepEqual(next.activated, required === offered ? ['target'] : []);
    assert.equal(next.pieces[0].resting, true, 'wrong minerals are caught without activating');
    assert.deepEqual(step(c, flying(c, 480)).activated, [], 'the core cannot power a switch');
  }
});

test('Prerequisites use the tick-start state, independent of piece and switch array order', () => {
  const c = fixture(), parent = piece(0, 'north', 320, 90), child = piece(1, 'south', 620, 450);
  const first = step(c, { ...initialState(c), pieces: [parent, child] });
  const reversed = step({ ...c, switches: [...c.switches!].reverse() }, { ...initialState(c), pieces: [child, parent] });
  assert.deepEqual(first.activated, ['a']); assert.deepEqual(reversed.activated, ['a']);
  assert.equal(first.pieces.find(p => p.id === 1)!.resting, true);
  assert.deepEqual(step(c, first).activated, ['a'], 'an early caught piece does not activate later');
  const correct = step(c, { ...first, pieces: [piece(2, 'south', 620, 450)] });
  assert.deepEqual(correct.activated, ['a', 'b']);
  assert.deepEqual(step(c, correct).activated, ['a', 'b'], 'campaign state does not gain a spurious legacy switch');
});

test('Each gate checks all of its own requirements and only closed gates collide', () => {
  const c = fixture(), [first, second] = gatesFor(c);
  const one = { activated: ['a'], gateOpen: false };
  assert.equal(gateIsOpen(first, one), true); assert.equal(gateIsOpen(second, one), false);
  assert.equal(step(c, flying(c, 383, ['a'])).phase, 'flying');
  const hit = step(c, flying(c, 683, ['a']));
  assert.equal(hit.phase, 'crashed'); assert.match(hit.reason, /gate.*closed/);
  assert.equal(step(c, flying(c, 683, ['a', 'b'])).phase, 'flying');
  const loose = { ...initialState(c), activated: ['a'], pieces: [piece(0, 'east', 398, 270), piece(1, 'east', 698, 270)] };
  const result = step(c, loose);
  assert.equal(result.pieces[0].resting, false); assert.equal(result.pieces[1].resting, true);
});

test('A switch can open its gate for the capsule in the same deterministic step', () => {
  const c = fixture();
  const before = { ...flying(c, 383), pieces: [piece(0, 'north', 320, 90)] };
  const after = step(c, before);
  assert.deepEqual(after.activated, ['a']); assert.equal(after.phase, 'flying');
  assert.deepEqual(before.activated, []); assert.equal(before.pieces[0].resting, false);
});

test('The receiver requires all switches unless the chamber explicitly chooses a subset', () => {
  const c = fixture(); c.gates = [];
  const locked = step(c, flying(c, 770, ['a']));
  assert.equal(locked.phase, 'crashed'); assert.match(locked.reason, /required switch/);
  assert.equal(step(c, flying(c, 770, ['a', 'b'])).phase, 'won');
  assert.equal(step({ ...c, requiredSwitches: ['a'] }, flying(c, 770, ['a'])).phase, 'won');
  assert.equal(step({ ...c, requiredSwitches: [] }, flying(c, 770)).phase, 'won');
});

test('Dock supplies validate new loads while allowing carried minerals and emptying either slot', () => {
  const c = fixture(); c.docks[0].minerals = ['north', 'east']; c.docks[1].minerals = ['west'];
  const g = new BallastSession(c);
  assert.deepEqual(availableMinerals(c, g.state), ['north', 'east']);
  assert.equal(g.act({ type: 'load', slot: 0, mineral: 'south' }), false);
  assert.equal(g.act({ type: 'load', slot: 0, mineral: 'north' }), true);
  g.state = { ...g.state, dock: 1 };
  assert.deepEqual(g.state.slots, ['north', null], 'refitting does not confiscate carried minerals');
  assert.deepEqual(availableMinerals(c, g.state), ['west']);
  assert.equal(g.act({ type: 'load', slot: 1, mineral: 'east' }), false);
  assert.equal(g.act({ type: 'load', slot: 1, mineral: 'west' }), true);
  assert.equal(g.act({ type: 'load', slot: 0, mineral: null }), true);
  const supplies = availableMinerals(c, g.state); supplies.push('south');
  assert.deepEqual(c.docks[1].minerals, ['west'], 'supply reads cannot mutate authored levels');
  assert.equal(transition(g.state, { type: 'load', slot: 0, mineral: 'east' }, c), g.state);
});

test('Retry restores the exact refit checkpoint, including switch progress, cargo, and loose pieces', () => {
  const c = fixture(), g = new BallastSession(c);
  g.state = { ...g.state, activated: ['a'], pieces: [piece(4, 'south', 500, 400)], nextPiece: 5 };
  g.act({ type: 'load', slot: 0, mineral: 'east' });
  const checkpoint = structuredClone(g.state);
  assert.equal(g.act({ type: 'launch' }), true);
  for (let i = 0; i < 600 && g.state.phase === 'flying'; i++) g.step();
  assert.equal(g.state.phase, 'crashed');
  g.retry(); assert.deepEqual(g.state, checkpoint);
  g.state.activated.push('b'); g.state.pieces[0].x = 999;
  g.retry(); assert.deepEqual(g.state, checkpoint, 'retry snapshots remain independent');
  g.restart(); assert.deepEqual(g.state, initialState(c));
});

test('Forecasts use campaign gates, preserve input state, and match a complete live simulation', () => {
  const c = fixture(), g = new BallastSession(c);
  g.state = { ...g.state, activated: ['a', 'b'] };
  g.act({ type: 'load', slot: 0, mineral: 'east' });
  const before = structuredClone(g.state), predicted = forecast(c, g.state);
  assert.deepEqual(g.state, before);
  g.act({ type: 'launch' });
  for (let i = 0; i < 900 && g.state.phase === 'flying'; i++) g.step();
  assert.equal(g.state.phase, 'won'); assert.equal(predicted.outcome, 'won');
  assert.deepEqual(predicted.points.at(-1), { x: g.state.x, y: g.state.y });
  const blocked = forecast(c, { ...before, activated: ['a'], gateOpen: false });
  assert.equal(blocked.outcome, 'crashed');
  const current = flying(c, 500, ['a']); current.slots = ['east', 'south'];
  const untouched = structuredClone(current), release = releaseForecast(c, current, 1);
  assert.deepEqual(current, untouched); assert.equal(release.released!.mineral, 'south');
  assert.ok(release.capsule.length > 1); assert.ok(release.released!.points.length > 1);
});

test('Reset refit recovers a carried mineral that was overwritten at a dock without replacement stock', () => {
  const c = fixture(); c.switches = []; c.gates = [];
  c.docks = [c.docks[0], { x: 360, y: 270, r: 40, name: 'Restricted refit', minerals: ['north'] }, c.docks[1]];
  const g = new BallastSession(c); g.state.activated = ['earlier-switch'];
  g.act({ type: 'load', slot: 0, mineral: 'east' }); g.act({ type: 'launch' });
  assert.equal(g.resetRefit(), false, 'refit resets cannot alter a moving core');
  for (let i = 0; i < 900 && g.state.phase === 'flying'; i++) g.step();
  assert.equal(g.state.phase, 'docked'); assert.equal(g.state.dock, 1);
  const arrived = structuredClone(g.state);
  assert.equal(g.act({ type: 'load', slot: 0, mineral: 'north' }), true);
  assert.equal(g.act({ type: 'load', slot: 0, mineral: 'east' }), false, 'the dock cannot supply the lost mineral');
  g.act({ type: 'launch' });
  for (let i = 0; i < 900 && g.state.phase === 'flying'; i++) g.step();
  assert.equal(g.state.phase, 'crashed'); assert.equal(g.resetRefit(), false);
  g.retry(); assert.deepEqual(g.state.slots, ['north', null], 'ordinary retry retains the attempted loadout');
  assert.equal(g.resetRefit(), true); assert.deepEqual(g.state, arrived);
  g.state.slots[0] = null; g.state.activated.push('modified');
  g.resetRefit(); assert.deepEqual(g.state, arrived, 'arrival snapshots do not mutate with refit edits');
  g.restart(); g.act({ type: 'load', slot: 0, mineral: 'north' }); g.resetRefit();
  assert.deepEqual(g.state, initialState(c), 'restart also resets the first-dock arrival');
});

test('Previous dock rewinds successful legs and their switch progress without duplicating failed retries', () => {
  const c = fixture(); c.switches = []; c.gates = [];
  c.docks = [c.docks[0], { x: 330, y: 270, r: 35, name: 'One' }, { x: 600, y: 270, r: 35, name: 'Two' }, c.docks[1]];
  const g = new BallastSession(c);
  const arrive = () => { g.act({ type: 'launch' }); for (let i = 0; i < 900 && g.state.phase === 'flying'; i++) g.step(); assert.equal(g.state.phase, 'docked'); };
  assert.equal(g.canGoBack(), false); assert.equal(g.previousDock(), false);
  g.act({ type: 'load', slot: 0, mineral: 'east' }); g.state.activated = ['a']; const first = structuredClone(g.state);
  arrive(); assert.equal(g.state.dock, 1); assert.equal(g.canGoBack(), true);
  const firstArrival = structuredClone(g.state);
  g.state.activated = ['a', 'b']; const second = structuredClone(g.state);
  arrive(); assert.equal(g.state.dock, 2);
  g.state.activated = ['a', 'b', 'c'];
  assert.equal(g.previousDock(), true); assert.deepEqual(g.state, second, 'downstream activation is rewound');
  g.resetRefit(); assert.deepEqual(g.state, firstArrival, 'the earlier incoming cargo is recovered too');
  g.act({ type: 'load', slot: 0, mineral: 'north' }); g.act({ type: 'launch' });
  assert.equal(g.previousDock(), false, 'moving cores must retry before rewinding a dock');
  for (let i = 0; i < 900 && g.state.phase === 'flying'; i++) g.step();
  assert.equal(g.state.phase, 'crashed'); g.retry(); g.act({ type: 'launch' }); g.retry();
  assert.equal(g.previousDock(), true); assert.deepEqual(g.state, first);
  assert.equal(g.canGoBack(), false); assert.equal(g.previousDock(), false, 'failed retries do not manufacture dock history');
  arrive(); assert.equal(g.canGoBack(), true); g.restart(); assert.equal(g.canGoBack(), false);
});
