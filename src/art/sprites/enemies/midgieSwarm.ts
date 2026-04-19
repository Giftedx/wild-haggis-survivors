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

import Phaser from 'phaser';

export function bakeMidgieSwarm(scene: Phaser.Scene): void {
  const s = 26;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;

  // ── Outer sparse haze — faint purple-grey. ──
  g.fillStyle(0x1a0a1a, 0.2);
  g.fillCircle(cx, cy, 12);
  g.fillStyle(0x1a0a1a, 0.35);
  g.fillCircle(cx, cy, 10);

  // ── Dense BLACK core — the angry heart of the swarm. Irregular
  // shape, not a clean circle. ──
  g.fillStyle(0x0a040a, 0.85);
  g.fillCircle(cx - 1, cy, 6);
  g.fillCircle(cx + 2, cy - 1, 5);
  g.fillCircle(cx, cy + 2, 5);
  g.fillStyle(0x1a0614, 1);
  g.fillCircle(cx, cy, 4);

  // ── 30 PINPRICK MIDGE DOTS — scattered through and around the
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

  // ── Faint motion wisps at the edges — swarm is alive, moving. ──
  g.fillStyle(0x332244, 0.4);
  g.fillCircle(cx - 9, cy - 3, 0.8);
  g.fillCircle(cx + 9, cy - 2, 0.8);
  g.fillCircle(cx - 4, cy + 8, 0.7);
  g.fillCircle(cx + 5, cy + 8, 0.7);

  g.generateTexture('midgie_swarm', s, s);
  g.destroy();
}
