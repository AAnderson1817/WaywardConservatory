# Current revision — Ballast flight garden (2026-09-15)

Three-course spatial physics prototype replacing the directional campaign in the arcade. The earlier campaign evidence below is historical and does not validate this new interface.

- **63 model/save/design tests pass:** 47 retained regressions and 16 new flight tests. New checks cover radial force direction, mixed responses, smooth field rims, bounded speed, deterministic stepping, shutter momentum and release, collisions, gentle capture, finite flight recovery, real previews, alternate complete solutions, and the empty-cargo baffles.
- **Production build passes:** TypeScript plus Vite. JavaScript 76.18 kB / 25.64 kB gzip; CSS 84.05 kB / 19.77 kB gzip. Painted assets reused locally; no dependencies added.
- **21 flight browser checks pass** on the development build. Drag/keyboard launch, native slider input, keyboard/pointer shutter, retry trail/settings, held-input reset, pause/resume, first-use visual lessons, early Ironroot introduction, course prerequisites, persistent completion/mode, blocked storage, and Adjacent travel/undo are covered.
- **9 course/layout combinations** checked across 1280×720, 652×698, and 390×844. Desktop and narrow app view fit vertically; phone controls have no horizontal clipping. Wide courses retain their proportions and letterbox in portrait view. Tutorial cards and controls fit 1280×720, 652×698, 390×844, and 740×390.
- **All three Ballast courses complete in production** through visible controls, with fresh tutorials, next-course progression, receiver result, and saved stamp/lessons/mode after reload. The production inspector is absent. No console, runtime, or asset errors.
- **All three approved Adjacent puzzles complete in production**, including persisted restoration. No changes to Adjacent gameplay.

The final visual pass aligned the core art to its collider, corrected tutorial paths to avoid solid bodies, synchronized shutter feedback after retry, and clipped field effects to the playable arena. Existing art is painted raster with precise vector overlays for readable physics.

Model fixtures establish at least three approaches per course. Confluence also has a Blue -2°/68 shutter shot: shield at 1.3 s to reach the receiver in 3.392 s; the same unshielded shot fails. Numerical scans over 151 angles × 76 powers found no zero-bounce Empty win on Cushion or Confluence; this is sampled evidence, not an exhaustive continuous-control proof.

Evidence stays local under ignored artifacts/: ballast-flight-browser-report.json, ballast-flight-production-report.json, production-report.json, and ballast-flight-*.png. Reproduce with the commands in README.md. Browser checks used installed Edge headless; focus-loss recovery exercises the actual blur handler with a synthetic event. Native touch hardware, Safari, Firefox, and a manual screen-reader session were not tested. User playtesting is still required to judge feel, difficulty, and the preferred mode.

---

# Illustrated teaching revision — 2026-09-15

The user approved a professional art and tutorial revision for the arcade, Ballast, and Adjacent. The complete twelve-level campaign and all three Adjacent puzzles remain playable. Future games remain locked.

## Presentation and teaching

- Five illustrated arcade covers; six painted Adjacent rooms; a movable fieldkeeper portrait and seedcase; textured Ballast machinery, translucent minerals, brass core and docks. Raster artwork is versioned locally and loaded without external requests.
- Thirteen replayable visual lessons: nine Ballast interactions and four Adjacent interactions. First encounters highlight their actual object/control, explain one rule, and show an example. Only unmet lessons appear when changing levels, including an out-of-order jump to level 12.
- Ballast teaches loading, capture/receivers, combined pulls, release and drift, relays/gates, planning previews, prerequisite order, limited stock, and recovery. Adjacent teaches temperature travel, thermostats, coupled targets, and the return journey; dial teaching waits until a dial is encountered.
- The question-mark button opens the illustrated field guide. Ballast docks, machinery, relays, and gates expose hover/focus descriptions; Enter or a click opens the relevant demonstration.
- Flight, loose minerals, and relay progression stop while reading. Closing the guide resumes without accumulated time. A focus-loss event while reading keeps the game paused until explicit resume. Native modal isolation is complemented by a Tab loop.
- Closing, skipping, or acknowledging introductions records them in a separate tutorial key. History is merged across both games; earned game progress uses the existing save format. Reduced motion shows static before/after states with an explicit button.

## Verified in this revision

