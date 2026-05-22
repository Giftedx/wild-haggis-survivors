/**
 * Phase 5 Bucket 6 partial — bundles the four core combat-system ctors
 * that GameScene.create() built inline (StatusFxPool, SpawnSystem,
 * WeaponSystem, XPSystem) plus the WeaponSystem.setHitDamageModifier
 * closure that composes four relic-driven damage modifiers + the
 * bodhran-beat phase from the shared music engine.
 *
 * Why bundled: the four ctors run consecutively, share the same
 * runModifiers source, and feed each other — WeaponSystem reads the
 * SpawnSystem enemy group, XPSystem reads neither but is part of the
 * same "combat heartbeat" install. The modifier closure has to live
 * here because it's wired via `weaponSystem.setHitDamageModifier`
 * during the same setup pass; pulling the closure out without the
 * setter call would split a single contract across two files.
 *
 * Lazy `getRelicEffectDriver` — the driver is a `relicOrchestrator
 * .getDriver()` delegate; orchestrator may not have its driver
 * instantiated by the time create() runs, but every weapon hit fires
 * later, so the driver resolves at hit-time.
 *
 * Pure helper — no Phaser imports beyond Scene type. Each system
 * already has standalone tests; this helper is exercised through the
 * GameScene create-path E2E specs.
 */
import type * as Phaser from 'phaser';
import { StatusFxPool } from '../../systems/StatusFxPool';
import { SpawnSystem } from '../../systems/SpawnSystem';
import { WeaponSystem } from '../../systems/WeaponSystem';
import { XPSystem } from '../../systems/XPSystem';
import { Enemy } from '../../entities/Enemy';
import { musicEngine } from '../../systems/music/ProceduralMusicEngine';
import type { ISceneContext } from '../../core/ISceneContext';
import type { RunModifiers } from '../../core/RunModifiers';
import type { RelicEffectDriver } from '../../systems/relics/RelicEffectDriver';
import type { BossHpTracker } from './BossHpTracker';

export interface InstallCoreCombatSystemsOpts {
  scene: Phaser.Scene & ISceneContext;
  runModifiers: RunModifiers;
  bossHpTracker: BossHpTracker | null | undefined;
  getRelicEffectDriver(): RelicEffectDriver | null;
}

export interface InstallCoreCombatSystemsResult {
  statusFxPool: StatusFxPool;
  spawnSystem: SpawnSystem;
  weaponSystem: WeaponSystem;
  xpSystem: XPSystem;
}

export function installCoreCombatSystems(
  opts: InstallCoreCombatSystemsOpts,
): InstallCoreCombatSystemsResult {
  const statusFxPool = new StatusFxPool(opts.scene);
  const spawnSystem = new SpawnSystem(opts.scene);
  spawnSystem.setSpawnIntervalMult(opts.runModifiers.spawnIntervalMult);
  const weaponSystem = new WeaponSystem(opts.scene, spawnSystem.getEnemyGroup());
  weaponSystem.setCurseCooldownMul(opts.runModifiers.weaponCooldownMult);
  // R1 M3 T20d + M4 + M4.5 P3/P4 — per-hit damage stack. Bronze
  // clasp first-hit window runs before highland_torque elite mult
  // so +15% + +100% compose predictably; fishermens_net applies
  // after (velocity-aware), then bodhran_skin's on-beat window on
  // top. Beat phase is sampled from the shared music engine at
  // hit-time so a 60Hz frame lines up with the audio-ctx clock.
  weaponSystem.setHitDamageModifier((dmg, now, isElite, velocityDot) => {
    // Caller guarantees the driver is non-null at hit-time — orchestrator
    // is built in `resetTransientRunState` and the driver follows shortly.
    // Pre-extract this read was `this.relicEffectDriver.modifyWeaponDamage(...)`
    // with no null-check; preserved verbatim to keep behaviour identical.
    const driver = opts.getRelicEffectDriver()!;
    const afterClasp = driver.modifyWeaponDamage(dmg, now);
    const afterElite = driver.modifyEliteDamage(afterClasp, isElite);
    const afterFisher = driver.modifyFishermensNetDamage(afterElite, velocityDot);
    const beatMs = musicEngine.getMsSinceLastQuarterNote();
    const periodMs = musicEngine.getQuarterNotePeriodMs();
    const afterBodhran = driver.modifyBodhranBeatDamage(afterFisher, beatMs, periodMs);
    // V2 (Cailleach Gauntlet) — Stormcrown +18 % generic damage rides
    // at the tail of the chain so it composes on top of every other
    // relic effect. Identity when Stormcrown is not held.
    return driver.modifyStormcrownDamage(afterBodhran);
  });
  // V2 — Stormcrown's on-crit freeze proc. Listens after the damage
  // chain; rolls 6 % freeze on crit hits, applies Enemy.applyFreeze
  // for 500 ms. RNG threaded through scene.getRunRng() so the proc
  // is replay-deterministic.
  weaponSystem.setStormcrownOnHitHook((enemy, isCrit) => {
    const driver = opts.getRelicEffectDriver()!;
    const rng = opts.scene.getRunRng();
    if (driver.tryStormcrownFreeze(rng, isCrit)) {
      // Enemy.applyFreeze(durationSec, slowMul): 0 slow = full freeze
      enemy.applyFreeze(driver.stormcrownFreezeDurationMs / 1000, 0);
    }
  });
  const xpSystem = new XPSystem(opts.scene);
  Enemy.refreshSettings();
  opts.bossHpTracker?.reset();
  return { statusFxPool, spawnSystem, weaponSystem, xpSystem };
}
