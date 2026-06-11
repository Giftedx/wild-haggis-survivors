import * as Phaser from 'phaser';

/**
 * `wicon_sgian_dubh` — the sgian dubh ("black knife") tucked in the
 * Highland stocking. Diagonal blade pointing upper-right with a black-
 * leather wrapped grip + silver pommel + Cairngorm purple stone in the
 * pommel cap. Cold-steel highlight along the blade edge sells the
 * "freshly whetted" character. Distinct from the claymore icon's heft
 * + the shinty stick's wood — this is a small, surgical, hidden blade.
 */
export function drawSgianDubhIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = 16, cy = 16;

  // ── Drop shadow under the blade.
  g.fillStyle(0x000000, 0.4);
  g.fillEllipse(cx + 2, cy + 9, 16, 2.5);

  // ── BLADE — diagonal from lower-left to upper-right. Dark outline
  // + cold-steel body + bright leading edge highlight. The blade's
  // tip points at roughly 1 o'clock; the spine sits just below the
  // edge so the highlight reads as the SHARPENED side.
  // Outline (dark steel)
  g.fillStyle(0x0a0a0e, 1);
  g.fillTriangle(cx - 5, cy + 4, cx + 11, cy - 11, cx + 12, cy - 9);
  g.fillTriangle(cx - 5, cy + 4, cx + 12, cy - 9, cx - 4, cy + 6);
  // Cold steel body
  g.fillStyle(0x88909a, 1);
  g.fillTriangle(cx - 4, cy + 4, cx + 11, cy - 10, cx + 11, cy - 9);
  g.fillTriangle(cx - 4, cy + 4, cx + 11, cy - 9, cx - 3, cy + 5);
  // Bright leading edge (the cutting side, lit warm-cool)
  g.fillStyle(0xd8dde4, 1);
  g.fillTriangle(cx - 4, cy + 3.5, cx + 11, cy - 10, cx + 10.5, cy - 9.5);
  // Specular flash near the spine (single bright dot)
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx + 3, cy - 2, 1.4, 0.7);
  g.fillStyle(0xfff8e0, 0.7);
  g.fillRect(cx + 6, cy - 5, 1, 0.5);

  // ── BOLSTER — small silver collar between blade and grip.
  g.fillStyle(0x0a0a0e, 1);
  g.fillRect(cx - 7, cy + 3, 4, 4);
  g.fillStyle(0xb8c0c8, 1);
  g.fillRect(cx - 6.4, cy + 3.6, 2.8, 2.8);
  g.fillStyle(0xe0e8ee, 1);
  g.fillRect(cx - 6, cy + 4, 1.4, 1);

  // ── GRIP — black-leather wrap with diagonal cross-binding stitches
  // (the proper sgian-dubh grip pattern). Slightly wider at the pommel
  // so the silhouette reads as "knife", not "shiv".
  g.fillStyle(0x0a0a0e, 1);
  g.fillTriangle(cx - 7, cy + 3, cx - 13, cy + 9, cx - 11, cy + 11);
  g.fillTriangle(cx - 7, cy + 3, cx - 11, cy + 11, cx - 5, cy + 5);
  g.fillStyle(0x281810, 1);
  g.fillTriangle(cx - 6.5, cy + 3.5, cx - 12, cy + 9, cx - 10.5, cy + 10.5);
  // Cross-binding stitches (silver thread on black leather)
  g.fillStyle(0xa8b0b8, 0.85);
  for (let i = 0; i < 3; i++) {
    g.fillRect(cx - 11 + i * 1.6, cy + 6 - i * 0.6, 2.4, 0.4);
    g.fillRect(cx - 11 + i * 1.6, cy + 8 - i * 0.6, 2.4, 0.4);
  }

  // ── POMMEL CAP — silver, with a small purple Cairngorm stone set
  // in the centre. The stone is the only colour on the icon outside
  // the steel/leather palette; sells "ceremonial dress dagger".
  g.fillStyle(0x0a0a0e, 1);
  g.fillCircle(cx - 12, cy + 10, 3.5);
  g.fillStyle(0xb8c0c8, 1);
  g.fillCircle(cx - 12, cy + 10, 2.8);
  g.fillStyle(0xe0e8ee, 0.9);
  g.fillCircle(cx - 12.6, cy + 9.4, 1.4);
  // Cairngorm stone (smoky purple)
  g.fillStyle(0x5a3a8a, 1);
  g.fillCircle(cx - 12, cy + 10, 1.2);
  g.fillStyle(0x9878c8, 1);
  g.fillCircle(cx - 12.4, cy + 9.7, 0.6);

  g.generateTexture('wicon_sgian_dubh', s, s);
  g.destroy();
}
