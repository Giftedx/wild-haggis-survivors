/**
 * `tourist` — overwhelmed Highland-holiday visitor. Design pivot:
 * old sprite read as "generic blue-jacket person" because no
 * unmistakable tourist props dominated. New pitch: BRIGHT-RED
 * cagoule (tourists wear loud rain-jackets, and red pops against
 * the moor green), BIG CAMERA hanging around neck (the universal
 * tourist prop), TARTAN SHOPPING BAG clutched in one hand (Royal
 * Mile tat), plus the selfie stick + bucket hat + sunburn. Every
 * prop screams "I'm here on holiday".
 */

import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';
import { HIGHLAND_TARTAN } from '../../kiltPalette';

export const TOURIST_CANVAS_SIZE = 48;

export function drawTouristBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = TOURIST_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 2 + (frame.breathY ?? 0);
  const lly = frame.leftLegY ?? 0;
  const rly = frame.rightLegY ?? 0;

  // ── Legs in beige shorts peeking below the cagoule. ──
  g.fillStyle(0xd8b880, 1);
  g.fillRect(cx - 7, cy + 11 + lly, 5, 4);
  g.fillRect(cx + 2, cy + 11 + rly, 5, 4);
  // Pale sunburnt calves below the shorts
  g.fillStyle(0xee9a78, 1);
  g.fillRect(cx - 7, cy + 15 + lly, 5, 3);
  g.fillRect(cx + 2, cy + 15 + rly, 5, 3);
  // White socks (tourist classic)
  g.fillStyle(0xf0f0f0, 1);
  g.fillRect(cx - 7, cy + 18 + lly, 5, 1.5);
  g.fillRect(cx + 2, cy + 18 + rly, 5, 1.5);
  // Brown walking boots
  g.fillStyle(0x3a2010, 1);
  g.fillRect(cx - 8, cy + 19 + lly, 7, 2);
  g.fillRect(cx + 1, cy + 19 + rly, 7, 2);
  g.fillStyle(0x6a4028, 1);
  g.fillRect(cx - 8, cy + 19 + lly, 7, 0.6);
  g.fillRect(cx + 1, cy + 19 + rly, 7, 0.6);

  // ── RED cagoule — bright scarlet, pops against moor green. ──
  g.fillStyle(0x8a0808, 1);
  g.fillRect(cx - 12, cy - 6, 24, 18);
  g.fillStyle(0xc81818, 1);
  g.fillRect(cx - 11, cy - 5, 22, 16);
  // Nylon sheen (brighter strip on the upper left)
  g.fillStyle(0xe84040, 0.7);
  g.fillRect(cx - 10, cy - 4, 8, 4);
  // Zip line down centre
  g.fillStyle(0x5a0404, 1);
  g.fillRect(cx, cy - 5, 1, 16);
  // Drawstring toggles at the hem
  g.fillStyle(0x2a0404, 1);
  g.fillCircle(cx - 4, cy + 11, 0.8);
  g.fillCircle(cx + 4, cy + 11, 0.8);

  // ── BIG CAMERA hanging around the neck — the universal tourist
  // silhouette tell. Black body with big silver lens. ──
  // Strap over the shoulder
  g.fillStyle(0x2a1808, 1);
  g.fillRect(cx - 6, cy - 5, 1.5, 6);
  g.fillRect(cx + 4.5, cy - 5, 1.5, 6);
  // Camera body — big black block
  g.fillStyle(0x0a0a10, 1);
  g.fillRect(cx - 6, cy, 12, 6);
  g.fillStyle(0x2a2a32, 1);
  g.fillRect(cx - 6, cy, 12, 1.2);
  // Lens — silver circle in the centre
  g.fillStyle(0x0a0a10, 1);
  g.fillCircle(cx, cy + 3, 3);
  g.fillStyle(0x4a4a52, 1);
  g.fillCircle(cx, cy + 3, 2.2);
  g.fillStyle(0x8a8a92, 1);
  g.fillCircle(cx, cy + 3, 1.3);
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(cx - 0.5, cy + 2.5, 0.7);
  // Flash + viewfinder bumps
  g.fillStyle(0xfadc6a, 1);
  g.fillRect(cx - 5, cy + 0.5, 1.5, 1);
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx + 3.5, cy + 0.5, 1.5, 1);

  // ── Head — pink-sunburned. ──
  g.fillStyle(0xcc5a38, 1);
  g.fillCircle(cx, cy - 12, 9);
  g.fillStyle(0xee8866, 1);
  g.fillCircle(cx, cy - 12, 8);
  // Cheek sunburn flush
  g.fillStyle(0xff5030, 0.5);
  g.fillCircle(cx - 4, cy - 10, 2.5);
  g.fillCircle(cx + 4, cy - 10, 2.5);
  // Wide bewildered eyes
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 3.5, cy - 13, 2.5);
  g.fillCircle(cx + 3.5, cy - 13, 2.5);
  g.fillStyle(0x3a5a88, 1);
  g.fillCircle(cx - 3.5, cy - 13, 1.3);
  g.fillCircle(cx + 3.5, cy - 13, 1.3);
  g.fillStyle(0x000000, 1);
  g.fillCircle(cx - 3.5, cy - 13, 0.6);
  g.fillCircle(cx + 3.5, cy - 13, 0.6);
  // Worried eyebrows
  g.fillStyle(0x4a2808, 1);
  g.fillRect(cx - 6, cy - 16, 4, 0.8);
  g.fillRect(cx + 2, cy - 16, 4, 0.8);
  // Open mouth of amazement
  g.fillStyle(0x5a1818, 1);
  g.fillEllipse(cx, cy - 8, 3, 2);
  g.fillStyle(0xff6666, 0.85);
  g.fillEllipse(cx, cy - 8, 2.2, 1.5);

  // ── Tartan bucket hat — unchanged from before, still a solid
  // anchor. ──
  g.fillStyle(0x0a0604, 1);
  g.fillEllipse(cx, cy - 19, 22, 5);
  g.fillStyle(0x5a4028, 1);
  g.fillEllipse(cx, cy - 19, 20, 4);
  g.fillStyle(0x1a0e04, 1);
  g.fillRect(cx - 8, cy - 24, 16, 6);
  g.fillStyle(0x5a4028, 1);
  g.fillRect(cx - 7, cy - 23, 14, 5);
  // Tartan crosshatch — Highland tartan
  g.fillStyle(HIGHLAND_TARTAN.field, 0.9);
  g.fillRect(cx - 7, cy - 22, 14, 1.2);
  g.fillRect(cx - 7, cy - 20, 14, 1.2);
  g.fillStyle(HIGHLAND_TARTAN.stripe, 0.8);
  g.fillRect(cx - 5, cy - 23, 1, 5);
  g.fillRect(cx + 4, cy - 23, 1, 5);
  g.fillStyle(HIGHLAND_TARTAN.field, 0.7);
  g.fillRect(cx - 1, cy - 23, 1, 5);
  g.fillRect(cx + 2, cy - 23, 1, 5);
  g.fillStyle(HIGHLAND_TARTAN.accent, 0.8);
  g.fillRect(cx - 5, cy - 22, 1, 1);
  g.fillRect(cx + 4, cy - 20, 1, 1);

  // Sunburned ears poking below the brim
  g.fillStyle(0xff5030, 1);
  g.fillCircle(cx - 10, cy - 16, 2);
  g.fillCircle(cx + 10, cy - 16, 2);

  // ── SELFIE STICK — sticks UP above the whole silhouette. The
  // unmistakable visitor prop. ──
  g.fillStyle(0x2a2a32, 1);
  g.fillRect(cx - 14, cy - 6, 2, 22);
  g.fillStyle(0x6a6a72, 1);
  g.fillRect(cx - 14, cy - 6, 0.8, 22);
  // Phone clamp at top
  g.fillStyle(0x0a0a10, 1);
  g.fillRect(cx - 17, cy - 12, 6, 8);
  g.fillStyle(0x2a3a8a, 0.9);
  g.fillRect(cx - 16, cy - 11, 4, 6);
  // Screen glow
  g.fillStyle(0xffffcc, 0.4);
  g.fillCircle(cx - 14, cy - 8, 2.5);
  // Phone camera notch
  g.fillStyle(0x000000, 1);
  g.fillCircle(cx - 14, cy - 10.5, 0.5);

  // ── TARTAN SHOPPING BAG clutched in the right hand — another
  // unmistakable tourist-prop. Royal Mile tat. ──
  // Hand holding the bag
  g.fillStyle(0xee9a78, 1);
  g.fillCircle(cx + 12, cy + 6, 1.5);
  // Bag body — Highland tartan
  g.fillStyle(HIGHLAND_TARTAN.fieldDark, 1);
  g.fillRect(cx + 10, cy + 7, 6, 8);
  g.fillStyle(HIGHLAND_TARTAN.field, 1);
  g.fillRect(cx + 10.5, cy + 7.5, 5, 7);
  // Tartan crosshatch on bag
  g.fillStyle(HIGHLAND_TARTAN.stripe, 0.9);
  g.fillRect(cx + 10.5, cy + 9, 5, 0.6);
  g.fillRect(cx + 10.5, cy + 11.5, 5, 0.6);
  g.fillRect(cx + 12, cy + 7.5, 0.5, 7);
  g.fillRect(cx + 14, cy + 7.5, 0.5, 7);
  // Gold thistle emblem on the bag
  g.fillStyle(HIGHLAND_TARTAN.accent, 1);
  g.fillCircle(cx + 13, cy + 11, 1);
  // Bag handle
  g.fillStyle(HIGHLAND_TARTAN.fieldDark, 1);
  g.fillRect(cx + 11, cy + 6.5, 4, 1);
  g.fillRect(cx + 11, cy + 5, 1, 2);
  g.fillRect(cx + 14, cy + 5, 1, 2);

}

export function bakeTourist(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawTouristBody(g);
  g.generateTexture('tourist', TOURIST_CANVAS_SIZE, TOURIST_CANVAS_SIZE);
  g.destroy();
}
