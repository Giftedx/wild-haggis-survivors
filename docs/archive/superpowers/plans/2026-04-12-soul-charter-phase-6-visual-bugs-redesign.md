# Phase 6 — Visual Review, Bug Hunt, and Redesign Plan

> **STATUS:** ✅ SHIPPED — findings doc; converted into subsequent Phase-6 visual-bug plans (per `superpowers/plans/INDEX.md` "Soul + voice + art canon").
>
> **For agentic workers:** This is a FINDINGS + PLAN document. It enumerates every issue caught during a live-browser visual audit of Wild Haggis Survivors after Phases 1–5 of the Soul Charter polish pass landed. It is **not** yet a TDD task breakdown — it is the research step that precedes one. A subsequent `writing-plans` pass will convert the "Proposed Work" sections into concrete task blocks.

**Goal:** Capture every visual issue, bug, and redesign opportunity observed in a real browser running the game, grouped by severity and surface, so the user can pick what to fix and in what order.

**Method:**
1. Started the dev server with the preview browser at 1280×720
2. Bypassed Boot splash (rAF-throttled in headless context) and navigated to each scene via `window.game.scene.start('...')`
3. Captured screenshots at every surface: MainMenu, Menu (loadout), Game (combat), Level-up cards, Settings, Shop, MetaShop, GameOver (death + victory)
4. Inspected live Phaser state via `preview_eval` — text content, positions, colors, scene status flags, HUD element properties
5. Read the latest code for the lifecycle boundary surfaces (TimeManager, GameScene create/shutdown, HUD update path) with a "what could be broken?" mindset
6. Synthesized findings against the Soul Charter, with priorities and proposed work

**Current state:** 7 commits on local `master`, 149 tests passing, build green. Everything below is **additive** to that baseline.

---

## Part 1 — Visual Bugs (actual defects, not opinions)

These were observed in screenshots or inspect output. They are defects, not polish.

### Bug V1 — Wave indicator reads "WI" as one word

**Severity:** HIGH (visible on every frame of the HUD during normal gameplay)
**Surface:** HUD objective row, top-center
**Evidence:** screenshot shows `"WI  •  Goal 14:44"`. Inspect confirmed `objectiveText: "WI  •  Goal 14:39"`.
**Root cause:** `src/core/i18n.ts` line: `wave_objective: 'W{wave}  •  {goal}'`. When the wave is `"I"`, the template interpolates `"W" + "I"` with zero separator.
**Fix (one character):** change to `'W-{wave}  •  {goal}'` or `'Wave {wave}  •  {goal}'`. Recommend `'Wave {wave}  •  {goal}'` for clarity.

### Bug V2 — Variant flavor text truncates below its natural length

**Severity:** HIGH (players never see the full variant flavor)
**Surface:** `MenuScene` variant carousel
**Evidence:** Screenshot shows `"The baseline beast. Crooked legs, str..."` for Classic Haggis. True string: `"The baseline beast. Crooked legs, straight ambition."` (51 chars). `"A scavenger of glens and glittering s..."` for Glen Forager, truncating `"spoils."`.
**Root cause:** `src/scenes/MenuScene.ts:302` calls `this.truncateLine(t(variant.flavorKey), 42)`. Limit = 42, but 4 of 5 flavor texts exceed that:
- Classic: 51
- Moor Runner: 44
- Iron Belly: 56
- Glen Forager: 43
- Surefoot: 51
**Fix options:**
- (A) Bump `truncateLine` limit to 60 (keeps the single-line guarantee, just more generous).
- (B) **Recommended:** switch to Phaser's `wordWrap: { width: ~300 }` and let it flow to 2 lines. This respects long strings in future locales.
**Note:** `GameScene.showRunIdentityToast` also truncates at 52 chars for transient toast copy — that one is OK (short visible time).

### Bug V3 — SettingsScene doesn't apply its own uiScale

