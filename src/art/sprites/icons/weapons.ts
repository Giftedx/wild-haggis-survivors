/**
 * Weapon HUD icons — `wicon_*` 32×32 textures shown in the HUD weapon
 * slots. 15 icons total: 8 base weapons + 7 evolutions + the
 * stand-alone claymore + bagpipes-utility. Grouped in a single file
 * because they share a style (32×32, transparent BG, centred
 * silhouette — the HUD provides the slot chrome around them).
 *
 * If an individual icon grows to need bespoke helpers, split into
 * `icons/weapons/<name>.ts` — current scope fits one file cleanly.
 */

import Phaser from 'phaser';

function drawThistleShotIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 16, cy = 14;

  // ── Green calyx (the prickly cup under the bloom) — bold spiked
  // base so the silhouette reads "thistle flower" rather than
  // "purple ball". Three pointed green spikes on top of a wider
  // green cup. ──
  g.fillStyle(0x1a0a30, 1);
  g.fillTriangle(cx, cy + 3, cx - 7, cy + 11, cx + 7, cy + 11);
  g.fillStyle(0x331155, 1);
  g.fillTriangle(cx, cy + 4, cx - 6, cy + 11, cx + 6, cy + 11);
  g.fillStyle(0x442266, 1);
  g.fillTriangle(cx, cy + 5, cx - 5, cy + 10, cx + 5, cy + 10);
  // Calyx spike tips — three pointed green triangles poking into
  // the bloom (signature thistle detail)
  g.fillStyle(0x331155, 1);
  g.fillTriangle(cx - 4, cy + 5, cx - 5, cy + 8, cx - 2, cy + 7);
  g.fillTriangle(cx, cy + 4, cx - 1, cy + 7, cx + 1, cy + 7);
  g.fillTriangle(cx + 4, cy + 5, cx + 5, cy + 8, cx + 2, cy + 7);

  // ── Stem — green vertical bar below the calyx. ──
  g.fillStyle(0x1a0a30, 1);
  g.fillRect(cx - 1, cy + 11, 2, 4);
  g.fillStyle(0x331155, 1);
  g.fillRect(cx - 0.5, cy + 11, 1, 4);

  // ── Bloom base — dark purple sphere forms the underlying shape. ──
  g.fillStyle(0x2a0a40, 1);
  g.fillCircle(cx, cy, 9);

  // ── Bristles — 16 short radial spikes fanning outward from the
  // bloom. Denser = reads as a bristly thistle seed-head. ──
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 - Math.PI * 0.5;
    const innerR = 7;
    const outerR = 12;
    const spread = 0.1;
    g.fillStyle(0x4a1a6a, 1);
    g.fillTriangle(
      cx + Math.cos(a) * outerR, cy + Math.sin(a) * outerR,
      cx + Math.cos(a - spread) * innerR, cy + Math.sin(a - spread) * innerR,
      cx + Math.cos(a + spread) * innerR, cy + Math.sin(a + spread) * innerR,
    );
  }
  // Brighter inner bristle layer — shorter spikes, denser
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 - Math.PI * 0.25;
    const innerR = 5;
    const outerR = 9;
    const spread = 0.12;
    g.fillStyle(0x7a3abb, 1);
    g.fillTriangle(
      cx + Math.cos(a) * outerR, cy + Math.sin(a) * outerR,
      cx + Math.cos(a - spread) * innerR, cy + Math.sin(a - spread) * innerR,
      cx + Math.cos(a + spread) * innerR, cy + Math.sin(a + spread) * innerR,
    );
  }
  // Highlight bristles — 8 lightest strands on the upper half only
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI - Math.PI;
    const innerR = 4;
    const outerR = 8;
    g.fillStyle(0xc88ade, 0.85);
    g.fillTriangle(
      cx + Math.cos(a) * outerR, cy + Math.sin(a) * outerR,
      cx + Math.cos(a - 0.1) * innerR, cy + Math.sin(a - 0.1) * innerR,
      cx + Math.cos(a + 0.1) * innerR, cy + Math.sin(a + 0.1) * innerR,
    );
  }

  // ── Central bloom core — bright purple dome with a catch-light. ──
  g.fillStyle(0x5a2088, 1);
  g.fillCircle(cx, cy, 4.5);
  g.fillStyle(0x8a50c0, 1);
  g.fillCircle(cx - 0.5, cy - 0.5, 3);
  g.fillStyle(0xcc9ae0, 0.95);
  g.fillCircle(cx - 1, cy - 1, 1.5);
  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(cx - 1.3, cy - 1.3, 0.6);

  g.generateTexture('wicon_thistle_shot', s, s);
  g.destroy();
}

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
function drawCaberTossIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;

  // ── MOTION ARC — curved dotted trail from lower-left hand up to
  // the flying caber tip. ──
  const arcPoints: [number, number, number, number][] = [
    [cx - 12, cy + 11, 1.0, 0.9],
    [cx - 10, cy + 7, 1.0, 0.8],
    [cx - 7, cy + 3, 1.1, 0.7],
    [cx - 3, cy, 1.1, 0.6],
    [cx, cy - 3, 1.2, 0.5],
    [cx + 4, cy - 5, 1.2, 0.4],
    [cx + 8, cy - 6, 1.2, 0.3],
  ];
  for (const [x, y, r, a] of arcPoints) {
    g.fillStyle(0xe8d8a0, a);
    g.fillCircle(x, y, r);
  }

  // ── Speed lines — bolder white streaks behind the caber. ──
  g.fillStyle(0xffffff, 0.95);
  g.fillRect(cx - 11, cy - 10, 5, 1);
  g.fillRect(cx - 13, cy - 8, 4, 1);
  g.fillRect(cx - 9, cy - 13, 4, 1);

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

/**
 * `wicon_haggis_hurler` — throwing-weapon icon. Design pivot (v2):
 * old icon had a round ball with motion arc but the ball itself
 * read as "any sports sphere" — no haggis-specific tells. New pitch
 * — haggis ball with STITCHED SEAM across the middle (natural
 * casing sewing with cream cross-stitch marks), TARTAN BUTCHER'S
 * WRAPPER tied at the top (Royal Stewart red/green), and TEARDROP
 * OAT FLECKS instead of round dots. The seam + wrapper + oat
 * pattern lock in "traditional Scottish haggis" specifically.
 */
function drawHaggisHurlerIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 16, cy = 16;

  // ── Motion arc — curved trail from upper-left to the ball. ──
  g.fillStyle(0xeaddb0, 0.9);
  g.fillCircle(cx - 10, cy - 10, 1.2);
  g.fillStyle(0xeaddb0, 0.75);
  g.fillCircle(cx - 7, cy - 8, 1.3);
  g.fillStyle(0xeaddb0, 0.6);
  g.fillCircle(cx - 4, cy - 5, 1.4);
  g.fillStyle(0xeaddb0, 0.45);
  g.fillCircle(cx - 1, cy - 2, 1.5);

  // ── Speed lines — sharp white streaks. ──
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(cx - 14, cy - 12, 4, 1);
  g.fillRect(cx - 13, cy - 9, 3, 1);
  g.fillRect(cx - 15, cy - 6, 4, 1);

  // ── HAGGIS BALL — oval silhouette offset lower-right. Natural
  // casing texture with visible seam. ──
  g.fillStyle(0x1a0e04, 1);
  g.fillEllipse(cx + 4, cy + 4, 18, 16);
  // Deep brown casing
  g.fillStyle(0x4a3008, 1);
  g.fillEllipse(cx + 4, cy + 4, 16, 14);
  g.fillStyle(0x6a4a10, 1);
  g.fillEllipse(cx + 3, cy + 3, 14, 12);
  // Upper-left highlight
  g.fillStyle(0x8a6020, 0.85);
  g.fillEllipse(cx + 1, cy + 1, 8, 6);

  // ── STITCHED SEAM across the middle — natural casing sewing.
  // Dark thread line + cream cross-stitch marks. Unmistakable
  // haggis tell. ──
  g.fillStyle(0x0a0604, 1);
  g.fillRect(cx - 2, cy + 4, 12, 0.8);
  // Cream cross-stitch dots along the seam
  g.fillStyle(0xc8a848, 1);
  for (let i = 0; i < 6; i++) {
    const sx = cx - 1 + i * 2;
    g.fillRect(sx - 0.3, cy + 3.5, 0.6, 0.6);
    g.fillRect(sx - 0.3, cy + 4.3, 0.6, 0.6);
  }

  // ── TARTAN BUTCHER'S WRAPPER tied at the top — small red/green
  // striped cap. Royal Stewart anchor makes it unmistakably
  // Scottish haggis, not a generic food ball. ──
  g.fillStyle(0x0a0000, 1);
  g.fillRect(cx, cy - 4, 7, 2.8);
  g.fillStyle(0x8a1818, 1);
  g.fillRect(cx, cy - 3.8, 7, 2.2);
  g.fillStyle(0x0a3018, 1);
  g.fillRect(cx, cy - 3, 7, 0.6);
  g.fillStyle(0xdaaa40, 1);
  g.fillRect(cx + 2, cy - 3.8, 0.5, 2.2);
  g.fillRect(cx + 5, cy - 3.8, 0.5, 2.2);
  // Wrapper tail — little flag
  g.fillStyle(0x6a1212, 1);
  g.fillTriangle(cx + 7, cy - 4, cx + 9, cy - 3.5, cx + 7, cy - 2);

  // ── TEARDROP OAT FLECKS — bigger, varied. Signals "stuffed
  // with oats" clearly. ──
  g.fillStyle(0xc8a848, 1);
  g.fillEllipse(cx + 1, cy + 7, 1.6, 0.9);
  g.fillEllipse(cx + 6, cy + 7, 1.2, 0.7);
  g.fillEllipse(cx + 3, cy + 9, 1.4, 0.8);
  g.fillStyle(0xf0d880, 0.85);
  g.fillEllipse(cx + 1, cy + 7, 0.9, 0.5);
  g.fillEllipse(cx + 3, cy + 9, 0.8, 0.4);

  // ── Specular highlight — ball reads 3D. ──
  g.fillStyle(0xfff0c8, 1);
  g.fillCircle(cx - 1, cy, 1.3);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx - 1.3, cy - 0.3, 0.6);

  g.generateTexture('wicon_haggis_hurler', s, s);
  g.destroy();
}

