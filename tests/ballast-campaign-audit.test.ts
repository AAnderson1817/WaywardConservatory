import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BallastSession, chambers, initialState, transition, step, switchesFor, gatesFor, availableMinerals, touches, WORLD } from '../src/games/ballast/model.ts';
import type { Chamber, Mineral, State } from '../src/games/ballast/model.ts';
import { foundationRoutes } from './ballast-foundation-routes.ts';
import { advancedRoutes } from './ballast-advanced-routes.ts';

type Release = { slot: number; axis: 'x' | 'y'; value: number; direction: 1 | -1 };
type Leg = { slots: [Mineral | null, Mineral | null]; releases: Release[]; destination: number; wait: number };
const routes: Leg[][] = [
  ...foundationRoutes.map(route => route.map(leg => ({ slots: leg.load, destination: leg.arrive, wait: 0, releases: leg.releases.map(r => ({ slot: r.slot, axis: r.axis, value: r.value, direction: r.op === '>=' ? 1 as const : -1 as const })) }))),
  ...advancedRoutes.map(route => route.map(leg => ({ slots: leg.slots, destination: leg.dock, wait: leg.wait ?? 0, releases: leg.release ? [{ slot: leg.release.slot, axis: leg.release.axis, value: leg.release.at, direction: leg.release.direction }] : [] }))),
];

function follow(chamber: Chamber, route: Leg[], changedLeg = -1, change: 'omit' | 'swap' = 'omit') {
  const g = new BallastSession(chamber);
  for (const [index, leg] of route.entries()) {
    for (const slot of [0, 1]) if (g.state.slots[slot] !== leg.slots[slot] && !g.act({ type: 'load', slot, mineral: leg.slots[slot] })) return g;
    if (!g.act({ type: 'launch' })) return g;
    const released = new Set<number>();
    for (let ticks = 0; ticks < 1400 && g.state.phase === 'flying'; ticks++) {
      for (const [i, release] of leg.releases.entries()) if (!released.has(i) && (g.state[release.axis] - release.value) * release.direction >= 0) {
        released.add(i);
        if (index !== changedLeg || change !== 'omit') g.act({ type: 'eject', slot: index === changedLeg ? 1 - release.slot : release.slot });
      }
      g.step();
    }
    if (g.state.phase === 'crashed' || g.state.dock !== leg.destination || g.state.phase === 'flying') return g;
    for (let tick = 0; tick < leg.wait; tick++) g.step();
  }
  return g;
}

test('The twelve-level campaign has valid device dependencies and safe, unambiguous docks', () => {
  assert.equal(chambers.length, 12); assert.equal(routes.length, 9);
  let previousCount = 1;
  for (const [index, c] of chambers.entries()) {
    const switches = switchesFor(c), gates = gatesFor(c), ids = switches.map(s => s.id);
    assert.equal(new Set(ids).size, ids.length, `level ${index + 1}: switch IDs are unique`);
    assert.equal(new Set(gates.map(g => g.id)).size, gates.length, `level ${index + 1}: gate IDs are unique`);
    const visit = (id: string, ancestors: string[] = []): void => {
      assert.ok(ids.includes(id), `level ${index + 1}: unknown switch ${id}`);
      assert.ok(!ancestors.includes(id), `level ${index + 1}: cyclic prerequisite ${[...ancestors, id]}`);
      for (const requirement of switches.find(s => s.id === id)!.requires ?? []) visit(requirement, [...ancestors, id]);
    };
    for (const id of ids) visit(id);
    for (const g of gates) for (const requirement of g.requires) assert.ok(ids.includes(requirement), `level ${index + 1}: gate ${g.id} references ${requirement}`);
    for (const [dockIndex, dock] of c.docks.entries()) {
      assert.ok(dock.r >= WORLD.radius + 8, `level ${index + 1}: dock ${dockIndex} has a forgiving capture radius`);
      assert.ok(dock.x >= WORLD.inset + WORLD.radius && dock.x <= WORLD.width - WORLD.inset - WORLD.radius);
      assert.ok(dock.y >= WORLD.inset + WORLD.radius && dock.y <= WORLD.height - WORLD.inset - WORLD.radius);
      for (const rect of [...c.walls, ...gates.map(g => g.rect), ...switches.map(s => s.rect)]) assert.equal(touches(dock, WORLD.radius, rect), false, `level ${index + 1}: dock ${dockIndex} overlaps a physical device`);
      for (const other of c.docks.slice(dockIndex + 1)) assert.ok(Math.hypot(dock.x - other.x, dock.y - other.y) > dock.r + other.r, `level ${index + 1}: overlapping dock capture fields`);
    }
    if (index >= 3) {
      assert.deepEqual([...(c.requiredSwitches ?? ids)].sort(), [...ids].sort(), `level ${index + 1}: every authored switch contributes to delivery`);
      assert.ok(ids.length >= previousCount, `level ${index + 1}: required releases should not drop`);
      previousCount = ids.length;
    }
  }
});

