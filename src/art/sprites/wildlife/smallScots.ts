/**
 * Additional ambient Scottish wildlife. Each creature gets idle + move
 * single frames so WildlifeSystem can reuse its existing two-frame
 * rhythm.
 *
 * Rewrite pass (lift from 6 → target 8):
 *  - Sheep: distinct dark face, white wool clumps (8 varied curls
 *    not 4 stacked circles), black legs, perked ears.
 *  - Frog: gentler hop stretch, hind legs visible, throat sac on
 *    idle for life-signal.
 *  - Field mouse: tapered tail (ellipse stack) instead of single line.
 *  - Rook: 1px eye + a beak parting line for character.
 *  - Salmon: gill cover + dorsal fin + brighter parr-marks.
 *  - Ptarmigan: fluffier breast + black-and-white wing pattern.
 *  - Bat: clearer wing membrane bones + amber eye spark.
 *  - Seal: slimmer profile + back-hair speckles.
 *  - Ground shadows now derived from canvas size, not hardcoded.
 */
import * as Phaser from 'phaser';

type DrawFn = (g: Phaser.GameObjects.Graphics, move: boolean) => void;

const CANVAS = 32;
const GROUND_Y = CANVAS - 6; // 26 — anchors all ground shadows consistently.

function bakePair(scene: Phaser.Scene, baseKey: string, draw: DrawFn): void {
  for (const [suffix, move] of [['idle', false], ['move', true]] as const) {
    const g = scene.add.graphics();
    draw(g, move);
    g.generateTexture(`${baseKey}_${suffix}`, CANVAS, CANVAS);
    g.destroy();
  }
}

function ground(
  g: Phaser.GameObjects.Graphics,
  cx = CANVAS / 2,
  w = 18,
  yOffset = 0,
): void {
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(cx, GROUND_Y + yOffset, w, 4);
  g.fillStyle(0x000000, 0.32);
  g.fillEllipse(cx, GROUND_Y + yOffset, w * 0.65, 2.2);
}

