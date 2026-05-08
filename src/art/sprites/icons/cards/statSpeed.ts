import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';
export function drawStatSpeed(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x213047);
  const cx = 16, cy = 16;

  // ── Warm motion-flicker ground glow — replaces the generic cool
  // halo so the icon reads as warm peat-and-fire instead of "lightning
  // bolt". ART_STYLE_BIBLE Hearth band: warm peat 0x5a3e20, bright
  // gold 0xffc840 for the flicker. ──
  g.fillStyle(0xffc840, 0.18);
  g.fillEllipse(cx, cy + 5, 22, 6);
  g.fillStyle(0xffaa44, 0.28);
  g.fillEllipse(cx, cy + 5, 14, 4);

  // ── Trailing arc — three shrinking gold puffs LEFT of the haggis,
  // following his line of motion. The arc curves slightly so it reads
  // as "speed trail", not parallel slashes. ──
  g.fillStyle(0xd4b055, 0.5);
  g.fillEllipse(cx - 8, cy + 4, 4, 2);
  g.fillStyle(0xd4b055, 0.65);
  g.fillEllipse(cx - 5, cy + 3, 3.5, 1.8);
  g.fillStyle(0xffc840, 0.85);
  g.fillEllipse(cx - 2, cy + 2, 3, 1.6);

  // ── Running-haggis silhouette — compact dot-body + leaning forward
  // pose with two tiny stub legs and a tail nub. Sits centre-right so
  // the trail reads "behind". ──
  // Body silhouette
  g.fillStyle(0x3a2808, 1);
  g.fillEllipse(cx + 3, cy, 11, 7);
  g.fillStyle(0x6b4e0a, 1);
  g.fillEllipse(cx + 3, cy - 0.5, 9, 5.5);
  g.fillStyle(0x8b6914, 1);
  g.fillEllipse(cx + 3, cy - 1, 7, 4);
  // Tail nub trailing back
  g.fillStyle(0x3a2808, 1);
  g.fillCircle(cx - 3, cy + 1, 1.4);
  // Forward-leaning snout
  g.fillStyle(0xd4956b, 1);
  g.fillCircle(cx + 7.5, cy + 0.5, 1.5);
  g.fillStyle(0x3a2808, 1);
  g.fillCircle(cx + 8, cy + 0.5, 0.5);
  // Eye (forward gaze)
  g.fillStyle(0xffffff, 0.95);
  g.fillCircle(cx + 5, cy - 1.5, 1);
  g.fillStyle(0x111111, 1);
  g.fillCircle(cx + 5.5, cy - 1.5, 0.5);
  // Stub legs — mid-stride lean, left leg back / right leg forward
  g.fillStyle(0x1a0e06, 1);
  g.fillRect(cx - 0.5, cy + 3, 1.4, 3);
  g.fillRect(cx + 5, cy + 3, 1.4, 3.5);

  // ── Forward-pointing speed arrow — small chevron just ahead of the
  // snout, locks in "this way fast". Bright gold so it's the eye-
  // catch. ──
  g.fillStyle(0xffc840, 1);
  g.fillTriangle(cx + 11, cy - 2, cx + 13, cy + 1, cx + 11, cy + 4);
  g.fillStyle(0xfff0a8, 0.95);
  g.fillTriangle(cx + 11.5, cy - 0.5, cx + 12.3, cy + 1, cx + 11.5, cy + 2.5);

  // ── Warm specular flicker pips — three tiny sparks scattered along
  // the trail to sell heat-haze motion. ──
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(cx - 7, cy + 1, 0.7);
  g.fillCircle(cx - 4, cy - 1, 0.5);
  g.fillCircle(cx + 1, cy - 4, 0.5);

  g.generateTexture('ucard_stat_speed', s, s);
  g.destroy();
}
