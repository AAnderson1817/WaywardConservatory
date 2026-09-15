import { experiencedPlayer } from './guide-fixture.mjs';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { BallastSession, chambers, switchesFor } from '../src/games/ballast/model.ts';
import { foundationRoutes } from './ballast-foundation-routes.ts';
import { advancedRoutes } from './ballast-advanced-routes.ts';

const url = process.env.WAYWARD_URL || 'http://127.0.0.1:4173';
const selection = (process.env.WAYWARD_LEVELS || '1,2,3,4,5,6,7,8,9,10,11,12').split(',').map(Number);
const tag = selection.length === 12 ? 'all' : selection.join('-');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await context.addInitScript(() => { if (!localStorage.getItem('wayward-conservatory-v1')) localStorage.setItem('wayward-conservatory-v1', JSON.stringify({ version: 1, ballastEdition: 2, ballastStamp: false, completed: [0, 1, 2], ballastCompleted: [], muted: true, reduced: false })); });
const page = await context.newPage();
await experiencedPlayer(page);
const report = { url, passed: false, levels: [], layouts: [], checks: [], errors: [] };
page.on('pageerror', e => report.errors.push(e.message));
page.on('console', e => { if (e.type() === 'error') report.errors.push(e.text()); });
page.on('response', r => { if (r.status() >= 400) report.errors.push(`${r.status()} ${r.url()}`); });
const routes = [
  [{ load: ['east', null], releases: [], arrive: 1 }, { load: ['north', null], releases: [], arrive: 2 }],
  [{ load: ['north', 'east'], releases: [], arrive: 1 }, { load: ['east', null], releases: [], arrive: 2 }],
  [{ load: ['north', 'east'], releases: [{ slot: 0, axis: 'x', op: '>=', value: 350 }], arrive: 1 }],
  ...foundationRoutes,
  ...advancedRoutes.map(route => route.map(leg => ({ load: leg.slots, releases: leg.release ? [{ slot: leg.release.slot, axis: leg.release.axis, op: leg.release.direction === 1 ? '>=' : '<=', value: leg.release.at }] : [], arrive: leg.dock, wait: leg.wait }))),
];

// This simulation checks the fixture before testing it through actual browser controls.
function expectedRoute(index) {
  const session = new BallastSession(chambers[index]);
  const expected = [];
  for (const leg of routes[index]) {
    for (let slot = 0; slot < 2; slot++) if (session.state.slots[slot] !== leg.load[slot]) assert.ok(session.act({ type: 'load', slot, mineral: leg.load[slot] }));
    assert.ok(session.act({ type: 'launch' }));
    let release = 0;
    for (let tick = 0; tick < 2400 && session.state.phase === 'flying'; tick++) {
      const r = leg.releases[release];
      if (r && (r.op === '>=' ? session.state[r.axis] >= r.value : session.state[r.axis] <= r.value)) { assert.ok(session.act({ type: 'eject', slot: r.slot })); release++; }
      session.step();
    }
    assert.notEqual(session.state.phase, 'crashed', `fixture ${index + 1}: ${session.state.reason}`);
    assert.equal(session.state.dock, leg.arrive);
    for (let tick = 0; tick < (leg.wait ?? 0); tick++) session.step();
    expected.push({ flags: [...session.state.activated], slots: [...session.state.slots] });
  }
  assert.equal(session.state.phase, 'won', `fixture ${index + 1} incomplete`);
  return expected;
}
async function loadPair(pair) {
  for (let slot = 0; slot < 2; slot++) {
    if ((await page.locator(`#b-slot-${slot}`).getAttribute('data-mineral')) === (pair[slot] ?? '')) continue;
    await page.locator(`#b-slot-${slot}`).click();
    await page.locator(pair[slot] ? `#b-load-${pair[slot]}` : '#b-empty').click();
  }
}
async function layout(label) {
  const result = await page.evaluate(() => {
    const bad = [...document.querySelectorAll('.b-tabs button,.b-heading,.b-chamber,.b-panel,.b-controls,.modal button')].filter(e => {
      const r = e.getBoundingClientRect(); return r.width && r.height && (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1);
    }).map(e => e.textContent.slice(0, 50));
    const p = document.querySelector('.b-panel');
    return { size: [innerWidth, innerHeight], bad, scroll: document.documentElement.scrollHeight > innerHeight || document.documentElement.scrollWidth > innerWidth, panelOverflow: p.scrollHeight > p.clientHeight + 2 };
  });
  assert.deepEqual(result.bad, [], label); assert.equal(result.scroll, false, label); assert.equal(result.panelOverflow, false, label);
  report.layouts.push({ label, ...result });
}

