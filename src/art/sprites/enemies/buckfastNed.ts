/**
 * `buckfast_ned` — hooded gaunt face, tracksuit, gold chain, Buckfast bottle clutched tight. Gantry-at-Trongate identity.
 */

import Phaser from 'phaser';

export function bakeBuckfastNed(scene: Phaser.Scene): void {
  const s = 44;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // Tracksuit legs (navy with white stripe).
  g.fillStyle(0x0a1428, 1);
  g.fillRect(cx - 5, cy + 8, 4, 10);
  g.fillRect(cx + 1, cy + 8, 4, 10);
  g.fillStyle(0xdcdcdc, 1);
  g.fillRect(cx - 4, cy + 8, 1, 10);
  g.fillRect(cx + 2, cy + 8, 1, 10);
  // Trainers.
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(cx - 3, cy + 19, 5, 2);
  g.fillEllipse(cx + 3, cy + 19, 5, 2);

  // Tracksuit top (matching navy, hood up).
  g.fillStyle(0x0a1428, 1);
  g.fillRect(cx - 7, cy - 6, 14, 14);
  g.fillStyle(0x1a2438, 1);
  g.fillRect(cx - 6, cy - 5, 12, 12);
  // White chest zip.
  g.fillStyle(0xdcdcdc, 0.7);
  g.fillRect(cx, cy - 5, 1, 11);
  // Hood shadow framing the face.
  g.fillStyle(0x050810, 1);
  g.fillEllipse(cx, cy - 10, 12, 8);

  // Pale gaunt face in the hood (sharp cheekbones, sunk eyes).
  g.fillStyle(0xd8b89a, 1);
  g.fillEllipse(cx, cy - 10, 8, 6);
  g.fillStyle(0x111111, 1);
  g.fillCircle(cx - 2, cy - 10, 0.8);
  g.fillCircle(cx + 2, cy - 10, 0.8);
  // Thin scowl.
  g.lineStyle(0.8, 0x222222, 1);
  g.lineBetween(cx - 1, cy - 7, cx + 2, cy - 7);

  // Buckfast bottle in right hand — dark green glass, cream label, gold foil.
  g.fillStyle(0x0a2a0a, 1);
  g.fillRect(cx + 7, cy - 1, 4, 11);
  g.fillStyle(0x1a4418, 1);
  g.fillRect(cx + 8, cy, 2, 9);
  g.fillStyle(0xeeddbb, 1);
  g.fillRect(cx + 7, cy + 3, 4, 3);
  g.fillStyle(0xccaa22, 1);
  g.fillRect(cx + 8, cy - 3, 2, 3);

  // Shadow under the figure.
  g.fillStyle(0x000000, 0.25);
  g.fillEllipse(cx, cy + 20, 12, 3);

  g.generateTexture('buckfast_ned', s, s);
  g.destroy();
}

/**
 * Traffic Cone Totem — DESIGN_IDEAS section 3 Urban Ghaists #2.
 * Three stacked Glasgow-orange traffic cones on a slick base. Static
 * (chase at speed 0) so the hit-response path stays standard. When
 * killed the totem collapses and spits four slick patches in the
 * cardinals (wired through EnemyKillHandler.onTotemFall).
 */
