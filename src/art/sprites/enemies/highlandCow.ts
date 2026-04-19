import Phaser from 'phaser';

export function bakeHighlandCow(scene: Phaser.Scene): void {
  const s = 64;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // ── Body outline ──
  g.fillStyle(0x3a1e08, 1);
  g.fillEllipse(cx, cy + 4, 46, 30);
  // Big shaggy brown body
  g.fillStyle(0x8b4513, 1);
  g.fillEllipse(cx, cy + 3, 42, 26);
  // Lighter mid-layer (warm reddish-brown — Highland breed colour)
  g.fillStyle(0xa0522d, 0.7);
  g.fillEllipse(cx - 3, cy + 1, 34, 22);
  // Belly sag (heavier at the bottom — these are stocky beasts)
  g.fillStyle(0x6a3010, 0.4);
  g.fillEllipse(cx, cy + 10, 30, 10);
  // Shaggy fur tufts at body edges (not smooth — wild and wind-blown)
  g.fillStyle(0x8b4513, 1);
  g.fillCircle(cx - 16, cy + 2, 4);
  g.fillCircle(cx + 16, cy + 3, 4);
  g.fillCircle(cx - 12, cy + 10, 3);
  g.fillCircle(cx + 12, cy + 10, 3);
  g.fillCircle(cx - 18, cy + 6, 3);
  g.fillCircle(cx + 18, cy + 5, 3);
  // Back ridge highlight (spine catches the light)
  g.fillStyle(0xbb6a30, 0.4);
  g.fillEllipse(cx, cy - 4, 28, 5);

  // ── Legs (chunky, furry at the top) ──
  g.fillStyle(0x3a1e08, 1);
  g.fillRect(cx - 13, cy + 14, 5, 10);
  g.fillRect(cx - 5, cy + 14, 5, 10);
  g.fillRect(cx + 2, cy + 14, 5, 10);
  g.fillRect(cx + 10, cy + 14, 5, 10);
  // Fur feathering at leg tops
  g.fillStyle(0x7a3810, 0.6);
  g.fillCircle(cx - 11, cy + 14, 3);
  g.fillCircle(cx - 3, cy + 14, 3);
  g.fillCircle(cx + 4, cy + 14, 3);
  g.fillCircle(cx + 12, cy + 14, 3);
  // Hooves — dark, cloven
  g.fillStyle(0x0a0a0a, 1);
  g.fillRect(cx - 13, cy + 22, 5, 3);
  g.fillRect(cx - 5, cy + 22, 5, 3);
  g.fillRect(cx + 2, cy + 22, 5, 3);
  g.fillRect(cx + 10, cy + 22, 5, 3);
  // Hoof split (cloven detail)
  g.fillStyle(0x3a1e08, 0.5);
  g.fillRect(cx - 11, cy + 22, 1, 3);
  g.fillRect(cx - 3, cy + 22, 1, 3);
  g.fillRect(cx + 4, cy + 22, 1, 3);
  g.fillRect(cx + 12, cy + 22, 1, 3);

  // ── Head ──
  g.fillStyle(0x3a1e08, 1);
  g.fillCircle(cx, cy - 10, 13);
  g.fillStyle(0x8b4513, 1);
  g.fillCircle(cx, cy - 10, 12);

  // ── Ears (visible beside horns — pink inner ear) ──
  g.fillStyle(0x6a3010, 1);
  g.fillTriangle(cx - 12, cy - 14, cx - 8, cy - 10, cx - 14, cy - 10);
  g.fillTriangle(cx + 12, cy - 14, cx + 8, cy - 10, cx + 14, cy - 10);
  // Pink inner ear (warm — healthy beast)
  g.fillStyle(0xdd9988, 0.6);
  g.fillTriangle(cx - 12, cy - 13, cx - 9, cy - 11, cx - 13, cy - 11);
  g.fillTriangle(cx + 12, cy - 13, cx + 9, cy - 11, cx + 13, cy - 11);

  // ── Iconic: massive shaggy fringe (covers eyes completely) ──
  g.fillStyle(0xccaa77, 1);
  g.fillRect(cx - 14, cy - 18, 28, 10);
  // Darker fringe depth layer underneath
  g.fillStyle(0x8b6633, 0.7);
  g.fillRect(cx - 13, cy - 12, 26, 4);
  // Stringy bits of fringe (varied thickness, natural)
  g.fillStyle(0xa0522d, 1);
  for (let i = 0; i < 7; i++) {
    const fx = cx - 12 + i * 4;
    const len = 4 + (i % 3);
    g.fillRect(fx, cy - 10, 2, len);
  }
  // Lighter individual hair strands over the top
  g.fillStyle(0xddbb88, 0.8);
  for (let i = 0; i < 8; i++) {
    const fx = cx - 13 + i * 3.5;
    const len = 3 + (i % 4);
    g.fillRect(fx, cy - 9, 1, len);
  }
  // Windswept strand going sideways (it's always windy on the moor)
  g.fillStyle(0xccaa77, 0.7);
  g.fillRect(cx + 13, cy - 14, 3, 1);
  g.fillRect(cx + 14, cy - 13, 2, 1);

  // ── Iconic: huge curved horns (with growth rings) ──
  g.fillStyle(0x1a0a00, 1);
  g.fillTriangle(cx - 16, cy - 16, cx - 8, cy - 12, cx - 22, cy - 8);
  g.fillTriangle(cx + 16, cy - 16, cx + 8, cy - 12, cx + 22, cy - 8);
  g.fillStyle(0xbbaa66, 1);
  g.fillTriangle(cx - 15, cy - 15, cx - 9, cy - 12, cx - 20, cy - 9);
  g.fillTriangle(cx + 15, cy - 15, cx + 9, cy - 12, cx + 20, cy - 9);
  // Horn tip highlight (lighter, polished)
  g.fillStyle(0xddcc88, 0.7);
  g.fillCircle(cx - 19, cy - 9, 1.5);
  g.fillCircle(cx + 19, cy - 9, 1.5);
  // Growth rings (subtle darker bands — shows age)
  g.fillStyle(0x887744, 0.4);
  g.fillRect(cx - 14, cy - 13, 3, 1);
  g.fillRect(cx + 11, cy - 13, 3, 1);

  // ── Snout (wet, pink, expressive) ──
  g.fillStyle(0x3a1e08, 1);
  g.fillCircle(cx, cy - 4, 5.5);
  g.fillStyle(0xd4956b, 1);
  g.fillCircle(cx, cy - 4, 4.5);
  // Muzzle highlight (moist — healthy)
  g.fillStyle(0xddaa88, 0.5);
  g.fillCircle(cx - 1, cy - 5, 2);
  // Nostrils (bigger, flared — heavy breathing)
  g.fillStyle(0x111111, 1);
  g.fillCircle(cx - 2, cy - 3, 1);
  g.fillCircle(cx + 2, cy - 3, 1);
  // Dewdrop on nostril (THE Highland detail — it's always damp)
  g.fillStyle(0xccddee, 0.6);
  g.fillCircle(cx - 2, cy - 2, 0.7);

  // ── Nostril steam (it's cauld out) ──
  g.fillStyle(0xcccccc, 0.35);
  g.fillCircle(cx - 3, cy - 1, 2);
  g.fillCircle(cx + 3, cy - 1, 2);
  g.fillStyle(0xdddddd, 0.2);
  g.fillCircle(cx - 4, cy - 2, 1.5);
  g.fillCircle(cx + 5, cy - 2, 1.5);
  // Second breath plume (lingering in cold air)
  g.fillStyle(0xeeeeee, 0.12);
  g.fillCircle(cx - 5, cy - 3, 1.5);
  g.fillCircle(cx + 6, cy - 3, 1.5);

  // ── Mouth hint (chewing cud — it's what coos do) ──
  g.fillStyle(0x3a1e08, 0.5);
  g.fillRect(cx - 2, cy - 1, 4, 1);

  // ── Mud on hooves and lower legs (been in the field all winter) ──
  g.fillStyle(0x3a2a0a, 0.6);
  g.fillCircle(cx - 11, cy + 23, 2.5);
  g.fillCircle(cx + 4, cy + 23, 2.5);
  g.fillCircle(cx - 3, cy + 22, 1.5);
  g.fillCircle(cx + 12, cy + 22, 1.5);
  // Mud splash up the leg
  g.fillStyle(0x4a3a10, 0.3);
  g.fillCircle(cx - 12, cy + 20, 1);
  g.fillCircle(cx + 11, cy + 19, 1);

  // ── Tail tuft (swishing — long-haired, catches the wind) ──
  g.fillStyle(0x6a3010, 1);
  g.fillTriangle(cx - 20, cy + 2, cx - 22, cy + 8, cx - 18, cy + 6);
  g.fillStyle(0x8b4513, 0.8);
  g.fillTriangle(cx - 20, cy + 3, cx - 21, cy + 7, cx - 18, cy + 5);

  g.generateTexture('highland_cow', s, s);
  g.destroy();
}

/** Highland Crow — oriented with the head pointing RIGHT (Phaser
 *  sprites default-face +X at rotation 0), so the crow is flying
 *  forward into whatever direction it's moving rather than moonwalking
 *  sideways. Body is horizontal, wings sweep up and down, tail trails
 *  behind on the left, beak points out the right.
 */
/** Golden eagle — broad wingspan, hooked beak, fierce eye, talons.
 *  Faces RIGHT (Phaser +X at rotation 0) so it flies forward. */
/** Golden eagle — Scotland's national bird. Broad wingspan, hooked beak,
 *  fierce amber eye, layered flight feathers with individual primary tips.
 *  Faces RIGHT (Phaser +X at rotation 0) so it flies forward. */
