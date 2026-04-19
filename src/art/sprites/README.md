# `src/art/sprites/` — Procedural Sprite Drawers

Every texture in Wild Haggis Survivors is drawn procedurally at boot with Phaser's `Graphics.generateTexture`. No image assets. This folder owns the code that does the drawing, split by category so a single edit doesn't thrash a 6000+ line scene file.

## File layout

```
src/art/sprites/
├── README.md              — this file
├── decorations/
│   ├── index.ts           — exports bakeDecorations(scene)
│   ├── thistle.ts
│   ├── rock.ts
│   ├── heather.ts
│   └── ...                — one file per deco sprite
├── fx/
│   ├── index.ts
│   ├── entityShadow.ts
│   ├── bossShadow.ts
│   └── snowflake.ts
├── hud/
│   ├── index.ts
│   ├── shield.ts
│   └── dashPips.ts
├── projectiles/
├── pickups/
├── icons/                 — wicon_* + ucard_* (weapon + card icons)
├── enemies/
└── bosses/
```

## Conventions

### Per-sprite files

Each leaf file exports a single `bake<Name>(scene: Phaser.Scene): void` function that:
1. Grabs a throwaway `scene.add.graphics()`.
2. Draws the sprite with `fillStyle`/`fillEllipse`/etc.
3. Calls `graphics.generateTexture(<key>, w, h)` to register the texture on the scene's texture manager.
4. Calls `graphics.destroy()` to free the graphics object.

The texture key is an exported const `SPRITE_KEY_<NAME>` when it's likely to be imported elsewhere (atlas lookup, fallback chains, etc.). For one-off keys only referenced by BootScene + entity configs, hard-coding the string at the `generateTexture` call is fine.

### Category `index.ts`

Each category folder has an `index.ts` that exports a single `bake<Category>(scene)` function which calls every sprite-level baker in the folder in a deterministic order (import order = draw order — matters for display-list z-sorting where sprites share a depth).

### BootScene wiring

`BootScene.generateAllTextures()` imports every `bake<Category>` and calls them. That function is the only place that knows about all categories — individual drawers don't cross-reference.

### Testability

Each baker is a pure function over a Phaser scene. Tests can pass a real Phaser scene (via the full-env test runner) or a mock scene with `add.graphics()` → graphics stub for draw-call assertions. See existing tests under `src/entities/haggisComposition/drawers/tamOShanter.test.ts` for the graphics-stub pattern.

## Why this split

`src/scenes/BootScene.ts` grew to 6800+ lines with every sprite as a private method on the scene class. That monolith made:

- PR diffs thrash the whole file for any single-sprite edit.
- Finding a specific sprite required scrolling or grepping.
- Individual drawers impossible to unit-test (couldn't instantiate BootScene without full Phaser scene lifecycle).
- Adding a new sprite required knowing the BootScene-specific conventions, not just "drop a file and register it".

Modular per-sprite files reverse all of those. The accessory drawers under `src/entities/haggisComposition/drawers/` already use this pattern — this folder extends it to the rest of the art.

## Phase-0 atlases

The haggis body atlas (`haggis_<variant>_<state>_<frame>`) and accessory atlases (`<accessoryId>_<state>_<frame>`) are NOT baked through this folder — they live at:

- `src/animation/frameDrawers/haggisBodyDraw.ts` — the shared haggis body drawer.
- `src/animation/frameDrawers/haggisFrames.ts` — per-state frame delegates.
- `src/entities/haggisComposition/drawers/*.ts` — per-accessory drawers.

BootScene calls both systems: `generateAllTextures()` (via this folder) for the legacy + decoration sprites, then `bakeHaggisAtlas()` + `bakeAccessoryAtlas()` for the Phase-0 atlases. Both must run before any gameplay scene starts.

## Progress checkpoint — 2026-04-19

Categories extracted so far (seven categories, 66 sprites, 2937 lines out of BootScene):

| Category | Files | Sprites | Notes |
|----------|-------|---------|-------|
| decorations/ | 8 | 9 | thistle, 3 rock variants, heather, Glasgow kite, cone, tunnock, pint |
| fx/ | 5 | 4 | entity_shadow, boss_shadow, fx_snowflake, film_grain |
| hud/ | 3 | 3 | hud_shield, hud_dash_pip_full, hud_dash_pip_empty |
| projectiles/ | 4 | 3 | thistle, caber, haggis_ball |
| pickups/ | 5 | 4 | xp_gem, chest, health_orb, reliquary |
| icons/weapons.ts | 1 | 15 | all `wicon_*` consolidated |
| icons/cards.ts | 1 | 18 | all `ucard_*` consolidated |

BootScene monolith: 6840 → 3903 lines (−43%).

## Remaining work

Two categories still inline in BootScene:

1. **Enemies** — about 30 sprites, roughly 2300 lines of drawing code. Candidates for extraction to either `src/art/sprites/enemies/<name>.ts` (one file per enemy, matches the accessory-drawer convention) or a consolidated `enemies.ts` (matches icons). One-file-per-enemy is the better long-term fit because enemy sprites vary more in scale + style than icons.
2. **Bosses** — 5 sprites (gordon, tour_bus, laird, hunter_general, taxman) plus the player-variant texture bakers (`createHaggisTextures` + `createHaggisVariantTexture`). Bosses are ~100+ lines each with distinct styles, so the per-file convention suits them too.

The extraction pattern is fully established — each file just needs:
1. Copy the method body from BootScene.
2. Replace `private createX(): void {` with `export function bakeX(scene: Phaser.Scene): void {`.
3. Replace `this.add.graphics()` with `scene.add.graphics()`.
4. Add imports.
5. Create the category `index.ts`.
6. Delete the old methods from BootScene with `sed -i '<start>,<end>d'`.
7. Run lint + tests + verify all textures still exist via the preview console eval helper.

Target when done: BootScene under ~1000 lines, holding only the scene-lifecycle wiring (boot splash, atlas bakes, scene transitions).
