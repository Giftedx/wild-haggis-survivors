# Codebase Restructure Implementation Plan

> **STATUS:** Phases 0–4 + 6 + 7 SHIPPED, Phase 5 IN PROGRESS (Buckets 2-5a shipped 2026-05-08). Phase 0+1 (LOC ratchet + `save.ts` split) on 2026-05-07; Phase 2+3 (sprite icons + i18n namespaces) on 2026-05-08; **Phase 4 (HUD per-widget builders) — 12 builders under `src/ui/hud/`, HUD 1222→1097 LOC**; **Phase 6 (JuiceSystem sub-system split) — bossSpectacle / evolutionSpectacle / vignette under `src/systems/juice/`, JuiceSystem 1374→1059 LOC**; **Phase 7 (re-baseline ratchet + `docs/LOC_BUDGET.md` policy doc)**; **Phase 5 audit doc + Bucket 2 (rune-system controller) — GameScene 2874→2706 LOC**; **Bucket 3 (moor moments) — GameScene 2706→2616 LOC**; **Bucket 4 (`launchActIntermission` slim-down) — GameScene 2616→2533 LOC**; **Bucket 5a (weapon-multiplier fold extracted to `scenes/game/weaponMultiplierFold.ts`) — GameScene 2533→2519 LOC**. Phase 5 Bucket 5 (remaining per-frame extracts) + Bucket 6 (`create()` install modules) open.
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce structural debt across the seven biggest files in the codebase, install a regression guard, and continue the established helper-extraction pattern from `scenes/game/` and `entities/` rather than introducing new abstractions.

**Architecture:** Seven independent phases, each shippable on its own. Phase 0 installs a LOC ratchet test that locks today's values as the ceiling. Phases 1–6 each lower one ceiling by mechanically extracting siblings under a new directory and re-exporting from a barrel. The barrel pattern preserves the public import surface (39 importers of `save.ts`, 105 importers of `core/i18n`), so zero consumer churn. Phase 7 re-baselines the ratchet at the new floor.

**Tech Stack:** TypeScript, Vitest, Vite, Phaser 4, Playwright. No new deps.

---

## Verified problems (audit summary 2026-04-30)

| File | LOC (wc -l) | Smell |
|------|-------------|-------|
| `src/core/i18n.ts` | 4719 | 21 namespace keys in one object literal |
| `src/core/i18n.scs.ts` | 4009 | mirror of above |
| `src/scenes/GameScene.ts` | 2983 | T401 charter target ≤1200 — regrew from 1656 floor |
| `src/utils/save.ts` | 1837 | 52 exports: types + schema + migrations + 20 bumpers + queries + IO |
| `src/art/sprites/icons/cards.ts` | 1722 | 22 `draw*` fns + bake switch |
| `src/art/sprites/icons/weapons.ts` | 1611 | same shape as cards.ts |
| `src/art/sprites/croft/seasonalProps.ts` | 1546 | per-prop drawers in one file |
| `src/entities/Enemy.ts` | 1564 | mixed concerns — **out of scope (hot path, ≤300 LOC yield)** |
| `src/entities/Player.ts` | 1537 | already heavily factored — **out of scope** |
| `src/systems/JuiceSystem.ts` | 1374 | 8 sub-systems integrated, helpers already extracted |
| `src/art/sprites/decorations/biomeProps.ts` | 1093 | per-biome drawers |
| `src/ui/HUD.ts` | 1222 | `build()` is 272 LOC inline |

**Out of scope:** Player.ts, Enemy.ts, banter.ts, AudioSystem.ts. Reasoning: already factored or pure data or not god-shaped.

---

## Phase 0 — LOC budget ratchet

**Why first:** without a ratchet, each split phase will leak back as new features land in the orchestrator. The ratchet at today's values locks the ceiling immediately. Each subsequent phase lowers its file's entry.

### Task 0.1: Install LOC ratchet test

**Files:**
- Create: `src/utils/locBudget.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC_ROOT = join(__dirname, '..');

/**
 * Ceiling values in lines (wc -l). Each entry: file path relative to src/, max LOC.
 *
 * Lower an entry only after that file has been split. Never raise.
 *
 * Baseline: 2026-04-30 audit. Charter target for GameScene: ≤1200 (T401 spec).
 */
const LOC_BUDGET: ReadonlyArray<readonly [string, number]> = [
  ['core/i18n.ts', 4720],
  ['core/i18n.scs.ts', 4010],
  ['scenes/GameScene.ts', 2985],
  ['data/banter.ts', 2240],
  ['utils/save.ts', 1840],
  ['art/sprites/icons/cards.ts', 1725],
  ['art/sprites/icons/weapons.ts', 1615],
  ['entities/Enemy.ts', 1570],
  ['art/sprites/croft/seasonalProps.ts', 1550],
  ['entities/Player.ts', 1540],
  ['systems/JuiceSystem.ts', 1380],
  ['scenes/SettingsScene.ts', 1350],
  ['systems/WeaponSystem.ts', 1330],
  ['scenes/GameOverScene.ts', 1310],
  ['ui/HUD.ts', 1225],
  ['systems/AudioSystem.ts', 1210],
  ['art/sprites/decorations/biomeProps.ts', 1095],
];

describe('LOC budget ratchet', () => {
  for (const [relPath, ceiling] of LOC_BUDGET) {
    it(`${relPath} ≤ ${ceiling} LOC`, () => {
      const abs = join(SRC_ROOT, relPath);
      const lines = readFileSync(abs, 'utf-8').split('\n').length;
      expect(
        lines,
        `${relPath} grew to ${lines} LOC (ceiling ${ceiling}). Either split the file or raise the ceiling intentionally — never silently.`,
      ).toBeLessThanOrEqual(ceiling);
    });
  }
});
```

