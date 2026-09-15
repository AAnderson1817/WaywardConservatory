import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ channel: process.env.WAYWARD_BROWSER || 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const report = { passed: false, checks: [], errors: [] };
page.on('pageerror', error => report.errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
const state = () => page.evaluate(() => window.__WAYWARD__.inspect().state);
const pass = name => { report.checks.push(name); console.log(`PASS ${name}`); };
const tokenMotion = () => page.locator('.keeper-token').evaluate(e => e.getAnimations().map(a => ({ state: a.playState, time: a.currentTime })));
async function aligned() {
  await page.waitForFunction(() => {
    const token = document.querySelector('.keeper-token'), a = token.getBoundingClientRect();
    const b = document.querySelector(`#room-${token.dataset.room} .keeper-anchor`).getBoundingClientRect();
    return Math.abs(a.left + a.width / 2 - b.left - b.width / 2) < 1 && Math.abs(a.top + a.height / 2 - b.top - b.height / 2) < 1;
  });
}
async function settled() { await page.waitForFunction(() => document.querySelectorAll('.effect-lines path, .arrival-ring, .case-flight').length === 0); await aligned(); }
try {
  await page.goto(process.env.WAYWARD_URL || 'http://127.0.0.1:5173');
  await page.locator('#station-01').click(); await aligned();
  await page.locator('#room-1').click();
  assert.equal((await state()).room, 1); assert.equal((await tokenMotion())[0]?.state, 'running');
  await page.screenshot({ path: 'artifacts/flow-travel-1280.png' });
  await page.keyboard.press('Escape');
  await page.locator('.keeper-token').evaluate(e => Promise.all(e.getAnimations().map(a => a.ready)));
  const paused = await tokenMotion(); assert.equal(paused[0]?.state, 'paused');
  await page.waitForTimeout(180); assert.deepEqual(await tokenMotion(), paused);
  await page.locator('#resume').click(); await settled();
  pass('Travel commits immediately, visibly moves the fieldkeeper, freezes on pause, and resumes to the correct room');

  const before = await state(); await page.locator('#setting-2').click();
  assert.deepEqual(await state(), before); assert.equal(await page.locator('.dial-face.pending').count(), 1);
  assert.equal(await page.locator('.dial-readout').innerText(), 'Preview · Hot');
  await page.locator('#apply').click();
  assert.equal((await state()).temperatures[1], 2);
  assert.ok(await page.locator('#room-1 .thermal-wash').evaluate(e => e.getAnimations().length > 0));
  await page.screenshot({ path: 'artifacts/flow-temperature-1280.png' });
  await page.locator('#room-5').click();
  assert.equal((await state()).parcel, true); assert.equal(await page.locator('.case-flight').count(), 1);
  assert.equal(await page.locator('.keeper-token.carrying').count(), 1);
  assert.equal(await page.locator('.case-progress').getAttribute('data-stage'), 'return');
  assert.equal(await page.locator('.thermal-trail').count(), 0, 'old temperature effects clear on travel');
  await page.screenshot({ path: 'artifacts/flow-pickup-1280.png' });
  pass('Preview stays nonmutating; applying animates the changed temperature; pickup animates the seedcase and updates the objective');

  await page.keyboard.press('z');
  assert.equal((await state()).parcel, false); assert.equal(await page.locator('.case-flight').count(), 1, 'only the reverse pickup effect remains');
  assert.equal(await page.locator('.keeper-token.carrying').count(), 0);
  await settled(); assert.equal(await page.locator('.case-flight').count(), 0);
  pass('Undo reverses travel and pickup, cancels the previous effects, and cleans up after completion');

  await page.locator('#restart').click();
  for (let i = 0; i < 10; i++) { await page.keyboard.press('2'); await page.keyboard.press('1'); }
  assert.equal((await state()).moves, 20); assert.equal((await state()).room, 0);
  assert.ok(await page.locator('.effect-lines path').count() <= 1);
  await settled();
  await page.locator('#room-1').click(); await page.locator('#restart').click();
  assert.equal((await state()).moves, 0); assert.equal(await page.locator('.effect-lines path, .arrival-ring, .case-flight').count(), 0); await aligned();
  pass('Rapid inputs remain responsive and bounded; restart removes every in-flight effect');

  await page.locator('#room-1').click(); await page.locator('#motion').click();
  assert.equal(await page.locator('html.reduced').count(), 1); assert.deepEqual(await tokenMotion(), []); await aligned();
  await page.locator('#setting-2').click(); await page.locator('#apply').click(); await page.locator('#room-5').click();
  assert.equal(await page.locator('.case-flight, .arrival-ring, .effect-lines path').count(), 0);
  assert.equal((await state()).parcel, true); assert.equal(await page.locator('.keeper-token.carrying').count(), 1); await aligned();
  assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
  pass('Reduced motion cancels active effects and provides immediate static travel, temperature, and carrying states');

  await page.locator('#motion').click(); await page.locator('#restart').click();
  await page.locator('#room-1').click(); await page.setViewportSize({ width: 652, height: 698 }); await aligned();
  assert.equal(await page.locator('.effect-lines path, .arrival-ring').count(), 0);
  await page.locator('#setting-2').click(); await page.locator('#apply').click(); await page.locator('#room-5').click();
  assert.equal(await page.locator('.case-flight').count(), 1); await settled();
  await page.screenshot({ path: 'artifacts/flow-carrying-652.png' });
  pass('Resizing mid-travel clears obsolete coordinates; narrow-screen pickup and token placement remain correct');

  await page.keyboard.press('z'); await page.locator('#return-hub').click();
  assert.equal(await page.locator('.keeper-token, .case-flight, .arrival-ring, .effect-lines').count(), 0);
  await page.locator('#station-01').click(); assert.equal(await page.locator('.keeper-token').count(), 1); await aligned();
  pass('Leaving and re-entering the arcade disposes effects and creates one correctly positioned fieldkeeper');
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.locator('#challenge-2').click(); await page.locator('#room-4').click(); await settled();
  await page.locator('#setting-1').click(); await page.locator('#apply').click();
  assert.ok(await page.locator('#room-2 .thermal-wash').evaluate(e => e.getAnimations().length > 0));
  assert.equal(await page.locator('.thermal-trail').count(), 1);
  await page.screenshot({ path: 'artifacts/flow-remote-1280.png' }); await settled();
  pass('Remote thermostat pulse follows the declared changed target even when the local temperature stays the same');
  assert.deepEqual(report.errors, []); report.passed = true;
} finally {
  await writeFile('artifacts/motion-report.json', JSON.stringify(report, null, 2));
  await browser.close();
}
