/**
 * wireSceneEventBus — subscribes run-scoped toasts to the global event
 * bus (achievements, boss enrage, codex first-cull). Extracted from
 * GameScene.create() to keep the orchestration block scannable.
 *
 * Returns a disposer that removes all three subscriptions; callers
 * invoke it on scene shutdown or before re-subscribing on scene reuse.
 */
import type { JuiceSystem } from '../../systems/JuiceSystem';
import { globalEventBus } from '../../core/GlobalEventBus';
import { audio } from '../../systems/AudioSystem';
import { t } from '../../core/i18n';
import { getEnemyDisplayName } from '../../data/enemies';
import { COLORS_CSS } from '../../config';

export interface SceneEventBusHooks {
  getJuice(): JuiceSystem;
  /** A1 M4 — accessibility caption hook. Optional so non-game scenes that
   *  share this helper can opt out. */
  caption?(id: string, message: string, tint?: string, durationMs?: number): void;
}

/**
 * Install the three global-event-bus subscriptions used by GameScene.
 * Returns a dispose function that removes all of them.
 */
export function wireSceneEventBus(hooks: SceneEventBusHooks): () => void {
  const unsubAchievement = globalEventBus.on('ACHIEVEMENT_UNLOCKED', (p) => {
    hooks.getJuice().showToast(t('ui.game.achievement_unlock', { title: p.title }), COLORS_CSS.TOAST_GOLD);
    audio.playAchievement();
    // A1 M4 — parity caption for achievement audio stinger.
    hooks.caption?.('achievement', t('ui.game.achievement_unlock', { title: p.title }), COLORS_CSS.TOAST_GOLD, 3500);
  });
  const unsubBossEnraged = globalEventBus.on('bossEnraged', () => {
    hooks.getJuice().showToast(t('ui.game.boss_enraged'), COLORS_CSS.DANGER_RED);
    audio.playBossEnrage();
    // A1 M4 — parity caption.
    hooks.caption?.('boss_enrage', t('ui.captions.boss_enrage'), COLORS_CSS.DANGER_RED, 3500);
  });
  const unsubCodexFirstCull = globalEventBus.on('CODEX_FIRST_CULL', (p) => {
    const name = getEnemyDisplayName(p.enemyKey);
    hooks.getJuice().showToast(t('ui.game.codex_first_cull', { name }), '#aaddff');
  });

  return () => {
    unsubAchievement();
    unsubBossEnraged();
    unsubCodexFirstCull();
  };
}
