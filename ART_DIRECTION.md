# Illustrated art direction

The conservatory is a working botanical atelier: aged brass, oak, dark teal stone, glass, living plants, and warm workshop light. All five arcade covers, six Adjacent rooms, the fieldkeeper and seedcase, and Ballast’s chamber and pieces use painted raster assets. Sharp line work remains for labels, collision boundaries, force arrows, paths, and circuits.

## Runtime assets

All artwork was created with the built-in ImageGen tool. Original generated PNGs are retained in the local generated-images directory; optimized WebP files below are the versioned runtime assets. Encoding used quality 90 and alpha quality 100 without resizing. Total payload is 2,588,808 bytes, down 83% from the 15,578,500-byte PNG set. No external runtime image requests or new application dependencies are needed.

| Asset | Dimensions | Bytes |
| --- | --- | ---: |
| [ballast-chamber.webp](public/art/ballast-chamber.webp) | 1536 × 1024 | 372,712 |
| [ballast-sprites.webp](public/art/ballast-sprites.webp) | 1536 × 1024, alpha | 310,502 |
| [adjacent-rooms.webp](public/art/adjacent-rooms.webp) | 1536 × 1024 | 638,568 |
| [arcade-covers.webp](public/art/arcade-covers.webp) | 1536 × 1024 | 639,726 |
| [atelier-details.webp](public/art/atelier-details.webp) | 1254 × 1254 | 627,300 |

## Integration notes

- Room and cover atlases are cropped with preserved proportions. Their raster illustrations are embedded in SVG viewports; these viewports do not synthesize the artwork.
- The mineral atlas has genuine alpha transparency, including the dock’s center. Its six occupied bounds are centered in padded viewports in `src/shared/paint.ts`; the 17-unit collision rim remains visible on the core. Physics coordinates have not changed.
- The details atlas has a slightly shorter upper row. Portrait and seedcase crops compensate for that row height. Lower cells supply oak and bronze material textures.
- Solid machinery retains exact rectangular collision borders. Gate panels slide inside a clip that matches their actual collider. Open gates clear the path rather than leaving a solid-looking ghost.
- Adjacent’s movable portrait and seedcase remain separate from the rooms, so pickup, undo, and room changes never leave baked-in duplicates.
- Color always has an accompanying arrow, word, letter, number, or shape. Reduced motion retains explicit before/after lesson controls.

## Generation prompts

### ballast-chamber.webp

Generated source: `exec-c0e64b18-5dd5-479e-b631-e451e80b979d.png`.

Use case: stylized-concept. Asset type: production 2D game background, 1536x1024 landscape.
Paint an atmospheric botanical conservatory maintenance chamber viewed straight down, orthographic, for a polished illustrated puzzle game. A broad, empty, dark desaturated teal stone work surface fills the central 88% of the picture. Subtle irregular stone grain and soft worn patches give it depth, but absolutely no objects, holes, plants, lines, circles, grids, symbols or fixtures inside that empty play surface. Along only the outermost edges, a richly hand-painted architectural frame: weathered bronze and honey oak rails, clustered ferns, tiny pale blue glass vessels, coiled copper pipes, and warm small workshop lights. Bottom edge slightly heavier with layered timber and leafy corners. Top edge has glimpses of greenhouse glass and a little diffuse daylight. Wide calm composition, physically crafted materials, crisp illustrative silhouettes, painterly brush texture with carefully designed detail; premium 2D adventure game environment. Quiet, curious, tactile, not photorealistic, not pixel art, not flat vector art, not a UI mockup. The center must remain exceptionally clean and low contrast so movable game objects can be placed anywhere. No text, lettering, diagram, arrows, numbers, logo, watermark, characters, central props or UI.

### ballast-sprites.webp

Generated source: `exec-70da88b1-4904-41c7-a3a7-31592ec778be.png`.

