import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  acceleration, BALL_RADIUS, CAPTURE_SPEED, courses, createFlight, FLIGHT_LIMIT,
  launch, MAX_SPEED, preview, RECEIVER_RADIUS, response, step, WORLD,
} from '../src/games/ballast/flight-model.ts'
import type { Body, Course, FlightState, Loadout } from '../src/games/ballast/flight-model.ts'

const DT = 1 / 120
const empty: Course = {
  id: 'test', name: 'Test', description: 'Physics fixture',
  start: { x: 100, y: 270 }, receiver: { x: 850, y: 70 },
  bodies: [], walls: [], angle: 0, power: 50,
}
const mineral: Body = { id: 'body', name: 'Body', x: 480, y: 270, radius: 40, range: 300, strength: 200, blue: 1, red: -.6 }
const oneBody: Course = { ...empty, bodies: [mineral] }

function fly(course: Course, loadout: Loadout, angle: number, power: number, shieldAt = Infinity) {
  let state = launch(createFlight(course, loadout), angle, power)
  const points = [state]
  for (let tick = 0; tick < (FLIGHT_LIMIT + 1) / DT && state.phase === 'flying'; tick++) {
    state = step(course, state, DT, state.time >= shieldAt)
    points.push(state)
  }
  return { state, points }
}

