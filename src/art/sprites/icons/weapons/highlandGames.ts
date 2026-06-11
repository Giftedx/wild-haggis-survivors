import * as Phaser from 'phaser';

/**
 * `wicon_highland_games` — Highland Games evolution icon. Design
 * pivot (v2): prior version drew a horizontal brown rectangle with
 * flames on the right that read as "burning log" rather than
 * "hammer". The hammer shape was never a proper T. New pitch:
 * vertical HAMMER-THROW silhouette — big iron ball-head at the
 * top (the classic Highland Games hammer, an iron sphere on a
 * wooden handle) with a long stout wooden handle descending to
 * the lower corner. Flame accent is a small amber halo clinging
 * to the head — flame is telegraph, not subject. Evolution
 * amber-ring halo behind anchors the "legendary" treatment.
 */
export function drawHighlandGamesIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 16, cy = 16;

  // ── Evolution-tier amber halo — soft, pushed BEHIND the hammer
  // so the silhouette reads first. ──
  g.fillStyle(0xaa4400, 0.2);
  g.fillCircle(cx, cy, 15);
  g.fillStyle(0xcc6600, 0.22);
  g.fillCircle(cx, cy, 12);
  g.fillStyle(0xff8822, 0.2);
  g.fillCircle(cx, cy, 9);

  // ── HAMMER HANDLE — long wooden pole angled from lower-left to
  // the hammer head at upper-right. Drawn FIRST so the head sits
  // on top of it. Diagonal gives energy. ──
  // Dark outline
  g.fillStyle(0x1a0e00, 1);
  g.fillTriangle(4, 28, 8, 28, 21, 10);
  g.fillTriangle(4, 28, 17, 10, 21, 10);
  // Wood body
  g.fillStyle(0x5a3608, 1);
  g.fillTriangle(5, 27, 7, 27, 20.5, 11);
  g.fillTriangle(5, 27, 18, 11, 20.5, 11);
  // Wood highlight strip (upper-left edge catches light)
  g.fillStyle(0x8a5a18, 1);
  g.fillTriangle(5, 27, 6, 27, 19, 11);
  g.fillTriangle(5, 27, 18, 11, 19, 11);
  // Grain bands — 3 dark rings along the handle
  g.fillStyle(0x2a1604, 1);
  g.fillCircle(9, 24, 1);
  g.fillCircle(13, 20, 1);
  g.fillCircle(17, 15, 1);

  // ── Grip wrap at the butt end — dark leather binding. ──
  g.fillStyle(0x1a0604, 1);
  g.fillCircle(5, 27, 2);
  g.fillStyle(0x2a1a08, 1);
  g.fillCircle(5, 27, 1.5);
  // Leather band stitches
  g.fillStyle(0x8a5820, 0.8);
  g.fillRect(4, 26, 3, 0.3);
  g.fillRect(4, 27.5, 3, 0.3);

  // ── HAMMER HEAD — big dark iron sphere at the top-right. This is
  // the silhouette anchor. 8px radius so it dominates. ──
  // Dark outer shadow
  g.fillStyle(0x000000, 1);
  g.fillCircle(23, 9, 8);
  // Iron body
  g.fillStyle(0x2a2a2a, 1);
  g.fillCircle(23, 9, 7);
  // Mid-grey shading
  g.fillStyle(0x4a4a4a, 1);
  g.fillCircle(22, 8, 5.5);
  // Upper-left specular highlight
  g.fillStyle(0x7a7a7a, 1);
  g.fillCircle(21, 7, 3.5);
  // Bright spot — top-left shine
  g.fillStyle(0xaaaaaa, 1);
  g.fillCircle(20, 6, 1.8);
  // Brightest highlight pinpoint
  g.fillStyle(0xddddee, 1);
  g.fillCircle(19.5, 5.5, 0.8);

  // ── IRON BAND at the handle-head junction — classic hammer
  // detail. Reinforcing collar. ──
  g.fillStyle(0x1a1a1a, 1);
  g.fillTriangle(16, 16, 22, 10, 24, 14);
  g.fillTriangle(16, 16, 18, 18, 24, 14);
  g.fillStyle(0x5a5a5a, 1);
  g.fillTriangle(17, 15.5, 21.5, 11, 23, 14);

  // ── FLAME accent — small amber tongues clinging to the back-
  // upper side of the head. Telegraph only; doesn't overwhelm. ──
  g.fillStyle(0xcc3300, 0.85);
  g.fillCircle(27, 4, 2.5);
  g.fillCircle(29, 7, 1.8);
  g.fillStyle(0xff6020, 1);
  g.fillCircle(27, 4.5, 1.8);
  g.fillCircle(29, 7, 1.2);
  g.fillStyle(0xffaa22, 1);
  g.fillCircle(27, 5, 1);
  g.fillCircle(29, 7.2, 0.6);
  // Flame tip
  g.fillStyle(0xffee66, 0.9);
  g.fillTriangle(27, 2, 28.5, 5, 25.5, 5);

  // ── Ember sparks drifting above the flame. ──
  g.fillStyle(0xff8822, 1);
  g.fillCircle(26, 1, 0.6);
  g.fillStyle(0xffcc44, 0.9);
  g.fillCircle(30, 3, 0.5);

  g.generateTexture('wicon_highland_games', s, s);
  g.destroy();
}