**Severity:** HIGH (functional ugliness — player can't visually preview their setting change)
**Surface:** Settings screen
**Evidence:** Read of `src/scenes/SettingsScene.ts` — no `getSettingsManager().load()` call in `create()`, no `.setScale(uiScale)` calls on any text. All other scenes (MenuScene, MainMenuScene after Phase 5, GameOverScene, HUD, BossWarning) respect it.
**Root cause:** Pure omission from the Phase 3 accessibility work.
**Fix:** Read `uiScale` + `highContrastUi` in `create()`, apply `.setScale(uiScale)` to every text and toggle/button rect, swap to high-contrast palette (similar to `MainMenuScene` pattern from Phase 5d).

### Bug V4 — HUD passive pill fallback shows unclear `"TAR"`

**Severity:** MEDIUM (visible only when the player picks Thistle Crown, Highland Shield, or Tartan Sash)
**Surface:** HUD passive slot row
**Evidence:** Screenshot showed `"TAR"` after the player picked up Tartan Sash. `src/core/i18n.ts ui.passive.hud_abbrev` only defines abbreviations for the 6 uncommon passives (`sporran`, `whisky_flask`, `kilt`, `tam_o_shanter`, `irn_bru`, `loch_water`). The 3 rare passives (`thistle_crown`, `highland_shield`, `tartan_sash`) fall back to `key.slice(0, 3).toUpperCase()`:
- `thistle_crown` → `"THI"`
- `highland_shield` → `"HIG"`
- `tartan_sash` → `"TAR"`
Each is ambiguous: `"THI"` could be Thistle Shot or Thistle Crown, `"HIG"` could be Highland Shield or Highland Claymore, `"TAR"` looks like black goo.
**Fix:** Add the 3 missing entries. Suggested short forms that disambiguate:
```typescript
thistle_crown: 'CRN',   // crown, not thistle
highland_shield: 'SHD', // shield
tartan_sash: 'SAS',     // sash
```

### Bug V5 — "Battle Hardened" description grammar

**Severity:** LOW (works in English, reads awkwardly)
**Surface:** Gold Shop (permanent upgrades)
**Evidence:** `"Scars harden into armor. Start each run with +2 of it."` — the `"it"` at the end refers to `"armor"` two sentences ago. Weak parse.
**Root cause:** Phase 5a rewrite. My first pass.
**Fix:** `"Scars harden into plate — begin each run with +2 armor."` or `"Old scars become armor. Start each run with +2 points of it."` (if we want to keep the "+2 of it" construction, clarify what "it" refers to immediately).

### Bug V6 — Variant "waits on an achievement" wraps awkwardly

**Severity:** LOW
**Surface:** MenuScene variant carousel, right-column status note
**Evidence:** Screenshot shows `"waits on / an achievement"` wrapping across two lines in the narrow right column (~170px `wordWrap`).
**Root cause:** The `wordWrap: { width: 170 }` on the `status_locked` text is too tight for the phrase.
**Fix options:**
- (A) Shorten the copy to fit: `"Locked — earn it"` (17 chars, fits on one line).
- (B) Widen the column.
- (C) Move the status to the bottom strip (full panel width).
**Recommend (A)** — shorter and warmer than current.

### Bug V7 — GameOver title sits very close to the top edge of its panel

**Severity:** LOW (aesthetic crowding)
**Surface:** GameOverScene (both death and victory)
**Evidence:** Screenshot shows `"Hooves down — braw try"` at y=86 inside a panel starting at y~=60. Only 26px of breathing room.
**Fix:** Shift the title down 12–16px or expand the panel up. Minor polish.

---

## Part 2 — Code Bugs (not user-visible today, real defects)

### Bug C1 — TimeManager physics adapter has no null guard

**Severity:** MEDIUM (reproduces on scene edge cases; caught live during the audit)
**File:** `src/systems/TimeManager.ts:25-32`
**Evidence:**
```
TypeError: Cannot read properties of null (reading 'isPaused')
  at Object.getPhysicsPaused (TimeManager.ts:12)
  at TimeManager.recomputeAndApply (TimeManager.ts:103)
  at TimeManager.request (TimeManager.ts:45)
  at GameScene.toggleUiPause (GameScene.ts:913)
```
Reproduced by calling `toggleUiPause()` from a scene context where `scene.physics.world` was null (briefly between a `stop` and `create` cycle).
**Root cause:** `createPhaserTimeAdapter` directly accesses `scene.physics.world.isPaused` / `.pause()` / `.resume()` without guarding against `scene.physics.world === null`. Also accesses `scene.time.timeScale` without guarding `scene.time`.
**Fix:**
```typescript
export function createPhaserTimeAdapter(scene: Phaser.Scene): TimeAdapter {
  return {
    setTimeScale: (v) => { if (scene.time) scene.time.timeScale = v; },
    pausePhysics: () => { scene.physics?.world?.pause(); },
    resumePhysics: () => { scene.physics?.world?.resume(); },
    getPhysicsPaused: () => scene.physics?.world?.isPaused ?? false,
  };
}
```
Add a regression test: mock a scene with `physics.world = null`, call `createPhaserTimeAdapter`, invoke all four methods, assert no throw.

### Bug C2 — Scene lifecycle: multiple scenes can be simultaneously active

**Severity:** LOW (not observed in normal user flow; caught only via eval)
**Surface:** Scene manager
**Evidence:** After I manually called `window.game.scene.start('MainMenu')` from outside a scene context (Boot still running the splash tween), I observed `active: ['MainMenu', 'Game']` at some later point. Gameplay was running (level 5, 37 kills) without user input.
**Root cause (likely):** When `SceneManager.start(key)` is called externally, it does not stop the calling context's previous scene. I left Boot running, and whatever later transitioned to Game (possibly the stuck splash tween eventually firing its `onComplete` and starting MainMenu again → some normal flow I didn't trace) chained into Game.
**Risk in normal flow:** LOW — inside a scene, `this.scene.start(key)` correctly stops the caller. The bug only manifests when code outside a scene (debug API, test harness, auto-battler) triggers scene transitions.
**Fix (defensive):** In dev only, log a warning if `getScenes(true).length > expected` (2 when HUD scene is layered, typically). Consider adding a test-only helper `SceneManager.cleanStart(key)` that calls `stop` on everything else first.
**Decision:** Document but don't fix unless it reproduces in real gameplay. This was caused by my poking during the audit.

