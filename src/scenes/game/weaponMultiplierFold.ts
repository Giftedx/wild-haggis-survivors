/**
 * Weapon-multiplier fold — Phase 5 Bucket 5a of the codebase
 * restructure.
 *
 * Each frame the weapon system gets a fresh damage / AOE / attack-speed
 * / crit / cooldown stack, composed from the player, juice combo, the
 * Burns platter buff window, the rune bag (Song / Piper rune flags),
 * and the relic-effect driver (grans_thimble crit-mul). This used to
 * live as ~25 LOC of inline orchestration in `GameScene.updateInner`;
 * extraction here keeps it close to its dependencies' compose helpers
 * and shortens the per-frame method.
 *
 * Pure orchestration — no state, no timers. The function reads its
 * inputs and writes the result through `weaponSystem.setMultipliers`
 * + `weaponSystem.setBagpipesRadiusMul`.
 */
import type { Player } from '../../entities/Player';
import type { JuiceSystem } from '../../systems/JuiceSystem';
import type { WeaponSystem } from '../../systems/WeaponSystem';
import type { RuneEffectBag } from '../../systems/runes/runeEffects';
import type { RelicEffectDriver } from '../../systems/relics/RelicEffectDriver';
import { burnsPlatterDamageBuff } from '../../systems/seasonal/burnsNightEffects';
import {
  composeBagpipesRadiusMul,
  composeBassAttackSpeedMul,
} from '../../systems/runes/runeConsumer';

export interface WeaponMultiplierFoldInputs {
  player: Player;
  juice: JuiceSystem;
  weaponSystem: WeaponSystem;
  runeBag: RuneEffectBag;
  relicEffectDriver: RelicEffectDriver;
  /** `scene.time.now` — wall-clock used by the Burns platter window. */
  timeNowMs: number;
  /** When the player last picked up a Burns platter; null if never this run. */
  burnsPlatterPickedUpAtMs: number | null;
}

/**
 * Compose every per-frame weapon multiplier and push the result into
 * the WeaponSystem. Order of composition matches the original inline
 * code so replay determinism is preserved.
 *
 * Player facing is NOT updated here — the caller still owns
 * `weaponSystem.setPlayerFacing` because facing is its own concern
 * and gets fed from `player.rotation - π/2` at a different point
 * in the tick.
 */
export function applyWeaponMultiplierFold(inputs: WeaponMultiplierFoldInputs): void {
  const {
    player,
    juice,
    weaponSystem,
    runeBag,
    relicEffectDriver,
    timeNowMs,
    burnsPlatterPickedUpAtMs,
  } = inputs;

  // U1 M4 — fold rune bass-attack-speed flag (Song Rune) on top of the
  // player's attack-speed stack so the weapon cooldown formula sees a
  // single composed value. Identity (1.0) when the rune is inactive.
  const bassAtkSpeedMul = composeBassAttackSpeedMul(runeBag);

  weaponSystem.setMultipliers(
    player.getDamageMultiplier()
      * juice.getComboDamageMultiplier()
      * burnsPlatterDamageBuff(timeNowMs, burnsPlatterPickedUpAtMs),
    player.getAoeMultiplier(),
    player.getAttackSpeedMultiplier() * bassAtkSpeedMul,
    player.getCritChance(),
    player.getCooldownReduction(),
    // R1 M3 T20a — grans_thimble +8% crit multiplier composes on top
    // of existing stacks so it scales with other crit bonuses rather
    // than replacing them.
    relicEffectDriver.modifyCritMultiplier(player.getCritDamageMultiplier()),
    player.getProjectileSpeedMul(),
  );

  // U1 M4 — Piper Rune folds bagpipes radius once per frame.
  weaponSystem.setBagpipesRadiusMul(composeBagpipesRadiusMul(runeBag));
}
