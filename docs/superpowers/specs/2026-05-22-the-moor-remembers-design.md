# The Moor Remembers — death as map-state, the grandfather's voice

**Date:** 2026-05-22
**Initiative:** Open candidate, lead-dev pick. Extends shipped Ancestral Echo (single-spot 30s ghost) into a persistent cross-run map fixture. Layers a hidden second-voice secret (the haggis's late grandfather, Gran's husband) into the same surface.
**Status:** Draft — implementation immediately after.
**Word count:** ~2,800.
**Prerequisite:** Ancestral Echo shipped 2026-04-18 (`src/scenes/game/ancestralEcho.ts` + `ancestralEcho.test.ts`); meta save schema v9 at `src/core/SaveManager.ts:306` with `ancestralEchoesTouched` counter and `hasSeenAncestralEchoTip` one-shot.

---

## 1. Problem statement

WHS has stopped being short of *content*. It has fifteen variants, twenty-two enemies, seven biomes, thirteen seasonal events, thirty runes, eighteen relics, three hundred-plus banter lines, two languages, four skill-expression layers, twelve sporran cards. Across-run meta is rich (Sporran Deck draft, deeds, Croft trophies, Almanac discovery). What it is short of is **moments players talk about** — moments compressed enough to become stories.

The current Ancestral Echo is the most emotionally-pointed system in the game. Last run's death spot bears a pale ghost for thirty seconds; touching it gives you back a little of what you lost. It works. But it is *small* — one spot, one run, then forgotten. The meta save records *that you touched one* as a counter but **does not record where you fell**. The moor does not actually remember.

