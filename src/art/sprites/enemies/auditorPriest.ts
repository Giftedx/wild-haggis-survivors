/**
 * `auditor_priest` — gaunt cleric from the Taxman's retinue. Design
 * pivot (v2): prior icon read as "generic hooded priest with censer
 * staff" — muted-gold aura + small black 5×6 book + 1-pixel slit
 * eyes + censer-ball staff tip together said "priest" but the
 * "auditor" threat was invisible. New pitch: red audit-threat
 * palette throughout. RED trim hem + GLOWING RED PIN-EYES deep in
 * a black hood cavity + BIG OPEN LEDGER held at chest (with
 * parchment pages, ruled lines, red tally marks, RED WAX SEAL on
 * left page) + RED WAX STAMP at the staff tip (not a censer). The
 * ledger is the audit weapon, the staff is the stamp of doom, the
 * robes + hood are the monk silhouette. Every major element says
 * "audit" now — kinship with taxman + ledger_wraith locked.
 */

import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const AUDITOR_PRIEST_CANVAS_SIZE = 42;

export function drawAuditorPriestBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = AUDITOR_PRIEST_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 2 + (frame.breathY ?? 0);

  // ── Red audit-threat aura — two-layer soft glow (replaces muted gold). ──
  g.fillStyle(0xcc3030, 0.1);
  g.fillEllipse(cx, cy, 32, 34);
  g.fillStyle(0xcc3030, 0.18);
  g.fillEllipse(cx, cy, 24, 28);

  // ── Floor-length cassock — charcoal wool, three-tone. ──
  g.fillStyle(0x0a0810, 1);
  g.fillTriangle(cx - 11, cy + 17, cx + 11, cy + 17, cx, cy - 3);
  g.fillStyle(0x1a1820, 1);
  g.fillTriangle(cx - 10, cy + 16, cx + 10, cy + 16, cx, cy - 2);
  g.fillStyle(0x2a252f, 1);
  g.fillTriangle(cx - 8, cy + 15, cx + 8, cy + 15, cx, cy - 1);

  // ── Red trim hem (replacing gold — accountancy blood). ──
  g.fillStyle(0xaa2222, 1);
  g.fillRect(cx - 9, cy + 14, 18, 1);
  g.fillStyle(0xcc4444, 0.9);
  g.fillRect(cx - 8, cy + 14, 16, 0.5);

  // ── Cowl shoulders — hunched forward silhouette. ──
  g.fillStyle(0x050508, 1);
  g.fillEllipse(cx, cy - 5, 14, 8);

  // ── Hood cavity — pure black pocket, no face visible. ──
  g.fillStyle(0x000000, 1);
  g.fillEllipse(cx, cy - 10, 8, 10);

  // ── GLOWING RED PIN-EYES in hood cavity — the threat anchor. ──
  g.fillStyle(0xff3030, 0.45);
  g.fillCircle(cx - 2, cy - 10, 1.8);
  g.fillCircle(cx + 2, cy - 10, 1.8);
  g.fillStyle(0xcc1818, 1);
  g.fillCircle(cx - 2, cy - 10, 1);
  g.fillCircle(cx + 2, cy - 10, 1);
  g.fillStyle(0xff6a4a, 1);
  g.fillCircle(cx - 2, cy - 10, 0.5);
  g.fillCircle(cx + 2, cy - 10, 0.5);

  // ── LEDGER — held OPEN at chest, the audit weapon. Big + visible. ──
  g.fillStyle(0x0a0a0a, 1);
  g.fillRect(cx - 9, cy - 1, 18, 8);
  g.fillStyle(0x3a2010, 1);
  g.fillRect(cx - 8.5, cy - 0.5, 17, 7);
  // Parchment pages — left + right
  g.fillStyle(0xe8ddb0, 1);
  g.fillRect(cx - 8, cy, 7.5, 6);
  g.fillRect(cx + 0.5, cy, 7.5, 6);
  // Spine crease between the pages
  g.fillStyle(0x1a1006, 0.9);
  g.fillRect(cx - 0.4, cy, 0.8, 6);
  // Ruled lines on each page
  g.fillStyle(0x1a2050, 0.85);
  g.fillRect(cx - 8, cy + 1.3, 7.5, 0.4);
  g.fillRect(cx - 8, cy + 2.8, 7.5, 0.4);
  g.fillRect(cx - 8, cy + 4.3, 7.5, 0.4);
  g.fillRect(cx + 0.5, cy + 1.3, 7.5, 0.4);
  g.fillRect(cx + 0.5, cy + 2.8, 7.5, 0.4);
  g.fillRect(cx + 0.5, cy + 4.3, 7.5, 0.4);
  // Red tally marks on right page — audit entries
  g.fillStyle(0xcc1818, 1);
  g.fillRect(cx + 1, cy + 1.8, 2, 0.6);
  g.fillRect(cx + 4, cy + 3.3, 2, 0.6);
  // RED WAX SEAL on left page — the audit stamp
  g.fillStyle(0x5a0404, 1);
  g.fillCircle(cx - 5, cy + 3, 1.9);
  g.fillStyle(0xaa1818, 1);
  g.fillCircle(cx - 5, cy + 3, 1.5);
  g.fillStyle(0xee3030, 1);
  g.fillCircle(cx - 5, cy + 3, 0.9);
  g.fillStyle(0xff6a4a, 0.8);
  g.fillCircle(cx - 5.3, cy + 2.7, 0.5);
  // Wax-seal drip rays
  g.fillStyle(0x5a0404, 1);
  g.fillRect(cx - 5.5, cy + 2.1, 0.3, 1.5);
  g.fillRect(cx - 4.5, cy + 2.1, 0.3, 1.5);

  // ── Skeletal hands gripping the ledger edges. ──
  g.fillStyle(0xddd4ba, 1);
  g.fillCircle(cx - 10, cy + 3, 1.4);
  g.fillCircle(cx + 10, cy + 3, 1.4);
  g.fillStyle(0x5a5040, 0.8);
  g.fillRect(cx - 11, cy + 3, 1, 2);
  g.fillRect(cx + 10, cy + 3, 1, 2);

  // ── STAFF — long dark shaft rising past the hood. ──
  g.fillStyle(0x1a0a06, 1);
  g.fillRect(cx + 8, cy - 17, 1.5, 15);
  // Brass collar at the join
  g.fillStyle(0xaa8840, 1);
  g.fillRect(cx + 7.5, cy - 15, 2.5, 0.8);

  // ── RED WAX STAMP at staff tip — the audit weapon (not a censer). ──
  g.fillStyle(0x4a0404, 1);
  g.fillCircle(cx + 8.7, cy - 18, 3);
  g.fillStyle(0xaa1818, 1);
  g.fillCircle(cx + 8.7, cy - 18, 2.3);
  g.fillStyle(0xee3030, 1);
  g.fillCircle(cx + 8.5, cy - 18.3, 1.4);
  g.fillStyle(0xff6a4a, 0.9);
  g.fillCircle(cx + 8.3, cy - 18.5, 0.7);
  // Stamp rim specular
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(cx + 8, cy - 19, 0.4);
  // Wisps of red vapour above the stamp — the audit breath
  g.fillStyle(0xdd3030, 0.3);
  g.fillCircle(cx + 9, cy - 22, 0.9);
  g.fillStyle(0xdd3030, 0.18);
  g.fillCircle(cx + 8, cy - 24, 0.7);

}

export function bakeAuditorPriest(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawAuditorPriestBody(g);
  g.generateTexture('auditor_priest', AUDITOR_PRIEST_CANVAS_SIZE, AUDITOR_PRIEST_CANVAS_SIZE);
  g.destroy();
}
