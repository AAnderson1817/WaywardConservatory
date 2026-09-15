import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BallastSession, WORLD } from '../src/games/ballast/model.ts';
import { foundationLevels } from '../src/games/ballast/levels-foundation.ts';
import { foundationRoutes } from './ballast-foundation-routes.ts';

function play(level: number, varyLeg = -1, value?: number, omit = false, stopAfter = Infinity) {
  const game = new BallastSession(foundationLevels[level]);
  const legs = foundationRoutes[level];
  const traces: { from: number; arrive: number; phase: string; releaseTick: number; releasedAt: { x: number; y: number }; ticks: number }[] = [];
  for (const [i, leg] of legs.entries()) {
    if (game.state.phase !== 'docked' || game.state.dock !== leg.dock) break;
    leg.load.forEach((mineral, slot) => game.act({ type: 'load', slot, mineral }));
    game.act({ type: 'launch' });
    const startTick = game.state.ticks;
    let releaseTick = -1, releasedAt = { x: NaN, y: NaN };
    const release = leg.releases[0], trigger = i === varyLeg && value !== undefined ? value : release.value;
    for (let tick = 0; tick < 1800 && game.state.phase === 'flying'; tick++) {
      if (releaseTick < 0 && !(omit && i === varyLeg) && (release.op === '>=' ? game.state[release.axis] >= trigger : game.state[release.axis] <= trigger)) {
        releaseTick = game.state.ticks - startTick;
        releasedAt = { x: game.state.x, y: game.state.y };
        game.act({ type: 'eject', slot: release.slot });
      }
      game.step();
    }
    traces.push({ from: leg.dock, arrive: game.state.dock, phase: game.state.phase, releaseTick, releasedAt, ticks: game.state.ticks - startTick });
    if (i >= stopAfter) break;
  }
  return { game, traces };
}

test('Levels 4–8 complete the authored relay and retain their escalating release and carry requirements', () => {
  const reports = foundationLevels.map((level, index) => {
    const { game, traces } = play(index);
    assert.equal(game.state.phase, 'won', `${index + 4}: ${game.state.reason}`);
    assert.deepEqual(traces.map(t => t.arrive), foundationRoutes[index].map(l => l.arrive));
    assert.equal(game.state.ejections, [2, 3, 3, 4, 4][index]);
    assert.equal(game.state.activated.length, level.switches!.length);
    assert.equal(level.docks.filter(d => d.minerals).length, [0, 0, 1, 1, 2][index]);
    return { level: index + 4, title: level.title, seconds: +(game.state.ticks * WORLD.dt).toFixed(2), traces };
  });
  console.log('FOUNDATION SOLUTIONS', JSON.stringify(reports));
});

test('Skipping any authored release prevents completion; every middle-act switch is required', () => {
  for (let level = 0; level < foundationLevels.length; level++) {
    for (let leg = 0; leg < foundationRoutes[level].length; leg++) {
      const { game } = play(level, leg, undefined, true);
      assert.notEqual(game.state.phase, 'won', `Level ${level + 4} leg ${leg + 1} was optional`);
      assert.ok(game.state.activated.length < foundationLevels[level].switches!.length);
    }
  }
});

test('All foundation releases have a measured tolerant interval through the complete route', () => {
  const windows = [];
  for (let level = 0; level < foundationLevels.length; level++) {
    for (let leg = 0; leg < foundationRoutes[level].length; leg++) {
      const nominal = foundationRoutes[level][leg].releases[0].value;
      const valid: { value: number; tick: number }[] = [];
      for (let value = nominal - 100; value <= nominal + 100; value += 5) {
        const { game, traces } = play(level, leg, value);
        if (game.state.phase === 'won') valid.push({ value, tick: traces[leg].releaseTick });
      }
      assert.ok(valid.some(v => v.value === nominal));
      const seconds = (Math.max(...valid.map(v => v.tick)) - Math.min(...valid.map(v => v.tick))) * WORLD.dt;
      assert.ok(valid.every((sample, index) => !index || sample.value - valid[index - 1].value === 5), 'The verified interval must be continuous at every sampled release point');
      assert.ok(seconds >= 0.7, `Level ${level + 4} leg ${leg + 1} only offers ${seconds.toFixed(2)} seconds: ${JSON.stringify(valid)}`);
      windows.push({ level: level + 4, leg: leg + 1, from: valid[0].value, to: valid.at(-1)!.value, seconds: +seconds.toFixed(2), samples: valid.length });
    }
  }
  console.log('FOUNDATION RELEASE WINDOWS', JSON.stringify(windows));
});

test('Restricted refits cannot replace the carried mineral that the next leg needs', () => {
  for (const [level, stopAfter, required, slot] of [[2, 0, 'north', 1], [3, 0, 'east', 1], [4, 0, 'north', 1], [4, 1, 'east', 0]] as const) {
    const { game } = play(level, -1, undefined, false, stopAfter);
    assert.equal(game.state.phase, 'docked');
    assert.equal(game.state.slots[slot], required);
    assert.ok(game.act({ type: 'load', slot, mineral: null }));
    assert.equal(game.act({ type: 'load', slot, mineral: required }), false);
  }
});