### Bug C3 — `SpawnSystem.showBossWarning` reads settings on every invocation

**Severity:** LOW (performance, not functional)
**File:** `src/systems/SpawnSystem.ts:245-250` (Phase 3 added this)
**Evidence:** My Phase 3 fix reads `getSettingsManager().load()` inside `showBossWarning()`, which is called once per boss spawn. That's fine — but if SettingsManager.load() has any JSON-parse / coerce overhead, it runs each spawn.
**Fix:** Cache settings in the SpawnSystem constructor and re-read only when `SettingsChanged` event fires (no event exists yet — would need adding). Or: do nothing (5 boss spawns per run × one load each is negligible).
**Decision:** Defer. Not worth the complexity unless perf becomes an issue.

### Bug C4 — `lucky_start` permanent upgrade may pick a passive already owned

**Severity:** LOW (minor edge case in permanent upgrades)
**File:** `src/scenes/GameScene.ts:1015-1021`
**Evidence:**
```typescript
const luckyStart = ups['lucky_start'] ?? 0;
if (luckyStart > 0) {
  const passiveKeys = ['sporran', 'whisky_flask', 'kilt', 'tam_o_shanter', 'irn_bru', 'loch_water'];
  const randomPassive = passiveKeys[Math.floor(Math.random() * passiveKeys.length)];
  this.ownedPassives.push(randomPassive);
  this.applyPassiveEffect(randomPassive);
}
```
Hardcoded 6 uncommon passives. No check against the 3 rare passives (`thistle_crown`, `highland_shield`, `tartan_sash`). Also, if the player has other starting passives (from variant or from another perk), this could push duplicates into `ownedPassives`, which would then prevent normal level-up draws of that passive but the effect is already applied twice.
**Fix:** (1) deduplicate `ownedPassives` after the push; (2) move the passive keys list to a shared constant (DRY — the same list is also duplicated in the `applyPassiveEffect` switch).
**Decision:** Fix in the same plan pass as V4 (the passive-key consolidation effort).

### Bug C5 — `uiSafeViewport.ts` was deleted in Phase 3 but similar code exists in cameraViewport

**Severity:** LOW (historical, not a current bug)
**Context:** Phase 3 correctly deleted `uiSafeViewport.ts` as orphaned. Noting for memory — the logic is fully handled by `cameraViewport.ts`.

### Bug C6 — No regression test for "variant data file migrations stay through render"

