/**
 * Golden Eagle perched companion sprite — Wild Living World Phase 3.
 *
 * The eagle is drawn as a perched bird: wings folded tight, head
 * upright, talons gripping an invisible surface. Two frames alternate
 * a slow head-turn (frame 0: looking forward, frame 1: glancing left)
 * so it reads as watchful rather than frozen.
 *
 * Palette follows the real golden eagle field marks:
 *   - rich amber-brown back and upperwings
 *   - tawny golden nape (the field mark that gives the species its name)
 *   - pale cream buff underparts, faintly streaked
 *   - hooked dark-grey bill with a yellow cere
 *   - bright amber-yellow eye, fierce
 *   - white tail with a broad dark terminal band
 *   - pale yellow tarsi + talons
 *
 * Canvas 24×22: taller than wide (perched birds occupy vertical space).
 * Sheepdog is 28×24 — the eagle reads slightly smaller in footprint
 * but draws taller, giving it its own distinct silhouette.
 *
 * Refs: `SCOTTISH_RESEARCH_DEEP.md` §3.2 (Cairngorm raptors),
 *       `SCOTTISH_RESEARCH.md` §1.3 (eagle as apex of the highland sky).
 */

import * as Phaser from 'phaser';

export const EAGLE_PERCH_CANVAS_W = 24;
export const EAGLE_PERCH_CANVAS_H = 22;
export const EAGLE_PERCH_FRAME_COUNT = 2;
export const EAGLE_PERCH_TEXTURE_KEYS = [
  'croft_eagle_perch_f0',
  'croft_eagle_perch_f1',
] as const;
export type EaglePerchTextureKey = (typeof EAGLE_PERCH_TEXTURE_KEYS)[number];

// Palette
const OUTLINE      = 0x1a0e08;
const BACK         = 0x6e3a18;
const BACK_HI      = 0x9a5428;
const NAPE         = 0xc48a3a;
const NAPE_HI      = 0xe8b054;
const BELLY        = 0xd4b882;
const BELLY_SHADE  = 0xb09060;
const TAIL         = 0xe8e0c8;
const TAIL_BAND    = 0x241808;
const BILL         = 0x38322c;
const CERE         = 0xe8c840;
const EYE_RIM      = 0xd89028;
const EYE          = 0xc47a18;
const EYE_HI       = 0xffffff;
const TARSUS       = 0xe8c040;
const TALON        = 0x241808;

export function drawEaglePerchedFrame(
  g: Phaser.GameObjects.Graphics,
  frameIdx: number,
): void {
  // Frame 1: head turned 2px left for the glance.
  const headOffsetX = frameIdx === 1 ? -2 : 0;

  // Ground shadow — compact oval beneath the talons.
  g.fillStyle(OUTLINE, 0.28);
  g.fillEllipse(12, 21, 12, 2.4);

  // Tail — broad fan splaying behind, white with dark terminal band.
  g.fillStyle(TAIL_BAND, 1);
  g.fillRoundedRect(5, 16, 10, 4, 1.5);
  g.fillStyle(TAIL, 1);
  g.fillRoundedRect(5.8, 14, 8.4, 4.5, 1.2);
  g.fillStyle(TAIL_BAND, 1);
  g.fillRect(5.8, 18, 8.4, 1.2);

  // Tarsi + talons — stout yellow legs, dark curved claws.
  g.fillStyle(TARSUS, 1);
  g.fillRect(10, 18, 1.8, 3.5);
  g.fillRect(14, 18, 1.8, 3.5);
  g.fillStyle(TALON, 1);
  // Front talons.
  g.fillEllipse(10, 21.8, 4, 1);
  g.fillEllipse(15, 21.8, 4, 1);
  // Tarsus outline.
  g.lineStyle(0.5, OUTLINE, 0.6);
  g.strokeRect(10, 18, 1.8, 3.5);
  g.strokeRect(14, 18, 1.8, 3.5);

  // Body — deep rounded torso, broad at shoulder.
  g.fillStyle(OUTLINE, 1);
  g.fillRoundedRect(7, 8, 12, 12, 4);
  g.fillStyle(BACK, 1);
  g.fillRoundedRect(7.8, 8.8, 10.4, 10.2, 3.2);
  // Back highlight.
  g.fillStyle(BACK_HI, 0.7);
  g.fillRoundedRect(8.6, 9.2, 6, 2.6, 1.5);

  // Belly / breast — paler area on the front.
  g.fillStyle(BELLY, 1);
  g.fillRoundedRect(9, 12.5, 6.5, 5.5, 2.5);
  g.fillStyle(BELLY_SHADE, 0.5);
  g.fillRect(9.4, 15.5, 5.6, 1.4);

  // Folded wings — slightly darker than back, subtle secondary feather lines.
  g.fillStyle(BACK, 1);
  g.fillRoundedRect(7.5, 9, 3.5, 8, 1.8);
  g.fillRoundedRect(15.5, 9, 3.5, 8, 1.8);
  g.lineStyle(0.8, OUTLINE, 0.3);
  for (let i = 0; i < 3; i++) {
    g.strokeLineShape(new Phaser.Geom.Line(8, 11 + i * 1.8, 10, 12.5 + i * 1.8));
    g.strokeLineShape(new Phaser.Geom.Line(16, 11 + i * 1.8, 18.2, 12.5 + i * 1.8));
  }

  // Nape — the golden crown that names the species.
  g.fillStyle(OUTLINE, 1);
  g.fillCircle(12 + headOffsetX, 6, 5.4);
  g.fillStyle(NAPE, 1);
  g.fillCircle(12 + headOffsetX, 6, 4.8);
  g.fillStyle(NAPE_HI, 0.65);
  g.fillEllipse(12 + headOffsetX, 4.4, 4, 2);

  // Eye.
  g.fillStyle(EYE_RIM, 1);
  g.fillCircle(13.2 + headOffsetX, 5.6, 1.4);
  g.fillStyle(EYE, 1);
  g.fillCircle(13.2 + headOffsetX, 5.6, 1.0);
  g.fillStyle(EYE_HI, 0.9);
  g.fillCircle(13.5 + headOffsetX, 5.3, 0.4);

  // Bill — hooked, dark, with yellow cere at base.
  g.fillStyle(CERE, 1);
  g.fillEllipse(15.6 + headOffsetX, 6.8, 2.6, 1.2);
  g.fillStyle(BILL, 1);
  g.fillTriangle(
    14.4 + headOffsetX, 6.6,
    17.8 + headOffsetX, 6.8,
    15.2 + headOffsetX, 8.6,
  );
  // Hook tip.
  g.fillStyle(BILL, 1);
  g.fillEllipse(15.2 + headOffsetX, 8.8, 1.4, 1.2);
}

export function bakeEaglePerchedTextures(scene: Phaser.Scene): void {
  for (let i = 0; i < EAGLE_PERCH_FRAME_COUNT; i++) {
    const g = scene.add.graphics();
    drawEaglePerchedFrame(g, i);
    g.generateTexture(
      EAGLE_PERCH_TEXTURE_KEYS[i],
      EAGLE_PERCH_CANVAS_W,
      EAGLE_PERCH_CANVAS_H,
    );
    g.destroy();
  }
}