/**
 * `wicon_bagpipe_blast` — aura-pulse bagpipes weapon icon. Design
 * pivot: old icon crammed bag + 3 drones + chanter + glow rings
 * into 32px and the ellipses all merged into a bronze blob. New
 * pitch: FOCUS on the chanter tip with MUSIC NOTES exploding out
 * in an arc + bold radial sonic-ring behind them. The bag + single
 * drone silhouette at the base anchors "bagpipes"; the music-note
 * burst tells you it's the BLAST weapon (not the utility form).
 */
function drawBagpipeBlastIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;

  // ── Outer sonic-pulse ring — the blast energy. ──
  g.lineStyle(1.2, 0xffcc44, 0.45);
  g.strokeCircle(cx, cy, 14);
  g.lineStyle(1.2, 0xffcc44, 0.7);
  g.strokeCircle(cx, cy, 11);

  // ── Tartan bag — compact, red-green-white plaid diamond shape
  // on the lower-right. Smaller than before so it doesn't dominate. ──
  g.fillStyle(0x1a0a08, 1);
  g.fillEllipse(cx + 5, cy + 7, 14, 11);
  g.fillStyle(0x8a1818, 1);
  g.fillEllipse(cx + 5, cy + 7, 12, 9);
  // Tartan crossbars
  g.fillStyle(0x0a3818, 1);
  g.fillRect(cx, cy + 5, 11, 1);
  g.fillRect(cx, cy + 9, 11, 1);
  g.fillRect(cx + 2, cy + 3, 0.8, 9);
  g.fillRect(cx + 8, cy + 3, 0.8, 9);
  // Cream pinstripe accents
  g.fillStyle(0xf0e8c8, 0.8);
  g.fillRect(cx + 4, cy + 5, 0.5, 5);

  // ── ONE big bass drone — tall vertical pipe rising from the
  // bag's upper-left. Bold black silhouette with brass ferrules. ──
  g.fillStyle(0x0a0604, 1);
  g.fillRect(cx - 3, cy - 14, 2.5, 16);
  g.fillStyle(0x3a1808, 1);
  g.fillRect(cx - 2.8, cy - 14, 2, 16);
  // Brass ferrules at top + middle
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx - 4, cy - 15, 4, 2);
  g.fillRect(cx - 4, cy - 7, 4, 1.5);
  g.fillStyle(0xfadc6a, 1);
  g.fillRect(cx - 4, cy - 15, 4, 0.6);
  g.fillRect(cx - 4, cy - 7, 4, 0.4);

  // ── Chanter pointing down-right from the bag, with finger holes.
  // The business end where the blast exits. ──
  g.fillStyle(0x0a0604, 1);
  g.fillRect(cx + 5, cy + 1, 2.5, 10);
  g.fillStyle(0x3a1808, 1);
  g.fillRect(cx + 5.2, cy + 1, 2, 10);
  // Finger holes
  g.fillStyle(0x0a0604, 1);
  g.fillCircle(cx + 6.2, cy + 3, 0.5);
  g.fillCircle(cx + 6.2, cy + 5, 0.5);
  g.fillCircle(cx + 6.2, cy + 7, 0.5);
  g.fillCircle(cx + 6.2, cy + 9, 0.5);

  // ── EXPLODING MUSIC NOTES — bursting up-right from the chanter
  // tip. Each note is a solid black quarter-note (filled head +
  // stem + flag) so the shape reads even at 32px. ──
  drawMusicNote(g, cx + 10, cy - 2, 0);     // right note
  drawMusicNote(g, cx + 6, cy - 8, 1);      // upper-right
  drawMusicNote(g, cx - 2, cy - 12, 0);     // top
  drawMusicNote(g, cx + 12, cy + 4, 1);     // lower-right
  // Tiny trailing sparkles
  g.fillStyle(0xffdd44, 1);
  g.fillCircle(cx + 14, cy + 1, 0.8);
  g.fillCircle(cx + 2, cy - 14, 0.7);
  g.fillCircle(cx - 4, cy - 8, 0.6);

  // ── Bright flash at the chanter tip — the "blast point". ──
  g.fillStyle(0xffee88, 1);
  g.fillCircle(cx + 6.2, cy + 11, 2);
  g.fillStyle(0xffffff, 0.95);
  g.fillCircle(cx + 6.2, cy + 11, 1);

  g.generateTexture('wicon_bagpipe_blast', s, s);
  g.destroy();
}

/**
 * Draw a small filled music note — note-head (ellipse) + stem
 * (rect) + optional flag (triangle). Used by bagpipe icons.
 */
function drawMusicNote(g: Phaser.GameObjects.Graphics, x: number, y: number, flipFlag: number): void {
  // Note head — tilted oval
  g.fillStyle(0x0a0604, 1);
  g.fillEllipse(x, y, 3, 2.2);
  g.fillStyle(0x4a4050, 1);
  g.fillEllipse(x - 0.2, y - 0.2, 2, 1.4);
  // Stem
  g.fillStyle(0x0a0604, 1);
  g.fillRect(x + 1, y - 4, 0.8, 4);
  // Flag (eighth-note flag at the top of the stem)
  if (flipFlag) {
    g.fillTriangle(x + 1.8, y - 4, x + 3.5, y - 2.5, x + 1.8, y - 2);
  } else {
    g.fillTriangle(x + 1.8, y - 4, x + 3.2, y - 3, x + 1.8, y - 2.5);
  }
}

function drawBagpipesUtilityIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;

  // ── Utility-buff halo — warm green-gold (utility weapon tint). ──
  g.fillStyle(0x336622, 0.25);
  g.fillCircle(cx, cy, 14);
  g.fillStyle(0x44aa33, 0.15);
  g.fillCircle(cx, cy, 10);

  // ── Three drones — the ICONIC Highland-bagpipe silhouette.
  // Two tenors + one bass, all parallel vertical pipes rising from
  // the top of the bag. Drawn first (behind the bag). Each drone
  // is dark wood with a cream-gold ferrule band and a flared cap. ──
  // Left tenor drone
  g.fillStyle(0x1a0d00, 1);
  g.fillRect(cx - 5, cy - 13, 2, 14);
  g.fillStyle(0x3a2010, 1);
  g.fillRect(cx - 5, cy - 13, 1, 13);
  // Left tenor ferrule (cream band)
  g.fillStyle(0xe8d078, 1);
  g.fillRect(cx - 5.5, cy - 7, 3, 1.5);
  // Left tenor cap flare
  g.fillStyle(0x1a0d00, 1);
  g.fillRect(cx - 6, cy - 14, 4, 2);
  g.fillStyle(0x3a2010, 1);
  g.fillRect(cx - 6, cy - 14, 4, 1);

  // Right tenor drone (parallel to left)
  g.fillStyle(0x1a0d00, 1);
  g.fillRect(cx, cy - 13, 2, 14);
  g.fillStyle(0x3a2010, 1);
  g.fillRect(cx, cy - 13, 1, 13);
  g.fillStyle(0xe8d078, 1);
  g.fillRect(cx - 0.5, cy - 7, 3, 1.5);
  g.fillStyle(0x1a0d00, 1);
  g.fillRect(cx - 1, cy - 14, 4, 2);
  g.fillStyle(0x3a2010, 1);
  g.fillRect(cx - 1, cy - 14, 4, 1);

  // Bass drone — taller, slightly right of the tenors
  g.fillStyle(0x1a0d00, 1);
  g.fillRect(cx + 4, cy - 15, 2, 16);
  g.fillStyle(0x3a2010, 1);
  g.fillRect(cx + 4, cy - 15, 1, 15);
  // Bass drone has TWO ferrules (signature bass-drone detail)
  g.fillStyle(0xe8d078, 1);
  g.fillRect(cx + 3.5, cy - 10, 3, 1.5);
  g.fillRect(cx + 3.5, cy - 5, 3, 1.5);
  g.fillStyle(0x1a0d00, 1);
  g.fillRect(cx + 3, cy - 16, 4, 2);
  g.fillStyle(0x3a2010, 1);
  g.fillRect(cx + 3, cy - 16, 4, 1);

  // ── Tartan bag — teardrop body, royal Stewart red. Drawn
  // in front of the drones. Tilted slightly so the top sits under
  // the drone stubs. ──
  // Shadow outline
  g.fillStyle(0x3a0808, 1);
  g.fillEllipse(cx, cy + 4, 18, 13);
  // Main red body
  g.fillStyle(0xaa2222, 1);
  g.fillEllipse(cx, cy + 4, 16, 11);
  // Lighter red top-left highlight
  g.fillStyle(0xcc4a4a, 1);
  g.fillEllipse(cx - 2, cy + 2, 9, 6);

  // ── Tartan cross pattern on the bag — green + white stripes
  // for instant plaid reading. ──
  g.fillStyle(0x2a6630, 1);
  g.fillRect(cx - 7, cy + 3, 14, 1);
  g.fillRect(cx - 1, cy - 1, 1, 10);
  g.fillStyle(0xe8e8c8, 0.85);
  g.fillRect(cx - 7, cy + 5, 14, 0.5);
  g.fillRect(cx + 1, cy - 1, 0.5, 10);

  // ── Blowpipe — short stem poking up-left out of the bag. ──
  g.fillStyle(0x1a0d00, 1);
  g.fillRect(cx - 9, cy - 3, 2, 6);
  g.fillStyle(0x3a2010, 1);
  g.fillRect(cx - 9, cy - 3, 1, 5);
  // Blowpipe mouthpiece tip (cream)
  g.fillStyle(0xe8d078, 1);
  g.fillRect(cx - 9.5, cy - 4, 3, 1.5);

  // ── Chanter — longer pipe pointing down-left out of the bag
  // (the finger-holes pipe). Four finger-holes visible as tiny dots. ──
  g.fillStyle(0x1a0d00, 1);
  g.fillRect(cx - 8, cy + 8, 2, 7);
  g.fillStyle(0x3a2010, 1);
  g.fillRect(cx - 8, cy + 8, 1, 6);
  // Finger-holes
  g.fillStyle(0x000000, 1);
  g.fillCircle(cx - 7, cy + 10, 0.4);
  g.fillCircle(cx - 7, cy + 12, 0.4);
  g.fillCircle(cx - 7, cy + 14, 0.4);
  // Chanter reed tip (cream)
  g.fillStyle(0xe8d078, 1);
  g.fillRect(cx - 8.5, cy + 14.5, 3, 1);

  // ── Utility sparkle — tiny buff glimmer at top-right to telegraph
  // "support weapon". ──
  g.fillStyle(0xffee66, 0.95);
  g.fillRect(cx + 9, cy - 12, 1, 1);
  g.fillStyle(0xffee66, 0.7);
  g.fillRect(cx + 10, cy - 11, 0.5, 0.5);
  g.fillRect(cx + 8, cy - 11, 0.5, 0.5);

  g.generateTexture('wicon_bagpipes', s, s);
  g.destroy();
}

/**
 * `wicon_scotch_mist` — poisonous cloud icon. Design pivot (v2):
 * old icon had the skull face buried inside a bulbous cloud that
 * dominated over the death-tell. New pitch — SKULL IS THE THING.
 * Bigger bone-white skull dominates the centre (radius 7 up from
 * 5), with mist wisps framing the corners and horizontal drift
 * tendrils selling "hanging poisonous mist" behind the skull. The
 * green toxic tint stays but now supports the skull, not buries it.
 */
function drawScotchMistIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;

  // ── Outer toxic halo — sickly green glow. ──
  g.fillStyle(0x4a7a4a, 0.22);
  g.fillCircle(cx, cy, 14);
  g.fillStyle(0x5a8a5a, 0.15);
  g.fillCircle(cx, cy, 16);

  // ── MIST WISPS FRAMING THE SKULL — smaller clumps at the four
  // corners so the skull centre dominates. ──
  g.fillStyle(0x3a5a50, 0.85);
  g.fillCircle(cx - 10, cy - 6, 4);
  g.fillCircle(cx + 10, cy - 6, 4);
  g.fillCircle(cx - 9, cy + 8, 4);
  g.fillCircle(cx + 9, cy + 8, 4);
  g.fillStyle(0x4a7a6a, 0.85);
  g.fillCircle(cx - 9, cy - 5, 3.5);
  g.fillCircle(cx + 9, cy - 5, 3.5);
  g.fillCircle(cx - 8, cy + 7, 3.5);
  g.fillCircle(cx + 8, cy + 7, 3.5);
  g.fillStyle(0x6a9a8a, 0.8);
  g.fillCircle(cx - 8, cy - 5, 2.5);
  g.fillCircle(cx + 8, cy - 5, 2.5);
  g.fillCircle(cx - 7, cy + 7, 2.5);
  g.fillCircle(cx + 7, cy + 7, 2.5);

  // ── HORIZONTAL DRIFT TENDRILS behind the skull — sells the
  // "hanging mist" mood without competing with the skull. ──
  g.fillStyle(0x5a8a7a, 0.65);
  g.fillRect(cx - 12, cy - 4, 24, 1);
  g.fillStyle(0x6a9a8a, 0.55);
  g.fillRect(cx - 13, cy + 5, 26, 1);
  g.fillStyle(0x8abaaa, 0.5);
  g.fillRect(cx - 14, cy, 28, 0.8);

  // ── BIG SKULL FACE — the lethal anchor. Bone-pale, now large
  // enough to dominate the icon. ──
  g.fillStyle(0x0a1a14, 1);
  g.fillCircle(cx, cy - 1, 8);
  g.fillStyle(0xd0dcc8, 1);
  g.fillCircle(cx, cy - 1, 7);
  g.fillStyle(0xe8f0dc, 1);
  g.fillCircle(cx - 1, cy - 2, 6);
  // Jaw taper
  g.fillStyle(0xc0ccb8, 1);
  g.fillRect(cx - 3, cy + 5, 6, 2.5);
  g.fillStyle(0xd0dcc8, 1);
  g.fillRect(cx - 2.5, cy + 5, 5, 2);
  // Cranium ridge shading
  g.fillStyle(0xb0bca8, 0.7);
  g.fillRect(cx - 5, cy - 7, 10, 1.5);

  // ── HOLLOW EYE SOCKETS — big dark ovals with glowing toxic
  // green centres. The kill-tell. ──
  g.fillStyle(0x0a1a10, 1);
  g.fillEllipse(cx - 2.8, cy - 1.5, 3.5, 3);
  g.fillEllipse(cx + 2.8, cy - 1.5, 3.5, 3);
  g.fillStyle(0x50dd70, 1);
  g.fillCircle(cx - 2.8, cy - 1.5, 1.2);
  g.fillCircle(cx + 2.8, cy - 1.5, 1.2);
  g.fillStyle(0xa8f8c0, 1);
  g.fillCircle(cx - 2.8, cy - 1.7, 0.5);
  g.fillCircle(cx + 2.8, cy - 1.7, 0.5);

  // ── Nose gap — dark triangle hole. ──
  g.fillStyle(0x0a1a10, 1);
  g.fillTriangle(cx, cy + 1.5, cx - 1.2, cy + 3.5, cx + 1.2, cy + 3.5);

  // ── Grinning teeth — 5 white rectangles along the jaw. ──
  g.fillStyle(0xf4f8e8, 1);
  g.fillRect(cx - 3, cy + 5, 0.9, 1.5);
  g.fillRect(cx - 1.7, cy + 5, 0.9, 1.5);
  g.fillRect(cx - 0.4, cy + 5, 0.9, 1.5);
  g.fillRect(cx + 0.9, cy + 5, 0.9, 1.5);
  g.fillRect(cx + 2.2, cy + 5, 0.9, 1.5);
  // Tooth gap shadows
  g.fillStyle(0x1a2a1a, 0.6);
  g.fillRect(cx - 2.1, cy + 5, 0.4, 1.5);
  g.fillRect(cx - 0.8, cy + 5, 0.4, 1.5);
  g.fillRect(cx + 0.5, cy + 5, 0.4, 1.5);
  g.fillRect(cx + 1.8, cy + 5, 0.4, 1.5);

  // ── Toxic fume wisps rising from the top of the skull. ──
  g.fillStyle(0x88c8a0, 0.7);
  g.fillCircle(cx - 3, cy - 12, 1.2);
  g.fillCircle(cx + 3, cy - 13, 1);
  g.fillStyle(0xa0d8b8, 0.5);
  g.fillCircle(cx, cy - 15, 0.8);

  g.generateTexture('wicon_scotch_mist', s, s);
  g.destroy();
}