| Check | Result |
| --- | --- |
| Model/save/design tests | 47 passed; puzzle definitions and physics unchanged |
| First-encounter tutorial suite | 12 scenarios passed |
| Ballast campaign | All 12 levels; 43 launches and 37 releases through actual controls; progress persists |
| Ballast layouts | 48 level/viewport combinations; no clipped or overlapping labels |
| Adjacent interaction regression | 21 checks and 45 layout observations passed |
| Adjacent motion regression | 8 animation lifecycle checks passed |
| Adjacent production | All three puzzles completed; development inspector absent |
| Ballast recovery | Four cargo/history scenarios and four collision/storage scenarios passed |
| Production build | TypeScript and Vite passed |

Final tutorial checks include actual keyboard/pointer input, focus containment, independent history persistence, all nine Ballast lessons at 652×698, guide cards at 1280×720, 652×698, 390×844, and 740×390, and static reduced-motion examples. The focus-loss handler case dispatches a blur event; the Adjacent regression separately uses real Tab navigation into browser chrome.

Visual review used captured hub, tutorial, room, chamber, and campaign screenshots. Room/cover crops preserve the painted proportions. Core collision boundaries stay separate from the artwork, gates retract within their actual collider, and stock remains labeled by mineral direction. Current evidence is generated under ignored `artifacts/`; it is not source-controlled. All image prompts and integration details are in [ART_DIRECTION.md](ART_DIRECTION.md).

Artwork payload is 2.59 MB total, 83% smaller than the original PNG outputs, with transparency retained. The final JavaScript build is approximately 31 KB gzip. There are no new runtime dependencies.

Review remains a human playtest of clarity and pacing. Automated route completion does not establish that first-time players understand a mechanic. Browser verification is Edge/Chromium on Windows; full gameplay layout targets the existing laptop/narrow-window sizes. Short windows keep guide controls reachable but may require scrolling the game. This revision does not change Adjacent’s deferred dead-end design, and it does not publish a public site.

---

> Recovery note (2026-09-15): source and tests have been recovered; prior screenshots and JSON reports were missing. The records below describe earlier verified runs. See RECOVERY.md for current verification.

# Current Ballast campaign — twelve levels

The user rejected the previous fourth chamber because its alternate refit route reduced complexity, then requested twelve levels of increasing complexity. This revision replaces that fourth chamber and extends Ballast to twelve. It stays within milestone 2.

## Authored progression and verified solutions

| Level | Title | Flights / releases | Added planning demand |
| --- | --- | --- | --- |
| 1 | Follow the pull | 2 / 0 | Refit to change direction. |
| 2 | Two pulls, one path | 2 / 0 | Combine two forces to reach a diagonal dock. |
| 3 | Leave something behind | 1 / 1 | Split the core and Skyglass into useful trajectories. |
| 4 | Two deliveries | 2 / 2 | Power two gates on separate legs; no easy refit bypass. |
| 5 | Round the roots | 3 / 3 | Plan a third directional release around the circuit. |
| 6 | Keep your lift | 3 / 3 | Three ordered relays; carry Skyglass through a Sunstone-only refit. |
| 7 | The long relay | 4 / 4 | Four ordered relays on a new route, retaining a required Sunstone carry. |
| 8 | Carry the current | 4 / 4 | Two successive refits depend on carried minerals. |
| 9 | Keep the other half | 4 / 4 | Three successive supply/carry constraints. |
| 10 | One more passenger | 5 / 4 | Four supply constraints and a final combined launch. |
| 11 | The long way home | 6 / 5 | Five carry constraints plus a release needed purely for navigation. |
| 12 | Bring it back | 7 / 7 | Deliberate mineral exchange, return through Launch with unavailable Sunstone, and a required curved final approach. |

The production browser completed all twelve, using **43 launches and 37 releases** through actual controls. Each release was selected in planning pause and explicitly committed. The run took 214.64 seconds within the measured level playthroughs, including automated loading and pauses; this is not a human difficulty or pacing measurement. Completion persisted after reload and earned the new twelve-level stamp. Existing Adjacent completion remained intact.

Numerical routes are reproducible in `tests/ballast-foundation-routes.ts` and `tests/ballast-advanced-routes.ts`; tutorial routes are in `tests/ballast.test.ts`. The full browser evidence is `artifacts/ballast-campaign-all-report.json`. In-game hints reference visible relay letters and landmarks, never internal coordinates.

