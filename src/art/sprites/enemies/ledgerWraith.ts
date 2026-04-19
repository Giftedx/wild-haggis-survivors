/**
 * `ledger_wraith` — floating clerk with a massive open ledger held
 * forward at chest height. The Taxman family's book-keeper. Design
 * pivot: the LEDGER is the silhouette, not the robes — an open
 * double-page book with ruled lines and red tally-marks reads as
 * "this ghost is about to audit you" even at 40px. Head is small,
 * sits above the book; robes trail below. Red-ink drips are the
 * threat beat.
 */

import Phaser from 'phaser';

export function bakeLedgerWraith(scene: Phaser.Scene): void {
  const s = 40;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // ── Ghostly halo — cold paper-blue, two layers. ──
  g.fillStyle(0x8899aa, 0.18);
  g.fillEllipse(cx, cy, 28, 30);
  g.fillStyle(0x8899aa, 0.1);
  g.fillEllipse(cx, cy, 34, 36);

  // ── Floor-length robes — thin wedge trailing below the ledger.
  // Deliberately narrower than the ledger so the book dominates. ──
  g.fillStyle(0x1a1a28, 0.9);
  g.fillTriangle(cx - 7, cy + 15, cx + 7, cy + 15, cx + 2, cy + 4);
  g.fillTriangle(cx - 7, cy + 15, cx - 2, cy + 4, cx + 2, cy + 4);
  g.fillStyle(0x2a2a3a, 1);
  g.fillTriangle(cx - 5, cy + 14, cx + 5, cy + 14, cx + 1, cy + 5);
  g.fillTriangle(cx - 5, cy + 14, cx - 1, cy + 5, cx + 1, cy + 5);

  // ── Ledger shadow — dark outline behind the book so the spine
  // pops against the halo. ──
  g.fillStyle(0x0a0a14, 1);
  g.fillRect(cx - 12, cy - 3, 24, 10);

  // ── Ledger cover — open book, two pages. Dark leather cover
  // visible at the edges; parchment pages fill the middle. ──
  g.fillStyle(0x3a2010, 1);
  g.fillRect(cx - 12, cy - 3, 24, 10);
  // Inner leather (slightly lighter) — frames the pages
  g.fillStyle(0x5a3018, 1);
  g.fillRect(cx - 11, cy - 2, 22, 8);

  // ── Parchment pages — left + right, cream with a faint shadow
  // in the gutter where they meet. ──
  g.fillStyle(0xe8ddb0, 1);
  g.fillRect(cx - 10, cy - 1, 9, 6);
  g.fillRect(cx + 1, cy - 1, 9, 6);
  // Gutter shadow — reads as the spine crease
  g.fillStyle(0x1a1006, 0.8);
  g.fillRect(cx - 0.5, cy - 1, 1, 6);
  // Page highlight — subtle top edge glow (parchment catches halo light)
  g.fillStyle(0xf8eec8, 0.7);
  g.fillRect(cx - 10, cy - 1, 9, 0.5);
  g.fillRect(cx + 1, cy - 1, 9, 0.5);

  // ── Ruled lines on both pages — four dark horizontals each side.
  // Readable at small zoom because the book is 20px wide. ──
  g.fillStyle(0x1a1028, 0.85);
  // Left page
  g.fillRect(cx - 10, cy + 0.5, 9, 0.5);
  g.fillRect(cx - 10, cy + 1.8, 9, 0.5);
  g.fillRect(cx - 10, cy + 3.1, 9, 0.5);
  g.fillRect(cx - 10, cy + 4.4, 9, 0.5);
  // Right page
  g.fillRect(cx + 1, cy + 0.5, 9, 0.5);
  g.fillRect(cx + 1, cy + 1.8, 9, 0.5);
  g.fillRect(cx + 1, cy + 3.1, 9, 0.5);
  g.fillRect(cx + 1, cy + 4.4, 9, 0.5);

  // ── Red tally-marks — three short red strikes on the right page
  // (the audit entries). The signature threat colour. ──
  g.fillStyle(0xaa2020, 1);
  g.fillRect(cx + 2, cy + 0.3, 2, 0.8);
  g.fillRect(cx + 5, cy + 1.6, 2.5, 0.8);
  g.fillRect(cx + 3, cy + 2.9, 3, 0.8);

  // ── Red-ink blot on the left page — centre stain for visual
  // punctuation. ──
  g.fillStyle(0xaa2020, 1);
  g.fillCircle(cx - 5, cy + 2.5, 1);
  g.fillStyle(0x881818, 1);
  g.fillCircle(cx - 5, cy + 2.5, 0.6);

  // ── Head — small, sits above the ledger. Pale gaunt skull. ──
  g.fillStyle(0xddd4b0, 0.95);
  g.fillEllipse(cx, cy - 8, 6, 7);

  // ── Hollow eye sockets — black pits, slightly wider than before
  // so they read at small scale. ──
  g.fillStyle(0x000000, 1);
  g.fillRect(cx - 2.5, cy - 9, 1.5, 2);
  g.fillRect(cx + 1, cy - 9, 1.5, 2);

  // ── Thin moustache / dour frown. ──
  g.fillStyle(0x1a1010, 1);
  g.fillRect(cx - 2, cy - 6, 4, 0.8);

  // ── Bony hands gripping the ledger — thin stumps visible at
  // the outer corners of the book. ──
  g.fillStyle(0xddd4b0, 0.95);
  g.fillCircle(cx - 12, cy + 1, 1.3);
  g.fillCircle(cx + 12, cy + 1, 1.3);
  // Finger shadow
  g.fillStyle(0x8a7e60, 0.7);
  g.fillRect(cx - 13, cy + 1, 1, 1);
  g.fillRect(cx + 12, cy + 1, 1, 1);

  // ── Red-ink drips beneath the ledger — signature threat beat.
  // Three drops descending-size, plus one big splat. ──
  g.fillStyle(0xaa2020, 1);
  g.fillCircle(cx - 3, cy + 9, 1.2);
  g.fillStyle(0xaa2020, 0.85);
  g.fillCircle(cx + 4, cy + 10, 1);
  g.fillStyle(0xaa2020, 0.55);
  g.fillCircle(cx + 1, cy + 12, 0.7);
  // Tail trail below
  g.fillStyle(0xaa2020, 0.35);
  g.fillCircle(cx - 1, cy + 14, 0.5);

  g.generateTexture('ledger_wraith', s, s);
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
