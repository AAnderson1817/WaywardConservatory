import { paintSprite, paintedGem } from './paint';

export const GUIDE_KEY = 'wayward-field-guide-v1';
export type LessonId = 'b-load' | 'b-dock' | 'b-combine' | 'b-release' | 'b-relay' | 'b-plan' | 'b-order' | 'b-stock' | 'b-recovery' | 'a-travel' | 'a-dial' | 'a-linked' | 'a-return';
type Lesson = { title: string; rule: string; target: string; before: string; after: string; icon: string };
export const lessons: Record<LessonId, Lesson> = {
  'b-load': { title: 'Your load is your steering', rule: 'Choose a socket, then a mineral. Each mineral pulls toward its arrow; Sunstone pulls right. Launch when the dotted route looks clear.', target: '.b-loading', before: 'Sunstone → into a socket', after: 'The loaded core pulls right →', icon: 'east' },
  'b-dock': { title: 'A safe place to refit', rule: 'The brass rings are docks: enter one to stop and change your load. Deliver the core to the leaf-marked Receiver; solid walls and the chamber edge stop your flight.', target: '#b-dock-1', before: 'Approach a brass docking ring', after: 'Dock secured · stop and refit', icon: 'dock' },
  'b-combine': { title: 'Two minerals, one pull', rule: 'The two sockets add their pulls. Up + right makes a diagonal; opposite pulls cancel. The gold arrow shows pull, while the pale dashed arrow shows your existing drift.', target: '.b-force', before: 'Skyglass ↑ + Sunstone →', after: 'Together they pull diagonally ↗', icon: 'north' },
  'b-release': { title: 'Let one mineral go', rule: 'In flight, click a socket or press Q / E to release it. The loose mineral follows its own pull; the core keeps drifting and turns toward the mineral still aboard.', target: '.b-sockets', before: 'Both minerals travel with the core', after: 'Skyglass rises · the core curves right', icon: 'north' },
  'b-relay': { title: 'Feed the relay, open the gate', rule: 'A relay accepts a released mineral matching its arrow and color. Its cable lights up and the gate with the same letter retracts. The Receiver needs every required relay powered.', target: '.b-relay', before: 'Send Skyglass ↑ into relay A', after: 'A powered · gate A opens', icon: 'north' },
  'b-plan': { title: 'Pause before committing', rule: 'Plan freezes the entire chamber. Compare socket A or B: the solid path belongs to the core, the dashed path to the loose mineral. Release & resume commits your choice.', target: '#b-pause', before: 'Pause · compare the two paths', after: 'Release & resume · follow your plan', icon: 'core' },
  'b-order': { title: 'Some relays have an order', rule: 'A → B means power A first, then deliver a fresh matching mineral to B. A delivery made while B is locked is lost; it does not wait there for A.', target: '.b-relay.locked', before: 'B waits while A is unpowered', after: 'Power A, then send a fresh mineral to B', icon: 'south' },
  'b-stock': { title: 'Read the dock’s stock', rule: 'Minerals displayed inside a dock are the kinds you can load there. Anything still aboard can stay. Carry a mineral onward if a later dock cannot supply it.', target: '.b-dock-supply', before: 'Arrive carrying Skyglass ↑', after: 'Carry ↑ through a dock supplying only →', icon: 'east' },
  'b-recovery': { title: 'There is a way back', rule: 'Z retries a flight or restores the minerals you arrived with. At a dock, open Plan → Previous dock to revisit an earlier launch and change your approach.', target: '#b-pause', before: 'An arrival can leave the wrong load', after: 'Previous dock · revise the earlier launch', icon: 'dock' },
  'a-travel': { title: 'Near is a temperature', rule: 'Click any room with the same temperature as yours, even across the map. The glowing connections show where you can travel; the fieldkeeper marks where you are.', target: '.room.current', before: 'Two distant rooms are both Cold', after: 'Same temperature · travel between them', icon: 'north' },
  'a-dial': { title: 'Change a connection', rule: 'A thermostat works only in your current room. Its numbered labels name the rooms it changes. Choose a temperature, inspect which routes open or close, then Apply.', target: '.instrument-panel', before: 'Choose Warm · preview the target', after: 'Apply · the marked room becomes Warm', icon: 'east' },
  'a-linked': { title: 'One dial, several rooms', rule: 'This thermostat changes every room shown on its labels at once. Follow the numbered target badges and preview the new connections before you Apply.', target: '.target-chips', before: 'One thermostat points to two rooms', after: 'Both marked rooms change together', icon: 'south' },
  'a-return': { title: 'Plan the journey home', rule: 'Enter the Vault to collect the seedcase, then bring it to Reception. A changed temperature can close the route behind you. Undo is unlimited and restores the case, too.', target: '#room-5', before: 'Collect the seedcase in the Vault', after: 'Bring it back to Reception', icon: 'core' },
};