**Severity:** MEDIUM (a class of bug the Phase 5d fence catches for access patterns but not for render paths)
**Context:** The Phase 5d static fence test (added to `i18n.test.ts`) checks source-file patterns like `variant.name` but cannot catch a future refactor that reintroduces literal-field access through a different pattern (e.g. through a helper function that returns `variant.name`).
**Fix:** Add a runtime integration test that:
1. Renders each scene to a headless Phaser instance.
2. Queries the text objects on each scene.
3. Asserts none contain raw English literals that match the `weapon.*.name` / `boss.*.name` / etc. dictionary values if a `test` locale is swapped in.
4. Requires swapping in a fake locale where every string is replaced by a sentinel like `__TEST__<key>__`, then scanning rendered text for any non-sentinel string.
**Complexity:** Moderate (headless Phaser integration test). Fence for a class of issue that already manifested once. Worth it.

---

## Part 3 — Layout & Responsiveness Issues

### Layout L1 — MainMenuScene has ~176px of dead space

**Severity:** HIGH (first surface the player sees; charter "Cozy between storms" violated)
**Surface:** MainMenuScene
**Evidence:** Screenshot shows title/subtitle/hint top cluster ends at y≈196, buttons start at y≈372. That's a 176px vertical gap of pure empty dark background. No mascot, no ambient motion, no heather, nothing.
**Compare:** MenuScene (loadout) has a bouncing haggis mascot, enemy silhouette drift in the background, animated title sway. It's warm.
**Proposed redesign** (detailed in Part 5).

### Layout L2 — SettingsScene has ~380px of dead space

**Severity:** MEDIUM
**Evidence:** Last toggle (High-contrast UI) at y≈280, BACK button at y≈660. 380px of unused vertical space.
**Fix options:**
- (A) Add more settings (color-blind mode, keybinds display, credits link).
- (B) Pull the BACK button up closer to the last toggle (~y=360 instead of y=660).
- (C) Add a preview card showing how the current settings look ("ABILITY: SWIFT" text demo that re-renders on scale/contrast change).
- (D) Add ambient decoration (small heather, same pattern as MenuScene).
**Recommend (B) + (D)** — compact up and cozy.

### Layout L3 — MetaShopScene has ~430px dead space (only 4 items)

**Severity:** MEDIUM (content, not layout)
**Evidence:** Screenshot shows 4 items (Sprint Boots, Thick Pelt, Magnetic Whiskers, Highland Temper) at top, massive empty below, BACK button at bottom.
**Root cause:** `src/data/metaShopItems.ts` only defines 4 items.
**Fix option (A):** **Expand the meta progression content.** Add more tiers (Sprint Boots II/III, Thick Pelt II/III), more categories (regen, crit, cooldown, dash). Concrete suggestions in Part 5.
**Fix option (B):** Compact the layout to 2 columns so 4 items fill the available height better.

### Layout L4 — Level-up cards could be larger

**Severity:** LOW
**Evidence:** Screenshot showed 3 cards at roughly 160×240 on a 1280-wide canvas. The cards take up less than half the screen horizontally.
**Fix:** Up card width to ~210 (already the `maxCardW` in UpgradeCards.ts, which is being capped by the hover-expansion math). Inspect the sizing formula in `UpgradeCards.ts:100-108` — it reserves room for `hoverScale` (1.05×), which is unnecessary if we just use `setScale` for hover instead of allocating reserved space.

### Layout L5 — Minimap is tiny and hard to parse

**Severity:** MEDIUM (gameplay utility)
**Evidence:** 110×110 minimap in bottom-right. At this size, enemy dots are ~1px and the player dot is ~2.5px. Very hard to read during combat.
**Fix:** Bump to 150×150 default, scale with `uiScale`. Also: make the player dot larger and add a direction indicator (small triangle pointing the way the haggis is moving).

### Layout L6 — HUD dash readiness row is cramped and easy to miss

**Severity:** MEDIUM
**Evidence:** Dash prefix + pip + suffix at fontSize 12px, tucked beside the HP bar. Easy to miss during heated combat. The player needs to know at a glance when dash is ready.
**Fix options:**
- (A) Bump dash row to 14px.
- (B) Add a subtle golden glow around the pip when dash is ready (animated).
- (C) Move dash row below the HP bar as its own line.
**Recommend (A) + (B)**.

---

## Part 4 — Copy Issues

### Copy K1 — Zero-state copy is chilly on first launch

