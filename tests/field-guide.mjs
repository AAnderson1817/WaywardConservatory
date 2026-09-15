import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const url = process.env.WAYWARD_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({channel:'msedge',headless:true});
const context = await browser.newContext({viewport:{width:1280,height:720}});
const page = await context.newPage();
const report = {checks:[],errors:[],screenshots:[],passed:false};
page.on('pageerror',e=>report.errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
const check = name=>{report.checks.push(name);console.log(`PASS ${name}`);};
const shot=async name=>{const file=`artifacts/illustrated-${name}.png`;await page.screenshot({path:file,animations:'disabled'});report.screenshots.push(file);};
const next=async()=>page.locator('.field-guide[open] [data-guide="next"]').click();
const skip=async()=>page.locator('.field-guide[open] [data-guide="skip"]').click();
const close=async()=>page.locator('.field-guide[open] .guide-close').click();
const lesson=()=>page.locator('.field-guide[open] .guide-card').getAttribute('data-lesson');
async function fit(name) {
  const result=await page.locator('.field-guide[open] .guide-card').evaluate(card=>{
    const box=card.getBoundingClientRect();
    const offscreen=[...card.querySelectorAll('button')].filter(b=>{const r=b.getBoundingClientRect();return r.left<0||r.right>innerWidth||r.top<0||r.bottom>innerHeight;}).map(b=>b.textContent);
    return {outside:box.left<0||box.right>innerWidth||box.top<0||box.bottom>innerHeight,overflow:card.scrollWidth>card.clientWidth+1,offscreen};
  });
  assert.deepEqual(result,{outside:false,overflow:false,offscreen:[]},name);
}
try {
  await mkdir('artifacts',{recursive:true});
  await page.goto(url);await page.waitForLoadState('networkidle');await shot('arcade-1280');
  assert.equal(await page.locator('.arcade-game').count(),5);
  assert.equal(await page.locator('.arcade-cover').count(),5);
  await page.locator('#station-02').click();
  assert.equal(await lesson(),'b-load');await fit('loading tutorial');await shot('ballast-loading');
  const initial=await page.locator('#b-capsule').getAttribute('transform');
  await page.locator('.field-guide[open] h2').evaluate(e=>{e.tabIndex=-1;e.focus();});
  for(const key of ['Space','q','ArrowRight','r','z'])await page.keyboard.press(key);
  assert.equal(await page.locator('#b-capsule').getAttribute('transform'),initial);
  assert.equal(await page.locator('#b-slot-0').getAttribute('data-mineral'),'');
  await page.waitForFunction(()=>document.querySelector('.field-guide[open] .guide-stage').dataset.state==='after');
  assert.match(await page.locator('.field-guide[open] .guide-caption').innerText(),/pulls right/);
  check('Fresh Ballast tutorial demonstrates loading and blocks game shortcuts');
  await next();assert.equal(await lesson(),'b-dock');await next();
  assert.equal(await page.locator('.field-guide[open]').count(),0);
  await page.locator('#b-challenge-1').click();assert.equal(await lesson(),'b-combine');await next();
  await page.locator('#b-challenge-2').click();assert.equal(await lesson(),'b-release');await shot('ballast-release');
  await next();assert.equal(await lesson(),'b-plan');await next();assert.equal(await lesson(),'b-relay');await next();
  check('Only newly introduced mechanics interrupt the next level');
  await page.locator('#b-challenge-5').click();
  const advanced=[];while(await page.locator('.field-guide[open]').count()){advanced.push(await lesson());await next();}
  assert.ok(advanced.includes('b-order'));assert.ok(advanced.includes('b-stock'));check('Ordered relays and limited stock receive visual introductions');
  await page.locator('#b-challenge-0').click();assert.equal(await page.locator('.field-guide[open]').count(),0);
  await page.locator('#b-load-east').click();await page.locator('#b-launch').click();
  await page.waitForFunction(()=>Number(document.querySelector('#b-capsule').getAttribute('transform').match(/[\d.]+/g)[0])>170);
  await page.locator('#help').click();
  const frozen=await page.locator('#b-capsule').getAttribute('transform');
  await page.waitForTimeout(400);assert.equal(await page.locator('#b-capsule').getAttribute('transform'),frozen);
  await page.locator('.field-guide[open] [data-lesson="b-release"]').click();
  for(let i=0;i<12;i++){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>!!document.activeElement.closest('.field-guide[open]')),true);}
  await page.waitForTimeout(200);assert.equal(await page.locator('#b-capsule').getAttribute('transform'),frozen);
  await close();await page.waitForTimeout(200);assert.notEqual(await page.locator('#b-capsule').getAttribute('transform'),frozen);
  await page.keyboard.press('z');check('Field guide freezes flight, traps keyboard focus, and resumes without jumping');
  await page.locator('#b-challenge-5').click();
  const relay=page.locator('.b-relay').first();await relay.hover();assert.match(await page.locator('.b-object-tooltip').innerText(),/Relay A/);
  await relay.focus();await page.keyboard.press('Enter');assert.ok(['b-relay','b-order'].includes(await lesson()));await close();
  check('Chamber objects explain their state on hover/focus and open illustrated help with Enter');
  await page.locator('#help').click();await page.locator('.field-guide[open] [data-lesson="b-order"]').click();
  for(const [width,height] of [[1280,720],[652,698],[390,844],[740,390]]){
    await page.setViewportSize({width,height});await fit(`guide ${width}`);await shot(`guide-${width}`);
  }
  await close();await page.setViewportSize({width:652,height:698});await shot('ballast-652');
  await page.locator('#return-hub').click();await shot('arcade-652');
  await page.locator('#station-01').click();assert.equal(await lesson(),'a-travel');await shot('adjacent-first-652');
  await next();assert.equal(await lesson(),'a-return');await next();
  // The first dial is encountered on entering Moss Room, not on the title screen.
  await page.locator('#room-1').click();assert.equal(await lesson(),'a-dial');await fit('dial lesson');await next();
  while(await page.locator('.field-guide[open]').count())await next();
  await page.locator('#setting-2').click();await page.locator('#apply').click();await page.locator('#room-5').click();
  assert.match(await page.locator('#case-progress').innerText(),/Return/);
  await page.keyboard.press('z');assert.match(await page.locator('#case-progress').innerText(),/Find/);
  check('Adjacent teaches travel, collection, and the first thermostat; painted case follows pickup and undo');
  await page.locator('#challenge-1').click();await page.locator('#room-1').click();
  if(await page.locator('.field-guide[open]').count()){assert.equal(await lesson(),'a-linked');await next();}
  await page.setViewportSize({width:1280,height:720});await shot('adjacent-1280');
  await page.locator('#motion').click();await page.locator('#help').click();await page.locator('.field-guide[open] [data-lesson="a-dial"]').click();
  assert.equal(await page.locator('.guide-stage').getAttribute('data-state'),'before');
  await page.waitForTimeout(1300);assert.equal(await page.locator('.guide-stage').getAttribute('data-state'),'before');
  await page.locator('.field-guide[open] [data-guide="replay"]').click();assert.equal(await page.locator('.guide-stage').getAttribute('data-state'),'after');
  assert.equal(await page.locator('.demo-thermostat path').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
  await close();check('Reduced motion uses explicit static before/after demonstrations');
  await page.locator('#return-hub').click();await page.reload();await page.locator('#station-02').click();
  assert.equal(await page.locator('.field-guide[open]').count(),0);check('Acknowledged lessons persist independently of game progress');
  const fresh=await browser.newPage({viewport:{width:652,height:698}});await fresh.goto(url);await fresh.locator('#station-02').click();await fresh.locator('[data-guide="skip"]').click();await fresh.locator('#b-challenge-11').click();
  const jumped=[];while(await fresh.locator('.field-guide[open]').count()){jumped.push(await fresh.locator('.guide-card').getAttribute('data-lesson'));await fresh.locator('[data-guide="next"]').click();}
  assert.ok(jumped.includes('b-release')&&jumped.includes('b-stock')&&jumped.includes('b-order'));await fresh.close();check('Jumping directly to level 12 still teaches its unmet prerequisites');
  await page.locator('#motion').click();
  await page.locator('#b-challenge-2').click();
  await page.locator('#b-load-north').click();await page.locator('#b-slot-1').click();await page.locator('#b-load-east').click();await page.locator('#b-launch').click();
  await page.waitForFunction(()=>Number(document.querySelector('#b-speed-value').textContent)>35);
  await page.keyboard.press('q');await page.locator('#help').click();
  const chamberState=()=>page.evaluate(()=>({core:document.querySelector('#b-capsule').getAttribute('transform'),pieces:[...document.querySelectorAll('[data-piece]')].map(e=>e.getAttribute('transform')),relays:[...document.querySelectorAll('[data-relay].active')].map(e=>e.getAttribute('data-relay'))}));
  const pausedPieces=await chamberState();assert.equal(pausedPieces.pieces.length,1);await page.waitForTimeout(300);assert.deepEqual(await chamberState(),pausedPieces);
  // Exercise the focus-loss handler independently of the browser's headless chrome.
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await close();
  await page.locator('#b-resume').waitFor();await page.waitForTimeout(250);assert.deepEqual(await chamberState(),pausedPieces);
  await page.locator('#b-resume').click();await page.waitForTimeout(150);assert.notDeepEqual(await chamberState(),pausedPieces);await page.keyboard.press('z');
  check('Loose minerals and relays freeze with the core; focus loss requires explicit resume');
  await page.setViewportSize({width:652,height:698});await page.locator('#help').click();
  for(const id of ['b-load','b-dock','b-combine','b-release','b-relay','b-plan','b-order','b-stock','b-recovery']){
    await page.locator(`.field-guide[open] [data-lesson="${id}"]`).click();await fit(id);await page.locator('.field-guide[open] [data-guide="library"]').click();
  }
  await close();check('All nine Ballast visual lessons keep their controls visible in the narrow window');
  const dismissal=await browser.newPage();await dismissal.goto(url);await dismissal.locator('#station-02').click();await dismissal.keyboard.press('Escape');await dismissal.reload();await dismissal.locator('#station-02').click();assert.equal(await dismissal.locator('.field-guide[open]').count(),0);await dismissal.close();
  check('Escape dismisses introductions without repeating them on the next visit');
  assert.deepEqual(report.errors,[]);report.passed=true;
} catch(error) { report.error=error.stack;await shot('failure');throw error; }
finally {await writeFile('artifacts/field-guide-report.json',JSON.stringify(report,null,2));await browser.close();}
