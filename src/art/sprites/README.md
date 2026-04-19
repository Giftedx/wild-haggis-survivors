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