export function bakeSmallScotsWildlife(scene: Phaser.Scene): void {
  // ── Rook ───────────────────────────────────────────────────────
  bakePair(scene, 'wildlife_rook', (g, move) => {
    ground(g, 16, 14);
    const wingY = move ? 11 : 16;
    // Body — solid corvid black with sheen.
    g.fillStyle(0x040406, 1);
    g.fillEllipse(16, 18, 16, 10);
    g.fillStyle(0x0e0e14, 1);
    g.fillEllipse(16, 18, 14, 8);
    // Sheen on the back — corvid feathers catch a faint blue.
    g.fillStyle(0x2a2a44, 0.85);
    g.fillEllipse(16, 16, 10, 4);
    g.fillStyle(0x4a4a6a, 0.6);
    g.fillEllipse(15, 15, 7, 2.4);
    // Head.
    g.fillStyle(0x040406, 1);
    g.fillCircle(22, 14, 4);
    // Pale bare-skin face mask (the rook's diagnostic mark vs
    // a carrion crow). A thin lighter wedge at the beak base.
    g.fillStyle(0xc8c0a8, 0.9);
    g.fillTriangle(22, 13, 25.5, 13.5, 22, 16);
    // Beak — long pale-grey dagger with a darker parting line.
    g.fillStyle(0xb8b0a0, 1);
    g.fillTriangle(25, 13.6, 31, 12.4, 25, 16);
    g.fillStyle(0x080808, 0.85);
    g.fillRect(25.5, 14, 5.4, 0.4);
    // Wing — folded, lifts on move frame.
    g.fillStyle(0x16161e, 1);
    g.fillTriangle(13, 18, 5, wingY, 13, 22.5);
    g.fillStyle(0x2a2a36, 0.85);
    g.fillTriangle(11, 18, 7, wingY + 1, 12, 22);
    // Eye — 1px white pinprick (was 0.7 sub-pixel).
    g.fillStyle(0xffffff, 0.95);
    g.fillRect(22.6, 12.6, 1, 1);
    // Foot — two thin grey legs into the ground.
    g.fillStyle(0x6a5a48, 1);
    g.fillRect(15, 22, 0.8, 3);
    g.fillRect(18, 22, 0.8, 3);
  });

  // ── Sheep (white-fleece, black-faced — Scottish blackface) ─────
  bakePair(scene, 'wildlife_sheep', (g, move) => {
    ground(g, 16, 22);
    const legShift = move ? 1 : 0;
    // Dark legs — front pair offset slightly by leg phase.
    g.fillStyle(0x101008, 1);
    g.fillRect(11, 21 + legShift, 1.8, 6);
    g.fillRect(14.4, 21 - legShift, 1.8, 6);
    g.fillRect(17.6, 21 + legShift, 1.8, 6);
    g.fillRect(21, 21 - legShift, 1.8, 6);
    // Hooves — tiny dark wedges at the feet.
    g.fillStyle(0x2a1c0c, 1);
    g.fillRect(10.8, 26 + legShift, 2.2, 1);
    g.fillRect(14.2, 26 - legShift, 2.2, 1);
    g.fillRect(17.4, 26 + legShift, 2.2, 1);
    g.fillRect(20.8, 26 - legShift, 2.2, 1);
    // Wool body — outline blob first, then varied clumps.
    g.fillStyle(0x5a5040, 1);
    g.fillEllipse(16, 18, 18, 12);
    g.fillStyle(0xf2ecdc, 1);
    g.fillEllipse(16, 18, 16, 10.5);
    // Curl clumps — irregular, varied sizes for fleece texture.
    g.fillStyle(0xfff8e8, 1);
    const curls: Array<[number, number, number]> = [
      [11, 14, 2.4],
      [14, 12, 2.6],
      [18, 12, 2.6],
      [21, 14, 2.4],
      [10, 17, 2.2],
      [22, 17, 2.2],
      [13, 20, 2.2],
      [19, 20, 2.2],
    ];
    for (const [x, y, r] of curls) {
      g.fillCircle(x, y, r);
    }
    // Curl shadows — slight grey nick under each clump for depth.
    g.fillStyle(0x9a9080, 0.7);
    for (const [x, y, r] of curls) {
      g.fillRect(x - r * 0.6, y + r * 0.55, r * 1.2, 0.7);
    }
    // Curl highlights.
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(11, 13, 0.7);
    g.fillCircle(18, 11, 0.8);
    g.fillCircle(14, 19, 0.6);
    // Black face — Scottish blackface signature.
    g.fillStyle(0x080808, 1);
    g.fillCircle(24, 15, 4);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(24, 15, 3.4);
    // Ears — perked, white inside.
    g.fillStyle(0x080808, 1);
    g.fillTriangle(20.5, 11, 21.5, 8, 22.5, 11.5);
    g.fillTriangle(26, 11.5, 27, 8.5, 28, 12);
    g.fillStyle(0xf6dcc8, 0.9);
    g.fillTriangle(21.4, 10, 21.8, 8.6, 22.2, 11);
    g.fillTriangle(26.6, 10.5, 27, 9, 27.4, 11);
    // Eyes — white sclera + amber iris.
    g.fillStyle(0xfff0d0, 1);
    g.fillCircle(22.6, 14.4, 0.7);
    g.fillCircle(25.4, 14.4, 0.7);
    g.fillStyle(0xa86018, 1);
    g.fillCircle(22.6, 14.5, 0.4);
    g.fillCircle(25.4, 14.5, 0.4);
    // Nose / muzzle.
    g.fillStyle(0x2a1810, 1);
    g.fillEllipse(24, 16.4, 1.8, 1);
    g.fillStyle(0x6a4828, 0.9);
    g.fillRect(23.6, 16.2, 0.4, 0.4);
  });

  // ── Grey seal ──────────────────────────────────────────────────
  bakePair(scene, 'wildlife_grey_seal', (g, move) => {
    ground(g, 16, 22);
    const bob = move ? 1 : 0;
    g.fillStyle(0x14141a, 1);
    g.fillEllipse(16, 19 + bob, 23, 9);
    g.fillStyle(0x6a6e76, 1);
    g.fillEllipse(15, 18 + bob, 20, 7.5);
    g.fillStyle(0x9aa0a8, 0.95);
    g.fillEllipse(13, 17 + bob, 15, 5);
    // Speckled mottling — three dark spots across the back.
    g.fillStyle(0x32363c, 0.9);
    g.fillEllipse(10, 16, 2.4, 1.2);
    g.fillEllipse(16, 16, 2, 1);
    g.fillEllipse(20, 17, 2, 1);
    // Pale belly underline.
    g.fillStyle(0xc0c4ca, 0.7);
    g.fillEllipse(15, 21 + bob, 16, 1.4);
    // Head + dark eye + whisker tufts.
    g.fillStyle(0x52565c, 1);
    g.fillEllipse(8, 16 + bob, 7, 4.4);
    g.fillStyle(0x080806, 1);
    g.fillCircle(5, 15 + bob, 0.9);
    // Whisker dots.
    g.fillStyle(0xc0c0bc, 0.85);
    g.fillRect(3, 16 + bob, 0.5, 0.5);
    g.fillRect(2, 16.6 + bob, 0.5, 0.5);
    g.fillRect(3, 17 + bob, 0.5, 0.5);
    // Tail flipper.
    g.fillStyle(0x32363c, 1);
    g.fillTriangle(28, 19 + bob, 31, 16, 31, 22);
    g.fillStyle(0x6a6e76, 0.85);
    g.fillTriangle(28.6, 19 + bob, 30.4, 17, 30.4, 21);
  });

  // ── Ptarmigan (winter plumage) ─────────────────────────────────
  bakePair(scene, 'wildlife_ptarmigan', (g, move) => {
    ground(g, 16, 14);
    const foot = move ? 1 : 0;
    // Legs.
    g.fillStyle(0x2a2018, 1);
    g.fillRect(13, 22 + foot, 1.2, 4);
    g.fillRect(18, 22 - foot, 1.2, 4);
    // Body outline + white plumage.
    g.fillStyle(0x16100a, 1);
    g.fillEllipse(16, 17, 18, 12);
    g.fillStyle(0xeae6dc, 1);
    g.fillEllipse(16, 16, 15.5, 10.5);
    g.fillStyle(0xffffff, 0.85);
    g.fillEllipse(15, 14.5, 8, 4);
    // Brown wing patch (faint summer-edge holdover) on the side.
    g.fillStyle(0x9a7848, 0.7);
    g.fillEllipse(19, 18, 7, 3.2);
    // Black-and-white wing covert pattern — three thin dark bars.
    g.fillStyle(0x32281c, 0.85);
    g.fillRect(17, 17.4, 5, 0.5);
    g.fillRect(17, 18.4, 5, 0.5);
    g.fillRect(17.4, 19.2, 4.4, 0.5);
    // Red eye-comb (lekking male) — vivid scarlet.
    g.fillStyle(0xc02828, 1);
    g.fillRect(20, 12.4, 4, 1.2);
    g.fillStyle(0xff5050, 0.95);
    g.fillRect(20, 12.4, 4, 0.4);
    // Beak.
    g.fillStyle(0x42321c, 1);
    g.fillTriangle(23.4, 14, 26, 13.4, 23.4, 15);
    // Eye.
    g.fillStyle(0x080604, 1);
    g.fillCircle(22, 14, 0.9);
    g.fillStyle(0xffffff, 0.85);
    g.fillRect(22, 13.6, 0.5, 0.5);
  });

  // ── Common frog ────────────────────────────────────────────────
  bakePair(scene, 'wildlife_common_frog', (g, move) => {
    ground(g, 16, move ? 18 : 14);
    const stretch = move ? 1.4 : 0;
    const lift = move ? -1 : 0;
    // Body.
    g.fillStyle(0x102010, 1);
    g.fillEllipse(16, 20 + lift, 16 + stretch, 8.5);
    g.fillStyle(0x4a7028, 1);
    g.fillEllipse(16, 19 + lift, 13.5 + stretch, 7);
    g.fillStyle(0x6a9438, 0.95);
    g.fillEllipse(16, 18 + lift, 10, 4);
    // Dorsal stripe — lighter band down the back.
    g.fillStyle(0x9ac058, 0.9);
    g.fillEllipse(16, 17.4 + lift, 7, 1.4);
    // Hind legs visible — folded under when idle, kicked back on
    // move frame.
    g.fillStyle(0x102010, 1);
    if (move) {
      g.fillTriangle(7, 22, 11, 19, 11, 23);
      g.fillTriangle(25, 22, 21, 19, 21, 23);
    } else {
      g.fillEllipse(10, 21, 4, 2);
      g.fillEllipse(22, 21, 4, 2);
    }
    g.fillStyle(0x4a7028, 1);
    if (move) {
      g.fillTriangle(8.4, 22, 11, 20, 11, 22.6);
      g.fillTriangle(23.6, 22, 21, 20, 21, 22.6);
    } else {
      g.fillEllipse(10, 21, 3.2, 1.4);
      g.fillEllipse(22, 21, 3.2, 1.4);
    }
    // Eyes — domed bumps with golden iris and slit pupil.
    g.fillStyle(0x102010, 1);
    g.fillCircle(11, 14 + lift, 3.2);
    g.fillCircle(21, 14 + lift, 3.2);
    g.fillStyle(0x9ab058, 1);
    g.fillCircle(11, 14 + lift, 2.4);
    g.fillCircle(21, 14 + lift, 2.4);
    g.fillStyle(0xefc830, 1);
    g.fillCircle(11, 14 + lift, 1.6);
    g.fillCircle(21, 14 + lift, 1.6);
    g.fillStyle(0x080604, 1);
    g.fillRect(10.7, 13 + lift, 0.6, 2.4);
    g.fillRect(20.7, 13 + lift, 0.6, 2.4);
    // Mouth line.
    g.fillStyle(0x080604, 0.85);
    g.fillRect(13, 17.5 + lift, 6, 0.5);
    // Throat sac — small pulsing pale rect when idle.
    if (!move) {
      g.fillStyle(0xeac070, 0.85);
      g.fillEllipse(16, 21, 4.4, 1.4);
    }
  });

  // ── Pipistrelle bat ────────────────────────────────────────────
  bakePair(scene, 'wildlife_pipistrelle_bat', (g, move) => {
    const wingY = move ? 8 : 14;
    // Hovering shadow (no ground because it's airborne).
    g.fillStyle(0x000000, 0.14);
    g.fillEllipse(16, 25, 14, 2.4);
    // Wing membranes.
    g.fillStyle(0x080808, 1);
    g.fillTriangle(16, 16, 3, wingY, 9, 22);
    g.fillTriangle(16, 16, 29, wingY, 23, 22);
    g.fillStyle(0x1a1a1a, 1);
    g.fillTriangle(16, 16, 5, wingY + 1, 10, 21);
    g.fillTriangle(16, 16, 27, wingY + 1, 22, 21);
    // Wing-bone ribs — thin lines along the membrane.
    g.fillStyle(0x32282a, 0.9);
    g.fillRect(7, wingY + 2, 8, 0.5);
    g.fillRect(17, wingY + 2, 8, 0.5);
    // Body.
    g.fillStyle(0x42323a, 1);
    g.fillEllipse(16, 16, 5.4, 4.4);
    // Ears — pointed.
    g.fillStyle(0x080808, 1);
    g.fillTriangle(13, 13, 12, 7, 15, 12);
    g.fillTriangle(19, 13, 20, 7, 17, 12);
    g.fillStyle(0x6a4a4c, 0.85);
    g.fillTriangle(13.4, 12, 12.8, 9, 14.4, 11.6);
    g.fillTriangle(18.6, 12, 19.2, 9, 17.6, 11.6);
    // Amber eye spark — sells "alive in the dark".
    g.fillStyle(0xefb030, 1);
    g.fillCircle(14.4, 15.4, 0.7);
    g.fillCircle(17.6, 15.4, 0.7);
    g.fillStyle(0xfff0a8, 1);
    g.fillRect(14.2, 15.2, 0.4, 0.4);
    g.fillRect(17.4, 15.2, 0.4, 0.4);
    // Tiny fang glint.
    g.fillStyle(0xffffff, 0.95);
    g.fillRect(15.5, 17, 0.3, 0.6);
    g.fillRect(16.2, 17, 0.3, 0.6);
  });

  // ── Field mouse ────────────────────────────────────────────────
  bakePair(scene, 'wildlife_field_mouse', (g, move) => {
    ground(g, 16, 14);
    const bodyX = move ? 17 : 16;
    // Body.
    g.fillStyle(0x2a1808, 1);
    g.fillEllipse(bodyX, 20, 15, 8);
    g.fillStyle(0x9a7448, 1);
    g.fillEllipse(bodyX, 19, 12, 6);
    g.fillStyle(0xc8a070, 0.9);
    g.fillEllipse(bodyX - 1, 18.4, 8, 3);
    // Pale belly band.
    g.fillStyle(0xeae0c0, 0.85);
    g.fillEllipse(bodyX, 21.4, 9, 1.4);
    // Head.
    g.fillStyle(0x5a3a1c, 1);
    g.fillCircle(bodyX + 7, 17, 3.2);
    g.fillStyle(0xa07c50, 1);
    g.fillCircle(bodyX + 7, 17, 2.6);
    // Ears — round.
    g.fillStyle(0x2a1808, 1);
    g.fillCircle(bodyX + 5, 15, 1.6);
    g.fillCircle(bodyX + 9, 14.6, 1.6);
    g.fillStyle(0xeac0a0, 0.95);
    g.fillCircle(bodyX + 5, 15, 0.9);
    g.fillCircle(bodyX + 9, 14.6, 0.9);
    // Eye.
    g.fillStyle(0x080604, 1);
    g.fillCircle(bodyX + 8, 17, 0.9);
    g.fillStyle(0xffffff, 0.95);
    g.fillRect(bodyX + 7.6, 16.6, 0.45, 0.45);
    // Nose.
    g.fillStyle(0xd86890, 1);
    g.fillCircle(bodyX + 9.4, 17.6, 0.6);
    // Whiskers.
    g.lineStyle(0.6, 0xefe0c0, 0.9);
    g.lineBetween(bodyX + 9, 17.6, bodyX + 12, 17);
    g.lineBetween(bodyX + 9, 18, bodyX + 12, 18.4);
    // Tapered tail — three rect segments shrinking in width to
    // suggest the curl. Y-bounce on move frame.
    const tailKick = move ? 2 : 0;
    g.fillStyle(0x9a7448, 1);
    g.fillRect(bodyX - 6, 20, 5, 1);
    g.fillStyle(0x9a7448, 1);
    g.fillRect(bodyX - 10, 19.5 + tailKick * 0.3, 4, 0.8);
    g.fillRect(bodyX - 13, 18.5 + tailKick, 3, 0.6);
    g.fillRect(bodyX - 15, 17.5 + tailKick * 1.5, 2, 0.5);
  });

  // ── Salmon (leaping) ───────────────────────────────────────────
  bakePair(scene, 'wildlife_salmon', (g, move) => {
    // Water splash beneath instead of ground shadow.
    g.fillStyle(0x2a4a6a, 0.3);
    g.fillEllipse(16, GROUND_Y, 24, 4);
    g.fillStyle(0xaadcec, 0.6);
    g.fillEllipse(16, GROUND_Y - 1, 18, 1.6);
    g.fillStyle(0xffffff, 0.85);
    g.fillRect(8, GROUND_Y - 2, 1, 1);
    g.fillRect(22, GROUND_Y - 2, 1, 1);
    g.fillRect(15, GROUND_Y - 2.4, 1, 1);

    const y = move ? 14 : 17;
    // Body silhouette.
    g.fillStyle(0x1a2832, 1);
    g.fillEllipse(16, y, 22, 9);
    g.fillStyle(0x4a5a6a, 1);
    g.fillEllipse(15, y, 19, 7.4);
    g.fillStyle(0xc4d8d8, 1);
    g.fillEllipse(15, y - 0.6, 16, 5.5);
    // Spawning red blush across the belly.
    g.fillStyle(0xc02828, 0.8);
    g.fillEllipse(13, y + 1.5, 13, 2);
    g.fillStyle(0xff5040, 0.7);
    g.fillEllipse(13, y + 1.4, 11, 1);
    // Parr-marks — three darker oval spots along the side.
    g.fillStyle(0x080808, 0.85);
    g.fillEllipse(8, y - 1, 1.6, 1);
    g.fillEllipse(13, y - 1.4, 1.6, 1);
    g.fillEllipse(18, y - 1, 1.6, 1);
    // Dorsal fin.
    g.fillStyle(0x1a2832, 1);
    g.fillTriangle(13, y - 4.5, 17, y - 5, 18, y - 3);
    g.fillStyle(0x2a3a52, 0.95);
    g.fillTriangle(14, y - 4, 16.5, y - 4.4, 17.4, y - 3.2);
    // Pectoral fin (lower-front).
    g.fillStyle(0x1a2832, 0.95);
    g.fillTriangle(8, y + 2.4, 12, y + 1.5, 11, y + 4);
    // Tail fan.
    g.fillStyle(0x1a2832, 1);
    g.fillTriangle(25, y, 31, y - 5, 31, y + 5);
    g.fillStyle(0x4a5a6a, 0.95);
    g.fillTriangle(25.6, y, 30.4, y - 4.2, 30.4, y + 4.2);
    g.fillStyle(0x2a3a52, 0.85);
    g.fillRect(28, y - 0.4, 2.4, 0.8);
    // Gill cover.
    g.fillStyle(0x080808, 0.85);
    g.fillRect(11, y - 1.4, 0.4, 4);
    // Eye + spark.
    g.fillStyle(0x080604, 1);
    g.fillCircle(7.4, y - 1.4, 0.9);
    g.fillStyle(0xffffff, 0.95);
    g.fillRect(7.2, y - 1.6, 0.45, 0.45);
    // Mouth.
    g.fillStyle(0x080604, 0.95);
    g.fillRect(4.4, y - 0.6, 1.4, 0.4);
  });
}
