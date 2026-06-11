/**
 * `bodach_glas` — the Grey Old Man of Ben Macdui. Cairngorm winter
 * folk-presence (SCOTTISH_RESEARCH §1.2): a tall grey-cloaked figure
 * who paces behind Highland climbers in silence. Some have turned
 * to find naebody; some havenae come back at all.
 *
 * Design pivot: this sprite is read at MID-SCREEN distance per
 * charter §4.4, not portrait-close like most enemies. So it leans
 * silhouette-first — towering vertical, hunched shoulder line, faint
 * frost-dust on the cloak's wind-side, a single faint gleam where
 * eyes should sit. The mask is implied (you cannae quite see his
 * face); the dread is what fills in the gap.
 *
 * Anchors that keep him distinct from `ghost`:
 *  - Vertical posture (cloaked, walks; ghost drifts/floats)
 *  - Grey palette only — no tartan, no warm tones, no pearls
 *  - Visible legs from cloak hem (he WALKS — that's the threat)
 *  - Single staff/cane for balance on the high tops
 */

import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const BODACH_GLAS_CANVAS_SIZE = 44;

export function drawBodachGlasBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = BODACH_GLAS_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + (frame.breathY ?? 0);

  // ── Faint cold halo behind the figure — the haar that follows him.
  // Two layered ellipses, very pale. ──
  g.fillStyle(0x8a92a0, 0.18);
  g.fillEllipse(cx, cy, 28, 36);
  g.fillStyle(0xa8b0bc, 0.22);
  g.fillEllipse(cx, cy, 22, 30);

  // ── Cloak — full-length, charcoal grey with pale hood. The
  // silhouette is the read; the cloak does the heavy work. ──
  // Outer dark cloak (back panel)
  g.fillStyle(0x282c34, 1);
  g.fillTriangle(cx - 11, cy + 18, cx + 11, cy + 18, cx + 7, cy - 14);
  g.fillTriangle(cx - 11, cy + 18, cx - 7, cy - 14, cx + 7, cy - 14);
  // Mid cloak tone — slight asymmetry (left side catches more light)
  g.fillStyle(0x4a4e58, 1);
  g.fillTriangle(cx - 9, cy + 17, cx + 9, cy + 17, cx + 6, cy - 13);
  g.fillTriangle(cx - 9, cy + 17, cx - 6, cy - 13, cx + 6, cy - 13);
  // Lit cloak side — cool grey, slight blue undertone (cold light)
  g.fillStyle(0x6a7080, 0.85);
  g.fillTriangle(cx - 6, cy + 16, cx + 1, cy + 16, cx, cy - 12);
  g.fillTriangle(cx - 6, cy + 16, cx - 5, cy - 12, cx, cy - 12);

  // Vertical fold lines (the cloak weight reads heavy)
  g.fillStyle(0x1a1c20, 0.85);
  g.fillRect(cx - 4, cy - 8, 0.6, 22);
  g.fillRect(cx + 2.5, cy - 6, 0.6, 21);
  g.fillStyle(0x4a4e58, 0.7);
  g.fillRect(cx - 1, cy - 10, 0.5, 24);

  // ── Hem at bottom — uneven, slightly tattered (he's been walking
  // long enough). Three different lengths. ──
  g.fillStyle(0x1a1c20, 1);
  g.fillTriangle(cx - 11, cy + 17, cx - 9, cy + 17, cx - 10, cy + 20);
  g.fillTriangle(cx - 4, cy + 18, cx - 2, cy + 18, cx - 3, cy + 21);
  g.fillTriangle(cx + 3, cy + 17, cx + 5, cy + 17, cx + 4, cy + 19);
  g.fillTriangle(cx + 8, cy + 17, cx + 10, cy + 17, cx + 9, cy + 20);

  // ── VISIBLE LEGS — the threat is that he WALKS. Two thin grey
  // shins peeking from the cloak hem. Stride offsets applied so the
  // AnimationController can drive the walking cycle. ──
  const leftY = frame.leftLegY ?? 0;
  const rightY = frame.rightLegY ?? 0;
  g.fillStyle(0x3a3e48, 1);
  g.fillRect(cx - 3, cy + 15 + leftY, 1.5, 5);
  g.fillRect(cx + 1.5, cy + 15 + rightY, 1.5, 5);
  // Boot tips track the shin position.
  g.fillStyle(0x1a1c20, 1);
  g.fillRect(cx - 3.2, cy + 19 + leftY, 2, 1.5);
  g.fillRect(cx + 1.3, cy + 19 + rightY, 2, 1.5);

  // ── Staff/cane — slim wooden staff at right side, Highland
  // climber's tool. Vertical line just outside the cloak edge. ──
  g.fillStyle(0x2a1a08, 1);
  g.fillRect(cx + 11, cy - 14, 1.2, 32);
  // Staff knob at top
  g.fillStyle(0x4a3018, 1);
  g.fillCircle(cx + 11.6, cy - 14, 1.4);
  g.fillStyle(0x6a4a28, 0.95);
  g.fillCircle(cx + 11.4, cy - 14.5, 0.8);
  // Frost rime on the staff (sells cold)
  g.fillStyle(0xeef2f8, 0.7);
  g.fillRect(cx + 11.5, cy - 12, 0.4, 6);
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(cx + 11.7, cy - 11, 0.3);

  // ── Hood — pulled forward, cowl shadow within. Pale grey edge,
  // deep black hollow where the face should be. ──
  // Hood outer (lighter than cloak so head reads against shoulders)
  g.fillStyle(0x4a4e58, 1);
  g.fillEllipse(cx, cy - 12, 11, 9);
  g.fillStyle(0x5a5e68, 1);
  g.fillEllipse(cx, cy - 12.5, 9, 7);
  // Cowl rim — pale highlight where light catches the fabric edge
  g.fillStyle(0x8a92a0, 0.85);
  g.fillEllipse(cx, cy - 14, 7.5, 2);
  g.fillStyle(0xa8b0bc, 0.75);
  g.fillEllipse(cx - 1, cy - 14.5, 5, 1);

  // ── Hood interior — blackness where the face is. The implied
  // mask: you cannot see who is in there. The dread does the rest. ──
  g.fillStyle(0x080808, 1);
  g.fillEllipse(cx, cy - 11, 7, 5);
  g.fillStyle(0x000000, 1);
  g.fillEllipse(cx, cy - 11, 5.5, 4);

  // ── Single faint cold gleam — a single glint where the right eye
  // should sit. Not two. The asymmetry is the unsettling tell. ──
  g.fillStyle(0xc0d0e0, 0.65);
  g.fillCircle(cx + 1, cy - 11, 0.7);
  g.fillStyle(0xeef2f8, 0.95);
  g.fillCircle(cx + 1, cy - 11, 0.35);

  // ── Frost-dust scatter on the wind-side of the cloak (left
  // shoulder) — pale white flecks on dark grey. Sells "he's been
  // walking the high tops in winter for centuries". ──
  g.fillStyle(0xeef2f8, 0.85);
  g.fillCircle(cx - 6, cy - 9, 0.5);
  g.fillCircle(cx - 5, cy - 6, 0.4);
  g.fillCircle(cx - 7, cy - 4, 0.3);
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(cx - 6, cy - 9.3, 0.25);

  // ── Faint cold breath from the hood interior — a wisp of vapour
  // hanging just below where the mouth should be. ──
  g.fillStyle(0xc0c8d4, 0.4);
  g.fillCircle(cx, cy - 7, 1.8);
  g.fillStyle(0xd8e0ee, 0.3);
  g.fillCircle(cx + 1, cy - 8.5, 1.2);

  // ── Subtle cold-blue undershadow on the ground beneath the hem
  // (mirrors rime_patch hazard treatment, ties him to the biome). ──
  g.fillStyle(0x4a6080, 0.35);
  g.fillEllipse(cx, cy + 21, 14, 1.8);
}

export function bakeBodachGlas(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawBodachGlasBody(g);
  g.generateTexture('bodach_glas', BODACH_GLAS_CANVAS_SIZE, BODACH_GLAS_CANVAS_SIZE);
  g.destroy();
}
