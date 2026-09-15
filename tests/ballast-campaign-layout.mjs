import { experiencedPlayer } from './guide-fixture.mjs';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const url = process.env.WAYWARD_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await experiencedPlayer(page);
const report = { url, passed: false, layouts: [], observations: [], screenshots: [], errors: [] };
page.on('pageerror', e => report.errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
page.on('response', r => { if (r.status() >= 400) report.errors.push(`${r.status()} ${r.url()}`); });

try {
  await page.goto(url); await page.locator('#station-02').click();
  assert.equal(await page.locator('.b-tabs button').count(), 12);
  for (const [width, height] of [[1280, 720], [1366, 768], [1920, 1080], [652, 698]]) {
    await page.setViewportSize({ width, height });
    for (let level = 1; level <= 12; level++) {
      await page.locator(`#b-challenge-${level - 1}`).click();
      await page.locator('#b-world').waitFor();
      const layout = await page.evaluate(() => {
        const box = e => { const r = e.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
        const visible = e => { const r = box(e); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
        const contains = (a, b, tolerance = 1) => b.left >= a.left - tolerance && b.top >= a.top - tolerance && b.right <= a.right + tolerance && b.bottom <= a.bottom + tolerance;
        const viewport = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
        const controls = [...document.querySelectorAll('.b-tabs button,.b-heading,.b-chamber,.b-panel,.b-controls,.b-panel button,.b-controls button')].filter(visible);
        const outside = controls.filter(e => !contains(viewport, box(e))).map(e => ({ text: e.textContent.trim().slice(0, 60), box: box(e) }));
        const panel = document.querySelector('.b-panel');
        const svg = document.querySelector('#b-world'), svgBox = box(svg);
        const labels = [...svg.querySelectorAll('text')].filter(visible).map(e => ({ text: e.textContent.trim(), className: e.getAttribute('class') ?? e.parentElement.getAttribute('class'), box: box(e) }));
        const clippedLabels = labels.filter(l => !contains(svgBox, l.box));
        const gateOverflow = [...svg.querySelectorAll('.b-gate-label')].map(g => ({ text: g.querySelector('text').textContent, label: box(g.querySelector('text')), badge: box(g.querySelector('rect')) })).filter(g => !contains(g.badge, g.label));
        const overlaps = [];
        for (let a = 0; a < labels.length; a++) for (let b = a + 1; b < labels.length; b++) {
          const x = Math.min(labels[a].box.right, labels[b].box.right) - Math.max(labels[a].box.left, labels[b].box.left);
          const y = Math.min(labels[a].box.bottom, labels[b].box.bottom) - Math.max(labels[a].box.top, labels[b].box.top);
          if (x > 2 && y > 2) overlaps.push({ first: labels[a].text, second: labels[b].text, overlap: { width: +x.toFixed(2), height: +y.toFixed(2) }, firstBox: labels[a].box, secondBox: labels[b].box });
        }
        return {
          viewport: [innerWidth, innerHeight], outside, pageScroll: document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight,
          panelOverflow: panel.scrollWidth > panel.clientWidth + 2 || panel.scrollHeight > panel.clientHeight + 2,
          labels: labels.length, clippedLabels, gateOverflow, overlaps,
        };
      });
      report.layouts.push({ level, ...layout });
      assert.deepEqual(layout.outside, [], `Level ${level} at ${width}: controls outside viewport`);
      assert.equal(layout.pageScroll, false, `Level ${level} at ${width}: page overflow`);
      assert.equal(layout.panelOverflow, false, `Level ${level} at ${width}: panel overflow`);
      assert.deepEqual(layout.clippedLabels, [], `Level ${level} at ${width}: clipped SVG label`);
      assert.deepEqual(layout.gateOverflow, [], `Level ${level} at ${width}: gate label does not fit badge`);
      assert.deepEqual(layout.overlaps, [], `Level ${level} at ${width}: SVG labels overlap`);
      if (layout.overlaps.length) report.observations.push({ level, width, labelOverlaps: layout.overlaps });
      if ([5, 7, 9, 12].includes(level) && [1280, 652].includes(width)) {
        const path = `artifacts/ballast-campaign-layout-${level}-${width}.png`;
        await page.screenshot({ path, animations: 'disabled' }); report.screenshots.push(path);
      }
    }
  }
  assert.deepEqual(report.errors, []);
  report.passed = true;
  console.log(JSON.stringify({ passed: report.passed, layouts: report.layouts.length, observations: report.observations, screenshots: report.screenshots, errors: report.errors }));
} catch (error) {
  report.error = error.stack;
  await page.screenshot({ path: 'artifacts/ballast-campaign-layout-failure.png', animations: 'disabled' });
  throw error;
} finally {
  await writeFile('artifacts/ballast-campaign-layout-report.json', JSON.stringify(report, null, 2));
  await browser.close();
}
