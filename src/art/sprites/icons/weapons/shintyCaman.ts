import * as Phaser from 'phaser';

/**
 * `wicon_shinty_caman` — evolved Caman Storm. The bas (blade) of the
 * caman is now a blur-arc with three balls flying out in a fan, plus
 * a small stamina motion-line trail. Reads as "rapid sweep, a hail of
 * balls" — the moment in a Camanachd Cup final when the captain just
 * sets up a chain. Distinct from the base shinty_stick icon's single
 * ball + clear shaft.
 */
export function drawShintyCamanIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 16, cy = 16;

  // ── Heavier outline shaft, slightly steeper angle so the "swing"
  // reads more energetic than the base icon's poised pose.
  g.fillStyle(0x0a0a04, 1);
  g.fillTriangle(cx - 12, cy - 11, cx - 9, cy - 13, cx + 7, cy + 5);
  g.fillTriangle(cx - 11, cy - 10, cx + 8, cy + 6, cx + 6, cy + 7);
  // Cream wood + a polished gold band marking it as legendary
  g.fillStyle(0xd8c088, 1);
  g.fillTriangle(cx - 11, cy - 10, cx - 9, cy - 12, cx + 7, cy + 4);
  g.fillTriangle(cx - 10.5, cy - 9.5, cx + 6, cy + 5, cx + 5, cy + 6);
  g.fillStyle(0xf0d878, 1);
  g.fillRect(cx - 5, cy - 6, 5, 1.4);

  // ── Blade arc — instead of a static ellipse, a curved sweep
  // suggesting motion. Two stacked half-ellipses, the back one fainter.
  g.fillStyle(0x1a1208, 0.45);
  g.fillEllipse(cx + 7, cy + 8, 16, 6);
  g.fillStyle(0x1a1208, 1);
  g.fillEllipse(cx + 7, cy + 8, 11, 5);
  g.fillStyle(0xe8d0a0, 1);
  g.fillEllipse(cx + 7, cy + 8, 9, 4);
  g.fillStyle(0xfff0c8, 0.9);
  g.fillEllipse(cx + 6, cy + 7, 7, 2.5);
  // Streaks of speed coming off the blade arc
  g.fillStyle(0xfff0c8, 0.85);
  g.fillRect(cx + 12, cy + 9.5, 4, 0.5);
  g.fillRect(cx + 12, cy + 7, 4, 0.5);
  g.fillRect(cx + 12, cy + 11, 3, 0.5);

  // ── THREE shinty balls in a fan, mid-air upper-right, each at a
  // different distance + size to sell the "burst" sweep.
  const drawBall = (bx: number, by: number, r: number) => {
    g.fillStyle(0x1a1208, 1);
    g.fillCircle(bx, by, r + 0.6);
    g.fillStyle(0xe8d8b0, 1);
    g.fillCircle(bx, by, r);
    g.fillStyle(0xfff0c8, 0.9);
    g.fillEllipse(bx - r * 0.4, by - r * 0.5, r * 0.9, r * 0.55);
    // Red seam
    g.fillStyle(0x8a2218, 1);
    g.fillRect(bx - r, by + 0.1, r * 2, 0.4);
    // Specular dot
    g.fillStyle(0xffffff, 1);
    g.fillCircle(bx - r * 0.4, by - r * 0.55, 0.45);
  };
  drawBall(cx + 9, cy - 7, 3);
  drawBall(cx + 12, cy - 3, 2.4);
  drawBall(cx + 6, cy - 11, 2.2);

  // ── Fan-spread motion smears connecting the balls — three short
  // streaks fanning from blade into the trio.
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(cx + 4, cy - 1, 4, 0.5);
  g.fillRect(cx + 5, cy - 4, 4, 0.5);
  g.fillRect(cx + 6, cy - 8, 3, 0.5);

  // ── Legendary glow halo — gold around the corner where the storm
  // is densest. Subtle so it doesn't drown the silhouette.
  g.fillStyle(0xf8d050, 0.18);
  g.fillCircle(cx + 9, cy - 5, 7);
  g.fillStyle(0xfff0a0, 0.12);
  g.fillCircle(cx + 9, cy - 5, 4.5);

  // ── Grass flicks at the blade leading edge — sells the sweep.
  g.fillStyle(0x3a6a28, 1);
  g.fillRect(cx + 12, cy + 10, 0.8, 0.8);
  g.fillRect(cx + 13, cy + 8.5, 0.6, 0.6);
  g.fillStyle(0x5a8a38, 0.9);
  g.fillRect(cx + 12.5, cy + 10.2, 0.5, 0.5);

  g.generateTexture('wicon_shinty_caman', s, s);
  g.destroy();
}