const core = (x: number, y: number, cls = 'demo-core') => `<g class="${cls}">${paintSprite('core', x - 32, y - 32, 64)}</g>`;
const gem = (id: 'north' | 'east' | 'south' | 'west', x: number, y: number, cls = 'demo-mineral') => `<g class="${cls}">${paintSprite(id, x - 22, y - 22, 44)}</g>`;
const dock = (x: number, y: number) => paintSprite('dock', x - 45, y - 45, 90);
const room = (n: number, x: number, y: number, cls: string, label: string) => `<g class="demo-room ${cls}"><svg x="${x}" y="${y}" width="82" height="77" viewBox="${n % 3 * 512} ${Math.floor(n / 3) * 512} 512 512" overflow="hidden"><image href="/art/adjacent-rooms.webp" width="1536" height="1024"/></svg><rect x="${x}" y="${y}" width="82" height="77" rx="7"/><text x="${x + 41}" y="${y + 94}">${label}</text></g>`;
function diagram(id: LessonId) {
  let body = '';
  if (id === 'b-load') body = `${dock(126, 83)}${core(126, 83)}${gem('east', 35, 83)}<path class="demo-route" d="M150 83H279"/><text x="252" y="62">→</text>`;
  if (id === 'b-dock' || id === 'b-recovery') body = `${dock(58, 83)}${dock(258, 83)}<path class="demo-route" d="M92 83H220"/>${core(58, 83)}<text x="258" y="142">${id === 'b-dock' ? 'REFIT' : 'ARRIVAL'}</text>`;
  if (id === 'b-combine') body = `${core(104, 117)}${gem('north', 88, 109, 'demo-aboard')}${gem('east', 120, 117, 'demo-aboard')}<path class="demo-vector" d="M106 100V38M131 117H244"/><path class="demo-route" d="M130 93L218 32"/><text x="228" y="34">↗</text>`;
  if (id === 'b-release' || id === 'b-plan') body = `<path class="demo-loose-route" d="M96 105Q121 78 126 23"/><path class="demo-route" d="M105 116Q148 61 268 88"/>${core(105, 116)}${gem('east', 119, 117, 'demo-carried')}${gem('north', 96, 105)}<text x="126" y="21">↑</text><text x="282" y="94">→</text>`;
  if (id === 'b-relay') body = `<path class="demo-cable" d="M88 27H250V60"/><rect class="demo-relay" x="48" y="15" width="80" height="27" rx="5"/><text x="88" y="35">A ↑</text><g class="demo-gate"><rect x="234" y="60" width="32" height="74" rx="3"/><text x="250" y="103">A</text></g>${gem('north', 88, 125)}${core(170, 110)}`;
  if (id === 'b-order') body = `<path class="demo-cable" d="M79 40H160V125H239"/><rect class="demo-relay" x="41" y="22" width="76" height="31" rx="5"/><text x="79" y="43">A ↑</text><rect class="demo-relay second" x="201" y="109" width="76" height="31" rx="5"/><text x="239" y="130">B ↓</text><text x="174" y="84">↓</text>${gem('north', 79, 117)}${gem('south', 239, 55, 'demo-second-mineral')}`;
  if (id === 'b-stock') body = `${dock(211, 84)}${core(67, 84)}${gem('north', 54, 84, 'demo-carried')}<rect class="demo-rack" x="175" y="124" width="73" height="29" rx="4"/>${gem('east', 211, 138, 'demo-stock')}<path class="demo-route" d="M100 84H173"/>`;
  if (id === 'a-travel') body = `${room(0, 24, 33, 'cold', 'COLD')}${room(3, 210, 33, 'cold', 'COLD')}<path class="demo-link" d="M110 70H205"/><g class="demo-keeper"><svg x="49" y="61" width="32" height="32" viewBox="0 0 627 588" overflow="hidden"><image href="/art/atelier-details.webp" width="1254" height="1254"/></svg><circle cx="65" cy="77" r="16" fill="none"/></g>`;
  if (id === 'a-dial' || id === 'a-linked') body = `<g class="demo-thermostat"><circle cx="64" cy="78" r="32"/><path d="M64 79L47 59"/><circle cx="64" cy="79" r="4"/><text x="64" y="138">APPLY</text></g>${room(3, 144, 23, 'target-one cold', 'COLD')}${id === 'a-linked' ? room(1, 236, 23, 'target-two cold', 'COLD') : '<path class="demo-link" d="M102 78H139"/>'}`;
  if (id === 'a-return') body = `${room(5, 210, 33, 'warm', 'VAULT')}${room(0, 24, 33, 'warm', 'RECEPTION')}<path class="demo-link" d="M110 70H205"/><g class="demo-case"><svg x="230" y="51" width="42" height="42" viewBox="627 0 627 588" overflow="hidden"><image href="/art/atelier-details.webp" width="1254" height="1254"/></svg></g>`;
  return `<svg viewBox="0 0 330 170" class="guide-demo" data-demo="${id}" role="img" aria-label="${lessons[id].before}; ${lessons[id].after}">${body}</svg>`;
}

