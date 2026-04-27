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
  // Top-light highlight on the boot caps — defines the iron shape.
  g.fillStyle(0x4a4a52, 1);
  g.fillRect(cx - 6, cy + 7 + lly, 5, 1);
  g.fillRect(cx + 1, cy + 7 + rly, 5, 1);
  // Side-light streak — lifts the iron from flat black.
  g.fillStyle(0x6a6a76, 0.7);
  g.fillRect(cx - 6, cy + 7.6 + lly, 0.7, 2.4);
  g.fillRect(cx + 1, cy + 7.6 + rly, 0.7, 2.4);
  // Iron rivets on the toe — bigger, with a polished shine. Two rows
  // (toe + heel) so the studs read at gameplay scale.
  g.fillStyle(0x8a8a94, 1);
  g.fillCircle(cx - 5, cy + 8.6 + lly, 0.55);
  g.fillCircle(cx - 2, cy + 8.6 + lly, 0.55);
  g.fillCircle(cx + 2, cy + 8.6 + rly, 0.55);
  g.fillCircle(cx + 5, cy + 8.6 + rly, 0.55);
  g.fillCircle(cx - 5, cy + 10.2 + lly, 0.5);
  g.fillCircle(cx - 2, cy + 10.2 + lly, 0.5);
  g.fillCircle(cx + 2, cy + 10.2 + rly, 0.5);
  g.fillCircle(cx + 5, cy + 10.2 + rly, 0.5);
  // Pinprick highlight on each stud — sells the polished iron.
  g.fillStyle(0xeaeaee, 0.9);
  g.fillCircle(cx - 5, cy + 8.4 + lly, 0.18);
  g.fillCircle(cx - 2, cy + 8.4 + lly, 0.18);
  g.fillCircle(cx + 2, cy + 8.4 + rly, 0.18);
  g.fillCircle(cx + 5, cy + 8.4 + rly, 0.18);

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
  g.fillCircle(cx - 6, cy + 1, 1.6);
  g.fillCircle(cx + 6, cy + 1, 1.6);
  // Knuckle highlight — separates fingers from forearm shadow.
  g.fillStyle(0x9a8060, 0.85);
  g.fillCircle(cx - 6, cy + 0.4, 0.7);
  g.fillCircle(cx + 6, cy + 0.4, 0.7);
  // Dirk in right hand — bigger iron blade with a clear shimmer
  // stripe and a wider crossguard so the weapon reads.
  g.fillStyle(0x0a0a0e, 1);
  g.fillRect(cx + 6.6, cy - 5, 2, 6);
  g.fillStyle(0x4a4a52, 1);
  g.fillRect(cx + 6.6, cy - 5, 2, 1.2);
  // Polished edge — vertical bright line down the blade.
  g.fillStyle(0xe0e0e8, 0.9);
  g.fillRect(cx + 7.4, cy - 4.8, 0.5, 5);
  // Tiny diagonal shimmer flash — the killing-edge highlight.
  g.fillStyle(0xffffff, 0.85);
  g.fillRect(cx + 7.4, cy - 3.2, 0.4, 0.8);
  // Crossguard at the hilt — a brass strip that breaks the silhouette.
  g.fillStyle(0xaa7a28, 1);
  g.fillRect(cx + 5.8, cy + 0.8, 3.6, 0.7);
  g.fillStyle(0xffd070, 0.9);
  g.fillRect(cx + 5.8, cy + 0.8, 3.6, 0.3);
  // Dirk grip (leather wrap) — wrapped grip ridge below the guard.
  g.fillStyle(0x3a2010, 1);
  g.fillRect(cx + 6.4, cy + 1.4, 2.4, 1.4);
  g.fillStyle(0x6a3818, 0.85);
  g.fillRect(cx + 6.4, cy + 1.4, 2.4, 0.4);

  // ── Face — pale sickly green-grey, lifted contrast so it doesn't
  // disappear under the cap shadow (audit dislike: "face is cramped").
  // Outer rim slightly darker, mid pulled up brighter. ──
  g.fillStyle(0x687a58, 1);
  g.fillEllipse(cx, cy - 3, 8.4, 7.2);
  g.fillStyle(0xa8c090, 1);
  g.fillEllipse(cx, cy - 4, 6.4, 5.2);
  // Cheekbone highlight — top-light strip just under the brow shadow
  // so the face reads as a 3D mass not a flat plate.
  g.fillStyle(0xc0d8a8, 0.85);
  g.fillRect(cx - 2.5, cy - 5.5, 5, 0.6);

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

  // ── Blood drip running down — DOMINANT storytelling detail with
  // VOLUME (audit dislike: "blood drip detail may vanish"). Two thick
  // streams either side of the face plus a fat about-to-fall droplet.
  // Right-side stream — wide and wet.
  g.fillStyle(0x500808, 1);
  g.fillRect(cx + 3.6, cy - 7, 2.2, 5);
  g.fillStyle(0x901818, 1);
  g.fillRect(cx + 4, cy - 7, 1.6, 5);
  g.fillStyle(0xc42828, 0.95);
  g.fillCircle(cx + 4.6, cy - 2.4, 1.3);
  g.fillStyle(0xff4040, 0.85);
  g.fillRect(cx + 4.4, cy - 6.4, 0.6, 3);
  // Big about-to-detach droplet hanging off the chin
  g.fillStyle(0x6a0808, 1);
  g.fillCircle(cx + 5.2, cy - 0.5, 1.1);
  g.fillStyle(0xc42828, 1);
  g.fillCircle(cx + 5.2, cy - 0.7, 0.7);
  g.fillStyle(0xff5050, 0.9);
  g.fillCircle(cx + 5, cy - 1, 0.3);
  // Left-side stream — slightly thinner, also volumetric.
  g.fillStyle(0x500808, 1);
  g.fillRect(cx - 5.2, cy - 6, 1.4, 4);
  g.fillStyle(0x901818, 1);
  g.fillRect(cx - 5, cy - 6, 1, 4);
  g.fillStyle(0xc42828, 0.95);
  g.fillCircle(cx - 4.7, cy - 1.8, 0.9);
  // Spatter dots on the cheek — fight-debris texture.
  g.fillStyle(0x8a1818, 0.95);
  g.fillCircle(cx + 1.5, cy - 1.5, 0.4);
  g.fillCircle(cx - 2, cy - 1, 0.35);
  g.fillCircle(cx + 3, cy - 0.5, 0.3);
}

export function bakeRedcap(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawRedcapBody(g);
  g.generateTexture('redcap', REDCAP_CANVAS_SIZE, REDCAP_CANVAS_SIZE);
  g.destroy();
}
