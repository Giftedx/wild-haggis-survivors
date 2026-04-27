/**
 * Seasonal moor decoration kit — three single-frame props that dress the
 * moor between Burns Night and the spring thaw. Each leans on a Scottish
 * cultural anchor (rowan/oak/silver-birch leaf trio for Highland October;
 * primrose + first-thaw shoot for spring; meltwater puddle with frost
 * crust at one edge) so the props read as place-and-time, not generic
 * "leaf/sprout/puddle". Palette pulled from ART_STYLE_BIBLE Wild + Hearth
 * tonal anchors. Companion to biomeProps.ts; FloraScatter owns placement.
 */
import * as Phaser from 'phaser';

type DrawFn = (g: Phaser.GameObjects.Graphics) => void;

function bake(scene: Phaser.Scene, key: string, w: number, h: number, draw: DrawFn): void {
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

export function bakeAutumnLeafScatter(scene: Phaser.Scene): void {
  bake(scene, 'deco_autumn_leaves', 22, 16, (g) => {
    // Soft layered ground shadow under the scatter
    g.fillStyle(0x000000, 0.14);
    g.fillEllipse(11, 13, 18, 4);
    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(11, 13, 14, 2.5);

    // Leaf 1 — OAK (lobed silhouette), warm rust. Top-left, slight tilt.
    // Drawn with three soft lobes off a central body.
    g.fillStyle(0x4a1808, 1);
    g.fillEllipse(5, 6, 5, 3.6);
    g.fillEllipse(3.5, 5.5, 2.4, 2);
    g.fillEllipse(6.5, 5, 2.2, 1.8);
    g.fillEllipse(7, 7, 1.8, 1.6);
    g.fillStyle(0xa64a18, 1);
    g.fillEllipse(5, 5.7, 4.2, 2.8);
    g.fillEllipse(3.8, 5.4, 1.7, 1.4);
    g.fillEllipse(6.2, 5, 1.5, 1.3);
    g.fillStyle(0xd47030, 0.9);
    g.fillEllipse(5, 5.4, 2.6, 1.6);
    // Vein and pip
    g.fillStyle(0x3a1408, 0.9);
    g.fillRect(2.5, 5.7, 5, 0.4);
    g.fillStyle(0xffb060, 0.95);
    g.fillCircle(4.4, 5.2, 0.4);

    // Leaf 2 — ROWAN (compound, paired leaflets), amber-orange. Centre.
    // A central rachis with five small leaflet ovals.
    g.fillStyle(0x3a2008, 1);
    g.fillRect(8.5, 9, 6, 0.5);
    g.fillStyle(0xc8843a, 1);
    g.fillEllipse(9, 8.4, 1.6, 1.1);
    g.fillEllipse(9, 9.7, 1.6, 1.1);
    g.fillEllipse(11, 8.4, 1.6, 1.1);
    g.fillEllipse(11, 9.7, 1.6, 1.1);
    g.fillEllipse(13, 8.4, 1.6, 1.1);
    g.fillEllipse(13, 9.7, 1.6, 1.1);
    g.fillEllipse(14.4, 9, 1.4, 1.0);
    // Leaflet darker undersides
    g.fillStyle(0x6a3818, 0.85);
    g.fillEllipse(9, 9.95, 1.4, 0.5);
    g.fillEllipse(11, 9.95, 1.4, 0.5);
    g.fillEllipse(13, 9.95, 1.4, 0.5);
    // Single specular pip on rachis
    g.fillStyle(0xffd080, 0.95);
    g.fillCircle(11, 8.9, 0.35);

    // Leaf 3 — SILVER BIRCH (small oval, serrated edge implied by colour
    // break), olive-yellow. Right-side, with CRISP CURL edge — the lift
    // off the ground that gives the scatter dimensionality.
    g.fillStyle(0x3a3818, 1);
    g.fillEllipse(18, 7, 4, 2.6);
    g.fillStyle(0x8a8a30, 1);
    g.fillEllipse(18, 6.7, 3.4, 2.2);
    g.fillStyle(0xc4c050, 1);
    g.fillEllipse(18, 6.5, 2.4, 1.4);
    // Curl — paler crescent on the leading edge implies it's lifted
    g.fillStyle(0xe8d878, 0.9);
    g.fillRect(16.5, 5.8, 3, 0.4);
    g.fillStyle(0x5a4818, 0.85);
    g.fillRect(16.5, 5.5, 3, 0.3);
    // Vein
    g.fillStyle(0x3a3008, 0.85);
    g.fillRect(16, 6.8, 4, 0.3);

    // Leaf 4 — small fragment (amber speck) bottom-left, silhouette break
    g.fillStyle(0x6a3818, 1);
    g.fillEllipse(3, 11, 2.4, 1.4);
    g.fillStyle(0xa86028, 1);
    g.fillEllipse(3, 10.8, 1.8, 1.0);
    g.fillStyle(0xd49050, 0.9);
    g.fillCircle(2.7, 10.6, 0.4);

    // Leaf 5 — olive-bronze sliver at bottom-right (asymmetry breaker)
    g.fillStyle(0x3a2810, 1);
    g.fillEllipse(17, 12, 3.2, 1.4);
    g.fillStyle(0x7a5818, 1);
    g.fillEllipse(17, 11.8, 2.4, 1.0);
    g.fillStyle(0xb89030, 0.9);
    g.fillEllipse(17, 11.7, 1.6, 0.6);
    // Tiny catch-light
    g.fillStyle(0xffe090, 0.9);
    g.fillCircle(16.6, 11.5, 0.3);
  });
}

export function bakeSpringShoot(scene: Phaser.Scene): void {
  bake(scene, 'deco_spring_shoot', 14, 20, (g) => {
    // Grounding shadow — small, fresh growth doesn't anchor heavily
    g.fillStyle(0x000000, 0.16);
    g.fillEllipse(7, 18, 10, 2.6);
    g.fillStyle(0x000000, 0.26);
    g.fillEllipse(7, 18, 7, 1.8);

    // FROST CRUST at base — last bit of winter clinging on. Pale
    // cyan-white half-arc at the soil line, asymmetric (bigger on left).
    g.fillStyle(0xc8d8e0, 0.9);
    g.fillEllipse(5.5, 17, 6, 1.6);
    g.fillEllipse(9, 17, 3, 1.0);
    g.fillStyle(0xeaf6f0, 1);
    g.fillEllipse(5.5, 16.7, 4, 0.9);
    // Frost speckle — granular tells
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(3.5, 16.6, 0.35);
    g.fillCircle(7, 16.7, 0.3);
    g.fillCircle(10, 16.8, 0.3);

    // SHOOT 1 — central, tallest. Curled tip (the unfurl moment).
    // Dark stem shadow + bright leading edge.
    g.fillStyle(0x1a3a14, 1);
    g.fillRect(7, 5, 1.2, 12);
    g.fillStyle(0x4a8030, 1);
    g.fillRect(7.2, 5.5, 0.8, 11.5);
    // Stem highlight (bright spring chartreuse)
    g.fillStyle(0x9ad860, 0.95);
    g.fillRect(7.5, 7, 0.4, 9);
    // Curled tip — small spiral hook
    g.fillStyle(0x1a3a14, 1);
    g.fillCircle(8, 5, 1.4);
    g.fillStyle(0x4a8030, 1);
    g.fillCircle(8, 5, 1.0);
    g.fillStyle(0x9ad860, 1);
    g.fillCircle(8.3, 4.7, 0.5);
    // Tip catch-light
    g.fillStyle(0xeaffae, 0.95);
    g.fillCircle(8.4, 4.6, 0.3);

    // SHOOT 2 — shorter, leaning right. Asymmetry break.
    g.fillStyle(0x1a3a14, 1);
    g.fillRect(9.5, 9, 1, 8);
    g.fillStyle(0x4a8030, 1);
    g.fillRect(9.7, 9.4, 0.6, 7.6);
    g.fillStyle(0x9ad860, 0.95);
    g.fillRect(9.9, 11, 0.3, 5.5);
    // Curled tip 2
    g.fillStyle(0x4a8030, 1);
    g.fillCircle(10.2, 9, 0.9);
    g.fillStyle(0x9ad860, 1);
    g.fillCircle(10.4, 8.8, 0.45);

    // SHOOT 3 — shortest, left-leaning sliver
    g.fillStyle(0x4a8030, 1);
    g.fillRect(4.5, 11, 0.8, 6);
    g.fillStyle(0x9ad860, 0.9);
    g.fillRect(4.7, 12, 0.4, 5);

    // PRIMROSE BUD — small white-yellow flower head at side of central
    // shoot. The cultural anchor: primrose ("primula vulgaris") is
    // Highland's earliest spring bloom.
    g.fillStyle(0x3a5018, 1);
    g.fillRect(5, 8, 0.6, 3);  // tiny stalk
    g.fillStyle(0x6a8028, 1);
    // Sepals (green base)
    g.fillEllipse(5.3, 7.8, 1.6, 1.2);
    // Petal cluster — pale primrose yellow, 4 petal pips
    g.fillStyle(0xf8e890, 1);
    g.fillCircle(5.3, 6.6, 1.3);
    g.fillStyle(0xfff4b8, 0.95);
    g.fillCircle(5.3, 6.4, 0.9);
    // Petal divisions (darker pip in centre — primrose "eye")
    g.fillStyle(0xc89028, 0.9);
    g.fillCircle(5.3, 6.6, 0.35);
    // Petal pip highlight
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(5.0, 6.3, 0.3);

    // DEW SPARKLES — tiny specular beads on the central shoot. Life-pip.
    g.fillStyle(0xeaf8fc, 0.95);
    g.fillCircle(7.7, 9, 0.4);
    g.fillCircle(7.8, 13, 0.35);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(7.7, 9, 0.18);
    g.fillCircle(7.8, 13, 0.15);
  });
}

export function bakeThawPuddle(scene: Phaser.Scene): void {
  bake(scene, 'deco_thaw_puddle', 26, 12, (g) => {
    // Wet rim — slightly damp halo around the puddle edge
    g.fillStyle(0x2a2818, 0.4);
    g.fillEllipse(13, 8, 22, 6);

    // Outer dark puddle silhouette — irregular brown-blue, asymmetric
    // (wider on right). Layered ellipses give the uneven outline.
    g.fillStyle(0x1a2818, 1);
    g.fillEllipse(13, 7, 20, 5);
    g.fillEllipse(16, 7, 8, 4);
    g.fillEllipse(9, 7.4, 7, 3.5);

    // Mid water — peat-stained brown-blue (Highland meltwater is never
    // clear — it carries iron + peat)
    g.fillStyle(0x2a3a40, 1);
    g.fillEllipse(13, 6.6, 18, 4);
    g.fillEllipse(16, 6.6, 7, 3.4);
    g.fillStyle(0x3a4a52, 1);
    g.fillEllipse(13, 6.3, 16, 3.2);

    // Reflected sky panel — top of the puddle catches a paler band
    g.fillStyle(0x6a8090, 0.85);
    g.fillEllipse(13, 5.8, 14, 1.6);
    g.fillStyle(0x9ab0c0, 0.7);
    g.fillEllipse(11, 5.5, 9, 0.8);

    // White reflection sheen — the brightest band, slightly off-centre
    g.fillStyle(0xeaf4f8, 0.85);
    g.fillRect(7, 5.4, 9, 0.5);
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(8, 5.4, 5, 0.3);

    // RIPPLE RINGS — three concentric arcs from a drop near the right
    g.fillStyle(0xb8d0d8, 0.6);
    g.fillEllipse(18, 7, 6, 1.8);
    g.fillStyle(0x1a2818, 0.4);
    g.fillEllipse(18, 7, 5.4, 1.4);
    g.fillStyle(0xc8e0e8, 0.7);
    g.fillEllipse(18, 7, 3.6, 1.0);
    g.fillStyle(0x2a3a40, 0.5);
    g.fillEllipse(18, 7, 3.0, 0.7);
    g.fillStyle(0xeaf6f8, 0.85);
    g.fillEllipse(18, 7, 1.4, 0.4);

    // FLOATING LEAF — tiny rust fragment drifting in the centre.
    // Cultural anchor (something the moor lost is left behind).
    g.fillStyle(0x4a1808, 1);
    g.fillEllipse(11, 6.7, 2.0, 0.9);
    g.fillStyle(0xa64a18, 1);
    g.fillEllipse(11, 6.5, 1.5, 0.6);
    g.fillStyle(0xd47030, 0.85);
    g.fillRect(10.5, 6.4, 1.1, 0.2);
    // Leaf reflection on the water below it
    g.fillStyle(0x6a3018, 0.6);
    g.fillRect(10.4, 6.9, 1.4, 0.25);

    // FROZEN CRUST at one edge — pale white-cyan crescent on the left
    // rim, the bit of ice still clinging. Cultural-anchor tell:
    // "snow's gone, water's left, frost's losing".
    g.fillStyle(0xc8d8e0, 0.95);
    g.fillEllipse(4, 7.2, 4, 1.6);
    g.fillStyle(0xeaf6f0, 1);
    g.fillEllipse(3.6, 7.0, 3, 1.0);
    // Granular frost tells along the crust edge
    g.fillStyle(0xffffff, 1);
    g.fillCircle(2.5, 6.7, 0.3);
    g.fillCircle(4, 6.6, 0.3);
    g.fillCircle(5.2, 6.8, 0.25);

    // Specular pips — wet glisten on the puddle face. Two pinpricks.
    g.fillStyle(0xffffff, 1);
    g.fillCircle(15, 6.0, 0.35);
    g.fillCircle(20, 6.4, 0.3);
    g.fillStyle(0xeaf8fc, 0.7);
    g.fillCircle(15, 6.0, 0.7);
  });
}
