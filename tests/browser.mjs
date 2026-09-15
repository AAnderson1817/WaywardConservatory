import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const url = process.env.WAYWARD_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: process.env.WAYWARD_BROWSER || 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();
const failures = [], report = { url, started: new Date().toISOString(), checks: [], solutions: [], layouts: [] };
page.on('pageerror', e => failures.push(e.message));
page.on('console', m => { if (m.type() === 'error') failures.push(m.text()); });
page.on('response', r => { if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`); });
const inspect = () => page.evaluate(() => window.__WAYWARD__.inspect());
const check = (name, detail = true) => { report.checks.push({ name, detail }); console.log(`PASS ${name}`); };
const screenshot = name => page.screenshot({ path: `artifacts/${name}.png` });
async function keyboardActivate(id) {
  for (let n = 0; n < 70; n++) {
    if (await page.evaluate(() => document.activeElement?.id) === id) { await page.keyboard.press('Enter'); return; }
    const backwards = await page.evaluate(targetId => {
      const buttons = [...document.querySelectorAll('button:not(:disabled)')].filter(b => !b.closest('[inert]'));
      return buttons.findIndex(b => b.id === targetId) < buttons.indexOf(document.activeElement);
    }, id);
    await page.keyboard.press(backwards ? 'Shift+Tab' : 'Tab');
  }
  throw new Error(`Keyboard cannot reach ${id}`);
}
async function layout(label) {
  const result = await page.evaluate(() => {
    const bad = [...document.querySelectorAll('button, h1, h2, .room-meta, .game-feedback, .preview, .destinations, .station-text')].filter(e => !e.closest('[inert]')).filter(e => {
      const r = e.getBoundingClientRect(); return r.width && r.height && (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1);
    }).map(e => ({ text: e.textContent.slice(0, 60), rect: e.getBoundingClientRect().toJSON() }));
    const map = document.querySelector('.room-map')?.getBoundingClientRect(), feedback = document.querySelector('.game-feedback')?.getBoundingClientRect();
    const panel = document.querySelector('.instrument-panel');
    return { viewport: [innerWidth, innerHeight], document: [document.documentElement.scrollWidth, document.documentElement.scrollHeight], bad, overlap: !!(map && feedback && map.bottom > feedback.top + 1), panelOverflow: panel ? panel.scrollHeight > panel.clientHeight + 2 : false };
  });
  assert.deepEqual(result.bad, [], `${label}: offscreen content`);
  assert.ok(result.document[0] <= result.viewport[0] && result.document[1] <= result.viewport[1], `${label}: page scroll`);
  assert.equal(result.overlap, false, `${label}: overlapping feedback`);
  assert.equal(result.panelOverflow, false, `${label}: clipped instrument panel`);
  report.layouts.push({ label, ...result });
}
const routes = [
  [{ room: 1 }, { set: 2 }, { room: 5 }, { room: 1 }, { set: 1 }, { room: 0 }],
  [{ room: 1 }, { set: 0 }, { room: 2 }, { set: 2 }, { room: 5 }, { room: 2 }, { set: 0 }, { room: 1 }, { set: 1 }, { room: 0 }],
  [{ room: 4 }, { set: 1 }, { room: 2 }, { set: 1 }, { room: 3 }, { set: 0 }, { room: 4 }, { set: 0 }, { room: 1 }, { set: 2 }, { room: 5 }, { room: 1 }, { set: 0 }, { room: 4 }, { set: 1 }, { room: 0 }],
];
try {
  await mkdir('artifacts', { recursive: true });
  await page.goto(url); await page.locator('#station-01').waitFor();
  assert.equal(await page.locator('.arcade-game').count(), 5);
  for (const id of ['04', '05', '06']) { const choice = page.locator(`#station-${id}`); assert.equal(await choice.getAttribute('aria-disabled'), 'true'); await choice.click({ force: true }); assert.equal((await inspect()).view, 'hub'); assert.equal(await page.locator('.modal').count(), 0); }
  check('All five original station IDs present; unfinished games show locks and cannot launch');
  const allowedText = [
    'The Wayward Conservatory',
    'Adjacent', 'Find your way through rooms connected by temperature.',
    'Ballast', 'Guide a precious core with the pull of unusual minerals.',
    'Borrowed Properties', 'Move useful properties from one object to another.',
    'Heat Shepherd', 'Lead heat-feeding grazers to make a passage over water.',
    'Pocket Biome', 'Keep a small collection of living equipment in balance.',
  ].join(' ').toUpperCase();
  assert.equal((await page.locator('body').innerText()).replace(/\s+/g, ' ').trim().toUpperCase(), allowedText);
  check('Hub displays only the arcade title, five game titles, and their five descriptions');
  for (const [width, height] of [[652, 698], [1280, 720], [1366, 768], [1920, 1080]]) { await page.setViewportSize({ width, height }); await layout(`hub-${width}`); await screenshot(`hub-${width}`); }
  await page.setViewportSize({ width: 1280, height: 720 });
  await keyboardActivate('station-01'); check('Hub playable entry is reachable by keyboard');
  const initial = (await inspect()).state;
  await page.locator('#room-5').click(); assert.deepEqual((await inspect()).state, initial); assert.match(await page.locator('.game-feedback').innerText(), /Hot/);
  check('Invalid travel rejected without changing state');
  const roomNode = await page.locator('#room-1').elementHandle();
  await page.locator('#room-1').click();
  const settingNode = await page.locator('#setting-2').elementHandle();
  const applyNode = await page.locator('#apply').elementHandle();
  await page.locator('#setting-2').click();
  assert.equal((await inspect()).state.temperatures[1], 1); assert.match(await page.locator('.preview').innerText(), /− Reception/);
  await screenshot('preview-1280'); await layout('preview-1280');
  await page.locator('#apply').click(); assert.equal((await inspect()).state.temperatures[1], 2); assert.deepEqual((await inspect()).destinations, [3, 5]);
  assert.equal(await roomNode.evaluate(e => e === document.querySelector('#room-1')), true);
  assert.equal(await settingNode.evaluate(e => e === document.querySelector('#setting-2')), true);
  assert.equal(await applyNode.evaluate(e => e === document.querySelector('#apply')), true);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'setting-2');
  check('Room and thermostat controls persist through travel, preview, and apply; keyboard focus is retained');
  await page.keyboard.press('z'); assert.equal((await inspect()).state.temperatures[1], 1);
  await page.keyboard.press('z'); assert.deepEqual((await inspect()).state, initial);
  check('Preview is nonmutating, apply updates routes, unlimited undo restores temperatures and position');

  await page.locator('#challenge-2').click();
  await page.locator('#room-1').click(); await page.locator('#setting-2').click(); await page.locator('#apply').click(); await page.locator('#room-5').click();
  assert.equal((await inspect()).state.parcel, true); assert.equal((await inspect()).state.moves, 3); assert.equal((await inspect()).dialog, null);
  await page.keyboard.press('z'); assert.equal((await inspect()).state.parcel, false);
  await page.keyboard.press('z'); assert.deepEqual((await inspect()).state.temperatures, [1, 1, 0, 2, 1, 2]);
  await page.locator('#room-0').click();
  assert.equal((await inspect()).state.room, 0);
  check('Tempting third-puzzle pickup is legal; undo reverses pickup and dial change and restores access to preparation');

  await page.locator('#restart').click(); await page.locator('#hint').click();
  assert.match(await page.locator('.field-note').innerText(), /A question/);
  assert.doesNotMatch(await page.locator('.field-note').innerText(), /From the start/);
  await page.locator('#hint-more').click(); assert.match(await page.locator('.field-note').innerText(), /A closer look/);
  assert.equal(await page.locator('#hint-more').innerText(), 'Show the complete route');
  await page.locator('#hint-more').click(); assert.match(await page.locator('.field-note').innerText(), /From the start/);
  assert.equal(await page.locator('#hint-more').count(), 0);
  await page.setViewportSize({ width: 652, height: 698 }); await layout('full-hint-652'); await screenshot('hint-652');
  await page.locator('#close-hint').click(); await page.locator('#hint').click(); assert.match(await page.locator('.field-note').innerText(), /Complete route/);
  await page.locator('#restart').click(); await page.locator('#hint').click(); assert.match(await page.locator('.field-note').innerText(), /A question/); await page.locator('#close-hint').click();
  await page.setViewportSize({ width: 1280, height: 720 });
  check('Hints reveal question, clue, and explicitly requested complete route; restart resets hint progression');

  for (let i = 0; i < 3; i++) {
    await page.setViewportSize(i === 2 ? { width: 652, height: 698 } : { width: 1280, height: 720 });
    if (i === 1) await keyboardActivate(`challenge-${i}`); else await page.locator(`#challenge-${i}`).click();
    const started = Date.now(), steps = [];
    for (const action of routes[i]) {
      const before = await inspect();
      if (action.room !== undefined) {
        assert.equal(before.state.temperatures[before.state.room], before.state.temperatures[action.room]);
        if (i === 1) await page.keyboard.press(String(action.room + 1)); else await page.locator(`#room-${action.room}`).click();
      } else {
        if (i === 1) { await keyboardActivate(`setting-${action.set}`); await keyboardActivate('apply'); }
        else { await page.locator(`#setting-${action.set}`).click(); await page.locator('#apply').click(); }
      }
      const after = await inspect(); assert.equal(after.state.moves, before.state.moves + 1);
      if (after.state.room === 5) { assert.equal(after.state.parcel, true); assert.equal(after.dialog, null, 'vault pickup must not win'); }
      steps.push({ action, state: after.state });
      if (!after.dialog) await layout(`puzzle-${i + 1}-action-${after.state.moves}`);
    }
    let final = await inspect(); assert.equal(final.dialog, 'result'); assert.equal(final.state.room, 0); assert.equal(final.state.parcel, true);
    await layout(`result-${i + 1}`); await screenshot(`result-${i + 1}`);
    report.solutions.push({ puzzle: i + 1, mode: i === 1 ? 'keyboard only' : 'pointer', elapsedMs: Date.now() - started, steps });
    check(`Puzzle ${i + 1} completed through actual ${i === 1 ? 'keyboard' : 'pointer'} controls`);
    await page.locator('.modal [data-action="undo"]').click(); final = await inspect(); assert.equal(final.dialog, null); assert.equal(final.state.room, i === 2 ? 4 : 1);
    await page.keyboard.press('z'); assert.equal((await inspect()).state.temperatures[i === 2 ? 4 : 1], i ? 0 : 2);
    await page.locator('#restart').click(); assert.equal((await inspect()).state.moves, 0); assert.equal((await inspect()).state.parcel, false);
    check(`Puzzle ${i + 1} supports undo from result and clean restart`);
  }

  await page.locator('#challenge-2').click(); await page.locator('#room-4').click(); await page.locator('#setting-1').click();
  for (const [width, height] of [[652, 698], [1280, 720], [1366, 768], [1920, 1080]]) { await page.setViewportSize({ width, height }); await layout(`game-remote-${width}`); await screenshot(`game-remote-${width}`); }
  await page.setViewportSize({ width: 1280, height: 720 });
  const paused = (await inspect()).state; await page.keyboard.press('Escape');
  await screenshot('pause-1280'); await layout('pause-1280');
  await page.keyboard.press('3'); await page.keyboard.press('r'); assert.deepEqual((await inspect()).state, paused);
  await page.locator('#resume').click(); assert.equal((await inspect()).dialog, null);
  check('Pause blocks room and restart shortcuts, resume preserves state');

  // Tabbing past the final page control moves real focus to the browser chrome.
  await page.locator('#hint').click(); await page.locator('#close-hint').click();
  await page.keyboard.press('Tab');
  assert.equal((await inspect()).dialog, 'pause'); assert.deepEqual((await inspect()).state, paused);
  await page.locator('#resume').click();
  check('Actual browser focus loss pauses and preserves state', { trigger: 'Tab from last page control to browser chrome', syntheticEvents: false });

  await page.locator('#hint').click(); assert.equal(await page.locator('.field-note').count(), 1); await page.locator('#close-hint').click();
  await page.locator('#help').click(); await layout('help-1280'); await screenshot('help-1280');
  await page.setViewportSize({ width: 652, height: 698 }); await layout('help-652'); await screenshot('help-652');
  await page.setViewportSize({ width: 1280, height: 720 });
  for (let i = 0; i < 7; i++) { await page.keyboard.press('Tab'); assert.ok(await page.evaluate(() => !!document.activeElement?.closest('.modal'))); }
  await page.locator('#close-help').click(); check('Instructions, hint, and modal keyboard focus');
  await page.locator('#mute').click(); await page.locator('#motion').click();
  assert.equal((await inspect()).save.muted, true); assert.equal((await inspect()).save.reduced, true);
  assert.equal(await page.locator('html.reduced').count(), 1);
  await page.locator('#return-hub').click(); assert.equal(await page.locator('.arcade-game.restored').count(), 1); await screenshot('hub-restored-1280');
  await page.reload(); assert.equal((await inspect()).save.muted, true); assert.equal((await inspect()).save.reduced, true); assert.equal(await page.locator('.arcade-game.restored').count(), 1);
  assert.deepEqual((await inspect()).save.completed.sort(), [0, 1, 2]);
  await page.locator('#station-01').click(); for (const a of routes[0]) { if (a.room !== undefined) await page.locator(`#room-${a.room}`).click(); else { await page.locator(`#setting-${a.set}`).click(); await page.locator('#apply').click(); } }
  assert.deepEqual((await inspect()).save.completed.sort(), [0, 1, 2]);
  check('Settings and completion survive reload; restoration and replay do not duplicate stamps');
  assert.deepEqual(failures, []); check('No browser runtime, console, or HTTP errors');

  const corruptContext = await browser.newContext(); await corruptContext.addInitScript(() => localStorage.setItem('wayward-conservatory-v1', '{bad json'));
  const corrupt = await corruptContext.newPage(); await corrupt.goto(url); await corrupt.locator('#station-01').click(); assert.equal(await corrupt.locator('.room').count(), 6); await corruptContext.close(); check('Malformed save falls back to playable defaults');
  const blockedContext = await browser.newContext(); await blockedContext.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage blocked'); } }));
  const blocked = await blockedContext.newPage(); await blocked.goto(url); await blocked.locator('#station-01').click(); assert.equal(await blocked.locator('.storage-warning').count(), 1); await blocked.locator('#room-1').click(); await blocked.locator('#setting-2').click(); await blocked.locator('#apply').click(); assert.match(await blocked.locator('#room-1').getAttribute('aria-label'), /Hot/); await blockedContext.close(); check('Unavailable storage leaves game playable with an honest notice');
  report.finished = new Date().toISOString(); report.errors = failures; report.passed = true;
} catch (error) { report.passed = false; report.error = error.stack; await screenshot('browser-failure'); throw error; }
finally { await writeFile('artifacts/browser-report.json', JSON.stringify(report, null, 2)); await browser.close(); }
