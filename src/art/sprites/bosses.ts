/**
 * Boss sprites — the five unique boss encounters (Gordon, Tour Bus,
 * Laird, Hunter General, Taxman). Each is 80×80 (2× regular enemy
 * size), carries distinct character props, and pairs with the wider
 * `boss_shadow` texture from fx/.
 *
 * Bake order matches BossKey order in src/data/enemies.ts so the
 * export PNG + asset-validator snapshot stay stable.
 */

import Phaser from 'phaser';

export function bakeBossGordon(scene: Phaser.Scene): void {
  const s = 80;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 4;

  // === Body (chef whites, splattered, IMPOSING) ===
  g.fillStyle(0x777777, 1);
  g.fillCircle(cx, cy, 32);
  g.fillStyle(0xddddcc, 1);
  g.fillCircle(cx, cy, 30);
  g.fillStyle(0xeeeedd, 1);
  g.fillCircle(cx - 3, cy - 3, 24);
  // Grease stains on whites
  g.fillStyle(0xccbb88, 0.4);
  g.fillCircle(cx - 10, cy + 8, 3);
  g.fillCircle(cx + 8, cy + 12, 2.5);
  g.fillCircle(cx - 4, cy + 14, 2);
  // Double-breasted buttons
  g.fillStyle(0x222222, 1);
  g.fillCircle(cx - 5, cy + 4, 1.8);
  g.fillCircle(cx - 5, cy + 10, 1.8);
  g.fillCircle(cx + 5, cy + 4, 1.8);
  g.fillCircle(cx + 5, cy + 10, 1.8);

  // === Face (PURPLE with rage — this man has ascended beyond anger) ===
  g.fillStyle(0x883355, 1);
  g.fillCircle(cx, cy - 6, 14);
  g.fillStyle(0xcc6688, 1); // purple-red rage face
  g.fillCircle(cx, cy - 6, 13);
  // Flushed to absolute beetroot
  g.fillStyle(0xdd5566, 0.4);
  g.fillCircle(cx, cy - 5, 10);
  // FOREHEAD FURROWS — THE Ramsay signature (3-4 deep horizontal lines)
  g.lineStyle(1.2, 0x994466, 0.8);
  g.lineBetween(cx - 8, cy - 18, cx + 8, cy - 18);
  g.lineBetween(cx - 9, cy - 16, cx + 9, cy - 16);
  g.lineBetween(cx - 8, cy - 14, cx + 8, cy - 14);
  g.lineStyle(0.8, 0x884455, 0.5);
  g.lineBetween(cx - 7, cy - 17, cx + 7, cy - 17);
  // Forehead veins too (visible through the furrows)
  g.lineStyle(0.8, 0xaa3344, 0.5);
  g.lineBetween(cx - 5, cy - 19, cx - 7, cy - 16);
  g.lineBetween(cx + 4, cy - 19, cx + 6, cy - 16);

  // Furious eyebrows (THICKER, MORE ANGRY)
  g.fillStyle(0x331100, 1);
  g.fillTriangle(cx - 12, cy - 14, cx - 2, cy - 11, cx - 2, cy - 15);
  g.fillTriangle(cx + 12, cy - 14, cx + 2, cy - 11, cx + 2, cy - 15);
  // Bloodshot eyes
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 6, cy - 9, 3.5);
  g.fillCircle(cx + 6, cy - 9, 3.5);
  // Bloodshot veins in eyes
  g.lineStyle(0.5, 0xff4444, 0.6);
  g.lineBetween(cx - 8, cy - 10, cx - 6, cy - 9);
  g.lineBetween(cx + 8, cy - 10, cx + 6, cy - 9);
  g.fillStyle(0x111111, 1);
  g.fillCircle(cx - 6, cy - 9, 2);
  g.fillCircle(cx + 6, cy - 9, 2);
  // Rage-dilated pupils
  g.fillStyle(0x000000, 1);
  g.fillCircle(cx - 6, cy - 9, 1);
  g.fillCircle(cx + 6, cy - 9, 1);

  // MASSIVE open yelling mouth (IT'S RAAAAW)
  g.fillStyle(0x111111, 1);
  g.fillEllipse(cx, cy - 1, 12, 8);
  g.fillStyle(0xcc1111, 1);
  g.fillEllipse(cx, cy, 10, 6);
  // Teeth (top and bottom)
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx - 4, cy - 3, 2, 2);
  g.fillRect(cx, cy - 3, 2, 2);
  g.fillRect(cx - 3, cy + 2, 2, 2);
  g.fillRect(cx + 1, cy + 2, 2, 2);
  // Uvula
  g.fillStyle(0xff6666, 1);
  g.fillCircle(cx, cy + 1, 1);

  // === GIANT chef hat (askew from screaming) ===
  g.fillStyle(0xbbbbbb, 1);
  g.fillRect(cx - 13, cy - 28, 28, 6);
  g.fillStyle(0xeeeeee, 1);
  g.fillRect(cx - 12, cy - 27, 26, 5);
  // Puffy top (tilted slightly — he's been screaming so hard his hat shifted).
  // Center puff y=-35 (was -36 — radius-9 circle there clipped at y=-1).
  g.fillStyle(0xbbbbbb, 1);
  g.fillCircle(cx - 9, cy - 33, 8);
  g.fillCircle(cx + 1, cy - 35, 9);
  g.fillCircle(cx + 11, cy - 34, 8);
  g.fillStyle(0xeeeeee, 1);
  g.fillCircle(cx - 9, cy - 33, 7);
  g.fillCircle(cx + 1, cy - 35, 8);
  g.fillCircle(cx + 11, cy - 34, 7);

  // === Cleaver in right hand ===
  g.fillStyle(0x221100, 1);
  g.fillRect(cx + 24, cy + 6, 4, 10);
  g.fillStyle(0x888888, 1);
  g.fillRect(cx + 21, cy - 6, 10, 14);
  g.fillStyle(0xdddddd, 1);
  g.fillRect(cx + 22, cy - 5, 8, 12);
  g.fillStyle(0xffffff, 0.8);
  g.fillRect(cx + 23, cy - 4, 2, 10);

  // === Battered fish in left hand (chippy meets fine dining) ===
  g.fillStyle(0xaa7711, 1);
  g.fillEllipse(cx - 26, cy + 4, 10, 16);
  g.fillStyle(0xcc9922, 1);
  g.fillEllipse(cx - 26, cy + 4, 8, 14);
  // Batter texture
  g.fillStyle(0xddaa33, 0.6);
  g.fillCircle(cx - 27, cy + 1, 1);
  g.fillCircle(cx - 25, cy + 6, 1);

  g.generateTexture('boss_gordon', s, s);
  g.destroy();
}

