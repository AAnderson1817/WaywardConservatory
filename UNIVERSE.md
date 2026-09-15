# The Wayward Conservatory

A living research conservatory suspended among drifting islands. The player is a junior fieldkeeper, returning sealed seedcases to the thermal gatehouse and delivering fragile power cores through the anchor chamber.

## Visual language

Review revision: the user requested a simple arcade hub. Its visible text is limited to the arcade title and five game titles with one-sentence descriptions. Use a dark flat backdrop, bold arcade lettering, five equal illustrated panels, and lock icons for unfinished games. The gameplay interfaces retain the established botanical vocabulary below. Do not reintroduce hub labels, promotional copy, sidebars, or settings text.

Deep blue-green night (#102b2d), warm ivory paper (#efe6ce), aged brass (#c3a773), moss green (#89b895). Thin engraved lines, arched glass, dark timber, generous labels, botanical silhouettes. Warm illumination is localized to instruments and restored equipment. No pixel art.

The emblem is a seed between two leaves in a brass ring. Reuse it for navigation, results, and the fieldkeeper stamp. Specimen cases are faceted glass capsules with brass lids. Gate frames are arches with paired instrument rings. Each room uses the same thermometer plaque and room-number system.

Cold: snowflake, COLD, pale blue (#9bcdd9). Warm: sun, WARM, soft ochre (#e8c67c). Hot: flame, HOT, coral (#eb9c7c). Colors supplement symbols and labels. Feedback sounds use a small synthesized bell vocabulary for travel, a descending pair for undo, a ticking tone for instruments, and a rising phrase for completion.

## Objects and local rules

- Cooling moss: low rounded blue-green growth. Produces cooling and moisture in the later living kit; decorative in the gatehouse.
- Luminous fungus: pale stalks with green glowing caps. Requires moisture in the living kit; decorative here.
- Driftwood: curved warm timber. Its buoyancy can be transferred by a workshop extractor in a later assignment.
- Glass: teal highlights and fine brass edges. Transparency affects light, never collision.
- Heat-feeding grazers: small six-legged animals with warm backs; silhouettes in the migration station only until its milestone.
- Sealed seedcases: mist orchid, glassfern, and dawnseed specimens. They are carried without thermal damage; no concealed temperature rule.

Gatehouse instruments set discrete chamber temperatures. Rooms sharing a temperature connect through thermal gates regardless of position. Controls operate only in their own room and affect the named fixed targets. Some are linked to their own room, so changing a dial can change the fieldkeeper's available routes. Reapplying a setting may not recreate the previous configuration when several controls overlap; unlimited undo restores the full prior state. Pickup does not change world rules. Entering the vault collects the seedcase; returning it to Reception completes that challenge.

The third challenge, Before you leave, requires arranging a Cold return bridge through the Relay Loft before departure. The gallery dial changes the gallery and glasshouse together; the boiler reaches those same rooms, while the glasshouse can change the gallery alone. These overlapping controls let the player prepare separate temperatures before changing the gallery to Hot. No surprise locks, timers, or parcel-triggered rules are introduced.

Show each room's thermostat targets as numbered circles. Solid pale lines indicate travel from the current room; dashed brass lines indicate that room's control targets. Temperature previews identify the target temperatures and added/removed destinations before applying. Optional hints reveal a question, a closer clue, and a full route only on explicit request. Keep the ordinary board concise.

The fieldkeeper appears as a small brass-rimmed portrait with a leaf on the cap. Travel carries the marker between room anchors with a brief trail and ring. Thermostat pulses use the resulting room temperature color and reach only changed targets; newly available gates brighten and closed gates fade. The seedcase visibly leaves its vault on pickup, flies toward the objective indicator, and then accompanies the keeper. Undo reverses these changes. Use brief, event-driven effects with no input delay; preserve all meaning through static markers and text under reduced motion. A rising three-note chime marks pickup.

## The anchor chamber

Four minerals resonate with the chamber's wall anchors: pale blue Skyglass pulls north, ochre Sunstone east, coral Ironroot south, and green Mossjade west. These directional effects belong to the anchor field, not to all glass, metal, or stone in the world. Material arrows and names accompany their colors.

The capsule carries a luminous faceted power core in two brass-rimmed sockets. Loads combine their directional pulls. The capsule retains inertia, gradual drag bounds its drift, and speed is capped. It has no thrusters. Loading is possible only at magnetic docks; their visible dashed capture fields stop the core safely. Empty or cancelling loads cannot launch. Arrows inside a dock show its available mineral stock. Unmarked docks supply all four minerals. A mineral carried into a restricted refit can stay in its socket, even when that dock cannot replace it.

Ejected minerals inherit their release velocity and continue responding to their own pull. Releasing a mineral adds no impulse to the capsule. Each relay switch accepts one matching mineral: its letter identifies it and its arrow identifies the required material. A ↑ accepts Skyglass, for example. The core cannot activate a relay. Prerequisite labels such as A → B mean A must be powered before B accepts a mineral; a wrong or premature delivery is caught without activating the switch. A caught mineral does not activate later when its prerequisites become ready.

Relay activations latch for the current run. Gate letters list every relay required to open that particular gate; its wires illuminate as their relays power up. Separate gates can open at different times. The receiver requires all of the level's required relays. Color reinforces the arrow, letter, prerequisite, and powered-state markers, rather than carrying the rule alone.

Solid machinery, walls, and closed gates interrupt a launch. During flight or failure, Z retries the last launch with its starting loadout. At a dock, Z resets the refit to its incoming cargo and relay state, so replacing a carried mineral is reversible. Plan at a dock exposes Previous dock, which rewinds a completed leg and its cargo, loose minerals, and relay activations; this also recovers an arrival made with the wrong mineral. R restarts the chamber and clears its dock history. Recovery spends no lives and removes no earned completion. With no remaining pull, a stalled capsule offers a retry instead of leaving the player waiting indefinitely.

The gold arrow denotes resultant pull, with its length reflecting force strength. The offset pale dashed arrow and Drift meter denote velocity. Ejection changes the pull immediately while momentum changes gradually. At docks, a dotted path forecasts the launch without ejection. Esc pauses the board in place. While paused in flight, Q/E or the A/B controls select a hypothetical release: a solid path shows the core and a dashed mineral-colored path shows the loose mineral for up to two seconds. These predictions follow the live physics. The player explicitly commits with Release & resume; Resume or Esc continues with the load unchanged.

A collision retains the flight trail and places a marker at the impact. Its explanation identifies the closed gate, obstacle, or outer frame; exhausted drift has its own failure explanation. Dock capture, ejection, and switch activation receive short visual responses. Moving trails, the core halo, the switch wire, and feedback tones use the same brass, botanical green, and glass vocabulary as Adjacent. Reduced motion removes decoration and transitions while preserving essential capsule movement, planning paths, and static failure diagnostics.

The twelve-level campaign accumulates planning requirements. Levels 1–3 teach a single pull, combined pulls, and a released Skyglass mineral powering a switch. Level 3 keeps its marked release bay. Levels 4–5 require two and then three useful mineral deliveries across connected flights. Levels 6–8 add relay prerequisites and carrying minerals into restricted refits; the number of refits requiring carried cargo grows from one to two. Levels 9–12 extend these supply chains and require preparing cargo for later flights. The finale returns through the starting dock after the circuit has changed. All four directional minerals have required roles in the campaign.

Use twelve compact numbered level buttons, with the current title above the board. Keep supply arrows, relay letters, prerequisites, and gate requirements close to the objects they explain. The full game layout targets a viewport at least 620 pixels tall; shorter viewports may scroll, while planning and recovery controls stay within the visible viewport.

Each chamber's optional hints progress from a question to a closer clue and finally a complete route on explicit request. Revealed hint levels persist through retries, restarts, and chamber changes during a Ballast visit; leaving the game or reloading resets them. Keep hints out of the ordinary board until requested.

Outdoor heat and organism simulations belong to later instruments and habitats. They do not run in the gatehouse or anchor chamber. All five station IDs remain 01, 02, 04, 05, 06.

## Completion

Returning all three cases earns one thermal gatehouse stamp and lights the hub's gatehouse glass and seedbed. Replays are always available; restoring the same station repeatedly adds no duplicate reward.

Delivering all twelve Ballast cores earns a separate anchor chamber stamp, illuminates its central capsule and conduits, and restores small planters around the machinery. Migrated saves retain completion of the first three levels and any previously earned Ballast stamp. The former optional fourth level has been replaced, so its old completion does not mark the new fourth level complete. Neither game's completion changes the other's saved progress. Only completion, stamps, and shared settings survive a reload; an in-progress chamber starts again.
