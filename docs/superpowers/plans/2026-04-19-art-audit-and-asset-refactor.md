# Art Audit & Asset Refactor — Phase 1 Plan

> **Ties to:** Phase 0 prototype (`2026-04-18-moor-phase-0-prototype-plan.md`) shipped the animation atlas + 9 accessory drawers + visible wear-build. This plan covers what comes next: using the existing tooling to audit every sprite in the game, tightening the ones that don't meet the bar, and making the asset code neat enough that future edits don't require scrolling through a 6840-line boot scene.

**Goal:** Every sprite in Wild Haggis Survivors reads as lovingly-handcrafted pixel art; the code that draws them lives in focused files, not one monster scene; and the tooling to verify the art is a 10-second workflow for a developer or reviewer.

**Scale check:** ~92 sprite keys baked in `BootScene.ts` today (enemies, bosses, decorations, HUD, weapon icons, card icons, pickups), plus ~216 atlas frames from Phase 0 (9 haggis variants × 6 states × 2–4 frames and 9 accessories × same). Total ~300 textures. Every single one is procedurally drawn — nothing is imported from a file — so every pixel is ours to own.

**Tech stack:** Phaser 3 `Graphics.generateTexture`, TypeScript drawers, `?export=sprites` URL param, `CombinationsPreview` dev scene.

---

## Where we are today

### Sprite production
- **Phase-0 path (accessories + haggis body frames)** — modular: one `*.ts` drawer per accessory in `src/entities/haggisComposition/drawers/`, one shared body drawer in `src/animation/frameDrawers/haggisBodyDraw.ts`. Clean.
- **Legacy path (everything else — 92 textures)** — inline in `src/scenes/BootScene.ts`, which is **6840 lines**. Each enemy, boss, weapon icon, etc. gets its own `private createX()` method, all in one file. Finding a specific sprite means scrolling.

### Review tooling
- **`?export=sprites`** — `src/tools/SpriteExportScene.ts` composites every baked texture into a single PNG at 6× scale, categorised and labelled, and auto-downloads it. Gives us "look at every sprite on one page" in one click. **It does not include atlas frames** (only single-frame keys), so the 216 new atlas textures from Phase 0 are invisible in that workflow.
- **`C` key in game → CombinationsPreview** — the grid we built in the last session. Good for variant × accessory comparison, but not for surveying *every* sprite in the game.

### Docs
- `docs/ART_STYLE_BIBLE.md` — palette anchors, light model, composition rules. Forty lines, already the north star for Phase-0 drawers.

---

## Gaps / problems

1. **No "every sprite" survey.** `?export=sprites` is the right primitive, but it:
   - Misses atlas frames (haggis_classic_idle_0 etc. never appear).
   - Doesn't group legacy sprites next to the new Phase-0 atlases, so there's no way to see variant + accessory + enemies together.
2. **BootScene is a monster.** 6840 lines in one file means:
   - Any edit thrashes the file history.
   - New contributors have no idea where to add a sprite.
   - Tests can't easily import a single drawer (everything is a private method on the scene class).
3. **Inconsistent drawer style.** Accessory drawers are pure functions (`draw(g, ctx)`). Enemies are scene methods that call `g.generateTexture` themselves. Two different patterns for the same kind of work.
4. **No per-sprite audit note.** When we want to tweak an enemy, there's no living doc of "what's currently wrong with this sprite" — we eyeball it and guess.
5. **`?export` output is not used routinely.** The PNG is a diff-able artifact that could catch regressions, but no commit references it.

---

## Plan

### Section A — Review tooling upgrades

**A1. Extend `SpriteExportScene` to include Phase-0 atlas frames.**

Currently it filters on `Object.keys(textures)` which does include atlas keys, but there's no category for them — they fall through to `'Other'` and get sorted by pixel area, mixed with unrelated textures. Fix: add categories
- `Haggis Frames` — keys matching `haggis_<variant>_<state>_<frame>` (108 of them).
- `Accessory Frames` — keys matching `<accessoryId>_<state>_<frame>` (~108 of them).

Within each, sub-group by variant/accessory so reading the PNG by variant is natural.

**A2. Add `?export=sprites-atlas-only` variant.**

For art-review sessions focused on the new work, a flag that skips legacy sprites entirely and dumps only atlases. Smaller PNG, faster to scan.

**A3. Add a "launch export" keyboard shortcut.**

Right now you have to type `?export=sprites` in the URL bar. Add `F9` (or similar) in dev builds that starts the same scene. One key-press instead of a URL edit.

**A4. CombinationsPreview — scroll-to-section shortcuts.**

Number keys `1`–`9` jump to each accessory row. `0` jumps to variant row. Big quality-of-life when reviewing in real time.

### Section B — One-pass art audit

