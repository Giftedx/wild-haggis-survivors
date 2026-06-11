/**
 * `midgie_swarm` — Scottish biting midge cloud. Design pivot (v3):
 * the v2 four-lead-midges approach read as an octopus-with-
 * tentacles at 4× zoom. Real midge swarms don't have distinct
 * individuals — they're a BLACK PEPPER BOTHER of tiny dots with a
 * dense angry core. New pitch: 30+ pinprick midge dots clustered
 * around a dense black core with angry RED PINPRICK EYES
 * throughout. No individual silhouettes, no tentacles — just a
 * living haze that reads "insect plague" at all scales.
 */

import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const MIDGIE_SWARM_CANVAS_SIZE = 26;

export function drawMidgieSwarmBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = MIDGIE_SWARM_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + (frame.breathY ?? 0);

  // ── Outer sparse haze — softened so the cluster reads as MANY
  // small bugs, not a single portal-ring. ──
  g.fillStyle(0x1a0a1a, 0.14);
  g.fillEllipse(cx - 1, cy, 23, 18);
  g.fillStyle(0x26112c, 0.20);
  g.fillEllipse(cx + 1, cy, 16, 13);
  g.fillStyle(0x3a2748, 0.16);
  g.fillEllipse(cx - 5, cy + 2, 9, 5);
  // Comma-shaped drift tail on the left breaks the portal read and
  // sells the swarm being blown across the moor by wind.
  g.fillStyle(0x2a1834, 0.18);
  g.fillEllipse(cx - 8, cy + 3, 10, 4);
  g.fillStyle(0x514168, 0.13);
  g.fillEllipse(cx - 11, cy + 4, 6, 2.4);

  // ── Dense BLACK core — the angry heart of the swarm. Irregular
  // shape, not a clean circle. Slightly trimmed so the mini-midge
  // silhouettes around it can do the "many bugs" lifting. ──
  g.fillStyle(0x0a040a, 0.85);
  g.fillCircle(cx - 2, cy, 4.8);
  g.fillCircle(cx + 2, cy - 1, 4.4);
  g.fillCircle(cx, cy + 2, 3.9);
  g.fillStyle(0x1a0614, 1);
  g.fillCircle(cx, cy, 3.0);

  // ── 38 PINPRICK MIDGE DOTS — scattered through and around the
  // core. Small, dark, merging into the haze but countable. ──
  const dots: [number, number, number][] = [
    // Inner dense cluster
    [-2, -1, 0.7], [1, -2, 0.7], [-1, 1, 0.7], [2, 1, 0.7],
    [0, -3, 0.6], [3, -1, 0.6], [-3, 0, 0.6], [1, 3, 0.6],
    [-2, 2, 0.5], [3, 2, 0.5], [-1, -3, 0.5],
    // Middle ring
    [-5, -2, 0.5], [4, -3, 0.5], [-4, 3, 0.5], [5, 2, 0.5],
    [2, -5, 0.5], [-3, -4, 0.5], [4, 4, 0.4], [-2, 5, 0.4],
    [-5, 1, 0.4], [6, 0, 0.4],
    // Outer stragglers
    [-7, -1, 0.4], [7, -2, 0.4], [-6, 4, 0.4], [6, 4, 0.4],
    [1, -7, 0.4], [-1, 7, 0.4], [8, 2, 0.35], [-8, 2, 0.35],
    [3, 7, 0.35], [-3, -6, 0.35],
    [-10, 4, 0.35], [-11, 2, 0.3], [-9, 6, 0.3], [10, -4, 0.35],
    [9, -6, 0.3], [11, -1, 0.3], [-7, -5, 0.35], [7, 6, 0.35],
  ];
  g.fillStyle(0x0a040a, 1);
  for (const [dx, dy, r] of dots) {
    g.fillCircle(cx + dx, cy + dy, r);
  }

  // ── ANGRY RED EYES — bright pinpricks scattered through the
  // cloud. Not attached to any individual — they're the signature
  // "something in the cloud is watching you" tell. ──
  const eyes: [number, number, number][] = [
    [-1, -1, 0.5],
    [1, 0, 0.5],
    [-2, 1, 0.4],
    [0, 2, 0.4],
    [3, -1, 0.4],
    [-3, -1, 0.4],
    [2, 2, 0.35],
    [-1, -3, 0.35],
    [4, 1, 0.3],
    [-4, 0, 0.3],
    [0, -4, 0.3],
    [1, 4, 0.3],
  ];
  g.fillStyle(0xff2233, 1);
  for (const [dx, dy, r] of eyes) {
    g.fillCircle(cx + dx, cy + dy, r);
  }

  // ── Brightest central glow — where the densest cluster of eyes
  // reads as "face of the swarm". ──
  g.fillStyle(0xff6677, 0.8);
  g.fillCircle(cx, cy, 1);
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(cx, cy, 0.4);

  // ── MINI-MIDGE SILHOUETTES — seven readable bugs scattered
  // through the cluster so the swarm reads as MANY discrete insects
  // rather than abstract haze. Each: tiny body + faint wing-smear. ──
  type MiniMidge = { x: number; y: number; flip: number };
  const minis: MiniMidge[] = [
    { x: -6, y: -3, flip: 1 },
    { x: 5, y: 4, flip: -1 },
    { x: -3, y: 6, flip: 1 },
    { x: 7, y: -3, flip: -1 },
    { x: -9, y: 3, flip: 1 },
    { x: 9, y: 1, flip: -1 },
    { x: 2, y: -7, flip: -1 },
  ];
  for (const m of minis) {
    const mx = cx + m.x;
    const my = cy + m.y;
    // Wing-smear (pale, behind body)
    g.fillStyle(0xcfe4f2, 0.55);
    g.fillEllipse(mx - 1.2 * m.flip, my - 0.8, 3, 1.2);
    g.fillEllipse(mx + 1.2 * m.flip, my - 0.8, 3, 1.2);
    // Body — dark pinprick ellipse
    g.fillStyle(0x05050c, 1);
    g.fillEllipse(mx, my, 2.2, 1.4);
    // Red eye dot
    g.fillStyle(0xff2233, 1);
    g.fillCircle(mx + 0.4 * m.flip, my - 0.2, 0.4);
  }

  // ── Pale wing glints and motion wisps at the edges — reduced
  // count so they accent the mini-midges rather than masking them. ──
  g.fillStyle(0xcfe4f2, 0.4);
  g.fillRect(cx - 10, cy - 4, 2, 0.5);
  g.fillRect(cx + 7, cy - 5, 2, 0.5);
  g.fillRect(cx - 12, cy + 4, 2, 0.5);
  g.fillRect(cx + 9, cy + 5, 2, 0.5);
  g.fillStyle(0x4a345a, 0.45);
  g.fillCircle(cx - 10, cy - 3, 0.7);
  g.fillCircle(cx + 10, cy - 2, 0.7);
  g.fillStyle(0xffb0ba, 0.45);
  g.fillCircle(cx - 7, cy + 5, 0.55);
  g.fillCircle(cx + 6, cy - 6, 0.5);
}

export function bakeMidgieSwarm(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawMidgieSwarmBody(g);
  g.generateTexture('midgie_swarm', MIDGIE_SWARM_CANVAS_SIZE, MIDGIE_SWARM_CANVAS_SIZE);
  g.destroy();
}
