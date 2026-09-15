import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

// Use the development server for read-only state inspection. Every mutation below
// is made through the same controls available to a player.
const url = process.env.BASE_URL || process.env.WAYWARD_URL || 'http://127.0.0.1:5173';
const lessons = ['launch', 'fields', 'shutter', 'repel', 'mixed'];
const browser = await chromium.launch({ channel: process.env.WAYWARD_BROWSER || 'msedge', headless: true });
const report = { url, started: new Date().toISOString(), checks: [], layouts: [], screenshots: [], errors: [], passed: false };
const tracked = [];
let page;
const check = (name, detail) => { report.checks.push({ name, ...(detail === undefined ? {} : { detail }) }); console.log(`PASS ${name}`); };
const inspect = target => target.evaluate(() => window.__WAYWARD__.inspect());
const shielded = state => state.shielded ?? state.state.shielded;
const physical = snapshot => {
  const { x, y, vx, vy, time, phase } = snapshot.state;
  return { x, y, vx, vy, time, phase };
};
const settings = snapshot => ({ angle: snapshot.angle, power: snapshot.power, loadout: snapshot.loadout, mode: snapshot.mode });
function track(target) {
  tracked.push(target);
  target.on('pageerror', error => report.errors.push(error.message));
  target.on('response', response => { if (response.status() >= 400) report.errors.push(`${response.status()} ${response.url()}`); });
  return target;
}
async function screenshot(target, name) {
  const file = `artifacts/ballast-flight-${name}.png`;
  await target.screenshot({ path: file, animations: 'disabled' });
  report.screenshots.push(file);
}
async function createPage({ learned = false, viewport = { width: 1280, height: 720 }, reducedMotion = 'no-preference' } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion });
  if (learned) await context.addInitScript(ids => {
    localStorage.setItem('wayward-flight-lessons-v1', JSON.stringify(ids));
    localStorage.setItem('wayward-field-guide-v1', JSON.stringify(['a-travel', 'a-dial', 'a-linked', 'a-return']));
  }, lessons);
  const target = track(await context.newPage());
  await target.goto(url);
  await target.locator('#station-02').waitFor();
  return target;
}
async function lessonId(target) {
  const id = await target.locator('#flight-dialog[open]').getAttribute('data-lesson');
  assert.ok(id && lessons.includes(id), `A tutorial page identifies its introduced feature; got ${id}`);
  return id;
}
async function finishGuide(target) {
  const seen = [];
  for (let n = 0; n < 10 && await target.locator('#flight-dialog[open]').count(); n++) {
    seen.push(await lessonId(target));
    await target.locator('#flight-continue').click();
  }
  assert.equal(await target.locator('#flight-dialog[open]').count(), 0, 'Guide has a finite dismissal path');
  return seen;
}
async function guideFits(target, label) {
  const result = await target.locator('#flight-dialog[open]').evaluate(dialog => {
    const rect = dialog.getBoundingClientRect();
    const buttons = [...dialog.querySelectorAll('button')].filter(button => !button.disabled && button.getBoundingClientRect().width);
    return {
      outside: rect.left < -1 || rect.right > innerWidth + 1 || rect.top < -1 || rect.bottom > innerHeight + 1,
      overflow: dialog.scrollWidth > dialog.clientWidth + 1,
      hiddenButtons: buttons.filter(button => { const r = button.getBoundingClientRect(); return r.left < 0 || r.right > innerWidth + 1 || r.top < 0 || r.bottom > innerHeight + 1; }).map(button => button.id),
      visualCount: dialog.querySelectorAll('svg, img, canvas').length,
      text: dialog.innerText.trim().length,
    };
  });
  assert.equal(result.outside, false, `${label}: guide fits viewport`);
  assert.equal(result.overflow, false, `${label}: guide has no horizontal clipping`);
  assert.deepEqual(result.hiddenButtons, [], `${label}: guide buttons stay visible`);
  assert.ok(result.visualCount > 0 && result.text > 30, `${label}: guide explains through text and a visual`);
}
async function layout(target, label) {
  await target.evaluate(() => window.scrollTo(0, 0));
  const result = await target.evaluate(() => {
    const boardElement = document.querySelector('#flight-board');
    const board = boardElement.getBoundingClientRect();
    const matrix = boardElement.getScreenCTM();
    const controls = [...document.querySelectorAll('#flight-angle, #flight-power, #flight-launch, #flight-retry, [data-flight-load], [data-flight-course], #flight-mode')];
    const hiddenControls = controls.filter(control => {
      const rect = control.getBoundingClientRect();
      return !rect.width || !rect.height || rect.left < -1 || rect.right > innerWidth + 1;
    }).map(control => control.id || control.getAttribute('data-flight-load') || control.getAttribute('data-flight-course'));
    return { viewport: [innerWidth, innerHeight], document: [document.documentElement.scrollWidth, document.documentElement.scrollHeight], board: board.toJSON(), scale: [matrix.a, matrix.d], hiddenControls };
  });
  assert.ok(result.document[0] <= result.viewport[0] + 1, `${label}: no horizontal page scroll`);
  assert.deepEqual(result.hiddenControls, [], `${label}: controls have usable visible bounds`);
  assert.ok(result.scale[0] > 0 && Math.abs(result.scale[0] - result.scale[1]) < 0.0001, `${label}: chamber keeps its physical proportions`);
  assert.ok(result.board.left >= -1 && result.board.right <= result.viewport[0] + 1, `${label}: chamber width fits`);
  if (result.viewport[0] >= 652) assert.ok(result.document[1] <= result.viewport[1] + 1, `${label}: desktop and narrow app view fit without page scroll`);
  report.layouts.push({ label, ...result });
}
async function setRange(target, id, value) {
  const input = target.locator(id);
  await input.focus();
  await target.keyboard.press('Home');
  const minimum = Number(await input.getAttribute('min'));
  for (let n = minimum; n < value; n++) await target.keyboard.press('ArrowRight');
  assert.equal(Number(await input.inputValue()), value);
}
async function ready(target) {
  if ((await inspect(target)).paused) await target.locator('#flight-resume').click();
  if (await target.locator('#flight-dialog[open] [data-flight-dialog="retry"]').count()) await target.locator('#flight-dialog [data-flight-dialog="retry"]').click();
  else await target.locator('#flight-retry').click();
  assert.notEqual((await inspect(target)).state.phase, 'flying');
}
async function moving(target) {
  await target.waitForFunction(() => {
    const snapshot = window.__WAYWARD__.inspect();
    return snapshot.state.phase === 'flying' && snapshot.state.time > 0.08;
  });
  return inspect(target);
}
async function waitForShield(target, active) {
  await target.waitForFunction(expected => {
    const snapshot = window.__WAYWARD__.inspect();
    return (snapshot.shielded ?? snapshot.state.shielded) === expected;
  }, active);
}
try {
  await mkdir('artifacts', { recursive: true });
  page = await createPage();
  assert.equal(await page.locator('.arcade-game').count(), 5);
  assert.deepEqual(await page.locator('.arcade-game h2').allTextContents(), ['Adjacent', 'Ballast', 'Borrowed Properties', 'Heat Shepherd', 'Pocket Biome']);
  const hubText = await page.locator('body').innerText();
  const expectedHub = await page.locator('.arcade-title, .arcade-game h2, .arcade-game p').allInnerTexts();
  assert.equal(hubText.replace(/\s+/g, ' ').trim(), expectedHub.join(' ').replace(/\s+/g, ' ').trim());
  check('Arcade retains only its title, five game titles, and five descriptions');
  await page.locator('#station-02').click();
  await page.locator('#flight-dialog[open]').waitFor();
  assert.equal(await lessonId(page), 'launch');
  const firstState = physical(await inspect(page));
  await page.locator('#flight-dialog').focus();
  for (const key of ['Space', 'r', 'ArrowRight']) await page.keyboard.press(key);
  assert.deepEqual(physical(await inspect(page)), firstState, 'Tutorial blocks game shortcuts');
  for (const [width, height] of [[1280, 720], [652, 698], [390, 844], [740, 390]]) {
    await page.setViewportSize({ width, height });
    await guideFits(page, `introduction-${width}`);
    await screenshot(page, `introduction-${width}`);
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  for (let n = 0; n < 9; n++) {
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => !!document.activeElement.closest('#flight-dialog[open]')), true, 'Native guide keeps Tab focus inside');
  }
  const taught = await finishGuide(page);
  assert.ok(taught.includes('launch') && taught.includes('fields') && taught.includes('shutter'));
  check('Fresh course teaches launching, fields, and shutter visually; modal isolates input and fits four viewports', taught);
  await page.locator('[data-flight-course="1"]').click();
  const secondLessons = await finishGuide(page);
  assert.ok(secondLessons.includes('repel'));
  assert.ok(!secondLessons.includes('launch'), 'Previously acknowledged instructions do not repeat');
  await page.locator('[data-flight-course="2"]').click();
  const thirdLessons = await finishGuide(page);
  assert.ok(thirdLessons.includes('mixed'));
  await page.locator('[data-flight-course="0"]').click();
  assert.equal(await page.locator('#flight-dialog[open]').count(), 0);
  const learned = await page.evaluate(() => JSON.parse(localStorage.getItem('wayward-flight-lessons-v1')));
  for (const id of lessons) assert.ok(learned.includes(id), `${id} is acknowledged independently of campaign progress`);
  await page.reload();
  await page.locator('#station-02').click();
  assert.equal(await page.locator('#flight-dialog[open]').count(), 0);
  check('Later courses explain repulsion and mixed colors once; lesson acknowledgments survive reload');

  const jumping = await createPage();
  await jumping.locator('#station-02').click();
  await finishGuide(jumping);
  await jumping.locator('[data-flight-course="2"]').click();
  assert.deepEqual(await finishGuide(jumping), ['repel', 'mixed']);
  await jumping.context().close();
  check('Jumping directly to the third course still teaches its unlearned repulsion prerequisite');

  const firstRed = await createPage();
  await firstRed.locator('#station-02').click();
  await finishGuide(firstRed);
  await firstRed.locator('[data-flight-load="red"]').click();
  assert.equal(await lessonId(firstRed), 'repel');
  await guideFits(firstRed, 'first Ironroot load');
  assert.deepEqual(await finishGuide(firstRed), ['repel']);
  await firstRed.locator('[data-flight-load="blue"]').click();
  await firstRed.locator('[data-flight-load="red"]').click();
  assert.equal(await firstRed.locator('#flight-dialog[open]').count(), 0);
  await firstRed.context().close();
  check('The first Ironroot load teaches repulsion immediately, even on the first course');

  const experienced = await createPage({ learned: true });
  page = experienced;
  await page.locator('#station-02').click();
  assert.equal(await page.locator('#flight-dialog[open]').count(), 0);
  assert.equal(await page.locator('#flight-board').getAttribute('viewBox'), '0 0 960 540');
  assert.equal(await page.locator('#flight-status').getAttribute('role'), 'status');
  assert.equal(await page.locator('[data-flight-course]').count(), 3);
  assert.equal(await page.locator('[data-flight-load]').count(), 4);
  for (const [width, height] of [[1280, 720], [652, 698], [390, 844]]) {
    await page.setViewportSize({ width, height });
    for (let index = 0; index < 3; index++) {
      await page.locator(`[data-flight-course="${index}"]`).click();
      await layout(page, `course-${index + 1}-${width}`);
    }
    await screenshot(page, `course-3-${width}`);
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.locator('[data-flight-course="0"]').click();
  check('Three courses, four loadouts, and controls fit desktop and narrow layouts; mobile has no horizontal clipping');

  await page.locator('[data-flight-load="neutral"]').click();
  const coreOnScreen = await page.locator('#flight-core').evaluate(core => {
    const matrix = core.getScreenCTM();
    const origin = new DOMPoint(0, 0).matrixTransform(matrix);
    return { x: origin.x, y: origin.y, scale: matrix.a };
  });
  await page.mouse.move(coreOnScreen.x, coreOnScreen.y);
  await page.mouse.down();
  await page.mouse.move(coreOnScreen.x - 77 * coreOnScreen.scale, coreOnScreen.y, { steps: 5 });
  await page.mouse.up();
  await moving(page);
  assert.equal((await inspect(page)).angle, 0);
  assert.ok(Math.abs((await inspect(page)).power - 55) <= 1);
  await ready(page);
  check('Pulling back from the painted core sets direction and power and launches on release');
  await setRange(page, '#flight-angle', 0);
  await setRange(page, '#flight-power', 55);
  const aimSettings = settings(await inspect(page));
  const launchPoint = physical(await inspect(page));
  await page.locator('#flight-power').focus();
  await page.keyboard.press('Space');
  assert.deepEqual(physical(await inspect(page)), launchPoint, 'A range must not trigger a global launch shortcut');
  assert.equal((await inspect(page)).power, 55);
  await page.locator('#flight-launch').click();
  const firstFlight = await moving(page);
  assert.ok(Math.hypot(firstFlight.state.vx, firstFlight.state.vy) > 1);
  assert.ok(Math.hypot(firstFlight.state.x - launchPoint.x, firstFlight.state.y - launchPoint.y) > 1);
  await page.waitForFunction(() => (document.querySelector('#flight-trail').getAttribute('d') || '').length > 8);
  await page.locator('#flight-retry').click();
  assert.deepEqual(settings(await inspect(page)), aimSettings);
  assert.ok((await page.locator('#flight-ghost').getAttribute('d') || '').length > 8, 'Retry retains a visual record of the previous shot');
  assert.equal((await inspect(page)).state.x, launchPoint.x);
  assert.equal((await inspect(page)).state.y, launchPoint.y);
  assert.equal((await inspect(page)).state.time, 0);
  check('Pointer launch produces motion and a trail; instant retry keeps angle, power, loadout, and the previous path');

  await page.locator('#flight-launch').focus();
  await page.keyboard.press('Enter');
  await moving(page);
  await page.locator('#flight-board').focus();
  await page.keyboard.down('Space');
  await waitForShield(page, true);
  const held = await inspect(page);
  await page.waitForTimeout(120);
  const later = await inspect(page);
  assert.equal(shielded(later), true);
  assert.ok(later.state.time > held.state.time);
  assert.ok(Math.hypot(later.state.x - held.state.x, later.state.y - held.state.y) > 1, 'Shielding suppresses fields without stopping momentum');
  await page.keyboard.up('Space');
  await waitForShield(page, false);
  await ready(page);
  check('Enter launches and holding Space shields during flight while momentum continues; release restores the fields');

  await page.locator('#flight-launch').click();
  await moving(page);
  await page.locator('#flight-shutter').hover();
  await page.mouse.down();
  await waitForShield(page, true);
  assert.equal(shielded(await inspect(page)), true);
  await page.mouse.move(1, 1);
  await page.mouse.up();
  await waitForShield(page, false);
  await page.locator('#flight-pause').click();
  const paused = await inspect(page);
  assert.equal(paused.paused, true);
  await page.waitForTimeout(200);
  assert.deepEqual(physical(await inspect(page)), physical(paused));
  await page.locator('#flight-resume').click();
  await page.waitForFunction(previousTime => window.__WAYWARD__.inspect().state.time > previousTime, paused.state.time);
  await ready(page);
  check('Pointer shutter releases outside its button; pause preserves all physics until explicit resume');

  await page.locator('#flight-launch').click();
  await moving(page);
  await page.locator('#flight-board').focus();
  await page.keyboard.down('Space');
  await waitForShield(page, true);
  assert.equal(shielded(await inspect(page)), true);
  // Headless browser focus is not a reliable OS focus signal; explicitly exercise
  // the same browser blur handler without mutating the game or model directly.
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const blurred = await inspect(page);
  assert.equal(blurred.paused, true);
  assert.equal(shielded(blurred), false);
  await page.keyboard.up('Space');
  await page.waitForTimeout(220);
  assert.deepEqual(physical(await inspect(page)), physical(blurred));
  await page.locator('#flight-resume').click();
  assert.equal(shielded(await inspect(page)), false);
  await ready(page);
  check('Focus-loss handler freezes physics and clears a held shutter; resume cannot inherit a stuck key', { blurEvent: 'synthetic' });

  await page.locator('#flight-launch').click();
  await moving(page);
  await page.locator('#flight-board').focus();
  await page.keyboard.down('Space');
  await waitForShield(page, true);
  assert.equal(await page.locator('#flight-shutter').evaluate(button => button.classList.contains('held')), true);
  await page.keyboard.press('r');
  assert.equal((await inspect(page)).state.phase, 'ready');
  assert.equal(shielded(await inspect(page)), false);
  assert.equal(await page.locator('#flight-shutter').getAttribute('aria-pressed'), 'false');
  assert.equal(await page.locator('#flight-shutter').evaluate(button => button.classList.contains('held')), false);
  await page.keyboard.up('Space');
  check('Retry while Space remains held clears physical shielding, the pressed state, and the held-button appearance');

  await page.locator('#flight-mode').uncheck();
  assert.equal((await inspect(page)).mode, 'classic');
  await page.locator('#flight-launch').click();
  await moving(page);
  await page.locator('#flight-board').focus();
  await page.keyboard.down('Space');
  await page.waitForTimeout(80);
  assert.equal(shielded(await inspect(page)), false);
  await page.keyboard.up('Space');
  await ready(page);
  await page.locator('#flight-mode').check();
  assert.equal((await inspect(page)).mode, 'shutter');
  check('Launch-and-watch mode ignores in-flight shutter input and can be compared with the timing mode');

  await page.locator('[data-flight-load="blue"]').click();
  await page.locator('#flight-launch').click();
  await moving(page);
  const help = page.locator('#flight-help');
  await (await help.count() ? help : page.locator('#help')).click();
  await page.locator('#flight-dialog[open]').waitFor();
  const whileGuide = physical(await inspect(page));
  await page.waitForTimeout(200);
  assert.deepEqual(physical(await inspect(page)), whileGuide);
  await guideFits(page, 'replayed visual guide');
  const replayed = await finishGuide(page);
  assert.ok(replayed.length > 0);
  if ((await inspect(page)).paused) await page.locator('#flight-resume').click();
  await ready(page);
  check('Help replays illustrated teaching during a flight and keeps the physics frozen while reading', replayed);

  // These shots have broad capture windows in the deterministic model. Running
  // them through ordinary controls verifies the render/input/model boundary.
  const winningShots = [
    { course: 0, loadout: 'blue', angle: -30, power: 68 },
    { course: 1, loadout: 'red', angle: -4, power: 68 },
    { course: 2, loadout: 'mixed', angle: -12, power: 84 },
  ];
  await page.locator('#flight-mode').uncheck();
  for (const shot of winningShots) {
    await page.locator(`[data-flight-course="${shot.course}"]`).click();
    await page.locator(`[data-flight-load="${shot.loadout}"]`).click();
    await setRange(page, '#flight-angle', shot.angle);
    await setRange(page, '#flight-power', shot.power);
    await page.locator('#flight-launch').click();
    await page.waitForFunction(() => window.__WAYWARD__.inspect().state.phase === 'won', null, { timeout: 12000 });
    const captured = await inspect(page);
    assert.equal(captured.state.vx, 0);
    assert.equal(captured.state.vy, 0);
    assert.match(await page.locator('#flight-status').innerText(), /receiver|captur|deliver|home|settled|arrival/i);
    assert.equal(await page.locator(`[data-flight-course="${shot.course}"] i`).innerText(), '✓');
    await screenshot(page, `course-${shot.course + 1}-complete`);
    await page.locator('#flight-dialog[open] [data-flight-dialog="retry"]').click();
    assert.deepEqual(settings(await inspect(page)), settings(captured));
    assert.notEqual((await inspect(page)).state.phase, 'won');
    check(`Course ${shot.course + 1} reaches its receiver through real launch controls and supports replay`, shot);
  }

  await page.locator('#return-hub').click();
  assert.equal(await page.locator('#station-02').evaluate(station => station.classList.contains('restored')), true);
  await page.reload();
  assert.equal(await page.locator('#station-02').evaluate(station => station.classList.contains('restored')), true);
  await page.locator('#station-02').click();
  assert.deepEqual(await page.locator('[data-flight-course] i').allTextContents(), ['✓', '✓', '✓']);
  assert.equal(await page.locator('#flight-mode').isChecked(), false);
  await page.locator('#return-hub').click();
  check('Course completion ticks update immediately; all three ticks, the arcade stamp, and control mode survive reload');
  await page.locator('#station-01').click();
  assert.equal(await page.locator('.room').count(), 6);
  const adjacentStart = (await inspect(page)).state;
  await page.locator('#room-1').click();
  assert.equal((await inspect(page)).state.room, 1);
  await page.keyboard.press('z');
  assert.deepEqual((await inspect(page)).state, adjacentStart);
  check('Adjacent still starts, permits travel, and restores its prior state with undo');

  const blockedContext = await browser.newContext({ viewport: { width: 652, height: 698 } });
  await blockedContext.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage blocked'); } }));
  const blocked = track(await blockedContext.newPage());
  await blocked.goto(url);
  await blocked.locator('#station-02').click();
  assert.deepEqual(await finishGuide(blocked), ['launch', 'fields', 'shutter']);
  await blocked.locator('[data-flight-course="2"]').click();
  assert.deepEqual(await finishGuide(blocked), ['repel', 'mixed']);
  await blocked.locator('[data-flight-course="0"]').click();
  assert.equal(await blocked.locator('#flight-dialog[open]').count(), 0);
  await blocked.locator('[data-flight-load="neutral"]').click();
  await blocked.locator('#flight-launch').click();
  await moving(blocked);
  assert.equal(await blocked.locator('.storage-warning').count(), 1);
  await blockedContext.close();
  check('Unavailable storage leaves tutorials and gameplay usable, remembers lessons during the session, and explains that progress cannot save');
  assert.deepEqual(report.errors, []);
  check('No browser runtime or failed asset responses');
  report.passed = true;
} catch (error) {
  report.error = error.stack;
  if (page && !page.isClosed()) await screenshot(page, 'failure');
  throw error;
} finally {
  report.finished = new Date().toISOString();
  await writeFile('artifacts/ballast-flight-browser-report.json', JSON.stringify(report, null, 2));
  await browser.close();
}
