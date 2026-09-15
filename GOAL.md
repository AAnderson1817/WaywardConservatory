# Astra Goal: The Wayward Conservatory

You are Astra, acting as game designer, 2D developer, and playtester. Build a playable browser-based arcade containing five mechanically unusual microgames in one coherent fictional universe. Use the available MCP connections to inspect the workspace, implement the project, run it, and test it.

Execute the work. Do not stop at a proposal, scaffold, design document, or attractive nonfunctional mockup.

## 1. Goal and mandatory review gates

The final goal is a complete **2D arcade UI with five playable games**. Work toward that goal through strictly gated milestones, preserving the original game IDs:

1. **01 — Adjacent:** complete arcade shell plus the first playable prototype.
2. **02 — Ballast:** integrate and complete the second prototype.
3. **04 — Borrowed Properties:** integrate and complete the third prototype.
4. **05 — Heat Shepherd:** integrate and complete the fourth prototype.
5. **06 — Pocket Biome:** integrate and complete the fifth prototype; verify the complete arcade.

**For this initial execution, complete only milestone 1, then stop for my review.**

After completing each prototype:
- Finish its integration and playtesting, save the project, and mark it `awaiting_review`.
- Stop implementation and return a playable entry point, controls, a brief completion report, and any known limitations.
- Do not start the next game until I explicitly approve proceeding. Feedback means revise the current milestone, test it again, and stop again.

Do not interpret the overarching goal, an autonomous loop, or a delegated agent as permission to bypass a review gate. Delegated work must remain inside the active milestone. You may create future games’ hub cards and shared interfaces, but not their gameplay implementations.

Use these milestone states: `queued`, `in_progress`, `awaiting_review`, `approved`. Record approval only when I actually give it. On subsequent sessions, inspect the saved state and my latest instructions before continuing.

Do not include games 03 or 07, or replace the selected games with different concepts.

## 2. Shared universe: The Wayward Conservatory

The arcade is a living research conservatory suspended among drifting islands. Its fieldkeepers maintain an ecosystem in which unusual physical relationships are normal: temperature can connect distant rooms, specialized minerals respond to directional anchors, useful properties can be transferred between objects, and organisms consume or produce environmental conditions.

The player is a junior fieldkeeper completing five practical assignments. Every game takes place in a different part of the same facility or its surrounding habitat. The hub is the conservatory itself—not a website listing unrelated games.

**Tone:** curious, tactile, quietly wondrous, and playful. Show the world through useful objects and their behavior, not lengthy exposition.

**Visual direction:** polished, illustrated 2D with clear silhouettes, botanical machinery, warm ivory labels, dark blue-green surroundings, brass instruments, and restrained luminous accents. Do not assume a pixel-art aesthetic. Prefer a small, consistent asset vocabulary over large quantities of mismatched art.

Establish a compact universe/style guide before implementation. Reuse the same gate designs, fieldkeeper emblem, specimen cases, material textures, temperature symbols, interface frames, and feedback sounds. Cooling moss, glowing fungi, driftwood, glass, and heat-feeding creatures should recur naturally in scenery and later gameplay.

Cohesion must extend beyond color:
- Each assignment helps maintain the conservatory: recover specimens, restore equipment, guide supplies, or prepare a living expedition kit.
- Materials and organisms retain consistent names, appearances, and properties. Document when an effect depends on a particular instrument or chamber; do not silently change the world’s rules between games.
- Completing a game earns a shared fieldkeeper stamp and visibly restores a small part of the hub. Replays remain freely available.

Do not build a universal simulation. Each microgame isolates one phenomenon; inactive systems can remain scenery.

## 3. The arcade interface

Create one shared application, not five separate websites.

The main screen is an illustrated conservatory cross-section or map containing five clearly selectable stations. Each station has a distinctive silhouette, game title, one-sentence premise, and availability/completion state. Keep navigation obvious and immediate; the setting must not obscure the menu.

Use a landscape-first layout that fits common desktop and laptop viewports without page scrolling. Support keyboard and pointer navigation. Keep text readable, communicate important states through shapes or labels as well as color, and provide mute and reduced-motion settings.

Every playable game uses the same interface conventions: brief instructions, consistent controls display, pause, restart, return to conservatory, and a clear results screen. Provide undo where specified below. Pause real-time games when focus is lost. Save settings and completion locally.

