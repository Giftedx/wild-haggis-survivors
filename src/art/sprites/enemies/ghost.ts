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

import Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

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
  g.fillStyle(0x6a1818, 0.55);
  g.fillRect(cx - 2.5, cy - 8, 5, 22);
  // Tartan crossbars
  g.fillStyle(0x2a0a0a, 0.7);
  g.fillRect(cx - 2.5, cy - 5, 5, 1);
  g.fillRect(cx - 2.5, cy + 2, 5, 1);
  g.fillRect(cx - 2.5, cy + 9, 5, 1);
  g.fillStyle(0xdaaa40, 0.6);
  g.fillRect(cx - 0.5, cy - 8, 1, 22);

  // ── Wispy gown bottom — ectoplasm trails instead of hem. ──
  g.fillStyle(0x88aaaa, 0.5);
  for (let i = 0; i < 5; i++) {
    g.fillCircle(cx - 9 + i * 4.5, cy + 17, 3);
  }
  g.fillStyle(0xaaccdc, 0.35);
  for (let i = 0; i < 5; i++) {
    g.fillCircle(cx - 9 + i * 4.5, cy + 19, 2);
  }

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

  // ── HEADLESS NECK STUMP — bloody, the signature anchor. ──
  g.fillStyle(0x4a0808, 1);
  g.fillRect(cx - 2, cy - 11, 4, 3);
  g.fillStyle(0x8a1818, 1);
  g.fillRect(cx - 1.5, cy - 11, 3, 2);
  g.fillStyle(0xc42828, 0.9);
  g.fillRect(cx - 1, cy - 11, 2, 1);
  // Blood drip off the ruff
  g.fillStyle(0x6a1010, 0.9);
  g.fillCircle(cx - 2, cy - 6, 0.8);
  g.fillCircle(cx + 2, cy - 6, 0.7);

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
  // Closed eyes — two small dark slits
  g.fillStyle(0x2a1810, 1);
  g.fillRect(cx - 2.5, cy + 6.5, 1.5, 0.4);
  g.fillRect(cx + 1, cy + 6.5, 1.5, 0.4);
  // Thin line mouth
  g.fillStyle(0x6a2820, 1);
  g.fillRect(cx - 1, cy + 9, 2, 0.4);
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
