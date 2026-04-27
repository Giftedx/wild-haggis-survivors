/**
 * Enemy death-burst icons — three single-frame "poof" textures
 * (small/medium/large) baked at canvas sizes 24/36/56. Vampire-
 * Survivors-style kill flash dressed in Scottish fleck flavour:
 * tartan-thread spatter (red/green/gold/blue/cream pulled from
 * `docs/ART_STYLE_BIBLE.md` palette anchors), thistle silhouettes
 * on mid+large tiers, and saltire-blue glints on the boss tier.
 * Warm-edge per Soul charter — celebratory pop, never cruel. Drawn
 * with fillRect/fillCircle/fillTriangle only (no moveTo/lineTo, no
 * bare lineStyle) so the test stub is happy.
 */

import * as Phaser from 'phaser';

// Tartan palette anchors (Art Style Bible §Palette + tonal map).
const T_RED = 0xc42828;        // arterial / Scots-red
const T_GREEN = 0x3a6638;       // hunting-stewart green (muted classic)
const T_GOLD = 0xffc840;        // bright gold
const T_GOLD_AGED = 0xc8a040;   // aged gold
const T_BLUE = 0x2a4a6a;        // deep loch
const T_BLUE_BRIGHT = 0x4a7eb8; // saltire-cue blue
const T_CREAM = 0xf4ead0;       // pale cream weft
const T_THISTLE = 0x9070b0;     // mid heather
const T_AMBER = 0xff9a3c;       // hearth amber
const T_CORE_HOT = 0xfff4d8;    // bright core

export function bakeFxEnemyBurstSmall(scene: Phaser.Scene): void {
  const size = 24;
  const g = scene.add.graphics();
  const cx = size / 2;
  const cy = size / 2;

  // ── EXPANDING RING — soft warm halo: outer cool-cream tint into
  // an amber mid-ring. Sells the kinetic "outward shove" of a kill
  // even as a single frame. ──
  g.fillStyle(T_AMBER, 0.18);
  g.fillCircle(cx, cy, 10);
  g.fillStyle(T_AMBER, 0.30);
  g.fillCircle(cx, cy, 8);
  g.fillStyle(T_GOLD, 0.42);
  g.fillCircle(cx, cy, 6);

  // ── CREAM CORE — bright pip carries the "silhouette punch".
  // Slightly off-centre to keep the burst from feeling stamped. ──
  g.fillStyle(T_CREAM, 0.95);
  g.fillCircle(cx + 0.3, cy - 0.2, 3.2);
  g.fillStyle(T_CORE_HOT, 1);
  g.fillCircle(cx + 0.3, cy - 0.2, 1.6);

  // ── 4 RADIAL WISPS — short amber spokes (N/E/S/W, jittered).
  // Soft alpha so they read as "smoke streaks" not lasers. ──
  g.fillStyle(T_AMBER, 0.7);
  g.fillRect(cx - 0.5, cy - 9, 1, 3);     // up
  g.fillRect(cx + 6, cy - 0.5, 3, 1);     // right
  g.fillRect(cx - 0.5, cy + 6.5, 1, 2.5); // down
  g.fillRect(cx - 8.5, cy + 0.3, 2.5, 1); // left (slight offset)

  // ── 5 TARTAN FLECKS — 2 red + 2 green + 1 gold, scattered
  // asymmetrically (deliberate: avoids the rosette-perfect look).
  // Tiny 1.4px squares so they read as "thread-shrapnel". ──
  g.fillStyle(T_RED, 1);
  g.fillRect(cx - 5.2, cy - 6.4, 1.4, 1.4);
  g.fillRect(cx + 4.8, cy + 3.6, 1.4, 1.4);
  g.fillStyle(T_GREEN, 1);
  g.fillRect(cx + 5.4, cy - 4.8, 1.4, 1.4);
  g.fillRect(cx - 6.0, cy + 4.2, 1.4, 1.4);
  g.fillStyle(T_GOLD, 1);
  g.fillRect(cx - 1.2, cy + 7.4, 1.4, 1.4);

  // ── CENTRE SPARK — pure-white pinprick over the core. ──
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx - 0.4, cy - 0.7, 1, 1);

  g.generateTexture('fx_enemy_burst_small', size, size);
  g.destroy();
}

