# The Wayward Conservatory

A local browser arcade with two playable games: **Adjacent**, with three room puzzles, and **Ballast**, a three-course physics prototype. Three future games remain unavailable. The arcade keeps only its title, five game titles, and their one-sentence descriptions.

## Local development

The canonical checkout is `C:\Users\Derpd\Projects\WaywardConservatory`, outside OneDrive. Source control is [AAnderson1817/WaywardConservatory](https://github.com/AAnderson1817/WaywardConservatory). Use Node.js 24+ and pnpm; no runtime account, remote assets, or service is required.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Development defaults to **http://127.0.0.1:5173/**. To play the production build, run `pnpm build` then `pnpm preview`; preview defaults to **http://127.0.0.1:4173/**. Leave the local server running while playing. Current puzzle positions restart on reload; completion and preferences stay in this browser on this origin.

The desktop and narrow app layouts fit 1280×720 and 652×698. At phone width the controls remain reachable without horizontal scrolling. Very short windows can scroll. Visual lessons adapt to short landscape windows and reduced motion.

## Ballast: flight garden

Launch a core through spatial attraction and repulsion. Choose cargo, aim, set power, and reach the receiver slowly enough to settle. Fields depend on position and mineral composition. Walls and floating bodies bounce the core.

- **Drag back from the core, then release** to aim and launch. Alternatively adjust the **Angle** and **Power** sliders and press **Launch**. Arrow keys adjust a focused slider normally.
- **Skyglass** and **Ironroot** respond differently to each body. Inward arrows mean attraction; outward arrows mean repulsion. Labels update when cargo changes. **Both** averages the two responses; **Empty** ignores fields.
- With **Shutter control** enabled, hold **Space** while the board is focused, or hold the shutter button, to shield the minerals. Release to restore their response. The core retains momentum while shielded. Uncheck Shutter control before launching to compare a launch-and-watch shot.
- **R / Retry** immediately returns to the launch point, retaining angle, power, cargo, mode, and a faint trail of the previous attempt. There are no lives or retry penalties. Stopped shots end automatically; trapped flights end after 22 seconds.
- **Escape / Pause** holds the complete simulation. Focus loss clears held input and pauses. Resume is explicit; time cannot accumulate during a pause or tutorial.
- **?** replays five illustrated lessons. New interactions are introduced on first use, including changing cargo before reaching the later courses. The sound and reduced-motion preferences are shared with Adjacent.

Three courses test distinct ideas: **Crescent** has two attraction arcs around a body, **Cushion** introduces repulsion and braking, and **Confluence** combines two opposing fields. Small wooden baffles prevent straightforward empty-cargo deliveries in the latter courses. Multiple colored shots and bank shots remain possible. A short preview shows the beginning of the actual trajectory; the gold arrow attached to a moving core shows the current field force.

Complete all three courses to restore Ballast's arcade card. Flight progress uses `wayward-ballast-flight-v1`, separate from the previous directional campaign and Adjacent. Lessons use `wayward-flight-lessons-v1`. Reloading retains completions and mode, but begins a fresh course attempt.

The old twelve-level directional campaign is retained in source for reference and recovery, but is no longer mounted in the arcade. Its model tests and prior playtest evidence are historical; the new prototype has its own physics and browser tests. Existing campaign saves are preserved without awarding flight-garden completions.

## Adjacent controls

- Click a connected room or press **1–6**. Matching temperatures connect rooms.
- Operate the current room's dial, preview a temperature, then select **Apply**. Linked dials change every marked target.
- Collect the seedcase in the vault and bring it back to Reception.
- **Z** undoes an action, including collection or delivery. **R** restarts. **Escape** pauses/resumes. Focus loss pauses the game.
- **Hint** offers a question, a closer clue, then a requested solution. **?** opens replayable visual lessons. Sound and motion icons are in the header.

The approved three puzzles, travel animations, dial effects, and undo remain intact. The third puzzle can still require undo after an unprepared departure; that design decision remains deferred.

## Verification

```sh
pnpm test
pnpm build
# With pnpm dev running on 5173:
pnpm test:flight-browser
pnpm test:browser
pnpm test:motion
# With pnpm preview running on 4173:
pnpm test:flight-production
pnpm test:production
```

Browser scripts use installed Microsoft Edge through Playwright. Set `WAYWARD_BROWSER=chrome` for installed Chrome. `WAYWARD_URL` overrides the server URL. Reports and screenshots go to ignored `artifacts/`. No new dependencies were added.

`pnpm test` runs Adjacent, historical campaign, save, and current flight model tests. `pnpm test:flight` runs only the current physics tests. Scripts prefixed `test:legacy-` require the previous campaign interface; they are retained for historical revisions and do not validate the new flight interface.

## Structure

- `src/games/ballast/flight-model.ts`: pure spatial forces, three courses, fixed-step physics, collision, capture, preview.
- `src/games/ballast/flight-screen.ts`, `flight.css`: aiming, shutter input, trails, tutorial diagrams, responsive UI, progress, simulation lifecycle.
- `src/games/adjacent/`: approved puzzle model, views, and effects.
- `src/games/ballast/model.ts`, `levels-*.ts`, `screen.ts`, `style.css`: previous campaign reference.
- `src/shared/`: painted atlas helpers, Adjacent field guide, scenery, shared save settings, audio.
- `tests/ballast-flight*`: current physics, browser interaction, and production completion checks.

The development-only `window.__WAYWARD__.inspect()` returns a copy of the current state. For Ballast it includes course, position, velocity, time, phase, shutter, aim, loadout, mode, attempts, and pause/guide state. It is absent from production.

Painted local assets and their original generation prompts are documented in [ART_DIRECTION.md](ART_DIRECTION.md). This prototype reuses that art. See [BALLAST_FLIGHT.md](BALLAST_FLIGHT.md) for design and playtest questions, [PLAYTESTS.md](PLAYTESTS.md) for evidence, and [STATUS.md](STATUS.md) for scope. No public deployment is included; later games still require explicit approval.
