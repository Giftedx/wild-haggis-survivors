import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const AULD_REEKIE_CANVAS_SIZE = 60;

/**
 * Auld Reekie Ghaist — Victorian gas-lamp ghost of Edinburgh's Old Town.
 *
 * Sprite converted from proportional (w=48,h=56) to square canvas (60×60)
 * with cx/cy anchor so the AnimationController can drive frame offsets.
 * Ghost floats — no leg positions needed. `breathY` drives the hover bob;
 * `bodyX` drives the hurt flinch.
 *
 * The lantern arm hangs to the upper-right; eye flames are gas-lamp yellow;
 * the top hat + frock coat reads "Victorian gentleman gone wrong."
 */
export function drawAuldReekieBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = AULD_REEKIE_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 - 2 + (frame.breathY ?? 0);  // -2 from centre gives headroom for hat

  // Body — translucent grey-white spectral ellipse
  g.fillStyle(0xe8e4dc, 0.82);
  g.fillEllipse(cx, cy + 2, 34, 38);
  // Wispy hem — fades out below the body
  g.fillStyle(0xe8e4dc, 0.3);
  g.fillEllipse(cx, cy + 19, 26, 16);

  // Top hat — brim then crown
  g.fillStyle(0x3a3a3a, 1);
  g.fillRect(cx - 10, cy - 19, 20, 12);   // hat crown
  g.fillRect(cx - 7, cy - 22, 14, 4);     // hat top (slightly narrower)
  // Hat band highlight
  g.fillStyle(0x5a5a5a, 0.6);
  g.fillRect(cx - 10, cy - 8, 20, 2);

  // Frock coat collar
  g.fillStyle(0x3a3a3a, 0.7);
  g.fillRect(cx - 11, cy + 3, 22, 10);

  // Right arm raised — spectral translucent
  g.fillStyle(0xe8e4dc, 0.7);
  g.fillRect(cx + 9, cy - 9, 6, 16);

  // Lantern globe — amber
  g.fillStyle(0xf5a623, 1);
  g.fillCircle(cx + 14, cy - 11, 6);
  // Amber corona
  g.fillStyle(0xf5a623, 0.2);
  g.fillCircle(cx + 14, cy - 11, 10);

  // Eye flames — gas-lamp yellow, hollow-oval silhouette
  g.fillStyle(0xf5a623, 1);
  g.fillEllipse(cx - 6, cy - 2, 5, 6);
  g.fillEllipse(cx + 4, cy - 2, 5, 6);
}

export function bakeAuldReekie(scene: Phaser.Scene): void {
  const s = AULD_REEKIE_CANVAS_SIZE;
  const g = scene.add.graphics();
  drawAuldReekieBody(g);
  g.generateTexture('boss_auld_reekie', s, s);
  g.destroy();
}

export function bakeGasLamp(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  const w = 20, h = 52;

  // Iron post
  g.fillStyle(0x2a2a2a, 1);
  g.fillRect(w / 2 - 3, h * 0.22, 6, h * 0.76);
  // Bracket
  g.fillRect(w / 2 - 7, h * 0.22, 14, 3);
  // Globe — amber
  g.fillStyle(0xf5a623, 0.9);
  g.fillCircle(w / 2, h * 0.13, 7);
  // Ambient glow ring (25% alpha)
  g.fillStyle(0xf5a623, 0.25);
  g.fillCircle(w / 2, h * 0.13, 12);

  g.generateTexture('prop_gas_lamp', w, h);
  g.destroy();
}

export function bakeLanternOrb(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  const r = 10;
  const s = r * 2 + 4;

  // Wisp trail dots
  g.fillStyle(0xf5a623, 0.20);
  g.fillCircle(s / 2 - r - 3, s / 2, 3);
  g.fillCircle(s / 2 - r - 6, s / 2, 2);
  // Core orb
  g.fillStyle(0xf5a623, 0.8);
  g.fillCircle(s / 2, s / 2, r);
  // Stroke ring
  g.lineStyle(1.5, 0xff8c00, 0.9);
  g.strokeCircle(s / 2, s / 2, r);

  g.generateTexture('lantern_orb', s, s);
  g.destroy();
}
