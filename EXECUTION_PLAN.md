# The Wayward Conservatory — brief review and execution plan

Prepared: 2026-09-14. This is the original planning record. The user subsequently requested proceeding; consult `STATUS.md` for the current implementation and review state.

Milestone 2 note: the user accepted Adjacent and explicitly requested Ballast. Ballast now has twelve authored levels with cumulative release sequences, relay prerequisites, restricted refits, and carried-mineral decisions. It retains deterministic motion, two load sockets, four wall-directed minerals, planning previews, and recovery at both the current and previous dock. It reuses the arcade's settings and completion conventions. Current scope and verification are in `STATUS.md` and `PLAYTESTS.md`; the original milestone-one plan below remains historical.

Revision note: later feedback replaced the proposed verbose hub with five simple arcade choices and authorized a stronger Adjacent revision. The current implementation uses persistent HTML/SVG room controls and CSS scenery; Phaser was removed because it contributed only decoration. Puzzle three now requires preparation before pickup, and hints reveal progressively. The original proposals below remain historical; `README.md` and `PLAYTESTS.md` describe the delivered revision.

Source: `GOAL.md`.

The user request at the time of planning was to review the brief and create an execution plan. The source document's instruction to begin building was treated as part of the brief, not authorization to implement during that planning task. The later request to proceed authorized milestone 1, subject to the brief's review gate.

## Review findings

The brief provides a coherent setting, distinct central mechanics, explicit boundaries, and useful acceptance criteria. Its fixed review gates make the larger five-game project manageable. The first delivery is substantial: a polished shared hub, three complete Adjacent puzzles, settings and persistence, and recorded rule and browser verification.

The main issues to resolve through design and testing are:

| Issue | Planned resolution |
| --- | --- |
| Equal-temperature travel could make puzzles trivial: if reception and the vault match, the player can travel directly. | Author thermostat access and target relationships first, then search the state graph for unintended shortcuts before polishing the layouts. |
| Return-route planning is underspecified. Undirected travel and reversible thermostats can allow retracing the outward solution. | Preserve those rules. Make later puzzles require temperature reconfiguration after pickup; accept retracing when valid. Do not add surprise locks, consumable controls, or parcel-triggered rule changes merely to force difficulty. |
| Thermostat operation is not fully specified. | Assume instruments are operated only from the player's current room. Each instrument has fixed, explicitly named target rooms and authored allowed settings. Display the affected rooms and connection changes before committing. |
| The 3–5 minute target could refer to each puzzle or the complete set. | Target approximately 3–5 minutes for a first playthrough of Adjacent's three-puzzle set. Treat timing as a playtest observation, not a mandatory timer or guaranteed duration for every player. |
| A detailed illustrated hub and six-room board compete with readable controls on laptops. | Design against a 1280×720 CSS-pixel viewport from the start; validate at 1366×768 and 1920×1080 too. Reserve space for labels and controls before adding scenery. |
| Shared thermal fiction spans games with different simulations. | Document that gatehouse instruments assign discrete chamber temperatures; later outdoor heat and organism effects belong to their own local systems. Preserve material names and meanings without building a universal simulation. |

These are proposed implementation defaults, not amendments already approved by the user. None prevents producing a concrete milestone-one build once implementation is requested.

## Verified workspace and tools

