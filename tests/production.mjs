import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const url = process.env.WAYWARD_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ channel: process.env.WAYWARD_BROWSER || 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [], report = { url, passed: false, checks: [] };
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
const routes = [[1,'2',5,1,'1',0],[1,'0',2,'2',5,2,'0',1,'1',0],[4,'1',2,'1',3,'0',4,'0',1,'2',5,1,'0',4,'1',0]];
try {
  await page.goto(url); await page.locator('#station-01').click();
  assert.equal(await page.evaluate(() => '__WAYWARD__' in window), false);
  report.checks.push('Development inspector absent from production');
  for (let i = 0; i < routes.length; i++) {
    if (i) await page.locator('#next').click();
    for (const action of routes[i]) {
      if (typeof action === 'number') await page.locator(`#room-${action}`).click();
      else { await page.locator(`#setting-${action}`).click(); await page.locator('#apply').click(); }
    }
    assert.equal(await page.locator('.modal[role="dialog"]').count(), 1);
    assert.match(await page.locator('.modal .eyebrow').innerText(), /RETURNED|RESTORED/);
    report.checks.push(`Production challenge ${i + 1} completed through visible controls`);
  }
  await page.locator('#next').click(); assert.equal(await page.locator('.arcade-game.restored').count(), 1);
  await page.reload(); assert.equal(await page.locator('.arcade-game.restored').count(), 1);
  await page.screenshot({ path: 'artifacts/production-restored-1280.png' });
  assert.deepEqual(errors, []); report.checks.push('Production restoration persists, with no runtime or request errors');
  report.passed = true; console.log(JSON.stringify(report, null, 2));
} finally { report.errors = errors; await writeFile('artifacts/production-report.json', JSON.stringify(report, null, 2)); await browser.close(); }
