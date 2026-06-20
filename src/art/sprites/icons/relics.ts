/**
 * Relic icons — one 32x32 transparent texture per RelicDef.iconSprite.
 * The pickup, discard modal, and future codex surfaces can all share
 * these object-shaped silhouettes instead of the old generic diamond.
 */
import * as Phaser from 'phaser';

type DrawFn = (g: Phaser.GameObjects.Graphics) => void;

function bake(scene: Phaser.Scene, key: string, draw: DrawFn): void {
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, 32, 32);
  g.destroy();
}

function glow(g: Phaser.GameObjects.Graphics, colour: number): void {
  g.fillStyle(colour, 0.18);
  g.fillCircle(16, 16, 15);
}

function outlineRect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, fill: number): void {
  g.fillStyle(0x0a0604, 1);
  g.fillRect(x, y, w, h);
  g.fillStyle(fill, 1);
  g.fillRect(x + 1, y + 1, w - 2, h - 2);
}

export function bakeRelicIcons(scene: Phaser.Scene): void {
  bake(scene, 'relic_sporran', (g) => {
    glow(g, 0xcd7f32);
    g.fillStyle(0x1a1008, 1);
    g.fillEllipse(16, 18, 18, 16);
    g.fillStyle(0x7a4a24, 1);
    g.fillEllipse(16, 18, 16, 14);
    g.fillStyle(0xc09048, 1);
    g.fillEllipse(16, 12, 13, 5);
    g.fillStyle(0xffd46a, 1);
    g.fillCircle(16, 16, 2);
    g.fillStyle(0x2a1808, 1);
    for (const x of [11, 14, 17, 20]) g.fillRect(x, 24, 1, 4);
  });

  bake(scene, 'relic_oatcake', (g) => {
    glow(g, 0xd9b380);
    // Outer dark crust
    g.fillStyle(0x4a2a10, 1);
    g.fillCircle(16, 16, 10);
    // Mid-tone bake colour
    g.fillStyle(0xa07840, 1);
    g.fillCircle(16, 16, 9);
    // Lighter face — top half catches light.
    g.fillStyle(0xc89858, 1);
    g.fillCircle(16, 15.5, 8.5);
    // EDGE CRACK — broken arc along the right rim, sells "snapped
    // oatcake" rather than "perfect coin".
    g.fillStyle(0x2a1808, 1);
    g.fillTriangle(24, 13, 25, 18, 22, 16);
    g.fillTriangle(24, 18, 25, 22, 21, 19);
    g.fillStyle(0x6a4818, 1);
    g.fillTriangle(23, 14, 24, 17, 22, 16);
    // DEEPER CRUMB-PIT SHADOWS — small dark dots underneath each
    // wheat-flake to give pitted texture.
    g.fillStyle(0x4a2a10, 0.8);
    for (const [x, y] of [[12.3, 12.5], [18.3, 11.5], [20.3, 17.5], [14.3, 20.5], [10.3, 16.5]]) {
      g.fillCircle(x, y, 1.3);
    }
    // WHEAT-FLAKE 2-TONE — base flake (cream) + brighter top
    // catchlight pinprick, so each oat has dimension.
    g.fillStyle(0xe8c890, 1);
    for (const [x, y] of [[12, 12], [18, 11], [20, 17], [14, 20], [10, 16]]) g.fillCircle(x, y, 1.2);
    g.fillStyle(0xfff0c8, 1);
    for (const [x, y] of [[11.6, 11.6], [17.6, 10.6], [19.6, 16.6], [13.6, 19.6], [9.6, 15.6]]) g.fillCircle(x, y, 0.5);
    // A few fine crumb dots between the flakes.
    g.fillStyle(0x6a4818, 0.7);
    g.fillCircle(15, 15, 0.4);
    g.fillCircle(17, 14, 0.4);
    g.fillCircle(13, 17, 0.4);
  });

  bake(scene, 'relic_thimble', (g) => {
    glow(g, 0xc0c0c0);
    g.fillStyle(0x202028, 1);
    g.fillRoundedRect(10, 8, 12, 18, 4);
    g.fillStyle(0xa8b0b8, 1);
    g.fillRoundedRect(11, 9, 10, 16, 4);
    g.fillStyle(0xe8eef0, 0.8);
    for (let y = 12; y < 23; y += 3) {
      for (let x = 13; x < 20; x += 3) g.fillCircle(x, y, 0.55);
    }
  });

  bake(scene, 'relic_heather', (g) => {
    glow(g, 0xb19cd9);
    g.fillStyle(0x1f4018, 1);
    g.fillRect(15, 9, 2, 17);
    g.fillStyle(0xa040c8, 1);
    g.fillEllipse(12, 12, 7, 5);
    g.fillEllipse(18, 10, 8, 5);
    g.fillEllipse(20, 16, 7, 5);
    g.fillStyle(0xf0b8ff, 0.9);
    g.fillCircle(18, 9, 1);
  });

  bake(scene, 'relic_clasp', (g) => {
    glow(g, 0xcd7f32);
    g.fillStyle(0x2a1608, 1);
    g.fillCircle(16, 16, 10);
    g.fillStyle(0xb06a2a, 1);
    g.fillCircle(16, 16, 8);
    g.fillStyle(0x2a1608, 1);
    g.fillCircle(16, 16, 4);
    g.fillStyle(0xffd070, 0.9);
    g.fillCircle(13, 12, 2);
  });

  bake(scene, 'relic_ribbon', (g) => {
    glow(g, 0xe06666);
    g.fillStyle(0x240808, 1);
    g.fillEllipse(16, 12, 16, 9);
    g.fillStyle(0xb82028, 1);
    g.fillEllipse(16, 12, 14, 7);
    g.fillStyle(0x0a3018, 1);
    g.fillRect(9, 11, 14, 1.5);
    g.fillStyle(0xf0d060, 1);
    g.fillRect(15, 7, 1, 19);
    g.fillStyle(0x8a1818, 1);
    g.fillTriangle(13, 17, 9, 27, 16, 23);
    g.fillTriangle(18, 17, 23, 27, 16, 23);
  });

  bake(scene, 'relic_tinder', (g) => {
    glow(g, 0x8b4513);
    // PEAT-BLOCK HINT in the lower-left — small dark slab leaning
    // against the box, sells "Highland kindling" not "matchbox".
    g.fillStyle(0x1a0a04, 1);
    g.fillRect(5, 21, 5, 4);
    g.fillStyle(0x3a1f0e, 1);
    g.fillRect(5, 21, 5, 1);
    g.fillStyle(0x5a3518, 0.85);
    g.fillRect(5, 22, 5, 0.5);
    g.fillRect(5, 23.5, 5, 0.5);
    // Tinder box
    outlineRect(g, 10, 13, 12, 12, 0x5a3518);
    // DAMPNESS / MOSS TINGE — two faint moss patches on top edge of
    // the box. Reads "found in the moor" rather than dry shop-bought.
    g.fillStyle(0x4a6020, 0.85);
    g.fillRect(11, 13, 3, 1);
    g.fillRect(17, 13.5, 4, 0.7);
    g.fillStyle(0x6a8030, 0.7);
    g.fillRect(11.5, 13.2, 1, 0.4);
    g.fillRect(18, 13.7, 1.5, 0.3);
    // Box hinge band
    g.fillStyle(0x9a6a30, 1);
    g.fillRect(12, 15, 8, 2);
    // FLAME — split into two layers (warm core + cool tip cap so
    // the flame reads alive, not painted). Outer body warm-orange.
    g.fillStyle(0xc05010, 1);
    g.fillTriangle(16, 5, 11, 14, 21, 14);
    g.fillStyle(0xff8a30, 1);
    g.fillTriangle(16, 7, 12, 14, 20, 14);
    // Inner core — bright yellow.
    g.fillStyle(0xffd048, 1);
    g.fillTriangle(16, 9, 14, 14, 18, 14);
    g.fillStyle(0xffffd0, 1);
    g.fillTriangle(16, 11, 15, 14, 17, 14);
    // COOL TIP — a small pale-blue lick at the very top of the
    // flame ("hottest part") so the flame has the warm/cool split.
    g.fillStyle(0xa8e0ff, 0.8);
    g.fillTriangle(16, 5, 15, 7.5, 17, 7.5);
    g.fillStyle(0xeaf6ff, 1);
    g.fillCircle(16, 6, 0.6);
  });

  bake(scene, 'relic_whisky', (g) => {
    glow(g, 0xd4a017);
    g.fillStyle(0x1a1008, 1);
    g.fillRect(12, 7, 8, 19);
    g.fillStyle(0xf0e0b8, 0.8);
    g.fillRect(13, 8, 6, 17);
    g.fillStyle(0xd48a28, 1);
    g.fillRect(13, 15, 6, 10);
    g.fillStyle(0xffd070, 0.85);
    g.fillRect(14, 15, 1, 7);
  });

  bake(scene, 'relic_cairn', (g) => {
    glow(g, 0x8a8a8a);
    const stones: Array<[number, number, number, number, number]> = [
      [16, 23, 18, 6, 0x6f6a5a],
      [15, 18, 14, 6, 0x8a8270],
      [17, 13, 10, 6, 0xaaa08a],
      [16, 8, 6, 5, 0xc8b890],
    ];
    for (const [x, y, w, h, c] of stones) {
      g.fillStyle(0x0a0806, 1);
      g.fillEllipse(x, y, w, h);
      g.fillStyle(c, 1);
      g.fillEllipse(x, y - 0.5, w - 2, h - 1);
    }
  });

  bake(scene, 'relic_compass', (g) => {
    glow(g, 0x6b8e23);
    g.fillStyle(0x1a1008, 1);
    g.fillCircle(16, 16, 11);
    g.fillStyle(0xd0b060, 1);
    g.fillCircle(16, 16, 9);
    g.fillStyle(0x203820, 1);
    g.fillTriangle(16, 7, 13, 17, 16, 15);
    g.fillStyle(0xb82020, 1);
    g.fillTriangle(16, 25, 19, 15, 16, 17);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(14, 12, 1);
  });

  bake(scene, 'relic_torque', (g) => {
    glow(g, 0xffd700);
    g.lineStyle(5, 0x3a2408, 1);
    g.beginPath();
    g.arc(16, 17, 9, Math.PI * 0.15, Math.PI * 1.85, false);
    g.strokePath();
    g.lineStyle(3, 0xd4a830, 1);
    g.beginPath();
    g.arc(16, 17, 9, Math.PI * 0.15, Math.PI * 1.85, false);
    g.strokePath();
    g.fillStyle(0xffef8a, 1);
    g.fillCircle(8, 14, 3);
    g.fillCircle(24, 14, 3);
  });

  bake(scene, 'relic_bodhran', (g) => {
    glow(g, 0x8b4513);
    g.fillStyle(0x1a0c04, 1);
    g.fillCircle(16, 16, 11);
    g.fillStyle(0x7a3f18, 1);
    g.fillCircle(16, 16, 9.5);
    g.fillStyle(0xe8c898, 1);
    g.fillCircle(16, 16, 7.5);
    g.lineStyle(1, 0x5a3018, 0.8);
    g.lineBetween(10, 16, 22, 16);
    g.lineBetween(16, 10, 16, 22);
  });

  bake(scene, 'relic_clootie', (g) => {
    glow(g, 0xa8b5b5);
    g.fillStyle(0x202020, 1);
    g.fillRect(14, 7, 4, 19);
    g.fillStyle(0xd8d0c0, 1);
    g.fillRect(8, 11, 16, 9);
    g.fillStyle(0x9fd0e0, 1);
    g.fillRect(9, 12, 6, 7);
    g.fillStyle(0xf0b8c8, 1);
    g.fillRect(17, 12, 6, 7);
    g.fillStyle(0x706050, 0.8);
    g.fillRect(8, 19, 16, 1);
  });

  bake(scene, 'relic_net', (g) => {
    glow(g, 0x4a6b7a);
    g.lineStyle(2, 0x1a2a30, 1);
    g.strokeEllipse(16, 16, 18, 18);
    g.lineStyle(1, 0xb8d0d8, 0.9);
    for (let i = 8; i <= 24; i += 4) {
      g.lineBetween(8, i, 24, i);
      g.lineBetween(i, 8, i, 24);
    }
    g.fillStyle(0x4a6b7a, 0.9);
    g.fillCircle(23, 23, 2);
  });

  bake(scene, 'relic_midgie_repellent', (g) => {
    glow(g, 0x6b8e23);
    // Bottle body
    outlineRect(g, 11, 9, 10, 17, 0x6d8a35);
    // Cap
    g.fillStyle(0x2a3010, 1);
    g.fillRect(13, 6, 6, 3);
    g.fillStyle(0xd8e080, 1);
    g.fillRect(13, 7, 6, 2);
    // Label — pale background panel ON the bottle for the midge
    // silhouette to sit on.
    g.fillStyle(0xf8f0c0, 1);
    g.fillRect(12, 14, 8, 9);
    g.fillStyle(0x6d8a35, 1);
    g.fillRect(12, 14, 8, 0.7);
    g.fillRect(12, 22, 8, 0.7);
    // CLEAR MIDGE SILHOUETTE — small black insect with red eye dot
    // and crossed wing-smear. Reads "mosquito/midge" instantly.
    g.fillStyle(0x1a0a14, 1);
    g.fillEllipse(16, 18, 3.2, 1.8);  // body
    g.fillStyle(0xa8b8c8, 0.85);
    g.fillEllipse(14.6, 17.5, 2.4, 0.8);  // left wing
    g.fillEllipse(17.4, 17.5, 2.4, 0.8);  // right wing
    g.fillStyle(0xff2233, 1);
    g.fillCircle(15.6, 17.6, 0.35);  // eye
    g.fillCircle(16.4, 17.6, 0.35);
    g.lineStyle(0.5, 0x1a0a14, 1);
    g.lineBetween(16.3, 18.7, 16.7, 19.5);  // proboscis
    // CROSS-OUT BAR — diagonal red strike-through over the midge
    // ("no midges"). Universal "forbidden" symbol.
    g.fillStyle(0xc81818, 1);
    g.fillRect(12.5, 17.7, 7, 0.7);
    g.lineStyle(1.4, 0xc81818, 1);
    g.strokeCircle(16, 18, 3.2);
    // SPRAY-MIST PUFF above the cap — small fan of pale dots showing
    // the bottle is "active".
    g.fillStyle(0xc8e0ff, 0.7);
    g.fillCircle(16, 4, 0.7);
    g.fillCircle(14.5, 4.5, 0.55);
    g.fillCircle(17.5, 4.5, 0.55);
    g.fillCircle(13, 5.5, 0.4);
    g.fillCircle(19, 5.5, 0.4);
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(16, 4, 0.4);
  });

  bake(scene, 'relic_teapot', (g) => {
    glow(g, 0xf4a261);
    g.fillStyle(0x2a1008, 1);
    g.fillEllipse(15, 17, 16, 12);
    g.fillStyle(0xd87a40, 1);
    g.fillEllipse(15, 17, 14, 10);
    g.fillStyle(0xf4b070, 1);
    g.fillEllipse(13, 15, 7, 4);
    g.fillStyle(0x2a1008, 1);
    g.fillCircle(23, 17, 4);
    g.fillStyle(0xf4b070, 1);
    g.fillCircle(23, 17, 2.5);
    g.fillStyle(0x2a1008, 1);
    g.fillTriangle(7, 15, 2, 13, 7, 18);
    g.fillStyle(0x2a1008, 1);
    g.fillRect(12, 8, 7, 3);
  });

  bake(scene, 'relic_horn', (g) => {
    glow(g, 0xe8d8a0);
    g.fillStyle(0x2a1808, 1);
    g.fillTriangle(8, 21, 24, 8, 25, 15);
    g.fillStyle(0xd8c088, 1);
    g.fillTriangle(9, 20, 23, 9, 24, 14);
    g.fillStyle(0xf8e8b8, 1);
    g.fillTriangle(12, 19, 22, 11, 23, 13);
    g.fillStyle(0x7a5020, 1);
    g.fillEllipse(8, 21, 7, 5);
    g.fillStyle(0xffd070, 1);
    g.fillRect(19, 10, 3, 8);
  });

  bake(scene, 'relic_destiny_shard', (g) => {
    glow(g, 0xd8c88c);
    g.fillStyle(0x201808, 1);
    g.fillTriangle(16, 5, 8, 26, 23, 23);
    g.fillStyle(0xb8a878, 1);
    g.fillTriangle(16, 7, 10, 24, 21, 22);
    g.fillStyle(0xe8d8a0, 1);
    g.fillTriangle(16, 7, 16, 22, 21, 22);
    g.lineStyle(1, 0x6a5838, 0.9);
    g.lineBetween(12, 17, 20, 15);
    g.lineBetween(14, 21, 18, 11);
  });

  // V2 — Stormcrown: frost-blue ringed crown, three peaks + glint.
  // Cailleach Gauntlet drop. Spec
  // `docs/archive/superpowers/specs/2026-05-22-moor-remembers-v2-design.md`.
  bake(scene, 'relic_stormcrown', (g) => {
    glow(g, 0xb9d6f0);
    // Crown band (outline + fill)
    g.fillStyle(0x0a141c, 1);
    g.fillRect(6, 19, 20, 5);
    g.fillStyle(0x3c4a5a, 1);
    g.fillRect(7, 20, 18, 3);
    g.fillStyle(0xb9d6f0, 1);
    g.fillRect(7, 21, 18, 1);

    // Three peaks (jagged ice spires — left taller, asymmetric)
    g.fillStyle(0x0a141c, 1);
    g.fillTriangle(7, 19, 11, 7, 14, 19);
    g.fillTriangle(13, 19, 17, 3, 21, 19);
    g.fillTriangle(20, 19, 24, 9, 26, 19);
    g.fillStyle(0xb9d6f0, 1);
    g.fillTriangle(8, 19, 11, 9, 13, 19);
    g.fillTriangle(14, 19, 17, 5, 20, 19);
    g.fillTriangle(21, 19, 24, 11, 25, 19);

    // Frost-white peak highlights
    g.fillStyle(0xe8f5ff, 0.85);
    g.fillTriangle(10, 18, 11, 10, 12, 18);
    g.fillTriangle(16, 18, 17, 6, 18, 18);
    g.fillTriangle(23, 18, 24, 12, 25, 18);

    // Centre glint (ice-bright pinpoint)
    g.fillStyle(0xe8f5ff, 1);
    g.fillCircle(17, 12, 1.2);
    g.fillStyle(0xfaffff, 0.95);
    g.fillCircle(17, 12, 0.5);
  });
}
