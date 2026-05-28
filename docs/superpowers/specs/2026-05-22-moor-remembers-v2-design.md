# The Moor Remembers V2 — Cailleach Gauntlet

**Date:** 2026-05-22
**Initiative:** V2 of The Moor Remembers (V1 shipped same day, [`2026-05-22-the-moor-remembers-design.md`](2026-05-22-the-moor-remembers-design.md)). Promotes the per-run cairn-touch count into a stakes event — touch seven cairns by 14:00 and the Cailleach answers.
**Status:** Shipped 2026-05-22.
**Word count target:** ~1,800.
**Prerequisite:** Moor Remembers V1 shipped (`src/scenes/game/CairnOfEchoesScheduler.ts`, `src/utils/save/fallenCairns.ts`, save schema v10 with `fallenCairns` + `oldDroverRevealedCount`).

---

## 1. Problem statement

V1 made the moor remember — every death leaves a persistent cairn. Walking over one fires a whispered past-self line and a +1 % inherited buff. Over weeks of play the moor fills with the player's history.

V1 is **complete as a fixture** but does not yet **earn the count it tracks**. Touching cairns is currently a soft drip — each one a small inheritance, each one independent of the next. There is no answer when the count crosses a threshold; the moor logs and forgets.

This is a missed beat. The cairns are visually evocative — a moor sown with the player's failures — but mechanically inert beyond their +1 % drip. A player who has shed twenty haggises has earned a *moment*, not just twenty drips.

V2 turns the count into a summoning. Touch seven distinct cairns in a single run and the **Cailleach Gauntlet** triggers: at the 14:00 game-time mark seven candles light around the player in a Callanish-circle formation, and at 15:00 the Cailleach herself walks out of the haar to claim the haggis who dared count too high. Win, and the seven cairns are **wreathed** — gold-tinted, double-buffed, permanent monuments. Lose, and the seven are **extinguished** — slate-quiet, the candles snuffed, but the cairns themselves remain because the moor does not forget.

### Player outcome

After Cailleach Gauntlet ships:

- A run that walks past seven cairns earns its own boss — not a route boss, not a scheduled spawn, but a *folkloric reckoning*. The first time it happens the player will not know what they have done; the candle-lighting at 14:00 is the warning beat.
- The closing sixty seconds between candle-lighting and Cailleach's arrival become the most loaded minute of the run. The candles flicker around the player as they fight ordinary enemies, knowing what comes.
- A wreathed cairn looks different from a neutral cairn looks different from an extinguished cairn — the moor visibly records the gauntlet outcomes. A long-played save's moor becomes a chronicle of attempts.
- The **Stormcrown** relic drops on win, providing a thematic boss-damage + on-crit-freeze proc. The **Cailleach's Mantle** cosmetic (winter-palette tartan + small cold-mist trail at player feet) unlocks via the "Crown the Cailleach" achievement.

---

## 2. Design risks

