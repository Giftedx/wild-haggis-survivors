/**
 * `kelpie` — loch water spirit in equine form. Black-blue wet coat, dripping
 * seaweed-tangled mane, luminous eye, jagged teeth, water puddling at the
 * hooves. Visually kin to `kelpie_foal` — same palette, adult scale, more
 * menace. Folklore: the shapeshifter that lures lone wanderers into the loch.
 */

import Phaser from 'phaser';

export function bakeKelpie(scene: Phaser.Scene): void {
  const s = 48;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // ── Water-spirit under-glow — matches the foal's aura. ──
  g.fillStyle(0x4a8ab0, 0.2);
  g.fillEllipse(cx, cy + 2, 38, 30);
  g.fillStyle(0x6fa0c0, 0.12);
  g.fillEllipse(cx, cy + 2, 30, 22);

  // ── Hoof puddle — spirit is always wet. ──
  g.fillStyle(0x103348, 0.55);
  g.fillEllipse(cx, cy + 17, 30, 5);
  g.fillStyle(0x2e5070, 0.35);
  g.fillEllipse(cx, cy + 17, 22, 3);
  // Faint ripple rings
  g.lineStyle(0.8, 0x6fa0c0, 0.5);
  g.beginPath(); g.arc(cx, cy + 17, 13, Math.PI, 0); g.strokePath();
  g.beginPath(); g.arc(cx, cy + 17, 9, Math.PI, 0); g.strokePath();

  // ── Legs — 4 equine, darker at top, pale at the hocks. ──
  g.fillStyle(0x0d1a28, 1);
  g.fillRect(cx - 10, cy + 5, 3, 12);
  g.fillRect(cx - 4, cy + 7, 3, 10);
  g.fillRect(cx + 2, cy + 7, 3, 10);
  g.fillRect(cx + 8, cy + 5, 3, 12);
  g.fillStyle(0x1a3348, 1);
  g.fillRect(cx - 9, cy + 6, 1, 10);
  g.fillRect(cx + 9, cy + 6, 1, 10);
  // Pale hocks / fetlocks (water-spirit glow runs down the legs)
  g.fillStyle(0xa0c8e0, 0.7);
  g.fillRect(cx - 10, cy + 15, 3, 2);
  g.fillRect(cx - 4, cy + 15, 3, 2);
  g.fillRect(cx + 2, cy + 15, 3, 2);
  g.fillRect(cx + 8, cy + 15, 3, 2);

  // ── Body — elongated equine torso, wet-coat sheen. ──
  g.fillStyle(0x0d1a28, 1);
  g.fillEllipse(cx, cy + 5, 28, 14);
  g.fillStyle(0x1a3348, 1);
  g.fillEllipse(cx, cy + 4, 26, 12);
  g.fillStyle(0x2e5070, 1);
  g.fillEllipse(cx - 2, cy + 3, 22, 9);
  // Wet-sheen highlight along the spine
  g.fillStyle(0x6fa0c0, 0.45);
  g.fillEllipse(cx - 3, cy + 1, 14, 3);
  g.fillStyle(0xaaddee, 0.3);
  g.fillEllipse(cx - 5, cy, 6, 1.5);

  // ── Neck rising forward-right. ──
  g.fillStyle(0x0d1a28, 1);
  g.fillTriangle(cx + 8, cy - 4, cx + 4, cy + 5, cx + 13, cy + 3);
  g.fillStyle(0x1a3348, 1);
  g.fillTriangle(cx + 9, cy - 3, cx + 6, cy + 4, cx + 12, cy + 3);
  g.fillStyle(0x2e5070, 1);
  g.fillTriangle(cx + 10, cy - 2, cx + 8, cy + 3, cx + 12, cy + 2);

  // ── Head — horse profile pointing right. ──
  g.fillStyle(0x0d1a28, 1);
  g.fillEllipse(cx + 16, cy - 4, 12, 7);
  g.fillStyle(0x1a3348, 1);
  g.fillEllipse(cx + 16, cy - 4, 10, 6);
  g.fillStyle(0x2e5070, 1);
  g.fillEllipse(cx + 15, cy - 5, 7, 4);
  // Bony forehead ridge
  g.fillStyle(0x0a0f1c, 0.5);
  g.fillRect(cx + 13, cy - 7, 1, 4);

  // ── Nostril + muzzle end. ──
  g.fillStyle(0x050810, 1);
  g.fillCircle(cx + 20, cy - 4, 0.9);
  g.fillStyle(0x1a3348, 1);
  g.fillRect(cx + 19, cy - 2, 3, 1);

  // ── Jagged teeth — kelpie folklore always shows teeth. ──
  g.fillStyle(0xccbb99, 1);
  g.fillRect(cx + 18, cy - 1, 1, 1);
  g.fillRect(cx + 20, cy - 1, 1, 1);
  g.fillStyle(0x7a6a55, 1);
  g.fillRect(cx + 19, cy, 1, 1);

  // ── Ear — pricked forward. ──
  g.fillStyle(0x0d1a28, 1);
  g.fillTriangle(cx + 11, cy - 8, cx + 9, cy - 3, cx + 13, cy - 5);
  g.fillStyle(0x1a3348, 1);
  g.fillTriangle(cx + 11, cy - 7, cx + 10, cy - 4, cx + 12, cy - 5);

  // ── Glowing eye — cyan, matching the foal. ──
  g.fillStyle(0x000000, 1);
  g.fillCircle(cx + 13, cy - 6, 2);
  g.fillStyle(0x44ddcc, 1);
  g.fillCircle(cx + 13, cy - 6, 1.3);
  g.fillStyle(0x8fe0ff, 1);
  g.fillCircle(cx + 13, cy - 6, 0.7);
  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(cx + 12.6, cy - 6.4, 0.35);

  // ── Mane — wet-lank + seaweed strands streaming down the neck. ──
  // Dark wet base (shadow behind strands)
  g.fillStyle(0x050810, 1);
  g.fillEllipse(cx + 3, cy - 3, 16, 10);
  g.fillStyle(0x0a1828, 1);
  g.fillEllipse(cx + 2, cy - 4, 14, 8);
  // Water strands
  g.fillStyle(0x2e5070, 1);
  g.fillRect(cx - 5, cy - 6, 2, 10);
  g.fillRect(cx - 1, cy - 7, 2, 11);
  g.fillRect(cx + 3, cy - 6, 2, 9);
  g.fillStyle(0x4a8ab0, 0.9);
  g.fillRect(cx - 4, cy - 5, 1, 8);
  g.fillRect(cx, cy - 6, 1, 10);
  g.fillRect(cx + 4, cy - 5, 1, 7);
  // Seaweed (dark-green tangles)
  g.fillStyle(0x1a3a28, 1);
  g.fillRect(cx - 3, cy + 2, 1, 4);
  g.fillRect(cx + 1, cy + 1, 1, 5);
  g.fillStyle(0x2a5a3a, 0.8);
  g.fillRect(cx - 3, cy + 3, 1, 3);
  g.fillRect(cx + 1, cy + 2, 1, 3);

  // ── Tail — wispy water, trailing left-down. ──
  g.fillStyle(0x0d1a28, 1);
  g.fillTriangle(cx - 13, cy + 2, cx - 18, cy + 0, cx - 11, cy + 9);
  g.fillStyle(0x2e5070, 0.8);
  g.fillTriangle(cx - 12, cy + 3, cx - 16, cy + 2, cx - 11, cy + 8);
  g.fillStyle(0x4a8ab0, 0.6);
  g.fillTriangle(cx - 11, cy + 4, cx - 14, cy + 4, cx - 11, cy + 7);
  // Tail drips
  g.fillStyle(0x8fd0f0, 0.6);
  g.fillCircle(cx - 17, cy + 3, 0.8);
  g.fillCircle(cx - 14, cy + 8, 0.7);

  // ── Dripping water — the kelpie giveaway. ──
  g.fillStyle(0x4a8ab0, 0.65);
  g.fillCircle(cx + 6, cy + 14, 1);
  g.fillCircle(cx - 4, cy + 13, 0.9);
  g.fillCircle(cx + 18, cy + 2, 0.9);
  g.fillCircle(cx - 2, cy + 15, 0.7);
  g.fillStyle(0xaaddee, 0.55);
  g.fillCircle(cx + 6, cy + 13, 0.5);
  g.fillCircle(cx + 18, cy + 1, 0.4);

  g.generateTexture('kelpie', s, s);
  g.destroy();
}
