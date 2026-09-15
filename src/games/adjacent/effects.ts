import { destinations } from './model';
import type { State } from './model';

export const keeperIcon = '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="10" r="4" fill="currentColor"/><path d="M8 25v-5a8 8 0 0 1 16 0v5M12 25v-6m8 6v-6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M18 6q1-5 6-4-1 5-6 4" fill="#a9cdaa"/></svg>';
export const seedIcon = '<svg viewBox="0 0 24 28" fill="none" aria-hidden="true"><path d="m12 2 9 5v14l-9 5-9-5V7Z" stroke="currentColor" stroke-width="1.5"/><path d="M12 21V9m0 7C5 16 6 10 6 10s6 0 6 6Zm0-2c0-7 6-7 6-7s0 7-6 7Z" stroke="currentColor"/></svg>';
const colors = ['#9bcdd9', '#e8c67c', '#eb9c7c'];
type Point = { x: number; y: number };
const translate = (p: Point) => `translate(${p.x}px, ${p.y}px)`;

/** Presentation only. Actions commit immediately; a new action cancels stale effects. */
export class AdjacentEffects {
  private board: HTMLElement;
  private token: HTMLElement;
  private lines: SVGSVGElement;
  private animations = new Set<Animation>();
  private transient = new Set<Element>();
  private previous?: State;
  private reduced = false;
  private paused = false;
  private observer: ResizeObserver;
  constructor(private host: HTMLElement) {
    this.board = host.querySelector('.room-map')!;
    this.board.insertAdjacentHTML('beforeend', `<svg class="effect-lines" aria-hidden="true"></svg><div class="keeper-token" aria-hidden="true">${keeperIcon}<span class="keeper-case">${seedIcon}</span></div>`);
    this.token = host.querySelector('.keeper-token')!;
    this.lines = host.querySelector('.effect-lines')!;
    this.observer = new ResizeObserver(() => {
      // A resized board changes path coordinates. Snap to the actual room, never an old endpoint.
      this.clear();
      if (this.previous) this.place(this.previous.room);
    });
    this.observer.observe(this.board);
  }
  private anchor(room: number): Point {
    const rect = this.host.querySelector(`#room-${room} .keeper-anchor`)!.getBoundingClientRect();
    const board = this.board.getBoundingClientRect();
    return { x: rect.left + rect.width / 2 - board.left, y: rect.top + rect.height / 2 - board.top };
  }
  private place(room: number) { this.token.style.transform = translate(this.anchor(room)); }
  private animate(element: Element, frames: Keyframe[], duration: number, delay = 0) {
    if (this.reduced) return;
    const animation = element.animate(frames, { duration, delay, easing: 'cubic-bezier(.2,.7,.25,1)', fill: 'backwards' });
    this.animations.add(animation);
    if (this.paused) animation.pause();
    void animation.finished.then(() => {
      this.animations.delete(animation);
      if (this.transient.has(element)) { element.remove(); this.transient.delete(element); }
    }, () => {});
  }
  private clear() {
    for (const animation of this.animations) animation.cancel();
    this.animations.clear();
    for (const element of this.transient) element.remove();
    this.transient.clear();
  }
  private ring(room: number, color: string, delay = 0) {
    const ring = document.createElement('span');
    ring.className = 'arrival-ring'; ring.style.color = color;
    const position = translate(this.anchor(room));
    ring.style.transform = position;
    this.board.append(ring); this.transient.add(ring);
    this.animate(ring, [{ opacity: .85, transform: `${position} scale(.35)` }, { opacity: 0, transform: `${position} scale(1.8)` }], 600, delay);
  }
  private trail(from: Point, to: Point, color: string, kind: string, delay = 0) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const bend = Math.min(40, Math.abs(to.x - from.x) * .12 + 16);
    path.setAttribute('d', `M${from.x} ${from.y} Q${(from.x + to.x) / 2} ${(from.y + to.y) / 2 - bend} ${to.x} ${to.y}`);
    path.setAttribute('pathLength', '1'); path.setAttribute('class', kind);
    path.style.stroke = color;
    this.lines.append(path); this.transient.add(path);
    this.animate(path, [{ strokeDashoffset: '1', opacity: 0 }, { strokeDashoffset: '0', opacity: .85, offset: .45 }, { strokeDashoffset: '-1', opacity: 0 }], 720, delay);
  }
  private flyCase(pickup: boolean) {
    const vault = this.host.querySelector('#room-5 .room-art')!.getBoundingClientRect();
    const badge = this.host.querySelector('.case-progress > svg')!.getBoundingClientRect();
    const a = { x: vault.left + vault.width / 2 - 14, y: vault.top + vault.height / 2 - 16 };
    const b = { x: badge.left + badge.width / 2 - 14, y: badge.top + badge.height / 2 - 16 };
    const from = pickup ? a : b, to = pickup ? b : a;
    const item = document.createElement('span'); item.className = 'case-flight'; item.innerHTML = seedIcon;
    item.style.transform = translate(to);
    this.host.append(item); this.transient.add(item);
    this.animate(item, [
      { transform: `${translate(from)} scale(.65)`, opacity: 0 },
      { transform: `${translate(from)} scale(1.35)`, opacity: 1, offset: .2 },
      { transform: `${translate({ x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - 18 })} scale(1.1)`, opacity: 1, offset: .65 },
      { transform: `${translate(to)} scale(.7)`, opacity: 0 },
    ], 720, pickup ? 320 : 0);
    this.animate(this.host.querySelector('.case-progress')!, [{ filter: 'brightness(1)' }, { filter: 'brightness(1.9)', offset: .7 }, { filter: 'brightness(1)' }], 1000, pickup ? 200 : 0);
  }
  sync(state: State, reset: boolean, reduced: boolean, paused: boolean) {
    const old = this.previous;
    this.reduced = reduced; this.paused = paused;
    this.token.classList.toggle('carrying', state.parcel);
    this.token.style.setProperty('--token-color', colors[state.temperatures[state.room]]);
    this.token.dataset.room = String(state.room);
    this.board.dataset.carrying = String(state.parcel);
    if (reset || reduced || !old) {
      this.clear(); this.place(state.room);
    } else if (state !== old) {
      const box = this.token.getBoundingClientRect(), board = this.board.getBoundingClientRect();
      const visualStart = { x: box.left + box.width / 2 - board.left, y: box.top + box.height / 2 - board.top };
      this.clear(); this.place(state.room);
      const undo = state.moves < old.moves;
      const color = undo ? '#b2d8db' : colors[state.temperatures[state.room]];
      if (old.room !== state.room) {
        const end = this.anchor(state.room), start = visualStart;
        const bend = Math.min(40, Math.abs(end.x - start.x) * .12 + 16);
        const frames = Array.from({ length: 9 }, (_, i) => {
          const t = i / 8;
          return { transform: translate({ x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t - 2 * (1 - t) * t * bend }), offset: t };
        });
        this.animate(this.token, frames, 420);
        this.trail(this.anchor(old.room), end, color, undo ? 'undo-trail' : 'travel-trail');
        this.ring(state.room, color, 160);
      }
      const changed = state.temperatures.flatMap((t, r) => t !== old.temperatures[r] ? [r] : []);
      for (const r of changed) {
        const node = this.host.querySelector(`#room-${r}`)!;
        const delay = r === state.room ? 0 : 100;
        this.animate(node.querySelector('.thermal-wash')!, [{ opacity: 0, transform: 'scaleY(.05)' }, { opacity: .32, transform: 'scaleY(1)', offset: .45 }, { opacity: 0, transform: 'scaleY(1)' }], 700, delay);
        this.animate(node.querySelector('.temperature')!, [{ transform: 'scale(1)' }, { transform: 'scale(1.12)', offset: .3 }, { transform: 'scale(1)' }], 500, delay);
        if (r !== state.room) this.trail(this.anchor(state.room), this.anchor(r), colors[state.temperatures[r]], 'thermal-trail');
        this.ring(r, colors[state.temperatures[r]], delay);
      }
      if (changed.length) {
        const earlier = destinations(old), now = destinations(state);
        for (const r of now.filter(r => !earlier.includes(r))) this.animate(this.host.querySelector(`#room-${r} .gate-light`)!, [{ opacity: 0 }, { opacity: 1, offset: .4 }, { opacity: .55 }], 700, 100);
        for (const r of earlier.filter(r => !now.includes(r))) this.animate(this.host.querySelector(`#room-${r} .gate-light`)!, [{ opacity: .65 }, { opacity: 0 }], 450);
      }
      if (state.parcel !== old.parcel) this.flyCase(state.parcel);
    }
    for (const animation of this.animations) {
      if (paused && animation.playState === 'running') animation.pause();
      else if (!paused && animation.playState === 'paused') animation.play();
    }
    this.previous = state;
  }
  reject(room: number) {
    if (this.reduced) return;
    const label = this.host.querySelector(`#room-${room} .temperature`);
    if (label) this.animate(label, [{ opacity: 1 }, { opacity: .25, offset: .35 }, { opacity: 1 }], 350);
  }
  dispose() { this.clear(); this.observer.disconnect(); }
}
