# Auld Reekie Ghaist — Boss Design Spec

**Date**: 2026-05-24  
**Status**: Approved — implementation planned  
**Slot**: 18:30 (1110 s) — fills gap between Nuckelavee (17:00) and Hunter General (20:00)  
**Family**: Urban  
**Post-bell**: No — regular time-gated boss

---

## Identity

Edinburgh's gas-lamp ghost. A Victorian gentleman spectre who has conducted ghost tours for 150 years. Slow, measured, utterly confident. His lantern never goes out — until it does.

*"Auld Reekie"* (Old Smoky) is Edinburgh's historic nickname, earned from coal-and-tallow smoke that once blanketed the Old Town. The ghost-tour industry is Edinburgh's most lucrative supernatural export. This boss is its proprietor.

Cultural refs: `SCOTTISH_RESEARCH_DEEP.md` §14.3 (Edinburgh character), §6.9 (Old Town atmosphere).

---

## Stats

| Field | Value |
|---|---|
| key | `auld_reekie` |
| nameKey | `boss.auld_reekie.name` |
| warningKey | `ui.bossWarning.auld_reekie` |
| spawnTimeSec | 1110 (18:30) |
| HP | 2600 |
| damage | 26 |
| speed | 38 px/s |
| scale | 2.1× |
| xpValue | 90 |
| texture | `boss_auld_reekie` |
| behaviorOverride | `auld_reekie` |

---

## Phases

### Phase 1 — "Ladies and Gentlemen, Welcome to Edinburgh" (HP 100% → 65%)

- Slow glide toward player (`speedMul` 1.0)
- Summons 4 `tourist_ghost` minions at spawn (single call via SpawnSystem event)
- **Lantern lob** every 3500 ms: single aimed projectile (amber orb, 200 px/s, 18 dmg, `lantern_orb` texture)

### Phase 2 — "Mind Where You Step — the Fog Rolls In" (HP 65% → 35%)

- Summons 2 more `tourist_ghost` minions on phase-transition tick
- `speedMul` lifts to 1.15
- **Lamp blink** cycle every 5000 ms:
  1. Telegraph (1200 ms): target lamp-post anchor glows amber — `shouldStartBlinkTelegraph` flag
  2. Execute: boss teleports to anchor, fires double lantern shot at player — `shouldExecuteBlink` flag
- **Gas pulse** every 14000 ms: 280 px AoE, 10 dmg, 1000 ms misty-yellow telegraph ring, 1500 ms 0.65× slow — `shouldStartGasTelegraph` / `shouldFireGas` flags

### Phase 3 — "You're the Last One. The Tour Ends Here." (HP 35% → 0%)

- `speedMul` lifts to 1.40
- Blink cadence tightens to 3000 ms
- Lantern fires **3-shot fan** (spread 0.30 rad) instead of single — `shouldFireTripleFan` replaces `shouldFireLantern`
- Gas pulse cadence tightens to 8000 ms
- No further tourist summons

---

## New Enemy: `tourist_ghost`

Small passive minions — Victorian and modern tourists as translucent pale-blue ghosts. Slow-chase behavior, clusters naturally between boss and player forcing the player to work through the crowd.

| Field | Value |
|---|---|
| key | `tourist_ghost` |
| texture | `enemy_tourist_ghost` |
| speed | 18 px/s |
| HP | 30 |
| damage | 0 (no player damage) |
| scale | 0.7 |
| xpValue | 5 |
| appearsAt | 9999 (never natural-spawns — boss-summon only) |
| packSize | 1 |
| behavior | `chase` (default) |

---

## Lamp Post Anchor System

4 world positions are calculated once when the boss spawns, stored on the Enemy instance (not in pure state).

**Placement**: 250 px radius from boss spawn position, at 4 quadrant offsets (NE, SE, SW, NW), each ±30 px jitter via seeded `runRng` call at spawn time (replay-deterministic).

**Anchor cycling**: `currentAnchorIdx = (currentAnchorIdx + 1) % 4` — Enemy.ts advances on each `shouldStartBlinkTelegraph`.