## Rule and design verification

**47 model/save/design tests pass.** These include the eight existing Adjacent/shared checks, twelve introductory Ballast checks, eleven campaign-engine checks, five independent campaign audits, two save-migration checks, four middle-campaign checks, and five advanced checks.

- Every authored release is consequential to its route: omitting it or releasing the other socket prevents that route from completing. A finite search of legal refits and uninterrupted launches finds no no-ejection solution to levels 4–12.
- Matching material is required for each relay. A locked relay catches a piece without powering; it does not activate later automatically. Eligibility uses the state at the start of the simulation step, avoiding switch-array ordering effects. Gates independently require their printed relay letters. The receiver requires the authored relay set.
- Restricted docks validate loading through both pointer and keyboard actions. Carried minerals remain loaded even when absent from the dock's stock. Dock capture fields and dependency graphs pass an independent consistency audit.
- All 16 middle-campaign release windows have contiguous successful samples spanning **0.70–1.18 seconds**, with the rest of the route held fixed. All 20 advanced release windows span **at least 0.75 seconds**; 291 successful variations were tested independently. These establish practical timing margins, not subjective difficulty.
- Reset refit restores the arriving cargo. Previous dock rewinds a successful leg, its relay state, and its prior arrival snapshot. Retries do not duplicate history. The finale's return to Launch is distinguished from the initial departure.
- Ballast edition 2 retains old level 1–3 completions and previously earned stamps. The replaced fourth level is uncompleted after migration. New progress accepts indices 0–11; all twelve are required for a newly earned stamp. Malformed values and invalid indices are rejected.

## Browser and visual verification

- Full production campaign: all 12 levels, 12 start-layout observations, every relay, 43 flights, 37 planned releases, completion/reload, and zero captured runtime/console/HTTP errors.
- Existing Ballast production regression: 14 scenarios and 12 layout observations. Planning revision regression: 12 scenarios and 10 layouts. These cover pause, immutable previews, commit/cancel, hints, focus containment, reduced motion, legacy progress, and recovery.
- New cargo recovery: four production scenarios, including discarded unavailable cargo, failed-launch retry, successful arrival with the wrong mineral, rewind, and restart. Rechecked after the final presentation changes.
- Adjacent: 21 browser scenarios and 45 layout observations pass. Its production suite completes all three puzzles and checks restoration; no runtime/request errors. Its gameplay and animation code were not changed.
- Final campaign layout suite: all 48 level/viewport combinations pass with zero text overlaps, clipping, control overflow, or captured errors. Gate-adjacent dock labels and roof prerequisites were repositioned after visual review; the suite now asserts that SVG labels do not overlap.
- Final build: TypeScript and Vite pass. JavaScript **85.16 KB / 27.49 KB gzip**; CSS **52.14 KB / 12.66 KB gzip**. No new dependency or external service.

Twelve numbered level buttons keep the title/controls compact. Relays use mineral arrows, lettered gates, visible prerequisites, and connecting wires. Dock arrows show available stock. Narrow relay/dependency text was enlarged after visual inspection, and gate badges size to fit all their required letters. Final layout checks cover every level at 1280×720, 1366×768, 1920×1080, and 652×698; the layout report records the measured results. Full gameplay layout requires a 620px-high window; a 375px-high window keeps the planning controls accessible but cannot show the full board unobscured.

Screenshots include `artifacts/ballast-campaign-level-4.png`, `artifacts/ballast-campaign-level-6.png`, `artifacts/ballast-campaign-level-9.png`, and `artifacts/ballast-campaign-level-12.png`; the final layout review produces additional screenshots. Final build labels are larger than the initial campaign-playthrough captures.

Limitations: Edge/Chromium on Windows only. There has been no independent human playtest; increasing dependency counts and negative-solution checks support the intended ramp but do not prove every player will experience strictly increasing difficulty. Touch, Firefox/Safari, screen-reader operation, and sound quality by ear remain untested. Current flight/checkpoint state is not persisted across reloads. The arcade remains local; no deployment or work on the next game occurred.

---

# Historical record — preceding four-level revision

Everything below describes earlier deliveries, including the now-replaced optional fourth chamber. Earlier counts, bundle sizes, controls, and stamp requirements are historical.
# Ballast revision — planning, feedback, and route choice

