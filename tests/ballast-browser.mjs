import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const url = process.env.WAYWARD_URL || 'http://127.0.0.1:5173';
const production = new URL(url).port === '4173';
const browser = await chromium.launch({ channel: process.env.WAYWARD_BROWSER || 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await context.addInitScript(() => { if (!localStorage.getItem('wayward-conservatory-v1')) localStorage.setItem('wayward-conservatory-v1', JSON.stringify({ version: 1, muted: false, reduced: false, completed: [0, 1, 2] })); });
const page = await context.newPage();
const report = { url, passed: false, checks: [], layouts: [], solutions: [], errors: [] };
page.on('pageerror', e => report.errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
page.on('response', r => { if (r.status() >= 400) report.errors.push(`${r.status()} ${r.url()}`); });
const pass = name => { report.checks.push(name); console.log(`PASS ${name}`); };
const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('wayward-conservatory-v1')));
const snapshot = () => page.evaluate(() => ({ core: document.querySelector('#b-capsule')?.getAttribute('transform'), phase: document.querySelector('#b-capsule')?.getAttribute('data-phase'), pieces: document.querySelector('#b-pieces')?.innerHTML, speed: document.querySelector('#b-speed-value')?.textContent, gate: !!document.querySelector('.gate-open'), inspection: window.__WAYWARD__?.inspect().state }));
const result = () => page.locator('#b-next').waitFor({ timeout: 18000 });
const dock = () => page.locator('#b-dock-1.docked').waitFor({ timeout: 16000 });
async function keyboardActivate(id) {
  for (let n = 0; n < 80; n++) {
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
  const finding = await page.evaluate(() => {
    const bad = [...document.querySelectorAll('button,h1,h2,.b-feedback,.b-lesson,.b-force,.b-sockets,.b-loading,.b-chamber')].filter(e => !e.closest('[inert]')).filter(e => {
      const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1);
    }).map(e => e.textContent.slice(0, 55));
    const p = document.querySelector('.b-panel');
    return { size: [innerWidth, innerHeight], bad, pageScroll: document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight, panelOverflow: p ? p.scrollHeight > p.clientHeight + 2 : false };
  });
  assert.deepEqual(finding.bad, [], label); assert.equal(finding.pageScroll, false, label); assert.equal(finding.panelOverflow, false, label); report.layouts.push({ label, ...finding });
}
try {
  await page.goto(url); await page.locator('#station-02').waitFor();
  assert.equal(await page.locator('#station-02').getAttribute('aria-disabled'), null);
  assert.equal(await page.locator('.arcade-game[aria-disabled="true"]').count(), 3);
  assert.equal(await page.locator('#station-01.restored').count(), 1);
  if (production) assert.equal(await page.evaluate(() => '__WAYWARD__' in window), false);
  await page.locator('#station-02').click();
  assert.equal(await page.locator('#b-launch').isDisabled(), true);
  assert.equal(await page.locator('.b-minerals button').count(), 4);
  pass('Ballast launches from the simple arcade with four minerals, two empty sockets, and existing Adjacent progress preserved');
  for (const [width, height] of [[1280, 720], [1366, 768], [1920, 1080], [652, 698]]) { await page.setViewportSize({ width, height }); await layout(`chamber-1-${width}`); }
  await page.locator('#help').click(); await layout('help-652'); await page.screenshot({ path: 'artifacts/ballast-help-652.png' });
  for (let i = 0; i < 6; i++) { await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => !!document.activeElement?.closest('.modal')), true); }
  await page.locator('#b-close-help').click();
  await page.locator('#b-hint').click(); assert.equal(await page.locator('.b-hint').count(), 1); await layout('hint-652'); await page.locator('#b-hint-close').click();
  await page.setViewportSize({ width: 1280, height: 720 });
  pass('Desktop and narrow layouts fit; help, hints, and modal keyboard focus work');

  await page.locator('#b-load-west').click(); await page.locator('#b-launch').click(); await page.locator('#b-retry').waitFor({ timeout: 5000 });
  await layout('wall-failure'); assert.match(await page.locator('.modal p').innerText(), /outer frame/);
  await page.locator('#b-retry').click(); assert.match(await page.locator('#b-slot-0').getAttribute('aria-label'), /Mossjade/);
  assert.equal((await snapshot()).phase, 'docked'); pass('Wall collision fails honestly and retry restores the launch dock and loadout');

  const firstStarted = Date.now();
  await page.locator('#b-load-east').click(); assert.ok((await page.locator('#b-forecast').getAttribute('d')).length > 20);
  await page.locator('#b-launch').click(); await page.waitForFunction(() => Number(document.querySelector('#b-speed-value').textContent) > 45);
  assert.equal(await page.locator('#b-load-north').isDisabled(), true);
  await page.keyboard.press('ArrowUp'); assert.match(await page.locator('#b-slot-0').getAttribute('aria-label'), /Sunstone/);
  await page.keyboard.press('Escape'); const paused = await snapshot();
  await page.keyboard.press('q'); await page.keyboard.press('r'); await page.waitForTimeout(220); assert.deepEqual(await snapshot(), paused);
  await page.locator('#b-resume').click(); await dock();
  assert.equal((await snapshot()).speed, '0'); await layout('first-refit-dock');
  pass('Flight ignores loading/steering input, pauses deterministically, and magnetically docks at zero speed');
  await page.locator('#b-load-south').click(); await page.locator('#b-launch').click(); await page.locator('#b-retry').waitFor({ timeout: 5000 }); await page.locator('#b-retry').click();
  assert.equal(await page.locator('#b-dock-1.docked').count(), 1); assert.match(await page.locator('#b-slot-0').getAttribute('aria-label'), /Ironroot/);
  pass('A failed second leg retries from the refit dock without repeating the first leg');
  await page.locator('#b-load-north').click(); await page.locator('#b-launch').click(); await result();
  await layout('chamber-1-result'); report.solutions.push({ chamber: 1, mode: 'pointer', wallClockMs: Date.now() - firstStarted, final: await snapshot() });
  pass('Chamber 1 completed through pointer controls, with two launches and a refit');

  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#b-challenge-1.active').count(), 1);
  await page.keyboard.press('q'); await page.keyboard.press('ArrowUp'); await page.keyboard.press('e'); await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#b-force-icon').innerText(), '↗');
  const secondStarted = Date.now(); await page.keyboard.press('Space'); await dock();
  await page.keyboard.press('q'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('e'); await keyboardActivate('b-empty');
  await page.keyboard.press('Space'); await result(); await layout('chamber-2-result');
  report.solutions.push({ chamber: 2, mode: 'keyboard only', wallClockMs: Date.now() - secondStarted, final: await snapshot() });
  pass('Chamber 2 completed using only keyboard controls and a combined north/east pull');

  await page.locator('#b-next').click(); await page.setViewportSize({ width: 652, height: 698 });
  await page.locator('#b-load-north').click(); await page.locator('#b-slot-1').click(); await page.locator('#b-load-east').click();
  await layout('chamber-3-loaded-652'); await page.screenshot({ path: 'artifacts/ballast-release-plan-652.png' });
  await page.locator('#b-launch').click(); await page.locator('#b-retry').waitFor({ timeout: 8000 });
  assert.equal(await page.locator('.gate-open').count(), 0); await page.locator('#b-retry').click();
  pass('The third chamber cannot be completed by leaving both minerals loaded');
  const thirdStarted = Date.now(); await page.locator('#b-launch').click(); await page.locator('.b-chamber.release-ready').waitFor({ timeout: 6000 });
  await page.locator('#b-slot-0').click();
  assert.equal(await page.locator('.b-piece').count(), 1); assert.equal(await page.locator('#b-force-icon').innerText(), '→');
  await page.screenshot({ path: 'artifacts/ballast-ejection-652.png' }); await page.keyboard.press('Escape'); const loosePaused = await snapshot();
  await page.waitForTimeout(220); assert.deepEqual(await snapshot(), loosePaused); await page.locator('#b-resume').click();
  await page.locator('.b-chamber.gate-open').waitFor({ timeout: 6000 }); await page.screenshot({ path: 'artifacts/ballast-gate-open-652.png' });
  await result(); await layout('chamber-3-result-652'); await page.screenshot({ path: 'artifacts/ballast-result-652.png' });
  report.solutions.push({ chamber: 3, mode: 'pointer release using visible bay', wallClockMs: Date.now() - thirdStarted, final: await snapshot() });
  pass('Chamber 3 completed: ejected Skyglass rises to the switch, the pull changes east, and the core reaches the receiver');
  pass('Pause freezes the loose mineral as well as the capsule');

  await page.locator('.modal [data-b-action="hub"]').click(); assert.equal(await page.locator('.arcade-game.restored').count(), 1);
  await page.reload(); assert.equal(await page.locator('.arcade-game.restored').count(), 1);
  assert.deepEqual((await save()).completed, [0, 1, 2]); assert.deepEqual((await save()).ballastCompleted, [0, 1, 2]);
  await page.screenshot({ path: 'artifacts/ballast-restored-hub-652.png' });
  await page.locator('#station-02').click(); assert.equal(await page.locator('.b-tabs button.completed').count(), 3);
  pass('Introductory completions persist separately; the twelve-level stamp stays unearned and Adjacent remains restored');

  await page.locator('#b-hint').click(); await page.locator('#b-hint-close').click(); await page.keyboard.press('Tab');
  assert.equal(await page.locator('#b-resume').count(), 1); await page.locator('#b-resume').click();
  pass('Actual browser focus loss opens pause');
  await page.locator('#motion').click(); await page.locator('#mute').click(); await page.locator('#b-load-east').click(); await page.locator('#b-launch').click();
  await page.waitForFunction(() => Number(document.querySelector('#b-speed-value').textContent) > 30);
  assert.equal(await page.locator('#b-trail').getAttribute('d'), '');
  const moving = await snapshot(); await page.waitForTimeout(100); assert.notEqual((await snapshot()).core, moving.core);
  await page.locator('#return-hub').click(); await page.waitForTimeout(150); assert.equal(await page.locator('#b-world').count(), 0);
  await page.reload(); await page.locator('#station-02').click(); assert.equal(await page.locator('html.reduced').count(), 1); assert.equal(await page.locator('#mute').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#b-world').count(), 1); assert.equal((await snapshot()).phase, 'docked');
  pass('Reduced motion removes trails without changing physics; settings persist and leaving flight disposes the simulation');
  assert.deepEqual(report.errors, []); pass('No runtime, console, or HTTP errors');
  report.passed = true;
} catch (error) { report.error = error.stack; await page.screenshot({ path: 'artifacts/ballast-browser-failure.png' }); throw error; }
finally { await writeFile(`artifacts/ballast-${production ? 'production' : 'browser'}-report.json`, JSON.stringify(report, null, 2)); await browser.close(); }
