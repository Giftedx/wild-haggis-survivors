/**
 * `sheep` — Scottish Blackface ram gone feral. Design pivot: old
 * side-profile with tiny black head on the right dissolved into a
 * generic "woolly" at gameplay scale. New pitch — the BLACK HEAD is
 * dead-centre front-on with the cursed yellow eyes and asymmetric
 * horns framing the whole sprite. Wool body rolls out behind the
 * head as a curly halo. Thistle jammed between the horns as the
 * "Highlands" anchor so you never mistake it for a farm sheep.
 */

import Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const SHEEP_CANVAS_SIZE = 36;

export function drawSheepBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = SHEEP_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 2 + (frame.breathY ?? 0);
  const lly = frame.leftLegY ?? 0;  // front pair
  const rly = frame.rightLegY ?? 0; // back pair

  // ── Ground shadow. ──
  g.fillStyle(0x000000, 0.3);
  g.fillEllipse(cx, cy + 14, 22, 3);

  // ── Wool body — billowing ellipse behind/around the head. Dirty
  // hill-sheep off-white with darker clumps for volume. ──
  g.fillStyle(0x888878, 1);
  g.fillEllipse(cx, cy + 3, 28, 18);
  // Curly wool clumps — fat circles stacked for the bouclé read
  g.fillStyle(0xd8d8c8, 1);
  g.fillCircle(cx - 11, cy + 2, 5);
  g.fillCircle(cx + 11, cy + 2, 5);
  g.fillCircle(cx - 6, cy + 7, 5);
  g.fillCircle(cx + 6, cy + 7, 5);
  g.fillCircle(cx, cy + 9, 5);
  g.fillStyle(0xe8e8d8, 1);
  g.fillCircle(cx - 9, cy + 4, 3);
  g.fillCircle(cx + 9, cy + 4, 3);
  g.fillCircle(cx - 4, cy + 9, 3);
  g.fillCircle(cx + 4, cy + 9, 3);
  // Grubby darker clumps for texture
  g.fillStyle(0xa8a898, 0.8);
  g.fillCircle(cx - 7, cy + 5, 2);
  g.fillCircle(cx + 7, cy + 5, 2);
  g.fillCircle(cx, cy + 5, 2);

  // ── Black legs peeking out at the bottom — Blackface breed mark. ──
  // Front pair (leftLegY)
  g.fillStyle(0x000000, 1);
  g.fillRect(cx - 9, cy + 11 + lly, 2.5, 4);
  g.fillRect(cx - 3, cy + 12 + lly, 2.5, 3);
  // Back pair (rightLegY)
  g.fillRect(cx + 1, cy + 12 + rly, 2.5, 3);
  g.fillRect(cx + 7, cy + 11 + rly, 2.5, 4);
  // Hoof highlight
  g.fillStyle(0x2a2a2a, 1);
  g.fillRect(cx - 9, cy + 14 + lly, 2.5, 1);
  g.fillRect(cx + 7, cy + 14 + rly, 2.5, 1);

  // ── BLACK HEAD — dominant centre element. Front-on, slightly
  // wider than tall for the Blackface breed silhouette. ──
  g.fillStyle(0x000000, 1);
  g.fillEllipse(cx, cy - 5, 14, 12);
  g.fillStyle(0x1a1a1a, 1);
  g.fillEllipse(cx, cy - 5, 12, 10);
  // Muzzle — slightly lighter strip at the bottom of the face
  g.fillStyle(0x2a2a2a, 1);
  g.fillEllipse(cx, cy, 6, 3);
  g.fillStyle(0x3a3a3a, 0.8);
  g.fillEllipse(cx, cy + 0.5, 4, 2);

  // ── MASSIVE CURLING RAM'S HORNS — asymmetric, twisted. Left horn
  // curls tight, right horn angles outward like it grew wrong. ──
  // Left horn — classic tight curl
  g.fillStyle(0x665028, 1);
  g.fillEllipse(cx - 9, cy - 9, 7, 4);
  g.fillStyle(0x8a7038, 1);
  g.fillEllipse(cx - 9, cy - 9, 6, 3);
  // Left horn tip curling back in
  g.fillStyle(0x665028, 1);
  g.fillCircle(cx - 11, cy - 7, 2);
  g.fillStyle(0x8a7038, 1);
  g.fillCircle(cx - 11, cy - 7, 1.2);
  // Horn ridges (growth rings)
  g.fillStyle(0x4a3818, 0.8);
  g.fillRect(cx - 11, cy - 10, 0.5, 3);
  g.fillRect(cx - 9, cy - 10, 0.5, 3);
  g.fillRect(cx - 7, cy - 10, 0.5, 3);
  // Right horn — BENT WRONG, angles outward ~30° off
  g.fillStyle(0x665028, 1);
  g.fillEllipse(cx + 10, cy - 8, 7, 4);
  g.fillStyle(0x8a7038, 1);
  g.fillEllipse(cx + 10, cy - 8, 6, 3);
  // Right horn tip — points outward, not curled
  g.fillStyle(0x665028, 1);
  g.fillTriangle(cx + 12, cy - 10, cx + 15, cy - 8, cx + 12, cy - 6);
  g.fillStyle(0x8a7038, 1);
  g.fillTriangle(cx + 12, cy - 9, cx + 14, cy - 8, cx + 12, cy - 7);
  // Right horn ridges
  g.fillStyle(0x4a3818, 0.8);
  g.fillRect(cx + 8, cy - 9, 0.5, 3);
  g.fillRect(cx + 10, cy - 9, 0.5, 3);
  g.fillRect(cx + 12, cy - 9, 0.5, 3);

  // ── Ears — small black triangles poking out from under the horns. ──
  g.fillStyle(0x000000, 1);
  g.fillTriangle(cx - 7, cy - 5, cx - 9, cy - 2, cx - 5, cy - 2);
  g.fillTriangle(cx + 7, cy - 5, cx + 9, cy - 2, cx + 5, cy - 2);

  // ── CURSED YELLOW-GREEN EYES — the anchor that says "wrong".
  // Big, with horizontal goat-pupils. ──
  g.fillStyle(0xccff00, 1);
  g.fillEllipse(cx - 3, cy - 5, 2.5, 2);
  g.fillEllipse(cx + 3, cy - 5, 2.5, 2);
  // Goat-rectangle pupils (they look demonic)
  g.fillStyle(0x000000, 1);
  g.fillRect(cx - 3.8, cy - 5, 1.6, 0.8);
  g.fillRect(cx + 2.2, cy - 5, 1.6, 0.8);
  // Bright highlight dot
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx - 3.5, cy - 5.3, 0.3);
  g.fillCircle(cx + 2.5, cy - 5.3, 0.3);

  // ── Manic grin showing teeth — a sheep should not smile. ──
  g.fillStyle(0x3a1a1a, 1);
  g.fillRect(cx - 2.5, cy + 1, 5, 1.5);
  g.fillStyle(0xeeeeee, 1);
  g.fillRect(cx - 2, cy + 1, 0.8, 1.2);
  g.fillRect(cx - 0.5, cy + 1.3, 0.8, 1);
  g.fillRect(cx + 1, cy + 1, 0.8, 1.2);

  // ── THISTLE wedged between the horns — unmistakable Scotland mark. ──
  g.fillStyle(0x336622, 1);
  g.fillRect(cx - 0.5, cy - 14, 1, 3);
  g.fillStyle(0x9966cc, 1);
  g.fillCircle(cx, cy - 15, 2);
  g.fillStyle(0xbb88ee, 1);
  g.fillCircle(cx, cy - 15, 1.2);
  // Thistle spikes
  g.fillStyle(0x8a5ab0, 1);
  g.fillRect(cx - 1.5, cy - 16, 0.5, 1);
  g.fillRect(cx + 1, cy - 16, 0.5, 1);
  g.fillRect(cx - 0.5, cy - 17, 0.5, 1.2);
}

export function bakeSheep(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawSheepBody(g);
  g.generateTexture('sheep', SHEEP_CANVAS_SIZE, SHEEP_CANVAS_SIZE);
  g.destroy();
}