export function bakeFxEnemyBurstMedium(scene: Phaser.Scene): void {
  const size = 36;
  const g = scene.add.graphics();
  const cx = size / 2;
  const cy = size / 2;

  // ── LAYERED EXPLOSION — outer cool aura → warm orange → cream
  // core. Three concentric layers give the burst depth the small
  // tier can't carry. ──
  g.fillStyle(T_BLUE, 0.18);
  g.fillCircle(cx, cy, 16);
  g.fillStyle(T_AMBER, 0.28);
  g.fillCircle(cx, cy, 13);
  g.fillStyle(T_GOLD, 0.48);
  g.fillCircle(cx, cy, 10);
  g.fillStyle(T_CREAM, 0.90);
  g.fillCircle(cx + 0.4, cy - 0.3, 5.4);
  g.fillStyle(T_CORE_HOT, 1);
  g.fillCircle(cx + 0.4, cy - 0.3, 2.6);

  // ── 6 RADIAL MOTION SPOKES — primary cardinals long, diagonals
  // shorter. Amber bleeds into gold tips for that warm streak. ──
  g.fillStyle(T_AMBER, 0.78);
  g.fillRect(cx - 0.6, cy - 15, 1.2, 5);   // N
  g.fillRect(cx + 10, cy - 0.6, 5, 1.2);   // E
  g.fillRect(cx - 0.6, cy + 10, 1.2, 5);   // S
  g.fillRect(cx - 15, cy - 0.6, 5, 1.2);   // W
  // Diagonals, shorter (NE + SW only — asymmetric on purpose).
  g.fillStyle(T_GOLD_AGED, 0.7);
  g.fillRect(cx + 7.4, cy - 8.2, 1.2, 1.2);
  g.fillRect(cx + 8.6, cy - 9.4, 1.2, 1.2);
  g.fillRect(cx - 8.4, cy + 7.2, 1.2, 1.2);
  g.fillRect(cx - 9.6, cy + 8.4, 1.2, 1.2);

  // ── 8 TARTAN FLECKS — mixed red/green/gold/blue/cream, scattered
  // with deliberate clumping (3 in upper-right quadrant, 2 in lower-
  // left, 3 spread elsewhere). Avoids the rosette look. ──
  g.fillStyle(T_RED, 1);
  g.fillRect(cx + 6.2, cy - 9.6, 1.6, 1.6);
  g.fillRect(cx - 8.0, cy + 5.8, 1.6, 1.6);
  g.fillStyle(T_GREEN, 1);
  g.fillRect(cx + 9.4, cy - 5.4, 1.6, 1.6);
  g.fillRect(cx - 5.4, cy - 9.0, 1.6, 1.6);
  g.fillStyle(T_GOLD, 1);
  g.fillRect(cx + 7.6, cy - 3.2, 1.6, 1.6);
  g.fillRect(cx - 9.2, cy - 2.4, 1.6, 1.6);
  g.fillStyle(T_BLUE_BRIGHT, 1);
  g.fillRect(cx + 2.4, cy + 9.6, 1.6, 1.6);
  g.fillStyle(T_CREAM, 1);
  g.fillRect(cx - 2.6, cy + 11.0, 1.4, 1.4);

  // ── 2 THISTLE SILHOUETTES — small heather-purple pips off-centre,
  // each a 3-dot bloom + 1px stem. Cultural anchor without bloat. ──
  g.fillStyle(T_THISTLE, 0.85);
  // Thistle 1 — upper-left
  g.fillCircle(cx - 11.4, cy - 6.6, 1.0);
  g.fillCircle(cx - 12.4, cy - 5.8, 0.9);
  g.fillCircle(cx - 10.4, cy - 5.8, 0.9);
  g.fillStyle(T_GREEN, 0.9);
  g.fillRect(cx - 11.6, cy - 4.8, 0.6, 2.2);
  // Thistle 2 — lower-right
  g.fillStyle(T_THISTLE, 0.85);
  g.fillCircle(cx + 10.6, cy + 7.4, 1.0);
  g.fillCircle(cx + 11.6, cy + 8.4, 0.9);
  g.fillCircle(cx + 9.6, cy + 8.4, 0.9);
  g.fillStyle(T_GREEN, 0.9);
  g.fillRect(cx + 10.4, cy + 9.4, 0.6, 2.0);

  // ── CENTRE SPARK — pure-white 2px pinprick. ──
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx - 0.6, cy - 1, 1.2, 2);
  g.fillRect(cx - 1, cy - 0.6, 2, 1.2);

  g.generateTexture('fx_enemy_burst_medium', size, size);
  g.destroy();
}

