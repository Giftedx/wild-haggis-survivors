import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';

/**
 * `ucard_peated_oak` — a charred oak stave with a wisp of peat smoke.
 * The deep-brown stave and amber smoke thread read as "aged spirit cask"
 * at 32px. Sells "+10% damage" through the cask's transformative warmth.
 */
export function drawPeatedOak(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  cardIconBg(g, s, 0x1a0c04);

  // ── STAVE BODY — a curved barrel stave, charred dark-oak with pale end grain ──
  // Shadow outline first.
  g.lineStyle(4, 0x0c0604, 1);
  g.beginPath();
  g.moveTo(11, 6);
  g.lineTo(13, 26);
  g.strokePath();

  g.lineStyle(4, 0x0c0604, 1);
  g.beginPath();
  g.moveTo(21, 6);
  g.lineTo(19, 26);
  g.strokePath();

  // Main stave — warm dark oak.
  g.fillStyle(0x5a2c10, 1);
  g.fillRect(10, 5, 12, 22);

  // Charred centre panel — darker, angled burn marks.
  g.fillStyle(0x2a1408, 0.85);
  g.fillRect(12, 8, 8, 16);

  // Grain lines — pale wood showing through char on edges.
  g.lineStyle(1, 0xa06030, 0.5);
  for (let y = 9; y < 24; y += 3) {
    g.beginPath();
    g.moveTo(11, y);
    g.lineTo(10, y + 1);
    g.strokePath();
  }
  for (let y = 9; y < 24; y += 3) {
    g.beginPath();
    g.moveTo(21, y);
    g.lineTo(22, y + 1);
    g.strokePath();
  }

  // End-grain at top and bottom — pale cut wood.
  g.fillStyle(0xd09050, 0.9);
  g.fillRect(10, 4, 12, 2);
  g.fillStyle(0xd09050, 0.9);
  g.fillRect(10, 26, 12, 2);

  // ── HOOP — a thin iron band around the stave mid-section ──
  g.lineStyle(2, 0x282018, 1);
  g.strokeRect(10, 14, 12, 4);
  g.fillStyle(0x484030, 0.7);
  g.fillRect(10, 14, 12, 4);

  // ── PEAT SMOKE — a small amber-grey wisp curling from the top-right ──
  g.lineStyle(1.5, 0xe09040, 0.55);
  g.beginPath();
  g.moveTo(22, 7);
  g.lineTo(25, 5);
  g.strokePath();

  g.lineStyle(1, 0xe09040, 0.35);
  g.beginPath();
  g.moveTo(23, 5);
  g.lineTo(26, 3);
  g.strokePath();

  // Small amber-glow fleck at the char top — the cask still breathes.
  g.fillStyle(0xe88020, 0.6);
  g.fillCircle(16, 6, 2);
  g.fillStyle(0xffd060, 0.4);
  g.fillCircle(16, 6, 1);

  g.generateTexture('ucard_peated_oak', s, s);
  g.destroy();
}
