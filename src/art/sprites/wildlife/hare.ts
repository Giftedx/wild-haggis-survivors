/**
 * Scottish mountain hare — 24x24 procedural sprite with idle breathing
 * and hop animation frames. Compact brown oval body, tall pointed ears,
 * white tail puff, tiny dark eye.
 */
import * as Phaser from 'phaser';

export const HARE_CANVAS_SIZE = 24;

interface HareFrame {
  /** Vertical offset for breathing animation (positive = down). */
  breathY?: number;
  /** Vertical offset for hop arc (negative = up). */
  hopY?: number;
  /** Hop arc phase (0 = compressed crouch, 0.5 = stretched midair, 1 = landing). */
  hopPhase?: number;
}

export function drawHareBody(g: Phaser.GameObjects.Graphics, frame: HareFrame): void {
  const cx = 12;
  const baseY = 16;
  const offY = (frame.breathY ?? 0) + (frame.hopY ?? 0);
  const bodyY = baseY + offY;
  const phase = frame.hopPhase ?? -1;
  // Squash on takeoff/landing, stretch at apex — gives the hop weight.
  const squash = phase < 0 ? 0 : phase < 0.25 ? -1 : phase < 0.6 ? 1 : phase < 0.85 ? 0 : -1;
  const bodyW = 14 + squash;
  const bodyH = 9 - squash;
  const outlineW = bodyW + 2;
  const outlineH = bodyH + 1;

  // Ground shadow — anchors the hop arc; fades out at apex.
  if (phase >= 0) {
    const shadowAlpha = phase < 0.6 ? 0.4 - phase * 0.4 : 0.05;
    g.fillStyle(0x1a1208, shadowAlpha);
    g.fillEllipse(cx, baseY + 6, 12, 2.5);
  } else {
    // Idle / move — soft contact shadow under the feet.
    g.fillStyle(0x1a1208, 0.3);
    g.fillEllipse(cx, bodyY + 5, 11, 2);
  }

  // Body outline — gives the tiny hare a crisp read against heather.
  g.fillStyle(0x2a1a10, 1);
  g.fillEllipse(cx, bodyY + 1, outlineW, outlineH);

  // Body — warm brown oval.
  g.fillStyle(0x8b6c4a, 1);
  g.fillEllipse(cx, bodyY, bodyW, bodyH);

  // Lighter belly highlight
  g.fillStyle(0xa88860, 1);
  g.fillEllipse(cx, bodyY + 1, bodyW - 4, bodyH - 4);

  // Back dapple — a subtle dorsal warm streak so peripheral motion shows form.
  g.fillStyle(0xb88858, 0.55);
  g.fillRect(cx - bodyW / 2 + 2, bodyY - 2, bodyW - 4, 1);

  // Ear lay: tucked back at takeoff/landing, swept upright at apex.
  const earLay = phase < 0 ? 0 : phase < 0.25 ? 2 : phase < 0.6 ? -1 : phase < 0.85 ? 0 : 2;
  const earBaseY = bodyY - 9 + earLay;

  // Left ear — taller silhouette with dark backing.
  g.fillStyle(0x2a1a10, 1);
  g.fillEllipse(cx - 3, earBaseY, 4, 11);
  g.fillStyle(0x8b6c4a, 1);
  g.fillEllipse(cx - 3, earBaseY, 3, 10);
  // Black ear tip — mountain hare field mark.
  g.fillStyle(0x1a1008, 1);
  g.fillEllipse(cx - 3, earBaseY - 4, 2.5, 2);
  // Inner ear pink
  g.fillStyle(0xc89888, 1);
  g.fillEllipse(cx - 3, earBaseY, 1.5, 6);

  // Right ear with dark backing.
  g.fillStyle(0x2a1a10, 1);
  g.fillEllipse(cx + 3, earBaseY, 4, 11);
  g.fillStyle(0x8b6c4a, 1);
  g.fillEllipse(cx + 3, earBaseY, 3, 10);
  // Black ear tip.
  g.fillStyle(0x1a1008, 1);
  g.fillEllipse(cx + 3, earBaseY - 4, 2.5, 2);
  // Inner ear pink
  g.fillStyle(0xc89888, 1);
  g.fillEllipse(cx + 3, earBaseY, 1.5, 6);

  // Eye — tiny dark dot (right-facing default)
  g.fillStyle(0x1a1008, 1);
  g.fillCircle(cx + 3, bodyY - 3, 1.4);

  // Eye shine — bigger highlight so the face stays alive at 1x.
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(cx + 3.5, bodyY - 3.5, 0.7);

  // White tail puff with a darker edge tuft so it reads as fur, not paint.
  g.fillStyle(0x2a1a10, 1);
  g.fillCircle(cx - 7, bodyY - 1, 3);
  g.fillStyle(0xeee8dd, 1);
  g.fillCircle(cx - 7, bodyY - 1, 2.5);
  g.fillStyle(0xfff8e8, 0.8);
  g.fillCircle(cx - 7.5, bodyY - 1.6, 1);

  // Nose
  g.fillStyle(0x4a2a18, 1);
  g.fillCircle(cx + 7, bodyY - 2, 1.2);
  // Nose highlight pixel.
  g.fillStyle(0xc89888, 0.8);
  g.fillRect(cx + 6.5, bodyY - 2.5, 0.7, 0.7);

  // Feet — slightly shifted depending on hop phase.
  const footY = bodyY + 4 + (phase >= 0 && (phase < 0.25 || phase > 0.85) ? 1 : 0);
  g.fillStyle(0x3a2418, 1);
  g.fillRect(cx - 4, footY, 4, 1);
  g.fillRect(cx + 1, footY, 4, 1);

  // Whisker pair — two strokes per side, brighter so they survive ambient render.
  g.lineStyle(0.8, 0xfff0d0, 0.95);
  g.lineBetween(cx + 6, bodyY - 1, cx + 10, bodyY - 2);
  g.lineBetween(cx + 6, bodyY, cx + 10, bodyY + 1);

  // Dust mark under feet on takeoff and landing only.
  if (phase >= 0 && (phase < 0.25 || phase > 0.85)) {
    g.fillStyle(0xc8b090, 0.55);
    g.fillCircle(cx - 5, baseY + 6, 1.2);
    g.fillCircle(cx + 5, baseY + 6, 1.2);
    g.fillStyle(0xc8b090, 0.35);
    g.fillCircle(cx - 7, baseY + 5, 0.7);
    g.fillCircle(cx + 7, baseY + 5, 0.7);
  }
}