export function bakeFxEnemyBurstLarge(scene: Phaser.Scene): void {
  const size = 56;
  const g = scene.add.graphics();
  const cx = size / 2;
  const cy = size / 2;

  // ── BOSS-TIER RADIAL — cool blue rim → big amber halo → warm
  // gold core. Four layers because the boss death needs to *land*. ──
  g.fillStyle(T_BLUE, 0.18);
  g.fillCircle(cx, cy, 26);
  g.fillStyle(T_BLUE_BRIGHT, 0.22);
  g.fillCircle(cx, cy, 22);
  g.fillStyle(T_AMBER, 0.32);
  g.fillCircle(cx, cy, 18);
  g.fillStyle(T_GOLD, 0.52);
  g.fillCircle(cx, cy, 14);
  g.fillStyle(T_GOLD_AGED, 0.85);
  g.fillCircle(cx, cy, 9);
  g.fillStyle(T_CREAM, 0.95);
  g.fillCircle(cx + 0.5, cy - 0.4, 5.5);
  g.fillStyle(T_CORE_HOT, 1);
  g.fillCircle(cx + 0.5, cy - 0.4, 2.8);

  // ── 4 CARDINAL MOTION-SPIKE STREAMERS — long amber→gold tapered
  // rectangles, brightest tip nearest the rim. Sells the explosion
  // expanding past the canvas edge. ──
  g.fillStyle(T_AMBER, 0.85);
  g.fillRect(cx - 1.2, cy - 25, 2.4, 9);    // N trunk
  g.fillRect(cx + 16, cy - 1.2, 9, 2.4);    // E trunk
  g.fillRect(cx - 1.2, cy + 16, 2.4, 9);    // S trunk
  g.fillRect(cx - 25, cy - 1.2, 9, 2.4);    // W trunk
  // Bright gold tips on each cardinal.
  g.fillStyle(T_GOLD, 1);
  g.fillRect(cx - 1, cy - 26, 2, 3);
  g.fillRect(cx + 23, cy - 1, 3, 2);
  g.fillRect(cx - 1, cy + 23, 2, 3);
  g.fillRect(cx - 26, cy - 1, 3, 2);

  // ── DIAGONAL SECONDARY SPIKES — shorter, asymmetric (3 of 4
  // diagonals — break the symmetry deliberately). ──
  g.fillStyle(T_GOLD_AGED, 0.75);
  g.fillRect(cx + 11, cy - 12, 1.6, 1.6);
  g.fillRect(cx + 13, cy - 14, 1.6, 1.6);
  g.fillRect(cx + 15, cy - 16, 1.6, 1.6);
  g.fillRect(cx - 11, cy + 12, 1.6, 1.6);
  g.fillRect(cx - 13, cy + 14, 1.6, 1.6);
  g.fillRect(cx - 15, cy + 16, 1.6, 1.6);
  g.fillRect(cx + 12, cy + 11, 1.6, 1.6);
  g.fillRect(cx + 14, cy + 13, 1.6, 1.6);

  // ── 12 TARTAN FLECKS — 8 distinct hues across the wheel. Uneven
  // angular distribution (clusters in upper-right and lower-left to
  // break radial symmetry). Sized 1.8px so they read at gameplay
  // scale where the burst is scaled up by JuiceSystem. ──
  g.fillStyle(T_RED, 1);
  g.fillRect(cx + 11.2, cy - 14.6, 1.8, 1.8);
  g.fillRect(cx - 13.4, cy + 9.8, 1.8, 1.8);
  g.fillStyle(T_GREEN, 1);
  g.fillRect(cx + 14.4, cy - 8.4, 1.8, 1.8);
  g.fillRect(cx - 9.0, cy - 14.0, 1.8, 1.8);
  g.fillRect(cx + 6.8, cy + 14.6, 1.8, 1.8);
  g.fillStyle(T_GOLD, 1);
  g.fillRect(cx + 12.6, cy - 4.2, 1.8, 1.8);
  g.fillRect(cx - 14.0, cy - 4.6, 1.8, 1.8);
  g.fillStyle(T_GOLD_AGED, 1);
  g.fillRect(cx + 4.2, cy - 16.4, 1.6, 1.6);
  g.fillStyle(T_BLUE, 1);
  g.fillRect(cx - 4.4, cy + 15.6, 1.6, 1.6);
  g.fillStyle(T_BLUE_BRIGHT, 1);
  g.fillRect(cx + 8.2, cy + 12.4, 1.6, 1.6);
  g.fillStyle(T_CREAM, 1);
  g.fillRect(cx - 16.0, cy + 3.4, 1.4, 1.4);
  g.fillStyle(T_THISTLE, 1);
  g.fillRect(cx - 11.4, cy - 11.0, 1.4, 1.4);

  // ── 3 THISTLE SILHOUETTES — heather-purple blooms with green
  // stems. Larger than mid-tier (4-dot bloom). Placed at non-axis
  // angles to keep the eye exploring the burst. ──
  // Thistle A — upper-right cluster
  g.fillStyle(T_THISTLE, 0.92);
  g.fillCircle(cx + 17.2, cy - 12.0, 1.4);
  g.fillCircle(cx + 18.6, cy - 10.8, 1.2);
  g.fillCircle(cx + 16.0, cy - 10.8, 1.2);
  g.fillCircle(cx + 17.2, cy - 9.6, 1.0);
  g.fillStyle(T_GREEN, 0.92);
  g.fillRect(cx + 17.0, cy - 8.4, 0.7, 3.0);
  // Thistle B — lower-left
  g.fillStyle(T_THISTLE, 0.92);
  g.fillCircle(cx - 16.0, cy + 11.4, 1.3);
  g.fillCircle(cx - 17.4, cy + 12.6, 1.1);
  g.fillCircle(cx - 14.6, cy + 12.6, 1.1);
  g.fillStyle(T_GREEN, 0.92);
  g.fillRect(cx - 16.2, cy + 13.6, 0.7, 2.8);
  // Thistle C — left edge, smaller
  g.fillStyle(T_THISTLE, 0.85);
  g.fillCircle(cx - 19.4, cy - 7.6, 1.1);
  g.fillCircle(cx - 20.4, cy - 6.6, 0.9);
  g.fillCircle(cx - 18.4, cy - 6.6, 0.9);
  g.fillStyle(T_GREEN, 0.85);
  g.fillRect(cx - 19.6, cy - 5.6, 0.6, 2.2);

  // ── 2 SALTIRE-BLUE GLINTS — small bright-blue diamond pips. The
  // saltire colour cue is the boss-tier Scottish anchor. ──
  g.fillStyle(T_BLUE_BRIGHT, 1);
  g.fillRect(cx + 5.4, cy - 7.6, 1.0, 1.0);
  g.fillRect(cx + 4.9, cy - 7.1, 2.0, 0.5);
  g.fillRect(cx + 5.65, cy - 8.1, 0.5, 2.0);
  g.fillRect(cx - 7.2, cy + 4.6, 1.0, 1.0);
  g.fillRect(cx - 7.7, cy + 5.1, 2.0, 0.5);
  g.fillRect(cx - 6.95, cy + 4.1, 0.5, 2.0);

  // ── CENTRE SPARK — bright cross + pinprick. ──
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx - 0.7, cy - 2.4, 1.4, 4.8);
  g.fillRect(cx - 2.4, cy - 0.7, 4.8, 1.4);
  g.fillRect(cx - 0.4, cy - 0.4, 0.8, 0.8);

  g.generateTexture('fx_enemy_burst_large', size, size);
  g.destroy();
}