Production sprite atlas for an illustrated 2D botanical puzzle game. 1536 by 1024 image, transparent alpha background. A STRICT REGULAR GRID OF 3 COLUMNS AND 2 ROWS, each cell exactly 512x512 pixels. Six completely separate centered objects, each confined to the central 70 percent of its cell with abundant transparent padding; NO objects cross cell boundaries. Hand-painted premium adventure game art, crisp silhouette, coherent warm brass and cool teal palette, subtle brushwork, consistent overhead orthographic view and top-left lighting.
TOP LEFT cell: a single pale blue translucent elongated crystal mineral, forked upper tip, frosted facets.
TOP CENTER cell: a single honey amber chunky hexagonal crystal mineral, warm glowing interior.
TOP RIGHT cell: a single coral-red jagged iron mineral, asymmetric spiky silhouette.
BOTTOM LEFT cell: a single moss-green rounded mineral geode, soft rounded triangular silhouette.
BOTTOM CENTER cell: a top-down round brass botanical capsule, two distinct socket wells at left and right, glass central core containing a softly glowing ivory seed, compact machine with a thick bronze rim and teal glass. No loaded minerals in its sockets.
BOTTOM RIGHT cell: a top-down circular wooden and brass docking cradle, hollow dark transparent center, three substantial brass clamps spaced around its rim, engraved ivory ticks but no text, fully circular silhouette.
All six sprites have the same painted art direction and detailed physically crafted materials. No text, arrows, letters, labels, numbers, backdrop, grid lines, floor, cast shadow outside the objects, UI, watermark, or extra items. Genuine transparency surrounding every object. This is a usable sprite sheet, not a presentation board.

Refinement prompt, applied with the first generated atlas as the reference image:

Edit this sprite atlas for game integration. REQUIRED: remove the entire colored backdrop and every ambient halo/glow outside the six objects, replacing it with genuine transparent alpha, including the hollow center of the docking ring. NOT a checkerboard painted into the image, NOT black, NOT colored backdrop. Preserve the six object designs and their relative cell assignments exactly. Keep canvas exactly 1536x1024, a strict 3x2 regular grid of 512x512 cells. Resize each complete object to fit inside the central 70 percent of its own 512x512 cell, centered on that cell's exact midpoint, with at least 76 pixels transparent padding on every side. Object centers must be (256,256), (768,256), (1280,256), (256,768), (768,768), (1280,768). Each object remains separate. Crisp clean antialiased cutout edges, absolutely no shadows or translucent glow outside silhouettes. Do not add anything. No text, numbers, symbols or grid lines.

### adjacent-rooms.webp

Generated source: `exec-832a0286-8185-4c03-b25d-b4190de5d18b.png`.

Create a production texture atlas of six hand-painted rooms for an elegant botanical puzzle adventure. Exact canvas 1536x1024, STRICT 3 COLUMNS by 2 ROWS regular grid. Every room fills exactly its 512x512 square. Straight rectangular edges at x=512,1024 and y=512, NO margins or gutters, NO collages, NO asymmetrical panels. Each room is a complete small conservatory interior scene viewed from a consistent elevated front perspective, beautiful painted 2D game art, tactile weathered brass, honey oak, teal shadows, soft light, lush distinctive plants. Clear designed foreground shape and layered background, sophisticated illustration rather than flat vector, no photorealism. Keep center floor area open for a character overlay. Camera and rendering style absolutely consistent across six rooms.
Top left: RECEPTION, inviting arched bronze and oak doorway, a small reception desk off to the left, warm glass lanterns, ferns.
Top center: MOSS ROOM, cool shady fern and moss propagation benches along the sides, green leaves, stone basin at the back.
Top right: BOILER ROOM, rounded copper boiler and heavy copper pipes around the walls, amber firebox glow, valves and gauges.
Bottom left: GLASSHOUSE, tall greenhouse panes, pale sky, climbing tropical leaves around the edges, elegant glass architecture.
Bottom center: RELAY WORKSHOP, brass instrument desk with circular mechanical dials, a few glass tubes and electrical coils, midnight blue highlights.
Bottom right: SEED VAULT, rounded oak and bronze cabinets around the walls, empty dark central circular pedestal with soft pale light, NO seedcase or treasure sitting on the pedestal.
The six rooms must read like locations in one professionally art-directed world. No characters, no text, letters, digits, labels, UI, arrows, frames, watermarks.

