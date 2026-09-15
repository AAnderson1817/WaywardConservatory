# Ballast: flight garden prototype

## The question this revision tests

Can the same small course stay interesting when the player changes the mineral, launch angle, power, or timing of shielding? This revision proves a three-course loop before building another campaign.

## Rules

The launch supplies velocity. Nearby bodies supply radial acceleration according to distance and their response to the current cargo. Positive response attracts; negative response repels. Skyglass is blue, Ironroot coral. Both averages their responses; it can attract one body and repel another. Empty has no field response. Body labels and arrows reflect the actual calculation.

The shutter temporarily sets field response to zero without adding an impulse or deleting momentum. Gentle global damping eventually settles a shot; collisions rebound with reduced energy. The pure model substeps at 1/120 second, bounds speed, and smoothly fades fields at their rims. The receiver captures within its ring at speed ≤108 world units/second. Faster crossings remain in flight and receive amber feedback. All shots can be retried immediately; a 22-second cap prevents indefinite orbit traps.

## Course intent

| Course | Intent | Alternate approaches |
| --- | --- | --- |
| Crescent | Learn to curve around a solid floating body | Blue upper and lower arcs; red bank |
| Cushion | Use repulsion to deflect and brake | Red braking; blue attraction; gentle mixed route |
| Confluence | Read overlapping fields and compare shutter control | Blue and red banks; mixed route; timed shielded exit |

The latter two courses contain small wooden baffles. Numerical angle/power scans found no collision-free Empty wins; neutral bank shots remain an intentional alternative. This is sampled evidence, not a formal proof over continuous controls.

## Controls and teaching

Drag backward from the core to aim and release, or use native angle/power sliders and Launch. Hold Space or the shutter button in flight. Select launch-and-watch by disabling Shutter control before the shot. R retries and preserves the full shot settings plus the last trail. Escape pauses; focus loss pauses and clears held input. The ? button replays all five lessons. New interactions trigger teaching even when a player changes cargo or jumps ahead.

The main board uses the existing painted chamber, crystals, core, receiver, and wood. Sharp rings indicate collision and capture boundaries; field particles, inward/outward arrows, the force vector, and the trail explain motion. Reduced motion stops decorative animation and presents tutorial diagrams statically. Physics continues normally during play and freezes completely during help and pause.

## Review questions

- Does aiming feel precise enough without requiring tedious slider adjustment?
- Can the player explain why a shot curved or missed after seeing its trail?
- Does shielding feel like a satisfying timing skill, or does launch-and-watch feel better?
- Is gentle receiver capture readable and forgiving enough?
- Does replaying a course with another mineral yield worthwhile discoveries?

The prototype uses single-shot attempts, fixed body positions, two mineral types, and no score target. Moving bodies, in-flight cargo swaps, more minerals, multi-stroke recovery, and a larger campaign remain future design choices. A numerical solution demonstrates reachability, not that the game feels good; user playtesting decides that.

## Verification fixtures

These are developer evidence, not solutions presented by the game.

| Course | Cargo | Angle | Power |
| --- | --- | ---: | ---: |
| Crescent | Blue, upper | -30° | 68 |
| Crescent | Blue, lower | 10° | 68 |
| Crescent | Red | -28° | 76 |
| Cushion | Red | -4° | 68 |
| Cushion | Blue | 12° | 52 |
| Cushion | Both | 0° | 48 |
| Confluence | Both | -12° | 84 |
| Confluence | Blue | -54° | 76 |
| Confluence | Red | 28° | 78 |

Confluence also succeeds with Blue, -2°/68, holding the shutter from 1.3 seconds. The identical unshielded launch fails. Source tests retain these complete routes and check pure, deterministic physics, force mixtures, collisions, pause-safe stepping, previews, and capture behavior.
