/**
 * Run-result panel content builders — extracted from GameOverScene as
 * part of the Phase 5 scene drain. Three pure presentation helpers:
 *
 *  - `renderDeathInsight` — italic single-line classifier headline
 *    placed under the title.
 *  - `addRunResultUnlockContent` — heading + variant unlock body / tip
 *    fallback / sparkle burst, depending on whether anything unlocked
 *    this run.
 *  - `addUnlockSparkles` (internal) — 8-particle radial burst around
 *    the unlock heading.
 *
 * No replay determinism dependency (post-run UI). The `Math.random()`
 * inside the tip fallback is intentional — the tip is cosmetic and
 * shown only on no-unlock runs.
 */
import type * as Phaser from 'phaser';
import { COLORS_CSS } from '../../config';
import { t } from '../../core/i18n';
import { textStyle } from '../../ui/typography';
import { getSettingsManager } from '../../core/SettingsManager';
import type { DeathCause } from '../../core/deathCauseClassifier';
import {
  formatDeathInsightLine,
  resolveUnlockHeading,
  formatUnlockBodyText,
} from '../gameOverFormatting';
import { getVariantByKey, type VariantKey } from '../../data/variants';

export function renderDeathInsight(
  scene: Phaser.Scene,
  centerX: number,
  y: number,
  depth: number,
  cause: DeathCause,
  uiScale: number,
  panelWidth: number,
): void {
  const text = scene.add
    .text(centerX, y, formatDeathInsightLine(cause),
      textStyle('subtitle', { color: COLORS_CSS.LABEL_TAN, align: 'center', wordWrap: { width: (panelWidth - 48) / Math.max(1, uiScale) } }),
    )
    .setOrigin(0.5, 0)
    .setScrollFactor(0)
    .setDepth(depth)
    .setAlpha(0);
  text.setScale(uiScale);
  scene.tweens.add({ targets: text, alpha: 1, duration: 320, delay: 380 });
}

export function addRunResultUnlockContent(
  scene: Phaser.Scene,
  centerX: number,
  y: number,
  depth: number,
  variantKeys: VariantKey[],
  delay: number,
): void {
  const tips = [
    t('ui.tips.dash'),
    t('ui.tips.combo'),
    t('ui.tips.armor'),
    t('ui.tips.evolve'),
    t('ui.tips.piper'),
    t('ui.tips.kite'),
  ];
  const hasUnlocks = variantKeys.length > 0;
  const { text: headingText, color: headingColor } = resolveUnlockHeading(variantKeys);

  const heading = scene.add
    .text(centerX, y, headingText, {
      ...textStyle('label', { fontSize: '12px', color: headingColor }),
      letterSpacing: 1,
    })
    .setOrigin(0.5, 0)
    .setScrollFactor(0)
    .setDepth(depth)
    .setAlpha(0);
  scene.tweens.add({ targets: heading, alpha: 1, duration: 260, delay });

  if (!hasUnlocks) {
    const tip = scene.add
      .text(centerX, y + 34, tips[Math.floor(Math.random() * tips.length)],
        textStyle('subtitle', { color: COLORS_CSS.TEXT_SECONDARY, align: 'center', wordWrap: { width: Math.min(520, scene.scale.width - 80) } }),
      )
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(0);
    scene.tweens.add({ targets: tip, alpha: 1, duration: 260, delay: delay + 90 });
    return;
  }

  // Sparkle burst around the unlock heading — celebratory soul moment
  addUnlockSparkles(scene, centerX, y + 20, depth + 1, delay + 60);

  if (variantKeys.length === 1) {
    const variant = getVariantByKey(variantKeys[0]);
    const nameText = scene.add
      .text(centerX, y + 26, t(variant.nameKey),
        textStyle('heading', { fontSize: '26px', color: COLORS_CSS.WHISKY_GOLD, align: 'center' }),
      )
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(0);
    const flavorText = scene.add
      .text(centerX, y + 58, t(variant.flavorKey),
        textStyle('label', { fontSize: '12px', color: COLORS_CSS.TEXT_SECONDARY, align: 'center', wordWrap: { width: Math.min(520, scene.scale.width - 80) } }),
      )
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(0);
    scene.tweens.add({ targets: [nameText, flavorText], alpha: 1, duration: 300, delay: delay + 90 });
    return;
  }

  // Invariant: variantKeys.length >= 2 here (length === 1 branch returned above).
  const bodyText = formatUnlockBodyText(variantKeys) ?? '';
  const unlockList = scene.add
    .text(centerX, y + 30, bodyText, {
      ...textStyle('body', { fontSize: variantKeys.length === 2 ? '18px' : '14px', color: COLORS_CSS.WHISKY_GOLD, align: 'center', wordWrap: { width: Math.min(500, scene.scale.width - 100) } }),
      lineSpacing: 6,
    })
    .setOrigin(0.5, 0)
    .setScrollFactor(0)
    .setDepth(depth)
    .setAlpha(0);
  scene.tweens.add({ targets: unlockList, alpha: 1, duration: 300, delay: delay + 90 });
}

/** Celebratory sparkle burst — 8 golden particles radiating outward from center. */
function addUnlockSparkles(
  scene: Phaser.Scene,
  cx: number,
  cy: number,
  depth: number,
  delay: number,
): void {
  const { uiScale } = getSettingsManager().load();
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const sparkle = scene.add.circle(cx, cy, 3, 0xffdd44, 0)
      .setScrollFactor(0).setDepth(depth);
    scene.tweens.add({
      targets: sparkle,
      x: cx + Math.cos(angle) * Math.round(60 * uiScale),
      y: cy + Math.sin(angle) * Math.round(40 * uiScale),
      alpha: { from: 0, to: 0.9 },
      scale: { from: 0.3, to: 1.5 },
      duration: 600,
      delay: delay + i * 50,
      ease: 'Power2',
      onComplete: () => {
        scene.tweens.add({
          targets: sparkle,
          alpha: 0,
          scale: 0,
          duration: 400,
          onComplete: () => sparkle.destroy(),
        });
      },
    });
  }
}
