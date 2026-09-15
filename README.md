# The Wayward Conservatory

Milestone 2: a local browser arcade with **01 — Adjacent** and **02 — Ballast**. Adjacent has three complete challenges; Ballast has a twelve-level campaign. Three future games remain unavailable. The project uses TypeScript, Vite, HTML/CSS/SVG, local vector artwork, and synthesized audio.

## Local development and source control

The canonical repository is [AAnderson1817/WaywardConservatory](https://github.com/AAnderson1817/WaywardConservatory). Keep checkouts in an ordinary local folder outside OneDrive and commit/push changes through GitHub.

Use Node.js 24 or newer and pnpm:

```sh
git clone https://github.com/AAnderson1817/WaywardConservatory.git
cd WaywardConservatory
pnpm install --frozen-lockfile
pnpm dev
```

For the production preview, run `pnpm build`, then `pnpm preview`. The default development URL is **http://127.0.0.1:5173/** and the preview URL is **http://127.0.0.1:4173/**. The terminal prints the actual port if the default is busy. Leave that terminal running while playing; Ctrl+C stops it.

The full review layout targets desktop and laptop browsers, including narrow windows, with a minimum viewport height of 620 pixels. In shorter windows the game can scroll; Ballast's planning and recovery panel is constrained to the visible viewport so its controls remain reachable.

## Reproduce elsewhere

Use Node.js 24 or newer and pnpm. All dependency versions are pinned in `package.json` and `pnpm-lock.yaml`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

No runtime account, remote asset, service, or server API is needed. Dependency installation requires registry access. Completion and settings are stored only in this browser on this origin. Reloading preserves completed challenges, but the current puzzle position restarts.

## Adjacent controls

- Click a connected room, or press **1–6**, using the room's printed number.
- **Tab / Shift+Tab**, then **Enter / Space** operate every button.
- In a room with a dial, choose a temperature to preview its targets and routes, then select **Apply**. Each room's numbered dial markers show its targets; solid lines show travel, dashed brass lines show control relationships.
- **Z**: unlimited undo, including the seedcase pickup and the final return. The results screen also has an undo button.
- **R**: restart the current puzzle. **Escape**: pause/resume. Focus loss pauses the active assignment.
- **Hint**: a question, a closer clue, then an explicitly requested complete route. Restart resets the hints. **?** in the header opens instructions; the adjacent icons control sound and motion.

Enter the vault to collect its case; return to Reception to finish. Complete all three puzzles to earn a stamp and restore the hub's gatehouse. Achievements remain earned if you undo a winning move or replay.

The fieldkeeper marker travels along each chosen connection. Thermostat changes send colored pulses to changed target rooms, and room edges brighten or fade as routes open and close. On pickup, the case leaves the vault, travels to the objective indicator, and appears beside the fieldkeeper. Undo reverses the visual change. Actions remain immediate during effects. The sound icon mutes audio; the wind icon switches to reduced motion with static state feedback. The desktop thermostat gauge previews the target temperature, including a Mixed state when its targets differ.

The first puzzle teaches the rule; the second introduces coupled controls; the revised third requires preparing the return before collecting the seedcase. An early departure can strand you. Undo restores the entire previous state, including pickup. Existing completion stamps are preserved across this revision; select the third challenge to replay its new layout.

## Ballast controls

- At a dock, select **socket A or B**, then choose a mineral. **Q / E** selects the socket and the **arrow keys** load the matching mineral. **Empty selected socket** removes one before launch. Arrows inside a dock show its limited stock; a dock without stock arrows supplies all four minerals. Carried minerals can stay loaded even when that dock cannot replace them.
- **Space** or **Launch** releases the capsule. Its minerals determine acceleration; arrows do not steer in flight.
- In flight, click a socket or press **Q / E** to eject its mineral. The loose mineral inherits velocity and continues responding to its own pull.
- **Escape** pauses the capsule and loose minerals while keeping the board visible; focus loss also pauses. During a flight pause, select **A / B** or press **Q / E** to compare the next two seconds after releasing that socket. The solid path belongs to the core; the dashed path belongs to the mineral. **Release & resume** commits the selected release. **Resume** or **Escape** cancels the preview and continues with the load unchanged.
- In flight or after a failure, **Z** or **Retry** restores the last launch and its starting loadout. At a dock, **Z / Reset refit** restores the cargo and relay state from your arrival, recovering a carried mineral you accidentally replaced or emptied.
- To undo a completed flight, open **Plan / Escape** while docked and choose **Previous dock**. This rewinds that leg, its cargo, loose minerals, and relay activations. It can recover a successful arrival with the wrong remaining mineral. After a failed flight, retry first to return to the dock. **R** restarts the entire chamber. Recovery spends no lives and removes no earned completion.
- **Hint** reveals a question, a closer clue, then the full route only when requested. Each chamber remembers its revealed hint level during the current Ballast visit, including retries, restarts, and switching chambers. Leaving Ballast or reloading resets the hints. **?** explains the controls and physics. Sound and reduced-motion preferences are shared with Adjacent.

**Skyglass ↑**, **Sunstone →**, **Ironroot ↓**, and **Mossjade ←** each pull toward one wall. Two loaded minerals add their forces. The gold arrow shows the direction and strength of the pull; the offset pale dashed arrow and Drift meter show velocity. After a release, force changes immediately while drift turns gradually. Speed is capped. The dotted dock preview shows the trajectory if you launch without ejecting.

Enter a dock's dashed magnetic field to stop and refit. Avoid solid machinery and closed gates. Relay switches carry a letter and a mineral arrow: **A ↑** accepts loose Skyglass, for example. **A → B** means A must already be powered before B accepts its mineral. A wrong mineral or a mineral arriving before its prerequisites is caught without powering the relay. The core cannot activate a relay. Gate letters identify the relays required to open that gate, and delivery requires every required relay to be powered. Activated relays remain lit throughout the run unless recovery rewinds their activation.

The campaign builds on earlier decisions:

- **1–3:** single pulls, combined pulls, then one released mineral powering a switch. Level 3 retains its marked teaching bay.
- **4–5:** two and then three required releases across connected flights.
- **6–8:** ordered relay circuits and carrying a needed mineral into a refit that cannot supply it; the later level requires this planning at two refits.
- **9–12:** longer supply chains, preserving cargo for later flights, and preparing a return through the starting dock in the finale.

A failed flight leaves its path visible; collisions also receive an impact marker. Feedback distinguishes an obstacle, the outer frame, a closed gate, or exhausted drift. Dock capture, ejection, and relay activation receive brief visual responses. Reduced motion removes decorative trails and transitions while retaining the essential movement, planning paths, and static failure trail.

New players earn Ballast's stamp and restore its hub machinery by completing all twelve levels. Saves from the previous edition retain completion of levels 1–3 and any stamp already earned. Completion of the former optional fourth level is discarded because that level has been replaced; the new fourth level begins uncompleted. Ballast's progress and stamp remain independent of Adjacent. Current cargo, dock history, and in-flight relay progress are not saved across reloads.

## Verification

```sh
pnpm test
pnpm build
pnpm dev
# In another terminal, with the development server running:
pnpm test:browser
pnpm test:motion
pnpm test:ballast
pnpm test:ballast-revision
# To test the built application:
pnpm preview
# In another terminal, with preview running on port 4173:
pnpm test:production
pnpm test:ballast-recovery
pnpm test:ballast-campaign
pnpm test:ballast-campaign-recovery
```

The campaign scripts default to the production preview on port 4173. To target another running local server in PowerShell:

```powershell
$env:WAYWARD_URL = 'http://127.0.0.1:5173'
pnpm test:ballast-campaign
pnpm test:ballast-campaign-recovery
Remove-Item Env:\WAYWARD_URL
```

Browser scripts use locally installed Microsoft Edge through Playwright. Set `WAYWARD_BROWSER=chrome` to use an installed Chrome channel. Set `WAYWARD_URL` if your server uses a different local URL. The model tests use Node's built-in test runner. Test screenshots and JSON reports are saved in `artifacts/`.

Adjacent uses CSS and the browser's Web Animations API for effects. Ballast uses a fixed 60 Hz deterministic simulation with SVG rendering; pause clears elapsed-time accumulation. Both launch and release previews use the same physics as play. The revision adds no dependencies. Current build sizes and observed test results are recorded in `PLAYTESTS.md`.

## Structure

- `src/games/adjacent/model.ts`: deterministic states, fixed dial targets, authored puzzles, history, and legal actions.
- `src/games/adjacent/view.ts`: persistent room nodes, thermostat previews, staged hints, and controls; `style.css` and `flow.css` contain the layout and visual treatment.
- `src/games/adjacent/effects.ts`: state-driven presentation with cancellation, pause/resume, resize cleanup, and reduced motion. Effects never change the puzzle model or lock input.
- `src/games/ballast/model.ts`: mineral forces, fixed-step motion, collisions, dock supplies, relay prerequisites, independent gates, forecasts, launch checkpoints, and dock recovery history.
- `src/games/ballast/levels-intro.ts`, `levels-foundation.ts`, and `levels-advanced.ts`: the twelve authored levels and staged hints.
- `src/games/ballast/screen.ts` and `style.css`: SVG chamber, socket controls, force and drift feedback, planning previews, failure diagnostics, results, and simulation lifecycle.
- `src/main.ts`: hub, shared interface, and input dispatch. Every input calls the same model.
- `src/shared/`: vector illustration vocabulary, CSS scenery, local save validation, and short feedback sounds.
- `tests/`: exhaustive reachable-state checks, complete solutions, and browser input playthroughs.
- `GOAL.md`, `UNIVERSE.md`, `STATUS.md`, `PLAYTESTS.md`: source brief, shared rules, review state, and observed verification.

In a development build, `window.__WAYWARD__.inspect()` returns a copy of the active game's state. Adjacent includes undo history and previews; Ballast includes its chamber, checkpoint, loose minerals, relay activations, gate state, and dialog. It cannot mutate either live game. The inspector is absent from production.

## Scope

Adjacent is approved; Ballast is awaiting review. Borrowed Properties, Heat Shepherd, and Pocket Biome have illustrated choices with lock icons and disabled launches. Their implementations require later review approvals. No public deployment is included.

The arcade menu displays only its title, the five game titles, and one-sentence descriptions. Click Adjacent or Ballast to play; Left/Right arrows or Tab move between choices. Sound and motion controls are available inside the games.

## Illustrated field guide

The question-mark control opens replayable visual lessons. New mechanics are introduced once, with a highlighted object and a short example; closing or skipping records the introduction. Ballast machinery, docks, relays, and gates can also be inspected by pointer or keyboard. The guide pauses the current puzzle. Reduced motion uses a button to compare static before/after examples.

Run `pnpm test:field-guide` against the production preview to verify fresh teaching, game isolation, focus, independent history, out-of-order levels, and compact layouts. Older gameplay suites initialize experienced-player tutorial history; the dedicated suite tests fresh onboarding.

Art assets and the exact built-in ImageGen prompts are documented in [ART_DIRECTION.md](ART_DIRECTION.md). Current verification is recorded at the top of [PLAYTESTS.md](PLAYTESTS.md).
