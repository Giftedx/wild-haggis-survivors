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

## Character pose

Every sprite has posture. Tilt, lean, stance. Not neutral mannequin.

## Squash/rest proportions

Defer: per-variant body-shape differences beyond palette are Phase 2.5. MVP variants share body shape; accessory + palette differentiate.

## Inspiration wall

Procedural or not, these anchor the voice:

- **Charles Rennie Mackintosh** — rose motifs, Glasgow Style, stark geometric floral. https://en.wikipedia.org/wiki/Charles_Rennie_Mackintosh
- **The Glasgow Boys** — late-19th-century painters, peat-palette muted naturalism. https://en.wikipedia.org/wiki/Glasgow_Boys
- **Limmy's Show** — surreal Glaswegian title cards, high-contrast flat palette.
- **Still Game** — warm-hearth character posters, exaggerated posture.
- **Trainspotting (1996)** — opening kinetic typography, sodium-orange and black.
- **Celtic illumination** — Book of Kells knotwork, densely layered detail.

## Reference files

Screenshots of existing bar-setting sprites live in `docs/art_refs/` (add as needed):
- `dean_apparition.png`
- `tome_wraith.png`
- `redcap.png`
- `ceilidh_caller.png`

New drawers compare side-by-side against these before Gate A passes.