The user authorized the revision after reviewing the proposed improvements. Ballast remains milestone 2, awaiting review. The original three chambers retain their physics and layouts. A fourth, optional chamber adds two viable approaches; the next arcade game has not been started.

## Current behavior

- Escape pauses in a compact control-panel dialog while the board stays visible. A / B or Q / E compares two seconds of capsule and released-mineral motion. Solid ivory shows the core; a dashed mineral-colored line shows the loose piece. Selecting a preview never changes live state. Release & resume commits; Resume or Escape continues unchanged.
- Gold pull arrows now scale with force magnitude. Pale dashed drift arrows have a separate origin, so aligned vectors remain distinguishable. Ejection changes force immediately; existing momentum decays through the same physics.
- Z retries the current leg at its launch dock with the saved loadout. R restarts the chamber. Failure keeps the recent flight path and marks actual collision contact, with distinct obstacle/frame/gate/no-pull feedback. No-pull failure has no impact marker. Planning and failure panels preserve the board and keyboard focus.
- Three-stage hints reveal a question, closer clue, and explicit route. The revealed level is retained per chamber throughout a Ballast visit, including retry, restart, and switching chambers; exiting or reloading clears it.
- Dock capture, ejection, and switch activation have brief visual responses. The switch wire carries a power pulse to the gate. Reduced motion retains essential previews and static failure diagnostics; enabling it cancels active decorative effects.
- Fourth chamber: **Choose a route**. The dock route uses Skyglass north, Mossjade west, then Ironroot south: 696 model steps / 11.60 seconds. The direct route uses Skyglass + Mossjade, releasing Skyglass near x720: 376 steps / 6.27 seconds. There is no marked release bay. Both routes were completed through actual browser controls.
- The direct release succeeds at all 19 samples x670–760, every 5 world units: a measured 1.10-second interval. None of the 25 uninterrupted loadouts wins directly. Model flight times exclude planning, loading, retries, and pauses.
- First-three completion still earns the stamp. Old stamps remain earned; the fourth completion is saved separately. Out-of-order completion cannot falsely restore the hub. Arcade text remains limited to its title, the five titles, and their descriptions.

## Current verification

- **22 model/save tests passed:** 14 Ballast and 8 Adjacent/shared tests. Both fourth routes, release-window tolerance, same-physics preview agreement, preview immutability, collision reasons, checkpoint behavior, and migration are covered.
- **Production build passed:** TypeScript plus Vite. JavaScript 68.43 KB / 23.18 KB gzip; CSS 50.30 KB / 12.26 KB gzip. No added dependencies.
- The existing Ballast production suite passed 14 scenarios and 12 layout observations. The targeted revision suite covers planning, both optional routes, staged hints, retries, legacy stamps, out-of-order completion, reduced motion, and focus containment. Final run counts are in `artifacts/ballast-revision-production-report.json`.
- Ballast's production recovery suite passed all four checks: R in flight, R after failure, third-chamber result state, and blocked storage.
- Adjacent's regression suite passed 21 scenarios and 45 layout observations. Its production suite completed all three puzzles and verified restoration, with no runtime/request errors. The prior motion-specific checks remain historical; Adjacent's animation code did not change.
- The complete layout is checked at 1280×720, 1366×768, 1920×1080, and 652×698. Planning and failure panels stay over the controls and leave the board unobscured. The game retains its 620px minimum layout height; contextual controls are clamped into shorter windows for recovery.

Visually reviewed the desktop planning board, narrow planning and failure states, and the fourth chamber in the user's 652×698 preview. The board legend has its own space below the SVG. Screenshots include `artifacts/ballast-revision-planning-652.png`, `artifacts/ballast-revision-failure-652.png`, and `artifacts/ballast-revision-fourth-complete-1280.png`.

Evidence: `tests/ballast-revision.mjs`, `tests/ballast-browser.mjs`, `tests/ballast.test.ts`, and their JSON reports in `artifacts/`. Development runs interrupted by editing/HMR were discarded and rerun against the stable revision; use each report's passed field. No browser errors were observed in the completed runs.

Limits: Edge/Chromium on Windows only. Human difficulty and pacing still need review; automation does not establish the brief's 3–5 minute target. Touch, Firefox/Safari, and a screen reader have not been tested. Audio behavior is exercised, but sound quality has not been assessed by ear. The release preview stops after at most two seconds or when the capsule stops; it is a local forecast. In-progress checkpoints and hints are not saved across reloads.