**Severity:** MEDIUM (first impression problem)
**Surfaces:**
- MainMenu: `"The glen remembers: 0 lifetime culls"` on a fresh save.
- Shop: `"0 golden haggis tucked away"` on a fresh save.
- MetaShop: `"0 culls banked for the long road"` on a fresh save.
- GameOver: `"no weapon tally this time"` only if you die before firing a shot (already warm via `ui.gameOver.no_weapon_damage`).
**Issue:** The warm templates work for >0 states but a new player sees zero everywhere. The copy should differentiate.
**Fix:** Add first-run (`count === 0`) variants:
- `ui.menu.kill_credits_fresh: 'The glen stirs — the first run begins.'`
- `ui.shop.gold_bank_fresh: 'An empty wallet, for now — the moor pays those who return.'`
- `ui.metaShop.kill_credits_fresh: 'The long road starts here.'`
**Call sites** check `if (count === 0)` and pick the fresh variant.

### Copy K2 — MetaShop achievement references are cold

**Severity:** LOW
**Surface:** MetaShop locked items
**Evidence:** `"Needs: Heather Marathon"` and `"Needs: Cull of the Glen"` reference achievement titles but don't explain what the player has to do. A new player sees these and has to go hunting.
**Fix:** Add a one-line hint after the title: `"Needs: Heather Marathon (survive 10 minutes in one run)"`. Requires wiring the achievement's `descriptionKey` as well as its `titleKey` into the meta shop row.

### Copy K3 — Controls hint position is bottom of screen but the player is center

**Severity:** LOW
**Surface:** GameScene controls hint toast
**Evidence:** Controls hint at `y + height - 36`. A new player looking at the haggis in the center never looks there in the first 5 seconds. Easy to miss.
**Fix:** Place the hint closer to the player (e.g. y=player.y + 80) or add a gentle arrow. Or — already shown at 30s timeout with the toast stack — leave as is and trust the 30-second dwell time.
**Decision:** Accept current behavior.

---

## Part 5 — Redesign Opportunities (the rethink section)

### Redesign R1 — MainMenuScene: from austere to cozy hearth

**Motivation:** Charter principle 4 ("Cozy between storms") is violated on the first surface. Player opens the game → flat dark background with 3 buttons. That's the opposite of welcoming.

**Proposed redesign:**

**Background layer:**
- Parallax sky gradient (same as GameScene highland terrain but stationary)
- Distant mountain silhouette at 40% opacity
- Mist particles drifting slowly across
- 6–10 ambient enemy silhouettes drifting in the background at 8% opacity (lifted from MenuScene pattern)

**Foreground layer:**
- Sleeping haggis mascot curled up near the title, doing the same bob/sway tween as the MenuScene mascot
- A small "campfire" detail with animated flicker (a few colored rectangles pulsing) near the buttons — a visual "hearth" anchor
- Small heather sprites scattered around the button area

**Title treatment:**
- Current: 36px monospace, centered, static
- Proposed: 48px monospace, 2-line with existing newline, center-top, with a gentle `y += sin(t)*2` bob tween like the MenuScene title. Stroke thickness bump from 0 to 3 for weight.

**Button group:**
- Current: 240×48 centered column, 14px gaps
- Proposed: same dimensions, but positioned lower (y=360→y=320 so the hint→button gap shrinks from 176px to 100px)
- Add a subtle bottom-aligned strip showing: `v{APP_VERSION}` (already there) + `"built on the moor"` + link to credits

**Zero-state copy:**
- Fresh save: `"The glen stirs — the first run begins."`
- After run 1: `"The glen remembers: {count} lifetime culls"` (existing)

**Accessibility:** All mascot/campfire decoration must respect `reduceParticles` — skip the flicker if the setting is on. All text respects `uiScale` and `highContrastUi`.

**Gamepad navigation:** Unchanged — 3 buttons, same focus order.

### Redesign R2 — MetaShop: expand content + rebalance layout

**Motivation:** 4 items is insufficient for a meta progression system that's meant to "follow ye from run to run". Players with hundreds of lifetime culls have nothing meaningful to spend them on.

**Proposed new meta items** (all additions to `src/data/metaShopItems.ts`, new i18n keys in `metaItem.*`):

