/**
 * `redcap` — Border-folklore redcap: malicious goblin who dyes his
 * cap in the blood of travellers. Design pivot: the old 6px cap was
 * a tiny lozenge on a stocky body that could read as any goblin. New
 * approach — the BLOOD-SOAKED CAP dominates the silhouette (nearly
 * half the sprite height), with wet drip running down one side onto
 * the face. Iron-shod boots as chunky blocks (canon: iron boots to
 * outrun victims), gnarled fists clenched, yellow eyes glowing out
 * from under the cap brim.
 */

import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const REDCAP_CANVAS_SIZE = 32;

export function drawRedcapBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = REDCAP_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 2 + (frame.breathY ?? 0);
  const lly = frame.leftLegY ?? 0;
  const rly = frame.rightLegY ?? 0;

  // ── Iron-shod boots — signature redcap prop. Chunky black-grey
  // blocks with rivet studs. ──
  g.fillStyle(0x1a1a1e, 1);
  g.fillRect(cx - 6, cy + 7 + lly, 5, 4);
  g.fillRect(cx + 1, cy + 7 + rly, 5, 4);
  g.fillStyle(0x3a3a42, 1);
  g.fillRect(cx - 6, cy + 7 + lly, 5, 1);
  g.fillRect(cx + 1, cy + 7 + rly, 5, 1);
  // Iron rivets on the toe
  g.fillStyle(0x6a6a72, 1);
  g.fillCircle(cx - 5, cy + 10 + lly, 0.4);
  g.fillCircle(cx - 2, cy + 10 + lly, 0.4);
  g.fillCircle(cx + 2, cy + 10 + rly, 0.4);
  g.fillCircle(cx + 5, cy + 10 + rly, 0.4);

  // ── Stocky body — earthy rag-clothing, darker than before so the
  // red cap pops harder. ──
  g.fillStyle(0x1a0e08, 1);
  g.fillEllipse(cx, cy + 4, 12, 9);
  g.fillStyle(0x3a2418, 1);
  g.fillEllipse(cx, cy + 3, 10, 7);
  // Rope belt
  g.fillStyle(0x6a4828, 1);
  g.fillRect(cx - 5, cy + 2, 10, 0.8);

  // ── Clenched fists — gnarled, hungry. One grips a short iron
  // dirk (small knife, not a pike — reads at scale). ──
  g.fillStyle(0x7a6048, 1);
  g.fillCircle(cx - 6, cy + 1, 1.5);
  g.fillCircle(cx + 6, cy + 1, 1.5);
  // Dirk in right hand — tiny iron blade
  g.fillStyle(0x1a1a1e, 1);
  g.fillRect(cx + 7, cy - 3, 1.2, 4);
  g.fillStyle(0x6a6a72, 1);
  g.fillRect(cx + 7, cy - 3, 0.6, 4);
  // Dirk grip (leather wrap)
  g.fillStyle(0x3a2010, 1);
  g.fillRect(cx + 6.5, cy + 1, 2, 1);

  // ── Face — pale sickly green-grey, smaller than before so the
  // cap reads larger. ──
  g.fillStyle(0x889a70, 1);
  g.fillEllipse(cx, cy - 3, 8, 7);
  g.fillStyle(0x98aa80, 1);
  g.fillEllipse(cx, cy - 4, 6, 5);

  // ── Pointed goblin ears — sticking out from under the cap. ──
  g.fillStyle(0x788a60, 1);
  g.fillTriangle(cx - 4, cy - 4, cx - 4, cy - 1, cx - 7, cy - 3);
  g.fillTriangle(cx + 4, cy - 4, cx + 4, cy - 1, cx + 7, cy - 3);

  // ── Yellow hungry eyes — burning out from cap-shadow. ──
  g.fillStyle(0xffd040, 1);
  g.fillCircle(cx - 2, cy - 4, 1.2);
  g.fillCircle(cx + 2, cy - 4, 1.2);
  g.fillStyle(0x000000, 1);
  g.fillCircle(cx - 2, cy - 4, 0.5);
  g.fillCircle(cx + 2, cy - 4, 0.5);

  // ── Toothy grin — wide, jagged. ──
  g.fillStyle(0x1a0806, 1);
  g.fillRect(cx - 3, cy - 1, 6, 1.5);
  g.fillStyle(0xfff8d0, 1);
  g.fillRect(cx - 3, cy - 1, 1, 1.2);
  g.fillRect(cx - 1, cy - 0.5, 1, 1);
  g.fillRect(cx + 1, cy - 1, 1, 1.2);
  g.fillRect(cx + 2.5, cy - 0.5, 1, 1);

  // ── THE CAP — blood-soaked, towering, unmistakable silhouette.
  // Pointed wizard-style cone shape covering the top 40% of sprite. ──
  // Outer dark-blood outline
  g.fillStyle(0x500808, 1);
  g.fillTriangle(cx - 7, cy - 7, cx + 7, cy - 7, cx + 2, cy - 16);
  g.fillTriangle(cx - 7, cy - 7, cx + 2, cy - 16, cx - 3, cy - 14);
  // Main cap body — vivid blood red
  g.fillStyle(0xc42828, 1);
  g.fillTriangle(cx - 6, cy - 7, cx + 6, cy - 7, cx + 1.5, cy - 15);
  g.fillTriangle(cx - 6, cy - 7, cx + 1.5, cy - 15, cx - 2.5, cy - 13);
  // Wet highlight on the cap — freshly dipped
  g.fillStyle(0xe84040, 1);
  g.fillTriangle(cx - 4, cy - 7, cx - 2, cy - 12, cx - 3, cy - 8);
  g.fillStyle(0xff6060, 0.85);
  g.fillRect(cx - 3, cy - 10, 0.8, 3);
  // Cap brim — darker strip where blood has pooled
  g.fillStyle(0x3a0606, 1);
  g.fillRect(cx - 7, cy - 8, 14, 1.5);

  // ── Blood drip running down — DOMINANT storytelling detail. Big
  // drip on the right side of the face. ──
  g.fillStyle(0x901818, 1);
  g.fillRect(cx + 4, cy - 7, 1.5, 4);
  g.fillStyle(0xc42828, 0.95);
  g.fillCircle(cx + 4.5, cy - 3, 1);
  // Second smaller drip on the left
  g.fillStyle(0x901818, 1);
  g.fillRect(cx - 5, cy - 6, 0.8, 2);
  g.fillStyle(0xc42828, 0.9);
  g.fillCircle(cx - 4.8, cy - 4, 0.6);
}

export function bakeRedcap(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawRedcapBody(g);
  g.generateTexture('redcap', REDCAP_CANVAS_SIZE, REDCAP_CANVAS_SIZE);
  g.destroy();
}
