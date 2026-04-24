/**
 * `fx_fianna_spirit` — spectral Celtic warrior sprite baked as a
 * 24×24 bone-ivory glyph (R1 M4.5 P5, fingals_horn). Silhouette:
 * diamond-shouldered warrior with a raised spear; translucent inner
 * core sells "spectral". Reads at gameplay scale without needing
 * outline post-process (spectral entities skip the black border).
 */
import * as Phaser from 'phaser';

export const FIANNA_SPIRIT_PARTICLE_COLOUR = 0xe8d8a0;

export function bakeFiannaSpirit(scene: Phaser.Scene): void {
  const size = 24;
  const g = scene.add.graphics();
  const cx = size / 2;
  const cy = size / 2;

  // Outer aura — soft bone halo so the spirit pops against dark
  // biomes (bog/pine) without losing the ghost quality.
  g.fillStyle(FIANNA_SPIRIT_PARTICLE_COLOUR, 0.22);
  g.fillCircle(cx, cy, 10);
  g.fillStyle(FIANNA_SPIRIT_PARTICLE_COLOUR, 0.12);
  g.fillCircle(cx, cy, 11.5);

  // Core body — torso as a tall diamond (shoulders at mid, hips
  // narrower). Low alpha so the silhouette reads "translucent".
  g.fillStyle(FIANNA_SPIRIT_PARTICLE_COLOUR, 0.85);
  g.beginPath();
  g.moveTo(cx, cy - 7);        // head apex
  g.lineTo(cx + 4, cy - 2);    // right shoulder
  g.lineTo(cx + 2, cy + 6);    // right hip
  g.lineTo(cx - 2, cy + 6);    // left hip
  g.lineTo(cx - 4, cy - 2);    // left shoulder
  g.closePath();
  g.fillPath();

  // Spear — vertical shaft to the right of the body, thin rect.
  g.fillStyle(0xfff2c8, 0.95);
  g.fillRect(cx + 5, cy - 9, 1, 14);
  // Spear tip — small upward triangle.
  g.beginPath();
  g.moveTo(cx + 5.5, cy - 11);
  g.lineTo(cx + 7, cy - 9);
  g.lineTo(cx + 4, cy - 9);
  g.closePath();
  g.fillPath();

  // Head bead — small brighter circle at the apex.
  g.fillStyle(0xfff4d8, 1);
  g.fillCircle(cx, cy - 6, 1.5);

  // Inner glow spark — centre highlight sells "living spirit" over
  // "statue silhouette".
  g.fillStyle(0xffffff, 0.6);
  g.fillRect(cx - 1, cy - 1, 2, 3);

  g.generateTexture('fx_fianna_spirit', size, size);
  g.destroy();
}