Tier 2 / 3 of existing stats:
- `speed_tier_2` — Sprint Boots II — +15% speed (cost 200 culls, needs `ach_survive_10m`)
- `speed_tier_3` — Sprint Boots III — +20% speed (cost 500, needs `ach_defeat_taxman`)
- `health_tier_2` — Thick Pelt II — +15% max HP (cost 200, needs `ach_survive_10m`)
- `health_tier_3` — Thick Pelt III — +20% max HP (cost 500, needs `ach_defeat_taxman`)
- `damage_tier_2` — Highland Temper II — +10% damage (cost 300, needs `ach_defeat_taxman`)

New categories:
- `regen_tier_1` — "A bit of the moor's grace" — +0.2 HP/sec (cost 100)
- `crit_tier_1` — "A sharper eye" — +3% crit (cost 150)
- `dash_tier_1` — "A lighter step" — -10% dash cooldown (cost 150, needs `ach_kills_1000`)
- `xp_tier_1` — "A quicker study" — +5% XP gain (cost 100)

That's **13 meta items total** (existing 4 + 9 new). At that count, the layout can remain single-column and fill the screen vertically without the dead space.

**Also:** integrate the achievement description into the "Needs:" line per Copy K2 fix.

### Redesign R3 — SettingsScene: cozy + preview + fix own uiScale

**Motivation:** Ironic gap in accessibility + sterile layout + missing live preview.

**Proposed changes:**

1. **Settings respects its own uiScale + highContrast** (Bug V3 fix).
2. **Volume sliders** — replace the `-/+` buttons with a horizontal bar + drag handle. More intuitive and visually satisfying.
3. **Live preview card** at the top-right of the settings panel showing: a sample HUD HP bar + a sample objective text + a sample upgrade card thumbnail, all rendered with the current settings. Updates in real time as the player adjusts sliders. This is the **hardest but highest-value** addition: players see what their settings DO.
4. **Ambient decoration** — small heather sprites drifting in the background, matching MenuScene (and the proposed MainMenu).
5. **Pull BACK button up** to immediately below the last toggle, closing the dead space.
6. **Add a "Reset to defaults" row** (with a confirmation dialog).

### Redesign R4 — HUD: rebalance the top-left cluster

**Motivation:** The top-left is dense: HP bar, level text, weapon slots, shield icon, dash row, passive pills. At uiScale 1.2+ or highContrast, it gets cramped.

**Proposed** (non-breaking):
- Move the passive pills row to the BOTTOM-left of the screen (below DPS).
- Give the dash row more horizontal room by moving it ABOVE the HP bar (currently below).
- Shield icon becomes a subtle glow around the HP bar instead of a separate icon (when active).

**Layout:** If feasible, the HUD should have three stable column groups:
- Top-left: HP bar + level + weapon slots (no passives)
- Top-center: timer + objective
- Top-right: kill count + pause button
- Bottom-left: DPS + passive pills
- Bottom-right: minimap

### Redesign R5 — Level-up cards: cozy moment, not transaction

**Motivation:** Level-up is one of the "Progression beats" from the charter. The cards currently land cleanly but the moment could be bigger.

**Proposed adds:**
- Subtle music duck + reverb tail when the level-up screen opens (hooks into `ProceduralMusicEngine` — needs a `setAmbientMode()` call or similar).
- The chosen card animates to the player's HUD with a trail instead of just disappearing.
- Pulsing golden particles around the legendary card (already exists in `UpgradeCards.ts:155-189`), but amplify for "first legendary" moment.
- Rarity label becomes a pill tag instead of plain text, with the rarity color as background.

**Out of scope for first pass:** music duck (requires new API).

### Redesign R6 — Minimap: larger + direction indicator + threat color coding

**Proposed:**
- Default size 150×150 (up from 110×110), scaled by `uiScale`.
- Player dot 4px (up from 2.5px), rendered as a small triangle oriented by `player.rotation`.
- Elite dots 2px (up from 1.5px), gold color.
- Boss dots 4px diamond (up from 3px).
- Chest dots unchanged.
- Background: darker (0x000000 @ 0.55 instead of 0.4) + 2px stroke (up from 1).
- Optional: a thin red edge line on the minimap when the player is within 200px of a world boundary (warning zone).

### Redesign R7 — Variant unlock celebration on Game Over

**Motivation:** The variant chip at the TOP of the game over panel (`"This run: Classic Haggis"`) is small (13px). The NEW VARIANT unlock at the BOTTOM is big (26px name). Asymmetric celebration.