**Blink flow**:
1. `shouldStartBlinkTelegraph` → advance anchor idx, set `.setTint(0xffd060)` + glow-ring alpha 0.8 on the target `prop_gas_lamp` sprite
2. `shouldExecuteBlink` → teleport boss to `lampAnchorPositions[currentAnchorIdx]`, fire double lantern shot toward player, restore lamp to default tint
3. A11y caption: "Ghaist blinks to lamp post"

Lamp posts are cosmetic GameObjects (no physics body — no separate `prop_gas_lamp_bright` texture needed; bright state is a tint applied at runtime). They materialise during the entry ritual before the boss fades in.

---

## Pure State Machine (`auldReekieBehaviour.ts`)

Pattern matches `nessieBehaviour.ts` exactly — pure function, no Phaser imports, testable in Vitest node environment.

```typescript
export interface AuldReekieState {
  readonly phase: 1 | 2 | 3;
  // Attack timers
  readonly msSinceLantern: number;
  readonly msSinceBlink: number;
  readonly msSinceGas: number;
  // Telegraph sub-states
  readonly blinkTelegraphing: boolean;
  readonly msBlinkTelegraphElapsed: number;
  readonly gasTelegraphing: boolean;
  readonly msGasTelegraphElapsed: number;
  // One-time summon flags
  readonly summonedPhase1: boolean;
  readonly summonedPhase2: boolean;
  // Speed
  readonly speedMul: number;
  // Output flags (meaningful for current tick only)
  readonly shouldSummonPack: 0 | 4 | 2;
  readonly shouldFireLantern: boolean;
  readonly shouldFireTripleFan: boolean;
  readonly shouldStartBlinkTelegraph: boolean;
  readonly shouldExecuteBlink: boolean;
  readonly shouldStartGasTelegraph: boolean;
  readonly shouldFireGas: boolean;
}

export interface AuldReekieTickInput {
  readonly deltaMs: number;
  readonly hpPct: number;
}
```

### Constants

```typescript
export const AULD_REEKIE_PHASE2_HP = 0.65;
export const AULD_REEKIE_PHASE3_HP = 0.35;

export const LANTERN_CADENCE_MS    = 3500;
export const LANTERN_SPEED         = 200;   // px/s
export const LANTERN_DAMAGE        = 18;

export const BLINK_CADENCE_P2_MS   = 5000;
export const BLINK_CADENCE_P3_MS   = 3000;
export const BLINK_TELEGRAPH_MS    = 1200;

export const GAS_CADENCE_P2_MS     = 14000;
export const GAS_CADENCE_P3_MS     = 8000;
export const GAS_TELEGRAPH_MS      = 1000;
export const GAS_RADIUS_PX         = 280;
export const GAS_DAMAGE            = 10;
export const GAS_SLOW_MUL          = 0.65;
export const GAS_SLOW_MS           = 1500;

export const TRIPLE_FAN_SPREAD_RAD = 0.30;
export const TRIPLE_FAN_COUNT      = 3;

export const SPEED_MUL_P1          = 1.00;
export const SPEED_MUL_P2          = 1.15;
export const SPEED_MUL_P3          = 1.40;

export const LAMP_ANCHOR_RADIUS_PX = 250;
export const LAMP_ANCHOR_RNG_JITTER = 30;
```

---

## Entry Ritual (3–4 s)

1. `prop_gas_lamp` GameObjects materialise at all 4 anchor positions (fade-in 500 ms each, staggered 200 ms apart)
2. Boss fades in from haar fog at spawn position (800 ms)
3. Warning banter fires (`boss_warn.auld_reekie.a` or `.b`)
4. Phase 1 tourist summon (4 × `tourist_ghost`)
5. `AudioSystem.playAuldReekieEntry()` — gas-hiss ambience + lantern-sting

## Outro (2–3 s)

