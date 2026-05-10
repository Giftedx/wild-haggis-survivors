# R1 Relics — M4.5 polish plan

> **STATUS:** SHIPPED 2026-04-24 in commit `214e9ce`. All 5 effect wires + T29 histogram live; bundle delta +1.82 KB gzip.
>
> **For agentic workers:** Use superpowers:executing-plans to pick up individual tasks. Each is independently scoped — order by interest / available wire-site.

**Goal:** Wire the 5 complex Relic effects deferred from M4, plus stand up the T29 playtest feedback loop. All pure-fn math + driver API is already in place (see R1 M4 `9d5f289`); these are localised edits at each effect's natural wire site.

**Prerequisite:** R1 shipped (`17907ec`). No data changes needed — every Relic's slot, pickup, tooltip, chronicle row, and analytics already work. These tasks make the remaining 5 effects *actually affect gameplay* instead of being cosmetic sporran decorations.

---

## Deferred effect wires

### Task P1: cairn_stone — heather-kill magnet gems

**Pure API in place:** `RelicEffectDriver.tryCairnStoneHeatherKill(nowMs)` returns true iff the cooldown has lapsed. State lives in the driver; cooldown constant `CAIRN_STONE_COOLDOWN_MS = 5000`.

**What's needed:**
- In `EnemyKillHandler.handle` (or equivalent kill path), detect whether the kill happened in a heather biome tile.
  - `BiomeManager.getBiomeAt(x, y)` returns the current biome id; check for `'heather'`.
- If yes and `driver.tryCairnStoneHeatherKill(scene.time.now)` returns true, spawn a pickup-magnet gem.
  - Reuse `ceilidhChainMagnet` code path from `Player.grantCeilidhChainMagnet(radius, durationMs)` — or spawn a single gem with radius 40 px for 2000 ms via the existing magnet spec.

**Test:** extend `src/scenes/game/EnemyKillHandler.test.ts` with a "heather kill + cairn_stone held → spawns magnet" assertion. Mock `BiomeManager.getBiomeAt` through a new hook.

---

### Task P2: pictish_compass — minimap pin reveal

**Pure API in place:** `driver.isHolding('pictish_compass')` is the single gate.

**What's needed:**
- `src/ui/Minimap.ts` already accepts `chestMarkers` + `reliquaryMarker`. Add a third optional array for relic-pickup pins.
- `RelicPickupSpawner` exposes an `getActivePickupPositions(): { x: number; y: number; rarity: RelicRarity }[]` accessor.
- `GameScene.update` only passes the new array when `driver.isHolding('pictish_compass')`, else passes `[]` (no pins).
- Chests already pin unconditionally — pictish_compass doesn't change that; it adds relic pins.

**Risk:** clutter — with 3 chests + reliquary + relic drops, minimap could get noisy. Playtest whether pictish_compass is valuable or overwhelming.

---

### Task P3: fishermens_net — per-hit enemy velocity dot

**Pure API in place:** `applyFishermensNetDamage(baseDamage, velocityDotTowardPlayer)`.

**What's needed:**
- `WeaponSystem.setHitDamageModifier` callback currently gets `(damage, nowMs, isElite)`. Add a fourth arg: `velocityDotTowardPlayer: number`.
- At the call site in `dealDamageToEnemy`, compute `const dot = (playerX - enemy.x) * enemy.body.velocity.x + (playerY - enemy.y) * enemy.body.velocity.y`.
- GameScene's modifier chain threads the dot to `driver.modifyFishermensNetDamage(damage, dot)` after bronze_clasp + highland_torque.

**Gotcha:** stationary enemies have `body.velocity ≈ (0, 0)` so dot = 0 → baseline damage. Fleeing enemies (e.g. `buckfast_ned` retreat on low HP?) produce negative dot → +30%.

---

### Task P4: bodhran_skin — music beat phase damage

**Pure API in place:** `applyBodhranSkinBeatDamage(baseDamage, msSinceLastBeat, beatPeriodMs)`.

**What's needed:**
- Expose `ProceduralMusicEngine.getMsSinceLastQuarterNote(): number` + `getQuarterNotePeriodMs(): number` getters.
  - The `Conductor` already tracks beat phase for the Euclidean rhythm layer; surface it.
- In the `WeaponSystem.setHitDamageModifier` chain, add a driver call `driver.modifyBodhranBeatDamage(dmg, ms, period)`.
- GameScene reads music engine getters once per frame and passes into the modifier closure (avoid sampling per-hit).

**Risk:** too subtle to notice. Consider adding a one-frame flash or pitch-up sting on the weapon SFX when an on-beat hit fires, gated by reduceParticles. Playtest will tell.

---

### Task P5: fingals_horn — Fianna summon entity

**Pure API in place:** `driver.isFingalsHornAvailable()` + `driver.activateFingalsHorn()` (one-shot, returns `{ fired, summonCount: 3, durationMs: 10_000 }`).

**What's needed:**
- New entity `src/entities/FiannaSpirit.ts` — spectral Celtic warrior sprite, 10s lifetime, melees nearby enemies.
  - Reuse existing enemy AI helpers (chase-nearest-enemy variant of `Enemy.chase`).
  - New texture in `BootScene` (drawn programmatically; bone-ivory `particleColour` 0xe8d8a0).
- New PauseMenu button alongside Whisky Dram's — same pattern, gate on `driver.isFingalsHornAvailable()`.
- On activation: spawn 3 Fianna at player position, despawn after 10s.

**Scope:** This is the biggest — essentially a new entity class + AI + spawn + art. ~4-6 hours.

---

## Task P6: T29 playtest loop

Already-deferred M4 task. Feeds into the R1 kill criteria:
- No Relic has >70% pick rate when offered.
- No Relic has <5% pick rate.
- Discard-UI confusion rate <3/10 playtesters.

**What's needed:**
- Add a dev-only Chronicle pane that aggregates held Relics across recent runs (histogram) — so a playtester self-reports "picked N of each" without external tooling.
- `relic_picked` analytics is live (M4 T28); once real telemetry lands (Cloudflare Pages consent-gated form), the balance pass consumes it.

**Kill criteria review** — if any Relic violates thresholds, the remedy is a targeted number tweak in `src/systems/relics/relicEffects.ts`, not a structural rewrite. The pure layer makes a balance pass a one-file edit.

---

## Ship gate

When all 5 effect wires + P6 playtest loop land:
- [ ] `npm run ci` green.
- [ ] Bundle delta from `17907ec` < +10 KB gzip (entity + getters only).
- [ ] Manual smoke: each of 5 effects fires visibly in a 1-minute run.
- [ ] Commit: `feat(relics): R1 M4.5 — all 18 effects live`.

---

## Notes for future sessions

The R1 M1-M4 architecture is stable. Relic effects are a pure-fn layer (`relicEffects.ts`), a scene-agnostic dispatcher (`RelicEffectDriver`), and wire sites at existing system hooks. Adding Relic N+1 in Phase 2 (Cailleach's Whisker, Taxman's Quill, Prince Charlie's Pocket Mirror — see spec §3 reserved slots) is:

1. Author the pure fn + test.
2. Expose via `RelicEffectDriver.modifyX(...)` or `tickX(...)`.
3. Wire at the consuming system's hook.
4. Add i18n leaves (EN + SCS).
5. Add catalogue entry in `src/data/relics.ts`.

No infrastructure changes needed.