**Proposed:** Beef up the variant chip on game over — bigger, with the variant's flavor text under the name. Something like:
```
THIS RUN
Classic Haggis
The baseline beast. Crooked legs, straight ambition.
```

And for the unlock: keep current treatment + add a small animation (sparkle burst around the name).

---

## Part 6 — Content Gaps (not bugs, but observed voids)

### Content G1 — Only 3 achievements exist

**File:** `src/core/BalanceConfig.ts` `ACHIEVEMENT_DEFS`
**Current:** `ach_kills_1000`, `ach_survive_10m`, `ach_defeat_taxman`.
**Gap:** Compared to the rich meta-progression content the game could support, 3 achievements is very few. No "first evolution" achievement, no "first variant unlocked" achievement, no "no-damage boss kill", etc.
**Proposed new achievements:**
- `ach_first_evolution` — "Legend Forged — evolve any weapon for the first time"
- `ach_first_victory` — "The Moor Is Yours — defeat the Taxman for the first time" (replaces some of `ach_defeat_taxman` which is this + kills_1000)
- `ach_unlock_all_variants` — "The Herd Grows — unlock every variant"
- `ach_combo_100` — "Storm Chaser — reach 100 kill combo"
- `ach_survive_25m` — "Endurance of Stone — survive the full run cycle (25m)"
- `ach_no_damage_boss` — "Flawless — defeat any boss taking zero damage"

### Content G2 — Only 5 variants

**File:** `src/data/variants.ts`
**Current:** `classic`, `moor_runner`, `iron_belly`, `glen_forager`, `surefoot`.
**Observation:** 5 variants is a solid starting count but room exists for:
- `pipe_breath` — wind + music themed — speed + AoE + -max HP
- `blood_kin` — aggressive — +damage + lifesteal + -armor
- `moorweaver` — controller — +pickup + -cooldown + -damage
**Decision:** Defer. Variant creation requires art (new textures in BootScene) + balance work. Track as future.

### Content G3 — No "cozy interactions" in the non-combat scenes

**Observation:** The charter says "Cozy between storms". Currently the non-combat scenes (MainMenu, Menu, Shop, MetaShop, Settings, GameOver) are functional panels. None have:
- Ambient SFX (wind, distant bagpipes, campfire crackle)
- Interactive easter eggs (click the mascot, it wiggles)
- Seasonal variation (different mascot pose or background hue based on lifetime kills)

These are all **real cozy additions** but substantial scope each.

---

## Part 7 — Priority-Sorted Proposed Work

Grouped by severity × effort. Each item is ready for a TDD task block in a future `writing-plans` pass.

### Tier A: Ship immediately (bugs, small, visible)

**Effort: <1 hour total**

1. **V1** Wave indicator — change `'W{wave}  •  {goal}'` → `'Wave {wave}  •  {goal}'` + update any test asserting the old format.
2. **V2** Variant flavor text — switch to `wordWrap` or bump `truncateLine(42)` → `truncateLine(60)`.
3. **V3** SettingsScene uiScale/highContrastUi — read settings in `create()`, apply to every text, match `MainMenuScene` pattern.
4. **V4** HUD passive abbreviations — add 3 missing entries (`thistle_crown`, `highland_shield`, `tartan_sash`) to `ui.passive.hud_abbrev`.
5. **V5** Battle Hardened grammar — rewrite to remove the "+2 of it" pronoun.
6. **V6** "waits on an achievement" — shorten to `"Locked — earn it"` or similar.
7. **V7** GameOver title spacing — shift title 12px down inside panel.
8. **C1** TimeManager null guards — 4-line defensive fix + regression test.
9. **K1** Zero-state copy — 3 new i18n keys + 3 call-site conditionals.

**Test impact:** V1 breaks 1 test (the objective text assertion in HUD.test if any), C1 adds 1 test. Net: +1 test, commit as one small atomic PR.

### Tier B: High-value polish (layout/feel, medium)

**Effort: 3–6 hours each**

10. **L1 / R1** MainMenu redesign — ambient enemies, mascot, campfire, tighter button group, zero-state copy. The biggest single Soul impact.
11. **L5 / R6** Minimap redesign — larger, direction indicator, threat colors.
12. **L6** HUD dash row — bigger font + pulsing glow on ready.
13. **L2 / R3** SettingsScene cozy — compact BACK, ambient decoration, volume sliders.

### Tier C: Content expansion (new features, large)

