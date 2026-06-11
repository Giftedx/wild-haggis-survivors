import * as Phaser from 'phaser';

export function drawBagpipesUtilityIcon(scene: Phaser.Scene): void {
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
