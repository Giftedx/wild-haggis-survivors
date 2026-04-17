import type Phaser from 'phaser';

/**
 * Looping "expanding pulse" tween for a pickup's halo: the glow
 * scales out from 1× to a final scale while its alpha fades from
 * 0.3 to 0, then loops. Treasure / golden / health pickups all
 * shared this exact 5-line tween — only `finalScale` and `duration`
 * varied, so they live as call args.
 *
 * Note: not yoyoed and intentionally not merged with
 * `TWEEN_INFINITE_BREATHE` — that preset breathes (yoyo + Sine
 * easeInOut), this preset bursts outward and restarts.
 */
export function pulsePickupGlow(
  scene: Phaser.Scene,
  glow: Phaser.GameObjects.GameObject,
  finalScale: number,
  durationMs: number,
): void {
  scene.tweens.add({
    targets: glow,
    scale: { from: 1, to: finalScale },
    alpha: { from: 0.3, to: 0 },
    duration: durationMs,
    repeat: -1,
  });
}
