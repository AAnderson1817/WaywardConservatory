import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const url = process.env.WAYWARD_URL || 'http://127.0.0.1:5173';
const production = new URL(url).port === '4173';
const browser = await chromium.launch({ channel: process.env.WAYWARD_BROWSER || 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await context.addInitScript(() => {
  if (!localStorage.getItem('wayward-conservatory-v1')) localStorage.setItem('wayward-conservatory-v1', JSON.stringify({ version: 1, muted: true, reduced: false, completed: [0, 1, 2], ballastCompleted: [0, 1, 2] }));
});
const page = await context.newPage();
const report = { url, passed: false, checks: [], layouts: [], errors: [] };
page.on('pageerror', e => report.errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
page.on('response', r => { if (r.status() >= 400) report.errors.push(`${r.status()} ${r.url()}`); });
const pass = name => { report.checks.push(name); console.log(`PASS ${name}`); };
const state = () => page.evaluate(() => ({
  core: document.querySelector('#b-capsule').getAttribute('transform'),
  phase: document.querySelector('#b-capsule').getAttribute('data-phase'),
  pieces: document.querySelector('#b-pieces').innerHTML,
  speed: document.querySelector('#b-speed-value').textContent,
  slots: [0, 1].map(i => document.querySelector(`#b-slot-${i}`).getAttribute('aria-label')),
  inspection: window.__WAYWARD__?.inspect().state,
  checkpoint: window.__WAYWARD__?.inspect().checkpoint,
}));
const load = async (slot, mineral) => { await page.locator(`#b-slot-${slot}`).click(); await page.locator(`#b-load-${mineral}`).click(); };
const dock = n => page.locator(`#b-dock-${n}.docked`).waitFor({ timeout: 18000 });
const win = () => page.locator('#b-next').waitFor({ timeout: 18000 });
const pullLength = () => page.locator('#b-pull').evaluate(e => Math.hypot(Number(e.getAttribute('x2')) - Number(e.getAttribute('x1')), Number(e.getAttribute('y2')) - Number(e.getAttribute('y1'))));
const preview = async () => ({ core: await page.locator('#b-preview-core').getAttribute('d'), piece: await page.locator('#b-preview-piece').getAttribute('d') });
async function focusContained() {
  for (let i = 0; i < 10; i++) { await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => !!document.activeElement?.closest('.modal')), true); }
  for (let i = 0; i < 10; i++) { await page.keyboard.press('Shift+Tab'); assert.equal(await page.evaluate(() => !!document.activeElement?.closest('.modal')), true); }
}
async function compactLayout(label) {
  await page.waitForFunction(() => {
    const panel = document.querySelector('.b-panel').getBoundingClientRect(), modal = document.querySelector('.modal').getBoundingClientRect();
    return ['left', 'top', 'width', 'height'].every(key => Math.abs(panel[key] - modal[key]) < 1);
  });
  const finding = await page.evaluate(() => {
    const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
    const board = rect('.b-chamber'), modal = rect('.modal');
    const overlap = Math.max(0, Math.min(board.right, modal.right) - Math.max(board.left, modal.left)) * Math.max(0, Math.min(board.bottom, modal.bottom) - Math.max(board.top, modal.top));
    const bad = [...document.querySelectorAll('.modal button,.modal h2,.modal p')].filter(e => {
      const r = e.getBoundingClientRect(); return r.width && r.height && (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1);
    }).map(e => e.textContent.slice(0, 60));
    return { size: [innerWidth, innerHeight], board, modal, overlap, bad, pageScroll: document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight };
  });
  assert.deepEqual(finding.bad, [], label); assert.equal(finding.pageScroll, false, label); assert.ok(finding.overlap < 2, `${label}: modal obscures the board`);
  report.layouts.push({ label, ...finding });
}

try {
  await page.goto(url); await page.locator('#station-02').waitFor(); assert.equal(await page.locator('#station-02.restored').count(), 1);
  await page.locator('#station-02').click();
  assert.equal(await page.locator('.b-tabs button').count(), 12);
  assert.equal(await page.locator('.b-tabs button.completed').count(), 3);
  if (production) assert.equal(await page.evaluate(() => '__WAYWARD__' in window), false);
  pass('A previous stamp stays restored while twelve campaign levels are available');

  await load(0, 'east'); await page.keyboard.press('Escape'); const dockPaused = await state();
  await page.keyboard.press('q'); await page.keyboard.press('e'); assert.deepEqual(await state(), dockPaused); assert.equal(await page.locator('#b-release').count(), 0); await page.locator('#b-resume').click();
  pass('Q/E while paused at a loaded dock leaves the core unchanged and does not offer a flight release');
  const singlePull = await pullLength(); await load(1, 'east'); const doublePull = await pullLength();
  assert.ok(doublePull > singlePull + 10, `Combined pull should visibly strengthen: ${singlePull} → ${doublePull}`);
  await page.locator('#b-empty').click(); await page.locator('#b-launch').click(); await page.waitForFunction(() => Number(document.querySelector('#b-speed-value').textContent) > 35);
  const origins = await page.evaluate(() => ['#b-pull', '#b-drift'].map(s => ['x1', 'y1'].map(a => Number(document.querySelector(s).getAttribute(a)))));
  assert.notDeepEqual(origins[0], origins[1]);
  await page.keyboard.press('z'); assert.equal((await state()).phase, 'docked'); assert.match((await state()).slots[0], /Sunstone/); assert.equal((await state()).speed, '0');
  pass('Force strength is visible, drift has a distinct origin, and Z safely returns an active flight to its launch loadout');

  await page.locator('#b-launch').click(); await dock(1); await load(0, 'north'); await page.locator('#b-launch').click(); await page.waitForFunction(() => Number(document.querySelector('#b-speed-value').textContent) > 30); await page.keyboard.press('z');
  assert.equal(await page.locator('#b-dock-1.docked').count(), 1); assert.match((await state()).slots[0], /Skyglass/);
  pass('Z uses the most recent refit checkpoint instead of restarting the chamber');

  await page.locator('#b-challenge-0').click(); await page.locator('#b-hint').click();
  const hint1 = await page.locator('.b-hint p').innerText(); await page.locator('#b-hint-next').click(); const hint2 = await page.locator('.b-hint p').innerText();
  await page.locator('#b-hint-next').click(); const hint3 = await page.locator('.b-hint p').innerText();
  assert.equal(new Set([hint1, hint2, hint3]).size, 3); assert.ok(hint1.length < hint3.length);
  await page.locator('#b-hint-close').click(); await page.locator('#b-hint').click(); assert.equal(await page.locator('.b-hint p').innerText(), hint3); await page.locator('#b-hint-close').click();
  await load(0, 'west'); await page.locator('#b-launch').click(); await page.locator('#b-retry').waitFor({ timeout: 5000 }); await page.keyboard.press('z');
  await page.locator('#b-hint').click(); assert.equal(await page.locator('.b-hint p').innerText(), hint3); await page.locator('#b-hint-close').click();
  await page.locator('#b-challenge-1').click(); await page.locator('#b-hint').click(); assert.notEqual(await page.locator('.b-hint p').innerText(), hint3); await page.locator('#b-hint-close').click();
  await page.locator('#b-challenge-0').click(); await page.locator('#b-hint').click(); assert.equal(await page.locator('.b-hint p').innerText(), hint3); await page.locator('#b-hint-close').click();
  pass('Hints reveal three distinct stages and retain each chamber’s revealed level through closing, retrying, and switching');

  await page.locator('#b-challenge-2').click(); await load(0, 'north'); await load(1, 'east'); await page.locator('#b-launch').click(); await page.locator('.release-ready').waitFor({ timeout: 7000 }); await page.keyboard.press('Escape');
  const paused = await state(); await page.locator('#b-preview-0').click(); const northPreview = await preview();
  assert.ok(northPreview.core?.length > 20); assert.ok(northPreview.piece?.length > 20); assert.notEqual(northPreview.core, northPreview.piece);
  await page.locator('#b-preview-1').click(); const eastPreview = await preview(); assert.notDeepEqual(eastPreview, northPreview);
  await page.keyboard.press('q'); assert.deepEqual(await preview(), northPreview); await page.keyboard.press('r'); await page.waitForTimeout(250); assert.deepEqual(await state(), paused);
  for (const [width, height] of [[1280, 720], [1366, 768], [1920, 1080], [652, 698]]) { await page.setViewportSize({ width, height }); await compactLayout(`planning-${width}`); }
  await page.setViewportSize({ width: 652, height: 375 });
  await page.waitForFunction(() => [...document.querySelectorAll('.modal button')].every(e => {
    const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top >= 0 && r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight;
  }));
  report.layouts.push({ label: 'planning-short-652', size: [652, 375], pauseButtonsWithinViewport: true });
  assert.deepEqual(await state(), paused); await focusContained();
  await page.screenshot({ path: 'artifacts/ballast-revision-planning-short-652.png', animations: 'disabled' });
  pass('At 375px viewport height, every planning control remains accessible while the flight stays frozen');
  await page.setViewportSize({ width: 652, height: 698 }); await compactLayout('planning-restored-652');
  await focusContained(); await page.screenshot({ path: 'artifacts/ballast-revision-planning-652.png', animations: 'disabled' });
  await page.keyboard.press('Escape'); assert.equal(await page.locator('.modal').count(), 0); assert.equal(await page.locator('.b-piece').count(), 0); assert.match((await state()).slots[0], /Skyglass/); await page.keyboard.press('z');
  pass('Planning previews split both trajectories, switch with Q/E without mutating simulation, keep the board clear at four sizes, and cancel without ejection');

  await page.locator('#b-launch').click(); await page.locator('.release-ready').waitFor({ timeout: 7000 }); await page.keyboard.press('Escape'); await page.locator('#b-preview-0').click(); await page.locator('#b-release').click();
  assert.equal(await page.locator('.modal').count(), 0); assert.equal(await page.locator('.b-piece').count(), 1); assert.equal(await page.locator('#b-force-icon').innerText(), '→');
  await page.locator('.b-chamber.gate-open').waitFor({ timeout: 7000 }); await win(); await page.locator('#b-next').click(); assert.equal(await page.locator('#b-challenge-3.active').count(), 1);
  pass('Committing the preview releases the selected mineral, resumes play, opens the switch gate, and advances to the replacement fourth level');

  await page.locator('#return-hub').click(); await page.reload(); await page.locator('#station-02').waitFor();
  assert.equal(await page.locator('#station-02.restored').count(), 1);
  await page.locator('#station-02').click(); await page.locator('#motion').click();
  assert.equal(await page.locator('html.reduced').count(), 1); await load(0, 'west'); await page.locator('#b-launch').click();
  await page.waitForFunction(() => Number(document.querySelector('#b-speed-value').textContent) > 30); assert.equal(await page.locator('#b-trail').getAttribute('d'), '');
  await page.locator('#b-retry').waitFor({ timeout: 6000 }); assert.ok((await page.locator('#b-trail').getAttribute('d')).length > 20); assert.equal(await page.locator('#b-impact').isVisible(), true);
  for (const [width, height] of [[1280, 720], [1366, 768], [1920, 1080], [652, 698]]) { await page.setViewportSize({ width, height }); await compactLayout(`failure-${width}`); }
  await focusContained(); const crashed = await state(); await page.waitForTimeout(150); assert.deepEqual(await state(), crashed);
  await page.screenshot({ path: 'artifacts/ballast-revision-failure-652.png', animations: 'disabled' }); await page.keyboard.press('z');
  assert.equal(await page.locator('.modal').count(), 0); assert.equal((await state()).phase, 'docked'); assert.match((await state()).slots[0], /Mossjade/);
  pass('Failure retains a diagnostic trajectory and impact marker with reduced motion, keeps the board visible, traps focus, and recovers with Z');
  await load(0, 'east'); await page.locator('#b-launch').click();
  await page.waitForFunction(() => Number(document.querySelector('#b-capsule').getAttribute('transform').match(/translate\(([-\d.]+)/)[1]) > 220);
  await page.keyboard.press('q'); await page.locator('#b-retry').waitFor({ timeout: 6000 });
  assert.equal(await page.locator('#b-dialog-title').innerText(), 'Drift exhausted.');
  assert.match(await page.locator('#b-board-status').innerText(), /drift exhausted/); assert.equal(await page.locator('#b-impact').getAttribute('visibility'), 'hidden');
  assert.doesNotMatch(await page.locator('#b-context-description').innerText(), /impact/);
  pass('An exhausted-drift failure gives a truthful status and accessible description without displaying a collision marker');
  const freshContext = await browser.newContext({ viewport: { width: 652, height: 698 } });
  const fresh = await freshContext.newPage(); fresh.on('pageerror', e => report.errors.push(e.message));
  await fresh.goto(url); await fresh.locator('#station-02').click(); await fresh.locator('#b-challenge-2').click();
  await fresh.locator('#b-load-north').click(); await fresh.locator('#b-slot-1').click(); await fresh.locator('#b-load-east').click(); await fresh.locator('#b-launch').click();
  await fresh.locator('.release-ready').waitFor({ timeout: 7000 }); await fresh.keyboard.press('q'); await fresh.locator('#b-next').waitFor({ timeout: 10000 });
  assert.doesNotMatch(await fresh.locator('.modal').innerText(), /stamp.*earned|anchor chamber restored/i);
  await fresh.locator('.modal [data-b-action="hub"]').click(); assert.equal(await fresh.locator('#station-02.restored').count(), 0);
  assert.deepEqual(await fresh.evaluate(() => JSON.parse(localStorage.getItem('wayward-conservatory-v1')).ballastCompleted), [2]); await freshContext.close();
  pass('Completing chamber three out of order records that chamber without claiming or displaying a full restoration stamp');
  assert.deepEqual(report.errors, []); pass('No runtime, console, or HTTP errors'); report.passed = true;
} catch (error) { report.error = error.stack; await page.screenshot({ path: 'artifacts/ballast-revision-failure.png', animations: 'disabled' }); throw error; }
finally { await writeFile(`artifacts/ballast-revision-${production ? 'production' : 'browser'}-report.json`, JSON.stringify(report, null, 2)); await browser.close(); }