---

# Historical record — initial Ballast delivery

The following record describes the preceding three-chamber version. Its earlier counts, bundle sizes, and full-route hints are historical.
# Playtest record — milestone 2, Ballast

Ballast was implemented after the user explicitly accepted Adjacent and requested proceeding. Verified on Windows using Node 24.19.0, Microsoft Edge, and Playwright 1.62.1. All browser solutions use real player controls; production exposes no state inspector. No external human playtester participated.

## Delivered behavior

Three authored chambers teach a single wall pull with a refit, combined north/east acceleration, and purposeful release of Skyglass to a ceiling switch. Four named minerals occupy two selectable sockets. Refitting happens only at docks; ejection removes one force without applying a thruster impulse. Released pieces retain velocity and their own directional pull. The matching mineral latches the switch, which opens the receiver gate. The capsule cannot activate it.

Physics advances at a fixed 1/60-second step with acceleration 170, drag 1.9, and speed capped at 140 world units/second. Rendering and window size do not determine collision geometry. Magnetic dock fields catch the core and zero velocity. A collision or a no-pull stall offers retry from the last launch dock with its original loadout. Restart resets the chamber. Pause and focus loss freeze both the capsule and loose pieces without catching up elapsed time on resume.

The simple arcade now launches Adjacent and Ballast. Three future games remain locked. Ballast completion has its own save field, validated separately from the existing Adjacent completions. Older saves retain settings and stamps. Completing Ballast illuminates its hub core/conduits and adds planters. No new dependency, public service, or deployment was added.

## Verification

| Check | Observed result | Evidence |
| --- | --- | --- |
| `pnpm test` | 18 tests pass: 10 Ballast/compatibility tests and the 8 existing Adjacent/save tests. | `tests/ballast.test.ts`, `tests/model.test.ts` |
| `pnpm build` | Type checking and production build pass. | JavaScript 58.64 KB / 20.45 KB gzip; CSS 47.32 KB / 11.63 KB gzip. |
| `pnpm test:ballast` | 14 scenarios and 12 layout observations pass against development. | `artifacts/ballast-browser-report.json` |
| `WAYWARD_URL=http://127.0.0.1:4173 pnpm test:ballast` | The same 14 scenarios and 12 layouts pass against production, with no development inspector. | `artifacts/ballast-production-report.json`; PowerShell syntax is in `README.md`. |
| `pnpm test:ballast-recovery` | 4 focused checks pass on the final production build: R during flight, R after failure, third-chamber result, blocked storage. | `artifacts/ballast-recovery-report.json` |
| Adjacent regression | 21 browser checks, 45 layout observations, 8 motion checks, and all three production playthroughs pass. | `artifacts/browser-report.json`, `artifacts/motion-report.json`, `artifacts/production-report.json` |

The final small copy refinement made the delivered/interrupted background state explicit. The targeted recovery run rechecked the final third-chamber production route and its settled result afterward.

## Verified solutions

Model times below count flight steps, excluding loading, pauses, failure attempts, and thought. They are not human playtest durations.

1. **Follow the pull — 603 steps / 10.05 seconds of flight.** Load Sunstone in socket A and leave B empty. Launch east to Refit. Replace Sunstone with Skyglass, then launch north to the receiver. Browser completion used pointer controls and also deliberately failed the second leg to verify checkpoint retry.
2. **Two pulls, one path — 453 steps / 7.55 seconds.** Load Skyglass in A and Sunstone in B. Launch northeast to the high Refit dock. Replace A with Sunstone and empty B; launch east to the receiver. Browser completion used keyboard input only, including socket selection, mineral loading, Tab/Enter, emptying a socket, and Space to launch.
3. **Leave something behind — 424 steps / 7.07 seconds for a release near x=350.** Load Skyglass in A and Sunstone in B. Launch northeast. Eject A in the marked bay; the released Skyglass rises to its switch, while the core's northward drift decays and Sunstone continues pulling east. The gate opens before the core reaches it, and the receiver catches the core. Browser completion used the visible release-bay cue at 652×698, with a pause while the released mineral was still moving.

