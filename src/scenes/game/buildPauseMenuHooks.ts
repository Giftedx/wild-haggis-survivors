/**
 * buildPauseMenuHooks — assembles the lazy-getter hook bag passed to the
 * {@link PauseMenu} constructor.
 *
 * Why extract: the inline hook bag in `GameScene.toggleUiPause()` was ~33
 * LOC of trivial getter wiring (T402-era pause stats lines, R1 active-relic
 * buttons, run-identity radiator). Pulling it into a sibling builder
 * shrinks the scene class without changing behaviour.
 *
 * Why type-couple to GameScene (precedent: `buildRuneSystemControllerHooks`):
 * the builder reads many scene fields (relicOrchestrator, runActState,
 * ownedRuneIds, runStatsTracker, etc.) that are NOT part of any sub-system's
 * public surface. Passing each through a generic hooks interface would
 * re-create the same wiring here. Direct field access via a type-only
 * `import type { GameScene }` keeps the wiring honest at compile time
 * without an import cycle at runtime.
 *
 * The relevant `private` fields on GameScene have been dropped to package
 * visibility for this builder's reads — they were already accessed via the
 * inline closures in the original hook bag, so encapsulation was nominal.
 */
import type { GameScene } from '../GameScene';
import type { PauseMenuHooks } from './PauseMenu';
import { t } from '../../core/i18n';
import { formatHudCurseChipLine } from '../../ui/formatHudCurseChip';
import { resolveRouteLabels, resolveRelicLabels, resolveRuneLabels } from './runIdentityLabels';

/**
 * Build the {@link PauseMenuHooks} bag for the given scene.
 *
 * The result is a fresh object — no caching. Callers construct one per
 * `new PauseMenu(...)` invocation alongside the scene's pause-toggle path.
 */
export function buildPauseMenuHooks(scene: GameScene): PauseMenuHooks {
  return {
    getUiViewport: () => scene.getUiViewport(),
    getGameTimeSec: () => scene.spawnSystem.getGameTimeSec(),
    getKillCount: () => scene.runScore.killCount,
    getLevel: () => scene.xpSystem.getLevel(),
    getEquippedWeaponCount: () => scene.weaponSystem.getWeapons().length,
    getOwnedPassives: () => scene.ownedPassives,
    getActiveCurseLine: () => formatHudCurseChipLine(scene.activeCurseKey),
    getRunGoldEarned: () => scene.runScore.coinGoldEarned,
    getKillStreakStats: () => ({
      current: scene.juice.getComboCount(),
      best: scene.juice.getBestCombo(),
    }),
    getLastHudDps: () => scene.hud.getLastDisplayedDps(),
    getRunDamageDealt: () => scene.runStatsTracker.getTotalDamage(),
    // T402 — run identity radiator: act, route picks, held relics.
    // Each line in pauseStats only renders when the data is non-
    // default, so the panel stays clean on a fresh act-1 run.
    getCurrentAct: () => scene.runActState.currentAct,
    getRouteLabels: () => resolveRouteLabels(scene.runActState.pickerHistory),
    getRelicLabels: () => resolveRelicLabels(scene.relicSystem ?? null),
    getVariantLabel: () => {
      try { return t(scene.activeVariant.nameKey); } catch { return ''; }
    },
    getRuneLabels: () => resolveRuneLabels(scene.ownedRuneIds),
    setRunName: (name) => scene.setRunName(name),
    onResumeRequested: () => scene.toggleUiPause(),
    onQuitRequested: () => scene.runExit.abandonToMainMenu(),
    isWhiskyDramAvailable: () => scene.relicEffectDriver?.isWhiskyDramAvailable() ?? false,
    onWhiskyDramRequested: () => scene.relicOrchestrator.activateWhiskyDram(),
    isFingalsHornAvailable: () => scene.relicEffectDriver?.isFingalsHornAvailable() ?? false,
    onFingalsHornRequested: () => scene.relicOrchestrator.activateFingalsHorn(),
  };
}
