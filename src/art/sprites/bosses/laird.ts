/**
 * `boss_laird` — Highland landowner boss: the gentry figure who'd
 * evict you for sport and shoot your haggis for fun. Anchor props:
 * deerstalker cap with twin peaks, tweed jacket + waistcoat + tie,
 * shooting-stick walking cane in one hand, side-by-side shotgun
 * slung over the shoulder, monocle, walrus moustache, sneering
 * expression. Distinct from the `laird` player-variant's cheerful
 * silhouette — this one is the stuffy absentee-landlord incarnate.
 */

import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const BOSS_LAIRD_CANVAS_SIZE = 80;

export function drawBossLairdBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = BOSS_LAIRD_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 4 + (frame.breathY ?? 0);
  const lly = frame.leftLegY ?? 0;
  const rly = frame.rightLegY ?? 0;

  // ── Ground shadow. ──
  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(cx, cy + 34, 34, 5);

  // ── Green wellies peeking below the coat. ──
  g.fillStyle(0x0a2a0a, 1);
  g.fillRect(cx - 11, cy + 26 + lly, 8, 8);
  g.fillRect(cx + 3, cy + 26 + rly, 8, 8);
  g.fillStyle(0x1a4a1a, 1);
  g.fillRect(cx - 11, cy + 26 + lly, 8, 7);
  g.fillRect(cx + 3, cy + 26 + rly, 8, 7);
  g.fillStyle(0x2a5a22, 1);
  g.fillRect(cx - 10, cy + 27 + lly, 6, 5);
  g.fillRect(cx + 4, cy + 27 + rly, 6, 5);

  // ── Tweed breeks (knee-length trousers tucked into the wellies). ──
  g.fillStyle(0x3a2a14, 1);
  g.fillRect(cx - 13, cy + 18, 26, 9);
  g.fillStyle(0x5a4428, 1);
  g.fillRect(cx - 12, cy + 19, 24, 7);
  // Tweed herringbone flecks
  g.fillStyle(0x7a6038, 0.8);
  g.fillRect(cx - 10, cy + 20, 1, 1);
  g.fillRect(cx - 6, cy + 22, 1, 1);
  g.fillRect(cx - 2, cy + 21, 1, 1);
  g.fillRect(cx + 3, cy + 23, 1, 1);
  g.fillRect(cx + 7, cy + 21, 1, 1);
  g.fillRect(cx + 10, cy + 24, 1, 1);

  // ── Tweed jacket body — dominant silhouette piece. ──
  g.fillStyle(0x2a1f10, 1);
  g.fillRect(cx - 18, cy - 4, 36, 26);
  g.fillStyle(0x4a3820, 1);
  g.fillRect(cx - 17, cy - 3, 34, 24);
  // Tweed sheen
  g.fillStyle(0x6a5034, 0.6);
  g.fillRect(cx - 14, cy - 1, 8, 18);
  // Herringbone flecks scattered across the coat
  g.fillStyle(0x8a6e48, 0.85);
  g.fillRect(cx - 14, cy + 2, 1, 1);
  g.fillRect(cx - 10, cy + 4, 1, 1);
  g.fillRect(cx - 5, cy + 2, 1, 1);
  g.fillRect(cx + 2, cy + 5, 1, 1);
  g.fillRect(cx + 8, cy + 3, 1, 1);
  g.fillRect(cx + 12, cy + 7, 1, 1);
  g.fillRect(cx - 8, cy + 10, 1, 1);
  g.fillRect(cx + 5, cy + 12, 1, 1);
  g.fillRect(cx - 3, cy + 15, 1, 1);
  g.fillRect(cx + 9, cy + 16, 1, 1);

  // ── Tweed waistcoat visible down the centre. ──
  g.fillStyle(0x5a4028, 1);
  g.fillRect(cx - 6, cy - 2, 12, 18);
  g.fillStyle(0x7a5a38, 1);
  g.fillRect(cx - 5, cy - 1, 10, 16);
  // Waistcoat buttons — five gold dots down the centre
  g.fillStyle(0xd8a848, 1);
  for (let i = 0; i < 5; i++) g.fillCircle(cx, cy + i * 3.5, 0.8);
  // Gold pocket-watch chain — arcs across the waistcoat
  g.lineStyle(1, 0xd8a848, 1);
  g.beginPath();
  g.arc(cx + 3, cy + 4, 4, -Math.PI * 0.8, -Math.PI * 0.2);
  g.strokePath();

  // ── Red paisley necktie. ──
  g.fillStyle(0x8a1818, 1);
  g.fillTriangle(cx - 2, cy - 4, cx + 2, cy - 4, cx, cy + 4);
  g.fillStyle(0xaa2828, 1);
  g.fillTriangle(cx - 1.5, cy - 4, cx + 1.5, cy - 4, cx, cy + 3);
  // Tie pin gold
  g.fillStyle(0xd8a848, 1);
  g.fillCircle(cx, cy - 2, 0.6);

  // ── White shirt collar points. ──
  g.fillStyle(0xf0ece0, 1);
  g.fillRect(cx - 4, cy - 6, 3, 3);
  g.fillRect(cx + 1, cy - 6, 3, 3);

  // ── Face — ruddy aristocratic complexion. ──
  g.fillStyle(0x8a4a28, 1);
  g.fillCircle(cx, cy - 10, 11);
  g.fillStyle(0xe8b088, 1);
  g.fillCircle(cx, cy - 10, 10);
  // Broken veins on the nose/cheeks (gin + whisky)
  g.fillStyle(0xc86a4a, 0.6);
  g.fillCircle(cx - 3, cy - 8, 2);
  g.fillCircle(cx + 3, cy - 8, 2);
  g.fillStyle(0xcc4a38, 0.5);
  g.fillRect(cx - 1, cy - 9, 2, 2);

  // ── Monocle on right eye. ──
  g.lineStyle(1.5, 0xd8a848, 1);
  g.strokeCircle(cx + 4, cy - 12, 3.5);
  g.fillStyle(0xaaddff, 0.25);
  g.fillCircle(cx + 4, cy - 12, 3);
  g.lineStyle(0.8, 0xd8a848, 0.7);
  g.lineBetween(cx + 7, cy - 11, cx + 11, cy - 5);

  // ── Sneering eyes. ──
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 4, cy - 12, 2);
  g.fillCircle(cx + 4, cy - 12, 2);
  g.fillStyle(0x224488, 1);
  g.fillCircle(cx - 4, cy - 12, 1);
  g.fillCircle(cx + 4, cy - 12, 1);
  g.fillStyle(0x000000, 1);
  g.fillCircle(cx - 4, cy - 12, 0.5);
  g.fillCircle(cx + 4, cy - 12, 0.5);
  // Heavy contemptuous eyelids
  g.fillStyle(0xc89060, 1);
  g.fillRect(cx - 7, cy - 14, 6, 2);
  g.fillRect(cx + 1, cy - 14, 6, 2);
  // Thick eyebrows
  g.fillStyle(0x3a2010, 1);
  g.fillRect(cx - 7, cy - 15, 6, 1.2);
  g.fillRect(cx + 1, cy - 15, 6, 1.2);

  // ── Walrus moustache. ──
  g.fillStyle(0x888888, 1);
  g.fillRect(cx - 8, cy - 7, 16, 3);
  g.fillStyle(0xbababa, 1);
  g.fillRect(cx - 7, cy - 7, 14, 2);
  // Moustache drooping ends
  g.fillStyle(0x888888, 1);
  g.fillRect(cx - 8, cy - 5, 3, 3);
  g.fillRect(cx + 6, cy - 5, 3, 3);
  // Moustache sheen
  g.fillStyle(0xdadada, 0.6);
  g.fillRect(cx - 5, cy - 7, 10, 1);

  // ── Curled-lip sneer. ──
  g.fillStyle(0xa86848, 1);
  g.fillRect(cx - 3, cy - 3, 6, 1);
  g.fillCircle(cx + 3, cy - 4, 1);

  // ── DEERSTALKER CAP. ──
  g.fillStyle(0x2a1f10, 1);
  g.fillEllipse(cx, cy - 21, 22, 7);
  g.fillStyle(0x4a3820, 1);
  g.fillEllipse(cx, cy - 22, 20, 5);
  // Front peak (visor)
  g.fillStyle(0x2a1f10, 1);
  g.fillRect(cx - 12, cy - 19, 14, 2);
  g.fillStyle(0x3a2a18, 1);
  g.fillRect(cx - 11, cy - 19, 12, 1);
  // Back peak
  g.fillStyle(0x2a1f10, 1);
  g.fillRect(cx - 2, cy - 19, 14, 2);
  // Tweed flecks on the cap
  g.fillStyle(0x8a6e48, 0.85);
  g.fillRect(cx - 6, cy - 22, 1, 1);
  g.fillRect(cx, cy - 23, 1, 1);
  g.fillRect(cx + 5, cy - 22, 1, 1);
  g.fillRect(cx - 3, cy - 21, 1, 1);
  g.fillRect(cx + 3, cy - 21, 1, 1);
  // Ear flaps tied up on top — ribbons
  g.fillStyle(0x5a4028, 1);
  g.fillRect(cx - 4, cy - 26, 2, 3);
  g.fillRect(cx + 2, cy - 26, 2, 3);

  // ── Signet ring on pudgy right hand. ──
  g.fillStyle(0xd8a848, 1);
  g.fillCircle(cx + 18, cy + 10, 1.8);
  g.fillStyle(0xfadc6a, 1);
  g.fillCircle(cx + 18, cy + 10, 1);
  g.fillStyle(0x1a0a10, 1);
  g.fillRect(cx + 18, cy + 10, 1, 1);

  // ── Shooting-stick walking cane on the LEFT. ──
  g.fillStyle(0x3a1a08, 1);
  g.fillRect(cx - 24, cy - 4, 2, 24);
  g.fillStyle(0x6a3818, 1);
  g.fillRect(cx - 23.5, cy - 4, 1, 24);
  // Silver handle — curved top
  g.fillStyle(0xc8c8d0, 1);
  g.fillRect(cx - 26, cy - 5, 5, 2);
  g.fillRect(cx - 26, cy - 3, 2, 2);
  g.fillStyle(0xe8e8f0, 1);
  g.fillRect(cx - 26, cy - 5, 5, 1);
  // Stick base (rubber ferrule)
  g.fillStyle(0x0a0a08, 1);
  g.fillRect(cx - 25, cy + 19, 4, 2);

  // ── Side-by-side shotgun slung over the RIGHT shoulder. ──
  g.fillStyle(0x3a1a08, 1);
  g.fillRect(cx + 16, cy + 2, 6, 9);
  g.fillStyle(0x6a3820, 1);
  g.fillRect(cx + 16, cy + 2, 5, 8);
  g.fillStyle(0x8a5028, 0.7);
  g.fillRect(cx + 17, cy + 3, 3, 4);
  // Gun action/receiver
  g.fillStyle(0x1a1a22, 1);
  g.fillRect(cx + 18, cy - 2, 6, 4);
  // Side-by-side barrels
  g.fillStyle(0x0a0a14, 1);
  g.fillRect(cx + 20, cy - 16, 3, 16);
  g.fillStyle(0x2a2a34, 1);
  g.fillRect(cx + 20, cy - 16, 2, 16);
  g.fillRect(cx + 23, cy - 16, 0.8, 16);
  // Barrel-tip highlight
  g.fillStyle(0x6a6a74, 0.8);
  g.fillRect(cx + 20, cy - 16, 3, 1);
}

export function bakeBossLaird(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawBossLairdBody(g);
  g.generateTexture('boss_laird', BOSS_LAIRD_CANVAS_SIZE, BOSS_LAIRD_CANVAS_SIZE);
  g.destroy();
}