export function bakeBossTourBus(scene: Phaser.Scene): void {
  const s = 96;  // up from 80 — a bus dwarfs a man
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2;

  // All offsets scaled 1.2× from 80px originals to fill 96px canvas proportionally.

  // === Bus body (MAGENTA/HOT PINK — the unmistakable First Glasgow livery) ===
  g.fillStyle(0x551133, 1);
  g.fillRect(cx - 41, cy - 19, 82, 38);
  g.fillStyle(0xaa2266, 1);
  g.fillRect(cx - 40, cy - 18, 80, 36);
  // Yellow swoosh stripe
  g.fillStyle(0xddcc22, 1);
  g.fillRect(cx - 40, cy - 10, 80, 3);
  g.fillStyle(0xbbaa11, 1);
  g.fillRect(cx - 40, cy - 7, 80, 1);

  // === Open top deck rail ===
  g.fillStyle(0x333333, 1);
  g.fillRect(cx - 36, cy - 22, 72, 2);
  g.fillRect(cx - 34, cy - 24, 1, 4);
  g.fillRect(cx - 22, cy - 24, 1, 4);
  g.fillRect(cx - 10, cy - 24, 1, 4);
  g.fillRect(cx + 2, cy - 24, 1, 4);
  g.fillRect(cx + 14, cy - 24, 1, 4);
  g.fillRect(cx + 26, cy - 24, 1, 4);

  // === HORIZONTAL rain (Glasgow rain goes SIDEWAYS) ===
  g.lineStyle(1, 0xaaddff, 0.4);
  g.lineBetween(cx - 30, cy - 26, cx - 24, cy - 25);
  g.lineBetween(cx - 12, cy - 28, cx - 6, cy - 27);
  g.lineBetween(cx + 6, cy - 25, cx + 12, cy - 24);
  g.lineBetween(cx + 22, cy - 26, cx + 28, cy - 25);
  g.lineBetween(cx - 18, cy - 24, cx - 12, cy - 23);
  g.lineBetween(cx + 14, cy - 28, cx + 20, cy - 27);

  // === Tourist faces in windows ===
  g.fillStyle(0x222244, 1);
  g.fillRect(cx - 36, cy - 16, 72, 7);
  g.fillStyle(0x88ccff, 0.7);
  for (let i = 0; i < 6; i++) {
    g.fillRect(cx - 35 + i * 12, cy - 15, 10, 6);
  }
  g.fillStyle(0xee8877, 1);
  g.fillCircle(cx - 30, cy - 12, 2);
  g.fillCircle(cx - 18, cy - 12, 2);
  g.fillCircle(cx - 6, cy - 12, 2);
  g.fillCircle(cx + 6, cy - 12, 2);
  g.fillCircle(cx + 18, cy - 12, 2);
  g.fillCircle(cx + 30, cy - 12, 2);

  // === Destination sign — "YOKER" ===
  g.fillStyle(0x111111, 1);
  g.fillRect(cx - 14, cy - 18, 28, 5);
  g.fillStyle(0xff8800, 1);
  g.fillRect(cx - 12, cy - 17, 24, 3);
  g.fillStyle(0xffaa00, 1);
  // Y
  g.fillRect(cx - 11, cy - 17, 1, 1);
  g.fillRect(cx - 9, cy - 17, 1, 1);
  g.fillRect(cx - 10, cy - 16, 1, 1);
  // O
  g.fillRect(cx - 6, cy - 17, 2, 1);
  g.fillRect(cx - 6, cy - 16, 2, 1);
  // K
  g.fillRect(cx - 3, cy - 17, 1, 2);
  g.fillRect(cx - 2, cy - 17, 1, 1);
  // E
  g.fillRect(cx, cy - 17, 2, 1);
  g.fillRect(cx, cy - 16, 1, 1);
  // R
  g.fillRect(cx + 3, cy - 17, 2, 1);
  g.fillRect(cx + 3, cy - 16, 1, 1);
  g.fillRect(cx + 4, cy - 16, 1, 1);

  // === Headlights (angry, bearing down) ===
  g.fillStyle(0xffff66, 1);
  g.fillCircle(cx + 40, cy - 5, 5);
  g.fillCircle(cx + 40, cy + 5, 5);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx + 40, cy - 5, 2.5);
  g.fillCircle(cx + 40, cy + 5, 2.5);
  g.fillStyle(0xffff88, 0.15);
  g.fillTriangle(cx + 43, cy - 7, cx + 43, cy + 7, cx + 55, cy);

  // === Traffic cone on bumper (Duke of Wellington nod!) ===
  g.fillStyle(0xff6600, 1);
  g.fillTriangle(cx + 41, cy + 11, cx + 46, cy + 17, cx + 36, cy + 17);
  g.fillStyle(0xff8833, 1);
  g.fillTriangle(cx + 41, cy + 12, cx + 44, cy + 17, cx + 37, cy + 17);
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(cx + 37, cy + 15, 7, 1);

  // === Bumper ===
  g.fillStyle(0x333333, 1);
  g.fillRect(cx - 40, cy + 17, 80, 5);
  g.fillStyle(0x555555, 1);
  g.fillRect(cx - 40, cy + 17, 80, 1);

  // === Wheels ===
  g.fillStyle(0x111111, 1);
  g.fillCircle(cx - 24, cy + 24, 8);
  g.fillCircle(cx + 24, cy + 24, 8);
  g.fillStyle(0x333333, 1);
  g.fillCircle(cx - 24, cy + 24, 6);
  g.fillCircle(cx + 24, cy + 24, 6);
  g.fillStyle(0x888888, 1);
  g.fillCircle(cx - 24, cy + 24, 2.5);
  g.fillCircle(cx + 24, cy + 24, 2.5);

  // === Exhaust fumes ===
  g.fillStyle(0x444444, 0.4);
  g.fillCircle(cx - 43, cy + 10, 5);
  g.fillCircle(cx - 48, cy + 6, 6);
  g.fillCircle(cx - 53, cy + 2, 5);
  g.fillStyle(0x555555, 0.25);
  g.fillCircle(cx - 46, cy + 5, 4);
  g.fillCircle(cx - 50, cy + 1, 4);

  g.generateTexture('boss_tour_bus', s, s);
  g.destroy();
}

