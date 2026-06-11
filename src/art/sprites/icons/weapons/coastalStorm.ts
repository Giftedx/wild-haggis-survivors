import * as Phaser from 'phaser';

/**
 * `wicon_coastal_storm` — Coastal Storm weapon icon.
 * Concentric storm-rings in Atlantic slate-blue, a central eye-point,
 * and three radiating lightning-fork streaks. Reads as "massive AoE
 * weather" at 32px — distinct from any directional weapon.
 */
export function drawCoastalStormIcon(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();

  const cx = 16;
  const cy = 16;

  // Outer storm ring — widest, faintest.
  g.lineStyle(1.5, 0x4a7aaa, 0.30);
  g.strokeCircle(cx, cy, 14);

  // Mid storm ring.
  g.lineStyle(1.5, 0x5a8aba, 0.50);
  g.strokeCircle(cx, cy, 10);

  // Inner storm ring — brightest.
  g.lineStyle(2, 0x7aaad4, 0.80);
  g.strokeCircle(cx, cy, 6);

  // Eye — dark centre with a pale core.
  g.fillStyle(0x1a2a3a, 1);
  g.fillCircle(cx, cy, 3);
  g.fillStyle(0xc8e0f0, 0.9);
  g.fillCircle(cx, cy, 1.5);

  // Three lightning-fork streaks radiating outward at 0°, 120°, 240°.
  const bolts = [0, 120, 240];
  for (const deg of bolts) {
    const rad = (deg * Math.PI) / 180;
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);
    const inner = 7;
    const outer = 13;

    // Main bolt.
    g.lineStyle(1.5, 0xe8f0ff, 0.9);
    g.beginPath();
    g.moveTo(cx + dx * inner, cy + dy * inner);
    g.lineTo(cx + dx * ((inner + outer) / 2) + dy * 1.5, cy + dy * ((inner + outer) / 2) - dx * 1.5);
    g.lineTo(cx + dx * outer, cy + dy * outer);
    g.strokePath();

    // Fork branch at mid-point.
    g.lineStyle(1, 0xb0c8e8, 0.6);
    g.beginPath();
    g.moveTo(cx + dx * ((inner + outer) / 2) + dy * 1.5, cy + dy * ((inner + outer) / 2) - dx * 1.5);
    g.lineTo(cx + dx * (outer - 2) + dy * 3, cy + dy * (outer - 2) - dx * 3);
    g.strokePath();
  }

  g.generateTexture('wicon_coastal_storm', s, s);
  g.destroy();
}
