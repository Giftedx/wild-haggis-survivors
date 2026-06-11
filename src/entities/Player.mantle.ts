/**
 * Pure half of Player.setMantleTier — extracted so the state-machine
 * logic (texture swap vs tween vs instant vs hide) can be unit-tested
 * without mounting the whole Player entity.
 */

import type { MantleTier } from '../animation/mantleTier';

export interface ApplyMantleTierArgs {
  overlay: Phaser.GameObjects.Sprite;
  tweens: Phaser.Tweens.TweenManager;
  variantKey: string;
  nextTier: MantleTier;
  instant: boolean;
}

export function applyMantleTier(args: ApplyMantleTierArgs): void {
  const { overlay, tweens, variantKey, nextTier, instant } = args;
  if (nextTier === 0) {
    overlay.setVisible(false);
    overlay.setAlpha(0);
    return;
  }
  overlay.setTexture(`mantle_${variantKey}_${nextTier}`);
  overlay.setVisible(true);
  if (instant) {
    overlay.setAlpha(1);
    return;
  }
  // Start from current alpha so tier 1→2 transitions (overlay already
  // visible at alpha 1) don't flash-fade. For 0→1 the overlay alpha is 0
  // so the visual is the intended reveal.
  tweens.add({
    targets: overlay,
    alpha: { from: overlay.alpha, to: 1 },
    duration: 300,
    ease: 'Cubic.easeOut',
  });
}
