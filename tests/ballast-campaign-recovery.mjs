import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const url = process.env.WAYWARD_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 652, height: 698 } });
const report = { url, passed: false, checks: [], errors: [] };
page.on('pageerror', e => report.errors.push(e.message));
const slots = () => page.locator('.b-sockets button').evaluateAll(nodes => nodes.map(n => n.dataset.mineral));
const setPair = async () => { await page.locator('#b-slot-0').click(); await page.locator('#b-load-east').click(); await page.locator('#b-slot-1').click(); await page.locator('#b-load-north').click(); };
const releaseAtFirstTurn = async (slot, threshold = 235) => {
  await page.locator('#b-launch').click();
  await page.waitForFunction(value => Number(document.querySelector('#b-capsule').getAttribute('transform').match(/[-\d.]+/g)[0]) >= value, threshold);
  await page.keyboard.press('Escape'); await page.locator(`#b-preview-${slot}`).click(); await page.locator('#b-release').click();
  await page.locator('#b-dock-1.docked').waitFor({ timeout: 12000 });
};
try {
  await page.goto(url); await page.locator('#station-02').click(); await page.locator('#b-challenge-5').click();
  await setPair(); await releaseAtFirstTurn(0);
  assert.deepEqual(await slots(), ['', 'north']);
  assert.equal(await page.locator('#b-load-north').isDisabled(), true);
  assert.equal(await page.locator('#b-load-east').isEnabled(), true);
  await page.locator('#b-slot-1').click(); await page.locator('#b-empty').click(); assert.deepEqual(await slots(), ['', '']);
  await page.keyboard.press('z'); assert.deepEqual(await slots(), ['', 'north']);
  report.checks.push('A restricted refit shows its stock, and Z restores a discarded mineral that the dock cannot supply');
  await page.locator('#b-slot-0').click(); await page.locator('#b-load-east').click(); await page.locator('#b-launch').click();
  await page.waitForFunction(() => Number(document.querySelector('#b-speed-value').textContent) > 20);
  await page.keyboard.press('z'); assert.deepEqual(await slots(), ['east', 'north']); assert.equal(await page.locator('#b-dock-1.docked').count(), 1);
  await page.keyboard.press('Escape'); await page.locator('#b-back-dock').click();
  assert.equal(await page.locator('#b-dock-0.docked').count(), 1); assert.deepEqual(await slots(), ['east', 'north']);
  assert.equal(await page.locator('[data-relay].active').count(), 0);
  report.checks.push('Retry preserves the current launch; Previous dock rewinds a successful leg, cargo, and relay progress');
  await releaseAtFirstTurn(1, 250); assert.deepEqual(await slots(), ['east', '']);
  await page.keyboard.press('z'); assert.deepEqual(await slots(), ['east', '']);
  await page.keyboard.press('Escape'); await page.locator('#b-back-dock').click();
  assert.equal(await page.locator('#b-dock-0.docked').count(), 1); assert.deepEqual(await slots(), ['east', 'north']);
  report.checks.push('Even arriving with the wrong carried mineral can be recovered without restarting the level');
  await page.keyboard.press('Escape'); assert.equal(await page.locator('#b-back-dock').count(), 0); await page.locator('#b-resume').click();
  await page.keyboard.press('r'); assert.deepEqual(await slots(), ['', '']);
  report.checks.push('Dock history is consumed once and full restart clears the run');
  assert.deepEqual(report.errors, []); report.passed = true; console.log(JSON.stringify(report));
} catch (error) { report.error = error.stack; await page.screenshot({ path: 'artifacts/ballast-campaign-recovery-failure.png' }); throw error; }
finally { await writeFile('artifacts/ballast-campaign-recovery-report.json', JSON.stringify(report, null, 2)); await browser.close(); }
