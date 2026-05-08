# GameScene Regrowth Audit

**Date:** 2026-05-08
**Author:** Phase 5 prep (codebase restructure plan, `docs/superpowers/plans/2026-04-30-codebase-restructure.md`)
**Floor:** 1656 LOC at T401 closeout (commit `37187f8`, 2026-04-26)
**Current:** 1672 LOC at HEAD (2026-05-09; Phase 5 effectively complete — within 16 LOC of T401 floor)
**Delta from audit start:** -1202 LOC reabsorbed via the bucketed extractions enumerated below.

> **STATUS (2026-05-09):** Phase 5 deflation complete. GameScene now 1672 LOC,
> ratchet locked at 1680 by Phase 7 re-baseline. Reaching the T401 charter target
> ≤1200 requires the formal facade rewrite (Combat / Progression / Nodes /
> Persistence) which is explicitly out of scope for this restructure plan.

## Method-by-method LOC distribution

| Method | LOC range | Approx LOC | Bucket |
|--------|-----------|-----------:|--------|
| `create()` | 615–1619 | 1004 | **Multiple buckets — see below** |
| `updateInner(delta)` | 1724–1995 | 272 | **Per-frame buckets** |
| `tickRuneSystem(delta)` + `applyRunePulses()` + `handleBurnsPlatterCollect()` | 2411–2599 | 188 | Rune-system tick |
| `launchActIntermission(actN)` | 2266–2378 | 112 | Moor Road intermission |
| `discoveryRunId` + `grantRune` + `buildRouteResumeContext` | 2378–2619 | (~70) | Misc helpers |
| `trySpawnAncestralEcho()` | 2101–2147 | 46 | Ancestral echo spawn |
| `tryMoorMercyLuck(hpBefore)` | 2073–2101 | 28 | Moor mercy luck |
| `spawnStandingStones()` + `spawnReliquary()` | 2147–2199 | 52 | Static landmark spawns |
| `showRunIdentityToast(isResume)` | 2199–2232 | 33 | Run-identity toast |
| `initNodeMapForAct()` | 2232–2266 | 34 | Node-map lifecycle (act init) |
| `installHaarFog` + `handleBiomeEnteredForHaar` | 2706–2740 | 34 | Haar fog wiring |
| `resetTransientRunState` | 510–602 | 92 | Per-run state wipe |
| Setters / getters / scene-flow trivia | various | ~200 | Stable surface — leave |

`create()` is the elephant. Splitting `updateInner` is also high-leverage — its branches mostly call into systems, but each one has 2–10 LOC of glue around it.

## `create()` regrowth wavefronts

Reading the section comments inside `create()` (lines 615–1619), the buckets land naturally:

| Bucket | LOC range | LOC | Helper target |
|--------|-----------|-----:|---------------|
| 1. Run name + RNG + rune-bag + replay setup | 615–770 | 155 | `scenes/game/runSetup.ts` (subsumes `runName`, `runRng`, `runeBag`, replay branching) |
| 2. Player + curse + composedStats wiring | 770–810 | 40 | Already partly in `applyCurseAndComposeStats.ts`; keep |
| 3. World dressing + biome + camera + GrowthSystem | 640–810 | (already extracted via `BiomeController`) | — |
| 4. HazardZones init + system construction | 815–880 | 65 | `scenes/game/coreSystemsInstall.ts` (already partly extracted) |
| 5. Permanent upgrades + variant + ironmoor flag | 880–905 | 25 | Already extracted (`applyPermanentUpgrades.ts`) — gluework only |
| 6. Moor-moment scheduler + run persistence bridge | 905–1066 | 161 | `scenes/game/runPersistenceInstall.ts` (extends `RunPersistenceCoordinator`) |
| 7. UpgradeCardsUI + kill-cascade + collision wiring | 1072–1244 | 172 | `scenes/game/runtimeListenersInstall.ts` (kill-cascade hooks, level-up flow, collision/overlap wiring) |
| 8. HUD + Juice + Banter + curse-pact toast | 1245–1267 | 22 | `scenes/game/uiInstall.ts` (HUD/banter/captions seam) |
| 9. Run-start ceremony (already extracted to `runStartCeremony.ts`) | 1271–1287 | 16 | — |
| 10. Ambient weather + hazards system + relic spawner | 1288–1420 | 132 | `scenes/game/ambientInstall.ts` (weather + hazards + relicOrchestrator wiring) |
| 11. Replay watching-toast + ancestor whisper | 1421–1457 | 36 | `scenes/game/runIntroToasts.ts` |
| 12. Minimap biome tints + node-map lifecycle | 1458–1536 | 78 | Already partly in slice 7 (`fe382ea`); finish the extraction |
| 13. Treasure-chest timer | 1559–1574 | 15 | `scenes/game/treasureChestTimer.ts` |
| 14. Run-intro fade + ancestral echo + clip recorder + countdown + kill-mantle wiring | 1575–1619 | 44 | `scenes/game/runIntroFlow.ts` |

