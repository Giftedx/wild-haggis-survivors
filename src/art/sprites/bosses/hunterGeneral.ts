/**
 * `boss_hunter_general` — scaled-up haggis hunter with rifle, bandolier, hi-viz gilet + beret. The paramilitary evolution of the lone hunter.
 */

import Phaser from 'phaser';

export function bakeBossHunterGeneral(scene: Phaser.Scene): void {
  const s = 80;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 4;

  // === Military body (safari khaki-green, not camo) ===
  g.fillStyle(0x1a2a11, 1);
  g.fillCircle(cx, cy + 2, 30);
  g.fillStyle(0x3a5a28, 1);
  g.fillCircle(cx, cy + 2, 28);
  g.fillStyle(0x4a6a38, 1);
  g.fillCircle(cx, cy, 24);

  // === Jodhpurs visible below (buff/khaki riding pants) ===
  g.fillStyle(0x887755, 1);
  g.fillRect(cx - 12, cy + 18, 10, 6);
  g.fillRect(cx + 2, cy + 18, 10, 6);
  // Riding boots (tall, polished brown)
  g.fillStyle(0x442211, 1);
  g.fillRect(cx - 12, cy + 22, 10, 4);
  g.fillRect(cx + 2, cy + 22, 10, 4);
  g.fillStyle(0x553322, 1);
  g.fillRect(cx - 11, cy + 22, 8, 3);
  g.fillRect(cx + 3, cy + 22, 8, 3);

  // === Gold shoulder epaulettes (MASSIVE, ostentatious) ===
  g.fillStyle(0x886600, 1);
  g.fillRect(cx - 24, cy - 8, 8, 5);
  g.fillRect(cx + 16, cy - 8, 8, 5);
  g.fillStyle(0xddaa00, 1);
  g.fillRect(cx - 23, cy - 7, 6, 3);
  g.fillRect(cx + 17, cy - 7, 6, 3);
  // Fringe tassels
  g.fillStyle(0xccaa00, 1);
  g.fillRect(cx - 24, cy - 4, 1, 3);
  g.fillRect(cx - 22, cy - 4, 1, 3);
  g.fillRect(cx - 20, cy - 4, 1, 3);
  g.fillRect(cx + 20, cy - 4, 1, 3);
  g.fillRect(cx + 22, cy - 4, 1, 3);

  // === Medals row (5 medals — he awards himself new ones weekly) ===
  g.fillStyle(0xcc2222, 1);
  g.fillCircle(cx - 10, cy + 2, 2.5);
  g.fillStyle(0xddaa00, 1);
  g.fillCircle(cx - 5, cy + 2, 2.5);
  g.fillStyle(0x2244aa, 1);
  g.fillCircle(cx, cy + 2, 2.5);
  g.fillStyle(0x22aa44, 1);
  g.fillCircle(cx + 5, cy + 2, 2.5);
  g.fillStyle(0xdddddd, 1);
  g.fillCircle(cx + 10, cy + 2, 2.5);
  // Medal ribbons
  g.fillStyle(0xcc2222, 0.7);
  g.fillRect(cx - 11, cy - 1, 3, 2);
  g.fillStyle(0xddaa00, 0.7);
  g.fillRect(cx - 6, cy - 1, 3, 2);
  g.fillStyle(0x2244aa, 0.7);
  g.fillRect(cx - 1, cy - 1, 3, 2);

  // === Face (ruddy, supremely confident, colonial pomposity) ===
  g.fillStyle(0xaa6644, 1);
  g.fillCircle(cx, cy - 6, 12);
  g.fillStyle(0xffccaa, 1);
  g.fillCircle(cx, cy - 6, 11);

  // Handlebar mustache (MASSIVE, waxed, curled at ends)
  g.fillStyle(0x3a2a11, 1);
  g.fillRect(cx - 10, cy - 3, 20, 3);
  // Curled ends (pointing upward — proper handlebar)
  g.fillCircle(cx - 11, cy - 4, 2);
  g.fillCircle(cx + 11, cy - 4, 2);
  g.fillStyle(0x4a3a22, 1);
  g.fillCircle(cx - 11, cy - 5, 1);
  g.fillCircle(cx + 11, cy - 5, 1);

  // Monocle (iconic)
  g.lineStyle(2, 0xddaa00, 1);
  g.strokeCircle(cx + 5, cy - 8, 4.5);
  g.fillStyle(0xaaddff, 0.15);
  g.fillCircle(cx + 5, cy - 8, 3.5);
  // Monocle chain
  g.lineStyle(0.8, 0x886600, 0.8);
  g.lineBetween(cx + 9, cy - 5, cx + 12, cy);

  // Confident eyes (stern, looking down the gun)
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 5, cy - 8, 3);
  g.fillCircle(cx + 5, cy - 8, 3);
  g.fillStyle(0x336644, 1);
  g.fillCircle(cx - 5, cy - 8, 1.5);
  g.fillCircle(cx + 5, cy - 8, 1.5);

  // One eyebrow cocked (the confident hunter)
  g.fillStyle(0x3a2a11, 1);
  g.fillRect(cx - 8, cy - 12, 6, 1.5);
  g.fillTriangle(cx + 2, cy - 13, cx + 8, cy - 12, cx + 2, cy - 11);

  // === Pith helmet (HIGH DOME — classic safari, the colonial big-game look) ===
  // Wide brim (flat, wider at rear)
  g.fillStyle(0x776644, 1);
  g.fillEllipse(cx, cy - 18, 30, 8);
  g.fillStyle(0xbbaa77, 1);
  g.fillEllipse(cx, cy - 18, 28, 7);
  // HIGH dome (taller than you'd think — rigid, not floppy)
  g.fillStyle(0x776644, 1);
  g.fillEllipse(cx, cy - 24, 18, 12);
  g.fillStyle(0xaa9966, 1);
  g.fillEllipse(cx, cy - 24, 16, 11);
  // Dome highlight (catches the light at the peak)
  g.fillStyle(0xccbb88, 0.6);
  g.fillEllipse(cx - 2, cy - 28, 10, 5);
  // Ventilation knob on top (the little finial — real pith helmet detail)
  g.fillStyle(0x887755, 1);
  g.fillCircle(cx, cy - 30, 2);
  g.fillStyle(0xaa9966, 1);
  g.fillCircle(cx, cy - 30, 1.2);
  // Puggaree band (cloth wrap — the distinctive belt of fabric around the base)
  g.fillStyle(0x554422, 1);
  g.fillRect(cx - 13, cy - 19, 26, 3);
  g.fillStyle(0x665533, 1);
  g.fillRect(cx - 12, cy - 19, 24, 2);
  // Puggaree fold lines
  g.fillStyle(0x443311, 0.5);
  g.fillRect(cx - 8, cy - 19, 1, 2);
  g.fillRect(cx - 2, cy - 19, 1, 2);
  g.fillRect(cx + 4, cy - 19, 1, 2);

  // === Comically oversized blunderbuss ===
  // Stock (ornate wood)
  g.fillStyle(0x331100, 1);
  g.fillRect(cx + 22, cy + 4, 6, 18);
  g.fillStyle(0x553322, 1);
  g.fillRect(cx + 23, cy + 5, 4, 16);
  // Barrel (flared at the end — that's what makes it a blunderbuss)
  g.fillStyle(0x333333, 1);
  g.fillRect(cx + 24, cy - 20, 4, 26);
  g.fillStyle(0x555555, 1);
  g.fillRect(cx + 25, cy - 19, 2, 24);
  // Flared muzzle (the iconic blunderbuss bell)
  g.fillStyle(0x333333, 1);
  g.fillTriangle(cx + 22, cy - 24, cx + 30, cy - 24, cx + 26, cy - 20);
  g.fillStyle(0x555555, 1);
  g.fillTriangle(cx + 23, cy - 23, cx + 29, cy - 23, cx + 26, cy - 20);
  // Gold trigger guard
  g.fillStyle(0xddaa00, 1);
  g.fillCircle(cx + 24, cy + 4, 1.5);

  g.generateTexture('boss_hunter_general', s, s);
  g.destroy();
}