1. Boss dissolves into misty amber vapor (800 ms fade-out)
2. Gas lamps extinguish left-to-right (200 ms each)
3. Loot drop
4. `boss_down.auld_reekie` banter fires
5. Chronicle entry unlocks

---

## Sprites

### `boss_auld_reekie` (BootScene bake)

Victorian gentleman ghost. Top hat (slightly canted), frock coat, translucent grey-white body with misty wisp hem. Right arm raised — holds a gas lantern aloft, amber globe glowing warm. Eyes: gas-lamp yellow flame pupils. Signature mark: soft amber corona radiating from the lantern, pulsing slowly.

Palette: #e8e4dc (body), #f5a623 (lantern glow), #3a3a3a (hat/coat silhouette), #ffffff10 (body translucency).

### `enemy_tourist_ghost` (BootScene bake)

Small translucent pale-blue tourist. Body is a simple rounded silhouette at 0.7 scale. Mix of Victorian bonnet and modern camera accessory floating ghostly at side. No distinct face — just two blue-white eye-spots.

Palette: #a8c8f0 (body), #ffffff (eye-spots), #7090b8 (accessory lines).

### `prop_gas_lamp` (BootScene bake)

Dark iron post (6 px wide, 40 px tall). Amber globe at top (12 px diameter), warm #f5a623 glow, 25% alpha ambient ring (16 px radius). Bright variant (`prop_gas_lamp_bright`) is same + 80% alpha ring + 0.9 tint shift toward white.

### `lantern_orb` (BootScene bake)

10 px radius circle. Fill #f5a623, stroke #ff8c00, 80% alpha. Wisp trail: 4 px fading amber circles at 20% alpha behind movement direction. Distinct from existing net/card/ice projectiles.

---

## i18n Keys

### English (`src/core/i18n.ts`)

```
boss.auld_reekie.name         = "The Auld Reekie Ghaist"
boss.auld_reekie.nameShort    = "Ghaist"
ui.bossWarning.auld_reekie    = "The Auld Reekie Ghaist approaches"

bossChronicle.auld_reekie.title = "The Auld Reekie Ghaist"
bossChronicle.auld_reekie.body  = "Edinburgh's most celebrated ghost tour guide. His lantern never truly goes out, and his tours never quite end. What you thought was the Old Town at night was him, all along."

ui.banter.boss_warn.auld_reekie.a = "The gas lamps are going oot one by one. Somethin's comin through the haar."
ui.banter.boss_warn.auld_reekie.b = "Ye've wandered intae the ghost tour, hen. And noo ye're the attraction."

ui.banter.boss_down.auld_reekie.a = "The last lamp goes dark. Edinburgh keeps its secrets — but no this ane."
ui.banter.boss_down.auld_reekie.b = "That's Edinburgh for ye. Even the ghosts charge admission. Even this ane couldnae collect."
ui.banter.boss_down.auld_reekie.c = "The haar swallows him whole. Somewhere above the rooflines, a gas lamp flickers back on."

ui.weeTale.death.auld_reekie   = "The tour had one more stop. You were it."
ui.weeTale.victory.auld_reekie = "No refunds, no reviews, no ghost guide left standing — Edinburgh at its most honest."
```

### Scots overlay (`src/core/i18n.scs.ts`)

```
ui.banter.boss_warn.auld_reekie.a = "The gas lamps are gaun oot ane by ane. Somethin's comin through the haar."
ui.banter.boss_warn.auld_reekie.b = "Ye've wandert intae the ghaist tour, hen. An noo ye're the attraction."
ui.banter.boss_down.auld_reekie.a = "The last lamp gaes daurk. Edinburgh keeps its secrets — but no this ane."
ui.banter.boss_down.auld_reekie.b = "That's Edinburgh fur ye. Even the ghaists chairge admission. Even this ane couldnae collect."
ui.banter.boss_down.auld_reekie.c = "The haar swallies him hale. Somewhere abune the rooflines, a gas lamp flickers back on."
ui.weeTale.death.auld_reekie     = "The tour had ane mair stop. You were it."
ui.weeTale.victory.auld_reekie   = "Nae refunds, nae reviews, nae ghaist guide left staundin — Edinburgh at its maist honest."
```

