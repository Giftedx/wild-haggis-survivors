import * as Phaser from 'phaser';

/**
 * `wicon_wallace_sword` — William Wallace's great sword. Wider blade
 * than the claymore, longer reach. Vertical orientation (tip up), wide
 * cross-guard, two-handed grip wrapped in linen, plain steel pommel.
 * Heavy and patriotic. Steel-blue tint reads "Stirling Bridge 1297".
 */
export function drawWallaceSwordIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 16, cy = 16;

  // Drop shadow under the grip.
  g.fillStyle(0x000000, 0.4);
  g.fillEllipse(cx, cy + 11, 12, 2);

  // ── BLADE — wide vertical wedge, tip at the top. Two trapezoidal
  // halves so the central fuller can be a darker stripe.
  g.fillStyle(0x0a0a0e, 1);
  g.fillRect(cx - 3.2, cy - 13, 6.4, 17);  // outline
  // Body — steel-blue (Stirling patriot grey).
  g.fillStyle(0x6a7a8a, 1);
  g.fillRect(cx - 2.6, cy - 13, 5.2, 17);
  // Bright leading edges — left & right rims.
  g.fillStyle(0xa8b8c8, 1);
  g.fillRect(cx - 2.6, cy - 13, 0.8, 17);
  g.fillRect(cx + 1.8, cy - 13, 0.8, 17);
  // Central fuller — darker groove down the middle.
  g.fillStyle(0x3a4a5a, 1);
  g.fillRect(cx - 0.5, cy - 12, 1, 15);
  // Tip — taper the top into a point.
  g.fillStyle(0x0a0a0e, 1);
  g.fillTriangle(cx - 3.2, cy - 12, cx, cy - 15, cx + 3.2, cy - 12);
  g.fillStyle(0x6a7a8a, 1);
  g.fillTriangle(cx - 2.6, cy - 12, cx, cy - 14.4, cx + 2.6, cy - 12);
  g.fillStyle(0xa8b8c8, 0.9);
  g.fillTriangle(cx - 2.6, cy - 12, cx, cy - 14.4, cx - 0.6, cy - 12);
  // Specular flash near the upper third.
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx + 0.5, cy - 8, 0.8, 1.4);
  g.fillStyle(0xfff8e0, 0.7);
  g.fillRect(cx + 0.8, cy - 4, 0.6, 0.8);

  // ── CROSS-GUARD — wide, slightly down-swept. Iron grey with brass
  // tip-caps (the Wallace sword's signature finial.)
  g.fillStyle(0x0a0a0e, 1);
  g.fillRect(cx - 11, cy + 3, 22, 3.4);
  g.fillStyle(0x4a5260, 1);
  g.fillRect(cx - 10.4, cy + 3.4, 20.8, 2.6);
  g.fillStyle(0x8a92a0, 0.8);
  g.fillRect(cx - 10, cy + 3.6, 20, 0.9);
  // Brass finials at each end.
  g.fillStyle(0xa07028, 1);
  g.fillCircle(cx - 10.5, cy + 4.7, 1.4);
  g.fillCircle(cx + 10.5, cy + 4.7, 1.4);
  g.fillStyle(0xd8a040, 0.9);
  g.fillCircle(cx - 10.5, cy + 4.3, 0.7);
  g.fillCircle(cx + 10.5, cy + 4.3, 0.7);

  // ── GRIP — long two-hand wrap, off-white linen with binding
  // ridges. Visibly longer than the claymore's grip.
  g.fillStyle(0x0a0a0e, 1);
  g.fillRect(cx - 2, cy + 6, 4, 9);
  g.fillStyle(0x9a8c70, 1);
  g.fillRect(cx - 1.6, cy + 6.4, 3.2, 8.4);
  g.fillStyle(0xc8b890, 1);
  g.fillRect(cx - 1.4, cy + 6.6, 2.6, 8.0);
  // Binding ridges — three darker bands.
  g.fillStyle(0x6a5840, 1);
  g.fillRect(cx - 1.6, cy + 7.6, 3.2, 0.5);
  g.fillRect(cx - 1.6, cy + 10.0, 3.2, 0.5);
  g.fillRect(cx - 1.6, cy + 12.4, 3.2, 0.5);

  // ── POMMEL — plain steel ball.
  g.fillStyle(0x0a0a0e, 1);
  g.fillCircle(cx, cy + 16, 2.6);
  g.fillStyle(0x4a5260, 1);
  g.fillCircle(cx, cy + 16, 2.0);
  g.fillStyle(0x8a92a0, 0.9);
  g.fillCircle(cx - 0.6, cy + 15.4, 0.9);

  g.generateTexture('wicon_wallace_sword', s, s);
  g.destroy();
}