/**
 * `wicon_nessie_tentacle` — Loch Ness tentacle lash icon. Design
 * pivot: old icon was a string of overlapping green circles that
 * read as "snake made of peas". New pitch — BOLD TAPERED TENTACLE
 * silhouette lashing diagonally from bottom-left up-right, with a
 * clear proximal-to-distal taper, bright cream suckers running
 * along the underside, water splash at the base where it emerges.
 * Reads "squid-like tentacle" not "row of dots".
 */
function drawNessieTentacleIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;

  // Water splash at the base (lower-left) — the loch-emergence tell
  g.fillStyle(0x336688, 0.5);
  g.fillEllipse(cx - 12, cy + 13, 12, 3);
  g.fillStyle(0x66aacc, 0.8);
  g.fillCircle(cx - 13, cy + 12, 1.3);
  g.fillCircle(cx - 9, cy + 11, 1);
  g.fillStyle(0x88ccee, 1);
  g.fillCircle(cx - 14, cy + 10, 0.8);
  g.fillCircle(cx - 10, cy + 9, 0.6);

  // TENTACLE SHAPE — thick dark outline as a lashing S-curve from
  // lower-left to upper-right. Drawn as overlapping ellipses of
  // decreasing size for clean taper.
  const points: [number, number, number][] = [
    // [x, y, radius]
    [cx - 11, cy + 11, 6.5],
    [cx - 8, cy + 8, 6],
    [cx - 5, cy + 5, 5.5],
    [cx - 2, cy + 2, 5],
    [cx + 1, cy - 1, 4.5],
    [cx + 4, cy - 4, 4],
    [cx + 7, cy - 7, 3.3],
    [cx + 10, cy - 10, 2.6],
    [cx + 12, cy - 12, 2],
  ];
  // Dark outline pass
  g.fillStyle(0x0a2012, 1);
  for (const [px, py, r] of points) g.fillCircle(px, py, r + 0.6);
  // Main body — loch-water green
  g.fillStyle(0x1e5a36, 1);
  for (const [px, py, r] of points) g.fillCircle(px, py, r);
  // Light top highlight (light hits the upper-right side)
  g.fillStyle(0x3a8a5a, 1);
  for (const [px, py, r] of points) g.fillCircle(px + 0.3, py - 0.3, r * 0.65);
  // Brighter sheen
  g.fillStyle(0x60b080, 0.85);
  for (const [px, py, r] of points) g.fillCircle(px + 0.5, py - 0.6, r * 0.35);

  // POINTED TIP — sharpen the distal end with a triangle
  g.fillStyle(0x0a2012, 1);
  g.fillTriangle(cx + 11, cy - 11, cx + 15, cy - 15, cx + 12, cy - 12);
  g.fillStyle(0x1e5a36, 1);
  g.fillTriangle(cx + 11.5, cy - 11, cx + 14, cy - 14, cx + 12, cy - 11);

  // Suckers — cream-coloured circles running along the lower-right
  // underside of the tentacle. Spaced so they don't merge.
  g.fillStyle(0xeadcb8, 1);
  g.fillCircle(cx - 7, cy + 10, 1.3);
  g.fillCircle(cx - 3, cy + 7, 1.2);
  g.fillCircle(cx, cy + 4, 1.1);
  g.fillCircle(cx + 4, cy + 1, 1);
  g.fillCircle(cx + 7, cy - 2, 0.9);
  // Sucker rim shadow
  g.fillStyle(0x8a7040, 0.9);
  g.fillCircle(cx - 7, cy + 10, 0.7);
  g.fillCircle(cx - 3, cy + 7, 0.6);
  g.fillCircle(cx, cy + 4, 0.5);

  // Bio-luminescent green glints on the back side
  g.fillStyle(0x55ffaa, 0.8);
  g.fillCircle(cx - 9, cy + 6, 0.5);
  g.fillCircle(cx - 5, cy + 3, 0.5);
  g.fillCircle(cx, cy - 2, 0.5);
  g.fillCircle(cx + 5, cy - 6, 0.5);

  g.generateTexture('wicon_nessie_tentacle', s, s);
  g.destroy();
}

/**
 * `wicon_thistle_storm` — thistle-storm evolution icon. Design
 * pivot: old icon was a centre bloom + 7 satellite dots inside a
 * radial spoke pattern that merged into "abstract sunburst". New
 * pitch — THREE thistle heads arranged on a visible SPIRAL inside
 * a dark-purple storm halo, with motion-trail dots behind each
 * head showing the rotation direction and a lightning spark
 * punctuation at the core. Reads "multi-thistle storm" at scale.
 */
function drawThistleStormIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;

  // ── Dark storm halo — two purple glow layers + lightning rim. ──
  g.fillStyle(0x2a0844, 0.35);
  g.fillCircle(cx, cy, 15);
  g.fillStyle(0x4a1068, 0.28);
  g.fillCircle(cx, cy, 12);
  g.lineStyle(1, 0xcc88ff, 0.55);
  g.strokeCircle(cx, cy, 14);

  // ── Spiral motion arc — sweep from top clockwise. ──
  g.lineStyle(2, 0x8a3ab0, 0.85);
  g.beginPath();
  g.arc(cx, cy, 10, -Math.PI * 0.9, Math.PI * 0.4);
  g.strokePath();
  g.lineStyle(1.2, 0xcc88ff, 0.7);
  g.beginPath();
  g.arc(cx, cy, 10, -Math.PI * 0.9, Math.PI * 0.4);
  g.strokePath();

  // ── Three thistle heads in spiral formation (largest at top). ──
  const heads: [number, number, number][] = [
    [0, -7, 3.5],
    [6, 3, 3],
    [-6, 3, 2.5],
  ];
  for (const [dx, dy, r] of heads) {
    const hx = cx + dx, hy = cy + dy;
    // Green calyx base
    g.fillStyle(0x1a3808, 1);
    g.fillEllipse(hx, hy + r * 0.6, r * 1.4, r * 0.7);
    g.fillStyle(0x2a5818, 1);
    g.fillEllipse(hx, hy + r * 0.6, r * 1.1, r * 0.5);
    // Dark purple bloom base
    g.fillStyle(0x2a0844, 1);
    g.fillCircle(hx, hy, r + 0.4);
    g.fillStyle(0x5a1a88, 1);
    g.fillCircle(hx, hy, r);
    g.fillStyle(0x9944cc, 1);
    g.fillCircle(hx - 0.3, hy - 0.3, r * 0.7);
    // Short bristle spikes radiating
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const tipX = hx + Math.cos(a) * (r + 1.3);
      const tipY = hy + Math.sin(a) * (r + 1.3);
      const bLx = hx + Math.cos(a - 0.15) * r * 0.8;
      const bLy = hy + Math.sin(a - 0.15) * r * 0.8;
      const bRx = hx + Math.cos(a + 0.15) * r * 0.8;
      const bRy = hy + Math.sin(a + 0.15) * r * 0.8;
      g.fillStyle(0x6a2088, 1);
      g.fillTriangle(tipX, tipY, bLx, bLy, bRx, bRy);
    }
    // Bright core
    g.fillStyle(0xcc88ff, 1);
    g.fillCircle(hx - 0.3, hy - 0.3, r * 0.4);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(hx - 0.5, hy - 0.5, r * 0.2);
  }

  // ── Motion-trail dots behind each head. ──
  g.fillStyle(0xcc88ff, 0.7);
  g.fillCircle(cx - 3, cy - 6, 0.8);
  g.fillCircle(cx + 3, cy + 6, 0.7);
  g.fillCircle(cx - 8, cy, 0.6);
  g.fillStyle(0xaa55dd, 0.5);
  g.fillCircle(cx - 5, cy - 5, 0.5);
  g.fillCircle(cx + 5, cy + 5, 0.5);

  // ── Lightning spark at centre — storm-threat anchor. ──
  g.fillStyle(0xffffff, 0.95);
  g.fillRect(cx - 0.5, cy - 2, 1, 4);
  g.fillRect(cx - 2, cy - 0.5, 4, 1);

  g.generateTexture('wicon_thistle_storm', s, s);
  g.destroy();
}

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
function drawHighlandGamesIcon(scene: Phaser.Scene): void {
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

/**
 * `wicon_haggis_cannon` — scatter-fire upgrade icon. Design pivot:
 * old icon was 6 radial spoke-lines + center blob = concentric-
 * circles mess reading as "gear" or "sunburst". New pitch — proper
 * CANNON-BARREL shape angled diagonal from lower-left to upper-
 * right, with a BIG MUZZLE FLASH at the tip and 3 haggis balls
 * exploding outward in a scatter. Reads "cannon firing shrapnel"
 * not "abstract pattern".
 */
function drawHaggisCannonIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;

  // Cannon body — diagonal thick barrel from lower-left to centre
  // Dark outline
  g.fillStyle(0x0a0604, 1);
  g.fillTriangle(cx - 14, cy + 12, cx - 10, cy + 14, cx + 4, cy);
  g.fillTriangle(cx - 14, cy + 12, cx + 4, cy, cx + 2, cy - 4);
  // Main barrel — brass/bronze
  g.fillStyle(0x6a3010, 1);
  g.fillTriangle(cx - 13, cy + 12, cx - 10, cy + 13, cx + 3, cy - 1);
  g.fillTriangle(cx - 13, cy + 12, cx + 3, cy - 1, cx + 1, cy - 3);
  // Barrel highlight (upper edge catching light)
  g.fillStyle(0xba8040, 1);
  g.fillRect(cx - 12, cy + 10, 2, 1);
  g.fillRect(cx - 8, cy + 7, 3, 1);
  g.fillRect(cx - 4, cy + 3, 3, 1);
  g.fillRect(cx, cy - 1, 2, 1);
  // Reinforcement bands — two darker rings on the barrel
  g.fillStyle(0x2a1a08, 1);
  g.fillRect(cx - 10, cy + 8, 4, 1.5);
  g.fillRect(cx - 4, cy + 2, 4, 1.5);
  // Band brass highlight
  g.fillStyle(0xd8a840, 0.9);
  g.fillRect(cx - 10, cy + 8, 4, 0.4);
  g.fillRect(cx - 4, cy + 2, 4, 0.4);

  // Cannon breech (back end) — larger rounded block
  g.fillStyle(0x0a0604, 1);
  g.fillCircle(cx - 13, cy + 12, 3);
  g.fillStyle(0x6a3010, 1);
  g.fillCircle(cx - 13, cy + 12, 2.5);
  g.fillStyle(0xba8040, 0.9);
  g.fillCircle(cx - 14, cy + 11, 1);

  // MUZZLE FLASH — big bright orange-yellow burst at the tip
  // Outer glow
  g.fillStyle(0xff6020, 0.5);
  g.fillCircle(cx + 3, cy - 3, 10);
  g.fillStyle(0xffa040, 0.8);
  g.fillCircle(cx + 3, cy - 3, 7);
  // Core flash
  g.fillStyle(0xffd880, 1);
  g.fillCircle(cx + 3, cy - 3, 5);
  g.fillStyle(0xfff4c8, 1);
  g.fillCircle(cx + 3, cy - 3, 3);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx + 2, cy - 4, 1.3);

  // Three SCATTER BALLS — haggis shrapnel spreading outward upper-right
  drawMiniHaggis(g, cx + 9, cy - 9, 2.5);
  drawMiniHaggis(g, cx + 12, cy - 5, 2);
  drawMiniHaggis(g, cx + 7, cy - 13, 2);

  // Smoke puffs trailing from the muzzle
  g.fillStyle(0x8a8070, 0.6);
  g.fillCircle(cx - 4, cy - 8, 1.5);
  g.fillCircle(cx - 8, cy - 5, 1.2);
  g.fillStyle(0xa8a090, 0.4);
  g.fillCircle(cx - 6, cy - 11, 1);

  g.generateTexture('wicon_haggis_cannon', s, s);
  g.destroy();
}

/**
 * Draw a small haggis ball for scatter-shrapnel decoration on
 * weapon icons. Dark outline + brown body + oat fleck.
 */
function drawMiniHaggis(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number): void {
  g.fillStyle(0x0a0604, 1);
  g.fillCircle(x, y, r + 0.4);
  g.fillStyle(0x4a3008, 1);
  g.fillCircle(x, y, r);
  g.fillStyle(0x7a5020, 1);
  g.fillCircle(x - 0.3, y - 0.3, r * 0.65);
  g.fillStyle(0xc8a848, 0.9);
  g.fillCircle(x + 0.3, y + 0.3, 0.4);
}

/**
 * `wicon_highland_fling` — bagpipe-blast evolution icon. Design
 * pivot: old icon was blue concentric rings + scattered arrow-
 * stars that read as "generic AoE burst". New pitch — a TINY
 * KILTED DANCER silhouette caught mid-fling pose (one arm raised
 * overhead, one leg high-kicked sideways) inside rotating blue
 * pulse rings. The figure ties the icon to "Highland Fling"
 * specifically rather than any ring-burst AoE.
 */
function drawHighlandFlingIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // ── Evolution halo + rotating pulse rings. ──
  g.fillStyle(0x2244aa, 0.25);
  g.fillCircle(cx, cy, 15);
  g.fillStyle(0x4488ff, 0.18);
  g.fillCircle(cx, cy, 12);
  g.lineStyle(1.5, 0x66aaff, 0.85);
  g.strokeCircle(cx, cy, 13);
  g.lineStyle(1.2, 0x99ccff, 0.6);
  g.strokeCircle(cx, cy, 10);

  // ── Kilted dancer silhouette — signature Fling pose. ──
  // Head
  g.fillStyle(0x1a1a24, 1);
  g.fillCircle(cx, cy - 8, 1.8);
  g.fillStyle(0xd8b888, 1);
  g.fillCircle(cx, cy - 8, 1.4);
  // Raised arm (up-right, overhead)
  g.fillStyle(0x1a1a24, 1);
  g.fillRect(cx, cy - 10, 1.2, 4);
  g.fillRect(cx + 2, cy - 13, 1.2, 3);
  g.fillStyle(0xd8b888, 1);
  g.fillCircle(cx + 2.5, cy - 13, 0.8);
  // Opposite arm (bent to side)
  g.fillStyle(0x1a1a24, 1);
  g.fillRect(cx - 3, cy - 6, 1.2, 3);
  g.fillStyle(0xd8b888, 1);
  g.fillCircle(cx - 3.5, cy - 4, 0.7);
  // Torso (dark jacket)
  g.fillStyle(0x0a1a38, 1);
  g.fillRect(cx - 2, cy - 6, 4, 5);
  g.fillStyle(0x1a3858, 1);
  g.fillRect(cx - 1.5, cy - 5.5, 3, 4);

  // Kilt — tartan diamond
  g.fillStyle(0x8a1818, 1);
  g.fillRect(cx - 3, cy - 1, 6, 4);
  g.fillStyle(0xaa2828, 1);
  g.fillRect(cx - 2.5, cy - 0.5, 5, 3);
  g.fillStyle(0x0a0808, 0.8);
  g.fillRect(cx - 2.5, cy + 0.3, 5, 0.4);
  g.fillRect(cx - 2.5, cy + 1.5, 5, 0.4);
  g.fillRect(cx - 0.5, cy - 0.5, 0.4, 3);

  // Standing leg — straight down with sock + shoe
  g.fillStyle(0xd8b888, 1);
  g.fillRect(cx - 1, cy + 3, 1.3, 3);
  g.fillStyle(0xe8e8e0, 1);
  g.fillRect(cx - 1, cy + 6, 1.3, 1.5);
  g.fillStyle(0x1a1a24, 1);
  g.fillRect(cx - 1.3, cy + 7.5, 2, 1.2);

  // High-kicked leg — out to the right, the Fling tell
  g.fillStyle(0xd8b888, 1);
  g.fillRect(cx + 1, cy + 2, 3, 1.2);
  g.fillRect(cx + 4, cy + 1, 3, 1.2);
  g.fillStyle(0xe8e8e0, 1);
  g.fillRect(cx + 6.5, cy + 0.5, 1.5, 1.2);
  g.fillStyle(0x1a1a24, 1);
  g.fillRect(cx + 7.5, cy + 0.3, 1.5, 1);

  // ── Motion sparkles around the dancer. ──
  g.fillStyle(0xccddff, 1);
  g.fillCircle(cx - 10, cy - 5, 1.2);
  g.fillStyle(0xaaddff, 0.8);
  g.fillCircle(cx + 10, cy + 5, 1.2);
  g.fillStyle(0x88ccff, 0.75);
  g.fillCircle(cx - 8, cy + 8, 0.9);
  g.fillCircle(cx + 8, cy - 8, 0.9);
  // Four-point star sparkles
  g.fillStyle(0xffffff, 0.95);
  g.fillRect(cx - 11, cy, 1.5, 0.5);
  g.fillRect(cx - 10.3, cy - 0.7, 0.5, 1.5);
  g.fillRect(cx + 10, cy, 1.5, 0.5);
  g.fillRect(cx + 10.3, cy - 0.7, 0.5, 1.5);

  g.generateTexture('wicon_highland_fling', s, s);
  g.destroy();
}

/**
 * `wicon_the_haar` — haar-fog evolution icon. Design pivot: old
 * icon used a muted green-grey palette that read too close to
 * `wicon_scotch_mist` (the sibling fog weapon) — the two were
 * confusable at a glance. New pitch — pure COLD NORTH-SEA
 * palette (teal-grey + pale-cyan, NO green), horizontal fog bands
 * dominating the lower half (matching the `haar_wraith` enemy
 * silhouette), and a pale SKELETAL FACE pushing forward through
 * the top with cyan pinprick eyes. Cold palette is the key
 * differentiator from the toxic green mist.
 */
function drawTheHaarIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;

  // ── Cold north-sea halo — teal-grey, no green. ──
  g.fillStyle(0x4a6278, 0.22);
  g.fillCircle(cx, cy, 15);
  g.fillStyle(0x7a94a8, 0.18);
  g.fillCircle(cx, cy, 12);

  // ── Horizontal fog bands at the bottom half — signature haar. ──
  g.fillStyle(0x8aa4b4, 0.4);
  g.fillEllipse(cx, cy + 13, 26, 2.5);
  g.fillStyle(0x9ab4c4, 0.5);
  g.fillEllipse(cx - 2, cy + 10, 24, 2.5);
  g.fillStyle(0x7a94a8, 0.65);
  g.fillEllipse(cx + 2, cy + 7, 22, 2.5);
  g.fillStyle(0x6a84a0, 0.75);
  g.fillEllipse(cx - 1, cy + 4, 20, 2.5);
  g.fillStyle(0x5a7890, 0.85);
  g.fillEllipse(cx, cy + 1, 18, 2.5);

  // ── Cold skeletal face emerging forward through the fog. ──
  g.fillStyle(0x1a2a34, 0.9);
  g.fillEllipse(cx, cy - 3, 10, 11);
  g.fillStyle(0x3a5060, 0.95);
  g.fillEllipse(cx, cy - 3, 8, 9);
  g.fillStyle(0xc8d4dc, 0.95);
  g.fillEllipse(cx, cy - 4, 7, 8);
  // Gaunt cheek hollows
  g.fillStyle(0x3a5060, 0.7);
  g.fillEllipse(cx - 2.5, cy - 1, 1.8, 2.5);
  g.fillEllipse(cx + 2.5, cy - 1, 1.8, 2.5);

  // Hollow eye sockets — cold cyan glow
  g.fillStyle(0x0a1a28, 1);
  g.fillEllipse(cx - 2, cy - 4, 2.2, 2.8);
  g.fillEllipse(cx + 2, cy - 4, 2.2, 2.8);
  g.fillStyle(0x8ad8f0, 0.5);
  g.fillCircle(cx - 2, cy - 4, 1.5);
  g.fillCircle(cx + 2, cy - 4, 1.5);
  g.fillStyle(0xccf0ff, 1);
  g.fillCircle(cx - 2, cy - 4, 0.9);
  g.fillCircle(cx + 2, cy - 4, 0.9);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx - 2, cy - 4.3, 0.35);
  g.fillCircle(cx + 2, cy - 4.3, 0.35);

  // Nose hollow
  g.fillStyle(0x0a1a28, 1);
  g.fillTriangle(cx, cy, cx - 0.8, cy + 1.5, cx + 0.8, cy + 1.5);

  // Skeletal grin — gapped teeth
  g.fillStyle(0x1a2838, 1);
  g.fillRect(cx - 2.5, cy + 2.5, 5, 1.5);
  g.fillStyle(0xc8d4dc, 1);
  g.fillRect(cx - 2.2, cy + 2.8, 0.7, 1);
  g.fillRect(cx - 1, cy + 3, 0.7, 0.8);
  g.fillRect(cx + 0.3, cy + 2.8, 0.7, 1);
  g.fillRect(cx + 1.5, cy + 3, 0.7, 0.8);

  // ── Drifting upper wisps above the head. ──
  g.fillStyle(0xc4d4de, 0.5);
  g.fillCircle(cx - 4, cy - 11, 1.3);
  g.fillCircle(cx + 4, cy - 12, 1.2);
  g.fillStyle(0xe0eaf0, 0.35);
  g.fillCircle(cx, cy - 14, 1);

  // ── Side-drift tendrils — the "creeping in from the sea" tell. ──
  g.fillStyle(0xaac4d4, 0.5);
  g.fillRect(cx - 14, cy + 5, 6, 1);
  g.fillRect(cx + 8, cy + 6, 6, 1);
  g.fillStyle(0xc4d4dc, 0.35);
  g.fillRect(cx - 16, cy + 9, 5, 1);
  g.fillRect(cx + 11, cy + 10, 5, 1);

  g.generateTexture('wicon_the_haar', s, s);
  g.destroy();
}

/**
 * `wicon_nessie_unleashed` — legendary Nessie evolution icon. Design
 * pivot: old icon was a tentacle-star of 12 small segment-blobs that
 * read as "spiral pattern". New pitch — iconic NESSIE SERPENT NECK
 * rising from water: curved long neck arching from lower-right loch,
 * reaching upper-left, small head with glowing eye at the tip. The
 * tourist-brochure silhouette everyone knows. Water splash at base
 * plus two supporting coils beneath the surface.
 */
function drawNessieUnleashedIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;

  // ── Water surface at the bottom — dark loch. ──
  g.fillStyle(0x0a2238, 1);
  g.fillRect(0, cy + 8, s, s - (cy + 8));
  g.fillStyle(0x1a3a58, 1);
  g.fillRect(0, cy + 8, s, 1.5);
  // Ripple lines
  g.fillStyle(0x4a7a9a, 0.8);
  g.fillRect(2, cy + 10, 8, 0.4);
  g.fillRect(14, cy + 12, 10, 0.4);
  g.fillRect(22, cy + 14, 8, 0.4);

  // ── Mystic halo around the monster. ──
  g.fillStyle(0x336688, 0.3);
  g.fillCircle(cx, cy - 2, 14);

  // ── BACK COIL — visible hump behind the neck, peeking over water. ──
  g.fillStyle(0x0a2012, 1);
  g.fillEllipse(cx + 8, cy + 7, 12, 5);
  g.fillStyle(0x1a4a2a, 1);
  g.fillEllipse(cx + 8, cy + 7, 10, 4);
  g.fillStyle(0x3a8a4a, 1);
  g.fillEllipse(cx + 8, cy + 6.5, 8, 2.5);

  // ── SECOND COIL — smaller hump further right. ──
  g.fillStyle(0x0a2012, 1);
  g.fillEllipse(cx + 14, cy + 9, 6, 3);
  g.fillStyle(0x1a4a2a, 1);
  g.fillEllipse(cx + 14, cy + 9, 5, 2.5);

  // ── SERPENT NECK — long curving S from base (cx+6, cy+5) arching
  // up to head (cx-8, cy-8). Drawn as overlapping circles of
  // decreasing size for smooth taper. ──
  const neckPoints: [number, number, number][] = [
    [cx + 6, cy + 5, 4.5],
    [cx + 4, cy + 2, 4.2],
    [cx + 1, cy - 1, 3.8],
    [cx - 2, cy - 4, 3.4],
    [cx - 5, cy - 6, 3],
    [cx - 7, cy - 8, 2.6],
  ];
  // Dark outline
  g.fillStyle(0x0a2012, 1);
  for (const [px, py, r] of neckPoints) g.fillCircle(px, py, r + 0.6);
  // Main body — loch green
  g.fillStyle(0x1a5a32, 1);
  for (const [px, py, r] of neckPoints) g.fillCircle(px, py, r);
  // Lighter belly (catches light on left side)
  g.fillStyle(0x3a8a4a, 1);
  for (const [px, py, r] of neckPoints) g.fillCircle(px - 0.5, py - 0.3, r * 0.6);
  // Brightest highlight strip
  g.fillStyle(0x5ab060, 0.85);
  for (const [px, py, r] of neckPoints) g.fillCircle(px - 0.8, py - 0.5, r * 0.3);

  // ── HEAD — teardrop shape at the neck tip, angled up-left. ──
  g.fillStyle(0x0a2012, 1);
  g.fillEllipse(cx - 9, cy - 9, 6, 4);
  g.fillStyle(0x1a5a32, 1);
  g.fillEllipse(cx - 9, cy - 9, 5, 3.5);
  g.fillStyle(0x3a8a4a, 1);
  g.fillEllipse(cx - 9.5, cy - 9.5, 4, 2.5);
  // Head snout pointing up-left
  g.fillStyle(0x0a2012, 1);
  g.fillTriangle(cx - 11, cy - 9, cx - 13, cy - 11, cx - 11, cy - 10);
  g.fillStyle(0x1a5a32, 1);
  g.fillTriangle(cx - 11, cy - 9.2, cx - 12.5, cy - 10.5, cx - 11, cy - 9.8);

  // ── GLOWING EYE — bright amber eye on the head, the anchor. ──
  g.fillStyle(0xffcc22, 1);
  g.fillCircle(cx - 9, cy - 9.3, 1.2);
  g.fillStyle(0xffee88, 1);
  g.fillCircle(cx - 9, cy - 9.3, 0.7);
  g.fillStyle(0x000000, 1);
  g.fillRect(cx - 9.3, cy - 10, 0.6, 1.5);

  // ── Mouth line — small dark curve. ──
  g.fillStyle(0x0a0a08, 1);
  g.fillRect(cx - 12, cy - 8, 1.5, 0.5);

  // ── Water splash at the neck base — the emergence tell. ──
  g.fillStyle(0x4a8aba, 0.85);
  g.fillEllipse(cx + 5, cy + 9, 10, 2);
  g.fillStyle(0x88ccee, 1);
  g.fillCircle(cx + 9, cy + 8, 1);
  g.fillCircle(cx + 2, cy + 8.5, 0.8);
  g.fillCircle(cx - 1, cy + 10, 0.8);
  // Splash droplets arching over
  g.fillStyle(0xaaddee, 0.9);
  g.fillCircle(cx + 11, cy + 5, 0.8);
  g.fillCircle(cx + 2, cy + 3, 0.7);

  g.generateTexture('wicon_nessie_unleashed', s, s);
  g.destroy();
}

function drawClaymoreIcon(scene: Phaser.Scene): void {
  // Highland two-handed broadsword. The distinguishing trait that
  // separates a claymore from any other greatsword is the FORWARD-
  // CANTED quillons angling toward the tip with quatrefoil terminals
  // (four-petal clusters at each end of the crossguard). Wheel pommel,
  // leather + wire wrapped double-hand grip. Drawn vertically so the
  // blade dominates the HUD slot.
  const s = 32;
  const g = scene.add.graphics();

  // ── Blade outline — dark steel edge — wide diamond shape, point up ──
  g.fillStyle(0x1a2028, 1);
  g.fillTriangle(16, 2, 12, 18, 20, 18);
  // Main blade — cold steel mid-tone
  g.fillStyle(0x3a4a5a, 1);
  g.fillTriangle(16, 3, 13, 18, 19, 18);
  // Lighter face
  g.fillStyle(0x6a7e90, 1);
  g.fillTriangle(16, 4, 14, 18, 18, 18);
  // Central fuller (groove) — darker thin line running down the blade
  g.fillStyle(0x2a3848, 0.85);
  g.fillRect(16, 4, 0.5, 14);
  // Bright edge highlight on the leading (left) edge
  g.fillStyle(0xc8dae8, 0.85);
  g.fillRect(15, 6, 0.5, 10);
  g.fillStyle(0xe8f2fa, 0.7);
  g.fillRect(15, 6, 0.5, 5);
  // Blade tip highlight — catches the light
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(15.5, 3, 1, 2);

  // ── Crossguard — forward-canted quillons (the claymore tell).
  // Each quillon is a thick bar angling UP-and-OUT from the central
  // block toward the blade tip, ending in a quatrefoil cluster.
  // Built out of stacked parallel bars so the angle reads clearly
  // at sprite scale rather than getting smoothed into a horizontal. ──
  // Central iron block behind the quillons
  g.fillStyle(0x1a1006, 1);
  g.fillRect(13, 17, 6, 4);
  g.fillStyle(0x2a1e10, 1);
  g.fillRect(13, 17, 6, 1);

  // LEFT quillon — staircase of 1px rects stepping up-left so the
  // forward cant is unmistakable. Dark outline, then brown mid.
  g.fillStyle(0x1a1006, 1);
  g.fillRect(12, 19, 2, 2); // base at block
  g.fillRect(10, 18, 2, 2);
  g.fillRect(8, 17, 2, 2);
  g.fillRect(6, 16, 2, 2);
  g.fillRect(4, 15, 2, 2);
  g.fillStyle(0x4a3420, 1);
  g.fillRect(12, 19, 1, 1);
  g.fillRect(10, 18, 1, 1);
  g.fillRect(8, 17, 1, 1);
  g.fillRect(6, 16, 1, 1);
  g.fillRect(4, 15, 1, 1);
  g.fillStyle(0x7a5a30, 0.8);
  g.fillRect(12, 20, 1, 1);
  g.fillRect(10, 19, 1, 1);
  g.fillRect(8, 18, 1, 1);
  g.fillRect(6, 17, 1, 1);
  g.fillRect(4, 16, 1, 1);

  // RIGHT quillon — mirror staircase up-right.
  g.fillStyle(0x1a1006, 1);
  g.fillRect(18, 19, 2, 2);
  g.fillRect(20, 18, 2, 2);
  g.fillRect(22, 17, 2, 2);
  g.fillRect(24, 16, 2, 2);
  g.fillRect(26, 15, 2, 2);
  g.fillStyle(0x4a3420, 1);
  g.fillRect(19, 19, 1, 1);
  g.fillRect(21, 18, 1, 1);
  g.fillRect(23, 17, 1, 1);
  g.fillRect(25, 16, 1, 1);
  g.fillRect(27, 15, 1, 1);
  g.fillStyle(0x7a5a30, 0.8);
  g.fillRect(19, 20, 1, 1);
  g.fillRect(21, 19, 1, 1);
  g.fillRect(23, 18, 1, 1);
  g.fillRect(25, 17, 1, 1);
  g.fillRect(27, 16, 1, 1);

  // Quatrefoil terminals — four-petal cluster at each quillon tip.
  const drawQuatrefoil = (qx: number, qy: number) => {
    g.fillStyle(0x1a1006, 1);
    g.fillCircle(qx - 1, qy - 1, 1.4);
    g.fillCircle(qx + 1, qy - 1, 1.4);
    g.fillCircle(qx - 1, qy + 1, 1.4);
    g.fillCircle(qx + 1, qy + 1, 1.4);
    g.fillStyle(0x7a5628, 1);
    g.fillCircle(qx - 1, qy - 1, 0.9);
    g.fillCircle(qx + 1, qy - 1, 0.9);
    g.fillCircle(qx - 1, qy + 1, 0.9);
    g.fillCircle(qx + 1, qy + 1, 0.9);
    g.fillStyle(0xbb8a3a, 1);
    g.fillCircle(qx - 1.2, qy - 1.2, 0.5);
    g.fillCircle(qx + 0.8, qy - 1.2, 0.5);
    g.fillStyle(0xffcc55, 0.9);
    g.fillCircle(qx - 1.3, qy - 1.3, 0.2);
    g.fillCircle(qx + 0.7, qy - 1.3, 0.2);
  };
  drawQuatrefoil(4, 14);
  drawQuatrefoil(28, 14);

  // ── Grip — leather-wrapped double-hand hilt with copper wire
  // bands. Wider than before so it reads as "two-handed". ──
  g.fillStyle(0x1a1006, 1);
  g.fillRect(14, 21, 4, 7);
  g.fillStyle(0x3a2816, 1);
  g.fillRect(14, 21, 4, 7);
  g.fillStyle(0x5a3c1e, 1);
  g.fillRect(14, 21, 4, 1);
  // Copper wire bands — three thin rings across the grip
  g.fillStyle(0xaa6028, 1);
  g.fillRect(14, 22.5, 4, 0.5);
  g.fillRect(14, 24.5, 4, 0.5);
  g.fillRect(14, 26.5, 4, 0.5);
  g.fillStyle(0xcc8040, 0.8);
  g.fillRect(14, 22.5, 4, 0.2);
  g.fillRect(14, 24.5, 4, 0.2);
  g.fillRect(14, 26.5, 4, 0.2);
  // Vertical shadow on the right side of the grip
  g.fillStyle(0x1a0e00, 0.5);
  g.fillRect(17, 21, 1, 7);

  // ── Wheel pommel — disc-shaped with a small central boss.
  // Bronze with a warm highlight so it matches the quatrefoils. ──
  g.fillStyle(0x1a1006, 1);
  g.fillCircle(16, 29, 2.8);
  g.fillStyle(0x5a3c18, 1);
  g.fillCircle(16, 29, 2.3);
  g.fillStyle(0xaa7828, 1);
  g.fillCircle(16, 28.8, 1.8);
  g.fillStyle(0xddaa44, 1);
  g.fillCircle(15.6, 28.5, 0.9);
  g.fillStyle(0xffdd77, 0.8);
  g.fillCircle(15.4, 28.3, 0.4);
  // Small boss rivet at pommel centre
  g.fillStyle(0x2a1a08, 1);
  g.fillCircle(16, 29, 0.4);

  g.generateTexture('wicon_claymore', s, s);
  g.destroy();
}

function drawWilliamBladeIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;
  g.fillStyle(0xffaa00, 0.18);
  g.fillCircle(cx, cy, 15);
  g.fillStyle(0xffcc22, 0.22);
  g.fillCircle(cx, cy, 12);
  g.fillStyle(0xffdd44, 0.28);
  g.fillCircle(cx, cy, 9);
  g.lineStyle(1.5, 0xffcc44, 0.6);
  g.strokeCircle(cx, cy, 14);
  g.lineStyle(1, 0xffdd66, 0.4);
  g.strokeCircle(cx, cy, 11);
  g.fillStyle(0x5a3a00, 1);
  g.fillTriangle(cx + 1, cy - 12, cx - 4, cy + 4, cx + 6, cy + 4);
  g.fillStyle(0xaa7a10, 1);
  g.fillTriangle(cx + 1, cy - 11, cx - 3, cy + 3, cx + 5, cy + 3);
  g.fillStyle(0xd4a830, 1);
  g.fillTriangle(cx + 1, cy - 10, cx - 1, cy + 2, cx + 4, cy + 2);
  g.fillStyle(0xffe050, 1);
  g.fillTriangle(cx + 1, cy - 9, cx, cy + 1, cx + 2.5, cy);
  g.fillStyle(0xfff5aa, 0.9);
  g.fillTriangle(cx + 1, cy - 9, cx + 3, cy - 4, cx + 2, cy - 3);
  g.lineStyle(1, 0xffee66, 0.5);
  g.lineBetween(cx + 1, cy - 11, cx - 3, cy + 3);
  g.fillStyle(0x3a2800, 1);
  g.fillRect(cx - 9, cy + 3, 19, 5);
  g.fillStyle(0x7a5410, 1);
  g.fillRect(cx - 8, cy + 4, 17, 3);
  g.fillStyle(0xddaa33, 1);
  g.fillRect(cx - 7, cy + 4, 15, 2);
  g.fillStyle(0xffdd66, 1);
  g.fillRect(cx - 7, cy + 4, 15, 1);
  g.fillStyle(0x3a2800, 1);
  g.fillCircle(cx - 8, cy + 5, 3.5);
  g.fillStyle(0xcc8822, 1);
  g.fillCircle(cx - 8, cy + 5, 2.8);
  g.fillStyle(0xff4444, 1);
  g.fillCircle(cx - 8, cy + 5, 1.6);
  g.fillStyle(0xff9999, 0.8);
  g.fillCircle(cx - 8.4, cy + 4.6, 0.7);
  g.fillStyle(0x3a2800, 1);
  g.fillCircle(cx + 9, cy + 5, 3.5);
  g.fillStyle(0xcc8822, 1);
  g.fillCircle(cx + 9, cy + 5, 2.8);
  g.fillStyle(0x4488ff, 1);
  g.fillCircle(cx + 9, cy + 5, 1.6);
  g.fillStyle(0xaaccff, 0.8);
  g.fillCircle(cx + 8.6, cy + 4.6, 0.7);
  g.fillStyle(0x2a1800, 1);
  g.fillRect(cx - 2, cy + 7, 5, 7);
  g.fillStyle(0xcc9922, 1);
  g.fillRect(cx - 2, cy + 8, 5, 1);
  g.fillRect(cx - 2, cy + 10, 5, 1);
  g.fillRect(cx - 2, cy + 12, 5, 1);
  g.fillStyle(0x3a2808, 0.7);
  g.fillRect(cx - 1, cy + 7, 1.5, 7);
  g.fillStyle(0x2a1800, 1);
  g.fillCircle(cx + 1, cy + 14, 5);
  g.fillStyle(0xaa7820, 1);
  g.fillCircle(cx + 1, cy + 14, 4.2);
  g.fillStyle(0xddaa33, 1);
  g.fillCircle(cx + 1, cy + 13.5, 3.2);
  g.fillStyle(0xffee66, 1);
  g.fillCircle(cx + 0.2, cy + 13, 1.8);
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(cx - 0.3, cy + 12.5, 0.8);
  g.generateTexture('wicon_william_blade', s, s);
  g.destroy();
}

/**
 * Bake every weapon-HUD icon. Called once from BootScene
 * generateAllTextures. Order matches BootScene's original call list.
 */
export function bakeWeaponIcons(scene: Phaser.Scene): void {
  // Base weapons
  drawThistleShotIcon(scene);
  drawCaberTossIcon(scene);
  drawHaggisHurlerIcon(scene);
  drawBagpipeBlastIcon(scene);
  drawScotchMistIcon(scene);
  drawNessieTentacleIcon(scene);
  // Evolutions
  drawThistleStormIcon(scene);
  drawHighlandGamesIcon(scene);
  drawHaggisCannonIcon(scene);
  drawHighlandFlingIcon(scene);
  drawTheHaarIcon(scene);
  drawNessieUnleashedIcon(scene);
  // Standalone + utility
  drawClaymoreIcon(scene);
  drawBagpipesUtilityIcon(scene);
  drawWilliamBladeIcon(scene);
}
