/**
 * `ghost` — Mary Queen of Scots revenant. Design pivot: old sprite
 * had a full head/hood/tartan-sash stack that all fell apart at
 * gameplay scale; the beheading mark was a faint line. New pitch —
 * she's HEADLESS, carrying her crowned head in her hands (the
 * Anne Boleyn / Tower-ghost trope transposed onto Mary). The
 * severed-head tell is the anchor: no other ghost in the game
 * holds its own head. Pearl necklace, French collar ruff, trailing
 * ghostly gown with a tartan bleed for Scotland.
 */

import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';
import { HIGHLAND_TARTAN } from '../../kiltPalette';

export const GHOST_CANVAS_SIZE = 40;

export function drawGhostBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = GHOST_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + (frame.breathY ?? 0);

  // ── Ghostly aura — two layers of translucent mist. ──
  g.fillStyle(0x668888, 0.2);
  g.fillEllipse(cx, cy, 34, 32);
  g.fillStyle(0x88aaaa, 0.3);
  g.fillEllipse(cx, cy, 26, 26);

  // ── Long gown — trailing to a wispy bottom (no feet, ghost drift).
  // Pale blue-grey base. ──
  g.fillStyle(0xa0b8c8, 0.8);
  g.fillTriangle(cx - 11, cy + 18, cx + 11, cy + 18, cx + 6, cy - 10);
  g.fillTriangle(cx - 11, cy + 18, cx - 6, cy - 10, cx + 6, cy - 10);
  g.fillStyle(0xc0d0dc, 0.85);
  g.fillTriangle(cx - 9, cy + 17, cx + 9, cy + 17, cx + 5, cy - 9);
  g.fillTriangle(cx - 9, cy + 17, cx - 5, cy - 9, cx + 5, cy - 9);

  // ── Tartan bleed down the centre — red-and-black tartan panel so
  // the "Scots" anchor survives at scale. Semi-translucent. ──
  g.fillStyle(HIGHLAND_TARTAN.field, 0.55);
  g.fillRect(cx - 2.5, cy - 8, 5, 22);
  // Tartan crossbars
  g.fillStyle(HIGHLAND_TARTAN.stripe, 0.7);
  g.fillRect(cx - 2.5, cy - 5, 5, 1);
  g.fillRect(cx - 2.5, cy + 2, 5, 1);
  g.fillRect(cx - 2.5, cy + 9, 5, 1);
  g.fillStyle(HIGHLAND_TARTAN.accent, 0.6);
  g.fillRect(cx - 0.5, cy - 8, 1, 22);

  // ── Wispy gown bottom — ectoplasm trails instead of hem. Layered
  // alternating-height tendrils so the bottom edge feels truly wispy
  // (audit dislike: "body is generic / too close to decoration"). ──
  g.fillStyle(0x88aaaa, 0.55);
  for (let i = 0; i < 5; i++) {
    g.fillCircle(cx - 9 + i * 4.5, cy + 17, 3);
  }
  g.fillStyle(0xaaccdc, 0.4);
  for (let i = 0; i < 5; i++) {
    g.fillCircle(cx - 9 + i * 4.5, cy + 19, 2);
  }
  // Long fading tendril drips — unevenly spaced, three lengths so it
  // doesn't read as a flat scalloped hem.
  g.fillStyle(0xaaccdc, 0.5);
  g.fillTriangle(cx - 8, cy + 16, cx - 6, cy + 16, cx - 7, cy + 22);
  g.fillTriangle(cx - 1, cy + 17, cx + 1, cy + 17, cx, cy + 24);
  g.fillTriangle(cx + 6, cy + 16, cx + 8, cy + 16, cx + 7, cy + 21);
  g.fillStyle(0xc4dee8, 0.32);
  g.fillCircle(cx - 7, cy + 23, 1.2);
  g.fillCircle(cx, cy + 25, 1.4);
  g.fillCircle(cx + 7, cy + 22, 1.1);
  // Faint shadow on the gown front so it sits with depth not as
  // a flat triangle.
  g.fillStyle(0x4a6878, 0.3);
  g.fillTriangle(cx - 6, cy + 16, cx + 6, cy + 16, cx, cy + 4);

  // ── Shoulders + French collar ruff. Headless neck stump ends
  // here — bright white ruff, red bloody stump above. ──
  // Ruff collar (pleated white)
  g.fillStyle(0xf0f4f8, 1);
  g.fillEllipse(cx, cy - 8, 12, 3);
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(cx, cy - 8.5, 10, 2);
  // Pleat ridges
  g.fillStyle(0xc0c8d0, 0.8);
  for (let i = 0; i < 6; i++) g.fillRect(cx - 5 + i * 2, cy - 9, 0.4, 3);

  // ── HEADLESS NECK STUMP — bloody, the signature anchor. Lifted
  // contrast and volume so the red mark dominates (audit dislike:
  // "lower red mark is unclear"). ──
  g.fillStyle(0x2a0404, 1);
  g.fillRect(cx - 2.2, cy - 11, 4.4, 3.2);
  g.fillStyle(0x6a0808, 1);
  g.fillRect(cx - 2, cy - 11, 4, 3);
  g.fillStyle(0xa01818, 1);
  g.fillRect(cx - 1.5, cy - 11, 3, 2);
  g.fillStyle(0xe43030, 0.95);
  g.fillRect(cx - 1, cy - 11, 2, 1);
  // Bright wet glint at the centre — sells fresh blood.
  g.fillStyle(0xff8080, 0.85);
  g.fillRect(cx - 0.3, cy - 11, 0.6, 0.5);
  // Volumetric drips off the ruff — 5 drops instead of 2, varied size.
  g.fillStyle(0x6a1010, 1);
  g.fillCircle(cx - 2.5, cy - 6.2, 1);
  g.fillCircle(cx - 0.2, cy - 5.6, 0.85);
  g.fillCircle(cx + 2.4, cy - 6, 0.95);
  g.fillStyle(0xa01818, 0.95);
  g.fillCircle(cx - 2.5, cy - 6.4, 0.55);
  g.fillCircle(cx + 2.4, cy - 6.2, 0.55);
  g.fillStyle(0xe43030, 0.7);
  g.fillCircle(cx - 1.5, cy - 4.8, 0.4);
  g.fillCircle(cx + 1.5, cy - 4.8, 0.4);

  // ── Pearl necklace — three white dots at the base of the ruff. ──
  g.fillStyle(0xfff8e8, 1);
  g.fillCircle(cx - 2.5, cy - 7, 0.7);
  g.fillCircle(cx, cy - 6.8, 0.8);
  g.fillCircle(cx + 2.5, cy - 7, 0.7);

  // ── HELD HEAD — she's cradling her own severed head in her hands.
  // Positioned down-centre so it reads below the body. This is the
  // Mary-Queen-of-Scots anchor. ──
  // Hands cupping the head
  g.fillStyle(0xd8e6ee, 0.95);
  g.fillCircle(cx - 5, cy + 7, 2);
  g.fillCircle(cx + 5, cy + 7, 2);
  // Head — pale, crowned, eyes-closed
  g.fillStyle(0xe8d8c0, 1);
  g.fillEllipse(cx, cy + 7, 8, 9);
  g.fillStyle(0xf0e0c8, 1);
  g.fillEllipse(cx, cy + 6.5, 7, 8);
  // Auburn hair parted down the middle (Mary was red-haired)
  g.fillStyle(0x6a2810, 1);
  g.fillEllipse(cx, cy + 3.5, 7, 3);
  g.fillRect(cx - 3, cy + 3, 6, 4);
  // Small crown on the head — gold points
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx - 3, cy + 2, 6, 1.2);
  g.fillTriangle(cx - 3, cy + 2, cx - 2, cy + 0.5, cx - 1, cy + 2);
  g.fillTriangle(cx - 1, cy + 2, cx, cy + 0.5, cx + 1, cy + 2);
  g.fillTriangle(cx + 1, cy + 2, cx + 2, cy + 0.5, cx + 3, cy + 2);
  g.fillStyle(0xfadc6a, 1);
  g.fillRect(cx - 3, cy + 2, 6, 0.5);
  // Eye sockets — sunken shadow first so the closed eyes sit IN the
  // skull rather than ON it (audit dislike: "expression is minimal").
  g.fillStyle(0x8a6a48, 0.55);
  g.fillEllipse(cx - 1.7, cy + 6.6, 2.2, 1.2);
  g.fillEllipse(cx + 1.7, cy + 6.6, 2.2, 1.2);
  // Closed eyelid lines — slightly downturned (mournful, not just shut).
  g.fillStyle(0x2a1810, 1);
  g.fillRect(cx - 2.5, cy + 6.5, 1.6, 0.5);
  g.fillRect(cx + 0.9, cy + 6.5, 1.6, 0.5);
  // Tiny lash dot at the outer corner — micro-detail that lifts
  // the closed eye from a generic dash.
  g.fillStyle(0x1a0c08, 1);
  g.fillRect(cx - 2.5, cy + 7, 0.4, 0.3);
  g.fillRect(cx + 2.1, cy + 7, 0.4, 0.3);
  // Tear track — single dark thin line under the right eye, the
  // emotional anchor that no other ghost has.
  g.fillStyle(0x4a2820, 0.7);
  g.fillRect(cx + 1.6, cy + 7.2, 0.3, 1.4);
  // Thin line mouth — slightly downturned at the corners
  g.fillStyle(0x6a2820, 1);
  g.fillRect(cx - 1, cy + 9, 2, 0.4);
  g.fillRect(cx - 1.4, cy + 9.1, 0.4, 0.3);
  g.fillRect(cx + 1, cy + 9.1, 0.4, 0.3);
  // Neck stump at bottom of head
  g.fillStyle(0x8a1818, 0.95);
  g.fillEllipse(cx, cy + 11, 4, 1.5);

  // ── Drifting hair wisps from where her head used to be. ──
  g.fillStyle(0x6a2810, 0.5);
  g.fillCircle(cx - 4, cy - 13, 1.5);
  g.fillCircle(cx + 4, cy - 13, 1.5);
  g.fillCircle(cx, cy - 15, 1.8);
  g.fillStyle(0x8a4028, 0.4);
  g.fillCircle(cx, cy - 14, 1.2);
}

export function bakeGhost(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawGhostBody(g);
  g.generateTexture('ghost', GHOST_CANVAS_SIZE, GHOST_CANVAS_SIZE);
  g.destroy();
}
