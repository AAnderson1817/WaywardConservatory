# Local recovery — 2026-09-15

The project now lives in a regular local checkout outside OneDrive, with GitHub as its source control remote. Future work must follow AGENTS.md.

The surviving Adjacent, Ballast, hub, and shared sources were copied and verified before restoration. Missing app entry files, configuration, documentation, vector favicon, and tests were recovered from the local task edit history. Build dependencies were restored at their original pinned versions, and the lockfile was regenerated.

Verification from the new local checkout:

- Type checking and the production build pass.
- The rebuilt JavaScript and CSS are byte-for-byte identical to the surviving final twelve-level release (index-BkyuRODo.js and index-Do0W6J3U.css).
- All 47 model, save, route, and design tests pass.
- The production browser completes all three Adjacent puzzles. Ballast passes all four cargo-recovery scenarios and all 48 level/viewport layout checks, without captured errors.
- Recovery corrected two test blocks' placement so each runs independently once.

Historical screenshots and JSON reports referenced in PLAYTESTS.md were not present in the surviving folder. They are not represented as recovered; browser scripts can regenerate them in the ignored artifacts directory. Raw task histories and recovery scratch files are excluded from the repository.