---

## A11y Captions

| Trigger | Caption |
|---|---|
| Boss spawn | "The Auld Reekie Ghaist — Edinburgh ghost tour boss has appeared" |
| Phase 2 entry | "Gas lamps materialise — Ghaist begins lamp-post blinking" |
| Blink telegraph | "Lamp post glowing — Ghaist incoming" |
| Blink execute | "Ghaist teleported to lamp post" |
| Gas telegraph | "Gas leak expanding — move away" |
| Phase 3 entry | "Ghaist final phase — lantern fan attacks" |

---

## Audio SFX (3 new calls on AudioSystem)

| Method | Sound | Design |
|---|---|---|
| `playAuldReekieEntry()` | Gas-hiss ambience + lantern sting | White noise swell 300 ms + 440 Hz sine chime 200 ms |
| `playLanternLob()` | Soft whoosh + amber shimmer | 400→600 Hz sine sweep, 180 ms, quiet |
| `playGasLeak()` | Hiss-expand | White noise burst 80 ms + 200→100 Hz LP sweep 600 ms |
| `playGhaistBlink()` | Disappear + reappear pop | 800 Hz sine fade-out 100 ms + 600 Hz sine fade-in 100 ms, 200 ms gap |

---

## Wee Tales Integration

In `src/utils/weeTale.ts` — add two entries:

```typescript
{ requires: ['auld_reekie'], forbids: ['victory'], key: 'ui.weeTale.death.auld_reekie' }
{ requires: ['auld_reekie', 'victory'], forbids: [], key: 'ui.weeTale.victory.auld_reekie' }
```

`auld_reekie` tag is emitted into `RunExitComposer.getBossKilledKeys()` when the boss is defeated (same as all other bosses — no new plumbing needed).

---

## Replay Determinism

- Lamp anchor positions: 4 `runRng.between(-JITTER, JITTER)` calls at boss spawn time, order locked. Append-only to the RNG stream after last existing boss spawn call.
- Tourist ghost positions: `runRng.between()` for spread offset at summon time (existing SpawnSystem pattern).
- All behavior state transitions: pure function of `{deltaMs, hpPct}` — no RNG consumed.
- Gas pulse: centered on boss position — no RNG.

T1 contract maintained.

---

## File Summary

### New files

| Path | Purpose |
|---|---|
| `src/entities/auldReekieBehaviour.ts` | Pure state machine |
| `src/entities/auldReekieBehaviour.test.ts` | Vitest unit tests |
| `src/art/sprites/bosses/auldReekie.ts` | Boss sprite draw function |
| `src/art/sprites/enemies/touristGhost.ts` | Tourist ghost sprite |
| `src/art/sprites/props/gasLamp.ts` | Gas lamp prop (normal + bright) |
| `src/art/sprites/projectiles/lanternOrb.ts` | Lantern projectile |
| `e2e/auld-reekie.spec.ts` | E2E smoke spec |

### Modified files

| Path | Change |
|---|---|
| `src/data/enemies.ts` | `'auld_reekie'` to `EnemyBehavior` union; `tourist_ghost` to `ENEMY_TYPES`; boss entry to `BOSS_CONFIGS`; key to `BOSS_NAMES` |
| `src/entities/Enemy.ts` | `auldReekieState` + `lampAnchorPositions` + `currentAnchorIdx` fields; `behaviorAuldReekie()` method; switch case |
| `src/scenes/BootScene.ts` | Bake 4 new textures |
| `src/core/i18n.ts` | All EN keys |
| `src/core/i18n.scs.ts` | All SCS overlay keys |
| `src/utils/weeTale.ts` | 2 new catalogue entries + `auld_reekie` tag |
| `src/systems/AudioSystem.ts` | 3 new SFX methods |
| `docs/DESIGN_IDEAS.md` | Mark `auld_reekie` ✅ shipped |
