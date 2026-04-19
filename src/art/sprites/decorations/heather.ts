/**
 * `deco_heather` — purple heather bush for moor dressing. Design
 * pivot: old bush was a blob with too many tiny spike stems (7×)
 * that merged into purple mulch at 22px. New pitch — THREE bold
 * flower-spikes (not seven), each with clearly visible bell-shaped
 * blossoms running up the stem (heather's signature spike-form).
 * Warm foliage base, cool purple blooms, woody stems, and a single
 * bright pink tip-blossom to catch the eye.
 */

import Phaser from 'phaser';

export function bakeHeather(scene: Phaser.Scene): void {
  const s = 22;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 3;

  // ── Ground shadow. ──
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(cx, cy + 5, 16, 3);

  // ── Green foliage base — dark olive layered with brighter tops.
  // Wider than before, lower, so the flower spikes dominate above. ──
  g.fillStyle(0x1a2810, 1);
  g.fillEllipse(cx, cy + 2, 18, 7);
  g.fillStyle(0x3a4a20, 1);
  g.fillEllipse(cx, cy + 1, 16, 6);
  // Mid-green leaf clumps
  g.fillStyle(0x5a7028, 1);
  g.fillCircle(cx - 5, cy, 3);
  g.fillCircle(cx, cy, 3.5);
  g.fillCircle(cx + 5, cy, 3);
  // Bright top highlight clumps
  g.fillStyle(0x7a9040, 1);
  g.fillCircle(cx - 4, cy - 1, 2);
  g.fillCircle(cx + 4, cy - 1, 2);
  g.fillCircle(cx, cy - 1, 2.2);

  // ── THREE bold flower spikes — the signature heather shape. Each
  // spike has a visible stem + stacked blossoms. ──
  drawSpike(g, cx - 5, cy - 2, 6);
  drawSpike(g, cx, cy - 2, 8);
  drawSpike(g, cx + 5, cy - 2, 6);

  // ── Bright pink tip-blossom on the tallest spike — eye-catcher. ──
  g.fillStyle(0xff99cc, 1);
  g.fillCircle(cx, cy - 11, 1.2);
  g.fillStyle(0xffccdd, 0.95);
  g.fillCircle(cx, cy - 11, 0.6);

  // ── Wee bee visiting the centre spike — life in the moor. ──
  g.fillStyle(0xffcc22, 1);
  g.fillRect(cx + 2, cy - 7, 1.4, 1);
  g.fillStyle(0x1a0e04, 1);
  g.fillRect(cx + 2, cy - 7, 0.5, 1);
  g.fillRect(cx + 2.9, cy - 7, 0.5, 1);
  // Wings
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(cx + 2, cy - 8, 0.5);
  g.fillCircle(cx + 3, cy - 8, 0.5);

  g.generateTexture('deco_heather', s, s);
  g.destroy();
}

/**
 * Draw one heather flower-spike — stem + blossom bells running up.
 * Blossoms are 1.2px round dots in alternating purple tones, giving
 * the recognisable heather "beads on a string" look.
 */
function drawSpike(g: Phaser.GameObjects.Graphics, x: number, yBase: number, height: number): void {
  // Woody stem
  g.fillStyle(0x3a2010, 1);
  g.fillRect(x, yBase - height, 0.8, height);
  g.fillStyle(0x5a3818, 0.85);
  g.fillRect(x + 0.2, yBase - height, 0.4, height);
  // Blossom bells — alternating dark/light purple up the spike
  const bells = Math.floor(height / 1.2);
  for (let i = 0; i < bells; i++) {
    const by = yBase - 1 - i * 1.2;
    const dark = i % 2 === 0;
    g.fillStyle(dark ? 0x6a2884 : 0x8a3aa8, 1);
    g.fillCircle(x - 0.8, by, 1);
    g.fillCircle(x + 1.6, by, 1);
    // Bright centre dot on each bell
    g.fillStyle(0xcc78dd, 0.9);
    g.fillCircle(x - 0.8, by, 0.4);
    g.fillCircle(x + 1.6, by, 0.4);
  }
  // Tip bud — lavender pink
  g.fillStyle(0xddaaee, 1);
  g.fillCircle(x + 0.4, yBase - height, 1);
}