Twelve buckets, ~960 LOC of `create()` body that can move out. After extraction, `create()` would shrink to ~615 + 50 + 100 (call sites) ≈ **~750 LOC** — a single 750-LOC method is still big but matches the pattern of other game scenes.

## `updateInner(delta)` regrowth wavefronts

| Bucket | Approx LOC | Helper target |
|--------|-----------:|---------------|
| Replay playback pump | 5 | (already in `replayBridgeInstall.ts`) |
| Pause/gamepad Start handling | 8 | inline (small) |
| Raw + scaled tickers + caption tick | 12 | inline (clear) |
| Shrine-granted timed buffs | 8 | `scenes/game/runtimeTickHooks.ts` |
| Rune condition tick | 12 | `scenes/game/runtimeTickHooks.ts` |
| Pending encounter/elite wave poll | 6 | `scenes/game/runtimeTickHooks.ts` |
| Dev pool top-up | 10 | `scenes/game/runtimeTickHooks.ts` |
| Low-HP neglect tracker | 8 | `scenes/game/runtimeTickHooks.ts` |
| Player input + movement (raw delta) | 35 | `scenes/game/runtimeTickHooks.ts` |
| Heather-mantle pulse | 12 | `scenes/game/runtimeTickHooks.ts` |
| Node-map proximity tick | 6 | `scenes/game/runtimeTickHooks.ts` |
| Relic effect tick + grans_teapot heal | 18 | `scenes/game/runtimeTickHooks.ts` |
| Weapon multipliers fold | 35 | `scenes/game/runtimeTickHooks.ts` |
| HUD update | 30 | inline (single call) |
| Spawn / damage / drift effects | 70 | `scenes/game/runtimeTickHooks.ts` |

A single `runtimeTickHooks.tickAll(scene, delta)` taking the GameScene as a typed seam could absorb 200+ LOC of glue. Stop condition: `updateInner` reduced to a 30–50-LOC dispatcher.

## Rune system tick (line 2411–2599)

`tickRuneSystem` (80 LOC) + `applyRunePulses` (100 LOC) + `handleBurnsPlatterCollect` (6 LOC). All three are pure orchestration over `runeSystem` / `runeBag` — zero direct UI work. Extract to **`scenes/game/runeSystemController.ts`** with a single `tick(scene, delta)` entry point. Probable yield: -180 LOC.

## Moor / static spawns (lines 2073–2266)

`tryMoorMercyLuck`, `trySpawnAncestralEcho`, `spawnStandingStones`, `spawnReliquary`, `showRunIdentityToast` — five helpers each 30–50 LOC, all called once or twice from `create` or `update`. Extract to **`scenes/game/moorMoments.ts`** as named functions. Probable yield: -180 LOC.

## `launchActIntermission(actN)` (lines 2266–2378)

112 LOC inline. Already partly extracted (`actIntermissionResolve.ts` exports `resolveDefaultRoute` + `buildRoutePick`). Pull the scene-launch path itself into the helper so GameScene's method becomes a 5-line delegator. Probable yield: -90 LOC.

## Recommended phase 5 sequence

