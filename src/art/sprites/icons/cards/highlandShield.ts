import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';
/**
 * `ucard_highland_shield` — Highland targe (round leather-bossed
 * shield). Design pivot (v2): prior icon was concentric grey circles
 * with 4 cardinal dots — read as "generic metal target", not a
 * Scottish targe. New pitch: TAN LEATHER BODY (warm russet, not
 * cold grey), BLUE SALTIRE X etched across the face (Scottish
 * anchor), FULL RING OF 12 BRASS RIVETS around the rim (the targe
 * tell), central domed brass boss with specular stack. Leather
 * warmth + saltire + rivet ring = unmistakably Highland targe.
 */
export function drawHighlandShield(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x1a2a44);
  const cx = 16, cy = 16;

  // ── Dark leather outline ring. ──
  g.fillStyle(0x2a1204, 1);
  g.fillCircle(cx, cy, 13);
  // Mid leather — warm russet, not grey.
  g.fillStyle(0x6a3818, 1);
  g.fillCircle(cx, cy, 12);
  // Lighter leather face — full face tone.
  g.fillStyle(0x8a5a30, 1);
  g.fillCircle(cx - 0.5, cy - 0.5, 11);
  // Upper-left leather dome sheen.
  g.fillStyle(0xaa7040, 1);
  g.fillCircle(cx - 2, cy - 2, 6);
  g.fillStyle(0xcc9050, 0.6);
  g.fillCircle(cx - 3, cy - 3, 3);

  // ── SALTIRE X — thick blue diagonal bars. Sits inside the rivet
  // ring. Scottish flag overlay is the national identity anchor. ──
  // NW-SE bar shadow
  g.fillStyle(0x0a1a44, 1);
  g.fillTriangle(cx - 8.8, cy - 5.2, cx - 5.2, cy - 8.8, cx + 8.8, cy + 5.2);
  g.fillTriangle(cx - 5.2, cy - 8.8, cx + 8.8, cy + 5.2, cx + 5.2, cy + 8.8);
  // NE-SW bar shadow
  g.fillTriangle(cx - 8.8, cy + 5.2, cx - 5.2, cy + 8.8, cx + 8.8, cy - 5.2);
  g.fillTriangle(cx - 5.2, cy + 8.8, cx + 8.8, cy - 5.2, cx + 5.2, cy - 8.8);
  // NW-SE bar bright saltire blue
  g.fillStyle(0x3a66bb, 1);
  g.fillTriangle(cx - 8, cy - 4.5, cx - 4.5, cy - 8, cx + 8, cy + 4.5);
  g.fillTriangle(cx - 4.5, cy - 8, cx + 8, cy + 4.5, cx + 4.5, cy + 8);
  // NE-SW bar bright saltire blue
  g.fillTriangle(cx - 8, cy + 4.5, cx - 4.5, cy + 8, cx + 8, cy - 4.5);
  g.fillTriangle(cx - 4.5, cy + 8, cx + 8, cy - 4.5, cx + 4.5, cy - 8);

  // ── 12 BRASS RIVETS around the rim at r=10.5. The targe tell. ──
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const rx = cx + Math.cos(a) * 10.5;
    const ry = cy + Math.sin(a) * 10.5;
    g.fillStyle(0x3a1e08, 1);
    g.fillCircle(rx, ry, 1.3);
    g.fillStyle(0xccaa44, 1);
    g.fillCircle(rx, ry, 0.9);
    g.fillStyle(0xffdd77, 1);
    g.fillCircle(rx - 0.3, ry - 0.3, 0.5);
  }

  // ── CENTRAL BRASS BOSS — domed stack covering the saltire crossing. ──
  g.fillStyle(0x2a1404, 1);
  g.fillCircle(cx, cy, 4);
  g.fillStyle(0x8a6620, 1);
  g.fillCircle(cx, cy, 3.3);
  g.fillStyle(0xccaa44, 1);
  g.fillCircle(cx - 0.3, cy - 0.3, 2.5);
  g.fillStyle(0xeecc55, 1);
  g.fillCircle(cx - 0.7, cy - 0.7, 1.5);
  g.fillStyle(0xffee88, 1);
  g.fillCircle(cx - 1, cy - 1, 0.8);
  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(cx - 1.1, cy - 1.1, 0.4);

  g.generateTexture('ucard_highland_shield', s, s);
  g.destroy();
}
