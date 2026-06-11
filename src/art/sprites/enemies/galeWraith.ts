/**
 * `gale_wraith` — wind-wraith companion to the haar. Design pivot (v2):
 * prior icon had horizontal wind streaks + swirl arcs + body at 0.8
 * alpha. The streaks dominated, body was ghostlike and vanished, so
 * the sprite read "weather effect" not "wraith inside the weather".
 * New pitch: SOLID OPAQUE BODY (1.0 alpha, dark navy core + cyan
 * highlights) leaning forward-right into the gust. BIG SHOUTING
 * MOUTH + WIDE RED EYES deep-set in a hollow skull-face, so a
 * creature-face anchors the gust. Hair whipped horizontal. Wind
 * streaks kept but trimmed to 3 heavy slashes behind the body so
 * the body reads FIRST. The ghost rides the wind, not the other way.
 */

import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const GALE_WRAITH_CANVAS_SIZE = 44;

export function drawGaleWraithBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = GALE_WRAITH_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 2 + (frame.breathY ?? 0);

  // Outer gust halo — elongated oval biased left (lee)
  g.fillStyle(0x9db0c0, 0.22);
  g.fillEllipse(cx - 4, cy, 34, 14);
  g.fillStyle(0x9db0c0, 0.1);
  g.fillEllipse(cx - 8, cy, 42, 18);

  // Three BOLD horizontal wind streaks BEHIND the body — trimmed to
  // essentials so they read as "motion trail" not "the subject".
  g.fillStyle(0xe8f0f8, 0.85);
  g.fillRect(cx - 18, cy - 5, 16, 1.4);
  g.fillStyle(0xd8e4ec, 0.8);
  g.fillRect(cx - 20, cy + 1, 18, 1.6);
  g.fillStyle(0xe8f0f8, 0.75);
  g.fillRect(cx - 16, cy + 7, 14, 1.2);
  // Tapered tail wisps fading into the lee
  g.fillStyle(0xa8b8c8, 0.45);
  g.fillRect(cx - 21, cy - 5, 2, 0.8);
  g.fillRect(cx - 22, cy + 1, 2, 0.8);
  g.fillRect(cx - 18, cy + 7, 2, 0.8);

  // Swirl arcs wrapping around the body — makes wind read "swirl"
  g.lineStyle(2, 0xd8e4ec, 0.75);
  g.beginPath();
  g.arc(cx + 2, cy - 2, 11, -Math.PI * 0.85, Math.PI * 0.35);
  g.strokePath();

  // SOLID BODY — dark navy core with cyan highlights. 1.0 alpha,
  // leaning forward-right. This is the "creature" anchor.
  // Outer silhouette shadow
  g.fillStyle(0x05101c, 1);
  g.fillEllipse(cx + 3, cy + 1, 13, 15);
  // Main body — dark navy
  g.fillStyle(0x152838, 1);
  g.fillEllipse(cx + 3, cy, 11, 13);
  // Body fold shadow (darker right side — wind catching)
  g.fillStyle(0x2a4255, 1);
  g.fillEllipse(cx + 3, cy - 1, 9, 11);
  // Cyan highlight on left edge — bright lee catching light
  g.fillStyle(0x4a7ea0, 1);
  g.fillEllipse(cx + 1, cy - 1, 5, 9);
  // Bright specular on leading-edge shoulder
  g.fillStyle(0x8fd0f0, 0.8);
  g.fillEllipse(cx + 1, cy - 2, 3, 5);

  // Ragged cloth tatters flying off the body — three jagged edges
  g.fillStyle(0x05101c, 1);
  g.fillTriangle(cx + 3, cy + 5, cx + 8, cy + 8, cx + 3, cy + 9);
  g.fillTriangle(cx + 4, cy + 7, cx + 9, cy + 11, cx + 5, cy + 11);
  g.fillStyle(0x152838, 1);
  g.fillTriangle(cx + 3, cy + 5, cx + 7, cy + 7, cx + 3, cy + 8);

  // HEAD — dark hollow skull, SOLID. Tilted forward into the gust.
  g.fillStyle(0x05101c, 1);
  g.fillEllipse(cx + 5, cy - 9, 9, 10);
  g.fillStyle(0x1a2838, 1);
  g.fillEllipse(cx + 5, cy - 9, 8, 9);
  // Pale spectral face
  g.fillStyle(0x6a8090, 1);
  g.fillEllipse(cx + 5, cy - 10, 6, 7);
  g.fillStyle(0x8fa0b0, 0.85);
  g.fillEllipse(cx + 4, cy - 11, 4, 4);

  // Hollow eye sockets — DEEP BLACK with RED PINPRICK EYES blazing
  g.fillStyle(0x000000, 1);
  g.fillEllipse(cx + 3, cy - 10, 2, 2.5);
  g.fillEllipse(cx + 7, cy - 10, 2, 2.5);
  // Red eye glow
  g.fillStyle(0xff2a2a, 0.5);
  g.fillCircle(cx + 3, cy - 10, 1.5);
  g.fillCircle(cx + 7, cy - 10, 1.5);
  g.fillStyle(0xcc1818, 1);
  g.fillCircle(cx + 3, cy - 10, 0.9);
  g.fillCircle(cx + 7, cy - 10, 0.9);
  g.fillStyle(0xff6a4a, 1);
  g.fillCircle(cx + 3, cy - 10, 0.4);
  g.fillCircle(cx + 7, cy - 10, 0.4);

  // SHOUTING MOUTH — wide black oval, mouth open screaming the gust
  g.fillStyle(0x000000, 1);
  g.fillEllipse(cx + 5, cy - 6, 3.5, 2.5);
  g.fillStyle(0x1a0810, 1);
  g.fillEllipse(cx + 5, cy - 6, 2.5, 1.8);
  // Teeth
  g.fillStyle(0x8a9aaa, 0.9);
  g.fillRect(cx + 3.5, cy - 6.5, 0.5, 1.2);
  g.fillRect(cx + 4.3, cy - 6.5, 0.5, 1.2);
  g.fillRect(cx + 5.1, cy - 6.5, 0.5, 1.2);
  g.fillRect(cx + 5.9, cy - 6.5, 0.5, 1.2);
  g.fillRect(cx + 6.7, cy - 6.5, 0.4, 1.2);

  // Hair WHIPPED HORIZONTAL to the left — four bold streak strands
  // trailing off the head in the wind direction
  g.fillStyle(0x05101c, 1);
  g.fillRect(cx - 5, cy - 12, 10, 1.4);
  g.fillStyle(0x152838, 1);
  g.fillRect(cx - 3, cy - 10, 8, 1.2);
  g.fillStyle(0x2a4255, 1);
  g.fillRect(cx - 6, cy - 14, 11, 1);
  g.fillStyle(0x4a5868, 0.85);
  g.fillRect(cx - 2, cy - 8, 7, 1);
  // Hair tail wisps fading
  g.fillStyle(0x2a4255, 0.6);
  g.fillRect(cx - 8, cy - 14, 2, 0.6);
  g.fillRect(cx - 6, cy - 12, 2, 0.6);

  // Clawed hand reaching forward-right — grasping gesture
  g.fillStyle(0x05101c, 1);
  g.fillEllipse(cx + 10, cy + 1, 3, 2);
  g.fillStyle(0x8fa0b0, 1);
  g.fillEllipse(cx + 10, cy + 1, 2, 1.4);
  // Claw tips
  g.fillStyle(0x000000, 1);
  g.fillRect(cx + 11.5, cy - 0.5, 1, 0.5);
  g.fillRect(cx + 11.8, cy + 0.5, 1, 0.5);
  g.fillRect(cx + 11.5, cy + 1.5, 1, 0.5);

  // Debris — tiny specks (leaves/dust) whirling in the lee
  g.fillStyle(0x4a3a28, 1);
  g.fillRect(cx - 12, cy - 1, 1.2, 1);
  g.fillStyle(0x6a5a38, 0.9);
  g.fillRect(cx - 17, cy + 3, 1.2, 1);
  g.fillStyle(0x4a3a28, 0.85);
  g.fillRect(cx - 15, cy + 7, 1.4, 1);
  g.fillStyle(0x6a5a38, 0.65);
  g.fillRect(cx - 10, cy + 10, 1, 1);
  g.fillRect(cx - 19, cy - 4, 1, 1);

}

export function bakeGaleWraith(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawGaleWraithBody(g);
  g.generateTexture('gale_wraith', GALE_WRAITH_CANVAS_SIZE, GALE_WRAITH_CANVAS_SIZE);
  g.destroy();
}

/**
 * Seelie Piper — DESIGN_IDEAS section 3 Faerie family opener.
 * "Fair-court" faerie orbiting the player; pale gold palette with
 * sparkle-before-commit hint in the visual. Pairs with
 * unseelie_fiddler as the light half of a Seelie/Unseelie pair.
 */
