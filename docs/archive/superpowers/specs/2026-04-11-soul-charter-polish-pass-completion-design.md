# Soul Charter Polish Pass — Completion & Commit Design

**Date**: 2026-04-11
**Status**: Proposed
**Author**: Claude (Opus 4.6, 1M context) in collaboration with Michael
**Related**: `docs/DESIGN_SOUL.md` (Soul Charter), `AGENTS.md`, `CLAUDE.md`

## Background

The working tree contains 41 modified files and 9 new untracked files, all part of a coordinated "Soul Charter polish pass" that rewired player-facing surfaces to honor `docs/DESIGN_SOUL.md`. The charter is also untracked. All 136 tests pass and `npm run build` is green.

The user asked for a full audit: *"no loose threads of unfinished tasks remain"*. A full manual read of every file in the diff (scenes, systems, UI, data, core, entities, tests, infra) surfaced **27 distinct loose threads** in 6 categories.

The dominant finding is a **partial i18n migration**: the UI code migrated to call `t(card.name)`, `t(card.description)`, and the dictionary was populated for menus/HUD/GameOver/settings/bosses/tutorials — but the *data files* still hold literal English in `name`/`description` fields. Because `t()` on a non-key string returns the string unchanged, the call sites work in English but silently break any future locale. ~158 hardcoded English player-facing strings remain in `weapons.ts`, `upgrades.ts`, `permanentUpgrades.ts`, `enemies.ts`, and `variants.ts` + their helper functions.

The fix pattern is **already proven in the codebase**. `BalanceConfig.EVOLUTION_RECIPES` and `ACHIEVEMENT_DEFS` use `nameKey`/`descriptionKey` fields, and the i18n dictionary has `evolution.*` / `achievement.*` namespaces populated. `src/core/evolutionChest.ts:25-38` already adapts recipes to `UpgradeCard` by placing the i18n keys directly in `card.name`/`card.description`, which is why `UpgradeCards.ts:207` calls `t(card.name)` at all — it's designed to resolve keys. The other card arrays just never adopted the contract.

## Goals