- [ ] **Step 2: Run test to verify it passes against today's baseline**

Run: `npm test -- locBudget`
Expected: PASS (17 it-blocks, all green) — confirms baselines are correct.

- [ ] **Step 3: Verify the ratchet bites if a file grows**

Temporarily lower one ceiling by 1, run test, confirm fail, restore.

```bash
# Manual sanity check — adjust core/i18n.ts ceiling to 4719, run, confirm fail, revert.
```

- [ ] **Step 4: Commit**

```bash
git add src/utils/locBudget.test.ts
git commit -m "test(loc-budget): ratchet top-17 file ceilings at 2026-04-30 baseline"
```

---

## Phase 1 — `save.ts` split

**Why second:** lowest-risk mechanical split. 52 well-named exports, one module-state Map, 39 importers all reachable through a barrel re-export. Warms up the team's split muscle and verifies the gate (lint + vitest + tsc + e2e) catches anything unexpected.

**Outcome:** `src/utils/save.ts` becomes a barrel re-exporting from `src/utils/save/`. Zero importer churn.

### Task 1.1: Scaffold `save/` directory with type-only module

**Files:**
- Create: `src/utils/save/types.ts`

- [ ] **Step 1: Read the type interfaces from current save.ts**

Read `src/utils/save.ts` lines 78–480 to capture: `SaveSettings`, `RunHistoryEntry`, `SaveData`, `RunSummary`, `RunHistoryContext`, `RunResult`, `PersonalBests`, plus the `VariantProgressSnapshot` type they reference.

- [ ] **Step 2: Move all interface + type declarations into `save/types.ts`**

Pure cut-paste. Add `export` to each. No logic, no constants.

```typescript
// src/utils/save/types.ts
// Move all `export interface` and `export type` from save.ts.
// Imports from save.ts that types reference must come along (e.g. BiomeId, RouteSlot).

export interface SaveSettings { /* ...verbatim from save.ts:78-84 */ }
export interface RunHistoryEntry { /* ...verbatim from save.ts:85-140 */ }
export interface SaveData { /* ...verbatim from save.ts:141-349 */ }
export interface RunSummary { /* ...verbatim from save.ts:350-371 */ }
export interface RunHistoryContext { /* ...verbatim from save.ts:372-436 */ }
export interface RunResult { /* ...verbatim from save.ts:437-480 */ }
export interface PersonalBests { /* ...verbatim from save.ts:1351-1356 */ }
```

- [ ] **Step 3: Re-export types from save.ts barrel**

Edit `src/utils/save.ts` to remove the now-moved type declarations and replace with:

```typescript
export type {
  SaveSettings,
  RunHistoryEntry,
  SaveData,
  RunSummary,
  RunHistoryContext,
  RunResult,
  PersonalBests,
} from './save/types';
```

- [ ] **Step 4: Run all gates**

```bash
npm run lint
npm test
npm run build
```

Expected: all green. The `npm run build` step is critical — vitest passes can hide tsc shape errors (per `feedback_test_runner_vs_tsc` memory).

- [ ] **Step 5: Commit**

```bash
git add src/utils/save.ts src/utils/save/types.ts
git commit -m "refactor(save): extract types module under save/"
```

### Task 1.2: Extract schema constants + IO

**Files:**
- Create: `src/utils/save/schema.ts`
- Create: `src/utils/save/io.ts`
- Modify: `src/utils/save.ts`

- [ ] **Step 1: Move schema constants to `schema.ts`**

```typescript
// src/utils/save/schema.ts
export const SAVE_SCHEMA_VERSION = 17;
export const COASTAL_BIOMES: ReadonlySet<string> = new Set(['loch', 'pine']);
export const BURNS_EVOLUTION_THRESHOLD = 7;
export const MAX_RUN_HISTORY = 20;
export const REPLAY_HISTORY_CAP = 5;
export const LAST_DEATH_TTL_MS = 24 * 60 * 60 * 1000;
```

(Take exact values from `src/utils/save.ts` lines 35, 44, 51, 69, 1065, 1331.)

- [ ] **Step 2: Move IO functions to `io.ts`**

```typescript
// src/utils/save/io.ts
import type { SaveData } from './types';
import { /* migrateSave will be in migrations.ts (Task 1.3) — for this commit, import from save.ts */ migrateSave } from '../save';

const SAVE_KEY = 'whs_save';

export function createDefaultSave(): SaveData { /* verbatim from save.ts:481-494 */ }
export function loadSave(): SaveData { /* verbatim from save.ts:495-504 */ }
export function writeSave(data: SaveData): SaveData { /* verbatim from save.ts:505-517 */ }
```

- [ ] **Step 3: Update barrel**

```typescript
// src/utils/save.ts (now barrel + remaining helpers)
export * from './save/types';
export * from './save/schema';
export * from './save/io';
// ... keep remaining functions in save.ts until extracted in later tasks
```

