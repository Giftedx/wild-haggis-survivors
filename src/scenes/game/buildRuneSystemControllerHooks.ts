/**
 * buildRuneSystemControllerHooks — assembles the lazy-getter hook bag
 * passed to the {@link RuneSystemController} constructor.
 *
 * Why extract: the inline hook bag in `GameScene.create()` was 23 LOC of
 * trivial getter wiring. Pulling it into a sibling builder shrinks the
 * scene class without changing behaviour.
 *
 * Why type-couple to GameScene (precedent: `PauseMenu.ts`): the builder
 * reads many scene fields (player, juice, biomeController, etc.) that
 * are NOT part of any sub-system's public surface. Passing each through
 * a generic hooks interface would re-create the same 23 LOC of wiring
 * here. Direct field access via a type-only `import type { GameScene }`
 * keeps the wiring honest at compile time without an import cycle at
 * runtime.
 *
 * The relevant `private` fields on GameScene are dropped to package
 * visibility for this builder's reads — they were already accessed via
 * the inline closures in the original hook bag, so encapsulation was
 * nominal. None of the fields are PROMOTED to public getters.
 *
 * Determinism: the controller drains pulses from a seeded sub-RNG
 * (`runePulseRng` branched off `runRng`). The builder returns lazy
 * getters so a `runePulseRng` rebind during scene reuse is observed
 * without re-constructing the controller.
 */
import type { GameScene } from '../GameScene';
import type { RuneSystemControllerHooks } from './runeSystemController';

/**
 * Build the {@link RuneSystemControllerHooks} bag for the given scene.
 *
 * The result is a fresh object — no caching. Callers construct one per
 * scene-create alongside `new RuneSystemController(...)`.
 */
export function buildRuneSystemControllerHooks(scene: GameScene): RuneSystemControllerHooks {
  return {
    getPlayer: () => scene.player,
    getJuice: () => scene.juice,
    getSpawnSystem: () => scene.spawnSystem,
    getWeaponSystem: () => scene.weaponSystem,
    getXPSystem: () => scene.xpSystem,
    getRunScore: () => scene.runScore,
    getRunActState: () => scene.runActState,
    getRuneBag: () => scene.runeBag,
    getRuneSystem: () => scene.runeSystem,
    getRunePulseRng: () => scene.runePulseRng,
    currentBiomeAtPlayer: () =>
      scene.biomeController
        ? scene.biomeController.currentBiomeAt(scene.player.x, scene.player.y)
        : null,
    getRelicHeldCount: () => scene.relicSystem?.heldCount() ?? 0,
    getEvolvedWeaponsCount: () => scene.evolvedWeapons.length,
    getChestRegistry: () => scene.chestRegistry,
    getUpgradeUI: () => scene.upgradeUI ?? null,
    getBanter: () => scene.banter,
    getTimeNowMs: () => scene.time.now,
    setBurnsPlatterPickedUpAtMs: (ms) => {
      scene.burnsPlatterPickedUpAtMs = ms;
    },
  };
}