try {
  assert.equal(chambers.length, 12); assert.equal(routes.length, 12);
  await page.goto(url); await page.locator('#station-02').click();
  assert.equal(await page.locator('.b-tabs button').count(), 12);
  for (const level of selection) {
    const index = level - 1, expected = expectedRoute(index);
    if (await page.locator('.modal').count()) { await page.locator('.modal [data-b-action="hub"]').click(); await page.locator('#station-02').click(); }
    await page.locator(`#b-challenge-${index}`).click();
    await page.setViewportSize({ width: level >= 6 ? 652 : 1280, height: level >= 6 ? 698 : 720 });
    await layout(`level-${level}-start`);
    if ([4, 6, 9, 12].includes(level)) await page.screenshot({ path: `artifacts/ballast-campaign-level-${level}.png`, animations: 'disabled' });
    const began = Date.now(), releases = [];
    for (const [legIndex, leg] of routes[index].entries()) {
      await loadPair(leg.load);
      await page.locator('#b-launch').click();
      for (const release of leg.releases) {
        await page.waitForFunction(r => {
          const node = document.querySelector('#b-capsule');
          if (node.getAttribute('data-phase') !== 'flying') return true;
          const [x, y] = node.getAttribute('transform').match(/[-\d.]+/g).map(Number), value = r.axis === 'x' ? x : y;
          return r.op === '>=' ? value >= r.value : value <= r.value;
        }, release, { timeout: 18000 });
        assert.equal(await page.locator('#b-capsule').getAttribute('data-phase'), 'flying', `level ${level} leg ${legIndex + 1} stopped before release`);
        await page.keyboard.press('Escape');
        const where = await page.locator('#b-capsule').getAttribute('transform');
        await page.locator(`#b-preview-${release.slot}`).click();
        assert.ok((await page.locator('#b-preview-core').getAttribute('d')).length > 10);
        await page.locator('#b-release').click(); releases.push({ leg: legIndex + 1, slot: release.slot, where });
      }
      await page.waitForFunction(() => document.querySelector('#b-capsule').getAttribute('data-phase') !== 'flying', null, { timeout: 18000 });
      const final = legIndex === routes[index].length - 1;
      assert.equal(await page.locator('#b-capsule').getAttribute('data-phase'), final ? 'won' : 'docked', `level ${level} leg ${legIndex + 1}: ${await page.locator('.modal').allTextContents()}`);
      if (!final) assert.equal(await page.locator(`#b-dock-${leg.arrive}.docked`).count(), 1);
      await page.waitForFunction(flags => flags.every(id => [...document.querySelectorAll('[data-relay]')].some(e => e.getAttribute('data-relay') === id && e.classList.contains('active'))), expected[legIndex].flags, { timeout: 7000 });
    }
    await page.locator('#b-next').waitFor();
    assert.equal(await page.locator('[data-relay].active').count(), switchesFor(chambers[index]).length);
    report.levels.push({ level, title: chambers[index].title, launches: routes[index].length, releases, milliseconds: Date.now() - began });
    console.log(`PASS level ${level}: ${chambers[index].title}, ${routes[index].length} launches, ${releases.length} releases`);
  }
  await page.locator('.modal [data-b-action="hub"]').click(); await page.reload(); await page.locator('#station-02').waitFor();
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('wayward-conservatory-v1')));
  assert.deepEqual([...save.ballastCompleted].sort((a, b) => a - b), selection.map(n => n - 1).sort((a, b) => a - b));
  assert.equal(save.ballastEdition, 2); assert.equal(save.ballastStamp, selection.length === 12);
  assert.deepEqual(save.completed, [0, 1, 2]);
  report.checks.push('Every played level persists independently; the new stamp requires all twelve and Adjacent progress survives');
  assert.deepEqual(report.errors, []); report.passed = true;
} catch (error) { report.error = error.stack; await page.screenshot({ path: `artifacts/ballast-campaign-${tag}-failure.png`, animations: 'disabled' }); throw error; }
finally { await writeFile(`artifacts/ballast-campaign-${tag}-report.json`, JSON.stringify(report, null, 2)); await browser.close(); }