- [ ] **Step 4: Run gates**

```bash
npm run lint && npm test && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/utils/save.ts src/utils/save/schema.ts src/utils/save/io.ts
git commit -m "refactor(save): extract schema + io modules"
```

### Task 1.3: Extract migrations

**Files:**
- Create: `src/utils/save/migrations.ts`
- Modify: `src/utils/save.ts`

- [ ] **Step 1: Move migration chain**

Move all 14 internal `migrateV*ToV*` functions (lines 723–888 in current save.ts) plus the public `migrateSave` (line 525), `finalizeSaveCandidate` (line 890), `migrateLegacySave` (line 723), and the `coerceDiscoveryLog` / `coerceStringArray` / `buildProgressSnapshot` / `normalizeRunSummary` helpers to `migrations.ts`.

Import types from `./types`, schema constants from `./schema`.

- [ ] **Step 2: Update io.ts circular dep**

Now that `migrateSave` lives in `migrations.ts`, fix the import in `io.ts`:

```typescript
// src/utils/save/io.ts
import { migrateSave } from './migrations';
```

- [ ] **Step 3: Update barrel**

```typescript
// src/utils/save.ts
export * from './save/types';
export * from './save/schema';
export * from './save/migrations';
export * from './save/io';
```

- [ ] **Step 4: Run gates**

```bash
npm run lint && npm test && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/utils/save.ts src/utils/save/migrations.ts src/utils/save/io.ts
git commit -m "refactor(save): extract migration chain"
```

### Task 1.4: Extract bumpers

**Files:**
- Create: `src/utils/save/bumpers.ts`
- Modify: `src/utils/save.ts`

- [ ] **Step 1: Move all bump* functions + module-state Map**

Move the 20+ `bump*` functions (lines 1399–1700 in current save.ts) to `bumpers.ts`. Critically: `beastieKillBuffer` Map (line 1557) and `flushBeastieKills` go together with `bumpBeastieKilled` — they share state.

```typescript
// src/utils/save/bumpers.ts
import { loadSave, writeSave } from './io';
import type { SaveData } from './types';

const beastieKillBuffer = new Map<string, number>();

export function bumpBossKillCount(bossKey: string): void { /* verbatim */ }
export function bumpCursedVictoryByBoss(bossKey: string): void { /* verbatim */ }
export function bumpBeastieKilled(beastieKey: string): void {
  const current = beastieKillBuffer.get(beastieKey) ?? 0;
  beastieKillBuffer.set(beastieKey, current + 1);
}
export function flushBeastieKills(): void {
  if (beastieKillBuffer.size === 0) return;
  /* verbatim from save.ts:1591-1614 */
}
// ... all other bump* functions verbatim
```

- [ ] **Step 2: Update barrel**

Add `export * from './save/bumpers';` to `save.ts` barrel and delete the moved fns from save.ts.

- [ ] **Step 3: Run gates**

```bash
npm run lint && npm test && npm run build
```

- [ ] **Step 4: Verify single-source-of-truth for `beastieKillBuffer`**

```bash
grep -n "beastieKillBuffer" src/utils/save*.ts src/utils/save/*.ts
```

Expected: appears only in `src/utils/save/bumpers.ts`. If it appears anywhere else, the Map has been duplicated and bump/flush will diverge — fix immediately.

- [ ] **Step 5: Commit**

```bash
git add src/utils/save.ts src/utils/save/bumpers.ts
git commit -m "refactor(save): extract bumpers + colocate beastieKillBuffer"
```

### Task 1.5: Extract history, queries, variants — finalise barrel

**Files:**
- Create: `src/utils/save/history.ts`
- Create: `src/utils/save/queries.ts`
- Create: `src/utils/save/variants.ts`
- Modify: `src/utils/save.ts`

- [ ] **Step 1: Move history functions**

`recordRun`, `applyRunSummary`, `appendRunHistory`, `wipeIronmoorHistory`, `wipeIronmoorHistoryInPlace`, `recordPostBellBest`, `recordIronmoorBest`, `recordLastDeath`, `consumeLastDeath` → `history.ts`.

- [ ] **Step 2: Move queries**

`getPersonalBests`, `getWinRate`, `isLastDeathFresh`, `isCoastalOnlyRun`, `computeGoldReward` → `queries.ts`.

- [ ] **Step 3: Move variants**

`evaluateVariantUnlocks`, `coerceSelectedVariant`, `progressSnapshotFromSave` → `variants.ts`.

- [ ] **Step 4: Final barrel**

```typescript
// src/utils/save.ts (final state)
export * from './save/types';
export * from './save/schema';
export * from './save/migrations';
export * from './save/io';
export * from './save/bumpers';
export * from './save/history';
export * from './save/queries';
export * from './save/variants';
```

- [ ] **Step 5: Run gates + e2e smoke**

```bash
npm run lint && npm test && npm run build
npm run test:e2e -- --grep="save|persistence"
```

- [ ] **Step 6: Lower the ratchet ceiling**

Edit `src/utils/locBudget.test.ts` — change `'utils/save.ts'` ceiling from 1840 down to whatever the new barrel-only file is (expected ~10 lines). Run `wc -l src/utils/save.ts` to get exact value.

```typescript
// In LOC_BUDGET array:
['utils/save.ts', 15], // was 1840
```

- [ ] **Step 7: Commit**