The marked release interval x=300 through x=410 was sampled every 5 units: **23 successful solutions**, spanning about **1.23 seconds** at cruise speed. Each single-mineral loadout fails to reach chamber 2's refit dock. Leaving both minerals loaded fails in chamber 3. These checks establish useful load/ejection decisions and a non-frame-perfect successful interval; they do not establish first-time player difficulty.

## Rule and interaction coverage

- All 25 pairs drawn from four minerals plus an empty socket obey force addition and capped speed. Empty and cancelling loads cannot launch. Loading in flight is rejected.
- Ejection changes exactly one slot, preserves capsule velocity, and gives the loose mineral the release velocity. The core retains inertia while the removed component gradually decays. Empty sockets cannot be ejected twice.
- The capsule and the wrong mineral cannot activate the Skyglass switch. A closed gate blocks the capsule. Collision checks include body radius and hazard corners.
- Forecast and actual uninterrupted flight agree; repeated fixed-step simulations give identical states, and forecasting leaves the source state untouched.
- Magnetic docking stops velocity and permits refitting. Failed second legs restore their own dock/loadout. R restarts during flight and after collision. No-pull stalls produce a retry.
- Pause blocks controls and freezes capsule, pieces, and gate state; resume preserves the trajectory. Actual Tab navigation from the final page control into browser chrome triggers focus-loss pause.
- Shared mute/reduced-motion settings survive reload. Reduced motion removes trails while retaining movement necessary for gameplay. Leaving an active flight disposes its simulation; re-entry creates one fresh chamber.
- Help, hints, modal focus containment, all result/next transitions, arcade return, stored completion, independent stamps, and replay entry work. Blocked storage shows the shared warning and still permits launching.
- Final development and production runs report no runtime, console, or HTTP errors.

## Layout and visual review

The Ballast interface fits **1280×720, 1366×768, 1920×1080, and 652×698** without document scrolling or clipped controls. The SVG world keeps its aspect ratio; the narrow layout moves the socket/loading panel below it. Help, hint, collision result, refit dock, loaded third chamber, and each success result were checked. Visually inspected the desktop/narrow dock interface, in-flight release, powered switch/open gate, settled result, and restored arcade.

Current screenshots:

- `artifacts/ballast-dock-1280.png`, `artifacts/ballast-dock-652.png`
- `artifacts/ballast-help-652.png`, `artifacts/ballast-release-plan-652.png`
- `artifacts/ballast-ejection-652.png`, `artifacts/ballast-gate-open-652.png`
- `artifacts/ballast-result-settled-652.png`, `artifacts/ballast-restored-hub-652.png`

## Limits and next review

- Human review is needed for discovery, loadout clarity, release timing, and the brief's 3–5 minute target. Automated route duration is substantially shorter and excludes thinking and retries.
- Browser tests cover Edge/Chromium on Windows. Touch, Firefox, Safari, and screen-reader play were not verified. Full game state is not conveyed through audio alone.
- Completion and settings save per browser origin. An in-progress launch/checkpoint is not saved across reload. Development and production ports have separate saves.
- Sound calls and mute paths were exercised without errors; subjective sound quality was not assessed by ear.
- Adjacent's soft-lock feedback remains deferred; its approved rules were preserved. Ballast uses explicit failure/retry recovery. Borrowed Properties has not been started.

Milestone 2 is saved and awaiting review. Adjacent is approved. The following milestone-one record is retained as history; statements about four unavailable games and earlier bundle sizes describe that earlier build.

---

# Milestone 1 history — Adjacent UI and motion revision

Verified 2026-09-14 on Windows with Node 24.19.0, Microsoft Edge, and Playwright 1.62.1. This record separates model verification, browser input, and visual inspection. No external human playtester participated.

## Changes in this revision

- Added a fieldkeeper marker that travels along the selected connection in 420 ms, with a short trail and arrival ring. Its final position always matches the committed model state.
- Added target temperature washes, pulses from remote thermostats, and edge fades for opening/closing routes. The desktop instrument has an animated preview gauge, with a Mixed reading for differing target temperatures. Preview remains nonmutating.
- Added a seedcase pickup flight after the arrival begins, a carrying marker, a compact outward/pickup/return indicator, a pickup chime, and a restrained result entrance. The vault's case disappears on pickup and reappears on undo.
- Refined room frames, target/setting treatment, header icons, and concise action feedback. Preserved stable room/control nodes and keyboard focus.
- New actions cancel stale effects; restart, resize, and leaving the game clean them up. Pause/help freeze active effects; resume continues them. Reduced motion cancels animation and displays final states immediately. Completion effects may finish behind the result screen.
- Kept all puzzle definitions and the three hint stages from the previous revision. The user's concern about soft-locks is recorded for a later gameplay pass; this revision does not change that behavior.
- Preserved the user's simple arcade menu: only the arcade title, five game titles, and their one-sentence descriptions. Future games have lock icons and disabled launches.

