/**
 * W82 Phase 3 — save boss-kill highlight link on the Game Over panel.
 *
 * Sister to `gameOverSaveClipLink.ts`. The difference: this one
 * downloads the snapshot that `GameScene.bossKillHighlight` captured
 * at the exact frame the boss died, rather than the live rolling
 * buffer at click time. Lets the player keep the *moment* even when
 * the run dragged on for several more minutes after the kill.
 *
 * Only renders when a boss-kill snapshot exists (caller gates on
 * `getHighlight()`); the link itself stays inert if the held
 * snapshot is gone by click time (defensive — recycled scene
 * instance, hot-reload, etc.).
 *
 * Pure presentation; no replay determinism dependency.
 */
import * as Phaser from 'phaser';
import { t } from '../../core/i18n';
import { BOSSES } from '../../data/enemies';
import { audio } from '../../systems/AudioSystem';
import { buildCaptureFilename } from '../../utils/captureFilename';
import { formatLocalYmd } from '../../utils/formatDate';
import { TOAST_COLORS } from '../../ui/toastPalette';
import { resolveCopyActionLinkPalette } from '../gameOverLinkPalette';
import type { GameOverPayload } from '../gameOverPayload';
import type { BossKillHighlight } from '../game/bossKillHighlight';
import { COPY_ACTION_LINK_TEXT_BASE } from './copyActionLinkText';

export interface RenderGameOverSaveHighlightLinkOpts {
  centerX: number;
  y: number;
  depth: number;
  delay: number;
  /** Live accessor — re-read at click time so a recycled scene
   *  instance or hot-reload doesn't serve a stale Blob. */
  getHighlight: () => BossKillHighlight | null;
  /** Payload accessor — re-read at click time for filename slug
   *  (variant label, seed, mode). */
  getPayload: () => GameOverPayload | null;
}

/**
 * Resolves a warm player-facing boss name for the highlight save link.
 * Unknown future/internal keys intentionally degrade to the generic i18n
 * fallback so raw keys never leak into Game Over copy.
 */
export function resolveBossDisplayName(bossKey: string): string {
  const boss = BOSSES.find((entry) => entry.key === bossKey);
  if (boss) {
    const resolved = t(boss.nameKey);
    if (resolved && resolved !== boss.nameKey) return resolved;
  }
  const fallback = t('ui.gameOver.unknown_boss');
  return fallback && fallback !== 'ui.gameOver.unknown_boss' ? fallback : 'boss';
}

export function renderGameOverSaveHighlightLink(
  scene: Phaser.Scene,
  opts: RenderGameOverSaveHighlightLinkOpts,
): void {
  const { centerX, y, depth, delay, getHighlight, getPayload } = opts;
  // Resolve the display name once at render time so the label looks
  // settled even before the player hovers. Click-time re-read still
  // honours the live snapshot for the actual filename / Blob.
  const initial = getHighlight();
  const bossLabel = initial ? resolveBossDisplayName(initial.bossKey) : '';
  const hint = t('ui.gameOver.save_highlight').replace('{boss}', bossLabel);
  const palette = resolveCopyActionLinkPalette(false);
  const text = scene.add
    .text(centerX, y, `🎬 ${hint}`, {
      ...COPY_ACTION_LINK_TEXT_BASE,
      color: palette.idle,
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(depth)
    .setAlpha(0)
    .setInteractive({ useHandCursor: true });
  scene.tweens.add({ targets: text, alpha: 1, duration: 260, delay });

  let saving = false;
  const doSave = () => {
    if (saving) return;
    const highlight = getHighlight();
    const p = getPayload();
    if (!highlight || !p) return;
    saving = true;
    const filename = buildCaptureFilename('highlight', {
      mode: p.mode,
      variantLabel: p.variantLabel,
      // Use time-of-kill rather than time-of-save — the clip captures
      // the moment, so the filename should reflect when it happened.
      timeSurvivedSec: Math.max(0, Math.floor(highlight.capturedAtSec)),
      seedCode: p.seedCode,
      dateYmd: formatLocalYmd(new Date()),
      bossKey: highlight.bossKey,
      clipExtension: highlight.extension,
    });
    try {
      const url = URL.createObjectURL(highlight.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      text.setText(`🎬 ${t('ui.toast.highlight_saved')}`);
      text.setColor(palette.success);
      audio.playClick();
    } catch {
      text.setText(`🎬 ${t('ui.toast.highlight_failed')}`);
      text.setColor(TOAST_COLORS.warning);
      saving = false;
    }
  };
  text.on('pointerover', () => { if (!saving) text.setColor(palette.hover); });
  text.on('pointerout', () => { if (!saving) text.setColor(palette.idle); });
  text.on('pointerdown', doSave);
}
