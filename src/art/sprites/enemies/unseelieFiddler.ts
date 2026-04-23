/**
 * `unseelie_fiddler` — Dark Court faerie fiddler, the sinister twin
 * of `seelie_piper`. The Unseelie Court in Scottish lore is the
 * malevolent wing of the fae — the ones who steal children and ride
 * the Sluagh. The fiddler's tunes are said to make grown men weep,
 * then follow him into the bog.
 *
 * Anchor details: crown of thorns, raven-black hair, dark-plum
 * hooded cloak, fiddle tucked under the chin with a bow drawn tight,
 * bat-style ragged wings, cold-cyan eye-glow. Pose-paired with
 * `seelie_piper` so the two read as the light-and-dark beat of a
 * Seelie/Unseelie court duet.
 */

import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const UNSEELIE_FIDDLER_CANVAS_SIZE = 40;

export function drawUnseelieFiddlerBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = UNSEELIE_FIDDLER_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 2 + (frame.breathY ?? 0);

  // ── Dark-court aura — cold violet-black halo, two soft layers. ──
  g.fillStyle(0x2a1038, 0.32);
  g.fillCircle(cx, cy, 17);
  g.fillStyle(0x1a0820, 0.2);
  g.fillCircle(cx, cy - 1, 13);

  // ── Bat-style wings — jagged, torn, raven-violet. Four points
  // per wing so the silhouette reads as "shredded membrane", not a
  // butterfly. Back layer first. ──
  g.fillStyle(0x1a0820, 1);
  g.fillTriangle(cx - 4, cy - 5, cx - 11, cy - 7, cx - 10, cy + 2);
  g.fillTriangle(cx - 4, cy + 1, cx - 11, cy + 2, cx - 8, cy + 8);
  g.fillTriangle(cx + 4, cy - 5, cx + 11, cy - 7, cx + 10, cy + 2);
  g.fillTriangle(cx + 4, cy + 1, cx + 11, cy + 2, cx + 8, cy + 8);
  // Mid violet
  g.fillStyle(0x3a1a4a, 1);
  g.fillTriangle(cx - 4, cy - 4, cx - 10, cy - 6, cx - 9, cy + 1);
  g.fillTriangle(cx + 4, cy - 4, cx + 10, cy - 6, cx + 9, cy + 1);
  // Edge highlight — sinister pale-violet along the leading edge
  g.fillStyle(0x8a5fb0, 0.6);
  g.lineStyle(0.5, 0xa07ac8, 0.7);
  g.lineBetween(cx - 4, cy - 5, cx - 11, cy - 7);
  g.lineBetween(cx + 4, cy - 5, cx + 11, cy - 7);
  // Wing claw-tips
  g.fillStyle(0x120618, 1);
  g.fillCircle(cx - 11, cy - 7, 0.6);
  g.fillCircle(cx - 10, cy + 2, 0.6);
  g.fillCircle(cx - 8, cy + 8, 0.5);
  g.fillCircle(cx + 11, cy - 7, 0.6);
  g.fillCircle(cx + 10, cy + 2, 0.6);
  g.fillCircle(cx + 8, cy + 8, 0.5);

  // ── Cloak body — long dark-plum robe. ──
  g.fillStyle(0x120618, 1);
  g.fillEllipse(cx, cy + 4, 11, 13);
  g.fillStyle(0x2a1038, 1);
  g.fillEllipse(cx, cy + 3, 9, 11);
  g.fillStyle(0x4a2262, 1);
  g.fillEllipse(cx - 1, cy + 2, 7, 9);
  // Cloak fold shadow
  g.fillStyle(0x1a0822, 0.7);
  g.fillRect(cx - 1, cy - 1, 2, 9);
  // Bone-clasp at the collar — silver
  g.fillStyle(0xaaa6b8, 1);
  g.fillRect(cx - 1, cy - 2, 2, 1);
  g.fillStyle(0xddd6e8, 0.8);
  g.fillRect(cx - 1, cy - 2, 1, 1);

  // ── Head — pale sickly grey-blue, pointed elf ears. ──
  g.fillStyle(0x1a0822, 1);
  g.fillCircle(cx, cy - 6, 4);
  g.fillStyle(0xb8a8c8, 1);
  g.fillCircle(cx, cy - 6, 3.5);
  // Pointed ear on each side
  g.fillStyle(0x1a0822, 1);
  g.fillTriangle(cx - 4, cy - 7, cx - 6, cy - 8, cx - 3, cy - 4);
  g.fillTriangle(cx + 4, cy - 7, cx + 6, cy - 8, cx + 3, cy - 4);
  g.fillStyle(0xb8a8c8, 1);
  g.fillTriangle(cx - 4, cy - 6, cx - 5, cy - 7, cx - 3, cy - 5);
  g.fillTriangle(cx + 4, cy - 6, cx + 5, cy - 7, cx + 3, cy - 5);

  // ── Crown of thorns — black twisted circlet above the brow. ──
  g.fillStyle(0x0a040f, 1);
  g.fillRect(cx - 4, cy - 10, 8, 1);
  // Thorn spikes
  g.fillTriangle(cx - 3, cy - 11, cx - 2, cy - 12, cx - 2, cy - 10);
  g.fillTriangle(cx, cy - 11, cx + 1, cy - 13, cx + 1, cy - 10);
  g.fillTriangle(cx + 3, cy - 11, cx + 4, cy - 12, cx + 4, cy - 10);
  // Cold gleam on the crown
  g.fillStyle(0x5a4078, 0.7);
  g.fillRect(cx - 2, cy - 10, 4, 0.5);

  // ── Raven-black hair — long, straight, framing the pale face. ──
  g.fillStyle(0x0a040f, 1);
  g.fillRect(cx - 4, cy - 9, 1, 5);
  g.fillRect(cx + 3, cy - 9, 1, 5);
  g.fillStyle(0x1a0c24, 1);
  g.fillRect(cx - 3, cy - 8, 1, 3);
  g.fillRect(cx + 2, cy - 8, 1, 3);

  // ── Eyes — cold-cyan pinpricks with a dark iris ring. Contrast
  // to Seelie's warm gold. ──
  g.fillStyle(0x000000, 1);
  g.fillCircle(cx - 1.3, cy - 6, 0.8);
  g.fillCircle(cx + 1.3, cy - 6, 0.8);
  g.fillStyle(0x4a8ab0, 1);
  g.fillCircle(cx - 1.3, cy - 6, 0.5);
  g.fillCircle(cx + 1.3, cy - 6, 0.5);
  g.fillStyle(0x8fd0f0, 1);
  g.fillCircle(cx - 1.3, cy - 6, 0.3);
  g.fillCircle(cx + 1.3, cy - 6, 0.3);
  g.fillStyle(0xffffff, 0.95);
  g.fillCircle(cx - 1.5, cy - 6.2, 0.18);
  g.fillCircle(cx + 1.1, cy - 6.2, 0.18);

  // ── Grim line of a mouth. ──
  g.fillStyle(0x1a0822, 1);
  g.fillRect(cx - 1, cy - 4, 2, 0.5);

  // ── Fiddle tucked under the chin. Body on the left, neck
  // angling up-left, bow drawn across horizontally. ──
  // Fiddle body — warm-dark wood so it pops against the cloak
  g.fillStyle(0x1a0a00, 1);
  g.fillEllipse(cx - 5, cy + 1, 5, 3);
  g.fillStyle(0x6a3820, 1);
  g.fillEllipse(cx - 5, cy + 1, 4, 2.2);
  g.fillStyle(0x8a5a38, 1);
  g.fillEllipse(cx - 5.5, cy + 0.5, 2, 1);
  // F-hole dot
  g.fillStyle(0x0a0400, 1);
  g.fillRect(cx - 5, cy + 1, 1, 0.5);
  // Fiddle neck + scroll
  g.fillStyle(0x1a0a00, 1);
  g.fillRect(cx - 7, cy - 3, 3, 1);
  g.fillStyle(0x6a3820, 1);
  g.fillRect(cx - 7, cy - 2.5, 2, 0.5);
  // Strings — four pale lines running along the neck
  g.fillStyle(0xe0d8b0, 0.9);
  g.fillRect(cx - 7, cy - 2.8, 3, 0.2);
  g.fillRect(cx - 7, cy - 2.4, 3, 0.2);
  // Bow — angled across the strings
  g.fillStyle(0x4a2c10, 1);
  g.fillRect(cx - 9, cy - 5, 10, 0.5);
  g.fillStyle(0xddd6a8, 0.8);
  g.fillRect(cx - 9, cy - 4.5, 10, 0.3);
  // Bow tip (frog)
  g.fillStyle(0x8a6030, 1);
  g.fillRect(cx + 1, cy - 5.5, 0.5, 1);

  // ── Shadow trail — cold dark pinpricks instead of bright sparkles. ──
  g.fillStyle(0x2a1038, 1);
  g.fillCircle(cx + 11, cy + 5, 1);
  g.fillStyle(0x2a1038, 0.65);
  g.fillCircle(cx + 14, cy + 2, 0.7);
  g.fillStyle(0x2a1038, 0.4);
  g.fillCircle(cx + 16, cy + 6, 0.5);
  // A single violet tear-drop for added menace
  g.fillStyle(0x8a5fb0, 0.7);
  g.fillCircle(cx + 13, cy + 7, 0.4);

}

export function bakeUnseelieFiddler(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawUnseelieFiddlerBody(g);
  g.generateTexture('unseelie_fiddler', UNSEELIE_FIDDLER_CANVAS_SIZE, UNSEELIE_FIDDLER_CANVAS_SIZE);
  g.destroy();
}