## Reproducible checks

| Check | Observed result | Evidence |
| --- | --- | --- |
| `pnpm test` | 8 tests pass; 165 reachable core configurations examined across the puzzles: 9, 28, 128. | `tests/model.test.ts`, `tests/design-analysis.ts` |
| `pnpm build` | Type checking and production build pass without a large-chunk warning. | JavaScript 35.35 KB / 13.20 KB gzip; CSS 37.73 KB / 9.41 KB gzip. |
| `pnpm test:browser` | 21 checks and 45 layout observations pass. | `artifacts/browser-report.json`, including snapshots after each solution action. |
| `pnpm test:motion` | 8 animation lifecycle and feedback checks pass. | `artifacts/motion-report.json`; actual pointer/keyboard input and browser animation inspection. |
| `pnpm test:production` | All three challenges completed through visible controls; no development inspector exposed. | `artifacts/production-report.json` |
| Local preview | Production served and displayed in the in-app browser. | `http://127.0.0.1:4173/`; restart commands in `README.md`. |

## Complete solutions

These are shortest paths found by graph search and reproduced through actual browser controls. Each temperature setting includes choosing it and clicking Apply. Room numbers refer to the printed labels, independent of screen position.

**1 — A different kind of near / Mist orchid — 6 actions**

Reception → Moss Gallery (2) → Hot → Seed Vault (6), collect → Moss Gallery (2) → Warm → Reception (1), return.

**2 — A message through the walls / Glassfern — 10 actions**

Reception → Moss Gallery (2) → Cold → Boiler Room (3) → Hot → Seed Vault (6), collect → Boiler Room (3) → Cold → Moss Gallery (2) → Warm → Reception (1), return.

**3 — Before you leave / Dawnseed — 16 actions**

Reception → Relay Loft (5) → Warm → Boiler Room (3) → Warm → Glasshouse (4) → Cold → Relay Loft (5) → Cold → Moss Gallery (2) → Hot → Seed Vault (6), collect → Moss Gallery (2) → Cold → Relay Loft (5) → Warm → Reception (1), return.

The third puzzle permits pickup in 3 actions: gallery, Hot, vault. From that resulting configuration, no forward-only solution exists. Two undos reverse pickup and the temperature change, restoring a position from which preparation is possible. The earliest pickup from which forward return remains possible takes 11 actions. Of its 128 reachable core configurations, 80 admit forward completion and 48 require undo/restart. Undo is always available from a played route.

All four instruments are necessary in the third puzzle. Both settings at the initial Relay Loft visit change immediate travel options. These checks establish a planning dependency and consequences for a choice, rather than relying on a longer shortest path as evidence of difficulty. They do not establish how hard a person will find the puzzle.

For every puzzle, a temperature operation after pickup is necessary. Exhaustive checks confirm travel always follows equal temperatures, controls affect only their declared targets, and transitions do not mutate input states. Undo restores every intermediate solution snapshot, including pickup and completion.

## Browser interaction coverage

