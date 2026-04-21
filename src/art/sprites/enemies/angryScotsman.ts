/**
 * `angry_scotsman` — red-faced shouting highlander with wild brows, ginger beard, tartan trousers. Also the fallback texture for the `berserker` config.
 */

import Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const ANGRY_SCOTSMAN_CANVAS_SIZE = 52;

export function drawAngryScotsmanBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = ANGRY_SCOTSMAN_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 2 + (frame.breathY ?? 0);
  const lly = frame.leftLegY ?? 0;
  const rly = frame.rightLegY ?? 0;

  // === Legs (bare, muscular, one sock fallen) ===
  g.fillStyle(0xcc7755, 1);
  g.fillRect(cx - 8, cy + 13 + lly, 6, 9);
  g.fillRect(cx + 2, cy + 13 + rly, 6, 9);
  g.fillStyle(0xeeeeee, 1);
  g.fillRect(cx + 2, cy + 19 + rly, 6, 4);
  g.fillStyle(0xdddddd, 0.8);
  g.fillRect(cx - 8, cy + 20 + lly, 6, 3);
  g.fillStyle(0xcccccc, 1);
  g.fillEllipse(cx - 5, cy + 21 + lly, 7, 3);

  // === Royal Stewart tartan kilt (THE kilt — bold, proud, swinging) ===
  g.fillStyle(0x771111, 1);
  g.fillRect(cx - 13, cy + 1, 26, 14);
  g.fillStyle(0xcc2222, 1);
  g.fillRect(cx - 12, cy + 2, 24, 12);
  // Green sett lines (horizontal + vertical)
  g.fillStyle(0x114411, 0.8);
  g.fillRect(cx - 12, cy + 4, 24, 2);
  g.fillRect(cx - 12, cy + 10, 24, 2);
  g.fillRect(cx - 8, cy + 2, 2, 12);
  g.fillRect(cx + 2, cy + 2, 2, 12);
  // Blue overchecks
  g.fillStyle(0x2244aa, 0.7);
  g.fillRect(cx - 12, cy + 7, 24, 1);
  g.fillRect(cx - 3, cy + 2, 1, 12);
  g.fillRect(cx + 7, cy + 2, 1, 12);
  // White guard lines
  g.fillStyle(0xffffff, 0.4);
  g.fillRect(cx - 12, cy + 3, 24, 1);
  g.fillRect(cx - 12, cy + 12, 24, 1);
  // Kilt pleats shadow (right side — back pleats visible at the side)
  g.fillStyle(0x991111, 0.5);
  g.fillRect(cx + 10, cy + 2, 1, 12);
  g.fillRect(cx + 12, cy + 2, 1, 12);
  // Kilt swinging motion shadow (bottom edge — it's swinging as he charges)
  g.fillStyle(0x661111, 0.4);
  g.fillRect(cx - 12, cy + 13, 24, 1);
  // Kilt pin (safety pin with clan crest — ornate)
  g.fillStyle(0xbbbbbb, 1);
  g.fillCircle(cx + 9, cy + 8, 1.2);
  g.fillStyle(0xeeeeee, 1);
  g.fillCircle(cx + 9, cy + 8, 0.6);
  // Pin shaft
  g.fillStyle(0xcccccc, 0.8);
  g.fillRect(cx + 9, cy + 9, 1, 3);

  // === Bare barrel chest (Groundskeeper Willie physique — HENCH) ===
  g.fillStyle(0xaa5533, 1);
  g.fillRect(cx - 14, cy - 9, 28, 12);
  g.fillStyle(0xddbb99, 1);
  g.fillRect(cx - 13, cy - 8, 26, 10);
  // Pec definition (this man does NOT skip chest day)
  g.fillStyle(0xccaa88, 0.4);
  g.fillEllipse(cx - 5, cy - 4, 8, 6);
  g.fillEllipse(cx + 5, cy - 4, 8, 6);
  // Sunburn / flush V-shape on chest
  g.fillStyle(0xee6644, 0.5);
  g.fillTriangle(cx - 8, cy - 8, cx + 8, cy - 8, cx, cy - 3);
  // CHEST HAIR (ginger, dense — the Willie special)
  g.fillStyle(0x883311, 0.5);
  g.fillCircle(cx - 3, cy - 4, 2);
  g.fillCircle(cx + 3, cy - 3, 2);
  g.fillCircle(cx, cy - 5, 1.5);
  g.fillCircle(cx - 1, cy - 2, 1);
  g.fillCircle(cx + 5, cy - 5, 1);
  g.fillCircle(cx - 5, cy - 5, 1);
  // Happy trail down to kilt
  g.fillStyle(0x883311, 0.4);
  g.fillRect(cx - 1, cy - 2, 2, 3);
  // Visible veins on arms (RAGING — blood pressure through the roof)
  g.fillStyle(0xcc8866, 0.4);
  g.lineStyle(0.7, 0xcc7755, 0.5);
  g.lineBetween(cx - 12, cy - 6, cx - 14, cy - 3);
  g.lineBetween(cx + 12, cy - 6, cx + 14, cy - 3);
  // Sweat beads on chest (he's working himself into a frenzy)
  g.fillStyle(0xaaddee, 0.3);
  g.fillCircle(cx + 6, cy - 6, 0.6);
  g.fillCircle(cx - 8, cy - 3, 0.5);

  // === Head (thick neck, pure FURY) ===
  // Neck (thick — veins visible)
  g.fillStyle(0xcc6644, 1);
  g.fillRect(cx - 5, cy - 10, 10, 4);
  g.fillStyle(0xdd8866, 1);
  g.fillRect(cx - 4, cy - 9, 8, 3);
  // Neck vein (pulsing with rage)
  g.lineStyle(0.6, 0xcc5544, 0.5);
  g.lineBetween(cx - 3, cy - 10, cx - 4, cy - 7);
  g.lineBetween(cx + 3, cy - 10, cx + 4, cy - 7);
  // Head (round, red, PURPLE with fury)
  g.fillStyle(0xaa5533, 1);
  g.fillCircle(cx, cy - 15, 10);
  g.fillStyle(0xdd8866, 1);
  g.fillCircle(cx, cy - 15, 9);
  // Rage flush (face going beetroot)
  g.fillStyle(0xee7755, 0.45);
  g.fillCircle(cx, cy - 14, 7);
  // Forehead veins (bursting with rage — like Gordon but rawer)
  g.lineStyle(0.8, 0xcc5533, 0.7);
  g.lineBetween(cx - 4, cy - 22, cx - 6, cy - 19);
  g.lineBetween(cx + 3, cy - 23, cx + 5, cy - 20);

  // === MASSIVE red beard (magnificent, wild, untamed) ===
  g.fillStyle(0x661100, 1);
  g.fillEllipse(cx, cy - 8, 20, 12);
  g.fillStyle(0xaa2a11, 1);
  g.fillEllipse(cx, cy - 8, 18, 10);
  g.fillStyle(0xcc4422, 1);
  g.fillEllipse(cx, cy - 9, 16, 8);
  // Lighter beard highlight (catches the light)
  g.fillStyle(0xdd5522, 0.6);
  g.fillEllipse(cx - 2, cy - 10, 10, 5);
  // Beard strands (wild, individual locks visible)
  g.fillStyle(0x881100, 1);
  g.fillRect(cx - 7, cy - 3, 2, 4);
  g.fillRect(cx - 3, cy - 2, 2, 5);
  g.fillRect(cx + 1, cy - 3, 2, 4);
  g.fillRect(cx + 5, cy - 2, 2, 5);
  // Braided strand or bead in beard (Viking touch)
  g.fillStyle(0x992211, 1);
  g.fillRect(cx, cy - 1, 2, 3);
  g.fillStyle(0xddaa00, 1);
  g.fillCircle(cx + 1, cy + 2, 1);
  g.fillStyle(0xffcc33, 0.6);
  g.fillCircle(cx + 1, cy + 2, 0.5);

  // === Furious eyebrows (MASSIVE, slammed down over the eyes) ===
  g.fillStyle(0x661100, 1);
  g.fillTriangle(cx - 9, cy - 19, cx - 2, cy - 17, cx - 2, cy - 19);
  g.fillTriangle(cx + 9, cy - 19, cx + 2, cy - 17, cx + 2, cy - 19);
  // Brow ridge shadow (deep-set rage eyes)
  g.fillStyle(0x993311, 0.4);
  g.fillRect(cx - 7, cy - 17, 14, 1);

  // === Eyes (tiny, narrowed, ABSOLUTELY RAGING) ===
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 4, cy - 16, 2);
  g.fillCircle(cx + 4, cy - 16, 2);
  // Bloodshot (red veins in eye whites)
  g.fillStyle(0xff6644, 0.3);
  g.fillCircle(cx - 4, cy - 16, 2);
  g.fillCircle(cx + 4, cy - 16, 2);
  g.fillStyle(0x111111, 1);
  g.fillCircle(cx - 4, cy - 16, 1);
  g.fillCircle(cx + 4, cy - 16, 1);

  // === SPITTLE (he's screaming — flecks of spit flying) ===
  g.fillStyle(0xffffff, 0.5);
  g.fillCircle(cx + 8, cy - 8, 0.6);
  g.fillCircle(cx + 10, cy - 10, 0.5);
  g.fillCircle(cx + 6, cy - 6, 0.4);

  // === Buckfast bottle (dark green glass, cream label, gold foil neck) ===
  g.fillStyle(0x0a2a0a, 1);
  g.fillRect(cx + 13, cy - 4, 5, 12);
  g.fillStyle(0x1a4418, 1);
  g.fillRect(cx + 14, cy - 3, 3, 10);
  g.fillStyle(0xddaa44, 1);
  g.fillRect(cx + 13, cy - 1, 5, 5);
  g.fillStyle(0xeeddbb, 1);
  g.fillRect(cx + 14, cy, 3, 3);
  g.fillStyle(0x0a2a0a, 1);
  g.fillRect(cx + 15, cy - 7, 2, 4);
  g.fillStyle(0xccaa22, 1);
  g.fillRect(cx + 14, cy - 8, 4, 2);
  g.fillStyle(0xddbb33, 1);
  g.fillRect(cx + 15, cy - 9, 2, 1);

  // === Sgian-dubh handle in right sock ===
  g.fillStyle(0x111111, 1);
  g.fillRect(cx + 4, cy + 19 + rly, 2, 3);
  g.fillStyle(0xcc8833, 1);
  g.fillCircle(cx + 5, cy + 19 + rly, 1);

  // === Kilt pin ===
  g.fillStyle(0xcccccc, 1);
  g.fillCircle(cx + 9, cy + 9, 1);
  g.fillStyle(0xeeeeee, 1);
  g.fillCircle(cx + 9, cy + 9, 0.5);

}

export function bakeAngryScotsman(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawAngryScotsmanBody(g);
  g.generateTexture('angry_scotsman', ANGRY_SCOTSMAN_CANVAS_SIZE, ANGRY_SCOTSMAN_CANVAS_SIZE);
  g.destroy();
}

/** Ned — Glesga's finest. Shiny shell suit, Burberry cap tilted at 45°,
 *  white socks pulled high, trainers, pure menace. Fast flanking enemy.
 *  Texture key kept as 'kelpie' for data compatibility. */