```bash
git add src/utils/save.ts src/utils/save/ src/utils/locBudget.test.ts
git commit -m "refactor(save): finalise split — history+queries+variants modules, lower ratchet"
```

---

## Phase 2 — Sprite icon files split

**Why third:** four files >1000 LOC each (cards 1722, weapons 1611, seasonalProps 1546, biomeProps 1093). Each file is a `bake*Icons` switch + 20–25 independent `draw*` functions with no shared state. Pure mechanical.

**Outcome:** four directories of per-icon files; each `bake*` function imports from a registry index.

### Task 2.1: Split `cards.ts`

**Files:**
- Create: `src/art/sprites/icons/cards/<icon>.ts` (×22)
- Create: `src/art/sprites/icons/cards/index.ts`
- Modify: `src/art/sprites/icons/cards.ts`

- [ ] **Step 1: Enumerate the icon set**

```bash
grep -nE "^function draw\w+\(" src/art/sprites/icons/cards.ts
```

Expected output lists exactly 22 `draw*` functions (sporran, whiskyFlask, kilt, kiltSignature, tamOShanter, irnBru, lochWater, thistleCrown, highlandShield, tartanSash, statHealth, statSpeed, statPickup, statDamage, statDrift, statDefense, statUtility, statCooldown, statKnockback, runeGlyph, plus shared helpers `cardIconBg` and `darkenHex`).

- [ ] **Step 2: Move each `draw*` into its own file**

For example `cards/sporran.ts`:

```typescript
// src/art/sprites/icons/cards/sporran.ts
import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';

export function drawSporran(scene: Phaser.Scene): void {
  /* verbatim from cards.ts:41-124 */
}
```

Shared helpers `cardIconBg` and `darkenHex` go in `cards/_shared.ts` (underscore prefix marks internal).

- [ ] **Step 3: Build the registry index**

```typescript
// src/art/sprites/icons/cards/index.ts
import * as Phaser from 'phaser';
import { drawSporran } from './sporran';
import { drawWhiskyFlask } from './whiskyFlask';
// ...all 20 imports

const ICON_BAKERS: ReadonlyArray<[string, (scene: Phaser.Scene) => void]> = [
  ['sporran', drawSporran],
  ['whisky_flask', drawWhiskyFlask],
  // ...
];

export function bakeCardIcons(scene: Phaser.Scene): void {
  for (const [_key, draw] of ICON_BAKERS) {
    draw(scene);
  }
}
```

(Verify the actual texture-key naming convention by reading the original `bakeCardIcons` body in `cards.ts:1696-1722`.)

- [ ] **Step 4: Replace `cards.ts` with re-export**

```typescript
// src/art/sprites/icons/cards.ts (now barrel)
export { bakeCardIcons } from './cards/index';
```

- [ ] **Step 5: Run gates + visual smoke**

```bash
npm run lint && npm test && npm run build
npm run dev
# Manually open level-up screen — confirm card icons render. If any are magenta, the
# texture key in the registry doesn't match what BootScene/UpgradeCardsUI expects.
```

- [ ] **Step 6: Lower ratchet**

```typescript
['art/sprites/icons/cards.ts', 10], // was 1725
```

- [ ] **Step 7: Commit**

```bash
git add src/art/sprites/icons/cards.ts src/art/sprites/icons/cards/ src/utils/locBudget.test.ts
git commit -m "refactor(sprites): split cards.ts into per-icon registry"
```

### Task 2.2: Split `weapons.ts` (same pattern)

**Files:**
- Create: `src/art/sprites/icons/weapons/<icon>.ts`
- Create: `src/art/sprites/icons/weapons/index.ts`
- Modify: `src/art/sprites/icons/weapons.ts`

- [ ] **Step 1: Enumerate**

```bash
grep -nE "^function draw\w+\(" src/art/sprites/icons/weapons.ts
```

- [ ] **Step 2–7: Apply identical pattern as Task 2.1**

Each `draw*` to its own file under `weapons/`, registry in `weapons/index.ts`, barrel `weapons.ts` re-exporting `bakeWeaponIcons`. Lower ratchet `'art/sprites/icons/weapons.ts'` to ~10. Commit:

```bash
git commit -m "refactor(sprites): split weapons.ts into per-icon registry"
```

### Task 2.3: Split `seasonalProps.ts`

Same pattern. Each prop drawer to its own file under `art/sprites/croft/seasonalProps/`. Registry index. Barrel re-export. Lower ratchet. Commit:

```bash
git commit -m "refactor(sprites): split croft seasonalProps into per-prop registry"
```

### Task 2.4: Split `biomeProps.ts`

Same pattern. Each prop drawer to its own file under `art/sprites/decorations/biomeProps/`. Registry index. Barrel re-export. Lower ratchet. Commit:

```bash
git commit -m "refactor(sprites): split biomeProps into per-prop registry"
```

---

## Phase 3 — i18n per-namespace split

**Why fourth:** i18n.ts (4719 LOC) and i18n.scs.ts (4009 LOC) hold 21 independent namespaces in a single object literal. 105 importers — barrel preserves the surface. Two parity-fences (SCS→EN subset, EN→SCS scoped to `ui.banter.*`) test the assembled object — independent of file shape.