- Motion checks confirm immediate state commits while the marker travels, freezing/resuming an active animation, nonmutating gauge previews, temperature effects, pickup and undo during the pickup flight, rapid alternating travel, restart during travel, reduced motion during an effect, resize during travel, narrow pickup, cleanup on return to the hub, and correct remote target propagation. No extra input lock or animation queue is introduced.
- Completed puzzle 1 with pointer input at 1280×720; puzzle 2 through keyboard input at that size, including Tab/Shift+Tab, Enter, and room-number shortcuts; puzzle 3 with pointer input at 652×698. Production independently completed all three at 1280×720.
- Confirmed invalid travel does not change state. Preview does not mutate temperatures; applying it produces the predicted destinations.
- Confirmed room, setting, and Apply DOM nodes survive relevant actions and focus returns to the selected setting.
- Took the third puzzle's tempting early pickup, reversed pickup and the dial operation with actual undo shortcuts, and recovered access to Reception and preparation.
- Confirmed the first hint does not expose the full route, the second explicitly offers it, and the third displays it. Closing/reopening retains the revealed stage; restart resets to the question.
- Verified undo from every result, further temperature undo, and clean restart. Vault entry collects the case without declaring victory; Reception with the case wins.
- Pause blocks room and restart shortcuts. Resume preserves state. Actual Tab navigation from the final control into browser chrome triggers focus-loss pause; no synthetic blur event was used.
- Checked help, modal keyboard focus containment, settings, return to the arcade, and replay. Reduced motion toggles the CSS override; paused dialogs suspend scenery and connection animation.
- Completion and settings survive reload; replay does not duplicate stamps. Existing user completions are preserved across the new puzzle revision.
- Malformed storage falls back to defaults. Blocked storage leaves play available and displays a save warning.
- No browser runtime, console, or HTTP errors occurred in the final development and production runs.

## Layout and visual review

Checked hub and multi-target preview layouts at 652×698, 1280×720, 1366×768, and 1920×1080. All fitted without document scrolling. Checked every solution action, all result screens, help at desktop and narrow sizes, pause, and the full third hint at the narrow size. Layout observations check offscreen controls/text, map/feedback overlap, and instrument-panel overflow.

Visually inspected rendered desktop and narrow boards, thermostat target previews, staged full-route hint, and the simple arcade. Retained current screenshots include:

- `artifacts/flow-travel-1280.png`, `artifacts/flow-temperature-1280.png`, `artifacts/flow-pickup-1280.png`, `artifacts/flow-remote-1280.png` — frames during the effects, not final resting positions
- `artifacts/flow-carrying-652.png` — settled fieldkeeper with the collected case
- `artifacts/hub-652.png`, `artifacts/hub-1280.png`, `artifacts/hub-1920.png`
- `artifacts/preview-1280.png`, `artifacts/game-remote-652.png`, `artifacts/game-remote-1366.png`
- `artifacts/hint-652.png`, `artifacts/help-652.png`, `artifacts/pause-1280.png`
- `artifacts/result-3.png`, `artifacts/production-restored-1280.png`

Temperature words and symbols accompany color; room numbers identify targets, and current position and connected rooms have visible markers. The four future games remain unavailable. The actual in-app production preview was opened, traveled to the gallery, and left with a Hot preview selected for review. Its compact board, controls, fieldkeeper, and preview were visually inspected.

## Limits and review focus

- The user disliked being soft-locked. The existing third-puzzle dead ends still require undo/restart; addressing them is deferred to a later gameplay revision at the user's direction.
- The desktop gauge is omitted in the narrow layout to keep the full board visible. The same setting buttons, target temperatures, route preview, and effects remain available there.
- The user's first playthrough is still needed to assess challenge, discoverability, and the 3–5 minute target. Automated execution times measure test speed, not human pacing. Review whether the third puzzle's preparation is inferable from its visible controls and whether undo feels constructive.
- Edge/Chromium on Windows was tested. Firefox, Safari, touch input, and screen-reader use were not tested. No-scroll checks cover the listed viewports; smaller phone sizes are not a delivery target.
- Completion/settings save per browser origin. Current puzzle position is not persisted. Ports 5173 and 4173 have separate saves; prior earned stamps remain earned when replaying the redesigned puzzle.
- Sound and mute paths ran without errors; sound quality and audibility were not assessed by ear.
- All runtime assets are local. There is no public deployment, account, remote API, or later-game implementation.

## Earlier revisions

The initial build passed 7 model tests, 17 browser checks, and three production playthroughs. Its third puzzle took 14 actions and primarily followed a chain of instruments. Earlier fixes addressed an unintended vault shortcut, board overlap, favicon errors, keyboard test navigation, and restored-hub state. A later menu revision passed 18 browser checks and replaced the verbose hub with the user's requested arcade format. The next revision introduced the current preparation puzzle, staged hints, persistent controls, and engine removal, reaching 10.82 KB gzip JavaScript. This motion revision adds browser-native effects without new dependencies. Current evidence and routes are above.

Milestone 1 is ready for review. No approval to proceed to Ballast has been recorded.