Unbuilt games have finished-looking station cards but honest unavailable states. Do not disguise placeholders as playable content. When all five are finished, all five are directly selectable without forcing the player to complete them in sequence.

No accounts, online services, monetization, multiplayer, procedural campaigns, or unrelated progression systems. Polish the first milestone’s hub and first game rather than leaving the interface as a wireframe until the end.

## 4. Game specifications

Target roughly **3–5 minutes per attempt or short set of challenges**, with quick restarts. Preserve each central mechanic; tune layouts, numerical values, controls, and difficulty to make it work. Do not replace the unusual rule with a conventional mechanic carrying unusual decoration.

### 01 — Adjacent | The Thermal Gatehouse

**Core rule:** rooms connect when their temperatures match, not because they are geographically adjacent.

Show six rooms in a readable cutaway diagram. Each room is cold, warm, or hot. The player can travel only between rooms currently sharing a temperature. Show all available destinations and update connections immediately when temperature changes.

Thermostats affect explicitly identified target rooms. Their limited control relationships create the puzzles; do not give the player unrestricted remote editing of every room.

**Objective:** retrieve a sealed seedcase from the vault and return to reception. Build three short authored puzzles that teach connections, remote temperature changes, and return-route planning.

The important decision is that opening one route can close another. Make destination previews and thermostat targets unambiguous. Provide unlimited undo and restart.

**Implementation boundary:** discrete room states and a changing connection graph, not impossible-geometry rendering or a walking simulator.

**Verification:** demonstrate a complete solution to every puzzle. Confirm the parcel can be returned, not merely reached, and that travel never follows an invalid connection. Ensure later puzzles require meaningful reconfiguration rather than one obvious temperature change.

### 02 — Ballast | The Anchor Chamber

**Core rule:** the capsule’s load determines its direction of acceleration. There is no conventional directional steering.

Use four identifiable ballast materials, each attracted toward a different chamber wall. The capsule has two sockets. At docks, choose ballast; in flight, eject individual pieces. Show the current combined force with a clear arrow. Explain any inertia and drag through consistent movement and an introductory challenge.

Released ballast continues responding to its own directional pull and can activate designated switches. Ejection must change the capsule’s behavior as well as release a useful object.

**Objective:** deliver a fragile conservatory power core to an exit dock without crashing into hazards. Build three single-screen challenges, progressing from one-direction motion to combined pulls and purposeful ejection.

**Implementation boundary:** simple deterministic arcade movement, bounded speed, clear collision rules, and instant retry. No realistic orbital simulation or added thrusters that undermine the central mechanic.

**Verification:** complete every route using the player’s actual controls. Check docking, ejection, switch activation, failure, and restart. Ensure success depends on understandable decisions rather than frame-perfect timing.

### 04 — Borrowed Properties | The Transposition Workshop

**Core rule:** a useful property is moved, never copied. Improving one object changes another.

The extractor holds one property at a time. Extracting immediately removes the property from its donor; installing transfers it to an eligible recipient. Clearly show eligibility, the held property, and changed object states.

Use only **buoyancy** and **transparency**. Borrow buoyancy from a driftwood raft to float a stone block, leaving the raft unable to float. Transfer transparency from a window to another object so a beam can pass through it, leaving the original window opaque.

Transparency affects light transmission, not collision or the ability to walk through an object. Buoyancy affects behavior at a fixed water surface; it does not require fluid simulation.

**Objective:** recover a specimen and return it through three authored puzzle rooms. Design consequences so the outward solution can compromise the return route. Provide undo.

**Implementation boundary:** movable objects, fixed water channels, straight light beams, and light-operated gates. No additional property types or crafting inventory.

**Verification:** conserve each transferable property across objects and the extractor. Test undo of transfers and resulting environmental changes. Verify complete round trips, including the consequences for donor objects.

### 05 — Heat Shepherd | The Frost Migration

**Core rule:** heat-feeding animals are both a threat to the settlement and the means of reaching it.

A herd of six grazers follows nearby heat and cools the terrain it crosses. Its movement can freeze river tiles into temporary crossings. The player controls three limited-fuel heaters to influence the herd, then dispatches supply wagons along the convoy route when the ice is safe.

The nursery hearth also attracts the animals. Its heat must remain above zero. Make heat attraction, cooling, freezing, thawing, fuel, and hearth condition visible and predictable. Explain visually how the native grazers traverse the water they freeze.

