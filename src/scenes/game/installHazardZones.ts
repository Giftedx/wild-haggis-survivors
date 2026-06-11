/**
 * Phase 5 Bucket 6 partial — wraps the HazardZones reset / construct /
 * spawn sequence into a single helper.
 *
 * Why bundled: the inline block hosted a 12-line preamble comment
 * documenting (a) the lazy closure over `this.runLifecycle` (lifecycle
 * isn't constructed yet at HazardZones construction time, but lava
 * ticks fire later), and (b) the scene-reuse cleanup invariant (prior
 * run's display objects don't auto-clear, so we reset() before
 * re-constructing). Both invariants now live with the helper.
 *
 * Lazy getters preserve the pre-extract closure-over-this contract:
 * runLifecycle / relicEffectDriver / juice / etc. resolve at lava-
 * tick time, not at install time.
 *
 * Pure helper — no Phaser imports beyond the Scene type. HazardZones
 * has its own test fixture; this helper is exercised through the
 * GameScene create-path.
 */
import type * as Phaser from 'phaser';
import { HazardZones } from './HazardZones';
import type { Player } from '../../entities/Player';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { DeathCauseTracker } from '../../systems/DeathCauseTracker';
import type { SpawnSystem } from '../../systems/SpawnSystem';
import type { RNG } from '../../utils/rng';
import type { IFrameController } from './IFrameController';
import type { RelicEffectDriver } from '../../systems/relics/RelicEffectDriver';
import type { RunLifecycle } from './RunLifecycle';
import type { RunScoreState } from './RunScoreState';
import type { RunModifiers } from '../../core/RunModifiers';

export interface InstallHazardZonesOpts {
  scene: Phaser.Scene;
  /**
   * Prior hazardZones instance from a recycled scene — `reset()` is
   * called on it before the new one is constructed. Phaser display
   * objects added via `scene.add.*` don't auto-clear on scene reuse;
   * the prior run's lava base/glow ellipses, heal cross overlays,
   * ember sprites, slick + fog visuals all hang on the display list
   * without this teardown.
   */
  prior: HazardZones | null | undefined;
  getPlayer(): Player;
  getJuice(): JuiceSystem;
  getDeathCauseTracker(): DeathCauseTracker;
  getSpawnSystem(): SpawnSystem;
  getRunRng(): RNG;
  getIFrameController(): IFrameController;
  getRunScore(): RunScoreState;
  getRunModifiers(): RunModifiers;
  /**
   * Lazy — runLifecycle isn't constructed at install time, but lava
   * ticks fire much later (player crosses a lava zone), by which time
   * runLifecycle.onPlayerHitZero is wired.
   */
  getRunLifecycle(): RunLifecycle;
  getRelicEffectDriver(): RelicEffectDriver | null;
  getCurrentTimeMs(): number;
  tryMoorMercyLuck(hpBefore: number): void;
}

export function installHazardZones(opts: InstallHazardZonesOpts): HazardZones {
  opts.prior?.reset();
  const hazardZones = new HazardZones(opts.scene, {
    getPlayer: opts.getPlayer,
    getJuice: opts.getJuice,
    getDeathCauseTracker: opts.getDeathCauseTracker,
    getSpawnSystem: opts.getSpawnSystem,
    getRunRng: opts.getRunRng,
    isIFrames: () => opts.getIFrameController().isActive(),
    isVictoryPending: () => opts.getRunScore().victoryPending,
    getDamageTakenMult: () => opts.getRunModifiers().damageTakenMult,
    onPlayerKilled: () => opts.getRunLifecycle().onPlayerHitZero(),
    onAfterPlayerDamaged: (hpBefore) => {
      opts.getRelicEffectDriver()?.noteDamageTaken(opts.getCurrentTimeMs());
      if (opts.getPlayer().getHp() > 0) opts.tryMoorMercyLuck(hpBefore);
    },
    modifyFireDamageTaken: (d) => opts.getRelicEffectDriver()!.modifyFireDamageTaken(d),
  });
  hazardZones.spawn();
  return hazardZones;
}
