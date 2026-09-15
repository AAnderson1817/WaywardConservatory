import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BallastSession, chambers, initialState, transition, step, force, forecast, releaseForecast, minerals, WORLD, touches } from '../src/games/ballast/model.ts';
import type { Mineral } from '../src/games/ballast/model.ts';
import { parseSave } from '../src/shared/save.ts';

function load(g: BallastSession, a: Mineral | null, b: Mineral | null = null) { g.act({ type: 'load', slot: 0, mineral: a }); g.act({ type: 'load', slot: 1, mineral: b }); }
function fly(g: BallastSession, releaseX?: number, direction: 'east' | 'west' = 'east') {
  g.act({ type: 'launch' }); let released = false; let releasedAt: number | undefined;
  for (let i = 0; i < 1800 && g.state.phase === 'flying'; i++) {
    if (releaseX !== undefined && !released && (direction === 'east' ? g.state.x >= releaseX : g.state.x <= releaseX)) { assert.ok(g.act({ type: 'eject', slot: 0 })); released = true; releasedAt = g.state.ticks; }
    g.step(); assert.ok(Math.hypot(g.state.vx, g.state.vy) <= WORLD.maxSpeed + 1e-8);
  }
  return releasedAt;
}
test('Three complete Ballast routes use single pulls, combined pulls, and a released switch mineral', () => {
  const results = [];
  for (let i = 0; i < 3; i++) {
    const g = new BallastSession(chambers[i]); load(g, i ? 'north' : 'east', i ? 'east' : null); fly(g, i === 2 ? 350 : undefined);
    if (i < 2) { assert.equal(g.state.phase, 'docked'); assert.equal(g.state.dock, 1); assert.equal(g.state.vx, 0); assert.equal(g.state.vy, 0); load(g, i ? 'east' : 'north'); fly(g); }
    assert.equal(g.state.phase, 'won'); if (i === 2) { assert.equal(g.state.gateOpen, true); assert.equal(g.state.ejections, 1); }
    results.push({ chamber: i + 1, ticks: g.state.ticks, seconds: +(g.state.ticks * WORLD.dt).toFixed(2), launches: g.state.launches, ejections: g.state.ejections });
  }
  console.log('BALLAST ROUTES', JSON.stringify(results));
});
test('All 25 socket combinations obey vector addition, capped speed, and dock-only refitting', () => {
  const choices = [null, ...minerals.map(m => m.id)];
  for (const a of choices) for (const b of choices) {
    const g = new BallastSession(chambers[0]); load(g, a, b);
    const f = force([a, b]); const before = structuredClone(g.state);
    const canLaunch = g.act({ type: 'launch' }); assert.equal(canLaunch, f.x !== 0 || f.y !== 0);
    if (!canLaunch) { assert.deepEqual(g.state, before); continue; }
    assert.equal(g.act({ type: 'load', slot: 0, mineral: 'west' }), false);
    for (let n = 0; n < 300 && g.state.phase === 'flying'; n++) { g.step(); assert.ok(Math.hypot(g.state.vx, g.state.vy) <= WORLD.maxSpeed + 1e-8); }
  }
});
test('The second chamber cannot reach its refit dock with any single mineral', () => {
  for (const m of minerals) { const g = new BallastSession(chambers[1]); load(g, m.id); fly(g); assert.equal(g.state.phase, 'crashed'); }
});
test('Ejection removes one force without a thruster impulse; released material keeps its force and inertia', () => {
  const g = new BallastSession(chambers[2]); load(g, 'north', 'east'); g.act({ type: 'launch' }); for (let i = 0; i < 120; i++) g.step();
  const before = structuredClone(g.state); assert.ok(g.act({ type: 'eject', slot: 0 }));
  assert.equal(g.state.vx, before.vx); assert.equal(g.state.vy, before.vy); assert.deepEqual(force(g.state.slots), { x: 1, y: 0 });
  const piece = g.state.pieces[0]; assert.equal(piece.mineral, 'north'); assert.equal(piece.vx, before.vx); assert.equal(piece.vy, before.vy);
  g.step(); assert.ok(g.state.vy < 0 && g.state.vy > before.vy, 'northward drift decays gradually'); assert.ok(g.state.pieces[0].y < piece.y); assert.equal(g.act({ type: 'eject', slot: 0 }), false);
});
test('The switch rejects the capsule and wrong material; the closed gate blocks passage', () => {
  const c = chambers[2];
  const start = { ...initialState(c), x: 400, y: 70, phase: 'flying' as const, slots: ['north', null] as ['north', null], departing: null };
  let core = start; for (let i = 0; i < 100; i++) core = step(c, core) as typeof core;
  assert.equal(core.gateOpen, false); assert.equal(core.phase, 'crashed');
  const wrong = { ...initialState(c), pieces: [{ x: 400, y: 50, vx: 0, vy: -100, mineral: 'east' as const, resting: false, age: 0, id: 0 }] };
  assert.equal(step(c, wrong).gateOpen, false);
  const blocked = { ...initialState(c), x: 635, y: 150, vx: 140, vy: 0, phase: 'flying' as const, slots: ['east', null] as ['east', null], departing: null };
  let s = blocked; for (let i = 0; i < 10; i++) s = step(c, s) as typeof s;
  assert.equal(s.phase, 'crashed'); assert.match(s.reason, /gate/);
});
test('Marked third-chamber release bay provides a broad successful input interval', () => {
  const bay = chambers[2].releaseBay!; const samples = [];
  for (let x = bay.x; x <= bay.x + bay.w; x += 5) { const g = new BallastSession(chambers[2]); load(g, 'north', 'east'); fly(g, x); assert.equal(g.state.phase, 'won', `release x=${x}`); samples.push(x); }
  console.log('RELEASE WINDOW', JSON.stringify({ from: samples[0], to: samples.at(-1), samples: samples.length, approximateSeconds: +(bay.w / (WORLD.acceleration / WORLD.drag)).toFixed(2) }));
});
test('Forecast agrees with simulation; physics is deterministic and does not mutate prior snapshots', () => {
  for (let i = 0; i < 3; i++) {
    const a = new BallastSession(chambers[i]), b = new BallastSession(chambers[i]); load(a, i ? 'north' : 'east', i ? 'east' : null); load(b, i ? 'north' : 'east', i ? 'east' : null);
    const prior = structuredClone(a.state), prediction = forecast(chambers[i], a.state); assert.deepEqual(a.state, prior);
    fly(a); fly(b); assert.deepEqual(a.state, b.state); assert.equal(prediction.outcome, a.state.phase); assert.deepEqual(prediction.points.at(-1), { x: a.state.x, y: a.state.y });

  }
});
test('Ejection previews reproduce both real trajectories for two seconds without changing the live state', () => {
  const c = chambers[2], g = new BallastSession(c); load(g, 'north', 'east'); g.act({ type: 'launch' });
  while (g.state.x < 350) g.step();
  for (const slot of [0, 1]) {
    const before = structuredClone(g.state), predicted = releaseForecast(c, g.state, slot);
    let actual = transition(before, { type: 'eject', slot });
    const pieceId = before.nextPiece, piece = actual.pieces.find(p => p.id === pieceId)!;
    const capsule = [{ x: actual.x, y: actual.y }], points = [{ x: piece.x, y: piece.y }];
    for (let tick = 1; tick <= 120; tick++) {
      actual = step(c, actual);
      if (tick % 6 === 0 || actual.phase !== 'flying') {
        capsule.push({ x: actual.x, y: actual.y });
        const moved = actual.pieces.find(p => p.id === pieceId);
        if (moved) points.push({ x: moved.x, y: moved.y });
      }
      if (actual.phase !== 'flying') break;
    }
    assert.deepEqual(predicted, { capsule, released: { mineral: piece.mineral, points }, outcome: actual.phase });
    assert.deepEqual(g.state, before); assert.ok(predicted.capsule.length <= 21);
    if (slot === 0) assert.equal(actual.gateOpen, true, 'the preview uses the same released-mineral switch interaction');
  }
  const idle = initialState(c); assert.equal(releaseForecast(c, idle, 0).released, null);
  assert.equal(releaseForecast(c, g.state, 2).released, null);
  const ejected = transition(g.state, { type: 'eject', slot: 0 }); assert.equal(releaseForecast(c, ejected, 0).released, null);
});

