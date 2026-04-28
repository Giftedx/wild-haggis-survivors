/**
 * wireSceneEventBus — subscribes run-scoped toasts to the global event
 * bus (achievements, boss enrage, codex first-cull, save failure).
 * Extracted from GameScene.create() to keep the orchestration block
 * scannable.
 *
 * Returns a disposer that removes all subscriptions; callers invoke
 * it on scene shutdown or before re-subscribing on scene reuse.
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
 * Install the global-event-bus subscriptions used by GameScene.
 * Returns a dispose function that removes all of them.
 *
 * Subscriptions:
 *   - ACHIEVEMENT_UNLOCKED → toast + achievement chime + caption
 *   - bossEnraged → danger toast + enrage stinger + caption
 *   - CODEX_FIRST_CULL → first-kill toast for newly-discovered enemy
 *   - GLOBAL_SAVE_FAILED → T131: surface localStorage write failures so
 *       silent quota / private-mode failures reach the player instead
 *       of dying in a swallowed catch.
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
  // T131 — surface save-failure events as a one-shot toast. Defensive
  // optional-chain: very early failures can fire before juice is wired.
  const unsubSaveFailed = globalEventBus.on('GLOBAL_SAVE_FAILED', (payload) => {
    hooks.getJuice()?.showToast(t('ui.game.save_failed', { path: payload.path }), '#ffb070');
  });
  // Cu Sith bay telegraph (DESIGN_IDEAS §1; SCOTTISH_RESEARCH §1.2).
  // Throttle across multiple Cu Siths so dense late-game spawns don't
  // spam toasts. The legend's "thrice across the moor" beat lands as
  // up to three toasts per encounter — first / second / third — but
  // only one per ~2.5 s globally to protect the HUD.
  let lastBayToastMs = -Infinity;
  const unsubCuSithBay = globalEventBus.on('CU_SITH_BAY', (p) => {
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (now - lastBayToastMs < 2500) return;
    lastBayToastMs = now;
    const key = p.stage === 1 ? 'first' : p.stage === 2 ? 'second' : 'third';
    hooks.getJuice()?.showToast(t(`ui.cuSith.bay.${key}`), '#88e8ff');
    hooks.caption?.(
      `cu_sith_bay_${key}`,
      t(`ui.captions.cu_sith_bay_${key}`),
      '#88e8ff',
      2500,
    );
  });

  return () => {
    unsubAchievement();
    unsubBossEnraged();
    unsubCodexFirstCull();
    unsubSaveFailed();
    unsubCuSithBay();
  };
}
