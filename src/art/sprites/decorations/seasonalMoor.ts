/**
 * Seasonal moor decoration kit — five single-frame props that dress the
 * moor across all four seasons. Each leans on a Scottish cultural anchor
 * (rowan/oak/silver-birch leaf trio for Highland October; primrose +
 * first-thaw shoot for spring; meltwater puddle with frost crust at one
 * edge for late-thaw; snow-cap on a heather clump for deep winter; barley
 * ear for summer/Lammas) so the props read as place-and-time, not generic
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

/**
 * `deco_winter_snowcap` — a heather clump capped with fresh snow. The
 * snow sits on the windward side asymmetrically so it reads as
 * "weather-direction memory" rather than a generic dome. Two purple
 * bloom-tips poke through the cap so the prop carries the same heather-
 * is-Scotland anchor as the autumn/spring leaves but in a colder palette.
 * Cultural cue: the deep-winter moor is rarely white-bare — usually the
 * heather colour bleeds through the snow at the tips.
 */
export function bakeWinterSnowcap(scene: Phaser.Scene): void {
  bake(scene, 'deco_winter_snowcap', 24, 18, (g) => {
    // Layered ground shadow — small, snow doesn't leave a hard cast
    g.fillStyle(0x000000, 0.14);
    g.fillEllipse(12, 16, 18, 3.5);
    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(12, 16, 14, 2.4);

    // Heather base (low dark-purple-green clump showing under the snow)
    g.fillStyle(0x1a1828, 1);
    g.fillEllipse(12, 13, 14, 5);
    g.fillStyle(0x2a2438, 1);
    g.fillEllipse(12, 12.5, 12, 4);
    g.fillStyle(0x3a2848, 1);
    g.fillEllipse(12, 12.2, 10, 3);
    // Two heather bloom-tips poking through the snow (signature anchor)
    g.fillStyle(0x6a2884, 1);
    g.fillCircle(8, 9, 1.4);
    g.fillCircle(15, 8, 1.6);
    g.fillStyle(0x9a48d8, 1);
    g.fillCircle(8, 9, 0.8);
    g.fillCircle(15, 8, 0.9);
    // Brightest petal pip on the larger bloom
    g.fillStyle(0xcc78dd, 1);
    g.fillCircle(15, 7.6, 0.5);

    // Snow cap — asymmetric (bigger on left = windward). Three layers
    // for depth: shadow rim, body, top-light highlight.
    g.fillStyle(0xa8b4c4, 1);
    g.fillEllipse(11, 7, 16, 5);
    g.fillEllipse(7, 8, 6, 3);
    g.fillStyle(0xeaeef6, 1);
    g.fillEllipse(11, 6.4, 14, 4);
    g.fillEllipse(7, 7.6, 5, 2.4);
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(11, 5.8, 11, 3);
    g.fillEllipse(7, 7.2, 4, 1.6);
    // Snow drift highlight (asymmetric ridge — wind-formed)
    g.fillStyle(0xeaf6ff, 0.9);
    g.fillRect(6, 5.4, 9, 0.6);

    // Frost crystal sparkle — three pinpricks on the cap surface
    g.fillStyle(0xc4eaff, 0.95);
    g.fillCircle(9, 5.4, 0.4);
    g.fillCircle(13, 5.7, 0.35);
    g.fillCircle(16, 6.4, 0.3);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(9, 5.4, 0.18);
    g.fillCircle(13, 5.7, 0.16);

    // Tiny falling-snow flecks above the clump
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(4, 3, 0.4);
    g.fillCircle(20, 4, 0.4);
    g.fillCircle(17, 2, 0.3);
  });
}

/**
 * `deco_summer_barley` — a single barley ear bowed by midsummer wind.
 * Cultural anchor: barley is *the* Scottish cereal (whisky base, oats
 * second). The ear has visible awns (the bristly whiskers) which is the
 * unmistakable wheat-vs-barley tell, plus a slight wind-bend so the
 * prop carries motion memory without animation. A single field poppy
 * peeks at the base — common companion in Highland barley fields.
 */
