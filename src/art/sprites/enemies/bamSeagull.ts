import Phaser from 'phaser';

export function bakeBamSeagull(scene: Phaser.Scene): void {
  // 36×36 — Glasgow's apex predator. Will mug you for a chip.
  // Menacing posture, beady eyes, stolen chip in beak. Pure bam energy.
  const s = 36;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;

  // ── Wings (swept back, aggressive posture — mid-swoop) ──
  // Outer wing feathers — dark grey with distinct tips
  g.fillStyle(0x556677, 1);
  g.fillTriangle(cx - 2, cy, cx - 14, cy - 9, cx + 2, cy - 6);
  g.fillTriangle(cx - 2, cy, cx - 14, cy + 9, cx + 2, cy + 6);
  // Mid wing — lighter grey
  g.fillStyle(0x778899, 1);
  g.fillTriangle(cx, cy, cx - 10, cy - 6, cx + 1, cy - 4);
  g.fillTriangle(cx, cy, cx - 10, cy + 6, cx + 1, cy + 4);
  // Inner wing (near body) — lightest
  g.fillStyle(0x99aabb, 0.7);
  g.fillTriangle(cx, cy, cx - 6, cy - 3, cx + 1, cy - 2);
  g.fillTriangle(cx, cy, cx - 6, cy + 3, cx + 1, cy + 2);
  // Wingtip feather separation — dark fingers at end of each wing
  g.fillStyle(0x334455, 1);
  g.fillTriangle(cx - 14, cy - 9, cx - 10, cy - 6, cx - 16, cy - 7);
  g.fillTriangle(cx - 12, cy - 8, cx - 9, cy - 5, cx - 14, cy - 5);
  g.fillTriangle(cx - 14, cy + 9, cx - 10, cy + 6, cx - 16, cy + 7);
  g.fillTriangle(cx - 12, cy + 8, cx - 9, cy + 5, cx - 14, cy + 5);

  // ── Body (chunky, barrel-chested — this bird eats well) ──
  g.fillStyle(0xbbbbbb, 1);
  g.fillEllipse(cx + 2, cy, 14, 10);
  g.fillStyle(0xdddddd, 1);
  g.fillEllipse(cx + 2, cy, 12, 8);
  // White breast
  g.fillStyle(0xf5f5f5, 1);
  g.fillEllipse(cx + 1, cy - 1, 10, 6);
  // Subtle belly shadow
  g.fillStyle(0xaabbbb, 0.4);
  g.fillEllipse(cx + 2, cy + 2, 8, 3);
  // Tail feathers (stubby, fanning behind)
  g.fillStyle(0x889999, 1);
  g.fillTriangle(cx - 5, cy - 2, cx - 5, cy + 2, cx - 10, cy);
  g.fillStyle(0x778888, 1);
  g.fillTriangle(cx - 5, cy - 1, cx - 5, cy + 3, cx - 9, cy + 1);

  // ── Head (larger, rounder — the bam glare needs room) ──
  g.fillStyle(0xcccccc, 1);
  g.fillCircle(cx + 10, cy, 5.5);
  g.fillStyle(0xeeeeee, 1);
  g.fillCircle(cx + 10, cy, 5);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx + 10, cy - 0.5, 4.5);

  // ── Eye (BEADY, CALCULATING — sizing up your chippy) ──
  // Yellow iris ring
  g.fillStyle(0xeedd44, 1);
  g.fillCircle(cx + 11, cy - 1, 2);
  // Pupil — BLACK, soulless, aggressive
  g.fillStyle(0x000000, 1);
  g.fillCircle(cx + 11.5, cy - 1, 1.2);
  // Eye glint (tiny, makes the stare more unsettling)
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx + 11, cy - 2, 0.5);
  // Furrowed brow line (angry — this seagull has INTENT)
  g.fillStyle(0x999999, 0.8);
  g.fillRect(cx + 9, cy - 3, 4, 1);

  // ── Beak (open, aggressive — mid-SQUAWK) ──
  // Upper beak — orange-yellow, hooked at tip
  g.fillStyle(0xcc8811, 1);
  g.fillTriangle(cx + 13, cy - 1, cx + 13, cy + 1, cx + 18, cy);
  g.fillStyle(0xeeaa33, 1);
  g.fillTriangle(cx + 14, cy - 0.5, cx + 14, cy + 0.5, cx + 17, cy);
  // Lower beak (slightly dropped — open mouth, screaming)
  g.fillStyle(0xcc8811, 1);
  g.fillTriangle(cx + 13, cy + 1, cx + 13, cy + 3, cx + 17, cy + 2);
  g.fillStyle(0xddaa22, 1);
  g.fillTriangle(cx + 14, cy + 1, cx + 14, cy + 2, cx + 16, cy + 2);
  // Red spot on lower beak (herring gull signature)
  g.fillStyle(0xcc2222, 1);
  g.fillCircle(cx + 15, cy + 2, 0.7);
  // Open mouth cavity (dark, screaming)
  g.fillStyle(0x442222, 1);
  g.fillRect(cx + 13, cy + 1, 3, 1);

  // ── STOLEN CHIP in beak (the whole reason Glasgow fears these) ──
  g.fillStyle(0xddaa33, 1);
  g.fillRect(cx + 16, cy - 2, 5, 2);
  g.fillStyle(0xeebb44, 1);
  g.fillRect(cx + 16, cy - 2, 4, 1);
  // Chip grease sheen
  g.fillStyle(0xffdd66, 0.5);
  g.fillRect(cx + 17, cy - 2, 2, 1);

  // ── Legs (orange-pink, webbed feet gripping) ──
  g.fillStyle(0xdd9977, 1);
  g.fillRect(cx, cy + 4, 1, 4);
  g.fillRect(cx + 3, cy + 4, 1, 4);
  // Webbed feet — splayed toes
  g.fillStyle(0xcc8866, 1);
  g.fillRect(cx - 1, cy + 7, 3, 1);
  g.fillRect(cx + 2, cy + 7, 3, 1);
  // Tiny toe detail
  g.fillStyle(0xdd9977, 0.8);
  g.fillRect(cx - 1, cy + 8, 1, 1);
  g.fillRect(cx + 4, cy + 8, 1, 1);

  g.generateTexture('bam_seagull', s, s);
  g.destroy();
}


// === Player ===