test('Failure retries the current leg from its loadout, and restart resets the full chamber', () => {
  const g = new BallastSession(chambers[0]); load(g, 'east'); fly(g); load(g, 'south'); const dock = structuredClone(g.state); fly(g); assert.equal(g.state.phase, 'crashed');
  g.retry(); assert.deepEqual(g.state, dock); load(g, 'north'); fly(g); assert.equal(g.state.phase, 'won');
  g.restart(); assert.deepEqual(g.state, initialState(chambers[0]));
  load(g, 'east'); g.act({ type: 'launch' }); g.act({ type: 'eject', slot: 0 }); for (let i = 0; i < 300; i++) g.step(); assert.equal(g.state.phase, 'crashed'); assert.match(g.state.reason, /No pull/);
});
test('Collision boundaries include the capsule radius and detect hazard corners', () => {
  assert.equal(touches({ x: 90, y: 90 }, 15, { x: 100, y: 100, w: 50, h: 50 }), true);
  assert.equal(touches({ x: 85, y: 85 }, 15, { x: 100, y: 100, w: 50, h: 50 }), false);
});
test('Failure reasons identify the closed gate, an obstacle, or the outer frame', () => {
  const c = chambers[2];
  const start = { ...initialState(c), phase: 'flying' as const, departing: null, vx: 140, vy: 0, slots: ['east', null] as ['east', null] };
  assert.match(step(c, { ...start, x: 638, y: 150 }).reason, /gate.*closed/);
  assert.match(step(c, { ...start, x: 293, y: 400 }).reason, /obstacle/);
  assert.match(step(c, { ...start, x: 919, y: 300 }).reason, /outer frame/);
});
test('Legacy saves preserve Adjacent; Ballast completion is validated and independent', () => {
  const save = parseSave(JSON.stringify({ version: 1, muted: true, reduced: true, completed: [0, 1, 2] }));
  assert.deepEqual(save.ballastCompleted, []); assert.deepEqual(save.completed, [0, 1, 2]); assert.equal(save.muted, true);
  const both = parseSave(JSON.stringify({ ...save, ballastCompleted: [0, 0, 2, -1, 3, 11, 12, '1'] })); assert.deepEqual(both.ballastCompleted, [0, 2, 3, 11]); assert.deepEqual(both.completed, [0, 1, 2]);
});