function close(actual: number, expected: number, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`)
}

test('Fields point toward or away from each body; cargo has no global directional thrust', () => {
  for (const point of [{ x: 300, y: 270 }, { x: 480, y: 90 }, { x: 620, y: 350 }]) {
    const blue = acceleration(oneBody, point, 'blue')
    const red = acceleration(oneBody, point, 'red')
    const toward = { x: mineral.x - point.x, y: mineral.y - point.y }
    assert.ok(blue.x * toward.x + blue.y * toward.y > 0)
    assert.ok(red.x * toward.x + red.y * toward.y < 0)
    close(blue.x * toward.y - blue.y * toward.x, 0, 1e-7)
    assert.deepEqual(acceleration(empty, point, 'blue'), { x: 0, y: 0 })
    assert.deepEqual(acceleration(oneBody, point, 'neutral'), { x: 0, y: 0 })
  }
})

test('Mixed cargo averages the two responses and can attract one body while repelling another', () => {
  close(response(mineral, 'mixed'), .2)
  close(response({ ...mineral, red: -1 }, 'mixed'), 0)
  close(response(courses[1].bodies[0], 'mixed'), -.2)
  assert.ok(response(courses[2].bodies[0], 'mixed') > 0)
  assert.ok(response(courses[2].bodies[1], 'mixed') > 0)
  const point = { x: 310, y: 150 }
  const blue = acceleration(oneBody, point, 'blue'), red = acceleration(oneBody, point, 'red')
  const mixed = acceleration(oneBody, point, 'mixed')
  close(mixed.x, (blue.x + red.x) / 2)
  close(mixed.y, (blue.y + red.y) / 2)
})

test('Field rims fade smoothly to zero, overlapping fields add, and extreme forces remain bounded', () => {
  const near = acceleration(oneBody, { x: 420, y: 270 }, 'blue')
  const far = acceleration(oneBody, { x: 200, y: 270 }, 'blue')
  assert.ok(near.x > far.x && far.x > 0)
  assert.deepEqual(acceleration(oneBody, { x: 180, y: 270 }, 'blue'), { x: 0, y: 0 })
  assert.ok(Math.abs(acceleration(oneBody, { x: 180.001, y: 270 }, 'blue').x) < .00001)
  assert.deepEqual(acceleration(oneBody, mineral, 'blue'), { x: 0, y: 0 })
  const point = { x: 480, y: 440 }, other = { ...mineral, x: 600 }
  const a = acceleration(oneBody, point, 'blue'), b = acceleration({ ...empty, bodies: [other] }, point, 'blue')
  const together = acceleration({ ...empty, bodies: [mineral, other] }, point, 'blue')
  close(together.x, a.x + b.x); close(together.y, a.y + b.y)
  const extreme = acceleration({ ...empty, bodies: [{ ...mineral, strength: 1e9 }] }, point, 'blue')
  assert.ok(Number.isFinite(extreme.x) && Number.isFinite(extreme.y))
  assert.ok(Math.hypot(extreme.x, extreme.y) <= 480 + 1e-9)
})

test('A launch gives an aimed impulse with clamped power and leaves its input untouched', () => {
  const ready = Object.freeze(createFlight(empty, 'blue'))
  const down = launch(ready, 90, 50)
  close(down.vx, 0); assert.ok(down.vy > 0)
  assert.equal(ready.phase, 'ready'); assert.equal(ready.vy, 0)
  assert.equal(launch(down, 0, 100), down, 'a second impulse cannot be added during flight')
  assert.deepEqual(launch(ready, 20, 200), launch(ready, 20, 100))
  assert.equal(launch(ready, 0, -5).vx, 0)
  const neutral = launch(createFlight(empty, 'neutral'), 25, 60)
  const moved = step(empty, neutral, .1)
  assert.ok(moved.x > neutral.x && moved.y > neutral.y)
  assert.ok(Math.hypot(moved.vx, moved.vy) < Math.hypot(neutral.vx, neutral.vy))
  close(moved.vy / moved.vx, neutral.vy / neutral.vx)
})

test('The shutter removes field force while preserving momentum, then restores the field on release', () => {
  const state: FlightState = { ...createFlight(oneBody, 'blue'), x: 310, y: 210, vx: 150, vy: 20, phase: 'flying' }
  const before = structuredClone(state)
  const shielded = step(oneBody, state, DT, true)
  const unshielded = step(oneBody, state, DT, false)
  assert.deepEqual(state, before)
  assert.deepEqual(acceleration(oneBody, state, 'blue', true), { x: 0, y: 0 })
  assert.equal(shielded.shielded, true)
  close(shielded.vy / shielded.vx, state.vy / state.vx)
  assert.ok(shielded.vx > 149, 'shielding does not stop or reverse the object')
  assert.ok(unshielded.vx > shielded.vx && unshielded.vy > shielded.vy)
  const restored = step(oneBody, shielded, DT, false)
  assert.equal(restored.shielded, false)
  assert.ok(restored.vx > step(oneBody, shielded, DT, true).vx)
})

test('Fixed-step flights repeat exactly and a longer frame substeps to the same result', () => {
  const state = Object.freeze(launch(createFlight(courses[0], 'blue'), -30, 68))
  const batched = step(courses[0], state, 1 / 30)
  let separate = state
  for (let tick = 0; tick < 4; tick++) separate = step(courses[0], separate, DT)
  assert.deepEqual(batched, separate)
  assert.deepEqual(fly(courses[0], 'blue', -30, 68), fly(courses[0], 'blue', -30, 68))
  for (const invalid of [0, -1, NaN, Infinity]) assert.equal(step(courses[0], state, invalid), state)
})

test('Fast objects bounce off bodies without tunneling or exceeding the speed limit', () => {
  let state: FlightState = { ...createFlight(oneBody, 'neutral'), x: 380, y: 270, vx: 2000, phase: 'flying' }
  for (let i = 0; i < 60; i++) {
    state = step(oneBody, state, DT)
    assert.ok(Math.hypot(state.x - mineral.x, state.y - mineral.y) >= mineral.radius + BALL_RADIUS - 1e-7)
    assert.ok(Math.hypot(state.vx, state.vy) <= MAX_SPEED + 1e-9)
  }
  assert.ok(state.vx < 0)
  const centered = step(oneBody, { ...state, x: mineral.x, y: mineral.y, vx: 0, vy: 0 }, DT)
  assert.ok(Number.isFinite(centered.x) && Number.isFinite(centered.y))
})

test('Rectangular obstacles and the chamber boundary rebound the object, including corner contact', () => {
  const wall = { x: 400, y: 180, w: 30, h: 180 }
  const course = { ...empty, walls: [wall] }
  let state: FlightState = { ...createFlight(course, 'neutral'), x: 350, y: 270, vx: 600, phase: 'flying' }
  state = step(course, state, .2)
  assert.ok(state.x <= wall.x - BALL_RADIUS && state.vx < 0)
  const corner = step(course, { ...state, x: 392, y: 172, vx: 120, vy: 120 }, DT)
  assert.ok(corner.vx < 0 && corner.vy < 0)
  assert.ok(Math.hypot(corner.x - wall.x, corner.y - wall.y) >= BALL_RADIUS - 1e-7)
  const edge = step(empty, { ...state, x: 14, y: 14, vx: -500, vy: -500 }, .2)
  assert.ok(edge.x >= BALL_RADIUS && edge.y >= BALL_RADIUS)
  assert.ok(edge.vx > 0 && edge.vy > 0)
})

test('The receiver settles a slow arrival but a fast fly-through must continue', () => {
  const course = { ...empty, receiver: { x: 500, y: 270 } }
  const base: FlightState = { ...createFlight(course, 'neutral'), x: 477, y: 270, vx: CAPTURE_SPEED - 2, phase: 'flying' }
  const slow = step(course, base, DT)
  assert.equal(slow.phase, 'won'); assert.equal(slow.x, 500); assert.equal(slow.y, 270)
  assert.equal(slow.vx, 0); assert.equal(slow.vy, 0)
  const fast = step(course, { ...base, vx: CAPTURE_SPEED * 3 }, .15)
  assert.equal(fast.phase, 'flying'); assert.ok(fast.x > course.receiver.x)
  assert.equal(step(course, slow, 1), slow, 'completed flights remain settled')
})

test('A stopped shot and a trapped shot both end; any result can be retried immediately', () => {
  const stopped = fly(empty, 'neutral', 0, 0).state
  assert.equal(stopped.phase, 'ended'); assert.equal(stopped.reason, 'At rest')
  assert.ok(stopped.time < 2)
  let trapped: FlightState = { ...createFlight(oneBody, 'blue'), x: mineral.x - mineral.radius - BALL_RADIUS, y: mineral.y, phase: 'flying' }
  for (let i = 0; i < 2800 && trapped.phase === 'flying'; i++) trapped = step(oneBody, trapped, DT)
  assert.equal(trapped.phase, 'ended'); assert.ok(trapped.time <= FLIGHT_LIMIT + DT)
  assert.equal(trapped.reason, 'Try another line')
  assert.deepEqual(createFlight(oneBody, trapped.loadout), createFlight(oneBody, 'blue'))
  assert.equal(launch(createFlight(oneBody, trapped.loadout), -30, 70).phase, 'flying')
})

test('The short aiming preview follows the real simulation and never changes the course', () => {
  const before = structuredClone(courses[0])
  const path = preview(courses[0], 'blue', -30, 68)
  let actual = launch(createFlight(courses[0], 'blue'), -30, 68)
  for (let i = 0; i < 144; i++) actual = step(courses[0], actual, DT)
  assert.deepEqual(path.at(-1), { x: actual.x, y: actual.y })
  assert.deepEqual(path[0], courses[0].start)
  assert.deepEqual(courses[0], before)
  assert.ok(path.length > 10 && path.length < 50)
  assert.deepEqual(preview(courses[0], 'red', 0, 30, 0), [courses[0].start])
})

test('The three courses keep starts, receivers, and solid bodies clear and inside the chamber', () => {
  assert.equal(courses.length, 3)
  assert.equal(new Set(courses.map(course => course.id)).size, 3)
  for (const course of courses) {
    for (const point of [course.start, course.receiver]) {
      assert.ok(point.x > RECEIVER_RADIUS && point.x < WORLD.width - RECEIVER_RADIUS)
      assert.ok(point.y > RECEIVER_RADIUS && point.y < WORLD.height - RECEIVER_RADIUS)
      for (const body of course.bodies) assert.ok(Math.hypot(point.x - body.x, point.y - body.y) > body.radius + RECEIVER_RADIUS)
      for (const wall of course.walls) {
        const x = Math.max(wall.x, Math.min(wall.x + wall.w, point.x))
        const y = Math.max(wall.y, Math.min(wall.y + wall.h, point.y))
        assert.ok(Math.hypot(point.x - x, point.y - y) > RECEIVER_RADIUS)
      }
    }
    for (const body of course.bodies) {
      assert.ok(body.radius > BALL_RADIUS && body.range > body.radius && body.strength > 0)
      assert.ok(body.x - body.radius > 0 && body.x + body.radius < WORLD.width)
      assert.ok(body.y - body.radius > 0 && body.y + body.radius < WORLD.height)
    }
  }
})

test('Crescent has two clean attraction arcs on opposite sides, plus a repulsion bank shot', () => {
  const upper = fly(courses[0], 'blue', -30, 68), lower = fly(courses[0], 'blue', 10, 68)
  for (const result of [upper, lower, fly(courses[0], 'red', -28, 76)]) {
    assert.equal(result.state.phase, 'won'); assert.ok(result.state.time < 5)
  }
  const crossing = (result: ReturnType<typeof fly>) => result.points.find(state => state.x >= courses[0].bodies[0].x)!
  assert.ok(crossing(upper).y < courses[0].bodies[0].y - 60)
  assert.ok(crossing(lower).y > courses[0].bodies[0].y + 60)
  for (const angle of [-32, -30, -28]) {
    assert.equal(fly(courses[0], 'blue', angle, 68).state.phase, 'won', 'first course allows a useful aiming margin')
  }
})

test('Cushion supports attraction, repulsion braking, and mixed-cargo approaches', () => {
  const shots: [Loadout, number, number][] = [['blue', 12, 52], ['red', -4, 68], ['mixed', 0, 48]]
  for (const [loadout, angle, power] of shots) {
    const result = fly(courses[1], loadout, angle, power)
    assert.equal(result.state.phase, 'won'); assert.ok(result.state.time < 5)
  }
  const red = fly(courses[1], 'red', -4, 68)
  const approach = red.points.find(point => point.x > 700)!
  const force = acceleration(courses[1], approach, 'red')
  assert.ok(force.x * approach.vx + force.y * approach.vy < 0, 'repulsion brakes the approach')
})

test('Confluence has three different launch-and-watch routes; the shutter opens another clean line', () => {
  for (const [loadout, angle, power] of [['blue', -54, 76], ['red', 28, 78], ['mixed', -12, 84]] as const) {
    const result = fly(courses[2], loadout, angle, power)
    assert.equal(result.state.phase, 'won'); assert.ok(result.state.time < 5)
  }
  const shutter = fly(courses[2], 'blue', -2, 68, 1.3)
  const continuous = fly(courses[2], 'blue', -2, 68)
  assert.equal(shutter.state.phase, 'won'); assert.ok(shutter.state.time < 4)
  assert.equal(continuous.state.phase, 'ended')
  assert.ok(shutter.points.every(point => point.y > BALL_RADIUS + 1 && point.y < WORLD.height - BALL_RADIUS - 1))
})

test('Wooden baffles block straight empty-cargo shortcuts while leaving intentional bank shots', () => {
  for (const [index, low, high] of [[1, 4, 10], [2, -20, -14]] as const) {
    for (let angle = low; angle <= high; angle += .5) {
      for (let power = 45; power <= 75; power += 2) {
        const result = fly(courses[index], 'neutral', angle, power)
        if (result.state.phase !== 'won') continue
        assert.ok(result.points.some((point, tick, points) => {
          if (tick === 0 || point.phase === 'won') return false
          const previous = points[tick - 1]
          return Math.hypot(point.vx - previous.vx, point.vy - previous.vy) > 15
        }), 'an empty-cargo success requires a visible rebound')
      }
    }
  }
  assert.equal(fly(courses[1], 'neutral', 31, 64).state.phase, 'won')
  assert.equal(fly(courses[2], 'neutral', -12, 85).state.phase, 'won')
})