**Objective:** deliver three supply wagons without losing the hearth. Include a planning pause. Give clear feedback before dispatch and as ice approaches thawing.

**Implementation boundary:** one small map, one convoy route, one species, three heaters, and a simple temperature grid. No combat, breeding, food web, weather system, or fluid simulation.

**Verification:** demonstrate a winning strategy and meaningful failure conditions. Check that grazers navigate reliably, wagons respect passable terrain, ice changes correctly, and heat attraction produces controllable behavior. Tune away from random or frantic micromanagement.

### 06 — Pocket Biome | The Living Expedition Kit

**Core rule:** everything fits; the challenge is keeping incompatible tools and organisms functioning together.

The inventory board is the playfield. Use five objects: a heat-producing fire beetle, a heat-powered drill, heat-sensitive medicinal spores, cooling moss that releases moisture, and a luminous fungus that needs moisture.

Use a small grid and a six-step authored expedition. Before each step, the player may swap two cells or wait. Then environmental effects resolve and the next obstacle checks the relevant tool or organism. Show a clear next-step forecast before confirmation.

Temperature and moisture persist on the board between steps; moving an organism must not erase accumulated damage. Define adjacency, environmental updates, thresholds, and resolution order consistently. Keep the simulation legible through icons, meters, and short explanations.

**Objective:** pass stone barriers, dark passages, and poisonous chambers while preserving the required living equipment. The sequence should demand useful rearrangement, not one permanently optimal layout. Provide undo.

**Implementation boundary:** five objects, two environmental variables, one expedition. No loot system, weight restriction, expandable inventory, or extra crafting layer.

**Verification:** demonstrate a complete successful sequence and test both environmental interactions and obstacle checks. Confirm that forecasting, actual resolution, and undo agree.

## 5. Execution and technical discipline

Inspect the actual workspace and available MCP tools first. Reuse a suitable existing project rather than overwriting it. Otherwise default to the proposed TypeScript/Phaser browser project, using installed or verified dependencies. Keep the five games in separate scenes/modules with shared interface, input, audio, settings, and save utilities.

Use real file, terminal, and browser connections where available. Do not claim access to a local application, successful execution, or browser testing without doing it. If a necessary capability is missing, identify the specific blocker and distinguish verified work from unverified work.

Prefer a dependable 2D pipeline using code-drawn, vector, or locally available assets. Blender is optional and must not become a prerequisite for these prototypes. Do not create a custom engine, elaborate agent framework, or speculative systems for unbuilt games.

Keep mechanics separable from rendering. Provide a development-only way to inspect game state and deterministic stepping where applicable. Test the unusual rule directly, not just screenshots or menu navigation.

Maintain lightweight persistent records:
- `GOAL.md`: this brief and the fixed milestone sequence.
- `UNIVERSE.md`: shared visual language, names, materials, and rules.
- `STATUS.md`: active milestone, review status, actual approvals, blockers, and next permitted action.
- `PLAYTESTS.md`: tested scenarios, results, solutions, and genuine limitations.

If equivalent project files already exist, update them rather than duplicating project management. Save all assets and code needed to reproduce the current build. Do not publish publicly or change unrelated services without authorization.

## 6. Completion standard and stopping behavior

Before declaring the active prototype ready:
1. Launch the real app and inspect the hub and game at desktop and smaller laptop sizes.
2. Exercise the primary interaction, every authored challenge, success, applicable failure, restart, pause, return to hub, and undo where provided.
3. Verify rules through state inspection or automated checks as well as actual input-based playtesting. Check for runtime errors and unusable layouts.
4. Refine obvious problems with readability, responsiveness, feedback, difficulty, or discoverability. The central mechanic must produce a meaningful decision rather than a cosmetic effect.
5. Confirm existing completed games still work. Save the build and update the milestone to `awaiting_review`.

Do not claim completion on the basis of code generation, a successful build, or a screenshot alone. If genuine blockers prevent reaching the standard, report them without marking the milestone complete or moving on.

At the review gate, return only the playable URL or exact launch instructions, controls, what was completed, important limitations, and: **“Stopped for review. The next game has not been started.”**

After the final game, apply the same review gate to the complete arcade. No release or deployment is implied by prototype approval.

**Begin now with the shared arcade shell and 01 — Adjacent. Finish that milestone, make it genuinely playable, and stop.**