This spec turns the metaphor into a system. Every death persists. The moor fills with cairns of your past selves over weeks of play. Walking over one is a small audible inheritance — a whispered line from that haggis and a one-percent buff in whatever they were strongest at. The system is private to each save (your moor looks different from anyone else's), seed-deterministic for replay (cairn coords are recorded ahead of the run-RNG), and capped so it cannot bloat unbounded.

It also carries a secret. One in a hundred cairn-touches, instead of a past-self whisper, you hear a different voice: an old male elder, in Scots, addressing the haggis directly. Gran's husband. Long dead. He speaks from the cairns because the cairns are partly his work — he was a drover who walked the moor for fifty years and stacked many of them in his lifetime. Hints unfold into a new Almanac page ("The Old Drover") over many runs. He becomes the long-tail surprise — most players will not know he exists until their first whisper lands wrong-textured.

### Player outcome

After The Moor Remembers ships:

- The first time a cairn appears in a future run, you stop. *Wait — that's where I died.* New moment.
- Over weeks of play the moor becomes uniquely yours. No other player's looks like it. Pure soul.
- The first grandfather whisper lands as a small mystery: *who was that?* The Almanac page slowly fills.
- The existing 30-second Ancestral Echo ghost gains a second life — it does not vanish after thirty seconds, it **settles** into a permanent cairn. One entity, two lifecycle stages.

---

## 2. Design risks

**Risk 1 — Save bloat.**
A long-played save could accumulate hundreds of cairns. Each entry is small (~80 bytes JSON) but the moor cannot read a hundred candles on screen.
**Mitigation:** `FALLEN_CAIRN_CAP = 50` with FIFO rotation. Worst case adds ~4 KB to meta save. On reaching cap, oldest cairn is dropped on next death. Spec leaves a v2 deferral for "wreathed cairns for victories" which could earn permanent slot exemption; v1 does not need it.

**Risk 2 — Visual clutter on long-played accounts.**
Fifty candles on the moor at once = visual noise that fights gameplay-critical telegraphs.
**Mitigation:** culling. Cairn sprites are only created when the player is within `CAIRN_RENDER_RADIUS_PX = 600` of the coord; destroyed when player exits the radius. Minimap shows cairns as small dim slate pixels (one-pixel marker, ≤0.25 alpha), distinct from elite / boss / pickup markers. At maximum dispersion ~10 cairns are renderable in any one camera viewport — well below the existing pickup density.

**Risk 3 — Grandfather voice clarity without VO budget.**
The grandfather voice must read as *distinct from the haggis's voice and distinct from a past-self whisper.* No voice-acting budget exists.
**Mitigation:** procedural Web Audio synth with a distinct formant cluster (lower fundamental ~120-180 Hz vs past-self 200-300 Hz; slower cadence; one-octave-wider vowel formants). Each grandfather whisper additionally fires a CAPTION (gated by `captionsEnabled`) showing the line in italics. If audio texture proves weak in playtest, the caption carries the moment regardless.

**Risk 4 — First-run experience (no cairns yet).**
Fresh saves see an empty moor. Mechanic is invisible until the player dies once.
**Mitigation:** banter pool `cairn_walkover.first_death` fires the first time a cairn materialises, a hearth-warm acknowledgement of *"that's me. I'm there now."* The Ancestral Echo tutorial one-shot (`hasSeenAncestralEchoTip`) already covers the introduction of the parent system; we layer onto its existing FTUE moment.

**Risk 5 — Replay determinism on cairn spawns.**
Cairn coords come from meta save (player history), not `runRng`. Replays of old runs may reference cairns that have since been FIFO-rotated out, or new cairns that did not exist at replay time.
**Mitigation:** the replay blob captures the cairn coord list at run-start as part of the recorded seed payload. `payload.runSeed` becomes `payload.runSeed + payload.cairns: FallenCairn[]`. T1 contract preserved — replays of old runs replay against the cairn state at the time of recording, not the live meta save. Add cairn list to `src/replay/replayDeterminism.test.ts`.

**Risk 6 — Cultural risk on grandfather Old-Scots voice.**
Same Q5 native-review posture as existing Scots content. The Old Drover speaks Hearth-grave Scots — vocabulary is consistent with `VOICE_CARD.md` Cailleach / Hearth registers, no new dialect introduced.
**Mitigation:** all twenty-five Old Drover lore-fragment leaves authored by the same hand using the same vocabulary set. Cultural splash + README disclosure already cover unaudited posture per the 2026-05-10 Q5 resolution.

**Risk 7 — Past-self buff feels invisible.**
A +1% bonus to one stat for the rest of the run is a soft signal. Players may not notice it landed.
**Mitigation:** the walk-over fires (a) the audible whisper, (b) the caption, (c) a brief slate-blue floating text "+1% drift-resist" (or whichever stat) at the cairn coord, (d) banter pool entry. Three feedback channels stack at the moment of inheritance. The buff number is intentionally small — the *moment* is the payoff, not the math.

**Risk 8 — Walking-over cairns becomes obligatory routing.**
If touching cairns is strictly better, players feel pulled away from positioning play to chase cairns.
**Mitigation:** the +1% is small enough that *not* visiting a cairn never feels like a build mistake. Cairns are also rendered as ambience first, mechanic second — most cairns the player passes will not be touched, by design.

---

## 3. Implementation map

### 3.1 Files to create

| File | Purpose |
|---|---|
| `src/utils/save/fallenCairns.ts` | Pure helpers: `recordFallenCairn`, `rotateFallenCairnsToCap`, `FallenCairn` interface, constants. |
| `src/utils/save/fallenCairns.test.ts` | Helper tests — FIFO rotation, dedup, coord-clamp. |
| `src/scenes/game/CairnOfEchoesScheduler.ts` | Scene orchestrator. Mirrors `CairnStackingScheduler` shape — `spawn / tick / commit / destroy / getMinimapMarkers`. |
| `src/scenes/game/CairnOfEchoesScheduler.test.ts` | Scene-helper tests — load cairns, cull beyond render radius, walk-over fires once per cairn per run. |
| `src/scenes/game/cairnOfEchoesWhisper.ts` | Pure helper: pick whisper text (past-self vs grandfather roll, variant-keyed line selection). Replay-deterministic via injected RNG. |
| `src/scenes/game/cairnOfEchoesWhisper.test.ts` | Whisper-pick tests — deterministic given seed, grandfather roll at ~1%, variant routing. |
| `src/systems/audio/cairnWhisper.ts` | Procedural Web Audio synth for both whisper voice textures. Pure function returning an AudioBufferSourceNode setup. |
| `e2e/moor-remembers.spec.ts` | E2E smoke — die in run 1, restart, walk over cairn, assert caption + buff render. |

### 3.2 Files to modify

| File | Change |
|---|---|
| `src/core/SaveManager.ts` | Add `ISaveDataV10` extending v9 with two fields: `fallenCairns: FallenCairn[]` and `oldDroverRevealedCount: number` (0..25). Bump `CURRENT_SAVE_VERSION` 9 → 10. Add migration v9 → v10 (initialise empty array + counter = 0). Update `DEFAULT_SAVE`. Add `getFallenCairns()`, `recordFallenCairn(cairn)`, `getOldDroverRevealedCount()`, `incrementOldDroverRevealed()` convenience methods. |
| `src/core/SaveManager.test.ts` | Migration round-trip test v9 → v10. FIFO rotation when array hits cap on save. |
| `src/scenes/game/RunLifecycle.ts` or wherever death is handled | On `handleDeath`, call `saveManager.recordFallenCairn({ x: player.x, y: player.y, cause, variantKey, timeSurvivedMs, savedAt: Date.now() })`. |
| `src/scenes/GameScene.ts` | In `create()`, instantiate `CairnOfEchoesScheduler` after the pause-gate, passing `saveManager.getFallenCairns()`. Tick scheduler in `update()` after the pause-gate. Wire `onWalkOver` to apply buff + fire banter. |
| `src/scenes/game/ancestralEcho.ts` | On 30s ghost lifetime expiry, call `onSettle()` callback → `GameScene` records the spot as a fresh cairn AND adds it to the active scheduler. This is the "ghost settles into stone" handoff. (Preserves existing 30s behaviour — adds a tail.) |
| `src/ui/Minimap.ts` | Add `cairnMarkers` field — array of dim slate pixels at cairn world coords. Updated each tick from scheduler. |
| `src/data/banter.ts` | New pool `cairn_walkover`, priority 34 (between Clootie Wager 33 and Reliquary 45). Sub-pools: `past_self` (variant-keyed, hearth-grave), `past_self.first_death` (first cairn ever materialised on this save), `grandfather_hint` (Old Drover voice, edge-hearth). EN + SCS leaves. |
| `src/core/i18n/ui.ts` + `src/core/i18n.scs/ui.ts` | New `ui.cairn.whisper.*` namespace (past-self lines, ~12 leaves variant-tagged), `ui.cairn.grandfather.*` (25 lore-fragment leaves, sequenced 01-25), `ui.almanac.oldDrover.*` (page title + intro + reveal-state copy). EN + SCS parity locked by existing fence at `src/core/i18n.locale.test.ts`. |
| `src/scenes/almanac/FindsBook.ts` + `src/scenes/almanac/buildFindsEntries.ts` (extend) | Add an "Old Drover" entry to the existing Finds book. Each grandfather lore-leaf revealed registers as a sub-entry. Locked sub-entries show as `???`. The whole entry counts as one Finds entry against the existing Almanac discovery rail. If the UX shape needs a dedicated book instead, create `OldDroverBook.ts` mirroring `FindsBook` shape; decision deferred to implementing agent on reading the live FindsBook layout. |
| `src/replay/...` | Add `cairns: FallenCairn[]` to recorded payload. Update `replayDeterminism.test.ts` with a regression that records, FIFO-rotates the live meta save, and replays — asserting the recorded cairn list is used, not the live one. |

### 3.3 Data shape

```ts
// src/utils/save/fallenCairns.ts

export interface FallenCairn {
  /** World X at the moment of death. */
  readonly x: number;
  /** World Y at the moment of death. */
  readonly y: number;
  /** Death cause key (string tag — matches existing `GameOverPayload.deathCause.tag` shape, e.g. `'boss_slam'`, `'enemy_contact'`). Drives caption / banter routing. */
  readonly cause: string;
  /** Variant the haggis was running. Routes variant-voiced whispers. */
  readonly variantKey: VariantKey;
  /** Time survived in ms — informs which stat the past-self was strongest in (proxy). */
  readonly timeSurvivedMs: number;
  /** Best stat the past-self leveled (read from snapshot at death). Drives the +1% inherited buff. */
  readonly inheritedStat: InheritedStatKey;
  /** Unix ms timestamp — used for FIFO rotation order. */
  readonly savedAt: number;
}

export type InheritedStatKey =
  | 'damage' | 'speed' | 'pickupRadius' | 'critChance' | 'cooldown' | 'driftResist';

export const FALLEN_CAIRN_CAP = 50;
export const CAIRN_RENDER_RADIUS_PX = 600;
export const CAIRN_TOUCH_RADIUS_PX = 42;
export const CAIRN_INHERITED_BUFF_PCT = 0.01;
export const GRANDFATHER_WHISPER_CHANCE = 0.01;

export function recordFallenCairn(
  existing: readonly FallenCairn[],
  next: FallenCairn,
  cap: number = FALLEN_CAIRN_CAP,
): FallenCairn[] {
  const out = [...existing, next];
  if (out.length > cap) out.splice(0, out.length - cap);
  return out;
}
```

### 3.4 Lifecycle flow

```
Player dies at (worldX, worldY)
  ↓
RunLifecycle.handleDeath
  ↓
saveManager.recordFallenCairn({ x, y, cause, variant, timeSurvivedMs, inheritedStat, savedAt })
  ↓
  → wee-tale / game-over UI proceeds as normal
  ↓
Player restarts
  ↓
GameScene.create()
  ↓
  → CairnOfEchoesScheduler.load(saveManager.getFallenCairns())
  ↓
  → AncestralEcho still spawns at last-run death spot for 30s as before
  ↓
  (30s passes)
  ↓
  → AncestralEcho.onSettle() fires → scheduler adds the just-expired ghost as a cairn at this run's coord
  ↓
Each frame: scheduler.tick(playerX, playerY)
  → For each cairn within CAIRN_RENDER_RADIUS_PX:
      - If not yet sprited: create cairn sprite + start subtle candle flicker tween
      - If walked over (distance ≤ CAIRN_TOUCH_RADIUS_PX) AND not yet touched this run:
          mark touched
          rng.next() roll: grandfather (1%) vs past-self (99%)
          - past-self: play whisperSynthPastSelf(seed), caption, banter past_self pool, applyInheritedBuff(stat, +1%)
          - grandfather: play whisperSynthGrandfather(seed), caption, banter grandfather_hint pool, reveal next OldDrover lore leaf
          floating text "+1% <stat>" rises from cairn
          fire cairnWalkedOver event for AchievementManager (extends existing ancestralEchoesTouched counter)
  → For each cairn beyond CAIRN_RENDER_RADIUS_PX:
      - If sprited: destroy sprite + clear tween (memory hygiene)
```

### 3.5 Sister-pattern compliance

`CairnOfEchoesScheduler` mirrors `CairnStackingScheduler` exactly:
- Constructor takes `{ scene, player, runRng, palette }` (same shape).
- `getMinimapMarkers()` returns `{ x, y, color, alpha, size }[]` consumed by `Minimap.update()`.
- `destroy()` clears all sprites + tweens + the per-cairn touched-set.
- `tick(delta, playerX, playerY)` is called from `GameScene.update()` after `isGameplayPaused()` early-return per `CLAUDE.md` new-mechanic safety pattern (d).
- Pure decision math (whisper roll, lore-reveal sequencing) extracted to `cairnOfEchoesWhisper.ts` for unit testing without Phaser.

### 3.6 Whisper synth

```ts
// src/systems/audio/cairnWhisper.ts

/**
 * Past-self whisper — short formant-shaped noise burst.
 * Fundamental ~200-300Hz, vowel formant cluster at ~600/1200/2400Hz.
 * 1.2s envelope. Distinct from existing whisper SFX by formant shape.
 */
export function playPastSelfWhisper(ctx: AudioContext, seed: number, gainBus: GainNode): void;

/**
 * Grandfather whisper — distinct lower fundamental + slower cadence.
 * Fundamental ~120-180Hz, vowel formants ~400/900/1800Hz (wider vowel space).
 * 1.8s envelope with a longer exhale tail. Reads as elder.
 */
export function playGrandfatherWhisper(ctx: AudioContext, seed: number, gainBus: GainNode): void;
```

Both functions are deterministic given the seed — recorded replays reproduce the same audio textures.

---

## 4. i18n content — sample leaves

Authoring complete in spec; final SCS author pass at ship.

### 4.1 Past-self whispers (variant-tagged, EN sample)

Authoring matches the wee-tales v2 coverage rule: the four [`VOICE_CARD.md`](../../VOICE_CARD.md) voice registers (Cailleach / Glaswegian / Doric Quinie / Burns's Wee Beastie) get their own line; the other eleven variants fall through to the generic `classic` line. Plus a one-shot first-death fallback that fires regardless of variant. **Six total in v1.**

```
ui.cairn.whisper.past_self.first_death:         "That's me, down there."
ui.cairn.whisper.past_self.classic:             "Walked too far past the loch."
ui.cairn.whisper.past_self.cailleach:           "Winter took its own."
ui.cairn.whisper.past_self.glaswegian:          "Got cocky. Got got."
ui.cairn.whisper.past_self.doric_quinie:        "Awa wi' the haar."
ui.cairn.whisper.past_self.burns_wee_beastie:   "Wee, sleekit, and stilled."
```

Same picker shape as wee-tales v2: variant-keyed line preferred when present, else `classic` fallback, else `first_death` if this is the first cairn ever touched on this save. Pure function over `{ variantKey, isFirstDeathTouch }` returning an `i18nKey`.

### 4.2 Grandfather whispers (Old Drover, EN sample, sequenced)

The leaves are **authored in narrative order** (01 → 25 tells a coherent backstory) but **revealed in encounter order** (the grandfather speaks through whichever cairn the player happens to be touching when the 1% roll succeeds, and the next-unrevealed leaf in narrative order is the one that fires). The Almanac page displays revealed leaves in their **narrative slot** (01 always sits in slot 01 once revealed, regardless of when it was heard) — locked slots show `???`. This means the player's first grandfather whisper is always leaf 01, second is always leaf 02, etc. — the narrative reads in order even though encounters are scattered across runs.

```
ui.cairn.grandfather.01: "Hark, wee one. Stack the stones high enough and ye'll wake the Cailleach hersel'."
ui.cairn.grandfather.02: "Yer grandmother's husband walked here every nicht for fifty years. She'll no have told ye."
ui.cairn.grandfather.03: "Beneath the third loch, a thing the salt water fears. Mind ye dinna find it."
ui.cairn.grandfather.04: "Some o' these stones are mine. Stacked them wi' frozen hands."
ui.cairn.grandfather.05: "The Taxman came for me last. Came for everyone, in the end."
... (twenty-five total)
ui.cairn.grandfather.25: "When ye've walked enough, I'll be quiet. And the moor'll be yours."
```

The twenty-five lines together compose a backstory: a drover, married to Gran, walked the moor for fifty years; stacked many of the existing cairns as way-markers; was eventually killed by the Taxman (positioning the player's Taxman fight as inherited grudge); now speaks from the cairns he laid. The final leaf (25) closes the arc.

**Reveal-counter persistence:** `whs_meta_save.fallenCairns` is for the cairns themselves; the grandfather-leaf reveal counter lives separately as `whs_meta_save.oldDroverRevealedCount: number` (also added in v9 → v10). When a grandfather roll succeeds and `revealedCount < 25`, increment, fire leaf at index `revealedCount` (zero-indexed read = next-unrevealed). At 25, the `cairn_walkover.grandfather_complete` banter pool unlocks for one final fire, then the grandfather voice goes silent (the 25th leaf says so in-fiction).

### 4.3 Almanac page "The Old Drover"

```
ui.almanac.oldDrover.title:       "The Old Drover"
ui.almanac.oldDrover.intro:       "There is another voice in the moor. Listen for him."
ui.almanac.oldDrover.locked:      "???"
ui.almanac.oldDrover.complete:    "He is quiet now. The moor is yours."
```

Page renders unrevealed entries as `???`. Reveal order = order heard. Counter `revealed/25` shows progress. No gameplay gate; pure discovery rail.

### 4.4 Banter pool `cairn_walkover`

Priority 34. Sub-pools:
- `cairn_walkover.past_self_first` — first cairn touched this run (variant-keyed).
- `cairn_walkover.past_self` — subsequent cairn touches (variant-keyed).
- `cairn_walkover.grandfather_first` — first grandfather whisper ever (one-shot via meta save flag).
- `cairn_walkover.grandfather_revealed` — subsequent grandfather hints.
- `cairn_walkover.grandfather_complete` — fires the run after the 25th hint is revealed.

EN + SCS parity locked.

---

## 5. Test plan

| Layer | What |
|---|---|
| Helper — `fallenCairns.test.ts` | FIFO rotation at cap; dedup by coord+savedAt; coord clamp to world bounds. |
| Helper — `cairnOfEchoesWhisper.test.ts` | Deterministic given seed (same seed → same past-self vs grandfather roll → same line index); grandfather rate within tolerance over 10k samples (expect ~1%); variant routing picks the right line bag. |
| Save migration — `SaveManager.test.ts` | v9 → v10 round-trip preserves all existing fields + initialises empty `fallenCairns` + `oldDroverRevealedCount: 0`. Save with 50 cairns + one more death rotates oldest out. `incrementOldDroverRevealed()` caps at 25. |
| Scene wire — `CairnOfEchoesScheduler.test.ts` | Load with 5 cairns → tick with player at one coord → sprite created, walk-over fires once, second walk-over same run does not re-fire. Tick with player far → sprite destroyed (memory hygiene). |
| AncestralEcho handoff — `ancestralEcho.test.ts` (extend) | onSettle callback fires at 30s lifetime end. Scheduler receives the new cairn. |
| Replay — `replayDeterminism.test.ts` | Record run with cairns A+B+C. Live save FIFO-rotates A out. Replay → recorded cairns A+B+C reproduce same whispers. |
| i18n parity — `i18n.locale.test.ts` (existing fence) | All new EN leaves have SCS overlays. New `ui.cairn.*` / `ui.almanac.oldDrover.*` / `ui.banter.cairn_walkover.*` namespaces parity-locked. |
| Achievement — `AchievementManager.test.ts` | Existing `ancestralEchoesTouched` counter increments on cairn walk-over (the cairn IS the persistent echo). |
| E2E — `e2e/moor-remembers.spec.ts` | Die in run 1 (force death at known coord via DEBUG hook). Restart. Walk to cairn. Assert: cairn sprite renders, walk-over fires caption + floating buff text, meta save `ancestralEchoesTouched` incremented. |

Estimated **+22 unit assertions**, **+1 e2e test**, **~8 KB bundle delta** (lore leaves dominate; the synth is procedural, no audio assets).

---

## 6. Pre-ship 5-question gate (per [`CONTRIBUTING.md`](../../../CONTRIBUTING.md))

1. **Filters cleared?** Stand-the-test (extends shipped Ancestral Echo cleanly; meta save v9→v10 follows the same migration pattern as v8→v9) ✓ ; ultra-efficient (cull beyond 600px, FIFO cap, no per-frame RNG outside seeded branch, scheduler tick is O(n) over visible cairns) ✓ ; secure (no new user-input handling; cairn coords are player-generated from death position, no XSS surface) ✓ ; technically impressive (composes with five existing systems — meta-save migration + Almanac + caption + banter parity + replay determinism — all five carry the new content without modification) ✓ ; minimal slop (no premature V2 stub, no telemetry, no over-eager unlocks) ✓.

2. **Chains walked?** Save chain (v9 → v10 + migration test + DEFAULT_SAVE update) ✓ ; new-mechanic chain (pure helper + helper tests + scene orchestrator + scene wire + i18n EN+SCS + e2e) ✓ ; i18n parity (banter + Almanac + caption leaves all paired) ✓ ; replay determinism (recorded cairn payload preserves T1 contract; new regression in `replayDeterminism.test.ts`) ✓ ; a11y (captions for all whispers; minimap marker; respects `reduceFlashing` on candle glow; floating buff text gated by `damageNumbers` setting) ✓ ; new-mechanic safety pattern (a) hazard immunity not touched — cairns deal no damage; (b) all RNG via seeded branch; (c) sprites textures.exists()-guarded; (d) scheduler tick called AFTER pause-gate ✓.

3. **Invariants surfaced?** Meta save schema +2 fields (`fallenCairns: FallenCairn[]`, `oldDroverRevealedCount: number`), version 9 → 10. Replay payload +1 field (`cairns: FallenCairn[]`), version bump per existing replay-blob versioning. Almanac structure +1 entry (in FindsBook or new OldDroverBook — implementing agent's call). Banter `cairn_walkover` pool slotted at priority 34 (between Clootie 33 and Reliquary 45 — free slot verified). New i18n namespaces under `ui.cairn.*` and `ui.almanac.oldDrover.*` — parity-fenced.

4. **Verification proof?** TBD at ship — `npm run ci:all` output + e2e log.

5. **Soul Check passed?** Per [`docs/DESIGN_SOUL.md`](../../DESIGN_SOUL.md) six questions:
   - **warmth** — whispers grave-warm not maudlin ("That's me, down there." is acknowledgement, not pity) ✓
   - **clarity** — cairn = death spot, walk over = small inheritance, instantly legible ✓
   - **tone** — Old Drover speaks as elder kin in established Scots vocabulary, not narrator voice ✓
   - **voice** — Scots second-person to the haggis; Hearth grave register for past-self; Old Drover layered atop with lower-formant elder texture ✓
   - **moment-stack** — first cairn appearance + first grandfather whisper + Almanac fill-out + 25th-leaf completion arc = four signature moments per save ✓
   - **kindness** — death gets *given back* to you as inheritance; no shame in falling; the moor *remembers you with care* ✓

---

## 7. Phase boundaries

### Ships in this spec (V1)

- `whs_meta_save` schema v9 → v10 (`fallenCairns: FallenCairn[]`, cap 50, FIFO; `oldDroverRevealedCount: number`, 0..25).
- `recordFallenCairn` helper + tests.
- `CairnOfEchoesScheduler` orchestrator + tests (sister to `CairnStackingScheduler`).
- AncestralEcho handoff — 30s ghost settles into permanent cairn.
- Cairn sprite (small stacked-stones silhouette + candle flicker glow).
- Walk-over interaction (whisper SFX + caption + floating buff text + +1% stat-keyed buff + banter).
- Procedural Web Audio whisper synth — two voice textures (past-self, grandfather).
- Grandfather whisper at 1% per walk-over.
- New Almanac page "The Old Drover" — 25 lore leaves, reveal as collected.
- Banter pool `cairn_walkover` priority 34.
- Minimap dim-slate cairn markers.
- Replay payload carries `cairns: FallenCairn[]` at run-start.
- EN + SCS i18n parity across all new namespaces.
- E2E `e2e/moor-remembers.spec.ts` smoke (die → restart → walk over → assert).
- CLAUDE.md mechanic-table entry + DESIGN_IDEAS §1 entry truth-up.
- HUGE_INITIATIVES_MASTER_PLAN.md "what's done" row added.

### Deferred (V2 — earns its own spec)

- **The Cailleach Gauntlet** ✅ shipped 2026-05-22. Spec at [`2026-05-22-moor-remembers-v2-design.md`](2026-05-22-moor-remembers-v2-design.md). Diverges from the sketch above in one place: "ALL cairns wipe (the moor forgets)" softened to **extinguish the 7 gauntlet cairns** (their candles dim, but the cairns themselves abide). Rationale: wiping 50 cairns of player history on one death conflicts with the game's hearth-warm soul; the partial extinguish keeps loss meaningful without erasing the player's investment.
- **Wreathed cairns for victories.** Distinct sprite variant for cairns left by victorious runs. Permanent slot exemption from FIFO rotation.
- **Drover quests.** At 80% Old Drover lore revealed, the grandfather starts asking for things ("walk to the third loch in under 8:00"). Reward = next-tier inherited buff bracket.
- **Seasonal cairn dressing.** During Samhain, cairns gain a soft purple-blue candle. During Hogmanay, a single sprig of heather. Pure cosmetic.
- **Cairn-shared friends list.** Local-only "challenge cairns" placed where a friend died (share-URL extension carrying their cairn). Tied to existing W82 share-URL infrastructure. Deferred until P3 cloud-save lands or a friends layer arrives.

---

## 8. Dispatch brief

This spec doubles as a dispatch brief. A subagent should walk §3 → §4 → §5 in order and ship without escalation. Every file path is canonical or `tbd-by-reading-existing-shape` (Almanac integration); every catalogue addition is a literal string; the sister-pattern reference (`CairnStackingScheduler`) is the canonical shape to mirror.

Estimated session size: **3–4 hours** including verification, i18n authoring, lore-leaf authoring, replay determinism regression, e2e smoke, and memory truth-up. The lore authoring (25 grandfather leaves) is the longest single section — should be drafted in a sitting rather than spread thin.

**Critical-path order:**
1. Save schema v9 → v10 + migration test (foundation; everything else reads from this).
2. `fallenCairns.ts` helper + tests (pure; testable without Phaser).
3. `cairnOfEchoesWhisper.ts` helper + tests (pure; testable without Phaser).
4. `CairnOfEchoesScheduler.ts` + tests (scene-bound; mirror `CairnStackingScheduler`).
5. AncestralEcho `onSettle` callback (one-line handoff).
6. GameScene wire + minimap markers.
7. i18n authoring (EN + SCS in same commit — parity fence enforces).
8. Banter pool authoring.
9. Almanac page wire.
10. Whisper synth.
11. Replay regression.
12. E2E smoke.
13. Truth-up (CLAUDE.md table entry, DESIGN_IDEAS §1, HUGE_INITIATIVES_MASTER_PLAN.md).

---

*Spec lock. Implementation immediately.*
