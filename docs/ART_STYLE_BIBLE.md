# Art Style Bible — Wild Haggis Survivors

Non-negotiable bar for every new procedural drawer in the Moor-Renders-Itself push (spec `docs/superpowers/specs/2026-04-18-moor-renders-itself-design.md`). NEW drawers adhere; EXISTING sprites retrofit opportunistically when touched — not blocking.

## Palette anchors

Curated from the existing sprite hex inventory. Canonical source: `src/art/palettes.ts`. Use these, no stray hex.

### Peat browns
- `0x3a2818` — shadow peat
- `0x5a3e20` — mid peat
- `0x4a2e18` — warm peat

### Heather purples
- `0x8060a0` — dark heather
- `0x9070b0` — mid heather
- `0xb090d0` — bright heather

### Loch blues
- `0x2a4a6a` — deep loch
- `0x4a7090` — mid loch
- `0x6a90b0` — cool mist

### Whisky golds
- `0xc8a040` — aged gold
- `0xd4b055` — warm gold
- `0xffc840` — bright gold

### Stone greys
- `0x2a2a30` — shadow stone
- `0x4a4a50` — mid stone
- `0x8a8a90` — highlight stone

### Scots-red accents
- `0xaa2020` — deep blood
- `0xc42828` — arterial
- `0x901818` — dried blood

---

## Tonal palette map

Every biome, scene, and moment sits within one of the five tonal registers from `DESIGN_SOUL.md`. Each register modulates the base palette in specific ways — *it doesn't replace* the canonical hex values, it *biases* them.

### Hearth palette (warm, welcoming)

Gran's croft, Moor Road intermissions, victory screens, moor moments.

- **Dominant:** whisky golds (`0xc8a040`, `0xd4b055`, `0xffc840`), warm peat (`0x5a3e20`).
- **Accent:** heather purples (soft), mid-to-bright.
- **Light:** strong warm-directional, golden-hour inflection.
- **Saturation:** full.
- **Thistle accent:** deep purple on gold.

### Wild palette (windswept, lonely)

Cairngorm plateau, empty moors at dawn, Ben Nevis summit, first minutes of a run.

- **Dominant:** shadow stone (`0x2a2a30`), mid stone, cool mist (`0x6a90b0`).
- **Accent:** pale heather, pale whisky gold.
- **Light:** diffuse, cold directional, low contrast.
- **Saturation:** desaturated (-15–25% chroma).
- **Thistle accent:** silvered, wind-bent.

### Fey palette (otherworldly, tricksy)

Seelie/Unseelie encounters, Fairy Pools, Cailleach presence, standing-stone events.

- **Dominant:** violet-tinted stones, pale luminous heather, cool loch.
- **Accent:** iridescent overlays (shader-driven if available) on pickups and enemies.
- **Light:** multiple coloured sources; palette shifts during scene.
- **Saturation:** selectively heightened (enemies pop against desaturated ground).
- **Thistle accent:** sparking, glowing.

### Grave palette (heavy, historical, sombre)

Culloden echoes, Glencoe memorial biome, Killing Times route.

- **Dominant:** desaturated greys, bracken red (`0x901818`), shadow peat.
- **Accent:** ashen heather, dark stone.
- **Light:** overcast, low warm, long shadows.
- **Saturation:** heavily desaturated (-40%).
- **Thistle accent:** drooping, subdued.

### Wild Comedy palette (urban, cheeky, absurd)

Glasgow Close biome, urban ghaist encounters, Buckfast ned incidents, Edinburgh Old Town neons.

- **Dominant:** sodium amber streetlights (custom hex ~`0xff9030`), wet pavement grey, neon accents.
- **Accent:** Scots-red (`0xc42828`), Buckfast bottle-green.
- **Light:** hard street-lamps with crisp shadow; flicker permitted.
- **Saturation:** selectively high (neon over grey).
- **Thistle accent:** spray-painted, tartan-outlined.

