import type Phaser from 'phaser';
import { COLORS_CSS } from '../config';
import { t } from '../core/i18n';
import { getVariantByKey } from '../data/variants';
import type { GameOverPayload } from './gameOverPayload';

/**
 * Placement spec for a single sparkle particle around the variant chip.
 * Pure data so the renderer can stagger tweens deterministically and the
 * spec can be unit-tested without a Phaser scene.
 */
export interface VariantChipSparkleSpec {
  x: number;
  y: number;
  delay: number;
  radius: number;
}

export interface VariantChipStyle {
  /** Stroke width on the chip rect — bumped when a new variant unlocked this run. */
  strokeWidth: number;
  /** Haggis sprite scale multiplier (before uiScale). */
  haggisScale: number;
}

export function shouldSpawnVariantSparkles(
  newlyUnlocked: readonly unknown[] | undefined,
  reduceParticles: boolean,
): boolean {
  if (reduceParticles) return false;
  return (newlyUnlocked?.length ?? 0) > 0;
}

export function resolveVariantChipStyle(hasUnlock: boolean): VariantChipStyle {
  return {
    strokeWidth: hasUnlock ? 2 : 1,
    haggisScale: 1.7,
  };
}

export function variantChipSparkleSpec(
  centerX: number,
  centerY: number,
  chipW: number,
): VariantChipSparkleSpec[] {
  const halfW = chipW / 2;
  const vOffset = 20;
  return [
    { x: centerX - halfW - 10, y: centerY - vOffset, delay: 540, radius: 3 },
    { x: centerX + halfW + 10, y: centerY - vOffset, delay: 610, radius: 3 },
    { x: centerX - halfW - 10, y: centerY + vOffset, delay: 680, radius: 3 },
    { x: centerX + halfW + 10, y: centerY + vOffset, delay: 750, radius: 3 },
  ];
}

export interface RenderVariantChipOpts {
  centerX: number;
  top: number;
  payload: Pick<GameOverPayload, 'variantKey' | 'variantLabel' | 'runResult'>;
  uiScale: number;
  reduceParticles: boolean;
  depth: number;
}

export interface RenderVariantChipResult {
  /** Y coordinate of the bottom edge of the chip visuals (before sparkle fan-out). */
  bottomY: number;
}

export function renderVariantChip(
  scene: Phaser.Scene,
  opts: RenderVariantChipOpts,
): RenderVariantChipResult {
  const { centerX, top, payload, uiScale, reduceParticles, depth } = opts;
  const chipY = top;
  const chipW = 596;
  const chipH = 48;
  const hasUnlock = (payload.runResult?.newlyUnlockedVariants?.length ?? 0) > 0;
  const { strokeWidth, haggisScale } = resolveVariantChipStyle(hasUnlock);

  const eyebrow = scene.add
    .text(centerX, chipY - 34, t('ui.gameOver.this_run_eyebrow'), {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: COLORS_CSS.WHISKY_GOLD,
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3,
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(depth + 3)
    .setAlpha(0);
  eyebrow.setScale(uiScale);
  scene.tweens.add({ targets: eyebrow, alpha: 1, duration: 260, delay: 400 });

  const chip = scene.add
    .rectangle(centerX, chipY, chipW, chipH, 0x16213a, 0.96)
    .setScrollFactor(0)
    .setDepth(depth + 2)
    .setStrokeStyle(strokeWidth, hasUnlock ? 0xf7c270 : 0x355079, 1)
    .setAlpha(0);

  const variantDef = payload.variantKey ? getVariantByKey(payload.variantKey) : null;
  if (variantDef && scene.textures.exists(variantDef.textureKey)) {
    const miniHaggis = scene.add
      .sprite(centerX - 270, chipY, variantDef.textureKey)
      .setScale(haggisScale * uiScale)
      .setScrollFactor(0)
      .setDepth(depth + 3)
      .setAlpha(0);
    scene.tweens.add({ targets: miniHaggis, alpha: 1, duration: 260, delay: 430 });
  }

  // Y offsets from chip center scale with uiScale so the scaled 15px
  // variant label (21px at 1.4x) doesn't overlap the scaled 11px flavor
  // line below it. At fixed offsets -8/+10 the two text boxes collide
  // at 1.4x — label spans ±11 centered at -8 (hits y+3); flavor spans
  // ±8 centered at +10 (starts at y+2). The 1px gap closes into overlap.
  const variantText = scene.add
    .text(centerX + 8, chipY - Math.round(8 * uiScale), t('ui.gameOver.run_variant', { label: payload.variantLabel }), {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#d7e3ff',
      fontStyle: 'bold',
      wordWrap: { width: 500 / Math.max(1, uiScale) },
      align: 'center',
    })
    .setOrigin(0.5, 0.5)
    .setScrollFactor(0)
    .setDepth(depth + 3)
    .setAlpha(0);
  variantText.setScale(uiScale);

  const flavorKey = variantDef?.flavorKey;
  if (flavorKey) {
    const variantFlavor = scene.add
      .text(centerX + 8, chipY + Math.round(10 * uiScale), t(flavorKey), {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#8a9ab8',
        fontStyle: 'italic',
        wordWrap: { width: 480 / Math.max(1, uiScale) },
        align: 'center',
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(depth + 3)
      .setAlpha(0);
    variantFlavor.setScale(uiScale);
    scene.tweens.add({ targets: variantFlavor, alpha: 1, duration: 260, delay: 430 });
  }

  scene.tweens.add({ targets: [chip, variantText], alpha: 1, duration: 260, delay: 430 });

  if (shouldSpawnVariantSparkles(payload.runResult?.newlyUnlockedVariants, reduceParticles)) {
    for (const spec of variantChipSparkleSpec(centerX, chipY, chipW)) {
      const sparkle = scene.add
        .circle(spec.x, spec.y, spec.radius, 0xf7c270, 0)
        .setScrollFactor(0)
        .setDepth(depth + 4);
      scene.tweens.add({
        targets: sparkle,
        alpha: { from: 0, to: 1 },
        scale: { from: 0.4, to: 1.8 },
        duration: 700,
        delay: spec.delay,
        ease: 'Back.easeOut',
        yoyo: true,
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  return { bottomY: chipY + chipH / 2 };
}
