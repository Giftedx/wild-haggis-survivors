/**
 * Kelpie-foal companion sprite — Wild Living World Phase 4.
 *
 * A young water-horse who chose to follow. Smaller and rounder than
 * the enemy version — this one is curious, not menacing. Dark teal
 * body with an aqua mane, a single friendly cyan eye. Side-on pony
 * silhouette. Two frames: a gentle head-nod so it reads alive at
 * the small game scale.
 *
 * Sized to 24×20 canvas — perceptibly horse-shaped against the
 * smaller stoat (22×14) and sheepdog (28×24), landing between them.
 * Refs: SCOTTISH_RESEARCH.md §1.1 (kelpie lore), kelpieFoal.ts enemy
 * art for colour-family reference.
 */

import * as Phaser from 'phaser';

export const KELPIE_FOAL_COMPANION_W = 24;
export const KELPIE_FOAL_COMPANION_H = 20;
export const KELPIE_FOAL_COMPANION_FRAME_COUNT = 2;
export const KELPIE_FOAL_COMPANION_TEXTURE_KEYS = [
  'croft_kelpie_foal_f0',
  'croft_kelpie_foal_f1',
] as const;
export type KelpieFoalCompanionTextureKey =
  (typeof KELPIE_FOAL_COMPANION_TEXTURE_KEYS)[number];

interface KelpieFoalFrame {
  headY: number;
  maneY: number;
}

const FRAMES: readonly KelpieFoalFrame[] = [
  { headY: 0, maneY: 0 },
  { headY: 0.8, maneY: 0.4 },
];

const OUTLINE = 0x0a1418;
const BODY = 0x2a4a58;
const BODY_HI = 0x3a6878;
const BODY_SHADE = 0x1a3040;
const MANE = 0x28b8d8;
const MANE_DARK = 0x1890aa;
const EYE = 0x40e8ff;
const EYE_HI = 0xd0faff;
const HOOF = 0x16242e;

export function drawKelpieFoalCompanionFrame(
  g: Phaser.GameObjects.Graphics,
  frameIdx: number,
): void {
  const f = FRAMES[frameIdx % FRAMES.length];

  // Ground shadow — oval, water-horse reads as loch-touched.
  g.fillStyle(OUTLINE, 0.28);
  g.fillEllipse(12, 19, 14, 2.2);

  // Legs — four short legs, dark teal with dark hoof tips.
  const legPairs = [
    [6, 13],
    [9, 13],
    [13, 13],
    [16, 13],
  ] as const;
  for (const [lx, ly] of legPairs) {
    g.fillStyle(OUTLINE, 1);
    g.fillRect(lx, ly, 1.8, 5.5);
    g.fillStyle(BODY, 1);
    g.fillRect(lx + 0.3, ly, 1.2, 4.5);
    g.fillStyle(HOOF, 1);
    g.fillRect(lx + 0.1, ly + 4.6, 1.6, 1.2);
  }

  // Body — compact rounded oval; water-slick sheen.
  g.fillStyle(OUTLINE, 1);
  g.fillRoundedRect(4, 7, 16, 7, 3.5);
  g.fillStyle(BODY, 1);
  g.fillRoundedRect(4.7, 7.5, 14.6, 6, 3);
  g.fillStyle(BODY_HI, 0.75);
  g.fillRoundedRect(6, 7.8, 11, 1.6, 1);
  g.fillStyle(BODY_SHADE, 0.5);
  g.fillRoundedRect(6, 11.4, 11, 1.4, 0.8);

  // Mane — flowing aqua-teal wisps down the neck.
  const mx = 6;
  const my = 6 + f.maneY;
  g.fillStyle(MANE_DARK, 1);
  g.fillEllipse(mx + 0.5, my + 2.2, 3.2, 5.5);
  g.fillStyle(MANE, 0.9);
  g.fillEllipse(mx, my + 1.5, 2.8, 4.5);
  g.fillStyle(MANE, 0.55);
  g.fillEllipse(mx + 2, my + 0.8, 1.8, 3.5);

  // Neck — dark-teal wedge connecting body and head.
  g.fillStyle(OUTLINE, 1);
  g.fillTriangle(4.5, 8 + f.headY, 4.5, 14, 7, 13);
  g.fillStyle(BODY, 1);
  g.fillTriangle(5, 8.5 + f.headY, 5, 13.5, 6.8, 12.5);

  // Head — slightly raised, friendly rounded profile.
  const hx = 3.8;
  const hy = 6 + f.headY;
  g.fillStyle(OUTLINE, 1);
  g.fillRoundedRect(hx - 3, hy, 5.5, 5.5, 1.8);
  g.fillStyle(BODY, 1);
  g.fillRoundedRect(hx - 2.5, hy + 0.5, 4.5, 4.5, 1.5);
  // Snout.
  g.fillStyle(OUTLINE, 1);
  g.fillRoundedRect(hx - 5, hy + 2.2, 2.8, 2.4, 0.8);
  g.fillStyle(BODY_HI, 1);
  g.fillRoundedRect(hx - 4.7, hy + 2.5, 2, 1.8, 0.6);
  // Nostril — tiny.
  g.fillStyle(OUTLINE, 0.7);
  g.fillCircle(hx - 3.6, hy + 3.8, 0.4);

  // Ear — small rounded ear on top.
  g.fillStyle(OUTLINE, 1);
  g.fillTriangle(hx + 0.8, hy, hx + 2.2, hy - 2, hx + 2.8, hy + 0.2);
  g.fillStyle(BODY_HI, 1);
  g.fillTriangle(hx + 0.9, hy - 0.1, hx + 2, hy - 1.6, hx + 2.6, hy + 0.2);

  // Eye — single friendly cyan dot with a soft highlight.
  g.fillStyle(EYE, 1);
  g.fillCircle(hx + 0.3, hy + 1.8, 1.1);
  g.fillStyle(EYE_HI, 0.85);
  g.fillCircle(hx + 0.1, hy + 1.6, 0.45);

  // Tail — flowing aqua tail at the rear.
  g.fillStyle(MANE_DARK, 1);
  g.fillEllipse(20.5, 10.5, 4, 6.5);
  g.fillStyle(MANE, 0.85);
  g.fillEllipse(20.5, 10.2, 3.2, 5.5);
  g.fillStyle(MANE, 0.45);
  g.fillEllipse(21.5, 9, 2, 3.5);
}

export function bakeKelpieFoalCompanionTextures(scene: Phaser.Scene): void {
  for (let i = 0; i < KELPIE_FOAL_COMPANION_FRAME_COUNT; i++) {
    const g = scene.add.graphics();
    drawKelpieFoalCompanionFrame(g, i);
    g.generateTexture(
      KELPIE_FOAL_COMPANION_TEXTURE_KEYS[i],
      KELPIE_FOAL_COMPANION_W,
      KELPIE_FOAL_COMPANION_H,
    );
    g.destroy();
  }
}
