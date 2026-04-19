/**
 * `blue_man_of_minch` — Hebridean storm-kelpie rising waist-deep from
 * the Minch. In folklore the "Blue Men" are blue-skinned sailor-spirits
 * who hail passing ships in poetry; a captain who can't complete the
 * verse in kind gets his ship wrecked in the strait between Lewis and
 * the Scottish mainland.
 *
 * Visual pitch: torso surfacing from a foamy wave, one hand raised in
 * the declamation stance (the verse challenge), the other cupping a
 * glowing kenning-rune (the ranged projectile). Flowing wave-curled
 * white-blue beard, storm-cloud wisp overhead, webbed fingers, sea-
 * green eyes. Distinct from `haar_wraith` (still mist) and `kelpie`
 * (horse form) — this one is a sea-chief, not a drifter or a beast.
 */

import Phaser from 'phaser';

export function bakeBlueManOfMinch(scene: Phaser.Scene): void {
  const s = 48;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 4;

  // ── Storm-wisp overhead — the Blue Men summon squalls. A small
  // dark cloud fragment with pale-teal edge so the threat reads as
  // "weather-maker" before he even speaks. ──
  g.fillStyle(0x2a3548, 0.5);
  g.fillEllipse(cx + 2, cy - 22, 14, 4);
  g.fillStyle(0x1e2a3c, 0.65);
  g.fillEllipse(cx, cy - 22, 10, 3);
  g.fillStyle(0x5a7a9a, 0.5);
  g.fillEllipse(cx - 2, cy - 23, 6, 2);
  // Lightning fork hint
  g.fillStyle(0xccddee, 0.8);
  g.fillRect(cx + 4, cy - 21, 1, 2);
  g.fillRect(cx + 4, cy - 19, 2, 1);

  // ── Water pool at feet — wide ripple rings suggest he just
  // surfaced. Layered navy → teal → foam for depth. ──
  g.fillStyle(0x041224, 0.75);
  g.fillEllipse(cx, cy + 18, 34, 8);
  g.fillStyle(0x0e2a4a, 0.7);
  g.fillEllipse(cx, cy + 18, 28, 6);
  g.fillStyle(0x1a4468, 0.6);
  g.fillEllipse(cx, cy + 18, 20, 4);
  // Ripple rings — thin arcs around the pool
  g.lineStyle(0.8, 0x8fc0e0, 0.55);
  g.beginPath(); g.arc(cx, cy + 18, 16, Math.PI, 0); g.strokePath();
  g.lineStyle(0.6, 0x8fc0e0, 0.35);
  g.beginPath(); g.arc(cx, cy + 18, 13, Math.PI, 0); g.strokePath();

  // ── Foamy wave around the waist — the "half-submerged" tell. ──
  g.fillStyle(0x0a1a3d, 1);
  g.fillEllipse(cx, cy + 12, 28, 6);
  g.fillStyle(0x1a3560, 1);
  g.fillEllipse(cx, cy + 11, 26, 5);
  // Foam crest (sea-foam white) curling over the top of the wave
  g.fillStyle(0xbfd8ee, 0.9);
  g.fillEllipse(cx, cy + 9, 26, 2);
  g.fillStyle(0xe8f2fa, 1);
  g.fillRect(cx - 10, cy + 9, 20, 1);
  // Individual foam bubbles
  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(cx - 11, cy + 10, 0.8);
  g.fillCircle(cx + 12, cy + 10, 0.8);
  g.fillCircle(cx - 5, cy + 8, 0.6);
  g.fillCircle(cx + 6, cy + 8, 0.6);

  // ── Torso — broad sailor shoulders. Darker outline + lighter
  // inner + brighter wet-skin sheen. ──
  g.fillStyle(0x0a1a3d, 1);
  g.fillEllipse(cx, cy + 2, 18, 14);
  g.fillStyle(0x1a3560, 1);
  g.fillEllipse(cx, cy + 1, 16, 12);
  g.fillStyle(0x2a4a80, 1);
  g.fillEllipse(cx - 1, cy, 13, 9);
  // Wet-skin sheen across the chest
  g.fillStyle(0x5a80b8, 0.55);
  g.fillEllipse(cx - 2, cy - 1, 9, 3);
  g.fillStyle(0xaaccee, 0.35);
  g.fillEllipse(cx - 3, cy - 2, 5, 1.5);
  // Chest scars / salt-crust runes (thin pale lines)
  g.fillStyle(0xbfd8ee, 0.4);
  g.fillRect(cx - 3, cy + 2, 5, 0.5);
  g.fillRect(cx + 1, cy + 4, 3, 0.5);

  // ── Shoulders + collarbone bar. ──
  g.fillStyle(0x0a1a3d, 1);
  g.fillRect(cx - 10, cy - 5, 20, 3);
  g.fillStyle(0x1a3560, 1);
  g.fillRect(cx - 9, cy - 4, 18, 2);

  // ── LEFT arm — raised in declamation, finger pointing up.
  // The "verse challenge" stance. ──
  g.fillStyle(0x0a1a3d, 1);
  g.fillRect(cx - 13, cy - 10, 3, 8);  // upper arm
  g.fillRect(cx - 15, cy - 16, 3, 7);  // forearm angled up
  g.fillStyle(0x1a3560, 1);
  g.fillRect(cx - 12, cy - 9, 1, 6);
  g.fillRect(cx - 14, cy - 15, 1, 6);
  // Pointing hand — index finger extended upward
  g.fillStyle(0x2a4a80, 1);
  g.fillRect(cx - 15, cy - 19, 2, 4);
  g.fillStyle(0x1a3560, 1);
  g.fillRect(cx - 15, cy - 20, 1, 1);
  // Webbing hint between knuckles (sea-creature trait)
  g.fillStyle(0x4a7ab0, 0.6);
  g.fillRect(cx - 14, cy - 18, 1, 2);

  // ── RIGHT arm — lowered, cupping the kenning-rune. ──
  g.fillStyle(0x0a1a3d, 1);
  g.fillRect(cx + 10, cy - 6, 3, 7);
  g.fillRect(cx + 11, cy, 3, 5);
  g.fillStyle(0x1a3560, 1);
  g.fillRect(cx + 11, cy - 5, 1, 6);
  // Cupped hand
  g.fillStyle(0x2a4a80, 1);
  g.fillRect(cx + 10, cy + 4, 4, 2);
  // Webbing between fingers (2 thin gap pixels)
  g.fillStyle(0x4a7ab0, 0.5);
  g.fillRect(cx + 11, cy + 4, 1, 1);
  g.fillRect(cx + 13, cy + 4, 1, 1);

  // ── Kenning-rune — glowing cyan stone hovering above the cupped
  // hand. The ranged projectile this enemy throws. Triple-stacked
  // glow rings for a "charging" look. ──
  g.fillStyle(0x4080a0, 0.3);
  g.fillCircle(cx + 12, cy + 1, 6);
  g.fillStyle(0x5fc0e0, 0.55);
  g.fillCircle(cx + 12, cy + 1, 4);
  g.fillStyle(0x9fe0ff, 0.9);
  g.fillCircle(cx + 12, cy + 1, 2.5);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx + 12, cy, 1);
  // Rune etching — a simple sea-knot mark (cross + line)
  g.fillStyle(0x1a3560, 0.8);
  g.fillRect(cx + 11.5, cy, 1, 2);
  g.fillRect(cx + 11, cy + 0.8, 2, 0.5);

  // ── Neck (blue-green, wet) ──
  g.fillStyle(0x0a1a3d, 1);
  g.fillRect(cx - 3, cy - 8, 6, 3);
  g.fillStyle(0x1a3560, 1);
  g.fillRect(cx - 2, cy - 7, 4, 2);

  // ── Head — angular sailor-chief profile. ──
  g.fillStyle(0x0a1a3d, 1);
  g.fillEllipse(cx, cy - 13, 11, 11);
  g.fillStyle(0x1a3560, 1);
  g.fillEllipse(cx, cy - 13, 9, 9);
  g.fillStyle(0x2a4a80, 1);
  g.fillEllipse(cx - 1, cy - 14, 6, 6);
  // Cheek wet-sheen
  g.fillStyle(0x5a80b8, 0.5);
  g.fillEllipse(cx - 2, cy - 15, 3, 2);
  g.fillStyle(0xaaccee, 0.35);
  g.fillEllipse(cx - 3, cy - 16, 1.5, 1);

  // ── Wave-curled hair cascading back over the shoulders — foamy
  // white-blue strands, the "sea hair" tell. ──
  g.fillStyle(0x1a3560, 1);
  g.fillEllipse(cx - 7, cy - 13, 4, 7);
  g.fillEllipse(cx + 7, cy - 13, 4, 7);
  g.fillStyle(0x2a4a80, 1);
  g.fillEllipse(cx - 6, cy - 12, 3, 5);
  g.fillEllipse(cx + 6, cy - 12, 3, 5);
  // Foam tips — pale curling-wave highlights
  g.fillStyle(0xbfd8ee, 0.9);
  g.fillCircle(cx - 8, cy - 10, 1.2);
  g.fillCircle(cx + 8, cy - 10, 1.2);
  g.fillStyle(0xe8f2fa, 0.7);
  g.fillCircle(cx - 7, cy - 8, 0.8);
  g.fillCircle(cx + 7, cy - 8, 0.8);
  // Small curl back-flips
  g.fillStyle(0x4a7ab0, 0.6);
  g.fillRect(cx - 10, cy - 9, 1, 3);
  g.fillRect(cx + 9, cy - 9, 1, 3);

  // ── Eyes — sea-green pinpricks with a darker iris ring and a
  // bright catch-light. They "glow" without being cartoonish. ──
  g.fillStyle(0x000000, 1);
  g.fillCircle(cx - 2, cy - 14, 1.4);
  g.fillCircle(cx + 2, cy - 14, 1.4);
  g.fillStyle(0x5faa70, 1);
  g.fillCircle(cx - 2, cy - 14, 0.9);
  g.fillCircle(cx + 2, cy - 14, 0.9);
  g.fillStyle(0xc8f0a0, 1);
  g.fillCircle(cx - 2, cy - 14, 0.45);
  g.fillCircle(cx + 2, cy - 14, 0.45);
  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(cx - 2.2, cy - 14.3, 0.22);
  g.fillCircle(cx + 1.8, cy - 14.3, 0.22);

  // ── Declaiming mouth — slightly open, about to recite. ──
  g.fillStyle(0x000000, 1);
  g.fillRect(cx - 1, cy - 10, 3, 1);
  g.fillStyle(0x0a1a3d, 0.7);
  g.fillRect(cx - 1, cy - 11, 3, 1);

  // ── Beard — long wave-curled white-blue strands spilling over
  // the collarbone. This is the Blue Man's signature feature. ──
  // Dark base shadow
  g.fillStyle(0x0a1a3d, 1);
  g.fillEllipse(cx, cy - 7, 10, 5);
  // Mid tone
  g.fillStyle(0x2a4a80, 1);
  g.fillEllipse(cx, cy - 7, 8, 4);
  // Foam-pale beard tips (the wave-curl)
  g.fillStyle(0xbfd8ee, 0.9);
  g.fillRect(cx - 4, cy - 6, 1, 3);
  g.fillRect(cx - 2, cy - 5, 1, 4);
  g.fillRect(cx, cy - 5, 1, 5);
  g.fillRect(cx + 2, cy - 5, 1, 4);
  g.fillRect(cx + 4, cy - 6, 1, 3);
  g.fillStyle(0xe8f2fa, 0.7);
  g.fillRect(cx - 1, cy - 4, 1, 3);
  g.fillRect(cx + 1, cy - 4, 1, 3);

  // ── Seaweed trailing off one shoulder — green strand. ──
  g.fillStyle(0x1a4a2a, 0.85);
  g.fillRect(cx - 9, cy - 1, 1, 5);
  g.fillStyle(0x2a6a3a, 0.7);
  g.fillRect(cx - 9, cy, 1, 3);
  g.fillStyle(0x3a8a4a, 0.6);
  g.fillRect(cx - 8, cy + 2, 1, 2);

  // ── Water drips — small droplets running down the chest. ──
  g.fillStyle(0x5fc0e0, 0.7);
  g.fillCircle(cx - 5, cy + 6, 0.7);
  g.fillCircle(cx + 5, cy + 6, 0.6);
  g.fillStyle(0xaaddee, 0.55);
  g.fillCircle(cx - 5, cy + 7, 0.35);
  g.fillCircle(cx + 5, cy + 7, 0.3);

  g.generateTexture('blue_man_of_minch', s, s);
  g.destroy();
}
