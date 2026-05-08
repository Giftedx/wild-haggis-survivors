/**
 * Rerun seed link — extracted from GameOverScene as part of the Phase 5
 * render*Link drain. "↻ same seed" text link that restarts the run with
 * its exact seed and variant. Mirrors the Chronicle rerun pattern. Only
 * called when the payload carries a numeric runSeed (caller's hasRerun
 * gate).
 *
 * Pure presentation; no replay determinism dependency.
 */
import * as Phaser from 'phaser';
import { t } from '../../core/i18n';
import { audio } from '../../systems/AudioSystem';
import { musicEngine } from '../../systems/music/ProceduralMusicEngine';
import { SaveManager } from '../../core/SaveManager';
import { getCurseByKey } from '../../data/curses';
import { formatRerunSeedLinkLabel } from '../gameOverFormatting';
import { resolveRerunLinkPalette } from '../gameOverLinkPalette';
import type { GameOverPayload } from '../gameOverPayload';
import { COPY_ACTION_LINK_TEXT_BASE } from './copyActionLinkText';

export interface RenderGameOverRerunSeedLinkOpts {
  centerX: number;
  y: number;
  depth: number;
  delay: number;
  /** Payload accessor — re-read at click time so a late-arriving payload is honoured. */
  getPayload: () => GameOverPayload | null;
}

export function renderGameOverRerunSeedLink(
  scene: Phaser.Scene,
  opts: RenderGameOverRerunSeedLinkOpts,
): void {
  const { centerX, y, depth, delay, getPayload } = opts;
  // Surface the curse on the link itself so the player knows the
  // rerun re-applies it (parallels the chronicle ↻ tooltip).
  const initialPayload = getPayload();
  const linkCurseDef = getCurseByKey(initialPayload?.curseKey ?? null);
  const label = formatRerunSeedLinkLabel(linkCurseDef ? t(linkCurseDef.nameKey) : null);
  const palette = resolveRerunLinkPalette();
  const text = scene.add
    .text(centerX, y, label, {
      ...COPY_ACTION_LINK_TEXT_BASE,
      color: palette.idle,
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(depth)
    .setAlpha(0)
    .setInteractive({ useHandCursor: true });
  scene.tweens.add({ targets: text, alpha: 1, duration: 260, delay });

  text.on('pointerover', () => text.setColor(palette.hover));
  text.on('pointerout', () => text.setColor(palette.idle));
  text.on('pointerdown', () => {
    audio.playClick();
    musicEngine.stop();
    const p = getPayload();
    if (!p || typeof p.runSeed !== 'number') return;
    try { new SaveManager().clearActiveRun(); } catch { /* best-effort */ }
    // Rerun must carry the curse — otherwise the "same seed" replay
    // is silently easier than the original (and the boss/spawn cadence
    // diverges since several modifiers gate their flow on a curse).
    const def = getCurseByKey(p.curseKey ?? null);
    scene.scene.start('Game', {
      seed: p.runSeed,
      forceVariantKey: p.variantKey,
      curseKey: def ? def.key : null,
    });
  });
}
