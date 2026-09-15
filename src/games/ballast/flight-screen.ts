import { courses, WORLD, BALL_RADIUS, RECEIVER_RADIUS, CAPTURE_SPEED, createFlight, launch, step, response, acceleration, preview } from './flight-model';
import type { Vec, Loadout, FlightState } from './flight-model';
import type { Save } from '../../shared/save';
import { paintSprite, paintedGem } from '../../shared/paint';
import { sound, suspendAudio } from '../../shared/audio';

type Options = { host: HTMLElement; frame: HTMLElement; modalHost: HTMLElement; save: () => Save; complete: (index: number) => void; hub: () => void };
type Lesson = 'launch' | 'fields' | 'shutter' | 'repel' | 'mixed';
type Mode = 'shutter' | 'classic';
const progressKey = 'wayward-ballast-flight-v1', lessonKey = 'wayward-flight-lessons-v1';
const loadouts: { id: Loadout; name: string; sprite: 'north' | 'south' | 'core'; color: string }[] = [
  { id: 'blue', name: 'Skyglass', sprite: 'north', color: '#99dce8' },
  { id: 'red', name: 'Ironroot', sprite: 'south', color: '#f6a485' },
  { id: 'mixed', name: 'Both', sprite: 'core', color: '#d6b9e1' },
  { id: 'neutral', name: 'Empty', sprite: 'core', color: '#d4c7a4' },
];
const lessons: Record<Lesson, { title: string; text: string; caption: string }> = {
  launch: { title: 'One shot. A little finesse.', text: 'Drag back from the core and release to launch. Or set angle and power below, then press Launch. Reach the receiver gently enough to settle inside.', caption: 'PULL BACK → RELEASE → SETTLE' },
  fields: { title: 'The mineral changes the curve.', text: 'Skyglass and Ironroot respond differently to each floating body. Choose a mineral and read the inward or outward arrows. Stronger curves happen closer to a body.', caption: 'INWARD ARROWS = ATTRACTION' },
  shutter: { title: 'Catch the field. Then coast.', text: 'During flight, hold Space or the shutter button to shield your minerals. The core keeps its momentum. Release to feel the fields again. Switch off Shutter control to try a shot with no midflight input.', caption: 'OPEN → CURVE · SHIELDED → COAST' },
  repel: { title: 'Push can also be a brake.', text: 'Outward arrows mean repulsion. Approach a body to slow down; pass beside it to bend away. Walls and bodies bounce the core. Retry keeps your settings and the last flight trail.', caption: 'APPROACH → SLOW · PASS → DEFLECT' },
  mixed: { title: 'Read the space between.', text: 'Overlapping fields add together. Both minerals averages their responses to each body; Empty ignores every field. Compare the body labels as you change cargo, then find your own route.', caption: 'TWO FIELDS · ONE TRAJECTORY' },
};
function readJSON(key: string): unknown { try { return JSON.parse(localStorage.getItem(key) ?? 'null'); } catch { return null; } }
export function flightCompletions(): number[] {
  const saved = readJSON(progressKey) as { completed?: unknown } | null;
  return Array.isArray(saved?.completed) ? [...new Set(saved.completed.filter((x: unknown): x is number => Number.isInteger(x) && Number(x) >= 0 && Number(x) < 3))] : [];
}
const line = (points: Vec[]) => points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
const colorFor = (loadout: Loadout) => loadouts.find(l => l.id === loadout)!.color;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export class FlightScreen {
  index = 0;
  state: FlightState = createFlight(courses[0], 'blue');
  private loadout: Loadout = 'blue';
  private angle = courses[0].angle;
  private power = courses[0].power;
  private mode: Mode = 'shutter';
  private paused = false;
  private guide = false;
  private dialogKind: 'guide' | 'pause' | 'result' | null = null;
  private queue: Lesson[] = [];
  private taught = new Set<Lesson>();
  private attempts = 0;
  private trail: Vec[] = [];
  private ghost: Vec[] = [];
  private raf = 0;
  private previous = 0;
  private accumulator = 0;
  private sample = 0;
  private held = false;
  private drag: { id: number; origin: Vec; moved: boolean } | null = null;
  private disposed = false;
  private focusBefore = '';
  private wasFlyingWhenBlurred = false;
  private storageUnavailable = false;
  private receiverWarned = false;
  private message = 'Pull back from the core, or set a shot below.';
  private dialogElement: HTMLDialogElement;
  constructor(private options: Options) {
    const storedLessons = readJSON(lessonKey);
    if (Array.isArray(storedLessons)) this.taught = new Set(storedLessons.filter((id): id is Lesson => typeof id === 'string' && id in lessons));
    const saved = readJSON(progressKey) as { mode?: unknown } | null;
    if (saved?.mode === 'classic') this.mode = 'classic';
    this.dialogElement = document.createElement('dialog');
    this.dialogElement.id = 'flight-dialog'; this.dialogElement.className = 'flight-dialog';
    this.dialogElement.setAttribute('aria-labelledby', 'flight-dialog-title');
    document.body.append(this.dialogElement);
    this.dialogElement.addEventListener('click', this.dialogClick);
    this.dialogElement.addEventListener('cancel', this.dialogCancel);
    this.dialogElement.addEventListener('keydown', this.trapDialog);
    options.host.addEventListener('input', this.input);
    options.host.addEventListener('pointerdown', this.pointerDown);
    options.host.addEventListener('pointermove', this.pointerMove);
    options.host.addEventListener('pointerup', this.pointerUp);
    options.host.addEventListener('pointercancel', this.pointerCancel);
    options.host.addEventListener('lostpointercapture', this.pointerCancel);
    window.addEventListener('keyup', this.keyUp);
    this.mount();
    this.raf = requestAnimationFrame(this.frame);
    queueMicrotask(() => { if (!this.disposed) this.teach(['launch', 'fields', 'shutter']); });
  }
  private get<T extends Element = HTMLElement>(selector: string) { return this.options.host.querySelector<T>(selector)!; }
  private audio(kind: Parameters<typeof sound>[0]) { sound(kind, this.options.save().muted); }
  private persist() {
    try { localStorage.setItem(progressKey, JSON.stringify({ version: 1, completed: flightCompletions(), mode: this.mode })); }
    catch { this.storageUnavailable = true; }
  }
  private markComplete() {
    const completed = [...new Set([...flightCompletions(), this.index])];
    try { localStorage.setItem(progressKey, JSON.stringify({ version: 1, completed, mode: this.mode })); }
    catch { this.storageUnavailable = true; }
    this.options.complete(this.index);
  }
  private mount() {
    const course = courses[this.index];
    this.options.host.innerHTML = `<main class="flight-game">
      <header class="flight-heading"><div><h1>Ballast</h1><span>Flight garden</span></div><nav class="flight-courses" aria-label="Choose a course">${courses.map((c, i) => `<button data-flight-course="${i}" aria-label="Course ${i + 1}: ${c.name}" aria-pressed="${i === this.index}" title="${c.name}"><span>${String(i + 1).padStart(2, '0')}</span><b>${c.name}</b><i>${flightCompletions().includes(i) ? '✓' : ''}</i></button>`).join('')}</nav></header>
      <section class="flight-stage" aria-label="${course.name}">
        <svg id="flight-board" tabindex="0" role="img" aria-label="${course.name}. Drag back from the core to aim and launch. Receiver on the right; floating bodies bend your flight. Angle and power controls are below." viewBox="0 0 ${WORLD.width} ${WORLD.height}">
          <defs><radialGradient id="flight-floor"><stop stop-color="#23443e" stop-opacity=".12"/><stop offset="1" stop-color="#081e21" stop-opacity=".75"/></radialGradient><pattern id="flight-wood" width="210" height="210" patternUnits="userSpaceOnUse"><image href="/art/atelier-details.webp" x="0" y="-210" width="420" height="420"/></pattern><marker id="flight-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 1L8 5L0 9" fill="none" stroke="#f3dfaf" stroke-width="1.5"/></marker></defs>
          <defs><clipPath id="flight-arena-clip"><rect width="960" height="540"/></clipPath></defs><g clip-path="url(#flight-arena-clip)">
          <image href="/art/ballast-chamber.webp" width="960" height="540" preserveAspectRatio="xMidYMid slice" opacity=".7"/>
          <rect width="960" height="540" fill="url(#flight-floor)"/>
          <rect x="1" y="1" width="958" height="538" rx="2" class="flight-boundary"/>
          <g id="flight-fields"></g>
          <g class="flight-walls">${course.walls.map(w => `<rect x="${w.x}" y="${w.y}" width="${w.w}" height="${w.h}" rx="5" fill="url(#flight-wood)"/>`).join('')}</g>
          <g class="flight-origin" transform="translate(${course.start.x} ${course.start.y})"><circle r="28"/><path d="M-35 0H-24M24 0H35M0-35V-24M0 24V35"/><text y="52">LAUNCH</text></g>
          <g class="flight-receiver" transform="translate(${course.receiver.x} ${course.receiver.y})">${paintSprite('dock', -57, -57, 114)}<circle class="flight-capture-rim" r="${RECEIVER_RADIUS}"/><path d="M-9 2L-2 9L12-10"/><text y="65">RECEIVER</text></g>
          <path id="flight-ghost" class="flight-ghost"/><path id="flight-preview" class="flight-preview"/><path id="flight-trail" class="flight-trail"/>
          <g id="flight-aim"><path id="flight-aim-line" marker-end="url(#flight-arrow)"/><circle id="flight-pull-end" r="5"/></g>
          <g id="flight-core"><circle class="flight-core-glow" r="24"/>${paintSprite('core', -20, -20, 40)}<circle class="flight-core-rim" r="${BALL_RADIUS}"/><circle class="flight-cargo-blue" cx="-6" cy="0" r="3"/><circle class="flight-cargo-red" cx="6" cy="0" r="3"/><circle class="flight-shield" r="22"/><path id="flight-force" marker-end="url(#flight-arrow)"/></g>
        </g></svg>
        <div class="flight-board-caption"><span id="flight-phase">READY</span><span id="flight-speed">0</span></div>
        <div class="flight-course-note">${course.description}</div>
      </section>
      <section class="flight-console" aria-label="Shot controls">
        <fieldset class="flight-cargo"><legend>Minerals</legend><div>${loadouts.map(l => `<button data-flight-load="${l.id}" aria-pressed="${l.id === this.loadout}" title="${l.id === 'neutral' ? 'Ignore all fields' : l.id === 'mixed' ? 'Average both mineral responses' : `Carry ${l.name}`}" style="--cargo:${l.color}">${l.id === 'mixed' ? `<span class="flight-gem-pair">${paintedGem('north')}${paintedGem('south')}</span>` : l.id === 'neutral' ? '<span class="flight-empty">○</span>' : paintedGem(l.sprite)}<span>${l.name}</span></button>`).join('')}</div></fieldset>
        <div class="flight-aim-controls"><label for="flight-angle">Angle <output id="flight-angle-value">${this.angle}°</output></label><input id="flight-angle" type="range" min="-180" max="180" step="1" value="${this.angle}"/><label for="flight-power">Power <output id="flight-power-value">${this.power}%</output></label><input id="flight-power" type="range" min="12" max="100" step="1" value="${this.power}"/></div>
        <div class="flight-shot-actions"><button id="flight-launch" class="primary" data-flight-action="launch">Launch <span>↗</span></button><button id="flight-shutter" data-flight-action="shutter" aria-label="Hold to shield minerals" aria-pressed="false">Hold to coast <kbd>Space</kbd></button></div>
        <div class="flight-bottom"><label class="flight-mode-label"><input id="flight-mode" type="checkbox" ${this.mode === 'shutter' ? 'checked' : ''}/> Shutter control</label><button id="flight-retry" data-flight-action="retry">↶ Retry <kbd>R</kbd></button><button id="flight-pause" data-flight-action="pause" aria-label="Pause flight">Ⅱ</button><button id="flight-help" data-flight-action="help" aria-label="How to play">?</button><span id="flight-attempts">Shot 1</span></div>
      </section>
      <p id="flight-status" role="status" aria-live="polite">${this.message}</p>
    </main>`;
    this.updateFields(); this.updateControls(); this.draw();
  }
  private updateFields() {
    this.get('#flight-fields').innerHTML = courses[this.index].bodies.map((body, i) => {
      const value = response(body, this.loadout), active = Math.abs(value) > .001;
      const direction = value > 0 ? 'attract' : value < 0 ? 'repel' : 'neutral';
      const color = colorFor(this.loadout), symbol = value > 0 ? '↘ ↙' : value < 0 ? '↖ ↗' : '—';
      return `<g class="flight-body ${direction}" style="--field-color:${color}" transform="translate(${body.x} ${body.y})" aria-label="${body.name}: ${direction === 'attract' ? 'attracts' : direction === 'repel' ? 'repels' : 'no effect on'} current minerals"><title>${body.name}: Skyglass ${body.blue > 0 ? 'attracts' : body.blue < 0 ? 'repels' : 'neutral'}; Ironroot ${body.red > 0 ? 'attracts' : body.red < 0 ? 'repels' : 'neutral'}.</title>
        <circle class="flight-range" r="${body.range}"/><circle class="flight-field-inner" r="${body.radius + (body.range - body.radius) * .42}"/>
        ${Array.from({ length: 12 }, (_, j) => `<g transform="rotate(${j * 30})"><path class="flight-field-arrow" d="${value > 0 ? `M${body.radius + 31} -4L${body.radius + 25} 0L${body.radius + 31} 4` : `M${body.radius + 25} -4L${body.radius + 31} 0L${body.radius + 25} 4`}"/><circle class="flight-particle" cx="${body.radius + 35}" cy="0" r="2" style="--travel:${Math.min(body.range - body.radius - 40, 85)}px;animation-delay:${-j * .23}s"/></g>`).join('')}
        <ellipse class="flight-body-shadow" cy="${body.radius * .65}" rx="${body.radius * 1.08}" ry="${body.radius * .52}"/>
        <circle class="flight-body-rim" r="${body.radius}"/>
        ${paintSprite(i % 2 ? 'south' : 'north', -body.radius * 1.55, -body.radius * 1.65, body.radius * 3.1)}
        <g class="flight-body-label" transform="translate(0 ${body.radius + 47})"><rect x="-72" y="-11" width="144" height="36" rx="7"/><text>${body.name}</text><text y="17" class="flight-response" fill="${color}">${active ? `${symbol} ${direction === 'attract' ? 'ATTRACTS' : 'REPELS'}${Math.abs(value) < .7 ? ' · GENTLY' : ''}` : '— NO PULL'}</text></g>
      </g>`;
    }).join('');
    this.get<SVGElement>('#flight-board').style.setProperty('--shot-color', colorFor(this.loadout));
  }
  private updateControls() {
    const ready = this.state.phase === 'ready';
    for (const el of this.options.host.querySelectorAll<HTMLInputElement | HTMLButtonElement>('[data-flight-load],#flight-angle,#flight-power,#flight-mode')) el.disabled = !ready;
    for (const button of this.options.host.querySelectorAll<HTMLElement>('[data-flight-load]')) button.setAttribute('aria-pressed', String(button.dataset.flightLoad === this.loadout));
    this.get<HTMLInputElement>('#flight-angle').value = String(this.angle); this.get('#flight-angle-value').textContent = `${Math.round(this.angle)}°`;
    this.get<HTMLInputElement>('#flight-power').value = String(this.power); this.get('#flight-power-value').textContent = `${Math.round(this.power)}%`;
    this.get<HTMLInputElement>('#flight-mode').checked = this.mode === 'shutter';
    this.get<HTMLButtonElement>('#flight-launch').disabled = !ready;
    this.get<HTMLButtonElement>('#flight-shutter').disabled = this.state.phase !== 'flying' || this.mode !== 'shutter';
    this.get('#flight-shutter').setAttribute('aria-pressed', String(this.held));
    this.get('#flight-shutter').classList.toggle('held', this.held);
    for (const button of this.options.host.querySelectorAll<HTMLElement>('[data-flight-course]')) button.querySelector('i')!.textContent = flightCompletions().includes(Number(button.dataset.flightCourse)) ? '✓' : '';
    this.get('#flight-attempts').textContent = `Shot ${Math.max(1, this.attempts + (ready ? 1 : 0))}`;
    this.get('#flight-status').textContent = this.message + (this.storageUnavailable ? ' Progress is not saved in this browser.' : '');
    this.get('#flight-preview').setAttribute('d', ready ? line(preview(courses[this.index], this.loadout, this.angle, this.power, .95)) : '');
    this.get('#flight-ghost').setAttribute('d', line(this.ghost));
    this.get<SVGElement>('#flight-core').classList.toggle('cargo-blue', this.loadout === 'blue' || this.loadout === 'mixed');
    this.get<SVGElement>('#flight-core').classList.toggle('cargo-red', this.loadout === 'red' || this.loadout === 'mixed');
    this.drawAim();
  }
  private drawAim() {
    const { start } = courses[this.index], radians = this.angle * Math.PI / 180;
    const length = 38 + this.power * .72;
    this.get('#flight-aim').setAttribute('visibility', this.state.phase === 'ready' ? 'visible' : 'hidden');
    this.get('#flight-aim-line').setAttribute('d', `M${start.x} ${start.y}L${start.x + Math.cos(radians) * length} ${start.y + Math.sin(radians) * length}`);
    this.get('#flight-pull-end').setAttribute('cx', String(start.x - Math.cos(radians) * this.power * 1.4));
    this.get('#flight-pull-end').setAttribute('cy', String(start.y - Math.sin(radians) * this.power * 1.4));
    this.get('#flight-pull-end').setAttribute('opacity', this.drag ? '1' : '0');
  }
  private draw() {
    const s = this.state;
    this.get('#flight-core').setAttribute('transform', `translate(${s.x.toFixed(2)} ${s.y.toFixed(2)})`);
    this.get('#flight-core').classList.toggle('shielded', s.shielded);
    this.get('#flight-board').classList.toggle('shielded', s.shielded);
    this.get('#flight-board').classList.toggle('settled', s.phase === 'won');
    this.get('#flight-board').classList.toggle('receiver-overrun', this.receiverWarned && s.phase !== 'won');
    this.get('#flight-board').classList.toggle('time-paused', this.paused || this.guide);
    this.get('#flight-trail').setAttribute('d', line(this.trail));
    const force = acceleration(courses[this.index], s, this.loadout, s.shielded);
    const amount = Math.hypot(force.x, force.y), scale = amount ? Math.min(45, amount * .25) / amount : 0;
    this.get('#flight-force').setAttribute('d', s.phase === 'flying' && amount > 5 ? `M0 0L${force.x * scale} ${force.y * scale}` : '');
    this.get('#flight-phase').textContent = this.paused ? 'PAUSED' : this.guide ? 'FIELD GUIDE' : s.phase === 'ready' ? 'READY' : s.phase === 'won' ? 'DELIVERED' : s.phase === 'ended' ? 'TRY AGAIN' : s.shielded ? 'SHIELDED · COASTING' : 'FIELDS OPEN';
    this.get('#flight-speed').textContent = s.phase === 'flying' ? `${Math.round(Math.hypot(s.vx, s.vy))} · SPEED` : '';
  }
  private frame = (now: number) => {
    if (this.disposed) return;
    if (!this.paused && !this.guide && this.state.phase === 'flying') {
      this.accumulator += this.previous ? Math.min((now - this.previous) / 1000, .06) : 0;
      while (this.accumulator >= 1 / 120 && this.state.phase === 'flying') {
        this.state = step(courses[this.index], this.state, 1 / 120, this.held && this.mode === 'shutter');
        this.accumulator -= 1 / 120;
        if (++this.sample % 5 === 0) this.trail.push({ x: this.state.x, y: this.state.y });
        const receiver = courses[this.index].receiver;
        if (!this.receiverWarned && Math.hypot(this.state.x - receiver.x, this.state.y - receiver.y) < RECEIVER_RADIUS && Math.hypot(this.state.vx, this.state.vy) > CAPTURE_SPEED) {
          this.receiverWarned = true; this.message = 'Too fast to settle. Try less power, or use a field to brake.'; this.get('#flight-status').textContent = this.message;
        }
      }
      if (this.state.phase === 'won') {
        this.held = false; this.state.shielded = false; this.markComplete(); this.audio('win');
        this.message = 'A steady arrival. Try another approach, or visit the next garden.';
        this.updateControls(); this.openResult();
      } else if (this.state.phase === 'ended') {
        this.held = false; this.state.shielded = false;
        this.message = `${this.state.reason || 'The flight has settled.'} Retry to adjust the shot.`;
        this.updateControls();
      }
    } else this.accumulator = 0;
    this.previous = now; this.draw(); this.raf = requestAnimationFrame(this.frame);
  };
  private input = (event: Event) => {
    if (this.state.phase !== 'ready' || this.guide || this.paused) return;
    const input = event.target as HTMLInputElement;
    if (input.id === 'flight-angle') this.angle = Number(input.value);
    else if (input.id === 'flight-power') this.power = Number(input.value);
    else if (input.id === 'flight-mode') { this.mode = input.checked ? 'shutter' : 'classic'; this.persist(); this.message = input.checked ? 'Hold Space in flight to coast; release to catch the fields.' : 'Launch and watch. All fields stay open during the shot.'; }
    else return;
    this.updateControls();
  };
  private point(event: PointerEvent): Vec {
    const board = this.get<SVGSVGElement>('#flight-board'), matrix = board.getScreenCTM();
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix!.inverse()); return { x: p.x, y: p.y };
  }
  private pointerDown = (event: PointerEvent) => {
    if (this.guide || this.paused || event.button !== 0) return;
    const target = event.target as Element;
    if (target.closest('#flight-shutter') && this.state.phase === 'flying' && this.mode === 'shutter') {
      event.preventDefault(); this.setHeld(true); this.get('#flight-shutter').setPointerCapture(event.pointerId); return;
    }
    if (!target.closest('#flight-board') || this.state.phase !== 'ready') return;
    const point = this.point(event), start = courses[this.index].start;
    if (Math.hypot(point.x - start.x, point.y - start.y) > 65) return;
    event.preventDefault(); this.get<SVGSVGElement>('#flight-board').focus();
    this.drag = { id: event.pointerId, origin: start, moved: false };
    this.get('#flight-board').setPointerCapture(event.pointerId);
  };
  private pointerMove = (event: PointerEvent) => {
    if (!this.drag || this.drag.id !== event.pointerId) return;
    const p = this.point(event), dx = this.drag.origin.x - p.x, dy = this.drag.origin.y - p.y, distance = Math.hypot(dx, dy);
    if (distance < 6) return;
    this.drag.moved = true; this.angle = Math.round(Math.atan2(dy, dx) * 180 / Math.PI); this.power = Math.round(clamp(distance / 1.4, 12, 100));
    this.updateControls();
  };
  private pointerUp = (event: PointerEvent) => {
    if (this.held) this.setHeld(false);
    if (!this.drag || this.drag.id !== event.pointerId) return;
    const launchShot = this.drag.moved;
    this.drag = null;
    if (this.get('#flight-board').hasPointerCapture(event.pointerId)) this.get('#flight-board').releasePointerCapture(event.pointerId);
    if (launchShot) this.fire(); else this.drawAim();
  };
  private pointerCancel = () => { this.drag = null; this.setHeld(false); this.drawAim(); };
  private setHeld(value: boolean) {
    const held = value && this.mode === 'shutter' && this.state.phase === 'flying' && !this.paused && !this.guide;
    if (this.held === held && this.state.shielded === held) return;
    this.held = held; this.state.shielded = held;
    this.get('#flight-shutter').setAttribute('aria-pressed', String(held));
    this.get('#flight-shutter').classList.toggle('held', held);
    if (held) this.audio('dial');
    this.draw();
  }
  private keyUp = (event: KeyboardEvent) => { if (event.code === 'Space') this.setHeld(false); };
  private fire() {
    if (this.paused || this.guide || this.state.phase !== 'ready') return;
    this.state = launch(this.state, this.angle, this.power); this.attempts++;
    this.trail = [{ x: this.state.x, y: this.state.y }]; this.previous = 0; this.accumulator = 0; this.sample = 0; this.receiverWarned = false;
    this.message = this.mode === 'shutter' ? 'Hold Space to coast. Release to catch the field. R retries immediately.' : 'Watch the curve. R retries immediately with the same shot settings.';
    this.audio('travel'); this.updateControls(); this.get<SVGSVGElement>('#flight-board').focus();
  }
  private retry() {
    if (this.guide) return;
    if (this.trail.length > 1) this.ghost = [...this.trail];
    this.closeDialog(); this.held = false; this.drag = null;
    this.state = createFlight(courses[this.index], this.loadout); this.trail = []; this.receiverWarned = false;
    this.message = this.ghost.length ? 'Your last trail remains. Adjust the shot and try again.' : 'Pull back from the core, or set a shot below.';
    this.audio('undo'); this.updateControls(); this.draw(); this.get<HTMLButtonElement>('#flight-launch').focus();
  }
  private start(index: number) {
    if (!courses[index]) return;
    this.closeDialog(); this.setHeld(false); this.index = index; this.attempts = 0;
    this.angle = courses[index].angle; this.power = courses[index].power; this.loadout = 'blue';
    this.state = createFlight(courses[index], this.loadout); this.trail = []; this.ghost = []; this.drag = null; this.receiverWarned = false;
    this.message = 'Pull back from the core, or set a shot below.'; this.mount();
    this.teach(['launch', 'fields', 'shutter', ...(index > 0 ? ['repel' as const] : []), ...(index > 1 ? ['mixed' as const] : [])]);
  }
  handleButton(button: HTMLButtonElement) {
    if (this.guide || this.paused || button.disabled) return;
    if (button.dataset.flightCourse !== undefined) { this.start(Number(button.dataset.flightCourse)); return; }
    if (button.dataset.flightLoad) {
      if (this.state.phase !== 'ready') return;
      this.loadout = button.dataset.flightLoad as Loadout;
      this.state = createFlight(courses[this.index], this.loadout);
      this.message = this.loadout === 'neutral' ? 'Empty cargo: a clean bank shot. No field response.' : this.loadout === 'mixed' ? 'Both minerals: each body averages its two responses.' : `${loadouts.find(l => l.id === this.loadout)!.name} loaded. Read the arrows around each body.`;
      this.audio('dial'); this.updateFields(); this.updateControls();
      this.teach([...(courses[this.index].bodies.some(b => response(b, this.loadout) < 0) ? ['repel' as const] : []), ...(['mixed', 'neutral'].includes(this.loadout) ? ['mixed' as const] : [])]);
      return;
    }
    const action = button.dataset.flightAction ?? button.dataset.action;
    if (action === 'launch') this.fire();
    if (action === 'retry') this.retry();
    if (action === 'pause') this.pause();
    if (action === 'help') this.teach(['launch', 'fields', 'shutter', 'repel', 'mixed'], true);
    if (action === 'hub') this.options.hub();
  }
  handleKey(event: KeyboardEvent) {
    if (this.guide || this.paused || this.dialogKind) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target as Element;
    if (event.key === 'Escape') { event.preventDefault(); this.pause(); return; }
    if (target.matches('input,select,textarea')) return;
    if (event.key.toLowerCase() === 'r' && !event.repeat) { event.preventDefault(); this.retry(); return; }
    if (event.code === 'Space' && (target.id === 'flight-board' || target.id === 'flight-shutter' || target === document.body)) {
      event.preventDefault();
      if (this.state.phase === 'ready' && !event.repeat) this.fire();
      else if (this.state.phase === 'flying') this.setHeld(true);
    }
  }
  private teach(ids: Lesson[], replay = false) {
    this.queue = ids.filter(id => replay || !this.taught.has(id));
    if (!this.queue.length) return;
    this.guide = true; this.openDialog('guide'); this.showLesson();
  }
  private diagram(id: Lesson) {
    const path = id === 'launch' ? 'M48 144Q150 75 295 130' : id === 'shutter' ? 'M35 153Q152 195 224 121L304 39' : id === 'repel' ? 'M38 60C85 60 102 96 107 131S205 167 294 153' : id === 'mixed' ? 'M32 146C99 172 154 120 174 94S244 27 305 44' : 'M32 145C120 176 195 169 226 112S256 48 300 49';
    return `<svg class="flight-lesson-art lesson-${id}" viewBox="0 0 340 195" aria-label="${lessons[id].caption}"><rect width="340" height="195" rx="16" fill="#183630"/>
      ${id === 'launch' ? `<path d="M48 144L20 163" class="lesson-pull"/>${paintSprite('dock', 260, 95, 75)}` : id === 'mixed' ? `<circle cx="120" cy="65" r="80" class="lesson-range"/>${paintSprite('north', 85, 30, 70)}` : `<circle cx="167" cy="82" r="82" class="lesson-range"/>${paintSprite(id === 'repel' ? 'south' : 'north', 128, 42, 80)}`}
      ${id === 'mixed' ? `<circle cx="230" cy="145" r="70" class="lesson-range"/>${paintSprite('south', 201, 116, 58)}` : ''}
      <path d="${path}" class="lesson-route"/><g class="lesson-core" style="offset-path:path('${path}');">${paintSprite('core', -18, -18, 36)}${id === 'shutter' ? '<circle r="20" class="lesson-shield"/>' : ''}</g>
      <path d="${id === 'repel' ? 'M100 55L83 51M86 44L83 51L88 57' : 'M106 51L122 57M116 49L122 57L113 60'}" class="lesson-vector"/>
    </svg>`;
  }
  private showLesson() {
    const id = this.queue[0]; if (!id) { this.closeDialog(); return; }
    const lesson = lessons[id]; this.dialogElement.dataset.lesson = id;
    this.dialogElement.innerHTML = `<button class="flight-dialog-close" data-flight-dialog="skip" aria-label="Close field guide">×</button><span class="flight-dialog-kicker">BALLAST · FIELD GUIDE</span><h2 id="flight-dialog-title">${lesson.title}</h2>${this.diagram(id)}<span class="flight-lesson-caption">${lesson.caption}</span><p>${lesson.text}</p><button class="primary" id="flight-continue" data-flight-dialog="continue">${this.queue.length > 1 ? 'Next' : 'Try it'} <span>→</span></button><button class="text-button" data-flight-dialog="skip">Skip · replay with ?</button>`;
    this.dialogElement.classList.toggle('reduced', this.options.save().reduced); this.dialogElement.querySelector<HTMLElement>('#flight-continue')?.focus();
  }
  private acknowledge(ids: Lesson[]) {
    const current = readJSON(lessonKey); if (Array.isArray(current)) for (const id of current) if (typeof id === 'string' && id in lessons) this.taught.add(id as Lesson);
    ids.forEach(id => this.taught.add(id));
    try { localStorage.setItem(lessonKey, JSON.stringify([...this.taught])); } catch { /* Lessons remain replayable without storage. */ }
  }
  private openDialog(kind: 'guide' | 'pause' | 'result') {
    this.focusBefore = (document.activeElement as HTMLElement)?.id ?? '';
    this.setHeld(false); this.drag = null; this.previous = 0; this.accumulator = 0;
    this.dialogKind = kind; this.paused = kind === 'pause'; this.guide = kind === 'guide';
    if (kind !== 'result') suspendAudio(); if (!this.dialogElement.open) this.dialogElement.showModal(); this.draw();
  }
  private closeDialog() {
    this.dialogElement.close(); this.dialogKind = null; this.guide = false; this.paused = false;
    this.previous = 0; this.accumulator = 0; this.dialogElement.removeAttribute('data-lesson');
    if (this.wasFlyingWhenBlurred && this.state.phase === 'flying') { this.wasFlyingWhenBlurred = false; this.pause(); return; }
    this.wasFlyingWhenBlurred = false;
    const prior = document.getElementById(this.focusBefore) as HTMLButtonElement | null;
    if (prior && !prior.disabled) prior.focus({ preventScroll: true }); else this.get<SVGSVGElement>('#flight-board')?.focus({ preventScroll: true });
    this.draw();
  }
  pause() {
    this.setHeld(false); this.drag = null;
    if (this.guide) { this.wasFlyingWhenBlurred = this.state.phase === 'flying'; return; }
    if (this.dialogKind) return;
    this.openDialog('pause');
    this.dialogElement.innerHTML = `<span class="flight-dialog-kicker">FLIGHT PAUSED</span><h2 id="flight-dialog-title">A moment in the garden.</h2><div class="flight-pause-art">${paintedGem('core')}</div><p>Your shot is held exactly here.</p><button id="flight-resume" class="primary" data-flight-dialog="resume">Resume <span>↗</span></button><div class="flight-dialog-actions"><button data-flight-dialog="retry">↶ Retry shot</button><button data-flight-dialog="hub">← Arcade</button></div>`;
    this.dialogElement.querySelector<HTMLElement>('#flight-resume')?.focus();
  }
  private openResult() {
    this.openDialog('result');
    this.dialogElement.innerHTML = `<span class="flight-dialog-kicker">CORE DELIVERED · ${this.attempts} ${this.attempts === 1 ? 'SHOT' : 'SHOTS'}</span><h2 id="flight-dialog-title">A steady arrival.</h2><div class="flight-pause-art">${paintedGem('dock')}</div><p>${this.index < 2 ? 'Another garden. Another way to curve.' : 'Three gardens explored. Try a different mineral or compare shutter control.'}${this.storageUnavailable ? ' Progress could not be saved.' : ''}</p><button id="flight-next" class="primary" data-flight-dialog="next">${this.index < 2 ? 'Next garden' : 'Return to arcade'} <span>→</span></button><div class="flight-dialog-actions"><button data-flight-dialog="retry">Try another shot</button><button data-flight-dialog="hub">← Arcade</button></div>`;
    this.dialogElement.querySelector<HTMLElement>('#flight-next')?.focus();
  }
  private dialogClick = (event: Event) => {
    const action = (event.target as Element).closest<HTMLElement>('[data-flight-dialog]')?.dataset.flightDialog;
    if (action === 'continue') { this.acknowledge([this.queue.shift()!]); this.showLesson(); }
    if (action === 'skip') { this.acknowledge(this.queue); this.queue = []; this.closeDialog(); }
    if (action === 'resume') this.closeDialog();
    if (action === 'retry') { this.guide = false; this.wasFlyingWhenBlurred = false; this.retry(); }
    if (action === 'next') this.index < 2 ? this.start(this.index + 1) : this.options.hub();
    if (action === 'hub') this.options.hub();
  };
  private dialogCancel = (event: Event) => {
    event.preventDefault();
    if (this.guide) { this.acknowledge(this.queue); this.queue = []; }
    this.closeDialog();
  };
  private trapDialog = (event: KeyboardEvent) => {
    if (event.code === 'Space' && event.target === this.dialogElement) event.preventDefault();
    if (event.key !== 'Tab') return;
    const buttons = [...this.dialogElement.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')], first = buttons[0], last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  preferencesChanged() { this.dialogElement.classList.toggle('reduced', this.options.save().reduced); if (this.options.host.querySelector('#flight-board')) this.updateControls(); }
  inspect() { return { index: this.index, state: structuredClone(this.state), paused: this.paused, guide: this.guide, loadout: this.loadout, angle: this.angle, power: this.power, mode: this.mode, attempts: this.attempts }; }
  dispose() {
    this.disposed = true; cancelAnimationFrame(this.raf); this.dialogElement.remove();
    this.options.host.removeEventListener('input', this.input);
    this.options.host.removeEventListener('pointerdown', this.pointerDown); this.options.host.removeEventListener('pointermove', this.pointerMove);
    this.options.host.removeEventListener('pointerup', this.pointerUp); this.options.host.removeEventListener('pointercancel', this.pointerCancel); this.options.host.removeEventListener('lostpointercapture', this.pointerCancel);
    window.removeEventListener('keyup', this.keyUp); this.options.modalHost.innerHTML = ''; this.options.frame.inert = false;
    suspendAudio();
  }
}
