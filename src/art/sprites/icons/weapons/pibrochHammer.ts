import * as Phaser from 'phaser';

/**
 * `wicon_pibroch_hammer` — Wild Living World Phase 2 evolved Waulking
 * Mallet. The mallet head stays recognisable (oak block + diagonal
 * handle), but a great-pipe drone-pipe rises behind it, and four
 * concentric beat rings (one bright = the crescendo, three muted =
 * the lead-in) fan out so the icon reads "rhythm + pipes".
 *
 * Tonal palette: warm oak + brass drone-pipe + a single bright amber
 * crescendo ring. Subtle gold halo behind the head marks "evolved";
 * same trick as `wicon_monarch_charge` so all evolution icons feel
 * like one family.
 */
export function drawPibrochHammerIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2;
  const cy = s / 2;

  // ── Legendary halo — warm gold soft glow behind the whole assembly.
  g.fillStyle(0xf8d050, 0.18);
  g.fillCircle(cx, cy - 1, 14);
  g.fillStyle(0xfff0a0, 0.12);
  g.fillCircle(cx, cy - 1, 10);

  // ── Four beat rings. The brightest ring (every-fourth-beat
  // crescendo) sits outermost; the three lead-in rings are dimmer
  // and step inward. Each ring is drawn as a stroked ellipse so the
  // line stays anchored regardless of fill order.
  // Crescendo ring — bright cream.
  g.lineStyle(2.6, 0xfff0a0, 0.85);
  g.strokeCircle(cx, cy, 13);
  // Lead-in rings, dimmer toward the centre.
  g.lineStyle(1.6, 0xd6a650, 0.55);
  g.strokeCircle(cx, cy, 10);
  g.lineStyle(1.2, 0xc89a52, 0.40);
  g.strokeCircle(cx, cy, 7.4);
  g.lineStyle(0.8, 0x7a4f22, 0.30);
  g.strokeCircle(cx, cy, 5);

  // ── Drone pipe — rises behind the mallet head, tilted slightly
  // away. Brass body + black mouthpiece, classic piob mhor reed
  // silhouette.
  g.fillStyle(0x140a04, 1);
  g.fillRoundedRect(13, 1, 4, 16, 1.4);
  g.fillStyle(0x9a7028, 1);
  g.fillRoundedRect(13.6, 1, 2.8, 15.4, 1.1);
  // Brass band rings — three quick brass collars where the pipe
  // sections meet.
  g.fillStyle(0xe6c468, 1);
  g.fillRect(13.4, 4, 3.4, 1);
  g.fillRect(13.4, 9, 3.4, 1);
  g.fillRect(13.4, 13, 3.4, 1);
  // Drone reed (black mouthpiece cap)
  g.fillStyle(0x0a0604, 1);
  g.fillRect(13.2, 0.6, 3.6, 1.8);

  // ── Mallet head — same warm-oak body as the base icon, slightly
  // bigger so the silhouette reads "evolved". (No explicit lineStyle
  // reset — Phaser 4 stroke state is owned per stroke call; every
  // subsequent `lineStyle` below sets its own width/colour/alpha.)
  g.fillStyle(0x1a1008, 1);
  g.fillRoundedRect(14, 5, 17, 12, 3);
  g.fillStyle(0x8a6630, 1);
  g.fillRoundedRect(15, 6, 15, 10, 2.5);
  g.fillStyle(0xc89a52, 1);
  g.fillRect(17, 7, 11, 1.4);
  g.fillStyle(0x5f3e1d, 1);
  g.fillRect(16, 13, 13, 1.2);

  // ── Handle — angled down-left, slightly thicker than the base.
  g.lineStyle(5.4, 0x221408, 1);
  g.beginPath();
  g.moveTo(7, 26);
  g.lineTo(20, 11);
  g.strokePath();
  g.lineStyle(3, 0x7a4f22, 1);
  g.beginPath();
  g.moveTo(7, 26);
  g.lineTo(20, 11);
  g.strokePath();
  g.lineStyle(1, 0xe4b86a, 0.8);
  g.beginPath();
  g.moveTo(9, 24);
  g.lineTo(21, 10);
  g.strokePath();

  // ── Single tiny grace-note off the crescendo ring — marks the
  // pibroch's signature embellishment without crowding the silhouette.
  drawGraceNote(g, 25, 22);

  // ── Tip spark on the mallet head — the "evolved" tell, same trick
  // as monarch_charge.
  g.fillStyle(0xffffff, 1);
  g.fillRect(29, 6, 0.8, 0.8);
  g.fillStyle(0xfff8e0, 1);
  g.fillRect(16, 16, 0.6, 0.6);

  g.generateTexture('wicon_pibroch_hammer', s, s);
  g.destroy();
}

function drawGraceNote(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  g.fillStyle(0xfff0a0, 1);
  g.fillEllipse(x, y + 3, 3, 2.2);
  g.fillRect(x + 1, y - 3, 1.2, 6);
  g.fillTriangle(x + 2.2, y - 3, x + 5.5, y - 1.5, x + 2.2, y);
}