**Outcome:** `src/core/i18n/<namespace>.ts` × 21 + `src/core/i18n/index.ts` assembling `EN_STRINGS`. Same for `i18n.scs.ts`. The `t()` resolver, locale switching, and parity tests stay in the entry file.

### Task 3.1: Split EN namespaces

**Files:**
- Create: `src/core/i18n/<namespace>.ts` (×21)
- Create: `src/core/i18n/enStrings.ts`
- Modify: `src/core/i18n.ts`

- [ ] **Step 1: Move each namespace to its own file**

```typescript
// src/core/i18n/ui.ts
export const ui = {
  /* verbatim from i18n.ts:9-3060 (the entire ui: { ... } block contents) */
} as const;
```

Repeat for `captions`, `biomes`, `beastie`, `metaItem`, `curse`, `evolution`, `achievement`, `tutorial`, `weapon`, `boss`, `passive`, `variant`, `permanentUpgrade`, `upgradeCard`, `routes`, `nodes`, `ancestor`, `seasonalEvent`, `relics`, `runes`. (See `grep -nE "^  [a-z]\w+: \{" src/core/i18n.ts` for the exact top-level key list.)

- [ ] **Step 2: Assemble `enStrings.ts`**

```typescript
// src/core/i18n/enStrings.ts
import { ui } from './ui';
import { captions } from './captions';
import { biomes } from './biomes';
// ... all 21 imports

export const EN_STRINGS = {
  ui,
  captions,
  biomes,
  beastie,
  metaItem,
  curse,
  evolution,
  achievement,
  tutorial,
  weapon,
  boss,
  passive,
  variant,
  permanentUpgrade,
  upgradeCard,
  routes,
  nodes,
  ancestor,
  seasonalEvent,
  relics,
  runes,
} as const;

export type EnStrings = typeof EN_STRINGS;
```

- [ ] **Step 3: Slim `i18n.ts` to resolver + locale machinery**

The original `i18n.ts:4682+` already exports `en: EN_STRINGS`. Replace the inline EN_STRINGS literal with the import:

```typescript
// src/core/i18n.ts (slimmed)
import { EN_STRINGS, type EnStrings } from './i18n/enStrings';
import { /* SCS lazy-load infra unchanged */ } from './i18n.scs';

// Resolver (t function), locale switcher, ensureLocaleReady all stay verbatim.
// Only the EN_STRINGS literal is lifted out.
```

- [ ] **Step 4: Run gates including parity fence**

```bash
npm run lint && npm test -- i18n.locale && npm test && npm run build
```

The `i18n.locale.test.ts` parity fences are the critical regression check. If the SCS→EN subset fails, a top-level key is missing from EN_STRINGS — likely a typo in an `import` or assembly key.

- [ ] **Step 5: Lower ratchet**

```typescript
['core/i18n.ts', 200], // was 4720 — actual will depend on resolver size
```

- [ ] **Step 6: Commit**

```bash
git add src/core/i18n.ts src/core/i18n/
git commit -m "refactor(i18n): split EN strings into per-namespace modules"
```

### Task 3.2: Split SCS namespaces (same pattern)

**Files:**
- Create: `src/core/i18n.scs/<namespace>.ts` (×21)
- Create: `src/core/i18n.scs/scsStrings.ts`
- Modify: `src/core/i18n.scs.ts`

- [ ] **Step 1–4: Apply identical pattern as Task 3.1**

SCS has the same 21 namespaces. Mirror the structure. The lazy-load entry stays in `i18n.scs.ts` — it imports `SCS_STRINGS` from `i18n.scs/scsStrings.ts`.

- [ ] **Step 5: Run all parity fences**

```bash
npm test -- i18n.locale
```

Both fences (SCS→EN subset, EN→SCS banter-scoped) must pass.

- [ ] **Step 6: Lower ratchet + commit**

```typescript
['core/i18n.scs.ts', 100], // was 4010
```

```bash
git commit -m "refactor(i18n): split SCS strings into per-namespace modules"
```

---

## Phase 4 — HUD per-widget builders

**Why fifth:** `HUD.build()` is 272 LOC of inline widget construction (lines 230–502). Splitting into per-widget builder functions (each returns the widget element + adds to `this.elements`) makes individual widgets greppable in isolation and matches the helper pattern from `scenes/game/`.

**Outcome:** `src/ui/hud/<widget>.ts` × ~12 widgets, called from a slimmed `HUD.build()`.

### Task 4.1: Extract HP bar + Drift Mastery pip widgets

**Files:**
- Create: `src/ui/hud/hpBar.ts`
- Create: `src/ui/hud/driftPipStrip.ts`
- Modify: `src/ui/HUD.ts`

- [ ] **Step 1: Define widget builder shape**

```typescript
// src/ui/hud/hudWidget.ts
import * as Phaser from 'phaser';

export interface HudWidgetContext {
  scene: Phaser.Scene;
  viewport: { x: number; y: number; width: number; height: number; zoom: number };
  depth: number;
  uiScale: number;
  highContrastUi: boolean;
  addEl<T extends Phaser.GameObjects.GameObject>(el: T): T;
}
```

- [ ] **Step 2: Move HP bar builder**

