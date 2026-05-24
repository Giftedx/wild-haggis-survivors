export function bakeAuldReekie(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  const w = 48, h = 56;

  // Body — translucent grey-white
  g.fillStyle(0xe8e4dc, 0.82);
  g.fillEllipse(w / 2, h * 0.45, w * 0.72, h * 0.68);
  // Wispy hem
  g.fillStyle(0xe8e4dc, 0.3);
  g.fillEllipse(w / 2, h * 0.76, w * 0.55, h * 0.28);
  // Top hat
  g.fillStyle(0x3a3a3a, 1);
  g.fillRect(w * 0.3, h * 0.06, w * 0.4, h * 0.22);
  g.fillRect(w * 0.35, h * 0.0, w * 0.3, h * 0.08);
  // Frock coat collar
  g.fillStyle(0x3a3a3a, 0.7);
  g.fillRect(w * 0.28, h * 0.48, w * 0.44, h * 0.18);
  // Right arm raised
  g.fillStyle(0xe8e4dc, 0.7);
  g.fillRect(w * 0.68, h * 0.28, 6, 16);
  // Lantern globe — amber
  g.fillStyle(0xf5a623, 1);
  g.fillCircle(w * 0.77, h * 0.24, 6);
  // Amber corona
  g.fillStyle(0xf5a623, 0.2);
  g.fillCircle(w * 0.77, h * 0.24, 10);
  // Eye flames — gas-lamp yellow
  g.fillStyle(0xf5a623, 1);
  g.fillEllipse(w * 0.38, h * 0.38, 5, 6);
  g.fillEllipse(w * 0.58, h * 0.38, 5, 6);

  g.generateTexture('boss_auld_reekie', w, h);
  g.destroy();
}

export function bakeGasLamp(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  const w = 20, h = 52;

  // Iron post
  g.fillStyle(0x2a2a2a, 1);
  g.fillRect(w / 2 - 3, h * 0.22, 6, h * 0.76);
  // Bracket
  g.fillRect(w / 2 - 7, h * 0.22, 14, 3);
  // Globe — amber
  g.fillStyle(0xf5a623, 0.9);
  g.fillCircle(w / 2, h * 0.13, 7);
  // Ambient glow ring (25% alpha)
  g.fillStyle(0xf5a623, 0.25);
  g.fillCircle(w / 2, h * 0.13, 12);

  g.generateTexture('prop_gas_lamp', w, h);
  g.destroy();
}

export function bakeLanternOrb(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  const r = 10;
  const s = r * 2 + 4;

  // Wisp trail dots
  g.fillStyle(0xf5a623, 0.20);
  g.fillCircle(s / 2 - r - 3, s / 2, 3);
  g.fillCircle(s / 2 - r - 6, s / 2, 2);
  // Core orb
  g.fillStyle(0xf5a623, 0.8);
  g.fillCircle(s / 2, s / 2, r);
  // Stroke ring
  g.lineStyle(1.5, 0xff8c00, 0.9);
  g.strokeCircle(s / 2, s / 2, r);

  g.generateTexture('lantern_orb', s, s);
  g.destroy();
}
