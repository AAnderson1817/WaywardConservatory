import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

// End-to-end production verification: no model imports, debug inspector, save
// injection, or direct application-state mutations. These are ordinary controls.
const url = process.env.BASE_URL || process.env.WAYWARD_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ channel: process.env.WAYWARD_BROWSER || 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 652, height: 698 } });
const report = { url, started: new Date().toISOString(), checks: [], shots: [], screenshots: [], errors: [], passed: false };
page.on('pageerror', error => report.errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
page.on('response', response => { if (response.status() >= 400) report.errors.push(`${response.status()} ${response.url()}`); });
const check = name => { report.checks.push(name); console.log(`PASS ${name}`); };
async function screenshot(name) {
  const file = `artifacts/ballast-flight-production-${name}.png`;
  await page.screenshot({ path: file, animations: 'disabled' });
  report.screenshots.push(file);
}
async function teaching() {
  const seen = [];
  for (let n = 0; n < 8 && await page.locator('#flight-dialog[open][data-lesson]').count(); n++) {
    seen.push(await page.locator('#flight-dialog').getAttribute('data-lesson'));
    assert.equal(await page.locator('#flight-dialog .flight-lesson-art').count(), 1);
    await page.locator('#flight-continue').click();
  }
  assert.equal(await page.locator('#flight-dialog[open][data-lesson]').count(), 0);
  return seen;
}
async function setRange(id, value) {
  const control = page.locator(id);
  await control.focus();
  await page.keyboard.press('Home');
  for (let n = Number(await control.getAttribute('min')); n < value; n++) await page.keyboard.press('ArrowRight');
  assert.equal(Number(await control.inputValue()), value);
}
try {
  await mkdir('artifacts', { recursive: true });
  await page.goto(url);
  assert.equal(await page.locator('.arcade-game').count(), 5);
  assert.equal(await page.locator('#station-02').evaluate(station => station.classList.contains('restored')), false);
  await page.locator('#station-02').click();
  assert.deepEqual(await teaching(), ['launch', 'fields', 'shutter']);
  await page.locator('#flight-mode').uncheck();
  check('Fresh production build starts Ballast and presents all foundational visual lessons');
  const shots = [
    { course: 0, mineral: 'blue', angle: -30, power: 68, name: 'Crescent' },
    { course: 1, mineral: 'red', angle: -4, power: 68, name: 'Cushion' },
    { course: 2, mineral: 'mixed', angle: -12, power: 84, name: 'Confluence' },
  ];
  for (const shot of shots) {
    assert.equal(await page.locator(`[data-flight-course="${shot.course}"]`).getAttribute('aria-pressed'), 'true');
    const learned = await teaching();
    await page.locator(`[data-flight-load="${shot.mineral}"]`).click();
    const loadLessons = await teaching();
    await setRange('#flight-angle', shot.angle);
    await setRange('#flight-power', shot.power);
    await page.locator('#flight-launch').focus();
    const started = Date.now();
    await page.keyboard.press('Enter');
    await page.locator('#flight-dialog[open] #flight-next').waitFor({ timeout: 14000 });
    assert.match(await page.locator('#flight-dialog .flight-dialog-kicker').innerText(), /CORE DELIVERED/);
    assert.equal(await page.locator('#flight-phase').innerText(), 'DELIVERED');
    assert.equal(await page.locator(`#flight-board.settled`).count(), 1);
    assert.equal(await page.locator(`[data-flight-course="${shot.course}"] i`).innerText(), '✓');
    assert.ok((await page.locator('#flight-trail').getAttribute('d') || '').length > 30);
    await screenshot(`course-${shot.course + 1}-delivered`);
    report.shots.push({ ...shot, elapsedMs: Date.now() - started, learned: [...learned, ...loadLessons] });
    check(`${shot.name} completes through the visible angle, power, mineral, and launch controls`);
    await page.locator('#flight-next').click();
  }
  await page.locator('#station-02').waitFor();
  assert.equal(await page.locator('#station-02').evaluate(station => station.classList.contains('restored')), true);
  await screenshot('arcade-stamp');
  await page.reload();
  assert.equal(await page.locator('#station-02').evaluate(station => station.classList.contains('restored')), true);
  await page.locator('#station-02').click();
  assert.equal(await page.locator('#flight-dialog[open]').count(), 0);
  assert.deepEqual(await page.locator('[data-flight-course] i').allTextContents(), ['✓', '✓', '✓']);
  assert.equal(await page.locator('#flight-mode').isChecked(), false);
  await screenshot('saved-courses');
  check('Next-course actions complete the whole campaign; its arcade stamp, completion ticks, lessons, and control mode persist after reload');
  assert.deepEqual(report.errors, []);
  check('Production playthrough has no runtime, console, or asset loading errors');
  report.passed = true;
} catch (error) {
  report.error = error.stack;
  await screenshot('failure');
  throw error;
} finally {
  report.finished = new Date().toISOString();
  await writeFile('artifacts/ballast-flight-production-report.json', JSON.stringify(report, null, 2));
  await browser.close();
}