test('Every authored release is consequential: omitting it or ejecting the other socket cannot complete that route', () => {
  for (const [index, route] of routes.entries()) {
    const c = chambers[index + 3];
    assert.equal(follow(c, route).state.phase, 'won', `level ${index + 4}: baseline route must work before negative tests`);
    for (const [leg, instruction] of route.entries()) if (instruction.releases.length) for (const change of ['omit', 'swap'] as const) {
      assert.notEqual(follow(c, route, leg, change).state.phase, 'won', `level ${index + 4}: ${change} release at leg ${leg + 1}`);
    }
  }
});

test('No sequence of refits and uninterrupted launches bypasses the campaign release puzzles', () => {
  for (const [index, c] of chambers.slice(3).entries()) {
    const queue: State[] = [initialState(c)], visited = new Set<string>();
    while (queue.length) {
      const atDock = queue.shift()!, key = `${atDock.dock}:${atDock.slots.join('/')}`;
      if (visited.has(key)) continue; visited.add(key);
      const choices = [null, ...new Set([...availableMinerals(c, atDock), ...atDock.slots.filter((id): id is Mineral => id !== null)])];
      for (const a of choices) for (const b of choices) {
        let s = atDock, legal = true;
        for (const [slot, mineral] of [a, b].entries()) if (s.slots[slot] !== mineral) {
          const changed = transition(s, { type: 'load', slot, mineral }, c);
          if (changed === s) { legal = false; break; } s = changed;
        }
        if (!legal) continue;
        s = transition(s, { type: 'launch' }, c); if (s.phase !== 'flying') continue;
        for (let tick = 0; tick < 1000 && s.phase === 'flying'; tick++) s = step(c, s);
        assert.notEqual(s.phase, 'won', `level ${index + 4}: uninterrupted ${a}/${b} from dock ${atDock.dock}`);
        if (s.phase === 'docked') queue.push(s);
      }
      assert.ok(visited.size <= c.docks.length * 25, 'the finite dock/loadout search must terminate');
    }
  }
});

test('A mistaken successful arrival at the first supply puzzle can be rewound without restarting the chamber', () => {
  const g = new BallastSession(chambers[5]);
  g.act({ type: 'load', slot: 0, mineral: 'east' }); g.act({ type: 'load', slot: 1, mineral: 'north' }); g.act({ type: 'launch' });
  while (g.state.phase === 'flying' && g.state.x < 250) g.step();
  g.act({ type: 'eject', slot: 1 });
  for (let tick = 0; tick < 1000 && g.state.phase === 'flying'; tick++) g.step();
  assert.equal(g.state.phase, 'docked'); assert.equal(g.state.dock, 1);
  assert.deepEqual(g.state.slots, ['east', null]); assert.equal(g.act({ type: 'load', slot: 1, mineral: 'north' }), false);
  g.resetRefit(); assert.deepEqual(g.state.slots, ['east', null], 'the lost mineral is absent from the actual arrival');
  assert.equal(g.previousDock(), true); assert.equal(g.state.dock, 0); assert.deepEqual(g.state.slots, ['east', 'north']);
  assert.deepEqual(g.state.activated, []); assert.equal(g.state.pieces.length, 0);
});

test('Rewinding the finale return visits the preceding refit instead of confusing it with the initial launch', () => {
  const route = routes[8], returning = route.findIndex((leg, index) => index > 0 && leg.destination === 0);
  assert.ok(returning >= 0, 'the finale revisits its starting dock');
  const g = follow(chambers[11], route.slice(0, returning + 1));
  assert.equal(g.state.phase, 'docked'); assert.equal(g.state.dock, 0); assert.ok(g.state.launches > 1);
  const flags = [...g.state.activated]; assert.equal(g.canGoBack(), true);
  assert.equal(g.previousDock(), true); assert.equal(g.state.dock, route[returning - 1].destination);
  assert.ok(g.state.launches > 0, 'revisiting the launch does not collapse recovery history to the beginning');
  assert.ok(g.state.activated.length < flags.length, 'the relay activated on the return is rewound with that flight');
});
