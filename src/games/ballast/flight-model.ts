export interface Vec { x: number; y: number }
export type Loadout = 'blue' | 'red' | 'mixed' | 'neutral'
export interface Body {
  id: string; name: string; x: number; y: number; radius: number
  range: number; strength: number; blue: number; red: number
}
export interface Obstacle { x: number; y: number; w: number; h: number }
export interface Course {
  id: string; name: string; description: string; start: Vec; receiver: Vec
  bodies: Body[]; walls: Obstacle[]; angle: number; power: number
}
export interface FlightState {
  x: number; y: number; vx: number; vy: number; time: number
  phase: 'ready' | 'flying' | 'won' | 'ended'; reason: string
  shielded: boolean; loadout: Loadout
}

export const WORLD = { width: 960, height: 540 }
export const BALL_RADIUS = 12
export const RECEIVER_RADIUS = 29
export const CAPTURE_SPEED = 108
export const FLIGHT_LIMIT = 22
export const MAX_SPEED = 650
const DRAG = .32
const REST_SPEED = 8
const REST_ACCELERATION = 9
const BOUNCE = .76
const FIXED_STEP = 1 / 120

export const courses: Course[] = [
  {
    id: 'crescent', name: 'Crescent',
    description: 'Curve a shot around a floating mineral and settle into the receiver.',
    start: { x: 150, y: 365 }, receiver: { x: 808, y: 220 },
    bodies: [
      { id: 'lune', name: 'Lune', x: 470, y: 287, radius: 48, range: 345, strength: 245, blue: 1, red: -.85 },
    ],
    walls: [], angle: -27, power: 60,
  },
  {
    id: 'cushion', name: 'Cushion',
    description: 'Use repulsion to bend your approach and soften your arrival.',
    start: { x: 140, y: 320 }, receiver: { x: 778, y: 395 },
    bodies: [
      { id: 'shoulder', name: 'Shoulder', x: 410, y: 195, radius: 39, range: 245, strength: 190, blue: .6, red: -1 },
      { id: 'cushion', name: 'Cushion', x: 888, y: 395, radius: 30, range: 240, strength: 185, blue: .45, red: -1 },
    ],
    walls: [{ x: 486, y: 353, w: 26, h: 14 }], angle: -10, power: 65,
  },
  {
    id: 'confluence', name: 'Confluence',
    description: 'Find a route through overlapping fields that respond differently to your cargo.',
    start: { x: 132, y: 390 }, receiver: { x: 813, y: 174 },
    bodies: [
      { id: 'iris', name: 'Iris', x: 389, y: 244, radius: 43, range: 285, strength: 210, blue: 1, red: -.6 },
      { id: 'ember', name: 'Ember', x: 623, y: 347, radius: 44, range: 290, strength: 220, blue: -.7, red: 1 },
    ],
    walls: [{ x: 498, y: 78, w: 28, h: 105 }, { x: 494, y: 252, w: 30, h: 28 }], angle: -20, power: 66,
  },
]

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value))
const finite = (value: number, fallback = 0) => Number.isFinite(value) ? value : fallback

/** A mixed loadout shares the response equally between its two minerals. */
export function response(body: Body, loadout: Loadout): number {
  if (loadout === 'blue') return body.blue
  if (loadout === 'red') return body.red
  if (loadout === 'mixed') return (body.blue + body.red) / 2
  return 0
}

/** Soft finite fields: strongest near the surface, smoothly zero at the visible rim. */
export function acceleration(course: Course, point: Vec, loadout: Loadout, shielded = false): Vec {
  if (shielded) return { x: 0, y: 0 }
  let x = 0, y = 0
  for (const body of course.bodies) {
    const dx = body.x - point.x, dy = body.y - point.y
    const distance = Math.hypot(dx, dy)
    if (distance <= .00001 || distance >= body.range) continue
    const influence = 1 - clamp((distance - body.radius) / (body.range - body.radius), 0, 1)
    const falloff = influence * influence * (3 - 2 * influence)
    const force = response(body, loadout) * body.strength * falloff
    x += dx / distance * force
    y += dy / distance * force
  }
  const magnitude = Math.hypot(x, y)
  if (magnitude > 480) { x *= 480 / magnitude; y *= 480 / magnitude }
  return { x, y }
}

export function createFlight(course: Course, loadout: Loadout): FlightState {
  return { ...course.start, vx: 0, vy: 0, time: 0, phase: 'ready', reason: '', shielded: false, loadout }
}

/** Angles follow screen coordinates: zero points right, positive points down. */
export function launch(state: FlightState, angleDegrees: number, power0to100: number): FlightState {
  if (state.phase !== 'ready') return state
  const angle = finite(angleDegrees) * Math.PI / 180
  const speed = clamp(finite(power0to100), 0, 100) * 5.4
  return { ...state, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, phase: 'flying', reason: '', shielded: false }
}

function reflect(state: FlightState, nx: number, ny: number) {
  const toward = state.vx * nx + state.vy * ny
  if (toward < 0) {
    state.vx -= (1 + BOUNCE) * toward * nx
    state.vy -= (1 + BOUNCE) * toward * ny
  }
}

