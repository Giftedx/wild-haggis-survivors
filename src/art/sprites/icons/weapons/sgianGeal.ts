import * as Phaser from 'phaser';

/**
 * `wicon_sgian_geal` — evolved Sgian Geal ("white knife"), the
 * ceremonial twin of the sgian dubh. The black-leather grip is now
 * white-bone; the Cairngorm stone is now clear quartz; the blade is
 * a brighter polished silver with a long crit-glint streak running
 * diagonal up the edge + a tiny burst of three sparks at the tip
 * sells "every hit a guaranteed crit". Distinct from the base icon's
 * darker, hidden silhouette — this is the blade brought into the
 * ceilidh light.
 */
export function drawSgianGealIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 16, cy = 16;

  // ── Drop shadow under the blade.
  g.fillStyle(0x000000, 0.4);
  g.fillEllipse(cx + 2, cy + 9, 16, 2.5);

  // ── BLADE — same diagonal as the base icon, but a brighter polished
  // silver-white body with a stronger leading-edge highlight. The
  // "guaranteed crit" tell is two long bright streaks running up the
  // blade edge.
  g.fillStyle(0x0a0a0e, 1);
  g.fillTriangle(cx - 5, cy + 4, cx + 11, cy - 11, cx + 12, cy - 9);
  g.fillTriangle(cx - 5, cy + 4, cx + 12, cy - 9, cx - 4, cy + 6);
  g.fillStyle(0xc8d0d8, 1);
  g.fillTriangle(cx - 4, cy + 4, cx + 11, cy - 10, cx + 11, cy - 9);
  g.fillTriangle(cx - 4, cy + 4, cx + 11, cy - 9, cx - 3, cy + 5);
  // Leading edge — near-white, the polished side that's been
  // sharpened past the point of sharpness (the Whetstone fantasy).
  g.fillStyle(0xf6f8fa, 1);
  g.fillTriangle(cx - 4, cy + 3.5, cx + 11, cy - 10, cx + 10.5, cy - 9.5);
  // Long crit-glint streak — single bright stripe running the length
  // of the blade. Sells "always crit" without shouty text.
  g.fillStyle(0xffffff, 0.85);
  g.fillRect(cx - 1, cy + 1, 11, 0.6);
  g.fillStyle(0xffffff, 0.55);
  g.fillRect(cx + 1, cy - 1.5, 8, 0.4);
  // Tip sparks — three tiny stars where the blade meets the air,
  // suggesting a freshly-cut wake.
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx + 11, cy - 11, 0.8, 0.8);
  g.fillRect(cx + 13, cy - 9, 0.6, 0.6);
  g.fillStyle(0xfff8e0, 1);
  g.fillRect(cx + 12, cy - 13, 0.5, 0.5);

  // ── BOLSTER — silver, slightly brighter than the base icon.
  g.fillStyle(0x0a0a0e, 1);
  g.fillRect(cx - 7, cy + 3, 4, 4);
  g.fillStyle(0xc8d0d8, 1);
  g.fillRect(cx - 6.4, cy + 3.6, 2.8, 2.8);
  g.fillStyle(0xfff0d0, 1);
  g.fillRect(cx - 6, cy + 4, 1.4, 1);

  // ── GRIP — WHITE BONE wrap with diagonal cross-binding stitches in
  // gold thread. The bone-white grip is the single biggest tell: the
  // ceremonial twin to the black-leather sgian dubh.
  g.fillStyle(0x0a0a0e, 1);
  g.fillTriangle(cx - 7, cy + 3, cx - 13, cy + 9, cx - 11, cy + 11);
  g.fillTriangle(cx - 7, cy + 3, cx - 11, cy + 11, cx - 5, cy + 5);
  g.fillStyle(0xe8e0d0, 1);
  g.fillTriangle(cx - 6.5, cy + 3.5, cx - 12, cy + 9, cx - 10.5, cy + 10.5);
  // Bone grain — faint warm streaks.
  g.fillStyle(0xb8a888, 0.5);
  g.fillRect(cx - 10, cy + 5, 4, 0.4);
  g.fillRect(cx - 11, cy + 7, 4, 0.4);
  // Cross-binding stitches (gold thread on white bone)
  g.fillStyle(0xc8a830, 0.9);
  for (let i = 0; i < 3; i++) {
    g.fillRect(cx - 11 + i * 1.6, cy + 6 - i * 0.6, 2.4, 0.4);
    g.fillRect(cx - 11 + i * 1.6, cy + 8 - i * 0.6, 2.4, 0.4);
  }

  // ── POMMEL CAP — silver, with a CLEAR QUARTZ stone (vs the base
  // icon's smoky Cairngorm). The clear stone is the legendary tell;
  // matches the "ceremonial twin brought to the light" fantasy.
  g.fillStyle(0x0a0a0e, 1);
  g.fillCircle(cx - 12, cy + 10, 3.5);
  g.fillStyle(0xc8d0d8, 1);
  g.fillCircle(cx - 12, cy + 10, 2.8);
  g.fillStyle(0xfff0d0, 0.9);
  g.fillCircle(cx - 12.6, cy + 9.4, 1.4);
  // Clear quartz stone (pale white-blue with a strong specular)
  g.fillStyle(0xe0e8f0, 1);
  g.fillCircle(cx - 12, cy + 10, 1.2);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 12.4, cy + 9.7, 0.6);

  // ── Legendary glow halo — gold around the pommel + grip junction.
  // Subtle so it doesn't drown the silhouette.
  g.fillStyle(0xf8d050, 0.18);
  g.fillCircle(cx - 9, cy + 8, 7);
  g.fillStyle(0xfff0a0, 0.12);
  g.fillCircle(cx - 9, cy + 8, 4.5);

  g.generateTexture('wicon_sgian_geal', s, s);
  g.destroy();
}
