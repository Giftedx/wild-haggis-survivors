import * as Phaser from 'phaser';

/**
 * `wicon_clootie_rag` — Clootie Rag weapon icon.
 * A torn cloth strip tied at the wrist, blood-dark at the knot
 * and fading toward ragged edges. A faint pulsing aura circle
 * suggests the wounding radial pulse. Reads as "aura/DoT" at 32px.
 */
export function drawClootieRagIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();

  const cx = 16;
  const cy = 16;

  // Faint wound-aura ring behind the rag.
  g.lineStyle(1.5, 0x8a2a2a, 0.28);
  g.strokeCircle(cx, cy, 14);
  g.lineStyle(1, 0x8a2a2a, 0.18);
  g.strokeCircle(cx, cy, 10);

  // The rag — a rough-edged cloth strip, slightly diagonal.
  // Base cloth: aged cream-linen.
  g.fillStyle(0xd4c0a0, 1);
  g.fillRect(6, 12, 20, 8);

  // Ragged right edge — torn fringe (three short dark marks).
  g.fillStyle(0x1a0a04, 1);
  g.fillRect(23, 12, 1, 3);
  g.fillRect(24, 15, 1, 3);
  g.fillRect(23, 17, 2, 3);

  // Ragged left edge.
  g.fillRect(6, 13, 1, 3);
  g.fillRect(5, 16, 2, 2);

  // Blood-dark knot at the centre — a darker band where it's tied.
  g.fillStyle(0x6a1818, 1);
  g.fillRect(12, 12, 8, 8);

  // Blood stain spreading from the knot — dull red patches.
  g.fillStyle(0x8a2a2a, 0.75);
  g.fillEllipse(16, 16, 10, 6);

  // Lighter rag texture lines on the cloth.
  g.lineStyle(0.8, 0xb09878, 0.45);
  g.lineBetween(7, 14, 11, 14);
  g.lineBetween(7, 17, 11, 17);
  g.lineBetween(21, 14, 25, 14);
  g.lineBetween(21, 18, 25, 18);

  // Tie threads — faint crossing lines at the knot.
  g.lineStyle(1, 0x3a0808, 0.7);
  g.lineBetween(12, 12, 20, 20);
  g.lineBetween(20, 12, 12, 20);

  g.generateTexture('wicon_clootie_rag', s, s);
  g.destroy();
}
