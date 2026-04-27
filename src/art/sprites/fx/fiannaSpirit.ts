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

  // ── RIM HUE SPLIT — cooler outer halo (pale blue-bone) tightens
  // into a warm bone core. Gives the spirit depth without breaking
  // the spectral palette. Tighter arc than before. ──
  g.fillStyle(0xa0b8d8, 0.16);
  g.fillCircle(cx, cy, 10.5);
  g.fillStyle(0xc8d8ec, 0.18);
  g.fillCircle(cx, cy, 9);
  g.fillStyle(FIANNA_SPIRIT_PARTICLE_COLOUR, 0.30);
  g.fillCircle(cx, cy, 7.5);

  // Core body — torso as a tall diamond (shoulders at mid, hips
  // narrower). Low alpha so the silhouette reads "translucent".
  g.fillStyle(FIANNA_SPIRIT_PARTICLE_COLOUR, 0.88);
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

  // ── FLOATING GOLD MOTES — three small motes orbiting the
  // spirit's core, sells "living myth" rather than "icon". ──
  g.fillStyle(0xffd078, 0.55);
  g.fillCircle(cx - 7, cy - 4, 1.4);
  g.fillCircle(cx + 7, cy + 2, 1.2);
  g.fillCircle(cx - 5, cy + 6, 1.1);
  g.fillStyle(0xffefb0, 0.95);
  g.fillCircle(cx - 7, cy - 4, 0.6);
  g.fillCircle(cx + 7, cy + 2, 0.5);
  g.fillCircle(cx - 5, cy + 6, 0.45);

  // Inner glow spark — centre highlight sells "living spirit" over
  // "statue silhouette".
  g.fillStyle(0xffffff, 0.7);
  g.fillRect(cx - 1, cy - 1, 2, 3);

  g.generateTexture('fx_fianna_spirit', size, size);
  g.destroy();
}
