import Phaser from 'phaser';

export function bakeMidgieSwarm(scene: Phaser.Scene): void {
  const s = 26;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;

  // ── Outermost haze — the swarm's "reach" ──
  g.fillStyle(0x0a040a, 0.15);
  g.fillCircle(cx, cy, 12);
  // Irregular outer wisps (cloud isn't perfectly round — it churns)
  g.fillStyle(0x1a0a1a, 0.25);
  g.fillEllipse(cx - 2, cy - 1, 20, 14);
  g.fillEllipse(cx + 1, cy + 2, 16, 16);
  // Mid-density cloud
  g.fillStyle(0x2a1228, 0.45);
  g.fillEllipse(cx, cy, 16, 12);
  // Dense inner cloud (where most midges are)
  g.fillStyle(0x3a1a30, 0.6);
  g.fillEllipse(cx, cy, 12, 9);
  // Darkest churning core
  g.fillStyle(0x2a0e22, 0.7);
  g.fillEllipse(cx - 1, cy, 8, 6);

  // ── Individual midge silhouettes at cloud edges (tiny, distinct) ──
  // Positioned at the edge so they read as separate creatures
  const midges: [number, number, number][] = [
    [-5, -3, 1.5], [4, -2, 1.5], [-2, 3, 1.5],
    [6, 2, 1.2], [-6, 2, 1.2], [1, -5, 1.2],
    [-3, 5, 1.0], [5, -4, 1.0], [3, 4, 1.0],
  ];
  for (const [dx, dy, r] of midges) {
    // Tiny dark body
    g.fillStyle(0x331122, 1);
    g.fillCircle(cx + dx, cy + dy, r);
    // Even tinier wings (bright flicker on each midge)
    g.fillStyle(0xccbbdd, 0.4);
    g.fillCircle(cx + dx - 0.5, cy + dy - r, 0.6);
    g.fillCircle(cx + dx + 0.5, cy + dy - r, 0.6);
  }

  // ── Red eyes — angry pinpricks staring out from the cloud ──
  g.fillStyle(0xff2233, 1);
  g.fillCircle(cx - 4, cy - 3, 0.8);
  g.fillCircle(cx + 3, cy - 2, 0.8);
  g.fillCircle(cx - 1, cy + 2, 0.8);
  g.fillCircle(cx + 5, cy + 1, 0.7);
  g.fillCircle(cx - 5, cy + 2, 0.7);
  g.fillCircle(cx + 1, cy - 5, 0.7);
  g.fillCircle(cx - 3, cy + 4, 0.6);
  g.fillCircle(cx + 4, cy - 4, 0.6);
  // Brighter pair in the centre (the biggest midge, staring right at you)
  g.fillStyle(0xff4455, 1);
  g.fillCircle(cx - 1, cy - 1, 0.9);
  g.fillCircle(cx + 1, cy - 1, 0.9);

  // ── Wing flicker — translucent bright dots (motion) ──
  g.fillStyle(0xddccee, 0.45);
  g.fillCircle(cx - 4, cy - 4, 0.6);
  g.fillCircle(cx + 5, cy - 3, 0.6);
  g.fillCircle(cx, cy + 1, 0.5);
  g.fillCircle(cx + 7, cy, 0.5);
  g.fillCircle(cx - 6, cy - 1, 0.5);
  g.fillCircle(cx + 2, cy + 5, 0.5);

  // ── Dangling legs at bottom edge (visible stragglers) ──
  g.lineStyle(0.8, 0x220a18, 0.7);
  g.lineBetween(cx - 3, cy + 5, cx - 4, cy + 8);
  g.lineBetween(cx + 2, cy + 5, cx + 3, cy + 8);
  g.lineBetween(cx - 1, cy + 5, cx - 2, cy + 9);
  g.lineBetween(cx + 4, cy + 4, cx + 5, cy + 7);
  g.lineBetween(cx, cy + 6, cx - 1, cy + 9);

  g.generateTexture('midgie_swarm', s, s);
  g.destroy();
}

/**
 * Buckfast Ned — DESIGN_IDEAS section 3 Urban Ghaists family opener.
 * Scrawny tracksuit silhouette with a dark-green Buckfast bottle.
 * Smaller than angry_scotsman (who is the raging henchman archetype);
 * ned reads as "lean, jittery, streetwise". Kept concise vs. the big
 * hero enemies — a family opener, not a showpiece.
 */