export function bakeHare(scene: Phaser.Scene): void {
  const s = HARE_CANVAS_SIZE;

  // Idle frames (breathing) — used by legacy HareWildlife system
  for (let i = 0; i < 2; i++) {
    const g = scene.add.graphics();
    drawHareBody(g, { breathY: i === 0 ? 1 : -1 });
    g.generateTexture(`hare_idle_${i}`, s, s);
    g.destroy();
  }

  // Hop frames (4-frame arc) — used by legacy HareWildlife system
  const hopYs = [0, -3, -5, -2];
  const hopPhases = [0.1, 0.45, 0.7, 0.95];
  for (let i = 0; i < 4; i++) {
    const g = scene.add.graphics();
    drawHareBody(g, { hopY: hopYs[i], hopPhase: hopPhases[i] });
    g.generateTexture(`hare_hop_${i}`, s, s);
    g.destroy();
  }

  // T9 WildlifeSystem keys — two-frame (idle / move) interface
  const gIdle = scene.add.graphics();
  drawHareBody(gIdle, { breathY: 1 });
  gIdle.generateTexture('wildlife_hare_idle', s, s);
  gIdle.destroy();

  const gMove = scene.add.graphics();
  drawHareBody(gMove, { hopY: -3, hopPhase: 0.5 });
  gMove.generateTexture('wildlife_hare_move', s, s);
  gMove.destroy();
}