function collide(state: FlightState, course: Course) {
  if (state.x < BALL_RADIUS) { state.x = BALL_RADIUS; reflect(state, 1, 0) }
  if (state.x > WORLD.width - BALL_RADIUS) { state.x = WORLD.width - BALL_RADIUS; reflect(state, -1, 0) }
  if (state.y < BALL_RADIUS) { state.y = BALL_RADIUS; reflect(state, 0, 1) }
  if (state.y > WORLD.height - BALL_RADIUS) { state.y = WORLD.height - BALL_RADIUS; reflect(state, 0, -1) }
  for (const body of course.bodies) {
    const dx = state.x - body.x, dy = state.y - body.y
    const distance = Math.hypot(dx, dy), separation = body.radius + BALL_RADIUS
    if (distance >= separation) continue
    const nx = distance > .00001 ? dx / distance : 1, ny = distance > .00001 ? dy / distance : 0
    state.x = body.x + nx * separation; state.y = body.y + ny * separation
    reflect(state, nx, ny)
  }
  for (const wall of course.walls) {
    const nearX = clamp(state.x, wall.x, wall.x + wall.w)
    const nearY = clamp(state.y, wall.y, wall.y + wall.h)
    const dx = state.x - nearX, dy = state.y - nearY, distance = Math.hypot(dx, dy)
    if (distance >= BALL_RADIUS) continue
    if (distance > .00001) {
      const nx = dx / distance, ny = dy / distance
      state.x = nearX + nx * BALL_RADIUS; state.y = nearY + ny * BALL_RADIUS
      reflect(state, nx, ny)
    } else {
      const faces = [
        { gap: Math.abs(state.x - wall.x), x: wall.x - BALL_RADIUS, y: state.y, nx: -1, ny: 0 },
        { gap: Math.abs(wall.x + wall.w - state.x), x: wall.x + wall.w + BALL_RADIUS, y: state.y, nx: 1, ny: 0 },
        { gap: Math.abs(state.y - wall.y), x: state.x, y: wall.y - BALL_RADIUS, nx: 0, ny: -1 },
        { gap: Math.abs(wall.y + wall.h - state.y), x: state.x, y: wall.y + wall.h + BALL_RADIUS, nx: 0, ny: 1 },
      ]
      const face = faces.reduce((nearest, item) => item.gap < nearest.gap ? item : nearest)
      state.x = face.x; state.y = face.y; reflect(state, face.nx, face.ny)
    }
  }
}

function integrate(course: Course, state: FlightState, dt: number, shielded: boolean) {
  const force = acceleration(course, state, state.loadout, shielded)
  const drag = Math.exp(-DRAG * dt)
  state.vx = (state.vx + force.x * dt) * drag
  state.vy = (state.vy + force.y * dt) * drag
  const speed = Math.hypot(state.vx, state.vy)
  if (speed > MAX_SPEED) { state.vx *= MAX_SPEED / speed; state.vy *= MAX_SPEED / speed }
  state.x += state.vx * dt; state.y += state.vy * dt
  state.time += dt; state.shielded = shielded
  collide(state, course)
  const receiverDistance = Math.hypot(state.x - course.receiver.x, state.y - course.receiver.y)
  const currentSpeed = Math.hypot(state.vx, state.vy)
  if (receiverDistance <= RECEIVER_RADIUS - BALL_RADIUS * .35 && currentSpeed <= CAPTURE_SPEED) {
    state.x = course.receiver.x; state.y = course.receiver.y
    state.vx = 0; state.vy = 0; state.phase = 'won'; state.reason = 'Received'
  } else if (state.time >= FLIGHT_LIMIT) {
    state.phase = 'ended'; state.reason = 'Try another line'
  } else if (state.time > 1.5 && currentSpeed < REST_SPEED && Math.hypot(force.x, force.y) < REST_ACCELERATION) {
    state.phase = 'ended'; state.reason = 'At rest'
  }
}

/** Pure deterministic update. Substeps also protect collision checks when callers pass a long frame. */
export function step(course: Course, state: FlightState, dt: number, shielded = false): FlightState {
  if (state.phase !== 'flying' || !Number.isFinite(dt) || dt <= 0) return state
  const next = { ...state }
  let remaining = Math.min(dt, FLIGHT_LIMIT)
  while (remaining > .000000001 && next.phase === 'flying') {
    const delta = Math.min(FIXED_STEP, remaining)
    integrate(course, next, delta, shielded)
    remaining -= delta
  }
  return next
}

export function preview(course: Course, loadout: Loadout, angle: number, power: number, seconds = 1.2): Vec[] {
  let state = launch(createFlight(course, loadout), angle, power)
  const points: Vec[] = [{ x: state.x, y: state.y }]
  const count = Math.ceil(clamp(finite(seconds, 1.2), 0, FLIGHT_LIMIT) / FIXED_STEP)
  for (let i = 0; i < count && state.phase === 'flying'; i++) {
    state = step(course, state, FIXED_STEP)
    if (i % 4 === 3 || state.phase !== 'flying' || i === count - 1) points.push({ x: state.x, y: state.y })
  }
  return points
}