1. Complete the Soul Charter polish pass so **every player-facing surface** honors the charter (warm tone, truthful HUD, accessibility kindness, craft coherence).
2. Leave **zero loose threads** — all 27 audit findings addressed or explicitly deferred with documented reason.
3. Land the work as **4 atomic, bisectable commits** so any future regression can be git-bisected to the exact introduction point.
4. Protect the charter by turning critical assumptions into tests where practical (charter Objective #2).

## Non-goals

- Any refactor unrelated to the audit findings.
- New features beyond fixing loose threads.
- Icon/accessibility schema expansion beyond HUD (charter Objective #3 defers this).
- Localization *beyond* extending the i18n infrastructure — no second locale is added.
- Rewriting the 41-file polish pass itself. The pass is strong; this spec completes it.

## Full Loose Thread Inventory

Findings from the end-to-end audit, grouped by category. Each row is a concrete fix.

### Category A — Trivial housekeeping (3 items)

| # | File | Fix |
|---|---|---|
| 1 | `docs/DESIGN_SOUL.md` untracked, referenced by `CLAUDE.md` + `AGENTS.md` | Stage & commit together in Commit 1 |
| 2 | `src/ui/uiSafeViewport.ts` orphaned (zero imports; `cameraViewport.ts` handles its use cases) | Delete in Commit 3 |
| 3 | `.gitignore` missing `.cursor/` and `.serena/` AI-tool metadata dirs | Add in Commit 2 |

### Category B — i18n data-file migration (11 items, ~158 strings)

All follow the `nameKey`/`descriptionKey` pattern already proven by `BalanceConfig.EVOLUTION_RECIPES`. Fixed in Commit 4.

| # | File | Strings | Fix |
|---|---|---:|---|
| 4 | `src/data/weapons.ts` | 16 | Add `nameKey`/`descriptionKey` to `WeaponDef`. Populate `weapon.<key>.name` / `weapon.<key>.description` in `EN_STRINGS`. |
| 5 | `src/data/upgrades.ts` | 67 | Same pattern on `UpgradeCard` — but since existing evolution-chest code already puts keys in the `name` field, store keys directly. Populate `upgradeCard.<id>.name` / `.description`. Move the level-5 evolution hint template to `upgradeCard.evolution_hint` with `{passive}` interpolation. |
| 6 | `src/data/permanentUpgrades.ts` | 34 | Add `nameKey`/`descriptionKey` to `PermanentUpgrade`. Populate `permanentUpgrade.<key>.name` / `.description`. |
| 7 | `src/data/enemies.ts` | 5 | Add `nameKey` to `BossConfig`. Populate `boss.<key>.name`. |
| 8 | `src/data/variants.ts` | ~24 | Add `nameKey`/`flavorKey` to `VariantDef`. Populate `variant.<key>.name` / `.flavor`. Rewrite `formatVariantModifierSummary`, `formatVariantUnlockText`, and `getVariantUnlockProgress` to use new `variant.summary.*` (speed/HP/armor/pickup/XP/dmg/drift/CDR/baseline) and `variant.unlock.*` (survive/bestKills/totalGold/victories/ready) key families. |
| 9 | `src/ui/UpgradeCards.ts:222` | 4 | `card.rarity.toUpperCase()` → `t('ui.common.rarity.' + card.rarity)`. Add `ui.common.rarity.common/uncommon/rare/legendary`. |
| 10 | `src/scenes/ShopScene.ts:117,123` | — | Use `t(upgrade.nameKey)` / `t(upgrade.descriptionKey)`. |
| 11 | `src/ui/HUD.ts:481-497` | 6 | The existing `ui.passive.pause_short.*` values (`'Sporran (+15% Luck)'`) are too long for HUD pill pills (which need 3-char abbreviations like `'SPR'`). **Decision: add a new `ui.passive.hud_abbrev.<key>` family** with short forms. HUD uses the new family; the pause overlay keeps using `pause_short`. |
| 12 | `src/scenes/MenuScene.ts:486-489` | 6 | `formatStatsStrip` builds `Best ${t}  \|  Kills ${k}  \|  ...`. Replace with `t('ui.menu.stats_line', { ... })`. Add `ui.menu.stats_short` and `ui.menu.stats_long` keys for the 1-line vs 2-line layouts. |
| 13 | `src/scenes/GameScene.ts:1587-1596` | — | `getRunBuildSummary` uses `weapon.config.name` — automatically fixed by #4. Update to `t(weapon.config.nameKey)`. Also convert the `Lv${level}` literal to `t('ui.hud.level_fmt', {level})`. |
| 14 | `src/scenes/GameScene.ts:1614` | — | `updateBossHPBar` uses `bossDef.name` — automatically fixed by #7. Update to `t(bossDef.nameKey)`. |

**Total new i18n keys**: ~158 (16 weapons + 5 bosses + 10 variants + 9 variant summary + 5 variant unlock + 34 permanent upgrades + 66 cards + 1 evolution hint + 4 rarities + 2 menu stats + 6 HUD passive abbrevs).

**New i18n namespaces being added**:
- `weapon.<key>.name` / `.description` — 16 keys
- `boss.<key>.name` — 5 keys
- `variant.<key>.name` / `.flavor` — 10 keys
- `variant.summary.*` — 9 keys (speed, hp, armor, pickup, xp, dmg, drift, cdr, baseline)
- `variant.unlock.*` — 5 keys (survive, bestKills, totalGold, victories, ready)
- `permanentUpgrade.<key>.name` / `.description` — 34 keys
- `upgradeCard.<id>.name` / `.description` — 66 keys
- `upgradeCard.evolution_hint` — 1 interpolated template
- `ui.common.rarity.*` — 4 keys
- `ui.menu.stats_short` / `ui.menu.stats_long` — 2 keys
- `ui.passive.hud_abbrev.<key>` — 6 keys (short 3-char forms for HUD pills; separate from existing `pause_short` which stays for the pause overlay)

All new strings MUST honor the warm Scots-tinged voice already established in the existing dictionary ("Hooves down — braw try", "Nae shame in it", "The glen remembers: {count} lifetime culls"). No cold system jargon. Scottish flavor in descriptions where natural.

### Category C — Accessibility gaps (2 items)

Fixed in Commit 3.

| # | File | Fix |
|---|---|---|
| 15 | `src/ui/HUD.ts:200-205` | Extend the `highContrastUi` block to cover all HUD text: `hpText`, `levelText`, `timerText`, `killText`, `pauseText`, `bossNameText`, plus the weapon slot strokes (darker outline with brighter accent). Currently only HP bg / XP bg / objective / DPS are recolored. |
| 16 | `src/systems/SpawnSystem.ts:242-266` | `showBossWarning` hardcodes 36px + `#ff4444`. Read `uiScale` and `highContrastUi` from `SettingsManager` in constructor (or lazily in the method), apply `fontSize * uiScale`, swap the red for a higher-contrast `#ffd8d8` and add a brighter stroke when `highContrastUi` is true. Boss warning is one of the Soul-critical moments — accessibility kindness applies. |

### Category D — Minor tone/craft (5 items)

Fixed in Commit 3.

| # | File | Fix |
|---|---|---|
| 17 | `src/entities/Enemy.ts:771-779` | Create `fx_snowflake` sprite texture in `BootScene.createHudChromeTextures()` (simple 10px white+blue snowflake shape). Replace `this.scene.add.text(..., '❄', ...)` with `this.scene.add.image(..., 'fx_snowflake')`. Matches the HUD's explicit "no emoji or font glyphs" principle (HUD.ts:58). |
| 18 | `src/scenes/MenuScene.ts:108` | Remove `.replace(' Survivors', '\nSurvivors')`. Update `ui.menu.title` in the dictionary to `"Wild Haggis\nSurvivors"` directly. The scene code just uses `t('ui.menu.title')`. |
| 19 | `src/scenes/MenuScene.ts:231` | **Decision: Vite `define` from `package.json`**. Add `define: { __APP_VERSION__: JSON.stringify(pkg.version) }` in `vite.config.ts` after importing `pkg` from `package.json` with `assert { type: "json" }`. Add ambient declaration in `src/global.d.ts` (or top of main.ts): `declare const __APP_VERSION__: string;`. MenuScene references `` `v${__APP_VERSION__}` ``. If `package.json` currently lags the displayed `v2.1`, bump `package.json` version to match as part of this fix. |
| 20 | `index.html:9` | Change `content="Survivor"` → `content="Haggis Survivors"` to match the `<title>`. |
| 21 | `src/main.ts:74` | aria-label English is acceptable since screen readers are locale-tied. Add a comment noting this is intentional: `// Screen-reader label intentionally in English — matches document lang="en". Add per-locale variants if/when localized builds ship.` No functional change. |

### Category E — Magic numbers (3 items)

Fixed in Commit 3.

| # | File | Fix |
|---|---|---|
| 22 | `src/ui/HUD.ts:297-298, 310` | Move the wave threshold ladder `[180, 420, 720, 1200]` into `BALANCE.hud.WAVE_DIFFICULTY_MARKS` as a typed array of `{minSec, label, color}`. Move the enemy cap `350` into `BALANCE.hud.ENEMY_WARN_THRESHOLD`. Use these in the HUD instead of literals so tuning stays single-sourced. |
| 23 | `src/systems/SpawnSystem.ts:331-332` | Add `BALANCE.enemies.ELITE_UNLOCK_SEC = 120`, `BALANCE.enemies.ELITE_SPAWN_CHANCE = 0.10`. Reference from SpawnSystem. |
| 24 | `src/data/enemies.ts:237 getSpawnWeight` | Lower priority, but add an inline comment explaining the magic numbers `(3, 10, 42)` — minimum weight, base weight, decay seconds. Leave as literals to minimize risk; a future tuning pass can move them to BALANCE. |

### Category F — Test updates (3 items, part of Commit 4)

| # | File | What changes |
|---|---|---|
| 25 | `src/data/upgrades.icons.test.ts:34,40,41` | Assertions currently check literal English (`'Ceòl Mòr Bagpipes Lv3'`, `'Sporran'`, `'treasure chest'`). Update to either (a) resolve via `t()` in the test and assert against the dictionary, or (b) assert on the new `nameKey`/`descriptionKey` fields directly. Option (b) is more stable. |
| 26 | `src/core/i18n.test.ts` | Add coverage for the new namespaces: assert that every `WEAPON_DEFS[k].nameKey` resolves, every `BOSSES[k].nameKey` resolves, every `VARIANTS[k].nameKey` resolves, every `PERMANENT_UPGRADES[k].nameKey` resolves. This becomes a **regression fence** against future drift — if someone adds a new weapon and forgets the i18n key, the test fails. |
| 27 | `src/ui/UpgradeCards.test.ts` | Test cards use literal `name: 'Damage Up'`. Update to use a real i18n key the mock can resolve — e.g. `name: 'upgradeCard.boost_damage.name'` and verify the rendered text resolves via the actual `t()` function. |

## Architecture

### i18n migration details

**Contract change**: `UpgradeCard.name` and `.description` become **i18n dot-path keys** instead of literal strings. This matches what `evolutionChest.evolutionRecipeToUpgradeCard` already does. The contract is: any `UpgradeCard.name` / `.description` is a key, and the UI resolves with `t()` at render time.

**Data interface additions**:

```typescript
// src/data/weapons.ts
interface WeaponDef {
  key: string;
  nameKey: string;        // new: e.g. "weapon.thistle_shot.name"
  descriptionKey: string; // new: e.g. "weapon.thistle_shot.description"
  // ... existing fields ...
  /** @deprecated Use t(nameKey) — kept for auto-battler debug logs only. */
  name: string;           // kept during migration for compatibility
  description: string;    // kept during migration for compatibility
}
```

Keep the old `name`/`description` fields populated with the literal English (equal to what `t(nameKey)` resolves to) during this commit, so debug logs and auto-battler output still work. A follow-up cleanup can drop them. This minimizes risk: existing non-player-facing code that reads `weapon.config.name` doesn't break immediately.

**Dictionary structure**:

```typescript
// src/core/i18n.ts — EN_STRINGS additions
weapon: {
  thistle_shot: {
    name: 'Thistle Shot',
    description: 'Fires sharp thistles at the nearest enemy.',
  },
  bagpipe_blast: {
    name: 'Bagpipe Blast',
    description: 'Periodic shockwave pushes enemies back.',
  },
  // ... 6 more ...
},
boss: {
  gordon: { name: 'Gordon the Chef' },
  tour_bus: { name: 'The Tour Bus' },
  // ... 3 more ...
},
variant: {
  classic: {
    name: 'Classic Haggis',
    flavor: 'The baseline beast. Crooked legs, straight ambition.',
  },
  // ... 4 more ...
  summary: {
    speed: '{sign}{pct}% speed',
    hp: '{sign}{val} HP',
    armor: '{sign}{val} armor',
    pickup: '{sign}{val} pickup',
    xp: '{sign}{pct}% XP',
    dmg: '{sign}{pct}% dmg',
    drift: '{sign}{pct}% drift',
    cdr: '{sign}{pct}% CDR',
    baseline: 'Baseline stats',
  },
  unlock: {
    survive: 'Survive',
    best_kills: 'Best kills',
    total_gold: 'Total gold',
    victories: 'Victories',
    ready: 'Requirement met',
  },
},
permanentUpgrade: {
  thick_hide: {
    name: 'Thick Hide',
    description: '+5% starting HP',
  },
  // ... 16 more, with warm Scottish-flavored descriptions where natural ...
},
upgradeCard: {
  add_bagpipe_blast: {
    name: 'Bagpipe Blast',
    description: 'Blasts of sound in a ring around ye — knocks foes outward.', // note warmer voice
  },
  // ... 32 more ...
  evolution_hint: ' At Lv 5, open a treasure chest while carrying {passive} to evolve.',
},
ui: {
  common: {
    rarity: {
      common: 'COMMON',
      uncommon: 'UNCOMMON',
      rare: 'RARE',
      legendary: 'LEGENDARY',
    },
  },
  menu: {
    stats_short: 'Best {bestTime}  |  Kills {bestKills}  |  Combo {bestCombo}x  |  Runs {totalRuns}  |  Wins {victories}  |  Gold {gold}',
    stats_long: 'Best {bestTime}  |  Kills {bestKills}  |  Combo {bestCombo}x\nRuns {totalRuns}  |  Wins {victories}  |  Gold {gold}',
  },
},
```

**Helper function rewrite** (`src/data/variants.ts`):

```typescript
// Before:
if (modifiers.moveSpeedPct) parts.push(`${formatSignedPercent(modifiers.moveSpeedPct)} speed`);

// After:
if (modifiers.moveSpeedPct) parts.push(t('variant.summary.speed', {
  sign: modifiers.moveSpeedPct > 0 ? '+' : '',
  pct: Math.round(modifiers.moveSpeedPct * 100),
}));
```

Same transformation for all eight modifier summaries and the four unlock labels.

### Commit 3 details

**Delete**: `src/ui/uiSafeViewport.ts` (dead module).

**`src/ui/HUD.ts`** high-contrast extension: create a private `highContrastPalette` record and apply it in `build()` when `this.highContrastUi`. Example:

```typescript
if (this.highContrastUi) {
  const hc = {
    text: '#f0f6ff',
    timer: '#fff4d0',
    kill: '#e0e8ff',
    boss: '#ff9595',
    bg: 0x060912,
    bgAlpha: 0.96,
    slotStroke: 0x8fb4ff,
  };
  this.hpBarBg.setFillStyle(hc.bg, hc.bgAlpha);
  this.xpBarBg.setFillStyle(hc.bg, hc.bgAlpha);
  this.objectiveText.setColor('#e6efff');
  this.dpsText.setColor('#d9e4ff');
  this.hpText.setColor(hc.text);
  this.levelText.setColor(hc.text);
  this.timerText.setColor(hc.timer);
  this.killText.setColor(hc.kill);
  this.pauseText.setColor(hc.text);
  this.bossNameText.setColor(hc.boss);
  // Weapon slot strokes are applied when slots are (re)built — track via instance flag.
}
```

**`src/systems/SpawnSystem.ts` `showBossWarning` parameterization**: read settings in constructor (stash `uiScale` + `highContrastUi`), apply to the text size and color. Boss warning gets a subtle but meaningful accessibility nod.

**`src/scenes/BootScene.ts` `createHudChromeTextures` addition**: add `fx_snowflake` alongside `hud_shield` / `hud_dash_pip_*`. 10x10px white base + blue accent.

**`src/entities/Enemy.ts:771`**: replace text with image sprite. Tween mostly unchanged (position + alpha + destroy).

**`vite.config.ts` / new `src/version.ts`**: expose `APP_VERSION` at compile time. `MenuScene:231` reads from it. If the simplest path is just hardcoding `'v2.1.0'` and adding a comment to bump manually, that's acceptable — this is a minor polish item.

**`src/core/BalanceConfig.ts`**: add `hud` and extend `enemies` blocks:

```typescript
hud: {
  WAVE_DIFFICULTY_MARKS: [
    { minSec: 0,    label: 'I',   color: '#88cc88' },
    { minSec: 180,  label: 'II',  color: '#cccc44' },
    { minSec: 420,  label: 'III', color: '#dd8844' },
    { minSec: 720,  label: 'IV',  color: '#dd4444' },
    { minSec: 1200, label: 'V',   color: '#ff2222' },
  ] as const,
  ENEMY_WARN_THRESHOLD: 350,
},
enemy: {
  // ... existing ...
  ELITE_UNLOCK_SEC: 120,
  ELITE_SPAWN_CHANCE: 0.10,
},
```

HUD and SpawnSystem import and use these.

## Testing Strategy

1. **`npm test`** after each commit — all 136 existing tests must continue passing. The 3 test files in Category F get updated in Commit 4 alongside the migration.
2. **`npm run build`** after each commit — type check + Vite build must remain green. The new `nameKey`/`descriptionKey` fields being required on the data interfaces will flag any forgotten migration at compile time.
3. **New regression tests in Commit 4** (`src/core/i18n.test.ts`):
   - `every WEAPON_DEFS entry's nameKey resolves`
   - `every BOSSES entry's nameKey resolves`
   - `every VARIANTS entry's nameKey and flavorKey resolve`
   - `every PERMANENT_UPGRADES entry's nameKey and descriptionKey resolve`
   - `every WEAPON_CARDS / PASSIVE_CARDS / STAT_CARDS entry's name and description resolve as valid i18n keys`
   - `ui.common.rarity.<rarity>` exists for all four rarities
   
   These fence against drift: a future weapon added to `WEAPON_DEFS` without i18n keys fails the test.
4. **Manual spot check** (user) of: run start identity toast, boss warning, level-up card copy, pause overlay passives, Shop screen, Meta Shop screen, Game Over screen. Confirm all strings resolve to warm Scots-tinged English and none show a bare dot-path like `weapon.thistle_shot.name`.
5. **Commit-level bisectability**: each commit passes `npm test && npm run build` on its own. `git bisect` works cleanly.

## Commit Plan (4 commits)

### Commit 1: `docs: introduce DESIGN_SOUL charter`

Files:
- `docs/DESIGN_SOUL.md` (new, from working tree)
- `CLAUDE.md` (add reference line from working tree)
- `AGENTS.md` (add reference line from working tree)

Body: short summary of the charter's role and why CLAUDE.md + AGENTS.md cite it. References `docs/DESIGN_SOUL.md`.

### Commit 2: `chore: ignore AI tool metadata directories`

Files:
- `.gitignore` — add `.cursor/` and `.serena/`

Body: one-liner explaining these are AI tool caches that shouldn't land in the repo.

### Commit 3: `feat(ux): Soul charter polish pass`

Files: **39 modified files** (41 modified minus the 2 that go to Commit 1: `CLAUDE.md` and `AGENTS.md`) plus **9 new files** (`src/core/GameSessionLifecycle.ts`, `src/core/GameSessionLifecycle.test.ts`, `src/data/upgrades.icons.test.ts`, `src/systems/JuiceSystem.test.ts`, `src/systems/SpawnSystem.ui.test.ts`, `src/ui/HUD.test.ts`, `src/ui/Minimap.test.ts`, `src/ui/UpgradeCards.test.ts`, `src/ui/cameraViewport.ts`) minus **1 deletion** (`src/ui/uiSafeViewport.ts`).

Commit 4 will *further modify* some of the same files (weapons.ts, upgrades.ts, enemies.ts, i18n.ts, i18n.test.ts, HUD.ts, MenuScene.ts, ShopScene.ts, UpgradeCards.ts, GameScene.ts, upgrades.icons.test.ts, UpgradeCards.test.ts) to add the i18n migration deltas. That's fine — each commit is self-consistent and passes `npm test`.

Contents:
- All 39 modified files as currently in the working tree (HUD, scenes, systems, core, tests).
- All 9 new untracked production/test files.
- Delete: `src/ui/uiSafeViewport.ts` (#2).
- Plus: HUD high-contrast extension (#15).
- Plus: SpawnSystem boss warning accessibility (#16).
- Plus: Enemy snowflake sprite (#17, requires new `fx_snowflake` texture added in BootScene's `createHudChromeTextures`).
- Plus: MenuScene title line-break via dictionary (#18) — updates `i18n.ts` entry for `ui.menu.title` to include `\n`, removes the `.replace()` call.
- Plus: MenuScene version constant (#19) — adds `vite.config.ts` define + ambient declaration + MenuScene reference.
- Plus: `index.html` apple-web-app-title fix (#20).
- Plus: `src/main.ts` aria-label comment (#21).
- Plus: `src/core/BalanceConfig.ts` `hud` block + `enemy.ELITE_*` additions (#22, #23), HUD + SpawnSystem reference the new keys instead of literals.
- Plus: Comment on `getSpawnWeight` magic numbers (#24).

The upgrades.icons.test.ts ships in this commit with its **current (English-literal) assertions** — they're updated in Commit 4 to resolve via `t()`. This is intentional: Commit 3 is the "polish pass shipped as-is" boundary, Commit 4 is the migration layer.

Body: summarize the polish pass intent and list the Soul Charter weave-matrix areas touched (run start, combat, level-up, failure, menus, accessibility). Note that the i18n migration for data-file strings follows in the next commit.

### Commit 4: `feat(i18n): complete data-file migration (~158 strings)`

Files (note which are *further-modified* vs *newly-modified* relative to Commit 3):

**Further-modified in this commit (already in polish pass, getting migration layer added):**
- `src/data/weapons.ts` — add `nameKey`/`descriptionKey` fields, keep legacy `name`/`description` literals in sync for non-player-facing consumers.
- `src/data/upgrades.ts` — convert card `name`/`description` values to keys, migrate evolution hint template, update `formatPassiveItemName` to return a resolved name via `t()` on the key.
- `src/data/enemies.ts` — add `nameKey` to `BossConfig` (keep `name` literal for auto-battler compatibility).
- `src/core/i18n.ts` — add ~158 new keys across `weapon.*`, `boss.*`, `variant.*`, `permanentUpgrade.*`, `upgradeCard.*`, `ui.common.rarity.*`, `ui.menu.stats_*`, `ui.passive.hud_abbrev.*`.
- `src/core/i18n.test.ts` — add regression-fence tests that every data-file key resolves.
- `src/ui/HUD.ts:481-497` — replace `PASSIVE_ABBREVS` with `t('ui.passive.hud_abbrev.<key>')`.
- `src/ui/UpgradeCards.ts:222` — rarity label via `t('ui.common.rarity.<rarity>')`.
- `src/scenes/ShopScene.ts:117,123` — use `t(upgrade.nameKey)` / `t(upgrade.descriptionKey)`.
- `src/scenes/MenuScene.ts:486-489` — `formatStatsStrip` via `t('ui.menu.stats_short'|'stats_long', { ... })`.
- `src/scenes/GameScene.ts:1587,1614` — `t(weapon.config.nameKey)` in `getRunBuildSummary`; `t(bossDef.nameKey)` in `updateBossHPBar`; also convert the `Lv${level}` literal to `t('ui.hud.level_fmt', {level})`.
- `src/data/upgrades.icons.test.ts` — update assertions (#25).
- `src/ui/UpgradeCards.test.ts` — test card uses a real i18n key (#27).

**Newly modified in this commit (previously untouched by the polish pass):**
- `src/data/permanentUpgrades.ts` — add `nameKey`/`descriptionKey` fields (currently has only literal `name`/`description`).
- `src/data/variants.ts` — add `nameKey`/`flavorKey`, rewrite `formatVariantModifierSummary`, `formatVariantUnlockText`, `getVariantUnlockProgress` to resolve through `t()`.

**New file (possibly):**
- `src/global.d.ts` if not already present, for the `__APP_VERSION__` ambient declaration (though that's actually part of Commit 3's #19 fix — if that landed in Commit 3, don't touch here).

Body: explain the partial-migration finding, the pattern used (matches `EVOLUTION_RECIPES`/`ACHIEVEMENT_DEFS`), the regression fence added to `i18n.test.ts`, and that every player-facing string is now routed through `t()`.

## Out of Scope (explicitly deferred)

- **Adding a second locale** — this spec only completes the infrastructure. A real localization effort is a separate project.
- **Cleaning up the legacy `name`/`description` literal fields** in data interfaces after the migration. Kept during this pass for auto-battler debug-log compatibility; a follow-up cleanup can delete them once all non-player-facing code is audited.
- **`getSpawnWeight` magic numbers** (#24) moved to comment-only. Full extraction deferred to a future balance-tuning pass.
- **`src/main.ts:74` aria-label localization** — deferred with comment.
- **Icons/accessibility foundation expansion** — charter Objective #3 says defer.

## Risks

| Risk | Mitigation |
|---|---|
| Breaking a test I haven't seen | Full `npm test` after each commit. Test files that need updating are enumerated in Category F. |
| i18n migration introduces subtle text bugs (missing interpolation vars, wrong key) | The new regression fence in `i18n.test.ts` asserts every data-file key resolves to a defined value. Manual spot check of all player-facing surfaces in step 4 of testing strategy. |
| `nameKey`/`descriptionKey` added as required fields breaks TypeScript for code that constructs data objects inline in tests | Add them as required on the interface; tests that construct data objects inline get updated in Commit 4 alongside the migration. |
| Dictionary additions have tonal drift from existing Scots voice | All new strings reviewed against the existing `EN_STRINGS` voice before writing. User is the final reviewer on tone — they wrote "Hooves down — braw try" and set the bar. |
| Auto-battler or analytics code that reads `weapon.config.name` breaks | Keep legacy `name`/`description` literal fields populated during this commit. They stay in sync with `t(nameKey)` because they have identical English content. |
| `'v2.1'` → version constant change has runtime import implications | Use a simple module-level constant or Vite `define`. Fall back to a hardcoded literal with a comment if the build config path is fiddly. |
| New BALANCE keys break test mocks | The tests that mock BALANCE (few) only read existing keys; additions don't break them. |

## Success Criteria

1. `git diff main..HEAD --stat` shows 4 commits with clean separations.
2. All 136 existing tests + ~5 new regression-fence tests pass.
3. `npm run build` is green.
4. Every player-facing string in the game now routes through `t()`, and every key used resolves to a defined dictionary entry.
5. The accessibility settings (`uiScale`, `highContrastUi`) are respected on every HUD element and the boss warning banner.
6. `src/entities/Enemy.ts` has zero unicode emoji in its runtime output.
7. `uiSafeViewport.ts` is deleted; `.gitignore` excludes AI tool dirs; `DESIGN_SOUL.md` is committed.
8. A manual spot check of run start → combat → level-up → boss → game over confirms warm Scottish tone throughout and no placeholder-feeling text.

## Open Questions (to resolve before implementation)

None. Scope is fully specified. The user has approved:
- Full data-file i18n migration (152 strings).
- Full manual read of all 41 files (done).
- 4-commit structure.
- Category E (magic numbers) included.

Ready for user review of this spec, then implementation plan via `writing-plans`.
