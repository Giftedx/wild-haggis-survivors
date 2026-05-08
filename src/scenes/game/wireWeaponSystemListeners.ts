/**
 * Weapon-system event listeners — Phase 5 Bucket 7 of the GameScene
 * regrowth audit (extracts a chunk of `runtimeListenersInstall.ts`
 * surface area).
 *
 * Side-effect-only wiring of the four `weaponSystem` events that drive
 * juice / HUD / run-stats / SFX / animation responses to weapon
 * activity:
 *
 *  - `enemyKilled` → fed into the EnemyKillHandler cascade (XP gem,
 *    drops, victory trigger, etc).
 *  - `enemyKilled` → cascade-rune kill bookkeeper (Cascade Rune ramps).
 *    Independent listener so the primary cascade owner stays unchanged.
 *  - `damageDealt` → floating damage number + impact ring + HUD DPS
 *    log + run-stats per-weapon damage + hit SFX.
 *  - `projectileTrail` → cosmetic trail particle, palette by weapon key.
 *  - `weaponFired` → flags the player's "attacking" one-shot animation
 *    beat (FSM gates it to ~167ms).
 *
 * `getJuice` / `getHud` are lazy because the live GameScene wires
 * listeners ~65 lines BEFORE `this.juice` / `this.hud` are constructed
 * (search `this.juice = new JuiceSystem`). Resolving at fire time
 * matches the pre-extraction inline `(...) => this.juice.showDamageNumber(...)`
 * arrow which read `this.juice` lexically; capturing by value at wire
 * time would have bound `undefined` and thrown on the first kill.
 *
 * Listeners are added via `events.on` only — the scene reuses the
 * same WeaponSystem instance across a run, and a scene restart
 * builds a fresh instance, so the old listeners die with the old
 * instance. No teardown call needed.
 */
import type { WeaponSystem } from '../../systems/WeaponSystem';
import type { EliteAffixId } from '../../data/eliteAffixes';
import type { Player } from '../../entities/Player';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { HUD } from '../../ui/HUD';
import type { RunStatsTracker } from '../../systems/RunStatsTracker';
import type { SFXManager } from '../../systems/audio/SFXManager';
import type { EnemyKillHandler } from './EnemyKillHandler';
import type { RuneEffectBag } from '../../systems/runes/runeEffects';
import { audio } from '../../systems/AudioSystem';
import { noteCascadeKill } from '../../systems/runes/runeConsumer';
import { pickTrailColor } from '../../data/weaponTrailColors';

export interface WireWeaponSystemListenersInputs {
  weaponSystem: WeaponSystem;
  enemyKillHandler: EnemyKillHandler;
  player: Player;
  /** Lazy: GameScene wires before `this.juice` is constructed. */
  getJuice: () => JuiceSystem;
  /** Lazy: GameScene wires before `this.hud` is constructed. */
  getHud: () => HUD;
  runStatsTracker: RunStatsTracker;
  runeBag: RuneEffectBag;
  getSFXManager: () => SFXManager;
}

export function wireWeaponSystemListeners(inputs: WireWeaponSystemListenersInputs): void {
  const {
    weaponSystem,
    enemyKillHandler,
    player,
    getJuice,
    getHud,
    runStatsTracker,
    runeBag,
    getSFXManager,
  } = inputs;

  weaponSystem.events.on(
    'enemyKilled',
    (
      x: number,
      y: number,
      xpValue: number,
      enemyKey: string,
      wasBoss: boolean,
      wasElite: boolean = false,
      eliteAffixId?: EliteAffixId | null,
    ) => enemyKillHandler.handle(x, y, xpValue, enemyKey, wasBoss, wasElite, eliteAffixId),
  );

  // Cascade Rune kill bookkeeper — no-op when no cascade rune is
  // equipped (the consumer guard short-circuits on null cfg).
  weaponSystem.events.on('enemyKilled', () => {
    noteCascadeKill(runeBag);
  });

  weaponSystem.events.on(
    'damageDealt',
    (x: number, y: number, amount: number, isCrit: boolean, weaponKey?: string) => {
      const juice = getJuice();
      juice.showDamageNumber(x, y, amount, isCrit);
      juice.spawnImpactRing(x, y);
      getHud().logDamage(amount);
      runStatsTracker.addWeaponDamage(weaponKey ?? 'unknown', amount);
      getSFXManager().tryPlay('hit', () => audio.playHitImmediate());
    },
  );

  // Math.random here is cosmetic (not gameplay RNG) so unseeded is fine.
  weaponSystem.events.on(
    'projectileTrail',
    (x: number, y: number, evolved: boolean, wKey: string) => {
      getJuice().spawnTrail(x, y, pickTrailColor(wKey, evolved, Math.random()));
    },
  );

  weaponSystem.events.on('weaponFired', () => {
    player.notifyWeaponFired();
  });
}