export function bakeBossLaird(scene: Phaser.Scene): void {
  const s = 80;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 4;

  // === Royal cloak (deep purple, regal, EXPENSIVE) ===
  g.fillStyle(0x0a0022, 1);
  g.fillCircle(cx, cy + 2, 30);
  g.fillStyle(0x1a0044, 1);
  g.fillCircle(cx, cy + 2, 28);
  g.fillStyle(0x2a0066, 1);
  g.fillCircle(cx, cy, 24);
  // Velvet sheen
  g.fillStyle(0x3a0088, 0.4);
  g.fillEllipse(cx - 4, cy - 4, 30, 20);
  // Gold braid trim on cloak
  g.lineStyle(1.5, 0xddaa00, 0.8);
  g.strokeCircle(cx, cy + 1, 25);

  // === Ermine fur trim (white with black spots — proper royal) ===
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx - 28, cy + 14, 56, 5);
  g.fillStyle(0xeeeedd, 1);
  g.fillRect(cx - 27, cy + 15, 54, 3);
  // Black ermine tail spots (more of them, evenly spaced)
  g.fillStyle(0x111111, 1);
  g.fillCircle(cx - 22, cy + 16, 1.5);
  g.fillCircle(cx - 14, cy + 16, 1.5);
  g.fillCircle(cx - 6, cy + 16, 1.5);
  g.fillCircle(cx + 2, cy + 16, 1.5);
  g.fillCircle(cx + 10, cy + 16, 1.5);
  g.fillCircle(cx + 18, cy + 16, 1.5);
  // Tail dangles
  g.fillStyle(0x111111, 1);
  g.fillRect(cx - 22, cy + 17, 1, 2);
  g.fillRect(cx - 6, cy + 17, 1, 2);
  g.fillRect(cx + 10, cy + 17, 1, 2);

  // === Face (sneering, chin UP, looking down at you) ===
  g.fillStyle(0xaa6644, 1);
  g.fillCircle(cx, cy - 6, 12);
  g.fillStyle(0xffccaa, 1);
  g.fillCircle(cx, cy - 6, 11);
  // Powdered complexion (slightly paler than normal)
  g.fillStyle(0xffddc8, 0.5);
  g.fillCircle(cx, cy - 7, 9);

  // Prominent chin (jutting forward, looking down at the peasants)
  g.fillStyle(0xffccaa, 1);
  g.fillEllipse(cx, cy + 1, 6, 4);

  // Monocle on right eye
  g.lineStyle(1.5, 0xddaa00, 1);
  g.strokeCircle(cx + 5, cy - 8, 4);
  g.fillStyle(0xaaddff, 0.2);
  g.fillCircle(cx + 5, cy - 8, 3);
  // Monocle chain
  g.lineStyle(0.8, 0xbb8800, 0.7);
  g.lineBetween(cx + 9, cy - 6, cx + 12, cy);

  // Sneering eyes (half-lidded, contemptuous)
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 5, cy - 8, 3);
  g.fillCircle(cx + 5, cy - 8, 3);
  g.fillStyle(0x224488, 1);
  g.fillCircle(cx - 5, cy - 8, 1.5);
  g.fillCircle(cx + 5, cy - 8, 1.5);
  // Heavy, contemptuous eyelids
  g.fillStyle(0xddbb99, 1);
  g.fillRect(cx - 8, cy - 10, 6, 2);
  g.fillRect(cx + 2, cy - 10, 6, 2);

  // Walrus mustache (thick, drooping over the lip — stuffy old aristocrat)
  g.fillStyle(0xaaaaaa, 1);
  g.fillRect(cx - 8, cy - 3, 16, 3);
  g.fillStyle(0xcccccc, 1);
  g.fillRect(cx - 7, cy - 3, 14, 2);
  // Drooping ends (hangs past the mouth — walrus style)
  g.fillStyle(0xbbbbbb, 1);
  g.fillRect(cx - 8, cy - 1, 3, 3);
  g.fillRect(cx + 6, cy - 1, 3, 3);
  // Mustache highlight
  g.fillStyle(0xdddddd, 0.6);
  g.fillRect(cx - 5, cy - 3, 10, 1);

  // Thin sneer (curled lip — pure contempt for the working class)
  g.fillStyle(0xcc8877, 1);
  g.fillRect(cx - 3, cy, 6, 1);
  // One corner turned up (the sneer)
  g.fillStyle(0xcc8877, 1);
  g.fillCircle(cx + 3, cy - 1, 0.8);

  // === Signet ring (golden dot on right side — old money) ===
  g.fillStyle(0xddaa00, 1);
  g.fillCircle(cx + 20, cy + 6, 2);
  g.fillStyle(0xffcc44, 1);
  g.fillCircle(cx + 20, cy + 6, 1.2);

  // === BIG golden crown (more ornate, more jewels) ===
  g.fillStyle(0x553300, 1);
  g.fillRect(cx - 16, cy - 22, 32, 8);
  g.fillStyle(0xddaa00, 1);
  g.fillRect(cx - 15, cy - 21, 30, 6);
  // Gold highlight band
  g.fillStyle(0xffcc33, 0.6);
  g.fillRect(cx - 15, cy - 20, 30, 2);
  // Crown points (taller, more ornate)
  g.fillStyle(0x553300, 1);
  g.fillTriangle(cx - 16, cy - 22, cx - 11, cy - 34, cx - 6, cy - 22);
  g.fillTriangle(cx - 4, cy - 22, cx, cy - 36, cx + 4, cy - 22);
  g.fillTriangle(cx + 6, cy - 22, cx + 11, cy - 34, cx + 16, cy - 22);
  g.fillStyle(0xddaa00, 1);
  g.fillTriangle(cx - 15, cy - 22, cx - 11, cy - 32, cx - 7, cy - 22);
  g.fillTriangle(cx - 3, cy - 22, cx, cy - 34, cx + 3, cy - 22);
  g.fillTriangle(cx + 7, cy - 22, cx + 11, cy - 32, cx + 14, cy - 22);
  // Jewels (rubies AND sapphires)
  g.fillStyle(0xff1133, 1);
  g.fillCircle(cx - 11, cy - 30, 2.2);
  g.fillCircle(cx + 11, cy - 30, 2.2);
  g.fillStyle(0x2244ff, 1);
  g.fillCircle(cx, cy - 33, 2.5);
  // Jewel highlights
  g.fillStyle(0xff6677, 1);
  g.fillCircle(cx - 11, cy - 31, 0.8);
  g.fillCircle(cx + 11, cy - 31, 0.8);
  g.fillStyle(0x6688ff, 1);
  g.fillCircle(cx, cy - 34, 1);
  // Tiny gold fleur-de-lis on crown band
  g.fillStyle(0xffcc33, 1);
  g.fillCircle(cx - 8, cy - 19, 1);
  g.fillCircle(cx + 8, cy - 19, 1);

  g.generateTexture('boss_laird', s, s);
  g.destroy();
}

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

