import { introLevels } from './levels-intro.ts';
import { foundationLevels } from './levels-foundation.ts';
import { advancedLevels } from './levels-advanced.ts';

export type Mineral = 'north' | 'east' | 'south' | 'west';
export type Vec = { x: number; y: number };
export type Rect = Vec & { w: number; h: number };
export type Dock = Vec & { r: number; name: string; exit?: boolean; minerals?: Mineral[] };
export type Switch = { id: string; mineral: Mineral; rect: Rect; requires?: string[] };
export type Gate = { id: string; rect: Rect; requires: string[] };
export type Chamber = { title: string; lesson: string; hint: string; hints: [string, string, string]; docks: Dock[]; walls: Rect[]; gate?: Rect; plate?: Rect; releaseBay?: Rect; switches?: Switch[]; gates?: Gate[]; requiredSwitches?: string[] };
export const minerals: { id: Mineral; name: string; arrow: string; color: string; force: Vec }[] = [
  { id: 'north', name: 'Skyglass', arrow: '↑', color: '#9bcdd9', force: { x: 0, y: -1 } },
  { id: 'east', name: 'Sunstone', arrow: '→', color: '#e8c67c', force: { x: 1, y: 0 } },
  { id: 'south', name: 'Ironroot', arrow: '↓', color: '#eb9c7c', force: { x: 0, y: 1 } },
  { id: 'west', name: 'Mossjade', arrow: '←', color: '#a9c69b', force: { x: -1, y: 0 } },
];
export const chambers: Chamber[] = [...introLevels, ...foundationLevels, ...advancedLevels];
export const WORLD = { width: 960, height: 540, inset: 24, radius: 17, acceleration: 170, drag: 1.9, maxSpeed: 140, dt: 1 / 60 };
export type Piece = Vec & { vx: number; vy: number; mineral: Mineral; resting: boolean; age: number; id: number };
export type State = Vec & { vx: number; vy: number; slots: [Mineral | null, Mineral | null]; phase: 'docked' | 'flying' | 'crashed' | 'won'; dock: number; departing: number | null; pieces: Piece[]; activated: string[]; gateOpen: boolean; ticks: number; launches: number; ejections: number; reason: string; nextPiece: number };
export type Action = { type: 'load'; slot: number; mineral: Mineral | null } | { type: 'launch' } | { type: 'eject'; slot: number };
export function initialState(chamber: Chamber): State {
  return { x: chamber.docks[0].x, y: chamber.docks[0].y, vx: 0, vy: 0, slots: [null, null], phase: 'docked', dock: 0, departing: null, pieces: [], activated: [], gateOpen: false, ticks: 0, launches: 0, ejections: 0, reason: '', nextPiece: 0 };
}
/** Legacy tutorial geometry and campaign devices share the same simulation rules. */
export function switchesFor(chamber: Chamber): Switch[] {
  return chamber.switches ?? (chamber.plate ? [{ id: 'legacy', mineral: 'north', rect: chamber.plate }] : []);
}
export function gatesFor(chamber: Chamber): Gate[] {
  return chamber.gates ?? (chamber.gate ? [{ id: 'legacy', rect: chamber.gate, requires: ['legacy'] }] : []);
}
export function gateIsOpen(gate: Gate, state: Pick<State, 'activated' | 'gateOpen'>): boolean {
  return gate.requires.every(id => state.activated.includes(id) || id === 'legacy' && state.gateOpen);
}
export function availableMinerals(chamber: Chamber, state: Pick<State, 'dock'>): Mineral[] {
  return [...(chamber.docks[state.dock]?.minerals ?? minerals.map(mineral => mineral.id))];
}
export function force(slots: (Mineral | null)[]): Vec {
  return slots.reduce<Vec>((sum, id) => { const f = minerals.find(m => m.id === id)?.force; return { x: sum.x + (f?.x ?? 0), y: sum.y + (f?.y ?? 0) }; }, { x: 0, y: 0 });
}
export function transition(state: State, action: Action, chamber?: Chamber): State {
  if (action.type === 'load') {
    if (state.phase !== 'docked' || ![0, 1].includes(action.slot) || action.mineral !== null && (!minerals.some(m => m.id === action.mineral) || chamber && !availableMinerals(chamber, state).includes(action.mineral))) return state;
    const slots: State['slots'] = [...state.slots]; slots[action.slot] = action.mineral;
    return { ...state, slots };
  }
  if (action.type === 'launch') {
    const f = force(state.slots);
    if (state.phase !== 'docked' || f.x === 0 && f.y === 0) return state;
    return { ...state, phase: 'flying', departing: state.dock, launches: state.launches + 1, reason: '' };
  }
  if (state.phase !== 'flying' || ![0, 1].includes(action.slot) || !state.slots[action.slot]) return state;
  const mineral = state.slots[action.slot]!, f = force([mineral]);
  const slots: State['slots'] = [...state.slots]; slots[action.slot] = null;
  const piece: Piece = { id: state.nextPiece, x: state.x + f.x * 27, y: state.y + f.y * 27, vx: state.vx, vy: state.vy, mineral, resting: false, age: 0 };
  return { ...state, slots, pieces: [...state.pieces, piece], nextPiece: state.nextPiece + 1, ejections: state.ejections + 1 };
}
export function touches(p: Vec, radius: number, rect: Rect) {
  const dx = p.x - Math.max(rect.x, Math.min(p.x, rect.x + rect.w)), dy = p.y - Math.max(rect.y, Math.min(p.y, rect.y + rect.h));
  return dx * dx + dy * dy <= radius * radius;
}
function outside(p: Vec, r: number) { return p.x - r < WORLD.inset || p.x + r > WORLD.width - WORLD.inset || p.y - r < WORLD.inset || p.y + r > WORLD.height - WORLD.inset; }
function integrate<T extends Vec & { vx: number; vy: number }>(body: T, f: Vec): T {
  const decay = Math.exp(-WORLD.drag * WORLD.dt);
  let vx = body.vx * decay + f.x * WORLD.acceleration / WORLD.drag * (1 - decay);
  let vy = body.vy * decay + f.y * WORLD.acceleration / WORLD.drag * (1 - decay);
  const speed = Math.hypot(vx, vy);
  if (speed > WORLD.maxSpeed) { vx *= WORLD.maxSpeed / speed; vy *= WORLD.maxSpeed / speed; }
  return { ...body, vx, vy, x: body.x + vx * WORLD.dt, y: body.y + vy * WORLD.dt };
}
/** One fixed 1/60-second step. Rendering never controls collision or time. */
export function step(chamber: Chamber, state: State): State {
  if (state.phase === 'crashed' || state.phase === 'won') return state;
  const switches = switchesFor(chamber), gates = gatesFor(chamber);
  const before = new Set(state.activated);
  if (state.gateOpen && switches.some(device => device.id === 'legacy')) before.add('legacy');
  const activated = new Set(before);
  // Every moving piece sees the same switch and gate state for this tick. A newly
  // activated prerequisite becomes available next tick, independent of array order.
  const pieces = state.pieces.map(piece => {
    if (piece.resting) return { ...piece, age: piece.age + WORLD.dt };
    const moved = integrate(piece, force([piece.mineral]));
    const hitSwitches = switches.filter(device => touches(moved, 8, device.rect));
    if (hitSwitches.length) {
      for (const device of hitSwitches) if (piece.mineral === device.mineral && (device.requires ?? []).every(id => before.has(id))) activated.add(device.id);
      return { ...moved, vx: 0, vy: 0, resting: true, age: 0 };
    }
    if (outside(moved, 8) || chamber.walls.some(w => touches(moved, 8, w)) || gates.some(gate => !gateIsOpen(gate, state) && touches(moved, 8, gate.rect))) return { ...moved, vx: 0, vy: 0, resting: true, age: 0 };
    return moved;
  }).filter(p => !p.resting || p.age < 2);
  const activatedIds = [...activated].sort();
  const deviceState = { activated: activatedIds, gateOpen: activated.has('legacy') };
  const gateOpen = gates.length ? gates.every(gate => gateIsOpen(gate, deviceState)) : state.gateOpen;
  if (state.phase === 'docked') return state.pieces.length ? { ...state, pieces, activated: activatedIds, gateOpen } : state;
  let next = { ...integrate(state, force(state.slots)), pieces, activated: activatedIds, gateOpen, ticks: state.ticks + 1 };
  if (next.departing !== null && Math.hypot(next.x - chamber.docks[next.departing].x, next.y - chamber.docks[next.departing].y) > chamber.docks[next.departing].r + 8) next.departing = null;
  if (gates.some(gate => !gateIsOpen(gate, next) && touches(next, WORLD.radius, gate.rect))) return { ...next, phase: 'crashed', reason: 'The receiver gate is still closed.' };
  if (outside(next, WORLD.radius)) return { ...next, phase: 'crashed', reason: 'The core hit the outer frame.' };
  if (chamber.walls.some(w => touches(next, WORLD.radius, w))) return { ...next, phase: 'crashed', reason: 'The core struck an obstacle.' };
  for (let i = 0; i < chamber.docks.length; i++) {
    const d = chamber.docks[i];
    if (i === next.departing || Math.hypot(next.x - d.x, next.y - d.y) > d.r) continue;
    const required = chamber.requiredSwitches ?? switches.map(device => device.id);
    if (d.exit && required.some(id => !activated.has(id))) return { ...next, phase: 'crashed', reason: 'Power every required switch before delivery.' };
    return { ...next, x: d.x, y: d.y, vx: 0, vy: 0, dock: i, departing: null, phase: d.exit ? 'won' : 'docked' };
  }
  const pull = force(next.slots);
  if (!pull.x && !pull.y && Math.hypot(next.vx, next.vy) < 5) return { ...next, phase: 'crashed', reason: 'No pull remains. Refit at your last dock.' };
  return next;
}
export class BallastSession {
  state: State;
  checkpoint: State;
  arrival: State;
  chamber: Chamber;
  private dockHistory: { checkpoint: State; arrival: State }[] = [];
  constructor(chamber: Chamber) { this.chamber = chamber; this.state = initialState(chamber); this.checkpoint = structuredClone(this.state); this.arrival = structuredClone(this.state); }
  act(action: Action) {
    const next = transition(this.state, action, this.chamber); if (next === this.state) return false;
    if (action.type === 'launch') this.checkpoint = structuredClone(this.state);
    this.state = next; return true;
  }
  step() {
    const wasFlying = this.state.phase === 'flying';
    this.state = step(this.chamber, this.state);
    if (wasFlying && this.state.phase === 'docked') {
      this.dockHistory.push({ checkpoint: structuredClone(this.checkpoint), arrival: structuredClone(this.arrival) });
      this.arrival = structuredClone(this.state);
    }
  }
  retry() { this.state = structuredClone(this.checkpoint); }
  /** Undo refit edits, including a carried mineral the current dock cannot supply. */
  resetRefit() {
    if (this.state.phase !== 'docked' || this.state.dock !== this.arrival.dock) return false;
    this.state = structuredClone(this.arrival); this.checkpoint = structuredClone(this.arrival); return true;
  }
  canGoBack() { return this.dockHistory.length > 0; }
  /** Rewind a successful leg if it reached a refit with the wrong remaining cargo. */
  previousDock() {
    if (this.state.phase !== 'docked') return false;
    const previous = this.dockHistory.pop(); if (!previous) return false;
    this.state = structuredClone(previous.checkpoint); this.checkpoint = structuredClone(previous.checkpoint); this.arrival = structuredClone(previous.arrival); return true;
  }
  restart() { this.state = initialState(this.chamber); this.checkpoint = structuredClone(this.state); this.arrival = structuredClone(this.state); this.dockHistory = []; }
}
export function forecast(chamber: Chamber, state: State) {
  let s = transition(state, { type: 'launch' }, chamber); const points: Vec[] = [{ x: s.x, y: s.y }];
  if (s.phase !== 'flying') return { points, outcome: s.phase, dock: s.dock };
  for (let i = 0; i < 900; i++) { s = step(chamber, s); if (i % 12 === 0 || s.phase !== 'flying') points.push({ x: s.x, y: s.y }); if (s.phase !== 'flying') break; }
  return { points, outcome: s.phase, dock: s.dock };
}
export type ReleaseForecast = { capsule: Vec[]; released: { mineral: Mineral; points: Vec[] } | null; outcome: State['phase'] };
/** A two-second ejection preview using the live physics; the supplied state stays untouched. */
export function releaseForecast(chamber: Chamber, state: State, slot: number): ReleaseForecast {
  let s = transition(state, { type: 'eject', slot }, chamber);
  const capsule: Vec[] = [{ x: s.x, y: s.y }];
  if (s === state) return { capsule, released: null, outcome: state.phase };
  const pieceId = state.nextPiece;
  const piece = s.pieces.find(p => p.id === pieceId)!;
  const released = { mineral: piece.mineral, points: [{ x: piece.x, y: piece.y }] };
  for (let i = 1; i <= 120; i++) {
    s = step(chamber, s);
    if (i % 6 === 0 || s.phase !== 'flying') {
      capsule.push({ x: s.x, y: s.y });
      const moved = s.pieces.find(p => p.id === pieceId);
      if (moved) released.points.push({ x: moved.x, y: moved.y });
    }
    if (s.phase !== 'flying') break;
  }
  return { capsule, released, outcome: s.phase };
}