- The workspace contains an empty Git repository with no commits, source files, package manifest, or existing project records. No applicable `AGENTS.md` was found in the workspace or its ancestor directories.
- Node.js 24.19.0, Git, ripgrep, and PowerShell are available. The bundled pnpm executable was run successfully and reports 11.19.0; npm is not on the current PATH.
- The bundled Node package directory contains Playwright 1.62.1. Phaser, Vite, TypeScript, and `@playwright/test` were not found in that directory. This is not an exhaustive check of every package cache.
- Browser-control tools are exposed. No browser session, browser executable, app launch, dependency installation, or gameplay test has been verified during planning.
- Proposed stack: TypeScript, Phaser, and Vite, with semantic HTML/CSS for readable shared controls and navigation. Phaser documents bundled TypeScript definitions; Vite documents a vanilla TypeScript template and pnpm setup. References: [Phaser installation](https://docs.phaser.io/phaser/getting-started/installation), [Vite guide](https://vite.dev/guide/).

At implementation start, resolve and pin compatible package versions, save a lockfile, and verify a local development launch plus production build. If dependency retrieval or browser access fails, record the exact blocker and available fallback rather than treating the environment as ready.

## Fixed scope and approval sequence

| Milestone | Game | Work permitted in the initial build |
| --- | --- | --- |
| 1 | **01 — Adjacent / The Thermal Gatehouse** | Shared arcade shell and all three authored puzzles, fully integrated and tested. |
| 2 | **02 — Ballast / The Anchor Chamber** | Finished-looking unavailable station only. Gameplay follows explicit approval to proceed. |
| 3 | **04 — Borrowed Properties / The Transposition Workshop** | Finished-looking unavailable station only. Gameplay follows its preceding review gate. |
| 4 | **05 — Heat Shepherd / The Frost Migration** | Finished-looking unavailable station only. Gameplay follows its preceding review gate. |
| 5 | **06 — Pocket Biome / The Living Expedition Kit** | Finished-looking unavailable station only. Gameplay and complete-arcade verification follow its preceding review gate. |

Use `queued → in_progress → awaiting_review → approved`. Only actual user approval can produce `approved`. Feedback returns the current milestone to revision and another review gate. Games 03 and 07 remain outside scope. No public deployment is part of this plan.

## Execution sequence for milestone one

### 1. Establish project records and the visual language

Preserve the source brief in `GOAL.md`. Create `STATUS.md` with milestone 1 active and later milestones queued, `UNIVERSE.md` for the common visual vocabulary and world rules, and `PLAYTESTS.md` for observed results. Do not record tests or approvals before they occur.

Define a compact illustrated vocabulary: blue-green structure, ivory labels, brass instruments, glass specimen cases, botanical frames, a fieldkeeper emblem, temperature symbols, and restrained light accents. Use code-drawn shapes and local SVG/vector assets, with shared proportions and strokes. Establish matching gate, travel, thermostat, undo, and completion feedback sounds. Cooling moss, luminous fungi, driftwood, and glass can appear as scenery with consistent names.

Exit condition: the scope, state transitions, style tokens, and recurring objects are documented; the project launches locally with a reproducible build command.

### 2. Implement the Adjacent model and prove the puzzle structures

Represent each puzzle as data: six room IDs and display positions, initial temperatures, reception and vault IDs, thermostat locations, fixed targets, and allowed operations. Rendering coordinates never determine legal movement.

Use a pure transition function for travel, thermostat operations, pickup, and reset. Two distinct rooms connect exactly when their current temperatures match. Only controls available in the current room can operate. Recompute available destinations after every valid action; reject invalid actions without changing state or undo history.

Assume automatic seedcase collection on entering the vault, clearly announced in the UI. Success requires subsequently reaching reception with the case. Unlimited undo restores the entire puzzle state, including temperatures, location, parcel status, and any action counters. Undo must remain reachable when a puzzle result is displayed.

Author and validate this progression:

| Puzzle | Teaching intention | Acceptance target before visual polish |
| --- | --- | --- |
| 1 — Matching rooms | Demonstrate travel between physically distant rooms and introduce one clearly targeted instrument. | Short complete round trip; geography alone never provides movement. |
| 2 — Remote instruments | Operate controls in different rooms to alter access elsewhere. | Require meaningful use of at least two instrument locations and a temperature operation after pickup. |
| 3 — Planning the return | Prepare access to controls that will be needed to bring the case back. | Require several successive temperature configurations, close an existing route while opening another, and require reconfiguration after pickup. |

These are design targets; exact layouts and numerical action counts will be settled by solution search and input-based playtesting.

Build a small development/test graph search over the same production transition function. With six room positions, three temperatures per room, and a parcel flag, there are at most 8,748 core configurations per puzzle before UI bookkeeping. Find complete return solutions, inspect reachable dead ends, and search for solutions that bypass intended instrument use. Record explicit action sequences. Unlimited undo is the recovery mechanism for an unfavorable configuration; a hard fail screen is unnecessary for this game.

Exit condition: all three puzzles have verified complete solutions, later puzzles satisfy the reconfiguration targets, and the solver has exposed no unintended trivial completion route.

### 3. Build the conservatory hub and shared interface

Create a landscape conservatory cross-section with five distinct station silhouettes. Every station shows its preserved ID, title, one-sentence premise, and availability/completion label. The four unbuilt stations may be inspected but cannot start gameplay. Adjacent starts immediately from its station.

Use Phaser for illustrated scenes and modest animation, with a shared HTML/CSS interface for text, buttons, dialogs, and keyboard focus. Route pointer and keyboard actions through the same model commands so they cannot diverge. Keep the architecture small: app/hub, shared UI/input/audio/settings/save utilities, and `games/adjacent` model, puzzle data, and scene modules. Later game modules will be created at their own milestones.

Add consistent instructions, controls, pause, restart, return to hub, and results. Proposed controls are click/tap to select, Tab and Enter/Space for focus and activation, optional room-number shortcuts 1–6, Z for undo, R for restart, and Escape for pause. Confirm usability during testing and show the actual implemented bindings.

Save mute, reduced motion, and completion locally using a versioned record with safe defaults for missing or malformed data. A storage failure should leave the game playable and explain that progress cannot be saved. Keep development review status separate from the player's saved completion.

Exit condition: the hub is visually finished, all required navigation works by pointer and keyboard, and shared controls remain readable at the smallest target viewport.

### 4. Integrate Adjacent and finish its presentation

Render six rooms in a clear cutaway. Give each room a persistent name/number, temperature word and symbol, visible contents, and current-player indicator. Mark all legal destinations, and show why other rooms cannot currently be reached. Use connections from the current room and temperature group cues to avoid a tangle of decorative lines.

When inspecting a thermostat setting, identify its target rooms and preview before/after temperatures and routes. Display changes immediately after applying an operation. Effects and travel animations must remain short, with a reduced-motion alternative and consistent input handling during transitions.

Integrate the three challenges into one short assignment with progress, a clear result after each round trip, restart/undo access, and replay. Completing the set earns the Adjacent stamp once and visibly restores part of the gatehouse in the hub. Replays remain freely available and cannot duplicate rewards.

Pause suspends input and animation, and focus loss pauses the active game. Resuming is explicit. Returning to the hub must leave no stale input listeners or continuing audio.

Exit condition: a player can enter from the hub, learn the mechanic, complete every puzzle, receive the stamp, return to the restored hub, and replay.

### 5. Verify the actual experience and revise defects

Run both model checks and real browser interaction. A solver trace, successful build, or attractive screenshot alone is insufficient.

| Area | Required verification |
| --- | --- |
| Rules | Matching-temperature travel only; local instrument access; declared targets only; immediate graph updates; invalid inputs do not mutate state. |
| Objectives | Reproduce a complete solution for each puzzle using the player's actual controls; return the seedcase to reception; verify no early win at the vault. |
| Undo/restart | Undo travel, instrument changes, pickup, and completion; undo to the initial state; restart after different configurations; check result navigation. |
| Navigation | Hub entry, all three challenges, pause/resume, focus loss, restart, return to hub, and replay. Test keyboard-only and pointer use. |
| Persistence | Settings and stamps survive reload; replays do not duplicate restoration; missing, malformed, and unavailable storage fail gracefully. |
| Layout | Inspect hub, board, instructions, pause, and results at 1280×720, 1366×768, and 1920×1080; check clipping, scrolling, readable labels, focus visibility, and window resizing. |
| Feedback | Temperature is legible without color alone; targets and previews match actual outcomes; mute and reduced motion work throughout. |
| Runtime/build | Type checking, deterministic rule tests, production build, and browser console/network inspection; verify the built app as well as the development app. |

Expose development-only state inspection and action traces for diagnosis; the player controls remain the route used for browser completion tests. Use the bundled browser tooling only after verifying it launches successfully. Record genuine elapsed playtest times and qualitative difficulty observations, with the limitation that developer playthroughs do not establish first-time player timing.

Fix observed readability, discoverability, logic, and navigation defects, then rerun the affected checks. Keep the solutions, viewport evidence, test outcomes, and remaining limitations in `PLAYTESTS.md`.

Exit condition: all required scenarios pass with recorded evidence and no unresolved blocker to playing the complete assignment.

### 6. Save and stop at the review gate

Save all source, local assets, dependency versions, launch/build instructions, and test records. Update milestone 1 to `awaiting_review` only after the completion criteria are met. Leave later milestones `queued` and record the next permitted action as review or revision of milestone 1.

Deliver a verified local playable URL while the server is available, plus exact reproducible launch instructions, controls, completed scope, and important limitations. End that implementation delivery with: **“Stopped for review. The next game has not been started.”**

If a genuine blocker prevents the required standard, keep the milestone `in_progress`, distinguish completed work from unverified work, and identify the specific blocker. Do not move to Ballast.

## Dependencies and execution priority

The dependency order is environment and minimal app launch → deterministic puzzle model and verified structures → polished hub and shared controls → full game integration → browser validation and revision → saved review build. A basic board may be used while proving the puzzles; final presentation and browser verification are both required before delivery.

The greatest uncertainties are dependency/browser setup, puzzle quality, and visual iteration. Address setup first and prove the central mechanic early. Use the first completed assignment as the reference for later games, refining shared interfaces only when the active milestone needs them.
