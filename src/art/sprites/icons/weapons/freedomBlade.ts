import * as Phaser from 'phaser';

/**
 * `wicon_freedom_blade` — the Wallace Sword wreathed in two
 * shockwave rings. Vertical great-sword (tip up), with two pale
 * concentric arcs behind it suggesting the two delayed waves the
 * legendary form rolls out. The blade carries a brighter steel-glint
 * than the base form (the sword has remembered who it is).
 */
export function drawFreedomBladeIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 16, cy = 16;

  // ── Shockwave rings — drawn FIRST so the sword sits on top.
  g.lineStyle(1.2, 0xa8c0d8, 0.55);
  g.beginPath(); g.arc(cx, cy + 4, 13, Math.PI * 1.05, Math.PI * 1.95, false); g.strokePath();
  g.lineStyle(0.9, 0xa8c0d8, 0.32);
  g.beginPath(); g.arc(cx, cy + 4, 15.4, Math.PI * 1.08, Math.PI * 1.92, false); g.strokePath();

  // Drop shadow.
  g.fillStyle(0x000000, 0.45);
  g.fillEllipse(cx, cy + 12, 12, 2);

  // BLADE — vertical wedge, tip-up. Steel-blue patriot tone.
  g.fillStyle(0x0a0a0e, 1);
  g.fillRect(cx - 3.6, cy - 14, 7.2, 18);
  g.fillStyle(0x6a7a8a, 1);
  g.fillRect(cx - 3.0, cy - 14, 6.0, 18);
  // Bright leading rims.
  g.fillStyle(0xb8c8d8, 1);
  g.fillRect(cx - 3.0, cy - 14, 0.9, 18);
  g.fillRect(cx + 2.1, cy - 14, 0.9, 18);
  // Fuller — darker spine.
  g.fillStyle(0x3a4a5a, 1);
  g.fillRect(cx - 0.5, cy - 13, 1, 16);
  // Tip taper.
  g.fillStyle(0x0a0a0e, 1);
  g.fillTriangle(cx - 3.6, cy - 13, cx, cy - 16.5, cx + 3.6, cy - 13);
  g.fillStyle(0x6a7a8a, 1);
  g.fillTriangle(cx - 3.0, cy - 13, cx, cy - 16.0, cx + 3.0, cy - 13);
  g.fillStyle(0xc8d8e8, 0.9);
  g.fillTriangle(cx - 3.0, cy - 13, cx, cy - 16.0, cx - 0.6, cy - 13);
  // Steel-glint near the upper third (bigger than base form).
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx + 0.7, cy - 8, 1.0, 2.4);
  g.fillStyle(0xfff8e0, 0.8);
  g.fillRect(cx + 1.1, cy - 4, 0.6, 1.0);

  // CROSS-GUARD — same iron-grey + brass finials as base.
  g.fillStyle(0x0a0a0e, 1);
  g.fillRect(cx - 11.5, cy + 3, 23, 3.4);
  g.fillStyle(0x4a5260, 1);
  g.fillRect(cx - 11, cy + 3.4, 22, 2.6);
  g.fillStyle(0x8a92a0, 0.85);
  g.fillRect(cx - 10.5, cy + 3.6, 21, 0.9);
  // Brass finials.
  g.fillStyle(0xa07028, 1);
  g.fillCircle(cx - 11.2, cy + 4.7, 1.5);
  g.fillCircle(cx + 11.2, cy + 4.7, 1.5);
  g.fillStyle(0xf0c060, 1);
  g.fillCircle(cx - 11.2, cy + 4.3, 0.7);
  g.fillCircle(cx + 11.2, cy + 4.3, 0.7);

  // GRIP — two-hand linen wrap.
  g.fillStyle(0x0a0a0e, 1);
  g.fillRect(cx - 2, cy + 6, 4, 8);
  g.fillStyle(0xa07028, 1);  // brass — Freedom Blade trades linen for gilt.
  g.fillRect(cx - 1.6, cy + 6.4, 3.2, 7.4);
  g.fillStyle(0xd8a040, 1);
  g.fillRect(cx - 1.4, cy + 6.6, 2.6, 7.0);
  // Three darker stitch bands.
  g.fillStyle(0x6a4818, 1);
  g.fillRect(cx - 1.6, cy + 7.6, 3.2, 0.5);
  g.fillRect(cx - 1.6, cy + 9.4, 3.2, 0.5);
  g.fillRect(cx - 1.6, cy + 11.2, 3.2, 0.5);

  // POMMEL — steel orb with a saltire-glint at centre.
  g.fillStyle(0x0a0a0e, 1);
  g.fillCircle(cx, cy + 15, 2.8);
  g.fillStyle(0x4a5260, 1);
  g.fillCircle(cx, cy + 15, 2.2);
  g.fillStyle(0xb8c8d8, 1);
  g.fillCircle(cx, cy + 15, 1.2);
  // Tiny X centre — the saltire.
  g.fillStyle(0xfff0c0, 1);
  g.fillRect(cx - 0.3, cy + 14.6, 0.6, 0.7);

  g.generateTexture('wicon_freedom_blade', s, s);
  g.destroy();
}
