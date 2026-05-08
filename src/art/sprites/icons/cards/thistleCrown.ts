import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';
/**
 * `ucard_thistle_crown` — crown fashioned from a thistle. Design pivot
 * (v2): prior icon was gold tines + band + bare purple ball on top +
 * loose gems. The thistle read was weak — just a purple circle with
 * no plant anchor (no green, no spikes, no calyx). Looked like any
 * crown with a jewel. New pitch: BIG THISTLE BLOOM dominates the top
 * half with GREEN SPIKY CALYX (the armoured cup that says "thistle"
 * unmistakably), bristly PURPLE/PINK FLORETS fanning upward, lower
 * gold crown band with just THREE tines (reduced from five so the
 * thistle wins centre-mass). Single ruby at band-centre as the royal
 * gem. Green leaves flank the calyx so "plant" reads even before
 * colour registers. Crown + thistle now stack cleanly, thistle wins.
 */
export function drawThistleCrown(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x3a214d);
  const cx = 16, cy = 18;

  // Lower crown band — brass/gold, thick chunky band
  g.fillStyle(0x5a4008, 1);
  g.fillRect(cx - 10, cy + 4, 20, 5);
  g.fillStyle(0xbb8818, 1);
  g.fillRect(cx - 10, cy + 5, 20, 3);
  g.fillStyle(0xffdd55, 1);
  g.fillRect(cx - 10, cy + 5, 20, 1);
  // Band bottom shadow line
  g.fillStyle(0x2a1c04, 1);
  g.fillRect(cx - 10, cy + 8, 20, 1);

  // Three small gold tines on the band — low profile so thistle dominates
  const tines = [-7, 0, 7];
  const theights = [3, 4, 3];
  for (let i = 0; i < 3; i++) {
    const tx = cx + tines[i];
    const th = theights[i];
    g.fillStyle(0x5a4008, 1);
    g.fillTriangle(tx - 2, cy + 5, tx, cy + 5 - th, tx + 2, cy + 5);
    g.fillStyle(0xbb8818, 1);
    g.fillTriangle(tx - 1.3, cy + 5, tx, cy + 6 - th, tx + 1.3, cy + 5);
    g.fillStyle(0xffdd55, 0.85);
    g.fillTriangle(tx - 0.6, cy + 5, tx, cy + 6.5 - th, tx, cy + 5);
  }

  // Ruby at band centre — royal gem
  g.fillStyle(0x5a0404, 1);
  g.fillCircle(cx, cy + 6.5, 1.8);
  g.fillStyle(0xcc1818, 1);
  g.fillCircle(cx, cy + 6.5, 1.3);
  g.fillStyle(0xff5a4a, 1);
  g.fillCircle(cx - 0.3, cy + 6.2, 0.6);

  // GREEN SPIKY CALYX — the armoured cup that makes this specifically
  // a thistle not any round flower. Pointed green triangles forming
  // a bulb under the bloom.
  g.fillStyle(0x1a3a0a, 1);
  g.fillEllipse(cx, cy - 1, 9, 5);
  g.fillStyle(0x2a5a18, 1);
  g.fillEllipse(cx, cy - 2, 7.5, 4);
  g.fillStyle(0x4a8a28, 1);
  g.fillEllipse(cx - 1, cy - 2.5, 4, 2);
  // Calyx spike points — 5 pointed triangles around the top rim
  g.fillStyle(0x1a3a0a, 1);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.4;
    const sx = cx + Math.cos(a) * 4;
    const sy = cy - 2 + Math.sin(a) * 2;
    g.fillTriangle(sx - 1, sy + 0.5, sx + 1, sy + 0.5, sx + Math.cos(a) * 1.5, sy + Math.sin(a) * 1.5 - 1);
  }
  g.fillStyle(0x4a8a28, 0.9);
  g.fillTriangle(cx - 3.5, cy - 3, cx - 2.5, cy - 3, cx - 3, cy - 5);
  g.fillTriangle(cx + 2.5, cy - 3, cx + 3.5, cy - 3, cx + 3, cy - 5);
  g.fillTriangle(cx - 0.5, cy - 3, cx + 0.5, cy - 3, cx, cy - 5.5);

  // Green LEAVES flanking the calyx — two curved blades
  g.fillStyle(0x1a3a0a, 1);
  g.fillTriangle(cx - 6, cy - 1, cx - 10, cy + 2, cx - 5, cy + 2);
  g.fillTriangle(cx + 6, cy - 1, cx + 10, cy + 2, cx + 5, cy + 2);
  g.fillStyle(0x2a5a18, 1);
  g.fillTriangle(cx - 6, cy - 0.5, cx - 9, cy + 1.5, cx - 5, cy + 1.5);
  g.fillTriangle(cx + 6, cy - 0.5, cx + 9, cy + 1.5, cx + 5, cy + 1.5);
  g.fillStyle(0x4a8a28, 0.85);
  g.fillTriangle(cx - 6, cy, cx - 8, cy + 1, cx - 5, cy + 1);
  g.fillTriangle(cx + 6, cy, cx + 8, cy + 1, cx + 5, cy + 1);

  // PURPLE BLOOM — bristly florets fanning upward from the calyx.
  // The purple mass.
  g.fillStyle(0x3a1255, 1);
  g.fillEllipse(cx, cy - 6, 8, 6);
  g.fillStyle(0x5a2288, 1);
  g.fillEllipse(cx, cy - 6.5, 7, 5);
  g.fillStyle(0x8844bb, 1);
  g.fillEllipse(cx - 0.5, cy - 7, 5, 3.5);

  // Bristly florets — radial spikes fanning up + out (thistle signature)
  g.fillStyle(0xaa66cc, 1);
  const floretAngles = [-Math.PI * 0.85, -Math.PI * 0.65, -Math.PI * 0.5, -Math.PI * 0.35, -Math.PI * 0.15];
  for (const a of floretAngles) {
    const fx = cx + Math.cos(a) * 5.5;
    const fy = cy - 6 + Math.sin(a) * 4;
    g.fillRect(fx - 0.4, fy - 0.4, 0.8, 0.8);
    const tx = cx + Math.cos(a) * 7.5;
    const ty = cy - 6 + Math.sin(a) * 6;
    g.fillCircle(tx, ty, 0.7);
  }
  // Brighter magenta tips on the highest florets
  g.fillStyle(0xff88dd, 0.95);
  g.fillCircle(cx, cy - 12, 0.8);
  g.fillCircle(cx - 3, cy - 11, 0.7);
  g.fillCircle(cx + 3, cy - 11, 0.7);

  // Bright pink specular at bloom centre
  g.fillStyle(0xff88dd, 1);
  g.fillCircle(cx - 1, cy - 7, 1);
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(cx - 1.3, cy - 7.3, 0.4);

  g.generateTexture('ucard_thistle_crown', s, s);
  g.destroy();
}
