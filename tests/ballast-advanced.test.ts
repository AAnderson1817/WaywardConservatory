import assert from 'node:assert/strict';
import test from 'node:test';
import { BallastSession, step, initialState, type State, type Chamber } from '../src/games/ballast/model.ts';
import { advancedLevels } from '../src/games/ballast/levels-advanced.ts';
import { advancedRoutes, advancedWindows, type AdvancedLeg } from './ballast-advanced-routes.ts';

export function runAdvanced(chamber: Chamber, route: AdvancedLeg[], offset = 0, omit = -1) {
  const session = new BallastSession(chamber);
  const checkpoints: { leg: number; dock: number; flags: string[]; slots: State['slots']; ticks: number; release?: { x: number; y: number; ticks: number } }[] = [];
  for (let leg = 0; leg < route.length; leg++) {
    const instruction = route[leg];
    for (const slot of [0, 1]) if (session.state.slots[slot] !== instruction.slots[slot]) {
      assert.ok(session.act({ type: 'load', slot, mineral: instruction.slots[slot] }), `load rejected leg ${leg + 1} slot ${slot}: ${instruction.slots[slot]} at ${session.state.dock}`);
    }
    assert.ok(session.act({ type: 'launch' }), `launch rejected leg ${leg + 1}`);
    let release: { x: number; y: number; ticks: number } | undefined;
    let count = 0;
    while (session.state.phase === 'flying' && count++ < 1400) {
      const r = instruction.release;
      if (r && !release && (session.state[r.axis] - (r.at + offset)) * r.direction >= 0) {
        release = { x: session.state.x, y: session.state.y, ticks: session.state.ticks };
        if (leg !== omit) session.act({ type: 'eject', slot: r.slot });
      }
      session.step();
    }
    if (session.state.phase === 'crashed') return { session, checkpoints, failedLeg: leg, release };
    assert.equal(session.state.dock, instruction.dock, `leg ${leg + 1} arrived at unexpected dock ${session.state.dock}`);
    for (let i = 0; i < (instruction.wait ?? 0); i++) session.step();
    checkpoints.push({ leg, dock: session.state.dock, flags: [...session.state.activated], slots: [...session.state.slots], ticks: session.state.ticks, release });
  }
  return { session, checkpoints, failedLeg: -1 };
}

test('advanced authored routes activate their complete circuits', () => {
  for (let i = 0; i < advancedLevels.length; i++) {
    const result = runAdvanced(advancedLevels[i], advancedRoutes[i]);
    assert.equal(result.session.state.phase, 'won', `level ${i + 9}, leg ${result.failedLeg + 1}: ${JSON.stringify(result.session.state)}; checkpoints ${JSON.stringify(result.checkpoints)}`);
    assert.equal(result.session.state.activated.length, 4);
    assert.equal(result.session.state.launches, [4, 5, 6, 7][i]);
    assert.equal(result.session.state.ejections, [4, 4, 5, 7][i]);
  }
});

test('every advanced release has at least a 0.75-second independently verified window', () => {
  for (let i = 0; i < advancedLevels.length; i++) for (let leg = 0; leg < advancedRoutes[i].length; leg++) {
    const window = advancedWindows[i][leg];
    if (!window) continue;
    const ticks: number[] = [];
    for (let delta = window[0]; delta <= window[1]; delta += 5) {
      const route = structuredClone(advancedRoutes[i]);
      route[leg].release!.at += delta;
      const result = runAdvanced(advancedLevels[i], route);
      assert.equal(result.session.state.phase, 'won', `level ${i + 9}, leg ${leg + 1}, offset ${delta}`);
      ticks.push(result.checkpoints[leg].release!.ticks);
    }
    assert.ok((Math.max(...ticks) - Math.min(...ticks)) / 60 >= 0.75, `level ${i + 9}, leg ${leg + 1} window too short`);
  }
});

test('omitting any authored release prevents its planned route from winning', () => {
  for (let i = 0; i < advancedLevels.length; i++) for (let leg = 0; leg < advancedRoutes[i].length; leg++) {
    if (!advancedRoutes[i][leg].release) continue;
    let won = false;
    try { won = runAdvanced(advancedLevels[i], advancedRoutes[i], 0, leg).session.state.phase === 'won'; } catch {
      // A missed dock or absent carried mineral also invalidates the remaining route.
    }
    assert.equal(won, false, `level ${i + 9}, leg ${leg + 1} release is unnecessary`);
  }
});

test('the final chamber requires a return delivery and a deliberate loadout exchange', () => {
  const chamber = advancedLevels[3];
  const before = new BallastSession(chamber);
  assert.equal(before.act({ type: 'load', slot: 1, mineral: 'east' }), false, 'Sunstone must be obtained away from Launch');
  const result = runAdvanced(chamber, advancedRoutes[3]);
  assert.equal(result.checkpoints[4].dock, 5);
  assert.deepEqual(result.checkpoints[4].slots, ['north', null]);
  assert.equal(result.checkpoints[5].dock, 0);
  assert.deepEqual(result.checkpoints[5].slots, [null, 'east']);
  assert.deepEqual(result.checkpoints[4].flags, ['a', 'b', 'c'], 'the first circuit cannot already activate D');
  assert.deepEqual(result.checkpoints[5].flags, ['a', 'b', 'c', 'd']);
});

test('prerequisite-locked switches cannot be prepared early with the correct mineral', () => {
  for (const chamber of advancedLevels) for (const relay of chamber.switches!) {
    if (!relay.requires?.length) continue;
    for (const missing of relay.requires) {
      const state = initialState(chamber);
      state.activated = relay.requires.filter(id => id !== missing);
      state.pieces = [{ id: 0, x: relay.rect.x + relay.rect.w / 2, y: relay.rect.y + relay.rect.h / 2, vx: 0, vy: 0, mineral: relay.mineral, resting: false, age: 0 }];
      const result = step(chamber, state);
      assert.equal(result.activated.includes(relay.id), false, `${chamber.title} switch ${relay.id} ignored prerequisite ${missing}`);
      assert.equal(result.pieces[0].resting, true, 'locked switch must consume its early delivery');
    }
  }
});
