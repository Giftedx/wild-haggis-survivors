/**
 * Shared Phaser tween config fragments. Spread into `tweens.add({...})`
 * to dedupe recipes that get repeated across scenes and entities.
 */

/**
 * Infinite breathing loop — `yoyo: true`, `repeat: -1`,
 * `ease: 'Sine.easeInOut'`. Used for 20+ ambient animations
 * (XP gem auras, fire pulses, glow breathes, heather sway…)
 * that want the same smooth, never-ending in-out feel.
 */
export const TWEEN_INFINITE_BREATHE = {
  yoyo: true,
  repeat: -1,
  ease: 'Sine.easeInOut',
} as const;