/** First-encounter teaching lives outside game saves and never mutates a puzzle. */
export class FieldGuide {
  private dialog = document.createElement('dialog');
  private seen = new Set<string>();
  private queue: LessonId[] = [];
  private position = 0;
  private timer = 0;
  private returnFocus: HTMLElement | null = null;
  private libraryIds: LessonId[] = [];
  private libraryMode = false;
  private onChange: (open: boolean) => void;
  private reduced: () => boolean;
  get active() { return this.dialog.open; }
  constructor(onChange: (open: boolean) => void, reduced: () => boolean) {
    this.onChange = onChange; this.reduced = reduced;
    try { const saved: unknown = JSON.parse(localStorage.getItem(GUIDE_KEY) ?? '[]'); if (Array.isArray(saved)) this.seen = new Set(saved.filter(v => typeof v === 'string')); } catch { /* Teaching remains available without storage. */ }
    this.dialog.className = 'field-guide';
    this.dialog.setAttribute('aria-labelledby', 'guide-title');
    this.dialog.addEventListener('cancel', event => { event.preventDefault(); this.dismiss(); });
    this.dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const buttons = [...this.dialog.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')], first = buttons[0], last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
    this.dialog.addEventListener('click', event => {
      const button = (event.target as Element).closest<HTMLButtonElement>('button'); if (!button) return;
      const action = button.dataset.guide;
      if (action === 'skip') { this.queue.forEach(id => this.remember(id)); this.close(); }
      if (action === 'close') this.dismiss();
      if (action === 'next') { this.remember(this.queue[this.position]); if (++this.position < this.queue.length) this.show(); else this.close(); }
      if (action === 'previous') { this.position = Math.max(0, this.position - 1); this.show(); }
      if (action === 'replay') this.play();
      if (action === 'library') this.renderLibrary();
      if (button.dataset.lesson) { this.queue = [button.dataset.lesson as LessonId]; this.position = 0; this.show(); }
    });
    document.body.append(this.dialog);
    window.addEventListener('resize', this.layout);
  }
  private refresh() {
    try { const saved: unknown = JSON.parse(localStorage.getItem(GUIDE_KEY) ?? '[]'); if (Array.isArray(saved)) for (const id of saved) if (typeof id === 'string') this.seen.add(id); } catch { /* Keep the in-memory history when storage is unavailable. */ }
  }
  private remember(id: LessonId) { this.refresh(); this.seen.add(id); try { localStorage.setItem(GUIDE_KEY, JSON.stringify([...this.seen])); } catch { /* Session memory still works. */ } }
  teach(ids: LessonId[]) {
    if (this.active) return;
    this.refresh();
    this.queue = [...new Set(ids)].filter(id => !this.seen.has(id));
    if (!this.queue.length) return;
    this.position = 0; this.libraryMode = false; this.begin(); this.show();
  }
  library(ids: LessonId[]) {
    if (this.active) return;
    this.libraryMode = true; this.libraryIds = [...new Set(ids)]; this.begin(); this.renderLibrary();
  }
  review(id: LessonId, library: LessonId[]) {
    if (this.active) return;
    this.libraryMode = true; this.libraryIds = library; this.queue = [id]; this.position = 0; this.begin(); this.show();
  }
  private begin() {
    this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.dialog.showModal(); this.onChange(true);
  }
  private renderLibrary() {
    window.clearTimeout(this.timer);
    this.dialog.innerHTML = `<section class="guide-card guide-library"><header><span class="guide-kicker">THE FIELDKEEPER’S COMPANION</span><button data-guide="close" class="guide-close" aria-label="Close field guide">×</button></header><h2 id="guide-title">A little guidance</h2><p>Choose an interaction to see it in action.</p><div class="guide-index">${this.libraryIds.map(id => `<button data-lesson="${id}">${paintedGem(lessons[id].icon as Parameters<typeof paintedGem>[0])}<span>${lessons[id].title}</span><span aria-hidden="true">↗</span></button>`).join('')}</div><footer><span>Everything stays paused while you read.</span><button data-guide="close" class="guide-primary">Back to play</button></footer></section>`;
    this.dialog.querySelector<HTMLElement>('button')?.focus(); this.layout();
  }
  private show() {
    const id = this.queue[this.position], lesson = lessons[id];
    window.clearTimeout(this.timer);
    this.dialog.innerHTML = `<div class="guide-spotlight" aria-hidden="true"></div><section class="guide-card" data-lesson="${id}"><header><span class="guide-kicker">${this.libraryMode ? 'FIELD GUIDE' : 'A NEW INTERACTION'}${this.queue.length > 1 ? ` · ${this.position + 1} / ${this.queue.length}` : ''}</span><button data-guide="close" class="guide-close" aria-label="Close field guide">×</button></header><h2 id="guide-title">${lesson.title}</h2><div class="guide-stage" data-state="before"><span class="guide-example" aria-hidden="true">EXAMPLE</span>${diagram(id)}<div class="guide-caption" aria-live="polite">${lesson.before}</div><button data-guide="replay" class="guide-replay" aria-label="Play demonstration">${this.reduced() ? 'Show result' : '↻ Replay'}</button></div><p class="guide-rule">${lesson.rule}</p><footer><button data-guide="${this.libraryMode ? 'library' : 'skip'}" class="guide-quiet">${this.libraryMode ? '← All lessons' : 'Skip these tips'}</button><div>${this.position ? '<button data-guide="previous" class="guide-quiet" aria-label="Previous tip">←</button>' : ''}<button data-guide="next" class="guide-primary">${this.position + 1 < this.queue.length ? 'Next tip →' : 'Got it · play'}</button></div></footer></section>`;
    this.dialog.querySelector<HTMLElement>('[data-guide="next"]')?.focus(); this.layout();
    if (!this.reduced()) this.timer = window.setTimeout(() => this.result(), 1100);
  }
  private result() {
    const stage = this.dialog.querySelector<HTMLElement>('.guide-stage'); if (!stage) return;
    stage.dataset.state = 'after';
    this.dialog.querySelectorAll('.target-one text,.target-two text').forEach(node => node.textContent = 'WARM');
    this.dialog.querySelector('.guide-caption')!.textContent = lessons[this.queue[this.position]].after;
    this.dialog.querySelector('[data-guide="replay"]')!.textContent = '↻ Replay';
  }
  private play() {
    window.clearTimeout(this.timer);
    const stage = this.dialog.querySelector<HTMLElement>('.guide-stage'); if (!stage) return;
    if (this.reduced()) { if (stage.dataset.state === 'before') this.result(); else { stage.dataset.state = 'before'; this.dialog.querySelectorAll('.target-one text,.target-two text').forEach(node => node.textContent = 'COLD'); this.dialog.querySelector('.guide-caption')!.textContent = lessons[this.queue[this.position]].before; this.dialog.querySelector('[data-guide="replay"]')!.textContent = 'Show result'; } return; }
    stage.dataset.state = 'before'; this.dialog.querySelector('.guide-caption')!.textContent = lessons[this.queue[this.position]].before;
    this.dialog.querySelectorAll('.target-one text,.target-two text').forEach(node => node.textContent = 'COLD');
    this.timer = window.setTimeout(() => this.result(), 850);
  }
  private layout = () => {
    if (!this.active) return;
    const card = this.dialog.querySelector<HTMLElement>('.guide-card')!;
    const spotlight = this.dialog.querySelector<HTMLElement>('.guide-spotlight');
    if (!spotlight) { card.style.left = `${Math.max(12, (innerWidth - card.offsetWidth) / 2)}px`; card.style.top = `${Math.max(12, (innerHeight - card.offsetHeight) / 2)}px`; return; }
    const target = document.querySelector(lessons[this.queue[this.position]].target);
    const box = target?.getBoundingClientRect();
    this.dialog.classList.toggle('no-target', !box || box.width === 0 || box.height === 0);
    const w = card.offsetWidth, h = card.offsetHeight;
    let x = (innerWidth - w) / 2, y = (innerHeight - h) / 2;
    if (box && box.width > 0 && box.height > 0) {
      Object.assign(spotlight.style, { display: 'block', left: `${box.left - 5}px`, top: `${box.top - 5}px`, width: `${box.width + 10}px`, height: `${box.height + 10}px` });
      // Prefer the opposite side; narrow screens use the space above or below.
      if (box.left > w + 36) { x = box.left - w - 24; y = box.top + (box.height - h) / 2; }
      else if (innerWidth - box.right > w + 36) { x = box.right + 24; y = box.top + (box.height - h) / 2; }
      else if (box.top > h + 24) { y = box.top - h - 18; }
      else if (innerHeight - box.bottom > h + 24) { y = box.bottom + 18; }
      else { x = box.left + box.width / 2 < innerWidth / 2 ? innerWidth - w - 16 : 16; y = box.top + box.height / 2 < innerHeight / 2 ? innerHeight - h - 16 : 16; }
    } else spotlight.style.display = 'none';
    card.style.left = `${Math.max(12, Math.min(x, innerWidth - w - 12))}px`;
    card.style.top = `${Math.max(12, Math.min(y, innerHeight - h - 12))}px`;
  };
  close() {
    if (!this.active) return;
    window.clearTimeout(this.timer); this.dialog.close(); this.onChange(false);
    if (this.returnFocus?.isConnected && !this.returnFocus.closest('[inert]') && !this.returnFocus.matches(':disabled')) this.returnFocus.focus({ preventScroll: true });
  }
  private dismiss() { if (!this.libraryMode) this.queue.forEach(id => this.remember(id)); this.close(); }
  dispose() { this.close(); this.dialog.remove(); window.removeEventListener('resize', this.layout); }
}
