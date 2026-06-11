/**
 * `ledger_wraith` — floating clerk-spirit from the Taxman's retinue.
 * Design pivot (v3): the book-as-silhouette version read as "flying
 * ledger" at 40px because the head + robes were both narrow and
 * secondary. New pitch: invert the hierarchy. The WRAITH BODY is
 * the silhouette — big hooded robe filling 60% of the canvas. Big
 * pale skull-face with BLAZING RED EYE SOCKETS is the centre mass
 * and kill-target anchor. Ledger is held SMALL at chest height
 * (16×6, half its former size) with a red quill stabbed into it.
 * Red-ink drip trail cascades down the front of the robe as the
 * threat beat. Ghost first, audit tool second.
 */

import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const LEDGER_WRAITH_CANVAS_SIZE = 40;

export function drawLedgerWraithBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = LEDGER_WRAITH_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 2 + (frame.breathY ?? 0);

  // ── Ghostly halo — cold paper-blue, two layers wider than before
  // so the wraith silhouette reads first. ──
  g.fillStyle(0x8899aa, 0.15);
  g.fillEllipse(cx, cy, 36, 38);
  g.fillStyle(0x8899aa, 0.22);
  g.fillEllipse(cx, cy, 28, 30);

  // ── HOODED ROBE — the dominant silhouette. Tall cowl peak at the
  // top, broad shoulders, tapering to jagged hem at the bottom. ──
  // Outline shadow (near-black)
  g.fillStyle(0x0a0a14, 1);
  g.fillTriangle(cx - 14, cy + 15, cx + 14, cy + 15, cx, cy - 14);
  // Robe body — dark slate
  g.fillStyle(0x1a1a2a, 1);
  g.fillTriangle(cx - 12, cy + 14, cx + 12, cy + 14, cx, cy - 13);
  // Inner robe highlight — slightly lighter where light catches the cowl
  g.fillStyle(0x2a2a3a, 1);
  g.fillTriangle(cx - 9, cy + 12, cx + 9, cy + 12, cx, cy - 11);
  // Cape volume — diagonal blood-purple fold streaks breaking the
  // static slab silhouette (audit dislike: "body is static" + "palette
  // is subdued"). Adds a colour hint without losing the wraith mood.
  g.fillStyle(0x3a1a3a, 0.7);
  g.fillTriangle(cx - 8, cy - 4, cx - 7, cy - 4, cx - 11, cy + 13);
  g.fillTriangle(cx + 7, cy - 4, cx + 8, cy - 4, cx + 11, cy + 13);
  g.fillStyle(0x4a2050, 0.55);
  g.fillTriangle(cx - 4, cy + 2, cx - 3, cy + 2, cx - 5, cy + 13);
  g.fillTriangle(cx + 3, cy + 2, cx + 4, cy + 2, cx + 5, cy + 13);
  // Trailing wisp on the left — implies drift motion behind the wraith.
  g.fillStyle(0x1a1a2a, 0.65);
  g.fillTriangle(cx - 13, cy + 8, cx - 17, cy + 14, cx - 12, cy + 14);
  g.fillStyle(0x2a2a3a, 0.4);
  g.fillCircle(cx - 16, cy + 12, 1.4);
  // Jagged tattered hem — three downward teeth at the bottom
  g.fillStyle(0x0a0a14, 1);
  g.fillTriangle(cx - 10, cy + 14, cx - 6, cy + 14, cx - 8, cy + 17);
  g.fillTriangle(cx - 2, cy + 14, cx + 2, cy + 14, cx, cy + 18);
  g.fillTriangle(cx + 6, cy + 14, cx + 10, cy + 14, cx + 8, cy + 17);

  // ── Cowl HOOD interior — darker pocket around the face so the
  // skull pops out of shadow. ──
  g.fillStyle(0x050508, 1);
  g.fillEllipse(cx, cy - 8, 12, 11);

  // ── SKULL FACE — big, pale, dominant. This is the silhouette
  // centre of mass. ──
  g.fillStyle(0xddd4b0, 1);
  g.fillEllipse(cx, cy - 8, 9, 10);
  g.fillStyle(0xe8dec0, 1);
  g.fillEllipse(cx - 0.5, cy - 9, 7, 8);
  // Gaunt cheek hollows
  g.fillStyle(0x3a3020, 0.7);
  g.fillEllipse(cx - 3.5, cy - 6, 1.8, 2.5);
  g.fillEllipse(cx + 3.5, cy - 6, 1.8, 2.5);
  // Jaw line shadow
  g.fillStyle(0x8a7e60, 0.6);
  g.fillRect(cx - 3, cy - 4, 6, 0.8);

  // ── BLAZING RED EYE SOCKETS — the threat anchor. Big hollow
  // black sockets with a burning red glow inside. ──
  // Socket outer glow
  g.fillStyle(0xff3030, 0.45);
  g.fillCircle(cx - 2.5, cy - 9, 2.5);
  g.fillCircle(cx + 2.5, cy - 9, 2.5);
  // Hollow black pits
  g.fillStyle(0x000000, 1);
  g.fillEllipse(cx - 2.5, cy - 9, 3, 3);
  g.fillEllipse(cx + 2.5, cy - 9, 3, 3);
  // Burning red embers inside
  g.fillStyle(0xcc1818, 1);
  g.fillCircle(cx - 2.5, cy - 9, 1.2);
  g.fillCircle(cx + 2.5, cy - 9, 1.2);
  g.fillStyle(0xff5a3a, 1);
  g.fillCircle(cx - 2.5, cy - 9, 0.6);
  g.fillCircle(cx + 2.5, cy - 9, 0.6);

  // ── Thin sneering slit mouth — full of teeth. ──
  g.fillStyle(0x000000, 1);
  g.fillRect(cx - 3, cy - 4, 6, 1);
  g.fillStyle(0xddd4b0, 0.9);
  g.fillRect(cx - 2.5, cy - 4, 0.6, 1);
  g.fillRect(cx - 1, cy - 4, 0.6, 1);
  g.fillRect(cx + 0.5, cy - 4, 0.6, 1);
  g.fillRect(cx + 2, cy - 4, 0.6, 1);

  // ── Bony skeletal hands gripping the ledger at chest level.
  // Drawn BEFORE the ledger so the fingers curl over the cover. Lifted
  // contrast + bigger so they actually read (audit dislike: "hands are
  // hard to see"). ──
  g.fillStyle(0xeae0c0, 1);
  g.fillCircle(cx - 9, cy + 2, 2.2);
  g.fillCircle(cx + 9, cy + 2, 2.2);
  // Knuckle bone segmentation — three small dark stripes per hand so
  // the fingers actually resolve.
  g.fillStyle(0x4a3820, 0.9);
  g.fillRect(cx - 10, cy + 2.6, 0.4, 1.4);
  g.fillRect(cx - 9.4, cy + 2.6, 0.4, 1.4);
  g.fillRect(cx - 8.8, cy + 2.6, 0.4, 1.4);
  g.fillRect(cx + 8.6, cy + 2.6, 0.4, 1.4);
  g.fillRect(cx + 9.2, cy + 2.6, 0.4, 1.4);
  g.fillRect(cx + 9.8, cy + 2.6, 0.4, 1.4);
  // Wrist bone hint — pale highlight strip leading into the cuff.
  g.fillStyle(0xfdf2d0, 0.85);
  g.fillRect(cx - 9.5, cy + 0.8, 1.4, 0.5);
  g.fillRect(cx + 8.1, cy + 0.8, 1.4, 0.5);

  // ── Ledger — slightly larger, with visible page numerals so the
  // tax-tool reads at scale (audit dislike: "ledger pages are tiny"). ──
  g.fillStyle(0x0a0a14, 1);
  g.fillRect(cx - 9, cy + 0, 18, 8);
  g.fillStyle(0x3a2010, 1);
  g.fillRect(cx - 8.5, cy + 0.5, 17, 7);
  // Cover gold trim — corner bands so the ledger reads as a bound book.
  g.fillStyle(0xc89028, 1);
  g.fillRect(cx - 8.5, cy + 0.5, 1.2, 1.2);
  g.fillRect(cx + 7.3, cy + 0.5, 1.2, 1.2);
  g.fillRect(cx - 8.5, cy + 6.3, 1.2, 1.2);
  g.fillRect(cx + 7.3, cy + 6.3, 1.2, 1.2);
  // Parchment pages
  g.fillStyle(0xeadfb8, 1);
  g.fillRect(cx - 8, cy + 1.2, 7, 6);
  g.fillRect(cx + 1, cy + 1.2, 7, 6);
  g.fillStyle(0xf8eec8, 1);
  g.fillRect(cx - 8, cy + 1.2, 7, 0.5);
  g.fillRect(cx + 1, cy + 1.2, 7, 0.5);
  // Spine crease
  g.fillStyle(0x1a1006, 0.85);
  g.fillRect(cx - 0.4, cy + 1.2, 0.8, 6);
  // Ruled lines — three per page (was two), thicker so they read.
  g.fillStyle(0x1a1028, 0.9);
  g.fillRect(cx - 8, cy + 2.4, 7, 0.5);
  g.fillRect(cx - 8, cy + 4, 7, 0.5);
  g.fillRect(cx - 8, cy + 5.6, 7, 0.5);
  g.fillRect(cx + 1, cy + 2.4, 7, 0.5);
  g.fillRect(cx + 1, cy + 4, 7, 0.5);
  g.fillRect(cx + 1, cy + 5.6, 7, 0.5);
  // Numeral hints on the LEFT page — short black bars suggesting
  // hand-written totals (the wraith is cataloguing your debts).
  g.fillStyle(0x0a0610, 1);
  g.fillRect(cx - 7.5, cy + 2, 1.4, 0.3);
  g.fillRect(cx - 5.5, cy + 2, 0.8, 0.3);
  g.fillRect(cx - 7.5, cy + 3.6, 0.6, 0.3);
  g.fillRect(cx - 6.4, cy + 3.6, 1.6, 0.3);
  g.fillRect(cx - 7.5, cy + 5.2, 1.2, 0.3);
  g.fillRect(cx - 5.7, cy + 5.2, 1, 0.3);
  // Red column line down the right page — running tally column.
  g.fillStyle(0x8a1818, 1);
  g.fillRect(cx + 5, cy + 1.4, 0.4, 5.6);
  // Red tally marks on right page — bigger, in two rows.
  g.fillStyle(0xcc2020, 1);
  g.fillRect(cx + 2, cy + 2.8, 2.4, 0.5);
  g.fillRect(cx + 5.6, cy + 2.8, 2, 0.5);
  g.fillRect(cx + 2, cy + 5.2, 2.4, 0.5);
  g.fillRect(cx + 5.6, cy + 5.2, 1.6, 0.5);

  // ── Red quill pen stabbed into the ledger at an angle — the
  // "ready to strike your name out" beat. ──
  g.fillStyle(0x8a1818, 1);
  g.fillTriangle(cx + 3, cy - 2, cx + 8, cy - 7, cx + 4, cy - 1);
  g.fillStyle(0xcc3030, 1);
  g.fillTriangle(cx + 3.5, cy - 2.5, cx + 7.5, cy - 6.5, cx + 4, cy - 1.5);
  // Quill tip (nib) resting on the page
  g.fillStyle(0x000000, 1);
  g.fillTriangle(cx + 3, cy - 1, cx + 3.5, cy + 0.5, cx + 4, cy - 1);

  // ── Red-ink drip trail cascading down the front of the robe —
  // aggressive threat beat. 4 drops of descending size. ──
  g.fillStyle(0xcc1818, 1);
  g.fillCircle(cx - 1, cy + 8, 1.6);
  g.fillStyle(0xcc1818, 0.9);
  g.fillCircle(cx + 2, cy + 10, 1.3);
  g.fillStyle(0xcc1818, 0.75);
  g.fillCircle(cx - 1, cy + 12, 1);
  g.fillStyle(0xcc1818, 0.55);
  g.fillCircle(cx + 1, cy + 15, 0.7);
  // Splatter dots
  g.fillStyle(0x881818, 0.8);
  g.fillCircle(cx - 3, cy + 9, 0.5);
  g.fillCircle(cx + 4, cy + 12, 0.5);

}

export function bakeLedgerWraith(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawLedgerWraithBody(g);
  g.generateTexture('ledger_wraith', LEDGER_WRAITH_CANVAS_SIZE, LEDGER_WRAITH_CANVAS_SIZE);
  g.destroy();
}

/**
 * Auditor Priest — DESIGN_IDEAS section 3 Taxman's Retinue #2.
 * Monastic, censer-tipped staff, book in the other hand. The "beam
 * ranged" bullet is deferred pending a beam-weapon class; the priest
 * ships on the existing `ranged` behaviour, its writ-of-audit
 * projectile reads through the sprite — the glowing censer bead at
 * the staff tip carries the threat telegraph.
 */
