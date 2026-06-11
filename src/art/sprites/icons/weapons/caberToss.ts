import * as Phaser from 'phaser';

/**
 * `wicon_caber_toss` — caber-toss weapon icon. Design pivot (v2):
 * old icon had a thin pole + tiny thrower that could read as "any
 * thrown stick" rather than specifically a CABER (Highland Games
 * telephone-pole log). New pitch: MASSIVELY thicker pole (thickness
 * 6 vs 4.5), BIG visible end-grain ring at the top tip (radius 4.5
 * with concentric tree rings), and a CHUNKY thrower silhouette at
 * the bottom with muscular arm + tartan wrist cuff. The mass of
 * the pole + the release pose lock in "Highland Games caber toss".
 */
export function drawCaberTossIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;

  // ── MOTION ARC — curved dotted trail from lower-left hand up to
  // the flying caber tip. Tightened opacity range so the trail is
  // a clear comet-tail (was 0.9→0.3, fading away mid-arc). New
  // bigger overlapping dots with a faint outer halo at each step
  // suggest a rising cloud of dust. ──
  const arcPoints: [number, number, number, number][] = [
    [cx - 12, cy + 11, 1.4, 0.88],
    [cx - 10, cy + 7, 1.5, 0.82],
    [cx - 7, cy + 3, 1.6, 0.76],
    [cx - 3, cy, 1.6, 0.7],
    [cx, cy - 3, 1.6, 0.66],
    [cx + 4, cy - 5, 1.5, 0.6],
    [cx + 8, cy - 6, 1.4, 0.55],
  ];
  // Outer halo — a wider, fainter dot at each arc point.
  for (const [x, y, r, a] of arcPoints) {
    g.fillStyle(0xc8b478, a * 0.45);
    g.fillCircle(x, y, r + 0.8);
  }
  // Core dust dots.
  for (const [x, y, r, a] of arcPoints) {
    g.fillStyle(0xe8d8a0, a);
    g.fillCircle(x, y, r);
  }
  // Bright cores on the brightest dots.
  g.fillStyle(0xfaf0c8, 0.95);
  g.fillCircle(cx - 12, cy + 11, 0.6);
  g.fillCircle(cx - 7, cy + 3, 0.6);
  g.fillCircle(cx, cy - 3, 0.6);

  // ── Speed lines — bolder, longer white streaks behind the caber.
  // Now framed with a darker shadow so they read against the bright
  // arc and the wood pole. ──
  g.fillStyle(0x6a4818, 0.7);
  g.fillRect(cx - 11, cy - 9.6, 6, 0.6);
  g.fillRect(cx - 13, cy - 7.6, 5, 0.6);
  g.fillRect(cx - 9, cy - 12.6, 5, 0.6);
  g.fillStyle(0xffffff, 0.98);
  g.fillRect(cx - 11, cy - 10, 6, 1);
  g.fillRect(cx - 13, cy - 8, 5, 1);
  g.fillRect(cx - 9, cy - 13, 5, 1);

  // ── CABER POLE — THICK diagonal wooden pole, dominates the
  // icon. Thickness 6 outline + 5 body = massive silhouette. ──
  g.fillStyle(0x0a0604, 1);
  drawThickDiagonal(g, cx - 6, cy + 2, cx + 12, cy - 12, 6);
  g.fillStyle(0x6a3818, 1);
  drawThickDiagonal(g, cx - 6, cy + 2, cx + 12, cy - 12, 5);
  // Upper-edge wood-grain highlight
  g.fillStyle(0xa0682a, 0.9);
  drawThickDiagonal(g, cx - 5.5, cy + 1.5, cx + 11.5, cy - 12.5, 2);
  // Grain lines along the pole
  g.fillStyle(0x3a2010, 0.8);
  g.fillRect(cx - 4, cy + 1, 1.5, 0.5);
  g.fillRect(cx + 0, cy - 3, 1.5, 0.5);
  g.fillRect(cx + 5, cy - 7, 1.5, 0.5);
  g.fillRect(cx + 9, cy - 10, 1.5, 0.5);

  // ── BIG END-GRAIN RING at the top tip — radius 4.5, tree rings
  // visible. The "freshly-cut tree trunk" anchor. ──
  g.fillStyle(0x0a0604, 1);
  g.fillCircle(cx + 12, cy - 12, 4.5);
  g.fillStyle(0x8a5020, 1);
  g.fillCircle(cx + 12, cy - 12, 3.5);
  g.fillStyle(0xa0682a, 1);
  g.fillCircle(cx + 12, cy - 12, 2.5);
  // Concentric tree rings
  g.lineStyle(0.7, 0x3a2010, 0.95);
  g.strokeCircle(cx + 12, cy - 12, 2.8);
  g.strokeCircle(cx + 12, cy - 12, 1.8);
  g.strokeCircle(cx + 12, cy - 12, 0.9);

  // ── Jagged bottom end where the Scotsman's grip split the bark. ──
  g.fillStyle(0x0a0604, 1);
  g.fillTriangle(cx - 6, cy + 2, cx - 9, cy + 5, cx - 4, cy + 4);
  g.fillStyle(0x3a2010, 0.85);
  g.fillRect(cx - 7, cy + 3, 2, 0.5);

  // ── HIGHLAND GAMES THROWER — chunky silhouette at the bottom-
  // left. Shoulder + raised arm + fist + TARTAN WRIST CUFF. The
  // pose reads "just released the caber". ──
  // Shoulder blob
  g.fillStyle(0x1a0a08, 1);
  g.fillCircle(cx - 13, cy + 13, 4.5);
  g.fillStyle(0x3a1a18, 1);
  g.fillCircle(cx - 13, cy + 13, 3.5);
  // Arm stub reaching up toward the caber
  g.fillStyle(0xd8a878, 1);
  g.fillRect(cx - 12, cy + 9, 2.5, 4);
  g.fillStyle(0xeac090, 1);
  g.fillRect(cx - 12, cy + 9, 1.5, 4);
  // Raised fist
  g.fillStyle(0xd8a878, 1);
  g.fillCircle(cx - 11, cy + 8, 2.8);
  g.fillStyle(0xeac090, 1);
  g.fillCircle(cx - 11, cy + 8, 2);
  // TARTAN WRIST CUFF — signature Scottish detail
  g.fillStyle(0x8a1818, 1);
  g.fillRect(cx - 12.5, cy + 10, 4, 1.5);
  g.fillStyle(0x0a3018, 1);
  g.fillRect(cx - 12.5, cy + 10.5, 4, 0.5);
  g.fillStyle(0xdaaa40, 0.9);
  g.fillRect(cx - 11, cy + 10, 0.4, 1.5);

  g.generateTexture('wicon_caber_toss', s, s);
  g.destroy();
}

/**
 * Draw a thick diagonal line from (x1,y1) to (x2,y2) as a series
 * of overlapping filled circles. Used for the caber pole.
 */
function drawThickDiagonal(g: Phaser.GameObjects.Graphics, x1: number, y1: number, x2: number, y2: number, thickness: number): void {
  const dx = x2 - x1, dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.ceil(dist);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    g.fillCircle(x1 + dx * t, y1 + dy * t, thickness / 2);
  }
}
