import * as Phaser from 'phaser';

export type DrawFn = (g: Phaser.GameObjects.Graphics) => void;

export function bake(scene: Phaser.Scene, key: string, draw: DrawFn): void {
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, 32, 32);
  g.destroy();
}

export function shadow(g: Phaser.GameObjects.Graphics, x = 16, y = 25, w = 20, h = 5): void {
  g.fillStyle(0x000000, 0.16);
  g.fillEllipse(x, y, w, h);
}

// Layered grounding shadow — wider soft halo + tighter darker core.
// Use this when a prop needs extra "sits on the ground" weight.
export function groundedShadow(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  g.fillStyle(0x000000, 0.16);
  g.fillEllipse(x, y + 1, w + 2, h + 1);
  g.fillStyle(0x000000, 0.3);
  g.fillEllipse(x, y, w, h);
}

export function drawTuft(g: Phaser.GameObjects.Graphics, x: number, baseY: number, colour: number, hi: number): void {
  g.fillStyle(0x102010, 1);
  g.fillTriangle(x, baseY, x - 3, baseY - 12, x - 1, baseY);
  g.fillTriangle(x, baseY, x + 3, baseY - 11, x + 1, baseY);
  g.fillTriangle(x, baseY, x, baseY - 15, x + 1, baseY);
  g.fillStyle(colour, 1);
  g.fillTriangle(x, baseY, x - 2, baseY - 11, x, baseY);
  g.fillTriangle(x, baseY, x + 2, baseY - 10, x + 0.8, baseY);
  g.fillStyle(hi, 0.9);
  g.fillTriangle(x + 0.5, baseY, x + 0.3, baseY - 13, x + 1, baseY);
}

// ── Frost helper — paired triple-toe ptarmigan footprint, scaled
// for either lead or trailing-step recession. Used by the
// deco_ptarmigan_print drawer above. ──
export function drawPtarmiganPrint(g: Phaser.GameObjects.Graphics, cx: number, cy: number, smaller: boolean): void {
  const sc = smaller ? 0.85 : 1;
  // Toes — 3 forward triangles fanning out
  g.fillStyle(0x6a7282, 0.85);
  g.fillTriangle(cx - 1.5 * sc, cy - 2 * sc, cx - 2.2 * sc, cy - 0.5 * sc, cx - 1.0 * sc, cy);
  g.fillTriangle(cx, cy - 2.5 * sc, cx - 0.6 * sc, cy - 0.5 * sc, cx + 0.6 * sc, cy);
  g.fillTriangle(cx + 1.5 * sc, cy - 2 * sc, cx + 1.0 * sc, cy, cx + 2.2 * sc, cy - 0.5 * sc);
  // Heel pad — small circle behind
  g.fillCircle(cx, cy + 0.5 * sc, 0.7 * sc);
  // Inner highlight (slight contrast lift)
  g.fillStyle(0x8a92a2, 0.6);
  g.fillTriangle(cx - 1.3 * sc, cy - 1.6 * sc, cx - 1.7 * sc, cy - 0.7 * sc, cx - 1.0 * sc, cy - 0.2 * sc);
  g.fillTriangle(cx, cy - 2.0 * sc, cx - 0.4 * sc, cy - 0.7 * sc, cx + 0.4 * sc, cy - 0.2 * sc);
  g.fillTriangle(cx + 1.3 * sc, cy - 1.6 * sc, cx + 1.0 * sc, cy - 0.2 * sc, cx + 1.7 * sc, cy - 0.7 * sc);
  // Subtle blue cold shadow inside the print
  g.fillStyle(0x4a6080, 0.35);
  g.fillCircle(cx, cy - 1 * sc, 1.6 * sc);
}
