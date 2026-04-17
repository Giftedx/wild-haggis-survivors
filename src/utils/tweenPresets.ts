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

/**
 * One-shot scale / recoil pulse — `yoyo: true` + `ease: 'Sine.easeOut'`
 * with no repeat. Pairs a single prop animation (scaleX/Y, alpha…)
 * with its bounce-back so the caller just writes the target value and
 * duration. Used for kill-cap pulse, boss enrage swell, player hit recoil.
 */
export const TWEEN_ONE_SHOT_PULSE = {
  yoyo: true,
  ease: 'Sine.easeOut',
} as const;
