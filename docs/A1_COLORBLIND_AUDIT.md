# A1 M2 — Colorblind palette audit

> **Status:** Candidate audit. Code-side LUT shipped (M2 already
> closed); palette-walk via Coblis / Color Oracle requires a human at
> a desktop browser. Fill the matrix below by simulating each palette
> across each CVD type and recording PASS / FAIL with mitigation.
>
> Companion: `docs/A1_NON_COLOUR_ALONE.md` (signal census across the
> HUD — what every colour-coded element pairs with as its non-colour
> cue).

## Tools

- [Coblis](https://www.color-blindness.com/coblis-color-blindness-simulator/)
  — upload a PNG screenshot, pick a CVD type, see the simulated render.
- [Color Oracle](https://colororacle.org/) — desktop-overlay tool;
  pixel-accurate; works against the live game.
- Chrome DevTools → Rendering → Emulate Vision Deficiencies — fast
  iteration without leaving the dev session.

## CVD types audited

| Code | Name | Prevalence (men) | Visual loss |
|------|------|------------------|-------------|
| Protan | Protanopia / Protanomaly | ~1% | L-cones absent / impaired — reds darken; red-green confusion. |
| Deutan | Deuteranopia / Deuteranomaly | ~5% | M-cones absent / impaired — green channel collapses. **Most common CVD.** |
| Tritan | Tritanopia | <0.01% | S-cones absent — blue/yellow confusion. |
| Achroma | Achromatopsia | <0.005% | All cones absent; greyscale only. Severe-case accommodation. |

The four `colorblindMode` LUTs ship in
`src/systems/accessibility/colorblindMatrices.ts` as Brettel/Viénot
simulations (the same matrices used by Coblis). The shipped feature
applies these post-hoc to the canvas via SVG `feColorMatrix` rather
than as a Phaser shader (per memory + ADR-0003 separation).

## Palette × CVD matrix

The five tonal palettes (`docs/ART_STYLE_BIBLE.md §Tonal palette map`)
intersect with the four CVD types. Each row records human-visual
PASS / FAIL of *gameplay-critical* hue distinctions, NOT aesthetic
fidelity.

### Hearth (warm golds, heather purples, peat brown)

Gran's croft, Moor Road intermissions, victory screen.

| Hue pair | Protan | Deutan | Tritan | Achroma | Mitigation |
|----------|--------|--------|--------|---------|------------|
| Whisky gold (`0xc8a040`) vs heather purple (soft) | _pending_ | _pending_ | _pending_ | _pending_ | Both pass silhouette test; chest icons differ by shape. |
| Warm peat (`0x5a3e20`) vs Hearth ground | _pending_ | _pending_ | _pending_ | _pending_ | Background; not gameplay-critical. |
| HP heart red (`#cc3333`) vs heather purple | _pending_ | _pending_ | _pending_ | _pending_ | HP heart icon is a heart **shape**, not just colour. PASS via shape cue. |
| XP cyan vs gold pickup | _pending_ | _pending_ | _pending_ | _pending_ | Different shapes (gem vs coin); different motion (XP magnetises). |

### Wild (shadow stone, cool mist, pale heather)

Cairngorm plateau, dawn moors, Ben Nevis, run openings.

| Hue pair | Protan | Deutan | Tritan | Achroma | Mitigation |
|----------|--------|--------|--------|---------|------------|
| Cool mist (`0x6a90b0`) vs ground | _pending_ | _pending_ | _pending_ | _pending_ | Background fog; not gameplay-critical. |
| Player green silhouette vs ground | _pending_ | _pending_ | _pending_ | _pending_ | Player has unique haggis silhouette; minimap also marks player as triangle. |
| Enemy red vs Wild backdrop | _pending_ | _pending_ | _pending_ | _pending_ | Enemy silhouettes are species-specific; HP bars on damaged enemies. |
| Elite gold (`0xffdd44`) vs Wild stones | _pending_ | _pending_ | _pending_ | _pending_ | Elite is **1.3× scale + persistent HP bar + golden glow**. Triple cue. |

### Fey (violet stones, luminous heather, iridescent overlays)

Standing-stone events, Cailleach presence, Fairy Pools.

| Hue pair | Protan | Deutan | Tritan | Achroma | Mitigation |
|----------|--------|--------|--------|---------|------------|
| Iridescent overlay vs base sprite | _pending_ | _pending_ | _pending_ | _pending_ | Overlay is **animated motion** as well as hue shift. |
| Heather purple vs Fey sky | _pending_ | _pending_ | _pending_ | _pending_ | Aesthetic; not gameplay-critical. |
| Standing-stone glow vs ground | _pending_ | _pending_ | _pending_ | _pending_ | Stones are tall vertical features; silhouette dominates. |
| Boon-pick caption colour `#ffe080` | _pending_ | _pending_ | _pending_ | _pending_ | Caption has explicit text + bracket prefix; colour redundant. |

### Grave (desaturated greys, bracken red, ashen heather)

Culloden echoes, Glencoe biome, Killing Times route.

| Hue pair | Protan | Deutan | Tritan | Achroma | Mitigation |
|----------|--------|--------|--------|---------|------------|
| Bracken red (`0x901818`) vs grey ground | _pending_ | _pending_ | _pending_ | _pending_ | **Highest CVD risk row.** Bracken is a saturated red → grey under protan. Fix: outline / icon if PEAT-walk fails. |
| Saturated red enemies vs Grave dust | _pending_ | _pending_ | _pending_ | _pending_ | Enemies have HP bars when damaged; silhouettes differ. |
| Memorial chest gold vs ash background | _pending_ | _pending_ | _pending_ | _pending_ | Chest is **square minimap mark** + gold trim; gold-only confusion possible under achroma — verify. |

### Wild Comedy (sodium amber, Scots-red, neon, wet pavement)

Glasgow Close, urban ghaists, Buckfast neds.

| Hue pair | Protan | Deutan | Tritan | Achroma | Mitigation |
|----------|--------|--------|--------|---------|------------|
| Sodium amber (`0xff9030`) vs wet pavement grey | _pending_ | _pending_ | _pending_ | _pending_ | Streetlight pools; not gameplay-critical. |
| Scots-red (`0xc42828`) vs neon | _pending_ | _pending_ | _pending_ | _pending_ | Aesthetic; check that hazard markers don't fall in this hue range. |
| Buckfast bottle-green vs Scots-red | _pending_ | _pending_ | _pending_ | _pending_ | Both bottle items have distinct **icon shapes**. |
| Tartan accent strokes (mixed) | _pending_ | _pending_ | _pending_ | _pending_ | Decoration only; not signalling. |

## Shared semantic colour signals (HUD/UI cross-palette)

These signals appear in every palette. They are the highest-leverage
audit targets — a fail here breaks gameplay everywhere.

| Signal | Colour | Non-colour cue (existing) | CVD risk |
|--------|--------|----------------------------|----------|
| Player position (minimap) | green triangle | **shape: triangle** | LOW — shape primary |
| Boss position (minimap) | red diamond | **shape: diamond (split)** | LOW — shape primary |
| Elite position (minimap) | gold ring + inner | **shape: 2-ring circle** | LOW — distinct from regular dot |
| Regular enemy (minimap) | dim red dot | **shape: small filled circle** | MEDIUM — single circle; relies on size to differentiate from elite ring |
| Chest (minimap) | gold square (golden) / pale (normal) | **shape: square** | LOW — shape distinct from enemies |
| Reliquary (minimap) | amber diamond | **shape: diamond** | MEDIUM — same shape as boss; relies on **size** + position pinning |
| HP bar fill | green / yellow / red gradient by HP fraction | **fill width** | LOW — fill width is the primary cue |
| XP gem | cyan | **shape: hexagonal gem + magnetises to player** | LOW — distinctive motion |
| Gold pickup | yellow | **shape: round coin + animates differently** | LOW — shape primary |
| Crit damage number | gold (`#ffdd44`) | **bold weight + 30% larger size + "CRIT" tween** | LOW — typography primary |
| Normal damage number | white | regular weight | LOW |
| Hazard tile (lava) | orange-red glow | **animated pulse + heat shimmer** | MEDIUM — verify shimmer reads under protan |
| Hazard tile (slick) | teal-blue | **persistent shape + slip-physics readout** | LOW |
| Achievement toast | gold (`#ffdd88`) | **icon + slide-in animation** | LOW |
| Damage flash (player) | red vignette | **camera shake + HP bar drop** | LOW — multi-cue |
| Boss-warning toast | red (`#ff4444`) | **explicit text "Boss approaches"** | LOW — text primary |
| Curse chip (HUD) | mauve (`#c8a0a0`) | **icon + mini-tooltip on hover** | MEDIUM — verify icon visible under achroma |

## Mitigations applied (code-side, before this audit)

The codebase already follows non-colour-alone discipline in most
gameplay-critical places. Notable existing patterns:

- **Minimap**: every actor is a distinct **shape** (triangle / diamond /
  ring / dot / square). Colour is reinforcement, not the primary cue.
  See `src/ui/Minimap.ts:111-165`.
- **Elite enemies**: triple-cue **scale (1.3×) + golden glow + persistent
  HP bar** (regular enemies only show HP bar when damaged). See
  `Enemy.markAsElite` (src/entities/Enemy.ts:1417).
- **Crit damage numbers**: typography (bold + size) carries the signal,
  not just gold tint. See `JuiceSystem.showDamageNumber`
  (src/systems/JuiceSystem.ts:282).
- **Boss minimap mark**: diamond *split* into two triangles — stands out
  even under achroma.
- **Captions** (M4) provide a fully colour-independent path for every
  audio cue, including hazard alarms.
- **High-contrast UI** toggle (existing) bumps text contrast and adds
  outlines to critical UI text.

## Mitigations to verify on PEAT-walk

These deserve manual attention during the human Coblis pass:

1. **Bracken red on Grave palette** — the Grave register desaturates by
   ~40%, and bracken red is already the saturated-red anchor. Under
   protan/deutan it may collapse into the grey ground. If it fails:
   add a thin outline (1px gold trim, per Bible §Stroke / line weight)
   to bracken-red elements that signal gameplay (chests, banner).
2. **Reliquary diamond vs boss diamond on minimap** — both diamonds.
   Differentiator is size + amber vs blood-red. If achroma simulator
   collapses the size delta (perceptually they may merge), add a
   second-cue: thin internal cross to the reliquary, or rotate reliquary
   to face-up triangle while boss stays diamond.
3. **Curse chip mauve vs HUD chrome** — verify the chip icon reads
   under achroma. If it doesn't, the chip border weight (currently
   1.5px) may need a bump to 2px when `colorblindMode !== 'off'`, or
   add a small sigil glyph.
4. **Lava hazard pulse** — the pulse is the non-colour cue. Verify
   amplitude is large enough that an achroma player can see the motion
   without the orange-red signal.

## Cross-references

- `src/systems/accessibility/colorblindMatrices.ts` — shipped LUTs.
- `src/systems/accessibility/applyColorblindFilter.ts` — runtime
  application via SVG `feColorMatrix`.
- `docs/A1_NON_COLOUR_ALONE.md` — signal census walkthrough.
- `docs/research/ACCESSIBILITY_RESEARCH.md` §3 — colorblind playbook.
- `docs/ART_STYLE_BIBLE.md §Tonal palette map` — palette catalogue.
- WCAG 1.4.1 — Use of Color (Level A).