After A1/A2 ship, generate the PNG and create `docs/ART_AUDIT.md` with one section per category. For each sprite, record:
- A short visual note (what reads, what doesn't).
- A priority flag: `P0-broken`, `P1-weak`, `P2-polish`, `P3-ok`.
- A link to the file/line if fix needed.

**Categories to audit:**
- Player variants (9) — mostly done in Phase 0 + laird rework, but one more pass for consistency.
- Enemies (~30). Range wildly — some are highly polished (dean_apparition, tome_wraith, redcap), some are basic.
- Bosses (5 + generic). Gordon/tour-bus/laird/hunter-general/taxman.
- Hazards + projectiles + pickups (~7). Quick.
- HUD elements + FX + shadows (~6). Quick.
- Decorations (~9). Environmental — lowest priority but lots of them.
- Weapon icons (13). Uniform style needed.
- Card icons (18: 9 accessories + 9 stat icons). Uniform style needed.

Single doc, skimmable. The output of this audit drives Section C.

### Section C — Fix passes

Grouped by category so a single commit is one category of sprites. Each commit:
1. References the `ART_AUDIT.md` entry it addresses.
2. Keeps the texture key unchanged (no rename cascades).
3. Runs `?export=sprites` before/after and the diff is obvious in the new PNG.

Order (highest visual impact first):
1. **Enemies** — most pixels on screen during play.
2. **Bosses** — high-stakes moments, big sprites, fewest of them.
3. **Card + weapon icons** — seen on every level-up screen; consistency matters.
4. **Decorations + pickups + HUD** — environmental, lower priority.

### Section D — Refactor BootScene into focused files

The 6840-line file needs to split. Target structure:

```
src/art/sprites/
├── README.md              — "each file exports `bake(scene)` that creates textures"
├── enemies/
│   ├── index.ts           — bakes every enemy
│   ├── tourist.ts
│   ├── chef.ts
│   ├── midge.ts
│   ├── … one file per enemy family
├── bosses/
│   ├── index.ts
│   ├── gordon.ts
│   ├── tourBus.ts
│   ├── laird.ts
│   ├── hunterGeneral.ts
│   └── taxman.ts
├── decorations/
│   ├── index.ts
│   ├── thistle.ts
│   ├── rock.ts
│   └── …
├── hud/
│   ├── index.ts
│   ├── chrome.ts
│   └── dashPips.ts
├── icons/
│   ├── index.ts
│   ├── cardAccessory.ts   — the 9 accessory card icons
│   ├── cardStat.ts        — the 9 stat card icons
│   └── weapon.ts          — the 13 weapon icons
├── pickups/
│   ├── index.ts
│   ├── xpGem.ts
│   ├── healthOrb.ts
│   └── chest.ts
├── projectiles/
│   ├── index.ts
│   ├── thistle.ts
│   ├── caber.ts
│   └── haggisBall.ts
└── fx/
    ├── index.ts
    ├── entityShadow.ts
    ├── bossShadow.ts
    └── snowflake.ts
```

Each leaf file exports a single `export function bakeX(scene: Phaser.Scene): void` that does one texture. The `index.ts` of each category calls all of them. `BootScene` then becomes:

```ts
// BootScene.ts
private generateAllTextures(): void {
  bakeHaggisLegacyTextures(this);  // the existing 9 variant sheets
  bakeEnemies(this);
  bakeBosses(this);
  bakeDecorations(this);
  bakeHud(this);
  bakeIcons(this);
  bakePickups(this);
  bakeProjectiles(this);
  bakeFx(this);
}
```

From 6840 lines of inline methods to ~90 files of ~50 lines each. Each file importable in a test, each file edit isolated.

**Do this in passes, not one mega-commit:**
- D1. Scaffold `src/art/sprites/` with README + category folders (empty).
- D2. Move ONE category (e.g., decorations — small, low-risk). Commit.
- D3. Move enemies. Commit.
- D4. Move bosses, icons, pickups, projectiles, HUD, fx — one per commit.
- D5. Verify `?export=sprites` produces an identical PNG byte-for-byte at the end.

Each D-commit keeps the game working; BootScene keeps the old methods until the new files are wired in, then the old methods are deleted in the same commit.

### Section E — Ongoing hygiene

After D ships, add to `docs/ART_STYLE_BIBLE.md`:
- "Adding a new sprite: drop a file in `src/art/sprites/<category>/<name>.ts`, export `bakeX`, add to the category index."
- "Adding a new variant / accessory frame: follow `src/animation/frameDrawers/haggisFrames.ts` as a template."

Then every future PR that touches sprite art runs through the same flow.

---

## Order of operations (next 10 commits)

| # | Task | Section |
|---|------|---------|
| 1 | Extend `SpriteExportScene` — atlas-frame categories | A1 |
| 2 | Add `?export=sprites-atlas-only` + `F9` shortcut | A2, A3 |
| 3 | CombinationsPreview — numeric shortcuts | A4 |
| 4 | Generate PNG, write `docs/ART_AUDIT.md` | B |
| 5 | Polish pass — enemies (highest-impact first) | C |
| 6 | Polish pass — bosses | C |
| 7 | Polish pass — card + weapon icons | C |
| 8 | Scaffold `src/art/sprites/` layout + README | D1 |
| 9 | Move decorations to modular files | D2 |
| 10 | Move enemies + verify `?export` diff is clean | D3 |

Remaining refactor passes (bosses, icons, pickups, projectiles, HUD, fx) follow D3's template.

---

## Out of scope for this plan

- Variant-specific accessory placements (iron-belly's flatter body still floats the tam slightly — requires plumbing variant info through the accessory drawer contract; deferred to Phase 2).
- External art file imports — we stay 100% procedural.
- Animation tempo changes — that's a separate pass on `frameClock.ts`.
- Sound / music — different pillar.
