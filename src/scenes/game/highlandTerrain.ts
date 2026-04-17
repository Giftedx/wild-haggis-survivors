/**
 * Builds the static Highland terrain: parallax sky, mountains, ground
 * graphics (grass tones, heather, scree, standing stones, dirt paths,
 * world edge), decorative sprites (thistles, rocks, bushes, cones,
 * Tunnock's wrappers, Tennent's cans, plastic bags), water patches
 * with shimmer + glint tweens, and the ambient haar drift.
 *
 * Pure Phaser scene construction — no GameScene state touched. ~329
 * lines lifted verbatim out of GameScene.createHighlandTerrain.
 */
import Phaser from 'phaser';
import { GAME, COLORS } from '../../config';
import { TWEEN_INFINITE_BREATHE } from '../../utils/tweenPresets';

export function createHighlandTerrain(scene: Phaser.Scene): void {
  // Parallax sky layer — scrolls at 10% of camera speed
  const skyGfx = scene.add.graphics().setScrollFactor(0.1).setDepth(-10);
  const skyW = GAME.WORLD_WIDTH * 1.2;
  const skyH = GAME.WORLD_HEIGHT * 1.2;
  skyGfx.fillGradientStyle(0x1a2a4a, 0x1a2a4a, 0x3a5a7a, 0x3a5a7a, 1);
  skyGfx.fillRect(-200, -200, skyW, skyH);

  // Parallax mountain silhouettes — scrolls at 30% of camera speed
  const mtGfx = scene.add.graphics().setScrollFactor(0.3).setDepth(-5);
  const rngMt = new Phaser.Math.RandomDataGenerator(['mountains']);
  mtGfx.fillStyle(0x2a3a4a, 0.5);
  for (let i = 0; i < 20; i++) {
    const mx = i * (skyW / 20) - 100;
    const mh = rngMt.between(80, 200);
    const mw = rngMt.between(150, 350);
    const baseY = GAME.WORLD_HEIGHT * 0.5;
    mtGfx.fillTriangle(mx, baseY, mx + mw / 2, baseY - mh, mx + mw, baseY);
  }
  mtGfx.fillStyle(0x1a2a3a, 0.4);
  for (let i = 0; i < 15; i++) {
    const mx = i * (skyW / 15) - 50;
    const mh = rngMt.between(50, 140);
    const mw = rngMt.between(200, 400);
    const baseY = GAME.WORLD_HEIGHT * 0.6;
    mtGfx.fillTriangle(mx, baseY, mx + mw / 2, baseY - mh, mx + mw, baseY);
  }

  // Depth stack:
  //  -10 sky, -5 mountains, -4 terrain graphics, -3 deco sprites,
  //  -2 entity shadows, 0+ entities & projectiles, HUD at 50+
  const gfx = scene.add.graphics().setDepth(-4);
  const W = GAME.WORLD_WIDTH;
  const H = GAME.WORLD_HEIGHT;

  // ── Base grass — two-tone for subtle warmth variation across the moor ──
  gfx.fillStyle(COLORS.GRASS, 1);
  gfx.fillRect(0, 0, W, H);

  const rng = new Phaser.Math.RandomDataGenerator(['highlands']);

  // Warm grass undertone patches
  for (let i = 0; i < 25; i++) {
    const x = rng.between(0, W);
    const y = rng.between(0, H);
    gfx.fillStyle(0x3a6a2a, rng.realInRange(0.08, 0.18));
    gfx.fillEllipse(x, y, rng.between(80, 200), rng.between(60, 140));
  }
  // Cool grass shadow patches
  for (let i = 0; i < 30; i++) {
    const x = rng.between(0, W);
    const y = rng.between(0, H);
    gfx.fillStyle(0x1a4a17, rng.realInRange(0.1, 0.22));
    gfx.fillEllipse(x, y, rng.between(50, 130), rng.between(40, 100));
  }
  // Boggy dark patches
  for (let i = 0; i < 15; i++) {
    const x = rng.between(0, W);
    const y = rng.between(0, H);
    gfx.fillStyle(0x1a3a10, rng.realInRange(0.12, 0.25));
    gfx.fillEllipse(x, y, rng.between(30, 80), rng.between(20, 60));
  }

  // ── Grass tuft stipple ──
  gfx.fillStyle(0x3a7a30, 0.2);
  for (let i = 0; i < 300; i++) {
    gfx.fillRect(rng.between(0, W), rng.between(0, H), 2, 2);
  }
  gfx.fillStyle(0x225518, 0.15);
  for (let i = 0; i < 200; i++) {
    gfx.fillRect(rng.between(0, W), rng.between(0, H), 1, 3);
  }

  // ── Heather patches ──
  for (let i = 0; i < 30; i++) {
    const x = rng.between(0, W);
    const y = rng.between(0, H);
    gfx.fillStyle(COLORS.HEATHER, rng.realInRange(0.08, 0.18));
    gfx.fillEllipse(x, y, rng.between(40, 100), rng.between(30, 70));
  }
  for (let i = 0; i < 150; i++) {
    const x = rng.between(0, W);
    const y = rng.between(0, H);
    gfx.fillStyle(0x7a4aaa, rng.realInRange(0.15, 0.35));
    gfx.fillCircle(x, y, rng.between(5, 15));
  }
  for (let i = 0; i < 80; i++) {
    const x = rng.between(0, W);
    const y = rng.between(0, H);
    gfx.fillStyle(0x9966bb, rng.realInRange(0.1, 0.25));
    gfx.fillCircle(x, y, rng.between(3, 8));
  }

  // ── Stone scree patches ──
  for (let i = 0; i < 60; i++) {
    const x = rng.between(0, W);
    const y = rng.between(0, H);
    gfx.fillStyle(COLORS.STONE, rng.realInRange(0.15, 0.3));
    gfx.fillCircle(x, y, rng.between(3, 10));
  }
  gfx.fillStyle(0x8a7e6d, 0.12);
  for (let i = 0; i < 100; i++) {
    gfx.fillCircle(rng.between(0, W), rng.between(0, H), rng.between(1, 3));
  }

  // ── Standing stones ──
  for (let i = 0; i < 15; i++) {
    const x = rng.between(100, W - 100);
    const y = rng.between(100, H - 100);
    const w = rng.between(6, 12);
    const h = rng.between(20, 40);

    gfx.fillStyle(0x000000, 0.12);
    gfx.fillEllipse(x + 3, y + 2, w + 8, 6);
    gfx.fillStyle(0x444444, 0.7);
    gfx.fillRect(x - w / 2 - 1, y - 3, w + 2, 4);
    gfx.fillStyle(0x555555, 0.6);
    gfx.fillRect(x - w / 2, y - h, w, h);
    gfx.fillStyle(0x777777, 0.4);
    gfx.fillRect(x - w / 2, y - h, Math.floor(w / 2), h);
    gfx.fillStyle(0x666666, 0.6);
    gfx.fillEllipse(x, y - h, w + 2, 4);
    gfx.fillStyle(0x88a844, rng.realInRange(0.2, 0.4));
    gfx.fillCircle(x - w / 4, y - h * 0.6, rng.between(2, 4));
    gfx.fillCircle(x + w / 4, y - h * 0.3, rng.between(1, 3));
    gfx.fillStyle(0x2a5522, 0.3);
    gfx.fillCircle(x, y - 2, w / 2 + 2);
  }

  // ── Dirt paths ──
  for (let p = 0; p < 4; p++) {
    let px = rng.between(0, W);
    let py = rng.between(0, H);
    gfx.lineStyle(rng.between(14, 22), 0x4a3a20, 0.08);
    gfx.beginPath();
    gfx.moveTo(px, py);
    const points: number[][] = [];
    for (let s = 0; s < 20; s++) {
      px += rng.between(-80, 80);
      py += rng.between(50, 150);
      points.push([px, py]);
      gfx.lineTo(px, py);
    }
    gfx.strokePath();
    gfx.lineStyle(rng.between(6, 10), 0x5a4a30, 0.18);
    gfx.beginPath();
    gfx.moveTo(points[0][0], points[0][1]);
    for (let s = 1; s < points.length; s++) {
      gfx.lineTo(points[s][0], points[s][1]);
    }
    gfx.strokePath();
  }

  // ── World edge ──
  gfx.fillStyle(0x1a1a0a, 0.15);
  gfx.fillRect(0, 0, W, 20);
  gfx.fillRect(0, H - 20, W, 20);
  gfx.fillRect(0, 0, 20, H);
  gfx.fillRect(W - 20, 0, 20, H);
  gfx.lineStyle(3, 0x3a2a10, 0.4);
  gfx.strokeRect(0, 0, W, H);

  // === Decorative terrain sprites ===
  const rngDeco = new Phaser.Math.RandomDataGenerator(['decorations']);
  // Thistle patches — 120 scattered
  for (let i = 0; i < 120; i++) {
    const x = rngDeco.between(60, W - 60);
    const y = rngDeco.between(60, H - 60);
    scene.add.image(x, y, 'deco_thistle')
      .setDepth(-3)
      .setScale(rngDeco.realInRange(0.7, 1.2))
      .setAlpha(rngDeco.realInRange(0.7, 1.0));
  }
  // Rocks — 60 scattered
  for (let i = 0; i < 60; i++) {
    const x = rngDeco.between(60, W - 60);
    const y = rngDeco.between(60, H - 60);
    const rockKeys = ['deco_rock', 'deco_rock_2', 'deco_rock_3'];
    scene.add.image(x, y, rockKeys[rngDeco.between(0, 2)])
      .setDepth(-3)
      .setScale(rngDeco.realInRange(0.6, 1.4))
      .setFlipX(rngDeco.frac() > 0.5)
      .setAlpha(rngDeco.realInRange(0.75, 1.0));
  }
  // Heather bushes — 80 scattered
  for (let i = 0; i < 80; i++) {
    const x = rngDeco.between(60, W - 60);
    const y = rngDeco.between(60, H - 60);
    scene.add.image(x, y, 'deco_heather')
      .setDepth(-3)
      .setScale(rngDeco.realInRange(0.8, 1.3))
      .setAlpha(rngDeco.realInRange(0.75, 1.0));
  }

  // === Glaswegian cultural litter ===
  // Traffic cones — 15 scattered (Duke of Wellington would be proud)
  for (let i = 0; i < 15; i++) {
    const x = rngDeco.between(80, W - 80);
    const y = rngDeco.between(80, H - 80);
    scene.add.image(x, y, 'deco_cone')
      .setDepth(-3)
      .setScale(rngDeco.realInRange(0.8, 1.1))
      .setAlpha(rngDeco.realInRange(0.8, 1.0));
  }
  // Tunnock's wrappers — 20 scattered
  for (let i = 0; i < 20; i++) {
    const x = rngDeco.between(60, W - 60);
    const y = rngDeco.between(60, H - 60);
    scene.add.image(x, y, 'deco_tunnock')
      .setDepth(-3)
      .setScale(rngDeco.realInRange(0.7, 1.0))
      .setAngle(rngDeco.between(0, 360))
      .setAlpha(rngDeco.realInRange(0.6, 0.9));
  }
  // Abandoned Tennent's pints — 12 scattered
  for (let i = 0; i < 12; i++) {
    const x = rngDeco.between(80, W - 80);
    const y = rngDeco.between(80, H - 80);
    scene.add.image(x, y, 'deco_tennents')
      .setDepth(-3)
      .setScale(rngDeco.realInRange(0.8, 1.1))
      .setAlpha(rngDeco.realInRange(0.7, 0.95));
  }
  // Glasgow kites (plastic bags) — 10 scattered, semi-transparent
  for (let i = 0; i < 10; i++) {
    const x = rngDeco.between(60, W - 60);
    const y = rngDeco.between(60, H - 60);
    scene.add.image(x, y, 'deco_glasgow_kite')
      .setDepth(-3)
      .setScale(rngDeco.realInRange(0.8, 1.2))
      .setAngle(rngDeco.between(0, 360))
      .setAlpha(rngDeco.realInRange(0.3, 0.5));
  }

  // === Water/loch patches ===
  for (let i = 0; i < 6; i++) {
    const wx = rng.between(200, W - 200);
    const wy = rng.between(200, H - 200);
    const wr = rng.between(30, 60);

    scene.add.ellipse(wx, wy, wr * 2.6, wr * 1.6, 0x2a3a1a, 0.25).setDepth(-2);
    scene.add.ellipse(wx, wy, wr * 2.3, wr * 1.4, 0x3a5a2a, 0.2).setDepth(-2);
    scene.add.ellipse(wx, wy, wr * 2, wr * 1.2, 0x1a2a3a, 0.55).setDepth(-1);
    const shimmer = scene.add.ellipse(wx - 5, wy - 3, wr * 1.4, wr * 0.8, 0x2a5a7a, 0.15).setDepth(-1);
    scene.tweens.add({
      targets: shimmer,
      alpha: { from: 0.1, to: 0.25 },
      x: wx + 5,
      duration: 3000 + rng.between(0, 2000),
      ...TWEEN_INFINITE_BREATHE,
    });
    const glint = scene.add.circle(wx + rng.between(-10, 10), wy - wr * 0.3, 2, 0x88bbdd, 0.3).setDepth(-1);
    scene.tweens.add({
      targets: glint,
      x: glint.x + rng.between(-15, 15),
      alpha: { from: 0.15, to: 0.4 },
      duration: 2000 + rng.between(0, 1500),
      yoyo: true,
      repeat: -1,
    });
  }

  // === Ambient haar (highland mist) ===
  for (let i = 0; i < 15; i++) {
    const mx = rng.between(0, W);
    const my = rng.between(0, H);
    const haar = scene.add.ellipse(mx, my,
      rng.between(80, 200), rng.between(20, 40),
      0xccccbb, rng.realInRange(0.04, 0.1),
    ).setDepth(-3);
    scene.tweens.add({
      targets: haar,
      x: haar.x + rng.between(-300, 300),
      y: haar.y + rng.between(-40, 40),
      alpha: { from: haar.alpha, to: haar.alpha * 0.2 },
      duration: rng.between(10000, 20000),
      ...TWEEN_INFINITE_BREATHE,
    });
  }
  for (let i = 0; i < 10; i++) {
    const mx = rng.between(0, W);
    const my = rng.between(0, H);
    const wisp = scene.add.ellipse(mx, my,
      rng.between(40, 80), rng.between(10, 20),
      0xccddee, rng.realInRange(0.03, 0.07),
    ).setDepth(-3);
    scene.tweens.add({
      targets: wisp,
      x: wisp.x + rng.between(-200, 200),
      alpha: { from: wisp.alpha, to: wisp.alpha * 0.3 },
      duration: rng.between(6000, 12000),
      ...TWEEN_INFINITE_BREATHE,
    });
  }
}