```typescript
// src/ui/hud/hpBar.ts
import * as Phaser from 'phaser';
import { COLORS, COLORS_CSS } from '../../config';
import { textStyle } from '../textStyle';
import type { HudWidgetContext } from './hudWidget';

export interface HpBarRefs {
  bg: Phaser.GameObjects.Rectangle;
  fill: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
}

const HP_BAR_W = 140;
const HP_BAR_H = 16;

export function buildHpBar(ctx: HudWidgetContext): HpBarRefs {
  const d = ctx.depth;
  const bg = ctx.addEl(
    ctx.scene.add.rectangle(12, 12, HP_BAR_W, HP_BAR_H, 0x1a1420)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(d),
  );
  const fill = ctx.addEl(
    ctx.scene.add.rectangle(12, 12, HP_BAR_W, HP_BAR_H, COLORS.HP_RED)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(d + 1),
  );
  const text = ctx.addEl(
    ctx.scene.add.text(
      12 + HP_BAR_W / 2, 12 + HP_BAR_H / 2, '',
      textStyle('body', { color: COLORS_CSS.WARM_TAN }),
    ).setOrigin(0.5).setScrollFactor(0).setDepth(d + 2),
  );
  return { bg, fill, text };
}
```

- [ ] **Step 3: Use builders from HUD.build()**

Replace the inline HP bar block in `HUD.ts:236-242` with:

```typescript
const hpRefs = buildHpBar({
  scene: this.scene,
  viewport: this.getUiViewport(),
  depth: this.DEPTH,
  uiScale: this.uiScale,
  highContrastUi: this.highContrastUi,
  addEl: this.addEl.bind(this),
});
this.hpBarBg = hpRefs.bg;
this.hpBarFill = hpRefs.fill;
this.hpText = hpRefs.text;
```

