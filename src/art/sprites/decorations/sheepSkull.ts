/**
 * `deco_sheep_skull` — peat-bleached blackface sheep skull on the
 * moor. The bones got a rough decade up here. Two curling black
 * horn stumps still attached, sun-yellowed bone, dark hollows where
 * eyes used to be. Glesga grim humour anchored in real Highland
 * landscape — sheep skulls are a real find on the moor (see
 * `docs/research/SCOTTISH_RESEARCH_DEEP.md` part 14: Land & Climate).
 */

import * as Phaser from 'phaser';

const BONE_OUTLINE = 0x4a3820;
const BONE_BASE = 0xc8b48c;
const BONE_MID = 0xe6d4ac;
const BONE_HI = 0xfaecc8;
const BONE_STAIN = 0x8a7050;
const SOCKET_DEEP = 0x0a0604;
const SOCKET_RIM = 0x32200c;
const HORN_OUTLINE = 0x080808;
const HORN_BASE = 0x2a2018;
const HORN_HI = 0x4a3a28;
const NASAL_SHADE = 0x6a4828;

export function bakeSheepSkull(scene: Phaser.Scene): void {
  const s = 28;
  const g = scene.add.graphics();
  const cx = s / 2;
  const cy = s / 2 + 1;

  // Soft contact shadow tucked underneath.
  g.fillStyle(0x000000, 0.32);
  g.fillEllipse(cx, cy + 7, 18, 3.4);
  g.fillStyle(0x000000, 0.5);
  g.fillEllipse(cx, cy + 7, 12, 1.8);

  // Skull silhouette — broader cranium, narrower muzzle.
  // Cranium.
  g.fillStyle(BONE_OUTLINE, 1);
  g.fillEllipse(cx, cy - 1, 16, 11);
  g.fillStyle(BONE_BASE, 1);
  g.fillEllipse(cx, cy - 1, 14, 9.5);
  g.fillStyle(BONE_MID, 1);
  g.fillEllipse(cx - 1, cy - 2, 12, 7);
  g.fillStyle(BONE_HI, 0.85);
  g.fillEllipse(cx - 2, cy - 3.4, 8, 3);

  // Muzzle protrusion (snout).
  g.fillStyle(BONE_OUTLINE, 1);
  g.fillEllipse(cx, cy + 5, 8, 5);
  g.fillStyle(BONE_BASE, 1);
  g.fillEllipse(cx, cy + 5, 6.8, 4);
  g.fillStyle(BONE_MID, 1);
  g.fillEllipse(cx, cy + 4.4, 5.6, 3);
  g.fillStyle(BONE_HI, 0.7);
  g.fillEllipse(cx - 1, cy + 4, 3.4, 1);

  // Peat stain — dark brown wash across the lower half.
  g.fillStyle(BONE_STAIN, 0.6);
  g.fillEllipse(cx, cy + 4, 7, 3);
  g.fillStyle(BONE_STAIN, 0.4);
  g.fillEllipse(cx + 4, cy + 1, 4, 2);

  // Eye sockets — deep dark hollows with a hairline rim shadow.
  g.fillStyle(SOCKET_RIM, 1);
  g.fillEllipse(cx - 4, cy - 2, 4.4, 3.6);
  g.fillEllipse(cx + 4, cy - 2, 4.4, 3.6);
  g.fillStyle(SOCKET_DEEP, 1);
  g.fillEllipse(cx - 4, cy - 2, 3.4, 2.8);
  g.fillEllipse(cx + 4, cy - 2, 3.4, 2.8);
  // Hollow shimmer — single bright sliver in each socket.
  g.fillStyle(BONE_HI, 0.32);
  g.fillRect(cx - 5, cy - 2.4, 0.4, 0.6);
  g.fillRect(cx + 4.6, cy - 2.4, 0.4, 0.6);

  // Frontal ridge — between the eyes.
  g.fillStyle(BONE_OUTLINE, 0.6);
  g.fillRect(cx - 0.4, cy - 4, 0.8, 4);
  g.fillStyle(BONE_HI, 0.85);
  g.fillRect(cx - 0.2, cy - 4, 0.4, 4);

  // Nasal cavity — small dark triangle on the muzzle.
  g.fillStyle(NASAL_SHADE, 1);
  g.fillTriangle(cx, cy + 2, cx - 1.4, cy + 4.8, cx + 1.4, cy + 4.8);
  g.fillStyle(SOCKET_DEEP, 1);
  g.fillTriangle(cx, cy + 2.4, cx - 1, cy + 4.4, cx + 1, cy + 4.4);

  // Tooth row — five tiny pale rectangles along the lower jaw.
  g.fillStyle(BONE_HI, 0.95);
  for (let i = 0; i < 5; i++) {
    g.fillRect(cx - 2.4 + i * 1.1, cy + 6.4, 0.7, 1);
  }
  g.fillStyle(SOCKET_DEEP, 0.7);
  g.fillRect(cx - 2.4, cy + 6.4, 5.4, 0.4);

  // Hairline crack across the cranium — adds character.
  g.fillStyle(SOCKET_DEEP, 0.85);
  g.fillRect(cx - 5, cy - 5.4, 5, 0.4);
  g.fillRect(cx, cy - 5.6, 4, 0.4);

  // ── HORNS ───────────────────────────────────────────────────────
  // Left horn — curls back and down (blackface sheep curl).
  g.fillStyle(HORN_OUTLINE, 1);
  g.fillEllipse(cx - 8, cy - 5, 6, 4.5);
  g.fillStyle(HORN_BASE, 1);
  g.fillEllipse(cx - 8, cy - 5, 5, 3.6);
  g.fillStyle(HORN_HI, 0.85);
  g.fillEllipse(cx - 8.4, cy - 5.6, 3, 1.2);
  // Curl tip.
  g.fillStyle(HORN_OUTLINE, 1);
  g.fillEllipse(cx - 11, cy - 3.4, 3.4, 2.4);
  g.fillStyle(HORN_BASE, 1);
  g.fillEllipse(cx - 11, cy - 3.4, 2.6, 1.8);
  // Growth ridges.
  g.fillStyle(HORN_OUTLINE, 0.7);
  g.fillRect(cx - 10, cy - 5.4, 0.5, 1.4);
  g.fillRect(cx - 8, cy - 5.4, 0.5, 1.4);
  g.fillRect(cx - 6, cy - 5.4, 0.5, 1.4);

  // Right horn — mirror.
  g.fillStyle(HORN_OUTLINE, 1);
  g.fillEllipse(cx + 8, cy - 5, 6, 4.5);
  g.fillStyle(HORN_BASE, 1);
  g.fillEllipse(cx + 8, cy - 5, 5, 3.6);
  g.fillStyle(HORN_HI, 0.85);
  g.fillEllipse(cx + 7.6, cy - 5.6, 3, 1.2);
  g.fillStyle(HORN_OUTLINE, 1);
  g.fillEllipse(cx + 11, cy - 3.4, 3.4, 2.4);
  g.fillStyle(HORN_BASE, 1);
  g.fillEllipse(cx + 11, cy - 3.4, 2.6, 1.8);
  g.fillStyle(HORN_OUTLINE, 0.7);
  g.fillRect(cx + 9.5, cy - 5.4, 0.5, 1.4);
  g.fillRect(cx + 7.5, cy - 5.4, 0.5, 1.4);
  g.fillRect(cx + 5.5, cy - 5.4, 0.5, 1.4);

  // A wee tuft of bog cotton growing out of the eye socket — life
  // returning to the bones. The Soul Charter Hearth weave through
  // the Grave palette.
  g.fillStyle(0x3a5028, 1);
  g.fillRect(cx + 4, cy - 3, 0.4, 1.6);
  g.fillStyle(0xeae6dc, 1);
  g.fillCircle(cx + 4.2, cy - 4.4, 0.7);
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(cx + 4, cy - 4.6, 0.3);

  g.generateTexture('deco_sheep_skull', s, s);
  g.destroy();
}