**Rule.** A single scene sits in one palette. Transitions between registers use *haar* or *a kept-silence beat + camera reset* — not hard cuts.

---

## Light model

Every NEW drawer:
- Primary light: upper-left, full strength.
- Fill light: upper-right, 50% strength.
- Ambient occlusion: underside of body, subtle dark wash.

Existing sprites are inconsistent on this; retrofit when touched, don't block forward progress.

## Stroke / line weight

- No strokes on procedural sprites; mass via tonal layering.
- Exception: 1 px gold trim (`0xc8a040`) on ceremonial items (dean_apparition gown, auditor_priest staff tip).

## Composition rules

- Head: upper 1/3 of silhouette.
- Body: mid 1/3.
- Ground/shadow anchor: lower 1/6.
- Centre x. Bias y downward (ground anchor).

## Focal hierarchy

- One primary focal point (eyes / hat / weapon).
- One secondary (tint detail / stripe / motion).
- Tertiary is texture.

## Silhouette-first test

Every new drawer passes the silhouette test before colour is considered:

1. Fill the sprite with `#000` on a `#FFF` background.
2. Can a teammate identify: **what creature it is**, **which direction it faces**, and **what state it's in** (attacking, hurt, dying)?
3. If any answer is no, redraw the *outline* — not the colours.

Silhouette wins every battle for readability. Colour is the second layer of communication, not the first.

**Reference:** `docs/research/MUSIC_ART_TECH_RESEARCH.md` §5.1.

## Character pose

Every sprite has posture. Tilt, lean, stance. Not neutral mannequin.

## Squash/rest proportions

Defer: per-variant body-shape differences beyond palette are Phase 2.5. MVP variants share body shape; accessory + palette differentiate.

## Signature motifs

Scotland is built around recurring visual motifs. WHS uses these to unify its visual identity across every surface. Audit every new drawer against whether it *could* and *should* carry a motif.

### The Thistle

National emblem. Appears throughout — pickup sparkles, evolution bursts, crown/crest shapes, UI borders, loading spinners. Canonical silhouette: three-lobed purple bloom atop spiny stem. Colour bias: heather purple (`0x8060a0`–`0xb090d0`) on a contrasting background.

**Where it belongs:**
- Crit damage-number particle trail.
- Evolution pickup burst.
- Level-up card frame.
- Gran's croft window box.
- Moor moment toast bullet.
- Loading-spinner silhouette.

### The Haar

Scottish sea-fog. WHS's *signature biome transition*. Rolls in across the screen as a visual event — haar wave sweeps, pauses gameplay for UI moments, then lifts. Shader-driven when available (see technical-references section below).

**Where it belongs:**
- Moor Road act intermissions (roll in → UI → roll out).
- Biome transitions (moor → loch → edinburgh).
- Post-boss cleanup beat.
- Special route-picker entrance.

### Heather

Purple ground cover. Ambient motion on the moor — 2-frame sway per sprig. Wind direction shifts ambient-pressure flag (calm → boss-incoming).

### Tartan

Procedural per variant + weapon + mode (already shipped, `src/utils/tartan.ts`). Scope beyond postcards to: background of level-up cards, lineage-moment overlays, clan-chief NPC sashes, hidden-route teasers.

### The Saltire

White-on-blue diagonal. Used *sparingly* — only for moments of national/cultural weight (a true-ending cutscene, a Declaration-of-Arbroath easter egg). Not decoration.

## Inspiration wall

Procedural or not, these anchor the voice:

