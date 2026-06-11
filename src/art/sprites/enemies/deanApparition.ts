/**
 * `dean_apparition` — ceremonial-robed academic ghost. Design pivot:
 * the MORTARBOARD must be unmistakable — widened to a bold flat
 * board 18px across with a big dangling tassle. Red+gold stole
 * draped across the chest anchors "dean" (Scottish university
 * ceremonial dress). Stern moustachioed face, folded arms, gold
 * chain of office. Silhouette reads "formal academic ghost" before
 * any detail resolves.
 */

import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const DEAN_APPARITION_CANVAS_SIZE = 44;

export function drawDeanApparitionBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = DEAN_APPARITION_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 2 + (frame.breathY ?? 0);

  // ── Ghostly halo — cold blue-grey, two layers. ──
  g.fillStyle(0x6a7890, 0.2);
  g.fillEllipse(cx, cy, 30, 32);
  g.fillStyle(0x6a7890, 0.12);
  g.fillEllipse(cx, cy, 36, 38);

  // ── Gown — long formal robe, black with gold trim. ──
  g.fillStyle(0x0a0a10, 1);
  g.fillTriangle(cx - 13, cy + 18, cx + 13, cy + 18, cx + 4, cy - 3);
  g.fillTriangle(cx - 13, cy + 18, cx - 4, cy - 3, cx + 4, cy - 3);
  g.fillStyle(0x20202a, 1);
  g.fillTriangle(cx - 11, cy + 17, cx + 11, cy + 17, cx + 3, cy - 2);
  g.fillTriangle(cx - 11, cy + 17, cx - 3, cy - 2, cx + 3, cy - 2);
  // Robe folds — three diagonal shadow lines breaking the stiff vertical
  // slab (audit dislike: "vertical robe is stiff"). Slate streaks run
  // outward from the waist towards the hem.
  g.fillStyle(0x05050a, 0.85);
  g.fillTriangle(cx - 6, cy + 6, cx - 5, cy + 6, cx - 9, cy + 17);
  g.fillTriangle(cx + 5, cy + 6, cx + 6, cy + 6, cx + 9, cy + 17);
  g.fillTriangle(cx - 1, cy + 8, cx, cy + 8, cx - 3, cy + 17);
  // Lighter highlight rims either side of the centre panel — adds
  // sculpt rather than flat mass.
  g.fillStyle(0x3a3050, 0.6);
  g.fillRect(cx - 7, cy + 2, 0.7, 14);
  g.fillRect(cx + 6, cy + 2, 0.7, 14);
  // Front vertical slit — gold-piped panel
  g.fillStyle(0x4a3820, 1);
  g.fillRect(cx - 1.5, cy, 3, 16);
  g.fillStyle(0xd8a848, 0.85);
  g.fillRect(cx - 2, cy, 1, 16);
  g.fillRect(cx + 1, cy, 1, 16);
  // Gold hem trim — a horizontal ribbon at the bottom of the robe so
  // the silhouette no longer reads "priest cassock".
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx - 11, cy + 16, 22, 1.4);
  g.fillStyle(0xfadc6a, 0.85);
  g.fillRect(cx - 11, cy + 16, 22, 0.5);

  // ── Red+gold stole across the chest — the dean's ceremonial
  // mark. Two diagonal bands from shoulders to waist. ──
  g.fillStyle(0xaa2020, 1);
  g.fillRect(cx - 9, cy, 4, 12);
  g.fillRect(cx + 5, cy, 4, 12);
  g.fillStyle(0xcc3030, 1);
  g.fillRect(cx - 9, cy, 4, 1);
  g.fillRect(cx + 5, cy, 4, 1);
  // Gold edge piping on the stole
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx - 9, cy, 1, 12);
  g.fillRect(cx - 6, cy, 1, 12);
  g.fillRect(cx + 5, cy, 1, 12);
  g.fillRect(cx + 8, cy, 1, 12);

  // ── Folded arms across the chest — bold horizontal bar with
  // gold-cuff terminals. ──
  g.fillStyle(0x0a0a10, 1);
  g.fillRect(cx - 10, cy + 2, 20, 4);
  g.fillStyle(0x1a1a24, 1);
  g.fillRect(cx - 10, cy + 2, 20, 2);
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx - 10, cy + 2, 1.5, 4);
  g.fillRect(cx + 8.5, cy + 2, 1.5, 4);
  g.fillStyle(0xfadc6a, 0.9);
  g.fillRect(cx - 10, cy + 2, 1, 1);
  g.fillRect(cx + 9, cy + 2, 1, 1);

  // ── Head — pale, angular. Bigger than v1 so the face reads at
  // gameplay scale (audit dislike: "face is small"). ──
  g.fillStyle(0xd8c8b8, 0.95);
  g.fillEllipse(cx, cy - 8, 9.5, 11);
  g.fillStyle(0xe8d8c4, 0.92);
  g.fillEllipse(cx, cy - 9, 7.5, 9);
  // Cheek-shadow pair — gives the face structure instead of a flat oval.
  g.fillStyle(0x8a7860, 0.45);
  g.fillEllipse(cx - 3.2, cy - 6, 1.5, 2);
  g.fillEllipse(cx + 3.2, cy - 6, 1.5, 2);

  // ── MORTARBOARD — big flat black board, 4px thick, with a
  // dangling tassle. This is the signature anchor and must be
  // bold at gameplay scale. ──
  // Board shadow
  g.fillStyle(0x000000, 1);
  g.fillRect(cx - 10, cy - 14, 20, 3);
  // Board main
  g.fillStyle(0x0a0a10, 1);
  g.fillRect(cx - 9, cy - 14, 18, 2.5);
  // Board top edge highlight
  g.fillStyle(0x2a2a34, 1);
  g.fillRect(cx - 9, cy - 14, 18, 0.7);
  // Cap underneath the board (skull-cap)
  g.fillStyle(0x0a0a10, 1);
  g.fillRect(cx - 5, cy - 13, 10, 2);
  g.fillStyle(0x1a1a20, 1);
  g.fillRect(cx - 4, cy - 12, 8, 1);
  // Tassle button at centre of the board
  g.fillStyle(0xd8a848, 1);
  g.fillCircle(cx, cy - 14, 1);
  g.fillStyle(0xfadc6a, 1);
  g.fillCircle(cx, cy - 14, 0.5);
  // Tassle string — hanging down-right from the centre
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx + 1, cy - 13, 0.8, 5);
  // Tassle bob — the gold ball at the end
  g.fillStyle(0xfadc6a, 1);
  g.fillCircle(cx + 1.4, cy - 7, 1.5);
  g.fillStyle(0xffea90, 0.9);
  g.fillCircle(cx + 1.4, cy - 7, 0.8);

  // ── Face — stern features. ──
  // Thick eyebrows (bold line each side)
  g.fillStyle(0x1a0e08, 1);
  g.fillRect(cx - 4, cy - 10, 3, 1);
  g.fillRect(cx + 1, cy - 10, 3, 1);
  // Red-glow eyes under the brows — split tones: deep blood-red core
  // wrapped in a warmer outer bloom and a crisp white pinprick. Reads
  // as a Grave-register threat anchor (audit row: "red eyes add threat").
  g.fillStyle(0xff4020, 0.45);
  g.fillCircle(cx - 2.4, cy - 8.5, 1.4);
  g.fillCircle(cx + 2.4, cy - 8.5, 1.4);
  g.fillStyle(0xc41818, 1);
  g.fillRect(cx - 3, cy - 9, 1.4, 1.1);
  g.fillRect(cx + 1.6, cy - 9, 1.4, 1.1);
  g.fillStyle(0xff5028, 0.95);
  g.fillRect(cx - 2.7, cy - 8.8, 0.7, 0.6);
  g.fillRect(cx + 1.9, cy - 8.8, 0.7, 0.6);
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(cx - 2.5, cy - 8.9, 0.3, 0.3);
  g.fillRect(cx + 2.1, cy - 8.9, 0.3, 0.3);
  // Long drooping handlebar moustache
  g.fillStyle(0x2a1010, 1);
  g.fillRect(cx - 4, cy - 6, 8, 1.5);
  g.fillRect(cx - 5, cy - 5, 2, 1.5);
  g.fillRect(cx + 3, cy - 5, 2, 1.5);
  // Firm-line mouth under the moustache
  g.fillStyle(0x1a0804, 1);
  g.fillRect(cx - 2, cy - 3, 4, 0.8);

  // ── Gold chain of office hanging below the stole — big
  // medallion at centre. ──
  g.fillStyle(0xd8a848, 1);
  g.fillCircle(cx, cy + 8, 1.5);
  g.fillStyle(0xfadc6a, 1);
  g.fillCircle(cx, cy + 8, 0.8);
  // Chain links tiny dots above the medallion
  g.fillStyle(0xd8a848, 0.9);
  g.fillCircle(cx - 1, cy + 6, 0.4);
  g.fillCircle(cx + 1, cy + 6, 0.4);

  // Pale skeletal hand poking out the right cuff, gripping a small
  // rolled parchment scroll. Pushes "academic" not "priest" and gives
  // the heavy mid-band a colour break.
  g.fillStyle(0xd8c8b8, 1);
  g.fillCircle(cx + 8.5, cy + 5.5, 1.5);
  g.fillStyle(0xb0a090, 0.7);
  g.fillRect(cx + 7.5, cy + 5.5, 1, 1.6);
  // Rolled scroll cradled in the hand — parchment cylinder with a
  // dark seal at one end.
  g.fillStyle(0xeadfb8, 1);
  g.fillRect(cx + 6, cy + 6, 4.5, 1.4);
  g.fillStyle(0xf8eec8, 1);
  g.fillRect(cx + 6, cy + 6, 4.5, 0.5);
  g.fillStyle(0x8a6028, 1);
  g.fillRect(cx + 6, cy + 6, 0.6, 1.4);
  // Wax seal at the right end of the scroll
  g.fillStyle(0xc41818, 1);
  g.fillCircle(cx + 10.4, cy + 6.7, 0.7);
  g.fillStyle(0xff5028, 0.85);
  g.fillCircle(cx + 10.4, cy + 6.5, 0.35);

  // Matching skeletal hand on the left cuff — peeks out so both arms
  // resolve. Subtle, doesn't compete with the scroll.
  g.fillStyle(0xd8c8b8, 1);
  g.fillCircle(cx - 8.5, cy + 5.5, 1.4);
  g.fillStyle(0xb0a090, 0.6);
  g.fillRect(cx - 8.5, cy + 5.5, 1, 1.6);

}

export function bakeDeanApparition(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawDeanApparitionBody(g);
  g.generateTexture('dean_apparition', DEAN_APPARITION_CANVAS_SIZE, DEAN_APPARITION_CANVAS_SIZE);
  g.destroy();
}

/**
 * Ledger Wraith — DESIGN_IDEAS section 3 Taxman's Retinue opener.
 * Translucent auditor silhouette, hollow eyes, trailing ledger pages
 * with red-ink drips. The "immune until Taxman takes damage" bullet
 * is deferred pending an event-bus gate — the wraith reads as a
 * Retinue advance scout on pure sprite language, not a new AI state.
 */
