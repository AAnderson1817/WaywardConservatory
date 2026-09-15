import { BallastSession, chambers, minerals, force, forecast, releaseForecast, touches, WORLD, switchesFor, gatesFor, gateIsOpen, availableMinerals } from './model';
import type { Mineral, Vec, Rect, Action } from './model';
import type { Save } from '../../shared/save';
import { sound, suspendAudio } from '../../shared/audio';
import { pauseScenery } from '../../shared/scenery';
import { emblem } from '../../shared/art';

type Options = { host: HTMLElement; frame: HTMLElement; modalHost: HTMLElement; save: () => Save; complete: (index: number) => void; hub: () => void };
type Dialog = 'pause' | 'help' | 'result' | 'failure' | null;
const rect = (r: Rect, cls: string) => `<rect class="${cls}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="4"/>`;
const mineralArt = (id: Mineral | null) => id ? `<span class="mineral-gem" style="--mineral:${minerals.find(m => m.id === id)!.color}">${minerals.find(m => m.id === id)!.arrow}</span>` : '<span class="empty-socket">＋</span>';
const path = (points: Vec[]) => points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join('');
const center = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
const switchNode = (i: number) => i ? `b-switch-${i}` : 'b-switch';
const gateNode = (i: number) => i ? `b-gate-${i}` : 'b-gate';

