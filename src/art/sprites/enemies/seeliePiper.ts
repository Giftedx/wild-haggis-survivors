/**
 * `seelie_piper` — Light Court faerie piper. In Scottish fae lore the
 * Seelie Court are the "blessed" fae — mostly benevolent but easily
 * offended. The piper charms unwary travellers into joining the dance
 * until they collapse. Paired visually with `unseelie_fiddler`: same
 * canvas, same pose-language, opposite palette (gold/warm vs
 * violet/cold) so the two read as court-mates at a glance.
 *
 * Anchor details: petal-crown, blonde-gold hair, cream tunic with
 * thistle embroidery, miniature bagpipes with a single drone sticking
 * up over the shoulder, butterfly-style wings, puffed cheeks blowing
 * into the chanter.
 */

import Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const SEELIE_PIPER_CANVAS_SIZE = 40;

export function drawSeelieBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = SEELIE_PIPER_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 2 + (frame.breathY ?? 0);

  // ── Fair-court glow — warm amber halo, two soft layers. ──
  g.fillStyle(0xffd890, 0.18);
  g.fillCircle(cx, cy, 17);
  g.fillStyle(0xfff0b0, 0.12);
  g.fillCircle(cx, cy - 1, 13);

  // ── Butterfly wings — upper pair larger, lower pair smaller,
  // iridescent gold with cream highlights. Drawn behind the body. ──
  // Back wing shadow first
  g.fillStyle(0xb48a30, 0.4);
  g.fillEllipse(cx - 8, cy - 3, 8, 11);
  g.fillEllipse(cx + 8, cy - 3, 8, 11);
  // Upper wing main — gold with cream top
  g.fillStyle(0xffd890, 0.75);
  g.fillEllipse(cx - 8, cy - 4, 7, 10);
  g.fillEllipse(cx + 8, cy - 4, 7, 10);
  // Cream highlight on upper half of each wing
  g.fillStyle(0xfff6c8, 0.7);
  g.fillEllipse(cx - 8, cy - 6, 4, 5);
  g.fillEllipse(cx + 8, cy - 6, 4, 5);
  // Lower wing pair — smaller, same palette
  g.fillStyle(0xffd890, 0.65);
  g.fillEllipse(cx - 7, cy + 4, 5, 6);
  g.fillEllipse(cx + 7, cy + 4, 5, 6);
  // Vein detail — subtle darker strokes
  g.lineStyle(0.5, 0x8a6020, 0.6);
  g.lineBetween(cx - 8, cy - 8, cx - 8, cy + 1);
  g.lineBetween(cx + 8, cy - 8, cx + 8, cy + 1);
  // Wing-eye spots (butterfly mimicry)
  g.fillStyle(0x8a6020, 0.55);
  g.fillCircle(cx - 8, cy - 2, 0.9);
  g.fillCircle(cx + 8, cy - 2, 0.9);

  // ── Tunic body — cream with thistle-purple trim. ──
  g.fillStyle(0x7a5a28, 1);
  g.fillEllipse(cx, cy + 3, 11, 12);
  g.fillStyle(0xf0dca8, 1);
  g.fillEllipse(cx, cy + 2, 9, 10);
  // Purple trim band at the collar
  g.fillStyle(0x8844aa, 1);
  g.fillRect(cx - 4, cy - 2, 8, 1);
  // Gold belt
  g.fillStyle(0xccaa22, 1);
  g.fillRect(cx - 4, cy + 4, 8, 1);
  // Tunic fold shadow
  g.fillStyle(0xb4944a, 0.5);
  g.fillRect(cx - 2, cy - 1, 4, 5);

  // ── Head — pale peach with pointed elf ears. ──
  g.fillStyle(0x7a4a30, 1);
  g.fillCircle(cx, cy - 6, 4);
  g.fillStyle(0xffd9a0, 1);
  g.fillCircle(cx, cy - 6, 3.5);
  // Pointed ear on each side
  g.fillStyle(0x7a4a30, 1);
  g.fillTriangle(cx - 4, cy - 7, cx - 6, cy - 8, cx - 3, cy - 4);
  g.fillTriangle(cx + 4, cy - 7, cx + 6, cy - 8, cx + 3, cy - 4);
  g.fillStyle(0xffd9a0, 1);
  g.fillTriangle(cx - 4, cy - 6, cx - 5, cy - 7, cx - 3, cy - 5);
  g.fillTriangle(cx + 4, cy - 6, cx + 5, cy - 7, cx + 3, cy - 5);

  // ── Petal crown — tiny pink blossoms as a circlet. ──
  g.fillStyle(0xcc4477, 0.9);
  g.fillCircle(cx - 3, cy - 10, 1);
  g.fillCircle(cx, cy - 10, 1.1);
  g.fillCircle(cx + 3, cy - 10, 1);
  g.fillStyle(0xff80aa, 1);
  g.fillCircle(cx, cy - 10, 0.6);

  // ── Blonde-gold hair peeking below the crown, framing the face. ──
  g.fillStyle(0xddaa40, 1);
  g.fillRect(cx - 3, cy - 8, 1, 3);
  g.fillRect(cx + 2, cy - 8, 1, 3);
  g.fillStyle(0xffcc66, 0.8);
  g.fillRect(cx - 3, cy - 8, 1, 1);
  g.fillRect(cx + 2, cy - 8, 1, 1);

  // ── Eyes — bright gold pinpricks with a catch-light. ──
  g.fillStyle(0x4a2a00, 1);
  g.fillCircle(cx - 1.3, cy - 6, 0.8);
  g.fillCircle(cx + 1.3, cy - 6, 0.8);
  g.fillStyle(0xffcc33, 1);
  g.fillCircle(cx - 1.3, cy - 6, 0.45);
  g.fillCircle(cx + 1.3, cy - 6, 0.45);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 1.5, cy - 6.2, 0.2);
  g.fillCircle(cx + 1.1, cy - 6.2, 0.2);

  // ── Puffed cheeks — piper is blowing into the chanter. ──
  g.fillStyle(0xff9a6a, 0.4);
  g.fillCircle(cx - 2, cy - 4, 1.3);
  g.fillCircle(cx + 2, cy - 4, 1.3);

  // ── Wee bagpipes — bag held under the left arm, chanter angled
  // down-right, single drone sticking up over the right shoulder. ──
  // Bag (leather + tartan)
  g.fillStyle(0x8a4a20, 1);
  g.fillEllipse(cx - 6, cy + 2, 5, 4);
  g.fillStyle(0xaa6030, 1);
  g.fillEllipse(cx - 6, cy + 2, 4, 3);
  // Tiny tartan cross on the bag
  g.fillStyle(0xcc2222, 0.7);
  g.fillRect(cx - 7, cy + 2, 3, 0.5);
  g.fillStyle(0x224488, 0.6);
  g.fillRect(cx - 6, cy + 1, 0.5, 2);
  // Drone — tall thin pipe over the shoulder
  g.fillStyle(0x2a1a08, 1);
  g.fillRect(cx + 4, cy - 10, 1, 10);
  g.fillStyle(0x4a3010, 1);
  g.fillRect(cx + 4, cy - 9, 0.5, 8);
  // Drone tip — cream-gold ferrule
  g.fillStyle(0xffdd77, 1);
  g.fillRect(cx + 3.5, cy - 11, 1.5, 1);
  // Chanter — short pipe going down from the bag
  g.fillStyle(0x2a1a08, 1);
  g.fillRect(cx - 4, cy + 4, 1, 4);
  g.fillStyle(0x4a3010, 1);
  g.fillRect(cx - 4, cy + 5, 0.5, 3);
  // Blowpipe — tiny stem up to the mouth
  g.fillStyle(0x2a1a08, 1);
  g.fillRect(cx - 4, cy - 3, 1, 3);

  // ── Sparkle trail — magical dust trailing behind, three dots
  // of descending size + a few stars. ──
  g.fillStyle(0xfff0c0, 0.95);
  g.fillCircle(cx - 12, cy + 5, 1);
  g.fillStyle(0xfff0c0, 0.65);
  g.fillCircle(cx - 15, cy + 2, 0.7);
  g.fillStyle(0xfff0c0, 0.4);
  g.fillCircle(cx - 17, cy + 6, 0.5);
  // Four-pointed sparkle star
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(cx - 13, cy - 3, 1, 0.5);
  g.fillRect(cx - 12.7, cy - 3.3, 0.5, 1);

}

export function bakeSeeliePiper(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawSeelieBody(g);
  g.generateTexture('seelie_piper', SEELIE_PIPER_CANVAS_SIZE, SEELIE_PIPER_CANVAS_SIZE);
  g.destroy();
}
