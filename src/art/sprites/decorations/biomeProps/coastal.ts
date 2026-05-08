import * as Phaser from 'phaser';
import { bake, shadow, groundedShadow } from './_shared';

export function bakeCoastal(scene: Phaser.Scene): void {
  // ── deco_kelp_strand — single laminaria frond with stipe + holdfast,
  // bladders along the blade, wet-sheen highlight. The wrack-tide motif. ──
  bake(scene, 'deco_kelp_strand', (g) => {
    shadow(g, 16, 26, 14, 3);
    // Holdfast (the mass at the base where it grips a stone)
    g.fillStyle(0x1a2818, 1);
    g.fillEllipse(16, 25, 8, 3);
    g.fillStyle(0x2a3a20, 1);
    g.fillEllipse(16, 24, 5, 2);
    // Stipe (the stem) — leans NE, slight S-curve
    g.fillStyle(0x1a2818, 1);
    g.fillRect(15, 18, 1, 7);
    g.fillRect(16, 12, 1, 7);
    g.fillRect(17, 7, 1, 6);
    // Blade (the wide flat leaf) — flares from stipe top
    g.fillStyle(0x2a4028, 1);
    g.fillTriangle(17, 7, 12, 9, 14, 13);
    g.fillTriangle(17, 7, 22, 10, 20, 13);
    g.fillStyle(0x355030, 1);
    g.fillTriangle(17, 8, 14, 10, 16, 12);
    g.fillTriangle(17, 8, 21, 10, 19, 12);
    // Bladders (gas-filled nodes — the silhouette tell)
    g.fillStyle(0x4a6a3a, 1);
    g.fillCircle(13, 11, 1.4);
    g.fillCircle(21, 11, 1.3);
    g.fillCircle(17, 9, 1);
    g.fillStyle(0x6a8a4a, 0.85);
    g.fillCircle(13, 10.5, 0.7);
    g.fillCircle(21, 10.5, 0.6);
    // Wet-sheen highlight on blade
    g.fillStyle(0x8aa050, 0.4);
    g.fillRect(16, 9, 2, 3);
    // A few small green flecks at the holdfast (sea-life)
    g.fillStyle(0x4a6a3a, 0.85);
    g.fillCircle(13, 24.5, 0.5);
    g.fillCircle(19, 24.5, 0.4);
  });

  // ── deco_barnacle_rock — sea-darkened rock with barnacle cluster,
  // splash mineral white-streaks down one face. ──
  bake(scene, 'deco_barnacle_rock', (g) => {
    groundedShadow(g, 16, 25, 22, 4);
    // Rock body — wet dark blue-grey
    g.fillStyle(0x1a2028, 1);
    g.fillEllipse(16, 21, 22, 12);
    g.fillStyle(0x3a4a52, 1);
    g.fillEllipse(16, 20, 18, 9);
    // Top facet — lit edge
    g.fillStyle(0x6a7a82, 1);
    g.fillEllipse(15, 17, 12, 4);
    g.fillStyle(0x8a9aa2, 0.85);
    g.fillEllipse(14, 16, 7, 2);
    // Barnacle cluster — small white volcano cones
    const barnacles: ReadonlyArray<readonly [number, number, number]> = [
      [12, 18, 1.5],
      [14, 17, 1.2],
      [17, 17.5, 1.6],
      [20, 18.5, 1.4],
      [16, 19.5, 1.1],
      [11, 20, 1],
      [22, 19, 1.2],
    ];
    for (const [bx, by, br] of barnacles) {
      g.fillStyle(0x6a6a72, 1);
      g.fillCircle(bx, by, br);
      g.fillStyle(0xc8c8d0, 1);
      g.fillCircle(bx, by - 0.2, br * 0.7);
      g.fillStyle(0x2a2028, 1);
      g.fillCircle(bx, by - 0.2, br * 0.3);
    }
    // Salt-mineral white streak running down the rock face
    g.fillStyle(0xd8d8e0, 0.55);
    g.fillRect(8, 19, 1, 5);
    g.fillRect(9, 22, 1, 2);
    // Tiny green algae fleck (lower edge)
    g.fillStyle(0x3a5a28, 0.85);
    g.fillCircle(20, 23, 0.6);
  });

  // ── deco_whelk_shell — small spiral whelk shell, cream + cinnamon
  // bands. Static pickup-feel; signals shore. ──
  bake(scene, 'deco_whelk_shell', (g) => {
    shadow(g, 16, 25, 12, 3);
    // Shell body — pointed cone with spiral
    // Outer cinnamon outline
    g.fillStyle(0x7a4a28, 1);
    g.fillTriangle(16, 11, 11, 24, 21, 24);
    // Cream main body
    g.fillStyle(0xe8c898, 1);
    g.fillTriangle(16, 12, 12, 23, 20, 23);
    // Spiral bands — dark brown ridges
    g.fillStyle(0x5a3818, 1);
    g.fillRect(13, 16, 6, 0.8);
    g.fillRect(13.5, 19, 5, 0.8);
    g.fillRect(14, 21.5, 4, 0.7);
    // Inner highlight (lit side)
    g.fillStyle(0xf8e0b0, 1);
    g.fillTriangle(16, 13, 14, 17, 15, 17);
    // Aperture (mouth) — dark at base
    g.fillStyle(0x3a2010, 1);
    g.fillEllipse(16, 23, 6, 1.5);
    g.fillStyle(0x1a0808, 1);
    g.fillEllipse(16, 23.2, 4, 0.8);
    // Spire tip
    g.fillStyle(0xb8804a, 1);
    g.fillRect(15.7, 11, 0.6, 1);
  });

  // ── deco_foam_line — surf-foam scatter, multiple white blots
  // along a curve. Marks the tide-line. ──
  bake(scene, 'deco_foam_line', (g) => {
    // No grounded shadow — foam is wet film, not solid
    g.fillStyle(0x6a7a82, 0.18);
    g.fillEllipse(16, 22, 26, 4);
    // Wet sand-line tone underneath
    g.fillStyle(0x8a7a60, 0.35);
    g.fillEllipse(16, 21, 22, 2);
    // Foam blots — irregular, varied size, gentle arc
    const foam: ReadonlyArray<readonly [number, number, number]> = [
      [6, 19, 1.6],
      [9, 17, 2.0],
      [13, 16, 2.3],
      [17, 15.5, 2.5],
      [21, 16, 2.2],
      [25, 17, 1.8],
      [27, 19, 1.4],
    ];
    for (const [fx, fy, fr] of foam) {
      g.fillStyle(0xeeeef5, 0.85);
      g.fillCircle(fx, fy, fr);
      g.fillStyle(0xffffff, 0.95);
      g.fillCircle(fx - 0.4, fy - 0.4, fr * 0.55);
    }
    // Tiny bubble specks above foam
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(11, 13, 0.5);
    g.fillCircle(19, 12.5, 0.5);
    g.fillCircle(23, 13, 0.4);
  });
}