**Scottish fine art (studied closely):**
- **Charles Rennie Mackintosh** (1868–1928) — rose motifs, Glasgow Style, stark geometric floral. Grid-plus-organic tension. https://en.wikipedia.org/wiki/Charles_Rennie_Mackintosh
- **Margaret Macdonald Mackintosh** — often overlooked co-genius. Gesso panels, figurative Art Nouveau.
- **The Glasgow Boys** (c. 1880–1900) — peat-palette muted naturalism. Key members: Sir James Guthrie (rural realism), Sir John Lavery (portraiture), Joseph Crawhall (animals), Edward Atkinson Hornel (decorative), George Henry (portraiture). https://en.wikipedia.org/wiki/Glasgow_Boys
- **The Scottish Colourists** (c. 1910–40) — bold Matisse-influenced palette. Samuel Peploe (still lifes with roses), Francis Cadell (Iona landscapes, Edinburgh salons), Leslie Hunter (landscape), J.D. Fergusson (modernist figures).
- **Henry Raeburn** (1756–1823) — *The Skating Minister* as reference for still posture + atmosphere.
- **Joan Eardley** (1921–63) — Glasgow tenement children, Catterline coast storms. Rough, immediate.
- **John Bellany** (1942–2013) — Port Seton fisherfolk, surreal figurative.
- **Eduardo Paolozzi** — Pop Art pioneer, collage sensibility.

**Screen / comedy (tone anchors):**
- **Limmy's Show** — surreal Glaswegian title cards, high-contrast flat palette.
- **Still Game** — warm-hearth character posters, exaggerated posture.
- **Trainspotting (1996)** — opening kinetic typography, sodium-orange and black. Modernist type.
- **Chewin' the Fat** — sketch-title typography.

**Folk / traditional:**
- **Celtic illumination** — Book of Kells knotwork, densely layered detail.
- **Pictish stone carving** — mysterious-beast motifs, abstract symbols, foundational Scottish design vocabulary.
- **Harris Tweed patterns** — muted earth-tone colour theory.
- **Clan tartans** — the Royal Stewart as the "loudest", Black Watch as muted military, Hunting Stewart as muted classic.

**Modern pixel-art kin (studied for craft-level):**
- **HoloCure** — dense character-animation + warmth tone. Spiritual kin aesthetically.
- **Hades** — handpainted 2D over sprite-scale clarity. Gold standard.
- **Celeste** — pixel-art minimalism + moment-clarity.
- **Hyper Light Drifter** — atmospheric palette, silhouette priority.
- **Dead Cells** — 3D-baked-to-2D sprite animation (see `MUSIC_ART_TECH_RESEARCH.md` §5.3 if we ever need to expand animation scale).

**Deep reference:** `docs/research/SCOTTISH_RESEARCH_DEEP.md` Part 16 (Visual Arts & Architecture) for the full lineage.

---

## Weather & atmosphere

Weather is a *signature* in Scottish games. These are the visual vocabulary entries that carry atmosphere alone:

- **Dreich** — grey, sustained damp. Desaturated base palette + fine-drizzle particle overlay.
- **Haar** — sea-fog (see Signature motifs above).
- **Smirr** — fine drizzle. Denser than rain particles, less movement.
- **Simmer dim** — Shetland midsummer twilight. Cool blue-purple near-night with warm horizon.
- **Taps aff** — the hot-day joke. Vivid saturation, sharp shadows.
- **Bracken-turn** — autumn colour shift. Moor palette warms to copper-bronze in late run / seasonal beat.
- **Wind** — animates foliage, clouds, particles. Direction-driven. Picks up before boss fights.

## Technical art references

For implementing the above at WebGL / shader level, consult `docs/research/MUSIC_ART_TECH_RESEARCH.md`:

- **Part 5** — Modern pixel art pipelines (Aseprite, Dead Cells baking, procedural animation).
- **Part 6** — Shader art for 2D games (palette swap, outline, dissolve, heat-shimmer, haar fog, bloom). GLSL examples for each.
- **Part 7** — Procedural visual content (noise, patterns, procedural tartan, boid flocking for midges).
- **Part 8** — 2D lighting & atmosphere (normal maps, volumetric fog, day/night cycles, per-biome palette rotation).

---

## Reference files

Screenshots of existing bar-setting sprites live in `docs/art_refs/` (add as needed):
- `dean_apparition.png`
- `tome_wraith.png`
- `redcap.png`
- `ceilidh_caller.png`

New drawers compare side-by-side against these before Gate A passes.
