# Milestone status

Active milestone: **2 — 02 Ballast**
State: **awaiting_review**

| Milestone | Assignment | State |
| --- | --- | --- |
| 1 | 01 Adjacent + shared conservatory | approved |
| 2 | 02 Ballast | awaiting_review |
| 3 | 04 Borrowed Properties | queued |
| 4 | 05 Heat Shepherd | queued |
| 5 | 06 Pocket Biome | queued |

Authorization: the user approved Adjacent, requested Ballast, then requested revisions. Latest feedback rejected the optional fourth chamber as a complexity decrease and explicitly requested **12 levels of increasing complexity**. That authorizes this Ballast campaign revision only. Borrowed Properties has not been authorized.

Current delivery: twelve complete Ballast levels. The first three introduce single pulls, combined pulls, and a useful released mineral. Levels 4–5 require multiple releases. Levels 6–8 add ordered relay dependencies and carrying minerals into docks that cannot replace them. Levels 9–11 extend the supply chain and add a release needed for navigation. Level 12 requires an intentional mineral exchange, returning through Launch with an unavailable mineral, and a final curved release. The previous easy fourth chamber has been replaced.

The engine supports four material-matched relays, prerequisite circuits, independently controlled gates, and visible dock stock. Twelve numbered level buttons keep navigation compact. Planning previews, distinct force/drift arrows, staged hints, pause, reduced motion, and collision diagnostics remain available. Recovery now includes Z to retry the current launch, Z while docked to restore incoming cargo, and Plan → Previous dock to rewind a successful leg. Thus an incorrect arrival or discarded carried mineral can be corrected without restarting the level.

Saving uses Ballast edition 2. Legacy introductory completions and already-earned stamps survive. The old optional fourth completion does not credit its replacement. Current campaign progress records all twelve levels; a new stamp requires all twelve. Adjacent progress and shared preferences remain independent.

Verification: **47 model/save/design tests pass**. A production browser playthrough completed **all twelve levels** using actual loading, launch, planning, and release controls; completion survived reload. Tests independently check omitted/wrong releases, relay prerequisites, no-ejection bypasses, restricted cargo, and rewind history. Sampled release windows span at least 0.70 seconds for levels 4–8 and 0.75 seconds for levels 9–12. Production Ballast regression suites pass 14 base scenarios and 12 planning scenarios, plus four cargo-recovery scenarios. Adjacent's 21-scenario browser regression and all three production solutions pass. No captured browser errors. Type checking/build pass; final JavaScript is 27.49 KB gzip. Detailed evidence and layout results are in `PLAYTESTS.md` and `artifacts/`.

Playable preview: http://127.0.0.1:4173/ while running. Development: http://127.0.0.1:5173/. Rebuild, controls, and test commands are in `README.md`.

Review focus: the progression now adds cumulative dependencies, but human difficulty and pacing still require review. Automated solutions are not a first-player difficulty study. Browser coverage is Edge/Chromium on Windows; touch, Firefox, Safari, and screen-reader use remain untested. Full layout targets desktop/laptop windows at least 620px high; shorter windows keep planning controls reachable. Adjacent's previously deferred soft-lock feedback remains outside this Ballast revision.

Next permitted action: review or revise Ballast. Do not begin Borrowed Properties without explicit approval. No public deployment is authorized.
