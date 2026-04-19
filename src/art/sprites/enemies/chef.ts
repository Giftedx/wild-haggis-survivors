import Phaser from 'phaser';

export function bakeChef(scene: Phaser.Scene): void {
  const s = 48;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // === Legs (black work trousers, scuffed from the kitchen) ===
  g.fillStyle(0x1a1a1a, 1);
  g.fillRect(cx - 7, cy + 12, 5, 8);
  g.fillRect(cx + 2, cy + 12, 5, 8);
  // Trouser crease highlight
  g.fillStyle(0x222222, 0.6);
  g.fillRect(cx - 5, cy + 13, 1, 6);
  g.fillRect(cx + 4, cy + 13, 1, 6);
  // Non-slip kitchen shoes (chunky, black, oil-resistant)
  g.fillStyle(0x0a0a0a, 1);
  g.fillRect(cx - 8, cy + 18, 6, 3);
  g.fillRect(cx + 2, cy + 18, 6, 3);
  // Shoe sole edge (white rubber)
  g.fillStyle(0x444444, 1);
  g.fillRect(cx - 8, cy + 20, 6, 1);
  g.fillRect(cx + 2, cy + 20, 6, 1);

  // === Grease-splattered apron over shirt ===
  g.fillStyle(0x888877, 1);
  g.fillRect(cx - 10, cy - 4, 20, 18);
  g.fillStyle(0xddddcc, 1);
  g.fillRect(cx - 9, cy - 3, 18, 16);
  // Apron strings visible at sides (tied at back, ends peeking)
  g.fillStyle(0xccccbb, 1);
  g.fillRect(cx - 11, cy - 1, 2, 1);
  g.fillRect(cx + 9, cy - 1, 2, 1);
  // String dangling below knot at back
  g.lineStyle(1, 0xbbbbaa, 0.7);
  g.lineBetween(cx - 11, cy, cx - 12, cy + 4);
  g.lineBetween(cx + 10, cy, cx + 11, cy + 4);
  // Grease splatters (variety of sizes, ages — old and fresh)
  g.fillStyle(0xaa8833, 0.6);
  g.fillCircle(cx - 4, cy + 2, 2.5);
  g.fillCircle(cx + 5, cy + 6, 2);
  g.fillStyle(0x886622, 0.5);
  g.fillCircle(cx + 2, cy + 1, 1.5);
  g.fillCircle(cx - 6, cy + 8, 1.5);
  // Fresh red sauce splash (just happened — tomato or brown)
  g.fillStyle(0xcc4422, 0.35);
  g.fillCircle(cx - 2, cy + 5, 1);
  g.fillCircle(cx + 3, cy + 9, 0.8);
  // Apron pocket with pen and notepad edge visible
  g.fillStyle(0xbbbbaa, 1);
  g.fillRect(cx - 4, cy + 8, 8, 4);
  g.fillStyle(0xccccbb, 1);
  g.fillRect(cx - 3, cy + 8, 6, 3);
  // Pen (blue bic sticking out)
  g.fillStyle(0x2244aa, 1);
  g.fillRect(cx + 1, cy + 6, 1, 4);
  g.fillStyle(0x4466cc, 1);
  g.fillRect(cx + 1, cy + 6, 1, 1);

  // === Arms (sleeves rolled up, beefy forearms — burns and all) ===
  g.fillStyle(0xaa6644, 1);
  g.fillRect(cx - 14, cy - 2, 4, 7);
  g.fillRect(cx + 10, cy - 2, 4, 7);
  g.fillStyle(0xbb7755, 1);
  g.fillRect(cx - 13, cy - 1, 2, 5);
  g.fillRect(cx + 11, cy - 1, 2, 5);
  // Burn mark on forearm (kitchen hazard — tiny red mark)
  g.fillStyle(0xcc6644, 0.5);
  g.fillCircle(cx - 12, cy + 2, 0.7);
  // Ruddy knuckles (hands — been working hard)
  g.fillStyle(0xcc8866, 1);
  g.fillRect(cx - 14, cy + 4, 3, 2);
  g.fillRect(cx + 11, cy + 4, 3, 2);

  // === Head (ruddy, no-nonsense, been on shift since 6am) ===
  g.fillStyle(0xaa5533, 1);
  g.fillCircle(cx, cy - 10, 8);
  g.fillStyle(0xddaa88, 1);
  g.fillCircle(cx, cy - 10, 7);
  // Flushed cheeks (hot kitchen)
  g.fillStyle(0xee8866, 0.6);
  g.fillCircle(cx - 4, cy - 8, 2);
  g.fillCircle(cx + 4, cy - 8, 2);
  // Sweat bead on temple
  g.fillStyle(0xaaddff, 0.6);
  g.fillCircle(cx + 6, cy - 12, 0.8);
  // Dark eyes (tired but focused — seen a thousand orders today)
  g.fillStyle(0x111111, 1);
  g.fillRect(cx - 5, cy - 11, 4, 1.5);
  g.fillRect(cx + 1, cy - 11, 4, 1.5);
  // Under-eye shadows (bags — long shift)
  g.fillStyle(0x996644, 0.4);
  g.fillEllipse(cx - 3, cy - 9, 4, 1.5);
  g.fillEllipse(cx + 3, cy - 9, 4, 1.5);
  // Five o'clock shadow (hasn't shaved — been working)
  g.fillStyle(0x997766, 0.25);
  g.fillRect(cx - 4, cy - 7, 8, 3);
  // "Gonnae no dae that" mouth — thin, exasperated line
  g.fillStyle(0x884433, 1);
  g.fillRect(cx - 3, cy - 6, 6, 1);
  g.fillCircle(cx - 3, cy - 5, 0.5);
  g.fillCircle(cx + 3, cy - 5, 0.5);

  // === Paper chip-shop hat (soda-jerk fold) ===
  g.fillStyle(0xccccbb, 1);
  g.fillRect(cx - 8, cy - 20, 16, 4);
  g.fillStyle(0xeeeedd, 1);
  g.fillRect(cx - 7, cy - 19, 14, 3);
  g.fillStyle(0xddddcc, 1);
  g.fillRect(cx - 9, cy - 16, 18, 3);
  g.fillStyle(0xeeeedd, 1);
  g.fillRect(cx - 8, cy - 16, 16, 2);
  g.fillStyle(0xbbbbaa, 0.8);
  g.fillRect(cx - 8, cy - 17, 16, 1);
  g.fillStyle(0xccbb99, 0.6);
  g.fillCircle(cx + 3, cy - 18, 1.5);

  // === Chip fork (pale cream wood, two flat broad tines) ===
  // Handle
  g.fillStyle(0xccbb99, 1);
  g.fillRect(cx + 12, cy + 2, 2, 10);
  g.fillStyle(0xddccaa, 1);
  g.fillRect(cx + 12, cy + 3, 2, 8);
  // Tines (two prongs)
  g.fillStyle(0xddccaa, 1);
  g.fillRect(cx + 11, cy - 3, 2, 6);
  g.fillRect(cx + 14, cy - 3, 2, 6);
  g.fillStyle(0xeeddbb, 1);
  g.fillRect(cx + 11, cy - 2, 2, 4);
  g.fillRect(cx + 14, cy - 2, 2, 4);
  // === CHIP on the fork (golden, glistening, this is what it's all about) ===
  g.fillStyle(0xcc9922, 1);
  g.fillRect(cx + 10, cy - 6, 7, 4);
  g.fillStyle(0xddaa33, 1);
  g.fillRect(cx + 10, cy - 5, 7, 2);
  // Chip golden highlight
  g.fillStyle(0xeebb44, 1);
  g.fillRect(cx + 11, cy - 5, 5, 1);
  // Grease sheen on chip
  g.fillStyle(0xffdd66, 0.4);
  g.fillRect(cx + 11, cy - 6, 3, 1);
  // Chip batter crust edge (darker, crunchy)
  g.fillStyle(0xaa7711, 1);
  g.fillRect(cx + 10, cy - 3, 7, 1);

  // === Steam wisps (thicker — it's fresh from the fryer) ===
  g.fillStyle(0xcccccc, 0.4);
  g.fillCircle(cx - 6, cy - 20, 2.5);
  g.fillCircle(cx + 2, cy - 23, 3);
  g.fillCircle(cx + 7, cy - 19, 2.5);
  g.fillStyle(0xdddddd, 0.3);
  g.fillCircle(cx - 4, cy - 22, 2);
  g.fillCircle(cx + 4, cy - 21, 1.8);
  // Rising heat haze (barely visible shimmer above steam)
  g.fillStyle(0xeeeeee, 0.15);
  g.fillCircle(cx, cy - 25, 3);

  g.generateTexture('chef', s, s);
  g.destroy();
}