(Note: `HP_BAR_W` and `HP_BAR_H` move from HUD class fields to widget-local constants. If they're referenced elsewhere in HUD.ts, re-export them from `hpBar.ts`.)

- [ ] **Step 4: Apply same pattern for `driftPipStrip`**

The Drift Mastery pip strip is a self-contained widget (per memory `project_w71_phase2_status.md` it shipped recently — see comment block in `HUD.ts:244-256`).

- [ ] **Step 5: Run gates**

```bash
npm run lint && npm test && npm run build
npm run dev
# Confirm HP bar + drift pip render correctly in-game.
```

- [ ] **Step 6: Commit**

```bash
git add src/ui/HUD.ts src/ui/hud/
git commit -m "refactor(hud): extract hp-bar + drift-pip widget builders"
```

### Task 4.2: Extract remaining widgets

**Files:**
- Create: `src/ui/hud/{level,gold,boss,weaponSlots,passiveSlots,shield,gripPips,whisky,act,daily,replay}.ts`
- Modify: `src/ui/HUD.ts`

- [ ] **Step 1: Map each `build()` block to a widget file**

Walk `HUD.ts:230-502`, identify each contiguous widget construction block, name it (level, gold, boss, weaponSlots, passiveSlots, shield, gripPips, whisky, act, daily, replay), extract using the same shape as `buildHpBar`.

- [ ] **Step 2: Each widget commit independently**

Avoid one massive commit. After each 1-2 widgets extracted: run gates, commit. Five smaller commits beat one huge one if a regression is found.

```bash
git commit -m "refactor(hud): extract level + gold widgets"
git commit -m "refactor(hud): extract boss bar + weapon-slots widgets"
git commit -m "refactor(hud): extract passive-slots + shield widgets"
git commit -m "refactor(hud): extract grip-pips + whisky-stacks widgets"
git commit -m "refactor(hud): extract act + daily + replay widgets"
```

- [ ] **Step 3: Final HUD.ts gates + ratchet**

```bash
npm run lint && npm test && npm run build
npm run test:e2e -- --grep="hud"
```

```typescript
['ui/HUD.ts', 600], // was 1225 — actual depends on what stays (update*, lifecycle)
```

- [ ] **Step 4: Final commit**

```bash
git commit -m "refactor(hud): finalise widget split + lower ratchet"
```

---

## Phase 5 — GameScene regression extraction

**Why sixth:** GameScene was 1656 LOC after T401 closed; now 2983. Roughly 1300 LOC of inline feature additions accumulated. Continuing the established `scenes/game/` helper pattern (already 126 files).

**Approach:** identify the regrowth wavefronts (recent feature commits that landed inline), extract each into a helper, lower the ratchet stepwise.

### Task 5.1: Identify regrowth wavefronts

**Files:**
- Create: `docs/superpowers/specs/2026-04-30-gamescene-regrowth-audit.md` (working notes only)

- [ ] **Step 1: Diff the GameScene against the last known-good floor**

```bash
git log --oneline --reverse src/scenes/GameScene.ts | head -50
# Find the commit closest to ~1656 LOC. Likely around the T401 closeout (commits 4ac13de/0506425/37187f8 per memory).
```

- [ ] **Step 2: Bucket the additions**

```bash
git diff <T401-tip>..HEAD -- src/scenes/GameScene.ts | grep "^+" | wc -l
```

Identify which features added LOC inline by reading method signatures grouped by feature concern. Likely buckets (per recent commits):
- Whisky Breath integration (commit 3ef289e)
- Drift Mastery pip wiring (commit 92ef0ed)
- Polaroid pickup handler (commit 586fadc)
- Ceilidh chain integration
- Post-bell/endless extensions
- Run-end persistence wiring growth

Each bucket = candidate for one helper file under `scenes/game/`.

- [ ] **Step 3: Write the audit doc**

```markdown
# GameScene Regrowth Audit

Floor: 1656 LOC (T401 closeout, commit 37187f8)
Current: 2983 LOC (2026-04-30)
Delta: +1327 LOC

## Buckets identified

| Bucket | LOC | Method names | Helper target |
|--------|-----|--------------|---------------|
| Whisky Breath | ~80 | spawnWhiskyPuddle, whiskyBreathTick | scenes/game/whiskyBreathOrchestrator.ts |
| Drift Mastery | ~60 | tickGripPips, gripBurstHandler | scenes/game/driftMasteryHud.ts |
| ...
```

(Fill in actual numbers from the diff. Don't invent.)

- [ ] **Step 4: Commit the audit**

```bash
git add docs/superpowers/specs/2026-04-30-gamescene-regrowth-audit.md
git commit -m "docs(scene-refactor): audit GameScene regrowth since T401 closeout"
```

### Task 5.2 — N: Extract each bucket as a helper

**Pattern (repeated per bucket):**

For each bucket in the audit:

- [ ] **Step 1: Create the helper module** under `src/scenes/game/<feature>Orchestrator.ts` (or similar, matching naming of siblings like `MoorMomentScheduler.ts`, `RelicOrchestrator.ts`, `BiomeController.ts`)

- [ ] **Step 2: Move the bucket's methods + private state** to the helper, with a constructor taking `GameScene` (matches `BiomeController` pattern per T401 spec §3) or a narrow hook interface (matches `LevelUpFlow`).

- [ ] **Step 3: GameScene retains only**: helper field + initialization in `create()` + delegation calls in `update()`.

- [ ] **Step 4: Add a vitest unit test** in the same dir (`<feature>Orchestrator.test.ts`) for any pure logic extracted — node env, no Phaser imports, per `feedback_test_runner_vs_tsc` (extract pure helpers from Phaser-touching code, test the helpers).

- [ ] **Step 5: Run gates per extraction**

```bash
npm run lint && npm test && npm run build
npm run test:e2e # full smoke after every 2 extractions, GameScene is high-blast-radius
```

- [ ] **Step 6: Lower the ratchet incrementally**

```typescript
['scenes/GameScene.ts', /* current LOC */], // was 2985
```

- [ ] **Step 7: Commit per extraction**

```bash
git commit -m "refactor(scene): extract <feature> orchestration to scenes/game/"
```

**Stop condition:** GameScene ≤1700 LOC, OR all buckets identified in audit are extracted, whichever comes first. Target ≤1200 from T401 spec is aspirational — lowering the ceiling under 1700 in one phase is realistic; pushing to 1200 may require entity-system rewiring out of scope here.

---

## Phase 6 — JuiceSystem sub-system split

**Why seventh:** JuiceSystem is 1374 LOC. Already heavily factored (9 helper imports). Three sub-systems remain integrated and could be lifted: boss spectacle (`bossDeathSpectacle`, `midRunBossDeathSpectacle` lines 912–1078), evolution spectacle (`evolutionSpectacle` 1080–1222), vignette (`drawVignette` 825–855 + state).

**Outcome:** -300 LOC from `JuiceSystem.ts`, three new helper modules under `src/systems/juice/`.

### Task 6.1: Extract boss spectacle

**Files:**
- Create: `src/systems/juice/bossSpectacle.ts`
- Modify: `src/systems/JuiceSystem.ts`

- [ ] **Step 1: Define the helper surface**

```typescript
// src/systems/juice/bossSpectacle.ts
import * as Phaser from 'phaser';
import type { TimeManager } from '../TimeManager';
// Other imports as needed

export interface BossSpectacleDeps {
  scene: Phaser.Scene;
  time: TimeManager;
  particlePool: Phaser.GameObjects.Arc[];
  ringPool: Phaser.GameObjects.Arc[];
  triggerScreenShake: (amp: number, durMs: number) => void;
}

export function playBossDeathSpectacle(x: number, y: number, deps: BossSpectacleDeps): void {
  /* verbatim from JuiceSystem.ts:912-998 */
}

export function playMidRunBossDeathSpectacle(x: number, y: number, deps: BossSpectacleDeps): void {
  /* verbatim from JuiceSystem.ts:1000-1078 */
}
```

- [ ] **Step 2: Update JuiceSystem to delegate**

```typescript
// src/systems/JuiceSystem.ts
import { playBossDeathSpectacle, playMidRunBossDeathSpectacle } from './juice/bossSpectacle';

bossDeathSpectacle(x: number, y: number): void {
  playBossDeathSpectacle(x, y, {
    scene: this.scene,
    time: this.time,
    particlePool: this.bossParticlePool,
    ringPool: this.bossRingPool,
    triggerScreenShake: (amp, dur) => { /* current shake call */ },
  });
}
```

- [ ] **Step 3: Run gates + visual smoke**

```bash
npm run lint && npm test && npm run build
npm run dev
# Trigger a boss kill — confirm particles + rings + shake match prior behaviour.
```

- [ ] **Step 4: Lower ratchet + commit**

```bash
git commit -m "refactor(juice): extract boss-spectacle sub-system"
```

### Task 6.2: Extract evolution spectacle (same pattern)

```bash
git commit -m "refactor(juice): extract evolution-spectacle sub-system"
```

### Task 6.3: Extract vignette + final ratchet drop

```bash
git commit -m "refactor(juice): extract vignette + lower ratchet"
```

---

## Phase 7 — Re-baseline + meta-doc

### Task 7.1: Re-baseline ratchet at new floor

**Files:**
- Modify: `src/utils/locBudget.test.ts`
- Create: `docs/LOC_BUDGET.md`

- [ ] **Step 1: Re-run wc on all entries**

```bash
wc -l src/scenes/GameScene.ts src/utils/save.ts src/core/i18n.ts src/core/i18n.scs.ts src/data/banter.ts src/art/sprites/icons/cards.ts src/art/sprites/icons/weapons.ts src/entities/Enemy.ts src/entities/Player.ts src/systems/JuiceSystem.ts src/scenes/GameOverScene.ts src/scenes/SettingsScene.ts src/systems/WeaponSystem.ts src/ui/HUD.ts src/systems/AudioSystem.ts src/art/sprites/croft/seasonalProps.ts src/art/sprites/decorations/biomeProps.ts
```

- [ ] **Step 2: Update each LOC_BUDGET entry** with the new value + small grace (~5 LOC) above the actual count.

- [ ] **Step 3: Write `docs/LOC_BUDGET.md`**

```markdown
# LOC Budget Ratchet

Test: `src/utils/locBudget.test.ts`
Policy: each top-of-file ceiling can only be **lowered**, never raised silently. Raising one requires a comment explaining why (e.g. "post-merge of feature X — to be split in follow-up Y").

## Why this exists

GameScene shipped to ≤1656 LOC under T401 (charter target ≤1200). Within four months it regrew to 2983 LOC as features landed inline. The ratchet locks the floor.

## Updating

Lower a ceiling: edit the constant, run tests.
Raise a ceiling: add an inline comment with the linked task that will lower it again.
```

- [ ] **Step 4: Commit**

```bash
git commit -m "test(loc-budget): re-baseline at post-restructure floor + doc policy"
```

---

## Verification gate (run after every task)

```bash
npm run lint && npm test && npm run build
```

For Phases 5 (GameScene) and any Phase touching scenes:

```bash
npm run test:e2e
```

For Phases 1–4 (mechanical splits): the build + unit tests are sufficient. E2E only needed for behaviour-touching changes (Phases 5–6).

## Risks + mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Barrel re-export name collision (`export *`) | Low | Each module has unique exports by responsibility; `npm run build` catches collisions immediately |
| Phaser texture-key drift in sprite splits (Phase 2) | Medium | Visual smoke (`npm run dev` + manual scene check) per sprite file; magenta placeholder is the tell |
| i18n parity-fence regression (Phase 3) | Low | Two existing parity tests run against the assembled object — independent of file shape |
| GameScene helper extraction breaks scene-reuse reset path (Phase 5) | Medium | Per task: confirm extracted helper has clean `reset()` or is reconstructed in `create()`. Per `feedback_finish_the_job.md`: don't ship until reset is verified by restart-mid-run smoke |
| save.ts module-state Map duplicated during extraction (Phase 1) | Low | Explicit grep check for `beastieKillBuffer` in Task 1.4 Step 4 |
| Vitest passes but tsc fails | Medium | `npm run build` is in every gate per `feedback_test_runner_vs_tsc.md` |
| LOC ratchet flapping on whitespace | Low | Each ceiling has +5 grace over actual; ratchet bites on accidental adds, not `git diff` noise |

## Sequence + dependencies

Phases 1, 2, 3, 4 are **independent** — can run in parallel as separate worktrees if desired. Phase 5 depends only on Phase 0. Phase 6 depends only on Phase 0. Phase 7 depends on whichever subset of 1–6 has shipped.

Recommended serial order if single-threaded:
1. Phase 0 (ratchet) — installs guardrail
2. Phase 1 (save.ts) — warm-up, lowest risk
3. Phase 2 (sprite icons) — mechanical, builds split-muscle
4. Phase 3 (i18n) — bigger but parity-fenced
5. Phase 4 (HUD widgets) — internal-only
6. Phase 5 (GameScene regression) — biggest leverage, do once others are warm
7. Phase 6 (JuiceSystem) — small final pass
8. Phase 7 (re-baseline) — locks new floor

## Out of scope (explicit)

- **Player.ts / Enemy.ts further-split** — already heavily factored via `entities/` siblings (driftMastery, whiskyBreath, burnLeapInput, dashReverseStumble, mantlePulse, playerLevelScaling, bagpipeLure, softBoundarySteer, playerGrowthScale, runeConsumer). Marginal yield, hot-path risk.
- **banter.ts split** — pure data, parity-fenced, splitting moves bytes without architectural payoff.
- **AudioSystem.ts split** — 1208 LOC orchestrator, not god-shaped, no obvious sub-system seams.
- **GameScene formal facade rewrite** — T401 charter named Combat/Progression/Nodes/Persistence facades + Orchestrator at 2-3 person-weeks. Continuing the helper pattern (proven in 126 files of `scenes/game/`) is lower-risk and gets the same LOC reduction.
- **Dynamic imports per i18n namespace** — premature. The static split + barrel is sufficient and Vite tree-shakes the assembled literal.
- **save.test.ts split** — 2220 LOC; mirror-split it after Phase 1 if a follow-up cleanup task is opened. Out of this plan to keep scope bounded.
