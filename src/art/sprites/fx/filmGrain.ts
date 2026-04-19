/**
 * `film_grain` — 128×128 canvas-based noise texture tiled across the
 * screen for the film-grain post effect. Uses Phaser's canvas-texture
 * API rather than Graphics because the sheer number of pixel draws
 * (~14k) is faster as direct canvas writes.
 */

import Phaser from 'phaser';

export function bakeFilmGrain(scene: Phaser.Scene): void {
  if (scene.textures.exists('film_grain')) return;
  const size = 128;
  const tex = scene.textures.createCanvas('film_grain', size, size);
  if (!tex) return;
  const ctx = tex.getContext();
  if (!ctx) return;
  ctx.clearRect(0, 0, size, size);
  for (let i = 0; i < 10000; i++) {
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    const hi = Math.random() * 0.13;
    ctx.fillStyle = `rgba(255,245,220,${hi})`;
    ctx.fillRect(x, y, 1, 1);
    if (Math.random() > 0.52) {
      const lo = Math.random() * 0.11;
      ctx.fillStyle = `rgba(6,10,22,${lo})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  // Larger, rarer specks — photographic clumping when stretched full-screen.
  for (let i = 0; i < 900; i++) {
    const x = Math.floor(Math.random() * (size - 2));
    const y = Math.floor(Math.random() * (size - 2));
    const a = Math.random() * 0.045;
    ctx.fillStyle = `rgba(255,238,210,${a})`;
    ctx.fillRect(x, y, 2, 2);
    if (Math.random() > 0.45) {
      ctx.fillStyle = `rgba(12,18,40,${a * 0.85})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }
  // Subtle violet fringe (very low) — stops the grain feeling purely monochrome.
  for (let i = 0; i < 3200; i++) {
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    ctx.fillStyle = `rgba(180,160,220,${Math.random() * 0.028})`;
    ctx.fillRect(x, y, 1, 1);
  }
  tex.refresh();
}