export function bakeSummerBarley(scene: Phaser.Scene): void {
  bake(scene, 'deco_summer_barley', 22, 26, (g) => {
    // Ground shadow
    g.fillStyle(0x000000, 0.14);
    g.fillEllipse(11, 24, 14, 3);
    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(11, 24, 10, 2);

    // Stalk — tall, slightly curved by wind. Drawn as 6 short segments
    // rather than a straight rect so the bend reads naturally.
    g.fillStyle(0x4a5818, 1);
    g.fillRect(11, 22, 1, 2);
    g.fillRect(11.2, 20, 1, 2);
    g.fillRect(11.4, 18, 1, 2);
    g.fillRect(11.6, 16, 1, 2);
    g.fillRect(11.8, 14, 1, 2);
    g.fillRect(12, 12, 1, 2);
    g.fillStyle(0x8aa028, 1);
    g.fillRect(11.2, 22, 0.5, 2);
    g.fillRect(11.4, 20, 0.5, 2);
    g.fillRect(11.6, 18, 0.5, 2);
    g.fillRect(11.8, 16, 0.5, 2);
    g.fillRect(12.0, 14, 0.5, 2);
    g.fillRect(12.2, 12, 0.5, 2);

    // One narrow leaf low on the stalk (long flag-leaf shape)
    g.fillStyle(0x2a3a08, 1);
    g.fillTriangle(8, 18, 11, 16, 10, 22);
    g.fillStyle(0x4a8030, 1);
    g.fillTriangle(8.5, 18.5, 10.6, 16.4, 9.8, 21);
    g.fillStyle(0x8ad048, 0.85);
    g.fillRect(9.4, 18, 0.4, 3);

    // Barley ear — vertical stack of paired grain husks. Each "grain"
    // is a small olive-tinted oval; pairs are offset so the ear looks
    // tufted not striped.
    const earX = 12;
    const earTop = 4;
    for (let i = 0; i < 6; i++) {
      const gy = earTop + i * 1.6;
      // Grain shadow
      g.fillStyle(0x4a4818, 1);
      g.fillEllipse(earX - 1.4, gy, 2.4, 1.4);
      g.fillEllipse(earX + 1.4, gy, 2.4, 1.4);
      // Grain body (warm gold-olive)
      g.fillStyle(0xa89028, 1);
      g.fillEllipse(earX - 1.4, gy, 2, 1.1);
      g.fillEllipse(earX + 1.4, gy, 2, 1.1);
      // Grain highlight
      g.fillStyle(0xeac848, 1);
      g.fillEllipse(earX - 1.4, gy - 0.2, 1.3, 0.7);
      g.fillEllipse(earX + 1.4, gy - 0.2, 1.3, 0.7);
      // Bright top pip
      g.fillStyle(0xfff0b0, 0.9);
      g.fillCircle(earX - 1.4, gy - 0.4, 0.3);
    }

    // Awns — long bristly whiskers radiating up from the top of the
    // ear. The unmistakable barley tell.
    g.lineStyle(0.6, 0x6a5818, 0.9);
    for (let i = 0; i < 7; i++) {
      const ax = 8 + i * 1.2;
      const ay = 4 - (i % 2) * 0.5;
      g.lineBetween(ax, ay, ax + (i - 3) * 0.6, 0);
    }
    g.lineStyle(0.4, 0xa89028, 0.85);
    for (let i = 0; i < 7; i++) {
      const ax = 8 + i * 1.2;
      const ay = 4 - (i % 2) * 0.5;
      g.lineBetween(ax, ay, ax + (i - 3) * 0.6, 0);
    }
    // Awn tip pips — pale gold
    g.fillStyle(0xeac848, 0.95);
    g.fillCircle(7, 0, 0.3);
    g.fillCircle(11, 0, 0.3);
    g.fillCircle(14, 0, 0.3);

    // Companion poppy at the base — tiny bright red bloom
    g.fillStyle(0x4a0808, 1);
    g.fillCircle(15, 23, 1.6);
    g.fillStyle(0xc41818, 1);
    g.fillCircle(15, 23, 1.2);
    g.fillStyle(0xee3030, 1);
    g.fillCircle(15, 22.7, 0.7);
    g.fillStyle(0x000000, 1);
    g.fillCircle(15, 23, 0.4);
    // Poppy stem
    g.fillStyle(0x4a5818, 1);
    g.fillRect(14.7, 23, 0.6, 1);
  });
}