**Risk 1 — Boss difficulty without telemetry.**
Cailleach must be hard enough that the gauntlet feels earned but not so hard that a player who triggered it accidentally feels punished for engaging with the cairn system. No telemetry exists.
**Mitigation:** ship at Nicnevin-tier HP (3200) but with slightly higher damage (32 vs Nicnevin's 28) to mark her as the harder Tier-2. Boss fight tuned via solo-dev playtest, not telemetry — same posture as Nicnevin shipped under. The +20 % boss damage from Stormcrown is consciously self-referential: the relic the player earns from beating her makes her noticeably easier on the *next* gauntlet, gentling the difficulty curve without removing it.

**Risk 2 — Cairn-touch detection fairness.**
A player who happens to walk near seven cairns by accident gets the gauntlet whether they wanted it or not. V1's CairnOfEchoesScheduler already uses a 42 px touch radius (matching AncestralEcho); seven such touches across a 4096×4096 world is non-trivial and reads as deliberate.
**Mitigation:** no change to V1 touch radius. The count is a side-effect of how the player chose to traverse the moor. If they touched seven, they earned the gauntlet — there is no opt-out, intentionally. The lose-state (extinguish, not wipe) keeps the failure mode kind enough that accidental triggers do not feel catastrophic.

**Risk 3 — V1 spec's "all cairns wipe" interpretation.**
V1's one-paragraph V2 sketch said *"Lose → all cairns wipe."* Wiping all 50 cairns of player history on a single death conflicts with the game's hearth-warm soul and over-punishes engagement. This V2 spec **softens** that to extinguish-the-seven-gauntlet-cairns. The cairns themselves remain (they are still memories); only their candles dim.
**Mitigation:** documented divergence from V1 sketch is explicit (this risk). The seven extinguished cairns still confer the +1 % inherited buff on touch — they remain mechanically active, only their candle visual changes. Banter on the lose-state acknowledges the partial cost: *"The Cailleach claimed the candles, not the stones."*

**Risk 4 — Replay determinism of which seven cairns are wreathed.**
The wreath-state is committed to meta save on a successful gauntlet. A replay must match — touching the same seven cairns in the same order at the same times, fighting and beating Cailleach with the same input recording, must produce the same wreath outcome on the same seven cairns.
**Mitigation:** the touched-this-run set in the scheduler is already deterministic (cairn list comes from recorded payload via V1's `payload.cairns`; touch order comes from input recording). The gauntlet trigger fires from the scheduler's count; the outcome (win/lose) fires from the existing Player death and Enemy.die paths. No new RNG branch is introduced. Replay determinism inherits from V1's contract — `src/replay/replayDeterminism.test.ts` gains a regression that records, completes a gauntlet, replays, and asserts the wreath-set matches.

**Risk 5 — Save schema bump for per-cairn state.**
V1 shipped v10 with `FallenCairn` as a finite struct. Adding `wreathedAt` and `extinguishedAt` requires a v10 → v11 migration.
**Mitigation:** both new fields are optional. Existing v10 cairns load as neutral (neither wreathed nor extinguished) — no data loss. The migration adds the fields-as-undefined to each cairn record, which TS sees as backward-compatible. The reverse migration (v11 → v10 forward) is impossible (TS schema only goes forward), so we accept the v10 → v11 bump as a one-way step, consistent with the v9 → v10 step shipped on 2026-05-22.

**Risk 6 — Visual clarity of three cairn states (neutral / wreathed / extinguished).**
A long-played save could show all three states on screen at once. Players must read each at a glance.
**Mitigation:** distinct visual delta per state:
- **Neutral:** stacked stones + faint candle flicker (V1 baseline).
- **Wreathed:** stacked stones + larger candle + gold-tint glow (`0xf5d04e`) + slow-pulse alpha 0.7-1.0 over 2 s.
- **Extinguished:** stacked stones + no candle + slate-cool tint (`0x6a7280`), 0.45 alpha.
Distinct enough to read at minimap scale (gold vs cold-slate pixel). Minimap markers also differentiate (gold dot / dim slate dot / mid slate dot).

**Risk 7 — Cultural fit of Cailleach as a boss when she is also a playable variant.**
`cailleach` variant shipped 2026-04-22 as a winter-crone haggis. V2 introduces a separate boss enemy named Cailleach. Risk: name collision and lore confusion.
**Mitigation:** distinct keys (`cailleach` for the variant, `cailleach_boss` for the enemy). Different sprites (variant is a winter-palette haggis; boss is a tall robed crone with a staff — the actual mythological figure). Banter on the gauntlet beat acknowledges the dual presence when a Cailleach-variant run triggers the Cailleach-boss gauntlet: a tier-3 line in the `cailleach_gauntlet.candles_lit` sub-pool reads as one ancient meeting another. The boss is the goddess; the variant is the haggis named for her.

**Risk 8 — Cailleach's Mantle cosmetic depends on W71 rig that is partially open.**
The mantle slot on the player rig blocks on W71. V2 cannot ship a literal in-rig mantle.
**Mitigation:** descope the cosmetic to (a) postcard tartan unlock — winter-palette frost-and-bog pattern; (b) a small cold-mist particle trail at player feet **when Stormcrown is equipped** (procedural, no rig dependency). Both are non-rig and ship-now. The literal mantle remains a future W71 layer-on.

---

## 3. Implementation map

### 3.1 Files to create

| File | Purpose |
|---|---|
| `src/scenes/game/cailleachGauntlet.ts` | Pure helper — gauntlet state machine. Tracks touched-this-run count, computes candle ring positions, detects the 14:00 trigger and 15:00 spawn beats, computes outcome on player-death or Cailleach-death. |
| `src/scenes/game/cailleachGauntlet.test.ts` | Helper tests — state transitions, 7-touch arm, time-gate, candle-formation geometry, win/lose resolution. |
| `src/scenes/game/CailleachGauntletScheduler.ts` | Scene orchestrator — owns the live gauntlet instance, ticks the state machine each frame, calls hooks for candle spawning + boss spawning + outcome commit. Mirrors `CairnOfEchoesScheduler` shape. |
| `src/scenes/game/CailleachGauntletScheduler.test.ts` | Scheduler tests — hook routing, lifecycle (arm → light → spawn → resolve). |
| `src/art/sprites/fx/cailleachCandle.ts` | Procedural candle sprite — small upright flame on stone base. Neutral / lit / gold-wreath / cold-extinguish variants. |
| `src/art/sprites/bosses/cailleachBoss.ts` | Tall robed crone with staff — distinct from `cailleach` variant haggis. Slate-blue robe, frost-white hair, ironwood staff topped with antler. |
| `e2e/moor-remembers-cailleach-gauntlet.spec.ts` | E2E smoke — DEBUG hook to fast-forward 7 cairn touches + advance time; assert candles light at 14:00, boss spawns at 15:00, kill or be-killed paths commit correctly. |

### 3.2 Files to modify

| File | Change |
|---|---|
| `src/utils/save/fallenCairns.ts` | Extend `FallenCairn` interface with optional `wreathedAt?: number` and `extinguishedAt?: number`. Add helper `markWreathed(cairns, savedAts, now)` + `markExtinguished(cairns, savedAts, now)` — pure functions returning new arrays. |
| `src/utils/save/fallenCairns.test.ts` | Tests for the two new mark-helpers (idempotent, only-targets-savedAts, preserves order). |
| `src/core/SaveManager.ts` | Add `ISaveDataV11` interface (extends v10 — no new top-level fields, just the per-cairn state). Bump `CURRENT_SAVE_VERSION` 10 → 11. Migration v10 → v11 = no-op data-wise (cairn records remain valid; new optional fields default to undefined). Add `markCairnsWreathed(savedAts)` + `markCairnsExtinguished(savedAts)` convenience methods that route through the helpers. |
| `src/core/SaveManager.test.ts` | Migration round-trip v10 → v11 + helper-routed mark tests. |
| `src/scenes/game/CairnOfEchoesScheduler.ts` | Add public method `getTouchedThisRun(): readonly FallenCairn[]` so the gauntlet can read which cairns participated. Add `onSpriteCreate` payload extension: pass the cairn's wreathed/extinguished state through so the sprite-create hook can pick the right tint variant. |
| `src/data/enemies.ts` | Add `cailleach_boss` enemy config. Add `manualSpawn: true` field to `BossConfig` interface — flags the entry as not eligible for time-based SpawnSystem path. SpawnSystem honours the flag. |
| `src/systems/SpawnSystem.ts` | Honour `manualSpawn: true` — skip the entry during the time-based boss spawn loop. Add public `spawnBossManually(key, x, y)` that the gauntlet scheduler calls at 15:00. |
| `src/data/relics.ts` | Add `stormcrown` as a Rare relic. `dropAffinity: ['boss']`. Drop source biased so it preferentially drops from `cailleach_boss` kills via a new optional `restrictedToBossKey?: string` field — Stormcrown only drops from Cailleach. |
| `src/data/banter.ts` | New pool `cailleach_gauntlet` priority 95 (above `beithir_sting` 90, below `boss_warn` 100). Five sub-pools: `armed` (7th touch logged), `candles_lit` (14:00 fires), `cailleach_spawned` (15:00 boss appears), `cailleach_down` (win), `cailleach_dominant` (lose). EN + SCS parity. |
| `src/core/i18n/ui.ts` + `src/core/i18n.scs/ui.ts` | New `ui.cailleach_gauntlet.*` namespace (caption strings for the candle moment + boss warning + win/lose toasts). Boss display name + warning key (`boss.cailleach_boss.name`, `ui.bossWarning.cailleach_boss`). Stormcrown relic name/effect/flavour. Cailleach's Mantle tartan name. EN + SCS parity locked by existing fence. |
| `src/data/achievements.ts` (or wherever the achievement catalogue lives) | Add `crown_the_cailleach` achievement: title "Crown the Cailleach", desc "Survive the Cailleach Gauntlet". Unlock fires on win. |
| `src/utils/tartanAuthored.ts` | Add `cailleach_mantle` preset — winter-palette tartan (frost-white, slate-blue, bog-purple, faint bronze stripe). Unlock-gated on `crown_the_cailleach` achievement. |
| `src/scenes/GameScene.ts` | Instantiate `CailleachGauntletScheduler` after the cairn scheduler in `create()`. Tick it in `update()` after the pause-gate. Wire candle-spawn hook (Graphics layer) + boss-spawn hook (SpawnSystem.spawnBossManually) + outcome-commit hook (saveManager.markCairns…). |
| `src/ui/Minimap.ts` | Differentiate cairn marker colour by wreathed/extinguished state. Gold = wreathed, mid-slate = neutral, dim-slate-cool = extinguished. |
| `src/replay/replayDeterminism.test.ts` | Regression: record a gauntlet-completion run, replay, assert resulting wreath-set matches the recording's wreath-set. |
| `src/scenes/almanac/FindsBook.ts` (extend) | Add a "Gauntlet" Finds sub-entry: lit when the player first triggers a gauntlet (regardless of win or lose). Counter rolls per gauntlet entered. |
| `docs/superpowers/specs/2026-05-22-the-moor-remembers-design.md` | Truth-up the V1 spec's "Deferred V2" paragraph — replace the one-sentence sketch with a link to this V2 spec; record the design divergence (extinguish, not wipe). |
| `CLAUDE.md` | One-liner-per-mechanic table row for Cailleach Gauntlet under Landmarks. |
| `docs/DESIGN_IDEAS.md` | Strike-through the V2-deferred bullet on The Moor Remembers entry with shipped marker + commit ref. |
| `docs/HUGE_INITIATIVES_MASTER_PLAN.md` | Move "Moor Remembers V2 — Cailleach Gauntlet" row from "Open candidates" to "What's done" with ship date + outcome. |

### 3.3 Data shape

```ts
// src/utils/save/fallenCairns.ts — extended
export interface FallenCairn {
  readonly x: number;
  readonly y: number;
  readonly cause: string;
  readonly variantKey: string;
  readonly timeSurvivedMs: number;
  readonly inheritedStat: InheritedStatKey;
  readonly savedAt: number;
  /** V2 — set on successful Cailleach Gauntlet completion. Gold-wreath visual + double inherited buff. */
  readonly wreathedAt?: number;
  /** V2 — set on failed Cailleach Gauntlet (player died before Cailleach). Cold-extinguish visual; buff unchanged. */
  readonly extinguishedAt?: number;
}

// src/scenes/game/cailleachGauntlet.ts — gauntlet state machine
export type GauntletPhase =
  | 'idle'         // < 7 touched OR not yet armed
  | 'armed'        // 7 touched but time < 14:00; candle moment scheduled
  | 'candles_lit'  // 14:00 fired; candles burning, Cailleach not yet spawned
  | 'engaged'      // Cailleach on field, fight in progress
  | 'resolved';    // win or lose; final state committed

export interface CailleachGauntletState {
  readonly phase: GauntletPhase;
  readonly touchedSavedAts: readonly number[]; // savedAts of the 7 cairns
  readonly armedAtMs: number | null;           // game-time touch crossed 7
  readonly candleLightAtMs: number | null;     // 14:00 mark fired
  readonly bossSpawnAtMs: number | null;       // 15:00 mark fired
  readonly outcome: 'win' | 'lose' | null;
  readonly candleRing: readonly { x: number; y: number }[]; // computed at light-up
}

// Constants
export const GAUNTLET_TOUCH_THRESHOLD = 7;
export const GAUNTLET_CANDLE_TIME_MS = 14 * 60 * 1000;
export const GAUNTLET_BOSS_TIME_MS = 15 * 60 * 1000;
export const GAUNTLET_CANDLE_RING_RADIUS_PX = 200;
export const WREATHED_INHERITED_BUFF_PCT = 0.02; // double the V1 +1 %
```

### 3.4 Cailleach boss config (data shape)

```ts
// src/data/enemies.ts — appended to BOSSES
{
  key: 'cailleach_boss',
  nameKey: 'boss.cailleach_boss.name',
  warningKey: 'ui.bossWarning.cailleach_boss',
  spawnTimeSec: -1,        // sentinel — manualSpawn path only
  manualSpawn: true,       // new field — SpawnSystem skip
  texture: 'boss_cailleach',
  speed: 60,               // slower than Nicnevin (55 her, 60 us — actually similar, intentional crone-pace)
  hp: 3200,                // peer to Nicnevin
  damage: 32,              // +4 over Nicnevin — marks her as the harder T2
  xpValue: 70,
  scale: 2.6,
  behaviorOverride: 'wail', // new behaviour: slow chase + ice projectile + 50%-HP radial slow pulse
}
```

A new `'wail'` behaviour string is added to `BossBehavior` union. Wired in `Enemy.ts:behaviorWail` (mirrors the shape of `behaviorRanged`/`behaviorSpawner`/`behaviorThreeBay`): chase player at 60 speed; every 4 s fire a `cailleach_ice_lance` projectile (50 dmg, slow on hit); at 50 % HP trigger a one-time "Blue Hag's Wail" radial pulse (600 px radius, 60 % slow for 2 s, 30 dmg).

### 3.5 Stormcrown relic (data shape)

```ts
// src/data/relics.ts — appended
stormcrown: {
  key: 'stormcrown',
  rarity: 'rare',
  nameKey: 'relics.stormcrown.name',
  effectKey: 'relics.stormcrown.effect',
  flavourKey: 'relics.stormcrown.flavour',
  iconSprite: 'relic_stormcrown',
  particleColour: 0xb9d6f0, // frost-blue
  dropAffinity: ['boss'],
  restrictedToBossKey: 'cailleach_boss', // V2 — never drops from gordon/tour_bus/etc.
},
```

Effect (wired in the relic effect-hook layer):
- `+0.20` boss-damage multiplier (existing `Player.addBossDamageMultiplier` hook).
- On crit, 6 % chance to freeze the target for 0.5 s (existing freeze stun infrastructure from `behaviorThreeBay`/`Enemy.applyFreeze`).

**Drop certainty:** Cailleach kill is a **guaranteed** Stormcrown drop, not a rarity-rolled drop. The boss-drop roller in the relic system gains a `restrictedToBossKey` short-circuit — if the killed boss matches a relic's restriction, that relic drops 100 %. This is consistent with the gauntlet's design: the player earned the gauntlet (7 cairns) AND beat the boss; the reward must land. Other boss kills (Gordon, Tour Bus, etc.) continue to use the rarity-weighted pool over the open Rare/Uncommon/Common bag, but the restricted slot is removed from that pool — Stormcrown only ever drops from Cailleach.

### 3.6 Cairn state precedence

The two optional state fields on `FallenCairn` can transition between states across runs. Precedence rules:

- **Neutral → Wreathed:** on a successful gauntlet. Sets `wreathedAt = Date.now()`. Clears any prior `extinguishedAt` (the win supersedes the loss; a cairn that earned redemption is no longer extinguished).
- **Neutral → Extinguished:** on a failed gauntlet. Sets `extinguishedAt = Date.now()`. (No `wreathedAt` to clear.)
- **Wreathed → Extinguished:** a previously-wreathed cairn participates in a failed gauntlet. **Wreathed wins** — the cairn retains `wreathedAt`; no `extinguishedAt` set. Rationale: a wreath is a permanent mark of past triumph; the Cailleach cannot un-wreathe.
- **Extinguished → Wreathed:** a previously-extinguished cairn participates in a successful gauntlet. **Wreathed wins** — clear `extinguishedAt`, set `wreathedAt`. Rationale: redemption is real; the new triumph replaces the old loss.
- **Wreathed → Wreathed:** no-op (the existing `wreathedAt` is preserved; no update).
- **Extinguished → Extinguished:** no-op.

The `markWreathed` and `markExtinguished` helpers implement these rules. A small precedence-table test in `fallenCairns.test.ts` exercises all six paths.

---

## 4. Banter pool

```ts
// src/data/banter.ts — appended
cailleach_gauntlet: {
  priority: 95,
  cooldownMs: 0, // fire-once-per-beat — each sub-pool gates internally
  pools: {
    armed: [
      // 7th touch crossed pre-14:00 — quiet ominous beat
      { en: 'Seven stones. Seven names. The mountain notices.', scs: '…' },
      // …4 leaves
    ],
    candles_lit: [
      // 14:00 fires — the gauntlet is real
      { en: 'Seven candles. Seven memories. The Cailleach is called.', scs: '…' },
      // tier-3 Cailleach-variant-routing leaf (haggis named for her, summoning her)
      { en: 'Ye named me for her. Now she comes for me.', scs: '…' },
      // …5 leaves
    ],
    cailleach_spawned: [
      // 15:00 — boss arrival
      { en: 'She walks out of the haar. Staff first. Eyes last.', scs: '…' },
      // …3 leaves
    ],
    cailleach_down: [
      // Win
      { en: 'The crown is mine. Winter blinked.', scs: '…' },
      // …4 leaves
    ],
    cailleach_dominant: [
      // Lose (player dies before Cailleach)
      { en: 'The Cailleach claimed the candles. Not the stones.', scs: '…' },
      // …3 leaves
    ],
  },
},
```

Five sub-pools × 4-5 leaves each ≈ 22 banter leaves. EN + SCS parity locked.

---

## 5. Test coverage map

| Gate | Test |
|---|---|
| 7-touch arm transition | `cailleachGauntlet.test.ts` — idle → armed at 7 touches |
| Candle-light time gate | `cailleachGauntlet.test.ts` — armed → candles_lit at game-time ≥ 14:00 |
| Late-touch path | `cailleachGauntlet.test.ts` — 7th touch AFTER 14:00 fires candles immediately |
| Boss-spawn time gate | `cailleachGauntlet.test.ts` — candles_lit → engaged at 15:00 |
| Win outcome | `cailleachGauntlet.test.ts` — engaged → resolved (win) on boss death |
| Lose outcome | `cailleachGauntlet.test.ts` — engaged → resolved (lose) on player death |
| Candle ring geometry | `cailleachGauntlet.test.ts` — 7 candles at 200 px radius equispaced around the trigger point |
| Wreath helper | `fallenCairns.test.ts` — `markWreathed` sets `wreathedAt`, leaves others untouched |
| Extinguish helper | `fallenCairns.test.ts` — `markExtinguished` sets `extinguishedAt`, leaves others untouched |
| SaveManager migration | `SaveManager.test.ts` — v10 → v11 round-trip, mark helpers route correctly |
| Scheduler wiring | `CailleachGauntletScheduler.test.ts` — hook routing, lifecycle, one-shot beats |
| Cairn marker by state | `Minimap.test.ts` (or scheduler) — gold/slate/dim by state |
| SpawnSystem manualSpawn | `SpawnSystem.test.ts` — `manualSpawn: true` skipped on time-based path, spawnable via `spawnBossManually` |
| Boss behaviour `wail` | `Enemy.test.ts` — wail pulse fires once at 50 % HP, ice lance cadence 4 s |
| Stormcrown drop restriction | `relics.test.ts` — never drops from non-`cailleach_boss` kills |
| Replay determinism | `replayDeterminism.test.ts` — record-replay produces identical wreath-set |
| E2E smoke | `e2e/moor-remembers-cailleach-gauntlet.spec.ts` — DEBUG fast-forward path, full win flow |

Estimated +28 unit assertions + 1 e2e test + 1 SaveManager migration test pair + 1 replay regression. Bundle delta ≈ 3 KB gzip (boss config + relic + banter + ringbuffer constants).

---

## 6. Pre-ship gate (per CONTRIBUTING.md)

1. **Filters cleared?** Stand-the-test (extends V1 cleanly; no fork of existing systems) ✓ ; ultra-efficient (one new boss config, one new relic, one new scheduler — same shape as V1 cairn scheduler) ✓ ; secure (no new input handling; gauntlet trigger is internal scheduler state) ✓ ; technically impressive (gauntlet state machine composes V1 scheduler + SpawnSystem + relics + cosmetics + replay determinism) ✓ ; minimal slop (the V1 sketch's "all cairns wipe" softened to per-cairn state; no premature relic balance hooks; no W71 rig dependency) ✓.
2. **Chains walked?** New mechanic chain: pure helper + test → scheduler orchestrator + test → scene wire (post-pause early-return) → texture-exists guards on new sprites → i18n keys (EN + SCS) → banter pool entry → e2e smoke ✓. Save chain: schema bump v10 → v11 + migration + tests ✓. Replay chain: cairn list payload covered by V1; wreath-set determinism added ✓.
3. **Invariants surfaced?** Save schema bumps v10 → v11. `FallenCairn` interface grows by two optional fields (backward-compatible). `BossConfig` gets a new optional `manualSpawn` flag. `BossBehavior` union grows by `'wail'`. `RelicDef` gets optional `restrictedToBossKey`. None of these break existing callers.
4. **Verification proof?** TBD at ship — quote `npm run ci` + e2e log + manual playthrough screenshot of the candle ring.
5. **Soul Check?** Warmth (extinguish-not-wipe; the cairns remain memories) ✓ ; clarity (three visible cairn states with distinct visual deltas) ✓ ; tone (gauntlet beats are folkloric, not punishing) ✓ ; voice (banter respects VOICE_CARD Cailleach + Hearth registers; no shame on lose) ✓ ; moment-stack (the closing minute between candle-light and boss-walk is intentionally heavy) ✓ ; kindness (lose-state is a partial-cost, not a wipe; the cairns persist).

---

## 7. Phase boundaries

### Ships in this spec (V2.0)

- Gauntlet state machine + scheduler + sprite layer.
- `cailleach_boss` enemy + `'wail'` behaviour + ice-lance projectile.
- `stormcrown` relic + drop restriction.
- `crown_the_cailleach` achievement.
- `cailleach_mantle` tartan unlock (postcard).
- Cold-mist particle trail at player feet when Stormcrown equipped.
- Save schema v11 (per-cairn wreath/extinguish state).
- Minimap state-coloured cairn markers.
- `cailleach_gauntlet` banter pool (5 sub-pools × 4-5 leaves).
- E2E smoke + helper tests + scheduler tests + migration test + replay regression.
- CLAUDE.md + DESIGN_IDEAS + master plan truth-ups.

### Deferred (post-V2)

- **Literal in-rig mantle** when W71 rig lands.
- **Multi-tier gauntlet** — beating Cailleach three lifetime times could unlock a harder tier (the Cailleach Bheur, the Storm Hag). Out of scope.
- **Cailleach-variant special interaction** — when the haggis variant `cailleach` triggers the gauntlet, additional dialogue could spawn beyond the tier-3 line included here. Authored as needed.
- **Wreath-count rewards** — accumulating N wreathed cairns over lifetime could unlock further cosmetics. Hook tracked in the achievement layer; specific gate copy deferred.
- **Per-gauntlet-attempt Almanac entry** — currently one Finds sub-entry tracks "Gauntlets entered". A future pass could break this into separate Finds rows per tier.

---

## 8. Dispatch brief

This spec doubles as a dispatch brief. A subagent executor should follow the V1 plan's TDD shape: pure helpers first (state machine + mark helpers), then scheduler, then sprite layer, then SpawnSystem wiring, then relic + achievement + tartan, then i18n + banter, then GameScene wire, then e2e. Each step: failing test → minimum impl → verify → commit. Estimated session size: 2-3 hours including verification + memory truth-up + DESIGN_IDEAS / master plan truth-ups.

The V1 plan landed in 15 tasks; this V2 plan will land in roughly the same count.

---

*Spec lock. Implementation immediately.*