### arcade-covers.webp

Generated source: `exec-bb99291a-90a8-46c0-8b6a-bd4fed22d787.png`.

Production illustrated cover-art atlas for five botanical arcade puzzle games. 1536x1024 landscape, strict exact 3-column by 2-row grid of 512x512 square cells with NO GUTTERS; each image fills its square from edge to edge. Six self-contained illustrations, no objects cross boundaries. Premium hand-painted 2D adventure game art: weathered bronze, warm honey oak, lush botanical greens, dark teal shadows and soft luminous amber highlights, layered rich detail but bold main silhouettes. Elevated three-quarter view consistent across all.
TOP LEFT cell: Adjacent, an enchanting conservatory doorway opening onto three connected small greenhouse rooms at different climates, one frosty blue, one warm golden, one hot coral, mechanical thermostat by the doorway.
TOP CENTER cell: Ballast, a floating circular brass and glass capsule with glowing ivory seed core, surrounded by four large luminous separate minerals: icy blue, amber, coral red, moss green; copper docking cradle in the background.
TOP RIGHT cell: Borrowed Properties, a botanist's wooden workbench with a glass bell jar, a heavy rough stone and a delicate glowing feather exchanging a ribbon of light.
BOTTOM LEFT cell: Heat Shepherd, three charming plump moss-covered grazer creatures following a glowing ember across stepping stones over dark water in a greenhouse.
BOTTOM CENTER cell: Pocket Biome, a beautiful small portable glass terrarium backpack containing tiny ferns, mushrooms and a pool, leather and bronze tools at its sides.
BOTTOM RIGHT cell: a decorative close view of a lush glasshouse roof and plants, no focal object.
Images fill every cell, atmosphere and depth, detailed material surfaces. No text, lettering, numbers, diagrams, UI, arrows, borders, logos, watermarks. Not vector art, not pixel art, not photorealistic.

### atelier-details.webp

Generated source: `exec-759ad1ed-02a9-493e-b4eb-69eb8729ee87.png`.

Production 2D game art texture atlas, exactly 1024x1024, a strict 2-column by 2-row grid of four 512x512 cells, no gutters and no border between cells. Four images, each fills exactly its square. Consistent premium painted botanical adventure art, weathered brass and honey oak, teal shadows, warm lighting, crisp handmade detail, painterly rather than photorealistic.
TOP LEFT: centered head-and-shoulders portrait of a small friendly adult greenhouse fieldkeeper, dark teal workcoat, brown cap with a fern tucked into it, round glasses, tawny skin, cream shirt and brass clasp, serious kind expression. Frontal 3/4 view, surrounded by a round thick brass medallion, dark teal background within and outside the medallion. Portrait fills a central circle 420px in diameter, clean silhouette useful as a small player token.
TOP RIGHT: one sealed portable botanical seedcase, beautifully crafted small brass cylinder with glass window and a pale living sprout inside, ornate hinged cap, leather strap, centered object with readable silhouette against plain dark teal; fills central 370x370px. No plants outside the case.
BOTTOM LEFT: flat overhead seamless-looking material texture of solid dark oak machinery housing with aged brass edge strips and a few brass rivets, usable tiled horizontal or vertical, straight edges, no perspective, NO central objects or holes.
BOTTOM RIGHT: flat overhead material texture of bronze sliding gate panel with vertical bronze slats and shallow turquoise oxidized seams, embossed edges and bolt heads. Heavy solid physical machine material, usable as a repeated 2D texture, no perspective.
No text, letters, digits, icons, annotations, arrows, grid lines, collage, watermark or logo.
