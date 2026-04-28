/**
 * Cu Sith — Highland fairy hound; the death-omen black-green hound
 * that howls thrice on a moor. SCOTTISH_RESEARCH.md §1.2; the
 * `ui.banter.death_reflection.h` line ("Cu Sith nae howled — ye
 * went easy") foreshadowed this enemy's eventual ship. Cù Sìth is
 * Gaelic for "fairy hound" — green-coated (mossy mountain green
 * per the legend, NOT black like the barghest), shaggy, the size
 * of a young bullock. Its three bays (hools) carry across miles;
 * the third hool catches anyone caught in the open.
 *
 * Visual identity vs. barghest:
 *  - Body palette: mossy green-grey, not black-charcoal.
 *  - Fur: longer, shaggier — the legend specifies long matted hair.
 *  - Tail: curled bushy on the back, not curled-shadow like barghest.
 *  - Eyes: pale cyan-white (otherworldly, not red wrath).
 *  - Ears: tall pointed, both intact — no battle-notch.
 */

import * as Phaser from 'phaser';
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const CU_SITH_CANVAS_SIZE = 44;

export function drawCuSithBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = CU_SITH_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 2 + (frame.breathY ?? 0);
  const lly = frame.leftLegY ?? 0;  // front legs
  const rly = frame.rightLegY ?? 0; // back legs

  // Mossy spectral halo — Grave-fey register. Greener than barghest's
  // purple-grey halo; closer to the moss the fairy hounds were said
  // to leave on rocks they passed.
  g.fillStyle(0x1a3024, 0.32);
  g.fillEllipse(cx, cy + 4, 32, 16);
  g.fillStyle(0x2a4030, 0.18);
  g.fillEllipse(cx, cy + 4, 36, 18);

  // Paw contact shadow — pool under the four feet.
  g.fillStyle(0x000000, 0.42);
  g.fillEllipse(cx - 1, cy + 14, 24, 3);

  // Body — mossy green base. Bullock-sized per legend so the silhouette
  // reads as bigger than barghest within the same canvas.
  g.fillStyle(0x1a2820, 1);
  g.fillEllipse(cx, cy + 4, 28, 13);
  g.fillStyle(0x2a4030, 1);
  g.fillEllipse(cx, cy + 3, 24, 11);
  // Top-light shoulder gradient — sage-green lifts on the upper curve.
  g.fillStyle(0x40553a, 0.85);
  g.fillEllipse(cx, cy + 1, 20, 6);
  g.fillStyle(0x5a704c, 0.5);
  g.fillEllipse(cx - 1, cy, 16, 4);

  // Shaggy fur tufts — long matted strokes along the flank.
  g.fillStyle(0x0e1a14, 0.85);
  g.fillEllipse(cx - 7, cy + 5, 5, 2.5);
  g.fillEllipse(cx + 4, cy + 6, 5, 2.5);
  g.fillEllipse(cx - 2, cy + 7, 4, 2);
  // Spine tuft — ragged bristle along the back.
  g.fillStyle(0x080f0a, 0.75);
  g.fillRect(cx - 9, cy - 1, 16, 0.7);
  // Belly fringe — a darker hanging band; the legend's matted fur.
  g.fillStyle(0x0a140d, 0.9);
  g.fillRect(cx - 9, cy + 8, 18, 0.8);

  // Legs — 4, slightly heavier than barghest (the bullock comparison).
  g.fillStyle(0x0e1a14, 1);
  g.fillRect(cx - 11, cy + 8 + rly, 3, 7);
  g.fillRect(cx - 4, cy + 9 + rly, 3, 6);
  g.fillRect(cx + 2, cy + 9 + lly, 3, 6);
  g.fillRect(cx + 9, cy + 8 + lly, 3, 7);
  // Pale claw glints — sage rather than barghest's pure grey.
  g.fillStyle(0x7a8c70, 0.85);
  g.fillRect(cx - 11, cy + 14 + rly, 3, 1);
  g.fillRect(cx - 4, cy + 14 + rly, 3, 1);
  g.fillRect(cx + 2, cy + 14 + lly, 3, 1);
  g.fillRect(cx + 9, cy + 14 + lly, 3, 1);

  // Tail — bushy, curled UP over the back (signature Cu Sith feature
  // per legend, distinct from barghest's curled-shadow trail).
  g.fillStyle(0x0e1a14, 1);
  g.fillCircle(cx - 13, cy - 2, 3);
  g.fillStyle(0x2a4030, 1);
  g.fillCircle(cx - 13, cy - 2, 2);
  // Tuft tip flick.
  g.fillStyle(0x40553a, 0.8);
  g.fillCircle(cx - 14, cy - 4, 1);

  // Head — slightly larger than barghest, broader brow.
  g.fillStyle(0x0e1a14, 1);
  g.fillEllipse(cx + 11, cy, 10, 8);
  g.fillStyle(0x1f3024, 1);
  g.fillEllipse(cx + 11, cy - 1, 8, 6);
  // Brow ridge top-light.
  g.fillStyle(0x40553a, 0.85);
  g.fillEllipse(cx + 11, cy - 2.5, 6, 1.6);
  // Snout shadow.
  g.fillStyle(0x040a06, 0.85);
  g.fillRect(cx + 12, cy + 2, 5, 0.7);

  // Ears — tall pointed, both intact (Cu Sith ears notably erect per
  // legend; no battle-notch like barghest).
  g.fillStyle(0x0e1a14, 1);
  g.fillTriangle(cx + 7, cy - 4, cx + 5, cy - 11, cx + 9, cy - 6);
  g.fillTriangle(cx + 13, cy - 4, cx + 16, cy - 11, cx + 15, cy - 5);
  // Inner-ear pink — the soft cartilage warms the silhouette.
  g.fillStyle(0xa07088, 0.6);
  g.fillRect(cx + 6.5, cy - 9, 0.6, 3);
  g.fillRect(cx + 14.6, cy - 9, 0.6, 3);

  // Eyes — pale cyan-white (otherworldly fey-light, NOT barghest red).
  // Bigger bloom than barghest because the Cu Sith's gaze is the
  // first thing legend-tellers describe.
  g.fillStyle(0x88e8ff, 0.45);
  g.fillCircle(cx + 10, cy - 1, 2.4);
  g.fillCircle(cx + 14, cy - 1, 2.4);
  g.fillStyle(0xc4f4ff, 1);
  g.fillCircle(cx + 10, cy - 1, 1.3);
  g.fillCircle(cx + 14, cy - 1, 1.3);
  g.fillStyle(0xe0fcff, 0.95);
  g.fillCircle(cx + 10, cy - 1, 0.7);
  g.fillCircle(cx + 14, cy - 1, 0.7);
  // Pinprick highlight.
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx + 10, cy - 1.3, 0.3);
  g.fillCircle(cx + 14, cy - 1.3, 0.3);

  // Mouth — closed, jaw line visible. The Cu Sith doesn't bare fangs;
  // its threat is the howl, not the bite. Differentiates from
  // barghest's snarl.
  g.fillStyle(0x040a06, 1);
  g.fillRect(cx + 13, cy + 2.5, 4, 0.5);

  // Three trailing motes — folkloric "third hool" signature. The
  // legend says the mist trails the Cu Sith for a long stride; three
  // pale bays hang in the air after each hool.
  g.fillStyle(0xc4f4ff, 0.4);
  g.fillCircle(cx - 19, cy + 1, 1.4);
  g.fillStyle(0x88e8ff, 0.32);
  g.fillCircle(cx - 22, cy + 3, 1.2);
  g.fillStyle(0x5acce0, 0.22);
  g.fillCircle(cx - 25, cy + 5, 1.0);
}

export function bakeCuSith(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawCuSithBody(g);
  g.generateTexture('cu_sith', CU_SITH_CANVAS_SIZE, CU_SITH_CANVAS_SIZE);
  g.destroy();
}