export function bakeBossTaxman(scene: Phaser.Scene): void {
  const s = 80;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 4;

  // === Pinstripe cloak (death meets the civil service) ===
  g.fillStyle(0x000000, 1);
  g.fillCircle(cx, cy + 2, 32);
  g.fillStyle(0x0a0a0a, 1);
  g.fillCircle(cx, cy + 2, 30);
  g.fillStyle(0x141414, 1);
  g.fillCircle(cx, cy, 26);
  // Pinstripes (subtle gray on black — bespoke reaper)
  g.fillStyle(0x222222, 0.6);
  g.fillRect(cx - 18, cy - 6, 1, 36);
  g.fillRect(cx - 12, cy - 6, 1, 36);
  g.fillRect(cx - 6, cy - 6, 1, 36);
  g.fillRect(cx, cy - 6, 1, 36);
  g.fillRect(cx + 6, cy - 6, 1, 36);
  g.fillRect(cx + 12, cy - 6, 1, 36);
  g.fillRect(cx + 18, cy - 6, 1, 36);
  // Cloak folds (deeper black)
  g.fillStyle(0x000000, 1);
  g.fillRect(cx - 14, cy + 2, 2, 28);
  g.fillRect(cx - 4, cy + 2, 2, 28);
  g.fillRect(cx + 8, cy + 2, 2, 28);
  g.fillRect(cx + 18, cy + 2, 2, 28);

  // === Necktie (visible at collar — death is DRESSED for work) ===
  g.fillStyle(0x881111, 1);
  g.fillTriangle(cx - 2, cy - 6, cx + 2, cy - 6, cx, cy + 4);
  g.fillStyle(0xaa2222, 1);
  g.fillTriangle(cx - 1, cy - 5, cx + 1, cy - 5, cx, cy + 2);

  // === Hood (iconic — deep, dark) ===
  g.fillStyle(0x000000, 1);
  g.fillTriangle(cx - 18, cy - 6, cx, cy - 34, cx + 18, cy - 6);
  g.fillStyle(0x080808, 1);
  g.fillTriangle(cx - 16, cy - 6, cx, cy - 30, cx + 16, cy - 6);
  g.fillStyle(0x000000, 1);
  g.fillEllipse(cx, cy - 10, 20, 16);

  // === Skull face ===
  g.fillStyle(0x777766, 1);
  g.fillCircle(cx, cy - 6, 13);
  g.fillStyle(0xddddcc, 1);
  g.fillCircle(cx, cy - 6, 12);
  // Cheekbone definition
  g.fillStyle(0xccccbb, 1);
  g.fillCircle(cx - 6, cy - 4, 3);
  g.fillCircle(cx + 6, cy - 4, 3);

  // === Thin wire-rimmed spectacles (the civil servant look — perched on bone) ===
  g.lineStyle(0.8, 0x888888, 1); // thin wire — not thick frames
  g.strokeCircle(cx - 5, cy - 8, 3.5);
  g.strokeCircle(cx + 5, cy - 8, 3.5);
  // Bridge (thin wire connecting the lenses)
  g.lineStyle(0.6, 0x888888, 1);
  g.lineBetween(cx - 2, cy - 8, cx + 2, cy - 8);
  // Temple arms (thin, going behind where ears would be)
  g.lineBetween(cx - 8, cy - 8, cx - 12, cy - 6);
  g.lineBetween(cx + 8, cy - 8, cx + 12, cy - 6);
  // Wire glint (catches the light — sinister)
  g.fillStyle(0xcccccc, 0.4);
  g.fillCircle(cx - 7, cy - 9, 0.5);
  g.fillCircle(cx + 7, cy - 9, 0.5);

  // Glowing red eyes behind the spectacles (HMRC sees ALL)
  g.fillStyle(0x000000, 1);
  g.fillCircle(cx - 5, cy - 8, 3);
  g.fillCircle(cx + 5, cy - 8, 3);
  g.fillStyle(0xff0000, 1);
  g.fillCircle(cx - 5, cy - 8, 2);
  g.fillCircle(cx + 5, cy - 8, 2);
  g.fillStyle(0xff6644, 1);
  g.fillCircle(cx - 5, cy - 8, 1);
  g.fillCircle(cx + 5, cy - 8, 1);
  // Red glow leaking through lenses
  g.fillStyle(0xff2200, 0.3);
  g.fillCircle(cx - 5, cy - 8, 4);
  g.fillCircle(cx + 5, cy - 8, 4);

  // Nose cavity
  g.fillStyle(0x000000, 1);
  g.fillTriangle(cx - 1, cy - 3, cx + 1, cy - 3, cx, cy + 1);
  // Jagged skull teeth (grinning — they've found a discrepancy)
  g.fillStyle(0x000000, 1);
  g.fillRect(cx - 6, cy + 2, 12, 4);
  g.fillStyle(0xddddcc, 1);
  g.fillRect(cx - 5, cy + 2, 1, 3);
  g.fillRect(cx - 3, cy + 2, 1, 4);
  g.fillRect(cx - 1, cy + 2, 1, 3);
  g.fillRect(cx + 1, cy + 2, 1, 4);
  g.fillRect(cx + 3, cy + 2, 1, 3);

  // === SCYTHE (the weapon that signs your P45) ===
  // Handle
  g.fillStyle(0x1a0a00, 1);
  g.fillRect(cx + 24, cy - 28, 3, 56);
  g.fillStyle(0x331a00, 1);
  g.fillRect(cx + 25, cy - 27, 1, 54);
  // Scythe blade
  g.fillStyle(0x444444, 1);
  g.fillTriangle(cx + 10, cy - 32, cx + 26, cy - 28, cx + 26, cy - 18);
  g.fillStyle(0xbbbbbb, 1);
  g.fillTriangle(cx + 12, cy - 30, cx + 25, cy - 27, cx + 25, cy - 20);
  g.fillStyle(0xeeeeee, 0.7);
  g.fillTriangle(cx + 12, cy - 30, cx + 23, cy - 28, cx + 13, cy - 28);

  // === Calculator hanging from scythe handle (the real weapon) ===
  g.fillStyle(0x222222, 1);
  g.fillRect(cx + 20, cy + 10, 6, 8);
  g.fillStyle(0x333333, 1);
  g.fillRect(cx + 21, cy + 11, 4, 6);
  // Screen (showing a big number — your tax bill)
  g.fillStyle(0x88ff88, 0.8);
  g.fillRect(cx + 21, cy + 11, 4, 2);
  // Buttons
  g.fillStyle(0x888888, 0.8);
  g.fillRect(cx + 21, cy + 14, 1, 1);
  g.fillRect(cx + 23, cy + 14, 1, 1);
  g.fillRect(cx + 21, cy + 16, 1, 1);
  g.fillRect(cx + 23, cy + 16, 1, 1);
  // String attaching to handle
  g.lineStyle(0.8, 0x444444, 0.7);
  g.lineBetween(cx + 23, cy + 10, cx + 25, cy + 8);

  g.generateTexture('boss_taxman', s, s);
  g.destroy();
}


/** Bake every boss sprite. Called once from BootScene.generateAllTextures. */
export function bakeBosses(scene: Phaser.Scene): void {
  bakeBossGordon(scene);
  bakeBossTourBus(scene);
  bakeBossLaird(scene);
  bakeBossHunterGeneral(scene);
  bakeBossTaxman(scene);
}