export class BallastScreen {
  index = 0;
  game = new BallastSession(chambers[0]);
  private selected = 0;
  private dialog: Dialog = null;
  private hint = false;
  private hintLevels = chambers.map(() => 0);
  private previewSlot: number | null = null;
  private notice = 'Choose a mineral, then launch.';
  private raf = 0;
  private previousTime = 0;
  private accumulator = 0;
  private disposed = false;
  private uiKey = '';
  private restoreFocus = '';
  private trail: { x: number; y: number }[] = [];
  private drawingTick = -1;
  private panelObserver = new ResizeObserver(() => this.positionDialog());
  constructor(private options: Options) { this.mount(); window.addEventListener('resize', this.positionDialog); this.raf = requestAnimationFrame(this.frame); }
  private get<T extends Element = HTMLElement>(selector: string) { return this.options.host.querySelector<T>(selector)!; }
  private audio(kind: Parameters<typeof sound>[0]) { sound(kind, this.options.save().muted); }
  private mount() {
    const chamber = chambers[this.index];
    this.options.host.innerHTML = `<main class="b-game">
      <div class="b-heading"><h1>Ballast <span>/ ${chamber.title}</span></h1><span class="b-objective">◇ Deliver the core</span></div>
      <div class="b-tabs" aria-label="Choose a level">${chambers.map((c, i) => { const done = this.options.save().ballastCompleted.includes(i); return `<button id="b-challenge-${i}" data-b-challenge="${i}" class="${i === this.index ? 'active' : ''} ${done ? 'completed' : ''}" aria-current="${i === this.index ? 'step' : 'false'}" aria-label="Level ${i + 1}: ${c.title}${done ? ', completed' : ''}" title="${c.title}"><span>${String(i + 1).padStart(2, '0')}</span>${done ? '<i aria-hidden="true">✓</i>' : ''}</button>`; }).join('')}</div>
      <div class="b-play"><section class="b-chamber" aria-label="Anchor chamber"><svg id="b-world" viewBox="0 0 960 540" role="img" aria-label="Chamber, docks, hazards, capsule and resultant force">
        <defs><pattern id="b-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#c3bea1" stroke-opacity=".055"/></pattern><pattern id="b-hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V14" stroke="#cfae79" stroke-opacity=".16" stroke-width="3"/></pattern><marker id="b-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10Z" fill="#e8c67c"/></marker><marker id="b-drift-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 10 5 0 10" fill="none" stroke="#b4d3ce" stroke-width="2"/></marker></defs>
        <rect x="24" y="24" width="912" height="492" rx="14" class="b-shell"/><rect x="26" y="26" width="908" height="488" fill="url(#b-grid)"/>
        ${[[480, 14, '↑', '#9bcdd9'], [946, 270, '→', '#e8c67c'], [480, 526, '↓', '#eb9c7c'], [14, 270, '←', '#a9c69b']].map(([x, y, a, color]) => `<g transform="translate(${x} ${y})" style="color:${color}"><rect x="-11" y="-11" width="22" height="22" rx="4" class="b-anchor"/><text class="b-wall-arrow" y="5">${a}</text></g>`).join('')}
        ${chamber.walls.map(w => `<g>${rect(w, 'b-obstacle')}${rect(w, 'b-hatch')}<path d="M${w.x + 10} ${w.y + 9}h${w.w - 20}" class="b-wall-shine"/></g>`).join('')}
        ${chamber.releaseBay ? `${rect(chamber.releaseBay, 'b-release-bay')}<text class="b-bay-label" x="${chamber.releaseBay.x + chamber.releaseBay.w / 2}" y="${chamber.releaseBay.y + chamber.releaseBay.h + 21}">RELEASE ↑</text>` : ''}
        ${this.circuitArt()}
        ${chamber.docks.map((d, i) => `<g class="b-dock${d.exit ? ' exit' : ''}" id="b-dock-${i}" transform="translate(${d.x} ${d.y})"><circle r="${d.r}" class="b-dock-field"/><circle r="${d.r - 8}" class="b-dock-ring"/><path d="M-12 0H12M0-12V12" class="b-dock-cross"/>${this.dockLabel(i)}${d.minerals ? `<g class="b-dock-supply">${d.minerals.map((id, j) => { const m = minerals.find(m => m.id === id)!; return `<text x="${(j - (d.minerals!.length - 1) / 2) * 19}" y="5" style="fill:${m.color}">${m.arrow}</text>`; }).join('')}</g>` : ''}${d.exit ? '<path class="b-core-glyph" d="m0-17 14 8v18L0 17-14 9V-9Z"/>' : ''}</g>`).join('')}
        <path id="b-forecast"/><circle id="b-forecast-end" r="6"/><path id="b-trail"/><g id="b-pieces"></g>
        <g id="b-preview" visibility="hidden"><path id="b-preview-core"/><path id="b-preview-piece"/><circle id="b-preview-core-end" r="17"/><path id="b-preview-piece-end" d="m0-9 7 4v10L0 9-7 5V-5Z"/></g>
        <g id="b-capsule"><circle class="b-core-halo" r="26"/><ellipse rx="17" ry="17" class="b-capsule-body"/><path d="m0-11 7 5v12L0 11-7 6V-6Z" class="b-core"/><circle id="b-pod-0" cx="-13" cy="0" r="5"/><circle id="b-pod-1" cx="13" cy="0" r="5"/></g>
        <line id="b-pull" marker-end="url(#b-arrow)"/><line id="b-drift" marker-end="url(#b-drift-arrow)"/>
        <g id="b-impact" visibility="hidden"><circle r="13"/><path d="m-6-6 12 12m0-12L-6 6"/></g>
      </svg><div class="b-board-status" id="b-board-status" aria-live="polite"></div></section>
      <aside class="b-panel" aria-label="Ballast controls"><div class="b-panel-heading"><h2 id="b-mode">At the dock</h2><span id="b-dock-name"></span></div>
        <div class="b-force"><span>Resultant pull</span><strong id="b-force-icon">—</strong><small id="b-force-name">No pull</small></div>
        <div class="b-sockets">${[0, 1].map(i => `<button id="b-slot-${i}" data-b-slot="${i}" aria-label="Socket ${i + 1}"><span class="b-slot-label">${i ? 'B' : 'A'} <kbd>${i ? 'E' : 'Q'}</kbd></span><span class="b-slot-content"></span><span class="b-slot-action"></span></button>`).join('')}</div>
        <div class="b-loading"><div class="b-minerals" aria-label="Choose a mineral">${minerals.map(m => `<button id="b-load-${m.id}" data-b-load="${m.id}">${mineralArt(m.id)}<span>${m.name}</span></button>`).join('')}</div><button class="text-button" id="b-empty" data-b-empty="true">Empty selected socket</button></div>
        <div class="b-speed"><span>Drift</span><div><i id="b-speed-fill"></i></div><span id="b-speed-value">0</span></div>
        <button id="b-launch" class="primary" data-b-action="launch">Launch <kbd>Space</kbd></button>
        <div class="b-flight-note"><span class="b-flight-glyph">Ⅱ</span><span>Pause to compare release paths.</span></div><p class="b-lesson">${chamber.lesson}</p>
      </aside></div>
      <div class="b-feedback" role="status"></div><footer class="b-controls"><div><button id="b-quick-retry" data-b-action="retry">↶ Retry <kbd>Z</kbd></button><button id="b-restart" data-b-action="restart">↻ Restart <kbd>R</kbd></button><button id="b-pause" data-b-action="pause">Ⅱ Plan <kbd>Esc</kbd></button><button id="b-hint" data-b-action="hint">? Hint</button></div><span>Q / E · release ballast</span></footer><div id="b-hint-slot"></div>
    </main>`;
    this.uiKey = ''; this.update(); this.panelObserver.disconnect(); this.panelObserver.observe(this.get('.b-panel'));
  }
  private dockLabel(index: number) {
    const dock = chambers[this.index].docks[index];
    // These two labels sit beside gates, so use the open side of their dock.
    const beside = this.index === 6 && index === 0;
    const above = dock.y + dock.r + 22 > 510 || (this.index === 4 && dock.exit);
    const x = beside ? dock.r + 48 : 0, y = beside ? 5 : above ? -dock.r - 12 : dock.r + 22;
    return `<text class="b-dock-label" x="${x}" y="${y}">${dock.name.toUpperCase()}</text>`;
  }
  private circuitArt() {
    const c = chambers[this.index], switches = switchesFor(c), gates = gatesFor(c);
    const letter = (id: string) => String.fromCharCode(65 + switches.findIndex(s => s.id === id));
    const wires = gates.flatMap((gate, gi) => gate.requires.map(id => {
      const si = switches.findIndex(s => s.id === id); if (si < 0) return '';
      const from = center(switches[si].rect), to = center(gate.rect);
      return `<path data-wire="${si}" data-gate="${gi}" d="M${from.x} ${from.y}H${to.x}V${to.y}" class="b-wire"/>`;
    })).join('');
    return `<g class="b-circuits">${wires}</g>${switches.map((relay, i) => {
      const p = center(relay.rect), m = minerals.find(m => m.id === relay.mineral)!;
      const label = `${letter(relay.id)} ${m.arrow}`;
      const prerequisiteX = relay.rect.y < 60 && Math.abs(p.x - 480) < 65 ? p.x + 70 : p.x;
      return `<g id="${switchNode(i)}" data-relay="${relay.id}" class="b-relay" style="--relay-color:${m.color}"><title>Relay ${letter(relay.id)}: ${m.name}${relay.requires?.length ? `, power ${relay.requires.map(letter).join(' and ')} first` : ''}</title>${rect(relay.rect, 'b-plate')}<text x="${p.x}" y="${p.y + 4}" class="b-switch-symbol">${label}</text>${relay.requires?.length ? `<text x="${prerequisiteX}" y="${Math.max(17, relay.rect.y - 7)}" class="b-prerequisite">${relay.requires.map(letter).join(' + ')} → ${letter(relay.id)}</text>` : ''}</g>`;
    }).join('')}${gates.map((gate, i) => {
      const p = center(gate.rect), vertical = gate.rect.h > gate.rect.w;
      const seam = vertical ? `M${p.x} ${gate.rect.y + 8}V${gate.rect.y + gate.rect.h - 8}` : `M${gate.rect.x + 8} ${p.y}H${gate.rect.x + gate.rect.w - 8}`;
      const badge = Math.max(30, 12 + gate.requires.length * 15);
      return `<g id="${gateNode(i)}" class="b-barrier" data-barrier="${gate.id}"><title>Gate: power ${gate.requires.map(letter).join(' and ')}</title>${rect(gate.rect, 'b-gate-panel')}<path d="${seam}" class="b-gate-seam"/><g class="b-gate-label" transform="translate(${p.x} ${p.y})"><rect x="${-badge / 2}" y="-12" width="${badge}" height="24" rx="4"/><text y="4">${gate.requires.map(letter).join('·')}</text></g></g>`;
    }).join('')}`;
  }
  private frame = (now: number) => {
    if (this.disposed) return;
    const elapsed = this.previousTime ? Math.min((now - this.previousTime) / 1000, .1) : 0;
    this.previousTime = now;
    if (!this.dialog) {
      this.accumulator += elapsed;
      while (this.accumulator >= WORLD.dt) {
        const before = this.game.state;
        this.game.step(); this.accumulator -= WORLD.dt;
        const after = this.game.state;
        if (after.activated.length > before.activated.length) {
          const relays = switchesFor(chambers[this.index]);
          const fresh = relays.filter(s => after.activated.includes(s.id) && !before.activated.includes(s.id));
          this.notice = `Relay ${fresh.map(s => String.fromCharCode(65 + relays.indexOf(s))).join(' + ')} powered.`; this.audio('pickup');
          for (const relay of fresh) this.pulse(`#${switchNode(relays.indexOf(relay))}`, '#d5edb4');
        }
        if (before.phase !== after.phase) {
          if (after.phase === 'docked') { this.notice = 'Dock secured. Refit for the next leg.'; this.audio('travel'); this.selected = 0; this.pulse(`#b-dock-${after.dock}`, '#e8d6a2'); }
          if (after.phase === 'crashed') { this.audio('undo'); this.open('failure'); break; }
          if (after.phase === 'won') { this.options.complete(this.index); this.audio('win'); this.open('result'); break; }
        }
      }
      this.update();
    } else this.accumulator = 0;
    this.raf = requestAnimationFrame(this.frame);
  };
  private pulse(selector: string, color: string) {
    if (this.options.save().reduced) return;
    this.get(selector)?.animate([{ filter: `drop-shadow(0 0 12px ${color})`, opacity: .55 }, { filter: 'drop-shadow(0 0 0 transparent)', opacity: 1 }], { duration: 650, easing: 'ease-out' });
  }
  private update() {
    const s = this.game.state, c = chambers[this.index], f = force(s.slots);
    const inBay = c.releaseBay && s.x >= c.releaseBay.x && s.x <= c.releaseBay.x + c.releaseBay.w && s.y >= c.releaseBay.y && s.y <= c.releaseBay.y + c.releaseBay.h;
    this.get('.b-chamber').classList.toggle('release-ready', !!inBay && s.phase === 'flying');
    this.get('.b-chamber').classList.toggle('gate-open', s.gateOpen);
    this.get('.b-chamber').classList.toggle('failed', s.phase === 'crashed');
    this.get('.b-game').classList.toggle('in-flight', s.phase === 'flying');
    this.get('#b-capsule').setAttribute('transform', `translate(${s.x} ${s.y})`);
    this.get('#b-capsule').setAttribute('data-phase', s.phase);
    for (let i = 0; i < 2; i++) this.get(`#b-pod-${i}`).setAttribute('fill', minerals.find(m => m.id === s.slots[i])?.color ?? '#163431');
    const arrow = (id: string, x: number, y: number, length: number, offset: number) => {
      const node = this.get(id), mag = Math.hypot(x, y);
      const ox = mag ? -y / mag * offset : 0, oy = mag ? x / mag * offset : 0;
      node.setAttribute('opacity', mag > .1 ? '1' : '0');
      node.setAttribute('x1', String(s.x + ox + (mag ? x / mag * 24 : 0))); node.setAttribute('y1', String(s.y + oy + (mag ? y / mag * 24 : 0)));
      node.setAttribute('x2', String(s.x + ox + (mag ? x / mag * length : 0))); node.setAttribute('y2', String(s.y + oy + (mag ? y / mag * length : 0)));
    };
    arrow('#b-pull', f.x, f.y, 24 + Math.hypot(f.x, f.y) * 34, -7); arrow('#b-drift', s.vx, s.vy, 26 + Math.min(70, Math.hypot(s.vx, s.vy) / 2), 7);
    if ((s.phase === 'flying' && s.ticks - this.drawingTick >= 5 || s.phase === 'crashed') && s.ticks !== this.drawingTick) { this.trail.push({ x: s.x, y: s.y }); this.trail = this.trail.slice(-600); this.drawingTick = s.ticks; }
    this.get('#b-trail').setAttribute('d', s.phase === 'crashed' ? path(this.trail) : this.options.save().reduced ? '' : path(this.trail.slice(-15)));
    const impact = this.get('#b-impact');
    const colliders = [...c.walls, ...gatesFor(c).filter(g => !gateIsOpen(g, s)).map(g => g.rect)];
    const hitBoundary = s.x - WORLD.radius < WORLD.inset || s.x + WORLD.radius > WORLD.width - WORLD.inset || s.y - WORLD.radius < WORLD.inset || s.y + WORLD.radius > WORLD.height - WORLD.inset;
    const hasImpact = s.phase === 'crashed' && (hitBoundary || colliders.some(w => touches(s, WORLD.radius, w)));
    impact.setAttribute('visibility', hasImpact ? 'visible' : 'hidden');
    if (s.phase === 'crashed') {
      const wall = colliders.find(w => touches(s, WORLD.radius, w));
      const point = wall ? { x: Math.max(wall.x, Math.min(s.x, wall.x + wall.w)), y: Math.max(wall.y, Math.min(s.y, wall.y + wall.h)) } : { x: Math.max(WORLD.inset, Math.min(s.x, WORLD.width - WORLD.inset)), y: Math.max(WORLD.inset, Math.min(s.y, WORLD.height - WORLD.inset)) };
      if (!wall) { if (s.x < WORLD.inset + WORLD.radius) point.x = WORLD.inset; else if (s.x > WORLD.width - WORLD.inset - WORLD.radius) point.x = WORLD.width - WORLD.inset; else if (s.y < WORLD.inset + WORLD.radius) point.y = WORLD.inset; else point.y = WORLD.height - WORLD.inset; }
      impact.setAttribute('transform', `translate(${point.x} ${point.y})`);
    }
    const pieces = this.get('#b-pieces');
    for (const node of pieces.querySelectorAll<SVGGElement>('[data-piece]')) if (!s.pieces.some(p => String(p.id) === node.dataset.piece)) node.remove();
    for (const p of s.pieces) {
      let node = pieces.querySelector<SVGGElement>(`[data-piece="${p.id}"]`);
      if (!node) { const m = minerals.find(m => m.id === p.mineral)!; pieces.insertAdjacentHTML('beforeend', `<g data-piece="${p.id}" class="b-piece" style="color:${m.color}"><path d="m0-9 7 4v10L0 9-7 5V-5Z"/><text y="4">${m.arrow}</text></g>`); node = pieces.lastElementChild as SVGGElement; }
      node.setAttribute('transform', `translate(${p.x} ${p.y})`); node.style.opacity = String(p.resting ? Math.max(0, 1 - p.age / 2) : 1);
    }
    this.get<HTMLElement>('#b-speed-fill').style.width = `${Math.hypot(s.vx, s.vy) / WORLD.maxSpeed * 100}%`;
    this.get('#b-speed-value').textContent = String(Math.round(Math.hypot(s.vx, s.vy)));
    const key = `${s.phase}:${s.dock}:${s.slots}:${this.selected}:${s.activated}:${this.notice}:${this.hint}:${this.hintLevels[this.index]}:${this.dialog}`;
    if (key === this.uiKey) return;
    this.uiKey = key;
    const docked = s.phase === 'docked';
    this.get('#b-mode').textContent = docked ? 'Refit & launch' : s.phase === 'flying' ? 'In flight' : s.phase === 'won' ? 'Core delivered' : 'Core interrupted';
    this.get('#b-dock-name').textContent = docked ? c.docks[s.dock].name : s.phase === 'flying' ? 'Release to change your pull' : s.phase === 'won' ? 'Receiver secured' : 'Retry from your last dock';
    const relays = switchesFor(c), required = c.requiredSwitches ?? relays.map(r => r.id);
    this.get('.b-objective').textContent = s.phase === 'won' ? '◇ Core delivered' : required.length ? `◇ Relays ${required.filter(id => s.activated.includes(id)).length}/${required.length} · deliver core` : '◇ Deliver the core';
    relays.forEach((relay, i) => {
      const active = s.activated.includes(relay.id), locked = !active && !!relay.requires?.some(id => !s.activated.includes(id));
      this.get(`#${switchNode(i)}`).classList.toggle('active', active);
      this.get(`#${switchNode(i)}`).classList.toggle('locked', locked);
      for (const wire of this.options.host.querySelectorAll(`[data-wire="${i}"]`)) wire.classList.toggle('active', active);
    });
    gatesFor(c).forEach((gate, i) => this.get(`#${gateNode(i)}`).classList.toggle('open', gateIsOpen(gate, s)));
    this.get('#b-world').setAttribute('aria-label', `Level ${this.index + 1}. ${c.title}. ${relays.map((r, i) => `Relay ${String.fromCharCode(65 + i)} ${r.mineral}: ${s.activated.includes(r.id) ? 'powered' : r.requires?.some(id => !s.activated.includes(id)) ? 'waiting for prerequisite relays' : 'ready'}`).join('. ')}`);
    this.get('#b-force-icon').textContent = f.x === 0 && f.y === 0 ? '—' : f.x === 0 ? f.y < 0 ? '↑' : '↓' : f.y === 0 ? f.x < 0 ? '←' : '→' : f.x > 0 ? f.y > 0 ? '↘' : '↗' : f.y > 0 ? '↙' : '↖';
    this.get('#b-force-name').textContent = !f.x && !f.y ? 'No pull' : `${f.y ? f.y < 0 ? 'North' : 'South' : ''}${f.y && f.x ? ' + ' : ''}${f.x ? f.x < 0 ? 'West' : 'East' : ''}${Math.abs(f.x) === 2 || Math.abs(f.y) === 2 ? ' × 2' : ''}`;
    for (let i = 0; i < 2; i++) {
      const b = this.get<HTMLButtonElement>(`#b-slot-${i}`), m = minerals.find(m => m.id === s.slots[i]);
      b.classList.toggle('selected', docked && this.selected === i);
      b.classList.toggle('ejectable', s.phase === 'flying' && !!m);
      b.disabled = !docked && !(s.phase === 'flying' && m);
      b.dataset.mineral = m?.id ?? '';
      b.setAttribute('aria-label', `${docked ? 'Select' : 'Eject'} socket ${i + 1}${m ? `: ${m.name}, ${m.id}` : ': empty'}`);
      b.querySelector('.b-slot-content')!.innerHTML = `${mineralArt(s.slots[i])}<span>${m?.name ?? 'Empty'}</span>`;
      b.querySelector('.b-slot-action')!.textContent = docked ? this.selected === i ? 'Selected' : 'Select' : s.phase === 'flying' ? m ? `Eject ${m.arrow}` : 'Released' : m ? 'Secured' : 'Empty';
    }
    const available = availableMinerals(c, s);
    for (const button of this.options.host.querySelectorAll<HTMLButtonElement>('.b-loading button')) {
      const absent = !!button.dataset.bLoad && !available.includes(button.dataset.bLoad as Mineral);
      button.disabled = !docked || absent;
      button.title = absent ? 'Not stocked at this dock; carried ballast can stay loaded.' : '';
    }
    if (docked && c.docks[s.dock].minerals) this.get('#b-dock-name').textContent = `${c.docks[s.dock].name} · ${available.map(id => minerals.find(m => m.id === id)!.arrow).join(' ')} stocked`;
    this.get('.b-loading').classList.toggle('in-flight', !docked);
    this.get<HTMLButtonElement>('#b-launch').disabled = !docked || !f.x && !f.y;
    this.get('#b-launch').innerHTML = docked ? 'Launch <kbd>Space</kbd>' : s.phase === 'flying' ? 'In flight <span>↗</span>' : s.phase === 'won' ? 'Delivered <span>✓</span>' : 'Launch interrupted';
    this.get('.b-feedback').textContent = this.notice;
    this.get('#b-board-status').textContent = this.dialog === 'pause' && s.phase === 'flying' ? 'Preview · 2 seconds · solid: core / dashed: mineral' : docked ? 'Magnetic dock · safe to refit' : s.phase === 'flying' ? 'Gold: pull · pale: drift' : s.phase === 'crashed' ? s.reason.startsWith('No pull') ? 'Last flight · drift exhausted' : hasImpact ? 'Last flight · impact marked ×' : 'Last flight · receiver unpowered' : '';
    this.get<HTMLButtonElement>('#b-quick-retry').disabled = !s.launches && !s.slots.some(Boolean);
    this.get('#b-quick-retry').innerHTML = `${docked ? '↶ Reset refit' : '↶ Retry'} <kbd>Z</kbd>`;
    for (let i = 0; i < c.docks.length; i++) this.get(`#b-dock-${i}`).classList.toggle('docked', docked && s.dock === i);
    const prediction = docked ? forecast(c, s) : { points: [], outcome: 'flying' };
    this.get('#b-forecast').setAttribute('d', prediction.points.length > 1 ? prediction.points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join('') : '');
    const end = prediction.points.length > 1 ? prediction.points.at(-1) : undefined;
    const endNode = this.get('#b-forecast-end'); endNode.setAttribute('cx', String(end?.x ?? 0)); endNode.setAttribute('cy', String(end?.y ?? 0)); endNode.setAttribute('opacity', end ? '1' : '0'); endNode.setAttribute('fill', prediction.outcome === 'crashed' ? '#e5a083' : '#c4dab0');
    this.renderHint();
    this.get('#b-hint').setAttribute('aria-expanded', String(this.hint));
  }
  private renderHint() {
    const level = this.hintLevels[this.index];
    this.get('#b-hint-slot').innerHTML = this.hint ? `<section class="b-hint" aria-label="Hint ${level + 1} of 3"><span class="b-hint-level">${['A question', 'A closer look', 'The route'][level]} · ${level + 1} / 3</span><p>${chambers[this.index].hints[level]}</p><button id="b-hint-close" data-b-action="hint" aria-label="Close hint">×</button>${level < 2 ? `<button id="b-hint-next" data-b-action="hint-next">${level === 0 ? 'A closer clue →' : 'Show the route →'}</button>` : ''}</section>` : '';
  }
  private act(action: Action) {
    if (this.dialog) return;
    if (this.game.act(action)) {
      if (action.type === 'load') { this.audio('dial'); this.notice = 'Dotted line previews this loadout. Refit only at docks.'; }
      if (action.type === 'launch') { this.audio('travel'); this.notice = 'Q / E releases ballast. Esc pauses to plan.'; this.trail = [{ x: this.game.state.x, y: this.game.state.y }]; this.drawingTick = this.game.state.ticks; this.accumulator = 0; }
      if (action.type === 'eject') { this.audio('dial'); this.notice = 'Ballast released. The core keeps its drift.'; this.pulse('#b-capsule', '#e8d6a2'); }
      this.update();
    }
  }
  handleButton(button: HTMLButtonElement) {
    if (button.dataset.bPreview !== undefined && this.dialog === 'pause') { this.showRelease(Number(button.dataset.bPreview)); return; }
    if (button.dataset.bChallenge !== undefined && !this.dialog) { this.start(Number(button.dataset.bChallenge)); return; }
    if (button.dataset.bSlot !== undefined) { const slot = Number(button.dataset.bSlot); if (this.game.state.phase === 'docked') { this.selected = slot; this.update(); } else this.act({ type: 'eject', slot }); return; }
    if (button.dataset.bLoad) { this.act({ type: 'load', slot: this.selected, mineral: button.dataset.bLoad as Mineral }); return; }
    if (button.dataset.bEmpty) { this.act({ type: 'load', slot: this.selected, mineral: null }); return; }
    const action = button.dataset.bAction ?? button.dataset.action;
    if (action === 'pause') this.open('pause');
    if (action === 'help') this.open('help');
    if (action === 'resume' || action === 'close') this.close();
    if (action === 'release' && this.dialog === 'pause' && this.previewSlot !== null) { const slot = this.previewSlot; this.close(); this.act({ type: 'eject', slot }); }
    if (action === 'launch') this.act({ type: 'launch' });
    if (action === 'hint') { this.hint = !this.hint; this.update(); this.get<HTMLElement>('#b-hint').focus(); }
    if (action === 'hint-next') { this.hintLevels[this.index] = Math.min(2, this.hintLevels[this.index] + 1); this.update(); this.get<HTMLElement>(this.hintLevels[this.index] < 2 ? '#b-hint-next' : '#b-hint-close').focus(); }
    if (action === 'restart') this.start(this.index);
    if (action === 'retry') this.retry();
    if (action === 'back-dock') { this.close(); this.game.previousDock(); this.trail = []; this.drawingTick = -1; this.notice = 'Previous dock restored. You can change the plan.'; this.update(); this.get<HTMLElement>('#b-slot-0').focus(); }
    if (action === 'next') this.index < chambers.length - 1 ? this.start(this.index + 1) : this.options.hub();
    if (action === 'hub') this.options.hub();
  }
  private retry() {
    const docked = this.game.state.phase === 'docked';
    this.close(); if (docked) this.game.resetRefit(); else this.game.retry(); this.trail = []; this.drawingTick = -1; this.notice = docked ? 'Incoming ballast restored. Refit again, or use Plan to return to the previous dock.' : 'Last launch restored. Z at the dock restores incoming ballast.'; this.update(); this.get<HTMLElement>(docked ? '#b-slot-0' : '#b-launch').focus();
  }
  private start(index: number) {
    if (!chambers[index]) return;
    this.close(); this.index = index; this.game = new BallastSession(chambers[index]); this.selected = 0; this.hint = false; this.notice = 'Choose a mineral, then launch.'; this.trail = []; this.drawingTick = -1; this.accumulator = 0; this.mount(); this.get<HTMLElement>('#b-slot-0').focus();
  }
  private open(dialog: Dialog) {
    if (this.dialog) return;
    this.dialog = dialog; this.restoreFocus = (document.activeElement as HTMLElement)?.id ?? ''; this.options.frame.inert = true; pauseScenery(true); if (dialog === 'pause' || dialog === 'help') suspendAudio();
    if (dialog === 'pause' || dialog === 'failure') { this.contextDialog(dialog); this.update(); return; }
    const completed = this.options.save().ballastCompleted.length, mastered = completed === chambers.length;
    const content = dialog === 'help' ? `<div class="eyebrow">THE ANCHOR CHAMBER</div><h2 id="b-dialog-title">Your load is your steering.</h2><div class="help-steps"><p><b>Refit.</b> Choose a socket, then a mineral. Arrows inside a dock show its stock; carried minerals can stay loaded.</p><p><b>Read the pull.</b> Gold shows force and strength. Pale dashed drift turns gradually. There are no thrusters.</p><p><b>Plan a release.</b> Esc pauses. Compare A or B: solid is the core, dashed is the mineral. Release & resume commits the choice.</p><p><b>Power the relays.</b> Match the mineral arrow. A → B means A must be lit first. Gate letters show which relays open them; the receiver needs every required relay.</p></div><p class="help-small">Q / E selects at docks or ejects in flight · Arrow keys load<br>Space launches · Z retries / resets a refit · R restarts</p><button id="b-close-help" class="primary" data-b-action="close">Understood ↗</button>` : `<div class="modal-emblem success">${emblem}</div><div class="eyebrow">${mastered ? 'ALL TWELVE CORES DELIVERED' : `LEVEL ${this.index + 1} COMPLETE`}</div><h2 id="b-dialog-title">${mastered ? 'The chamber is alive.' : 'A steady arrival.'}</h2><p>${mastered ? 'Every circuit is powered. Your fieldkeeper stamp is earned.' : `${completed} / ${chambers.length} cores delivered.`}</p><div class="result-seeds b-result-levels">${chambers.map((_, i) => `<span class="${this.options.save().ballastCompleted.includes(i) ? 'collected' : ''}">${String(i + 1).padStart(2, '0')} ${this.options.save().ballastCompleted.includes(i) ? '✓' : '◇'}</span>`).join('')}</div><button id="b-next" class="primary" data-b-action="next">${this.index < chambers.length - 1 ? 'Next level ↗' : 'Return to arcade ↗'}</button><button class="text-button" data-b-action="restart">Replay level</button>`;
    this.options.modalHost.innerHTML = `<div class="modal-backdrop${dialog === 'result' ? ' result-backdrop' : ''}"><section class="modal b-modal" role="dialog" aria-modal="true" aria-labelledby="b-dialog-title">${content}<button class="text-button" data-b-action="hub">← Arcade</button></section></div>`;
    this.options.modalHost.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
  }
  private contextDialog(dialog: 'pause' | 'failure') {
    const flying = this.game.state.phase === 'flying';
    const content = dialog === 'failure' ? `<h2 id="b-dialog-title">${this.game.state.reason.startsWith('No pull') ? 'Drift exhausted.' : 'Flight interrupted.'}</h2><p>${this.game.state.reason}</p><div class="b-context-actions"><button id="b-retry" class="primary" data-b-action="retry">Retry dock <kbd>Z</kbd></button><button class="text-button" data-b-action="restart">Restart <kbd>R</kbd></button></div><button class="text-button b-context-exit" data-b-action="hub">← Arcade</button>` : `<h2 id="b-dialog-title">Holding position.</h2>${flying ? `<p>Compare a release · 2 seconds ahead</p><div class="b-preview-options">${[0, 1].map(i => { const m = minerals.find(m => m.id === this.game.state.slots[i]); return `<button id="b-preview-${i}" data-b-preview="${i}" aria-pressed="false" ${m ? '' : 'disabled'}>${mineralArt(m?.id ?? null)}<span>${i ? 'B' : 'A'} · ${m?.name ?? 'Empty'}</span></button>`; }).join('')}</div>` : '<p>Your core is safe at the dock.</p>'}<div class="b-context-actions">${flying ? '<button id="b-release" class="primary" data-b-action="release" disabled>Release & resume</button>' : ''}<button class="${flying ? 'text-button' : 'primary'}" id="b-resume" data-b-action="resume">Resume ↗</button></div>${!flying ? `<div class="b-context-actions">${this.game.canGoBack() ? '<button id="b-back-dock" class="text-button" data-b-action="back-dock">↶ Previous dock</button>' : ''}<button class="text-button" data-b-action="hub">← Arcade</button></div>` : ''}`;
    this.options.modalHost.innerHTML = `<div class="modal-backdrop b-context-backdrop"><section class="modal b-context-modal" role="dialog" aria-modal="true" aria-labelledby="b-dialog-title" aria-describedby="b-context-description">${content}<span id="b-context-description" class="sr-only">${dialog === 'failure' ? 'The last flight path remains visible on the board.' : 'Time is paused. Q or E selects a hypothetical release. No ballast changes until Release and resume is pressed.'}</span></section></div>`;
    this.positionDialog();
    if (dialog === 'pause' && flying) {
      const slot = this.game.state.slots.findIndex(Boolean);
      if (slot >= 0) this.showRelease(slot);
    }
    this.options.modalHost.querySelector<HTMLElement>('button:not(:disabled)')?.focus({ preventScroll: true });
  }
  private positionDialog = () => {
    const modal = this.options.modalHost.querySelector<HTMLElement>('.b-context-modal');
    const panel = this.options.host.querySelector('.b-panel');
    if (!modal || !panel) return;
    const r = panel.getBoundingClientRect();
    const height = Math.min(r.height, window.innerHeight - 24);
    const top = Math.max(12, Math.min(r.top, window.innerHeight - height - 12));
    Object.assign(modal.style, { left: `${r.left}px`, top: `${top}px`, width: `${r.width}px`, height: `${height}px` });
  };
  private showRelease(slot: number) {
    if (this.dialog !== 'pause' || this.game.state.phase !== 'flying' || !this.game.state.slots[slot]) return;
    this.previewSlot = slot;
    const prediction = releaseForecast(chambers[this.index], this.game.state, slot);
    const m = minerals.find(m => m.id === prediction.released?.mineral);
    this.get('#b-preview').setAttribute('visibility', 'visible');
    this.get('#b-preview-core').setAttribute('d', path(prediction.capsule));
    this.get('#b-preview-piece').setAttribute('d', path(prediction.released?.points ?? []));
    this.get<SVGElement>('#b-preview').style.setProperty('--preview-mineral', m?.color ?? '#9bcdd9');
    const coreEnd = prediction.capsule.at(-1), pieceEnd = prediction.released?.points.at(-1);
    if (coreEnd) this.get('#b-preview-core-end').setAttribute('transform', `translate(${coreEnd.x} ${coreEnd.y})`);
    if (pieceEnd) this.get('#b-preview-piece-end').setAttribute('transform', `translate(${pieceEnd.x} ${pieceEnd.y})`);
    for (const button of this.options.modalHost.querySelectorAll<HTMLElement>('[data-b-preview]')) button.setAttribute('aria-pressed', String(Number(button.dataset.bPreview) === slot));
    this.options.modalHost.querySelector<HTMLElement>(`#b-preview-${slot}`)?.focus({ preventScroll: true });
    this.options.modalHost.querySelector<HTMLButtonElement>('#b-release')!.disabled = false;
  }
  private close() {
    this.dialog = null; this.previewSlot = null; this.options.modalHost.innerHTML = ''; this.options.frame.inert = false;
    this.options.host.querySelector('#b-preview')?.setAttribute('visibility', 'hidden');
    this.options.host.querySelector('#b-preview-core')?.setAttribute('d', '');
    this.options.host.querySelector('#b-preview-piece')?.setAttribute('d', '');
    this.accumulator = 0; this.previousTime = 0; pauseScenery(false); this.update();
    if (this.restoreFocus) { const target = document.getElementById(this.restoreFocus) as HTMLButtonElement | null; (target && !target.disabled ? target : this.get<HTMLElement>('#b-pause'))?.focus({ preventScroll: true }); }
  }
  pause() { if (!this.dialog) this.open('pause'); }
  handleKey(event: KeyboardEvent) {
    if (event.key === 'Tab' && this.dialog) {
      const buttons = [...this.options.modalHost.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')], first = buttons[0], last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'Escape') { event.preventDefault(); if (this.dialog === 'pause' || this.dialog === 'help') this.close(); else if (!this.dialog) this.open('pause'); return; }
    if (this.dialog) {
      if (this.dialog === 'failure' && event.key.toLowerCase() === 'r') { event.preventDefault(); this.start(this.index); }
      else if ((this.dialog === 'failure' || this.dialog === 'pause') && event.key.toLowerCase() === 'z') { event.preventDefault(); this.retry(); }
      else if (this.dialog === 'pause' && ['q', 'e'].includes(event.key.toLowerCase())) { event.preventDefault(); this.showRelease(event.key.toLowerCase() === 'q' ? 0 : 1); }
      else if (this.dialog === 'pause' && event.code === 'Space' && event.target === document.body) { event.preventDefault(); this.close(); }
      return;
    }
    const key = event.key.toLowerCase();
    if (key === 'r') { event.preventDefault(); this.start(this.index); }
    if (key === 'z' && (this.game.state.launches || this.game.state.slots.some(Boolean))) { event.preventDefault(); this.retry(); }
    if (key === 'q' || key === 'e') { event.preventDefault(); const slot = key === 'q' ? 0 : 1; if (this.game.state.phase === 'docked') { this.selected = slot; this.update(); } else this.act({ type: 'eject', slot }); }
    if (event.code === 'Space' && this.game.state.phase === 'docked') { event.preventDefault(); this.act({ type: 'launch' }); }
    const arrows: Record<string, Mineral> = { ArrowUp: 'north', ArrowRight: 'east', ArrowDown: 'south', ArrowLeft: 'west' };
    if (arrows[event.key]) { event.preventDefault(); this.act({ type: 'load', slot: this.selected, mineral: arrows[event.key] }); }
  }
  preferencesChanged() { if (this.options.save().reduced) for (const animation of this.options.host.getAnimations({ subtree: true })) animation.cancel(); this.update(); }
  inspect() { return { index: this.index, state: structuredClone(this.game.state), checkpoint: structuredClone(this.game.checkpoint), arrival: structuredClone(this.game.arrival), canGoBack: this.game.canGoBack(), dialog: this.dialog, selected: this.selected, previewSlot: this.previewSlot, hintLevel: this.hintLevels[this.index] }; }
  dispose() { this.disposed = true; cancelAnimationFrame(this.raf); this.panelObserver.disconnect(); window.removeEventListener('resize', this.positionDialog); this.options.modalHost.innerHTML = ''; this.options.frame.inert = false; pauseScenery(false); suspendAudio(); }
}