1. **Audit** (this doc) — done.
2. **Bucket 1: Rune system controller** — single helper, 180-LOC yield, no UI surface, low blast radius. **SHIPPED 2026-05-08 (commit a8b2529).** GameScene 2874→2706 LOC.
3. **Bucket 2: Moor moments** — five named functions in `scenes/game/moorMoments.ts` (mercy luck, ancestral echo, standing stones, reliquary, run-identity toast). **SHIPPED 2026-05-08.** GameScene 2706→2616 LOC (delegators retained for call-site compat; net yield −90 LOC vs audit's projected −180 because state fields stay on scene for the existing tick / minimap / destroy paths).
4. **Bucket 3: launchActIntermission slim-down** — 90-LOC yield. E2E gate (Moor Road act sequence). **SHIPPED 2026-05-08.** Resolver + scene-launch path extracted to `scenes/game/actIntermissionLauncher.ts` as a hooks-based named function. GameScene 2616→2533 LOC. Both `e2e/w2-moor-road.spec.ts` specs (smoke + full boss sequence) green on chromium-desktop.
5. **Bucket 4: `runtimeTickHooks`** — extract one feature at a time (rune tick, mantle pulse, weapon multiplier fold, etc), commit per bucket. ~200-LOC yield. E2E gate after every two buckets. **Bucket 5a (weapon-multiplier fold) SHIPPED 2026-05-08** — `scenes/game/weaponMultiplierFold.ts`; GameScene 2533→2519 LOC. **Bucket 5b SHIPPED 2026-05-08** — `scenes/game/runtimeTickHooks.ts` consolidates three hooks (`tickMantlePulse`, `tickSecondCounter`, `tickRelicEffectFrame`); GameScene 2519→2504 LOC. Ratchet 2525→2510. Remaining sub-extracts open: player input + movement (~35 LOC), spawn / damage / drift effects (~70 LOC), HUD update glue (~30 LOC).
6. **Bucket 5: `create()` `*Install.ts` modules** — 6 install helpers, 600-LOC yield. **Highest blast radius** — full E2E + manual smoke per install module. Stop condition: GameScene ≤1700 LOC. **Bucket 11 (replay watching-toast + ancestor whisper) SHIPPED 2026-05-08** — `scenes/game/runIntroToasts.ts`; GameScene 2504→2483 LOC. Ratchet 2510→2490. **Bucket 14 partial (installClipRecorder) SHIPPED 2026-05-08** — capture-enabled bootstrap factored to `scenes/game/installClipRecorder.ts`; GameScene 2483→2475 LOC. Ratchet 2490→2483. **Bucket 7 partial (wireWeaponSystemListeners) SHIPPED 2026-05-08** — four `weaponSystem.events` listeners (enemyKilled cascade + cascade-rune bookkeeper, damageDealt, projectileTrail, weaponFired) factored to `scenes/game/wireWeaponSystemListeners.ts`; GameScene 2475→2443 LOC. Ratchet 2483→2450. **Bucket 7 partial (wireXpSystemListeners) SHIPPED 2026-05-08** — `levelup` + `echoReady` listeners factored to `scenes/game/wireXpSystemListeners.ts`; GameScene 2443→2426 LOC. Ratchet 2450→2433. **Bucket 1 partial (installWorldDressing) SHIPPED 2026-05-08** — flora / wildlife / mist construction (with ordered runRng.branch() calls preserved verbatim) factored to `scenes/game/installWorldDressing.ts`; GameScene 2426→2425 LOC. Ratchet 2433→2432. Replay determinism (8/8 in `replayDeterminism.test.ts`) holds.

After the full sequence, GameScene target: **1656 LOC (T401 floor) ± 100**. Charter target ≤1200 still requires the formal facade rewrite (Combat / Progression / Nodes / Persistence) explicitly out of scope here.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Helper extraction breaks scene-reuse reset path | Medium | After each extraction, run e2e + restart-mid-run smoke; confirm the helper has a clean reset path or is reconstructed in `create` |
| Lazy-getter chains break across helpers | Medium | Helpers take a `GameScene` reference (matches `BiomeController`/`RelicOrchestrator` pattern); access via `scene.getXyzSystem()` rather than direct field reads |
| Replay determinism regression (RNG branch order, seeded spawns) | Medium | Run `src/replay/replayDeterminism.test.ts` after every bucket; any regression demands the bucket be reverted and the helper take an RNG-aware seam |
| Cross-bucket dependency (e.g. install order matters) | Medium | Each bucket commit must keep the existing call order; only the inline body moves |
| Vitest passes but tsc fails | Low | Phase 4 + 6 already running this gate; same `npm run build` discipline applies |

## Out of scope (explicit, restated from plan)

- Player.ts / Enemy.ts further-split — already factored.
- banter.ts split — pure data, parity-fenced.
- AudioSystem.ts split — no obvious sub-system seams.
- GameScene formal facade rewrite (T401 charter) — 2-3 person-weeks, not in this restructure plan.