**Effort: 6–10 hours each**

14. **R2** MetaShop content expansion — 9 new meta items + rebalance layout. Also fixes K2 (achievement hints).
15. **G1** Achievement expansion — 6 new achievements + unlock logic in `AchievementManager.ts`.
16. **R4** HUD top-left reorganization — move passives to bottom-left, reshuffle the cluster.

### Tier D: Experimental / nice-to-have

**Effort: 10+ hours each, design decisions required**

17. **R5** Level-up cozy moment — music duck, card trail, legendary amplification.
18. **R7** Variant chip celebration on GameOver.
19. **C6** Runtime integration test for i18n — headless Phaser scene rendering + locale-sentinel verification.
20. **G2** Variant expansion — 3 new variants.
21. **G3** Cozy interactions — ambient SFX, easter eggs, seasonal variation.

---

## Part 8 — What I'm NOT proposing (out of scope decisions)

- **Rewriting the Phaser scene architecture.** It works. Scenes are appropriately decomposed, the TimeManager pattern is solid, the juice system is effective.
- **New art** (beyond sprites generated in BootScene). External assets are out of charter-cost range.
- **Localization to a second language.** The i18n infrastructure is ready; actually translating is a separate project.
- **Touching the music engine internals.** The procedural music system is carefully constructed; my reviews should be observational.
- **Gameplay rebalancing.** The numbers (HP, damage, cooldown scaling) are an in-flight tuning concern that predates this Soul pass. I won't touch them.

---

## Part 9 — What the user should decide before implementation

1. **Tier A (9 items)** — ship as one commit? Or split by category (V-bugs separate from C-bugs separate from copy)?
2. **Tier B priorities** — which redesign do you want first? My recommendation: **MainMenu (L1 / R1)** because it's the first impression and it's the biggest Soul win.
3. **Tier C scope** — do you want to expand meta progression now, or defer until gameplay/balance is stable?
4. **Tier D** — any of these you want to greenlight?
5. **Cozy direction specifically** — the charter's "Cozy between storms" is the most underserved principle. Do you want me to lean HARD into that (campfire, mascot interactions, ambient SFX) or keep the game focused on combat feel?
6. **Font discipline** — monospace is used everywhere. Do you want me to propose a display font (e.g. for titles and boss names) and keep monospace only for HUD numerics? This is a significant craft shift.

---

## Part 10 — Proposed next commit flow

Once the above is decided, the sequence:

1. **Spec commit**: a narrower spec that takes the chosen Tier A / B items and details each.
2. **Plan commit**: TDD task breakdown via `writing-plans`.
3. **Implementation commits**: one per logical chunk:
   - `fix(hud): wave indicator spacing, passive abbrevs, dash row prominence`
   - `fix(settings): apply own uiScale, tighten layout`
   - `fix(core): TimeManager null guards`
   - `copy: zero-state variants for first-run chill`
   - `feat(ux): MainMenu cozy redesign` (the big one)
   - `feat(meta): expand meta shop content + achievement descriptions`
   - ... etc.

Each commit stays atomic, bisectable, tested, and shippable independently.

---

## Attachments: raw observations

### Scenes walked
- Boot (skipped splash in preview due to rAF throttling)
- MainMenu ✓ screenshot
- Menu (loadout) ✓ screenshot + variant carousel at `classic` and `glen_forager`
- Game (combat) ✓ screenshot
- Level-up cards ✓ screenshot
- GameOver death ✓ screenshot
- GameOver victory ✓ screenshot
- Settings ✓ screenshot
- Shop ✓ screenshot
- MetaShop ✓ screenshot

### Not walked (acceptable — read code instead)
- Pause overlay (crashed TimeManager during capture; code reviewed in Phase 3)
- Boss warning banner (code reviewed in Phase 3; tests cover the accessibility fix)
- Tutorial modals (read code in Phase 5)

### Runtime metrics observed
- 149 tests passing at the start of this phase
- Build green (`tsc --noEmit` + vite build)
- Canvas: 1280×720 in preview
- 8 scenes registered
- PWA manifest correctly shipped

### Decisions made during research
- Did NOT fix any bugs during the audit. This is strict findings-only.
- Did NOT commit any code changes. Only this plan document will be committed.
- Did NOT invoke any implementation skill. Next step is user decision → narrower spec → plan → implementation.
