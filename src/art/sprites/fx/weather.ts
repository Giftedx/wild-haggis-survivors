/**
 * Scotland's sky as a character. Four weather-fx singles for seasonal
 * and biome systems: a fat pewter raindrop, smirr (Scots: fine wind-
 * driven drizzle), crepuscular sun-shafts (god-light through cloud-
 * gaps), and a Mirrie Dancers ribbon — Shetland/Scots name for the
 * aurora borealis. Palette anchors per ART_STYLE_BIBLE: pewter-cool
 * for rain (Grave/melancholy-cosy), warm-gold for shafts (Hearth grace),
 * teal→green→magenta for aurora (Fey wonder). All sprites are static
 * single frames — animation is the parent system's job (translate,
 * fade, scroll, loop).
 */

import * as Phaser from 'phaser';

export function bakeFxRainDrop(scene: Phaser.Scene): void {
  const w = 6;
  const h = 12;
  const gs = scene.add.graphics();
  const cx = w / 2;

  // Soft halo behind drop — rain reads against any bg, dark or light.
  gs.fillStyle(0x6a7d8c, 0.18);
  gs.fillRect(cx - 1.5, 3, 3, 7);
  gs.fillStyle(0x6a7d8c, 0.1);
  gs.fillRect(cx - 2, 4, 4, 6);

  // Body — pewter-blue teardrop. Top narrow, midsection fat, bottom
  // tapers to a point. Built from stacked rects for pixel clarity.
  gs.fillStyle(0x4a6276, 0.95);
  gs.fillRect(cx - 0.5, 1, 1, 2);
  gs.fillStyle(0x5a7388, 1);
  gs.fillRect(cx - 1, 3, 2, 2);
  gs.fillRect(cx - 1.5, 5, 3, 3);
  gs.fillStyle(0x4a6276, 1);
  gs.fillRect(cx - 1, 8, 2, 2);
  gs.fillRect(cx - 0.5, 10, 1, 1);

  // Top-light slash — wet highlight where the sky catches the drop.
  gs.fillStyle(0xb8d4e8, 0.9);
  gs.fillRect(cx - 0.8, 4, 0.8, 2);
  gs.fillStyle(0xeaf4ff, 1);
  gs.fillRect(cx - 0.5, 4.5, 0.5, 1);

  // Dark bottom point — gives the drop weight. Pewter dignity.
  gs.fillStyle(0x2e3e4a, 1);
  gs.fillRect(cx - 0.3, 10.5, 0.6, 0.6);

  gs.generateTexture('fx_rain_drop', w, h);
  gs.destroy();
}

export function bakeFxDrizzle(scene: Phaser.Scene): void {
  const size = 16;
  const gs = scene.add.graphics();

  // Smirr — atmospheric haze, no focal point. Seven micro-streaks at
  // a slight wind-bias angle, varied alpha for depth. Coords chosen
  // to scatter across the canvas without obvious grid pattern.
  // Each streak: 1px wide, 2-3px tall, leaning right ~20° via offset.
  gs.fillStyle(0xb0c0cc, 0.55);
  gs.fillRect(2, 1, 1, 2);
  gs.fillRect(2.4, 3, 1, 1);

  gs.fillStyle(0x9eb0bc, 0.7);
  gs.fillRect(7, 2, 1, 3);
  gs.fillRect(7.5, 5, 1, 1);

  gs.fillStyle(0xc4d2dc, 0.45);
  gs.fillRect(12, 1, 1, 2);

  gs.fillStyle(0xa8bac8, 0.6);
  gs.fillRect(4, 6, 1, 2);
  gs.fillRect(4.4, 8, 1, 1);

  gs.fillStyle(0xb8c8d4, 0.5);
  gs.fillRect(10, 5, 1, 3);
  gs.fillRect(10.5, 8, 1, 1);

  gs.fillStyle(0x9aacb8, 0.65);
  gs.fillRect(13, 8, 1, 2);

  gs.fillStyle(0xbac8d2, 0.5);
  gs.fillRect(6, 10, 1, 2);
  gs.fillRect(6.4, 12, 1, 1);

  gs.fillStyle(0xa6b8c4, 0.55);
  gs.fillRect(11, 11, 1, 2);

  gs.fillStyle(0xc0d0dc, 0.4);
  gs.fillRect(2, 12, 1, 2);

  // Soft alpha wash — binds the streaks into one cloud-like haze.
  gs.fillStyle(0xc8d4dc, 0.06);
  gs.fillRect(0, 0, size, size);

  gs.generateTexture('fx_drizzle', size, size);
  gs.destroy();
}

export function bakeFxSunShaft(scene: Phaser.Scene): void {
  const w = 24;
  const h = 40;
  const gs = scene.add.graphics();

  // Crepuscular ray — soft gold triangle widening downward. Built
  // from horizontal rect bands; each band has a brighter centre stripe
  // and softer feathered edges via separate alpha passes. Stack 8
  // bands top→bottom, widening from 6px to 18px.
  const bands = 8;
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1); // 0..1 top→bottom
    const halfW = 3 + t * 6; // 3..9 (full 6..18)
    const cx = w / 2;
    const y = 4 + i * 4;
    // Outer feather — warm low-alpha gold.
    gs.fillStyle(0xf5d68a, 0.18);
    gs.fillRect(cx - halfW, y, halfW * 2, 4);
    // Mid band — stronger gold.
    gs.fillStyle(0xfae0a0, 0.32);
    gs.fillRect(cx - halfW * 0.65, y, halfW * 1.3, 4);
    // Bright centre stripe — pale buttery cream.
    gs.fillStyle(0xfff2c8, 0.55);
    gs.fillRect(cx - halfW * 0.3, y, halfW * 0.6, 4);
  }

  // Bright top apex — like the cloud-gap origin. Small pure-white
  // pinprick fading into warm gold halo.
  gs.fillStyle(0xfff8d8, 0.7);
  gs.fillRect(w / 2 - 1.5, 2, 3, 3);
  gs.fillStyle(0xffffff, 0.95);
  gs.fillRect(w / 2 - 0.5, 2.5, 1, 2);

  // Dust-mote pips — tiny gold suspended specks (Tyndall-effect feel).
  // Hand-placed asymmetrically inside the shaft so it doesn't read
  // as a regular pattern.
  gs.fillStyle(0xfff0b0, 0.85);
  gs.fillRect(10, 14, 1, 1);
  gs.fillStyle(0xffe890, 0.7);
  gs.fillRect(14, 22, 1, 1);
  gs.fillStyle(0xfff2c0, 0.8);
  gs.fillRect(11, 30, 1, 1);
  gs.fillStyle(0xffd870, 0.65);
  gs.fillRect(13, 36, 1, 1);

  gs.generateTexture('fx_sun_shaft', w, h);
  gs.destroy();
}

export function bakeFxAuroraBand(scene: Phaser.Scene): void {
  const w = 48;
  const h = 16;
  const gs = scene.add.graphics();

  // Mirrie Dancers — horizontal undulating ribbon, three colour zones
  // left→right: cool teal (left third) → green (middle) → magenta-pink
  // (right third). Body built as overlapping rects following a soft
  // sine-ish wave so the ribbon feels alive, not stamped.
  // Wave y-positions (sampled): row 5,4,3,4,5,6,7,7,6,5,4,4,5,6,7,7
  // gives a gentle bend without hard edges.
  const waveY = [5, 4, 3, 4, 5, 6, 7, 7, 6, 5, 4, 4, 5, 6, 7, 7];

  // Pass 1: bottom hint of blue-black at base — the night sky still
  // bleeds through low.
  gs.fillStyle(0x0a1428, 0.5);
  gs.fillRect(0, 12, w, 4);

  // Pass 2: outer glow halo, follows wave. Wide, low alpha.
  for (let x = 0; x < w; x++) {
    const yIdx = Math.floor((x / w) * waveY.length);
    const y = waveY[Math.min(yIdx, waveY.length - 1)];
    const t = x / w;
    let glow = 0x4af0d0;
    if (t > 0.66) glow = 0xff6ac0;
    else if (t > 0.33) glow = 0x70ff90;
    gs.fillStyle(glow, 0.15);
    gs.fillRect(x, y - 2, 1, 8);
  }

  // Pass 3: ribbon mid-body. Saturated colour zone.
  for (let x = 0; x < w; x++) {
    const yIdx = Math.floor((x / w) * waveY.length);
    const y = waveY[Math.min(yIdx, waveY.length - 1)];
    const t = x / w;
    let mid = 0x30c8b0;
    if (t > 0.66) mid = 0xe04aa0;
    else if (t > 0.33) mid = 0x4ade70;
    gs.fillStyle(mid, 0.7);
    gs.fillRect(x, y, 1, 4);
  }

  // Pass 4: bright inner core stripe — the dancer's spine.
  for (let x = 0; x < w; x++) {
    const yIdx = Math.floor((x / w) * waveY.length);
    const y = waveY[Math.min(yIdx, waveY.length - 1)];
    const t = x / w;
    let core = 0xa8fff0;
    if (t > 0.66) core = 0xffb0e0;
    else if (t > 0.33) core = 0xc0ffc8;
    gs.fillStyle(core, 0.95);
    gs.fillRect(x, y + 1, 1, 2);
  }

  // Pass 5: top soft glow — the ribbon casts up into the dark sky.
  for (let x = 0; x < w; x++) {
    const yIdx = Math.floor((x / w) * waveY.length);
    const y = waveY[Math.min(yIdx, waveY.length - 1)];
    const t = x / w;
    let top = 0x90eed0;
    if (t > 0.66) top = 0xffa0d0;
    else if (t > 0.33) top = 0xa0f0a8;
    gs.fillStyle(top, 0.25);
    gs.fillRect(x, y - 3, 1, 2);
  }

  // Star pips — faint white pinpricks above the ribbon, scattered.
  // Cold winter sky behind the dancers.
  gs.fillStyle(0xffffff, 0.85);
  gs.fillRect(4, 1, 1, 1);
  gs.fillStyle(0xeaf4ff, 0.7);
  gs.fillRect(13, 0, 1, 1);
  gs.fillStyle(0xffffff, 0.9);
  gs.fillRect(22, 1, 1, 1);
  gs.fillStyle(0xddeeff, 0.6);
  gs.fillRect(30, 0, 1, 1);
  gs.fillStyle(0xffffff, 0.8);
  gs.fillRect(38, 1, 1, 1);
  gs.fillStyle(0xeaf4ff, 0.65);
  gs.fillRect(44, 0, 1, 1);

  gs.generateTexture('fx_aurora_band', w, h);
  gs.destroy();
}

/**
 * `fx_ember_spark` — small sputtering ember particle. Hot-orange core
 * with a brighter white-yellow flicker centre and a faint smoke trail
 * curling up. Used by lava overlays + Burns Night fire moments + future
 * boss enrage sparks. Compact 12×16 so it reads as a single hot pixel
 * mote at gameplay scale.
 */
export function bakeFxEmberSpark(scene: Phaser.Scene): void {
  const w = 12;
  const h = 16;
  const gs = scene.add.graphics();
  const cx = w / 2;
  const cy = 11;

  // Outer warm halo (wide low-alpha orange glow)
  gs.fillStyle(0xff5a08, 0.22);
  gs.fillCircle(cx, cy, 5);
  gs.fillStyle(0xff8a20, 0.32);
  gs.fillCircle(cx, cy, 3.5);

  // Ember body — three-layer hot core
  gs.fillStyle(0xc41818, 1);
  gs.fillCircle(cx, cy, 2.2);
  gs.fillStyle(0xff5a08, 1);
  gs.fillCircle(cx, cy, 1.6);
  gs.fillStyle(0xffba40, 1);
  gs.fillCircle(cx, cy - 0.3, 1.0);

  // White-hot flicker centre
  gs.fillStyle(0xfff0c0, 1);
  gs.fillCircle(cx, cy - 0.3, 0.5);
  gs.fillStyle(0xffffff, 1);
  gs.fillCircle(cx - 0.2, cy - 0.5, 0.25);

  // Sputter pip — single asymmetric flare-out
  gs.fillStyle(0xffba40, 0.85);
  gs.fillCircle(cx + 1.6, cy - 1, 0.4);

  // Smoke trail curling upward (3 fading wisps)
  gs.fillStyle(0x6a4838, 0.4);
  gs.fillCircle(cx + 0.5, cy - 4, 1.4);
  gs.fillStyle(0x5a3828, 0.32);
  gs.fillCircle(cx - 0.3, cy - 6, 1.1);
  gs.fillStyle(0x4a2818, 0.22);
  gs.fillCircle(cx + 0.4, cy - 8, 0.85);

  gs.generateTexture('fx_ember_spark', w, h);
  gs.destroy();
}

/**
 * `fx_haar_drift_wisp` — a single elongated tendril of haar fog drifting
 * sideways. Pale blue-grey core with a brighter pearl centre band and
 * soft alpha falloff at the ends. Used for ambient Haar Wraith presence
 * and as a layered weather particle for coastal/winter overlays.
 * 32×10 so the tendril reads as a long horizontal smear, not a puff.
 */
export function bakeFxHaarDriftWisp(scene: Phaser.Scene): void {
  const w = 32;
  const h = 10;
  const gs = scene.add.graphics();
  const cy = h / 2;

  // Outer tendril halo — a soft elongated pale band, low alpha throughout.
  // Slightly brighter in the middle so the wisp tapers naturally at ends.
  for (let x = 0; x < w; x++) {
    // Distance from centre 0..1 (highest in middle, 0 at ends)
    const t = 1 - Math.abs(x - w / 2) / (w / 2);
    const a = 0.06 + t * 0.18;
    gs.fillStyle(0x88a4b8, a);
    gs.fillRect(x, cy - 4, 1, 8);
  }

  // Mid body — pale-cyan core, narrower band
  for (let x = 2; x < w - 2; x++) {
    const t = 1 - Math.abs(x - w / 2) / (w / 2 - 2);
    const a = 0.18 + t * 0.32;
    gs.fillStyle(0xc4dee4, a);
    gs.fillRect(x, cy - 2, 1, 4);
  }

  // Bright pearl spine — brightest pinch in the centre, fades to ends
  for (let x = 6; x < w - 6; x++) {
    const t = 1 - Math.abs(x - w / 2) / (w / 2 - 6);
    const a = 0.35 + t * 0.5;
    gs.fillStyle(0xeaf2f8, a);
    gs.fillRect(x, cy - 0.6, 1, 1.2);
  }

  // White-hot centre highlight (very narrow, brightest specular)
  gs.fillStyle(0xffffff, 0.85);
  gs.fillRect(w / 2 - 2, cy - 0.4, 4, 0.8);
  gs.fillStyle(0xffffff, 1);
  gs.fillRect(w / 2 - 0.5, cy - 0.3, 1, 0.6);

  // Trailing droplet pips — three tiny pale dots at the trailing edge
  // so the wisp looks like it's shedding moisture
  gs.fillStyle(0xeaf2f8, 0.7);
  gs.fillCircle(4, cy + 1, 0.5);
  gs.fillCircle(8, cy - 1, 0.4);
  gs.fillCircle(11, cy + 1.5, 0.35);

  gs.generateTexture('fx_haar_drift_wisp', w, h);
  gs.destroy();
}

/**
 * `fx_lambing_mote` — Imbolc's signature ambient particle. A soft warm
 * gold mote with a snowdrop-pale halo that drifts gently UPWARD —
 * Brigid's first-of-spring breath rising from the byre. Tonal palette
 * anchor: Hearth (warm-ivory + cream-gold) per ART_STYLE_BIBLE.md.
 * Compact 8×8 so a screenful of motes reads as a soft wash, not a
 * snowfall.
 */
export function bakeFxLambingMote(scene: Phaser.Scene): void {
  const size = 8;
  const cx = size / 2;
  const cy = size / 2;
  const gs = scene.add.graphics();

  // Outer pale-cream halo — Brigid's mantle warmth.
  gs.fillStyle(0xf5e7b8, 0.18);
  gs.fillCircle(cx, cy, 3.5);
  gs.fillStyle(0xfaf0d0, 0.28);
  gs.fillCircle(cx, cy, 2.5);

  // Mid warm-gold body.
  gs.fillStyle(0xeed490, 0.65);
  gs.fillCircle(cx, cy, 1.6);

  // Bright cream-white core (catches light).
  gs.fillStyle(0xfffbe8, 0.95);
  gs.fillCircle(cx, cy - 0.2, 0.9);
  gs.fillStyle(0xffffff, 1);
  gs.fillCircle(cx - 0.2, cy - 0.4, 0.4);

  gs.generateTexture('fx_lambing_mote', size, size);
  gs.destroy();
}

/**
 * `fx_bracken_leaf` — Bracken-turn's autumn copper leaf, drifting
 * slowly down across the moor in November. Compact 10×10 leaf with
 * an angled diamond silhouette, three-tone copper-bronze gradient
 * (deep rust → mid copper → bright cream-gold along the central
 * vein), and a soft outer glow that catches low autumn light.
 *
 * Tonal palette: Hearth + Wild (warm copper + bronze + rust) per
 * ART_STYLE_BIBLE.md — the moor wearing its copper coat.
 */
export function bakeFxBrackenLeaf(scene: Phaser.Scene): void {
  const w = 10;
  const h = 10;
  const cx = w / 2;
  const cy = h / 2;
  const gs = scene.add.graphics();

  // Outer warm-rust halo — soft glow that reads at distance even
  // when the leaf itself is dimmed by the AmbientWeatherSystem alpha.
  gs.fillStyle(0xa05028, 0.18);
  gs.fillCircle(cx, cy, 5);

  // Leaf body — angled diamond drawn as four triangles. Outer edge
  // is the deepest rust, inner is bright copper, central spine is
  // a thin cream-gold highlight.
  // Outer rust diamond.
  gs.fillStyle(0x8a4020, 1);
  gs.fillTriangle(cx, 1, cx - 3.5, cy, cx, h - 1);
  gs.fillTriangle(cx, 1, cx + 3.5, cy, cx, h - 1);

  // Mid copper layer (slightly inset).
  gs.fillStyle(0xc06030, 1);
  gs.fillTriangle(cx, 2, cx - 2.5, cy, cx, h - 2);
  gs.fillTriangle(cx, 2, cx + 2.5, cy, cx, h - 2);

  // Bright bronze inner.
  gs.fillStyle(0xe08838, 1);
  gs.fillTriangle(cx, 3, cx - 1.5, cy, cx, h - 3);
  gs.fillTriangle(cx, 3, cx + 1.5, cy, cx, h - 3);

  // Central vein — thin cream-gold streak head-to-tail.
  gs.fillStyle(0xf2cc80, 0.9);
  gs.fillRect(cx - 0.4, 2, 0.8, h - 4);
  gs.fillStyle(0xfff0c8, 0.85);
  gs.fillRect(cx - 0.2, 2.5, 0.4, h - 5);

  // Tiny dark stem at the top — a ground anchor for the silhouette.
  gs.fillStyle(0x2a1408, 1);
  gs.fillRect(cx - 0.4, 0.5, 0.8, 1.2);

  gs.generateTexture('fx_bracken_leaf', w, h);
  gs.destroy();
}

/**
 * `fx_stonehaven_fireball` — Hogmanay's Aberdeenshire fireball
 * procession (since 1908). A swinging fire-orb on a chain: dark
 * outer halo, bright orange-red core, white-hot centre, with three
 * tail-spark wisps trailing the swing arc.
 *
 * Tonal palette: Wild + Hearth (ember-orange + warm-white) per
 * ART_STYLE_BIBLE.md — the procession is communal warmth defying
 * the long midwinter dark.
 *
 * Square 16×16 so the rotation tween in AmbientWeatherSystem reads
 * as a clean spin without clipping at the corners.
 */
export function bakeFxStonehavenFireball(scene: Phaser.Scene): void {
  const size = 16;
  const cx = size / 2;
  const cy = size / 2;
  const gs = scene.add.graphics();

  // Outer warm-orange halo (catches the procession crowd's torchlight).
  gs.fillStyle(0xff5a08, 0.18);
  gs.fillCircle(cx, cy, 7);
  gs.fillStyle(0xff7a18, 0.32);
  gs.fillCircle(cx, cy, 5);

  // Mid ember body — three-layer hot core.
  gs.fillStyle(0xc41818, 1);
  gs.fillCircle(cx, cy, 3.6);
  gs.fillStyle(0xff6a14, 1);
  gs.fillCircle(cx, cy, 2.6);
  gs.fillStyle(0xffba40, 1);
  gs.fillCircle(cx - 0.3, cy - 0.5, 1.6);

  // White-hot inner flicker.
  gs.fillStyle(0xfff0c8, 1);
  gs.fillCircle(cx - 0.4, cy - 0.7, 0.9);
  gs.fillStyle(0xffffff, 1);
  gs.fillCircle(cx - 0.6, cy - 0.9, 0.4);

  // Trailing tail-sparks — three small dots curling away from the
  // swing direction. Asymmetric placement sells the chain pull.
  gs.fillStyle(0xffba40, 0.85);
  gs.fillCircle(cx + 3.2, cy + 1.2, 0.6);
  gs.fillStyle(0xff7a18, 0.65);
  gs.fillCircle(cx + 4.6, cy + 2.2, 0.4);
  gs.fillStyle(0xc41818, 0.45);
  gs.fillCircle(cx + 5.6, cy + 3.0, 0.3);

  gs.generateTexture('fx_stonehaven_fireball', size, size);
  gs.destroy();
}

/**
 * `fx_harvest_sheaf` — Lammas's signature ambient particle. A small
 * tan-amber wheat-grain wisp drifting sideways across the moor — chaff
 * loosed by the first reaping at the cairn. Tonal palette anchor:
 * Hearth (warm-grain amber + harvest-bronze) per ART_STYLE_BIBLE.md.
 * 14×6 so the wisp reads as a wind-borne sliver, not a clump.
 */
export function bakeFxHarvestSheaf(scene: Phaser.Scene): void {
  const w = 14;
  const h = 6;
  const cy = h / 2;
  const gs = scene.add.graphics();

  // Outer warm-amber halo — wind-haze around the grain.
  gs.fillStyle(0xc89060, 0.22);
  gs.fillRect(0, cy - 0.8, w, 1.6);

  // Body of the grain — three amber bands shading bronze→gold→cream.
  gs.fillStyle(0xa67040, 0.5);
  gs.fillRect(2, cy - 0.6, w - 4, 1.2);
  gs.fillStyle(0xd4a040, 0.7);
  gs.fillRect(3, cy - 0.5, w - 6, 1);
  gs.fillStyle(0xf2cc70, 0.85);
  gs.fillRect(4, cy - 0.4, w - 8, 0.8);

  // Bright cream tip — front of the wisp catches the light.
  gs.fillStyle(0xfff0c8, 0.95);
  gs.fillRect(w - 5, cy - 0.4, 2, 0.8);
  gs.fillStyle(0xffffff, 1);
  gs.fillRect(w - 3, cy - 0.3, 1, 0.6);

  // Trailing chaff pips — two small dots fading off the back.
  gs.fillStyle(0xc89060, 0.55);
  gs.fillCircle(2, cy + 0.5, 0.4);
  gs.fillStyle(0xa67040, 0.4);
  gs.fillCircle(0.6, cy - 0.5, 0.3);

  gs.generateTexture('fx_harvest_sheaf', w, h);
  gs.destroy();
}

/**
 * `fx_bannockburn_dust` — Wild Living World Phase 2.
 *
 * Bannockburn anniversary (24 June, 1314) seasonal event particle.
 * Reads as battlefield-dust kicked up from a packed haugh: muted ochre,
 * cool-iron undertones from blade and bridle, no sparkle. Tonal palette:
 * Grave (history-cosy, see ART_STYLE_BIBLE.md `Grave` register). Slow
 * horizontal drift, low alpha so the moor reads as "the air remembers"
 * rather than gameplay-relevant haze.
 *
 * Visually distinct from `fx_harvest_sheaf` (amber-cream chaff, fast)
 * by being cooler / muddier / drifting horizontally with a slight
 * downward bias rather than sideways.
 *
 * 14×7 — wider than tall so the mote reads as drifting dust band, not
 * a pebble. Mid-alpha throughout so screen never feels obscured.
 */
export function bakeFxBannockburnDust(scene: Phaser.Scene): void {
  const w = 14;
  const h = 7;
  const cy = h / 2;
  const gs = scene.add.graphics();

  // Outer grit halo — muddy ochre, very low alpha.
  gs.fillStyle(0x8a7048, 0.18);
  gs.fillRect(0, cy - 1.4, w, 2.8);
  // Mid body — warmer mid-tone ochre band.
  gs.fillStyle(0xa68858, 0.36);
  gs.fillRect(2, cy - 0.9, w - 4, 1.8);
  // Highlight band — pale ivory streak suggesting sun catching motes.
  gs.fillStyle(0xd8c098, 0.55);
  gs.fillRect(4, cy - 0.5, w - 8, 1);

  // Cool-iron undertone pips — two small grey-blue specks reading as
  // ash or bridle dust mixed into the drift. Sit asymmetrically so
  // the wisp doesn't pattern-tile when several spawn near each other.
  gs.fillStyle(0x5a6470, 0.55);
  gs.fillCircle(3, cy - 1.2, 0.45);
  gs.fillStyle(0x484e58, 0.65);
  gs.fillCircle(w - 4, cy + 1.1, 0.4);

  // Bright tip — front of the drift catches sun. Subtle, not bright.
  gs.fillStyle(0xffe6b8, 0.7);
  gs.fillRect(w - 4, cy - 0.3, 1.6, 0.6);

  gs.generateTexture('fx_bannockburn_dust', w, h);
  gs.destroy();
}

/**
 * `fx_grouse_feather` — Wild Living World Phase 2.
 *
 * Glorious Twelfth (12 August, grouse shooting opener) seasonal event
 * particle. A single fleck of grouse feather drifting on the moor wind:
 * russet body with the canonical white quill stripe and the dark
 * eye-spot near the base. Tonal palette: Wild (heather-tone, see
 * ART_STYLE_BIBLE.md `Wild` register). Per particle the feather
 * tumbles slowly as it falls — the parent system handles rotation.
 *
 * Visually distinct from `fx_bracken_leaf` (copper-bronze, larger,
 * paler) by being smaller, russet-and-white striped, with a single
 * dark eye-spot that reads at glance as "feather not leaf".
 *
 * 9×11 — taller than wide so the silhouette reads as a quill.
 */
export function bakeFxGrouseFeather(scene: Phaser.Scene): void {
  const w = 9;
  const h = 11;
  const cx = w / 2;
  const gs = scene.add.graphics();

  // Soft russet halo around the whole feather — keeps it readable
  // against any biome tint.
  gs.fillStyle(0x6e3018, 0.22);
  gs.fillEllipse(cx, h * 0.55, w - 1, h - 2);

  // Body — russet teardrop. Built from stacked ellipses for organic
  // silhouette.
  gs.fillStyle(0x8a4220, 0.85);
  gs.fillEllipse(cx, h * 0.55, w - 2, h - 3);
  gs.fillStyle(0xa85a30, 1);
  gs.fillEllipse(cx, h * 0.55 - 0.4, w - 3.5, h - 5);
  gs.fillStyle(0xc47648, 1);
  gs.fillEllipse(cx, h * 0.5, w - 5, h - 7);

  // Central quill — pale cream stripe down the middle.
  gs.fillStyle(0xece0c0, 1);
  gs.fillRect(cx - 0.3, 1, 0.6, h - 2);
  gs.fillStyle(0xffffff, 0.85);
  gs.fillRect(cx - 0.15, 2, 0.3, h - 4);

  // Dark eye-spot near the base — the canonical grouse-feather tell.
  gs.fillStyle(0x1f0e08, 1);
  gs.fillCircle(cx, h - 2.4, 0.85);
  gs.fillStyle(0x0a0604, 1);
  gs.fillCircle(cx, h - 2.4, 0.4);

  // Wisp at the tip — three tiny barbs fading toward the top.
  gs.fillStyle(0xc47648, 0.7);
  gs.fillRect(cx - 1.4, 0.6, 0.8, 0.5);
  gs.fillRect(cx + 0.6, 0.6, 0.8, 0.5);
  gs.fillStyle(0x8a4220, 0.55);
  gs.fillRect(cx - 0.5, 0, 1, 0.6);

  gs.generateTexture('fx_grouse_feather', w, h);
  gs.destroy();
}

/**
 * `fx_tartan_thread` — Tartan Day (Apr 4–8) ambient particle.
 *
 * A single strand of woven cloth caught on the moor wind — saltire-navy
 * base, white central stripe (the Declaration's thread), and a thin red
 * accent that keys most Scottish tartans. 14×6 so the strand reads as a
 * horizontal wisp, not a pebble; the AmbientWeatherSystem applies a
 * random ±10° angle per particle so each thread tumbles independently.
 *
 * Tonal palette: Hearth (diaspora warmth — the moor reaches further).
 * Low peak-alpha so the overlay reads as cloth-on-the-wind, not
 * gameplay-relevant haze. Visually distinct from harvest-drift
 * (amber-cream, fast horizontal) by the cooler navy + white palette
 * and the thread-end dots at each terminus.
 *
 * Refs: SCOTTISH_RESEARCH_DEEP.md §12 (tartan history + diaspora);
 * DESIGN_IDEAS.md §2 seasonal event catalogue.
 */
export function bakeFxTartanThread(scene: Phaser.Scene): void {
  const w = 14;
  const h = 6;
  const cy = h / 2;
  const gs = scene.add.graphics();

  // Outer navy halo — binds the strand so it reads against any biome tint.
  gs.fillStyle(0x4488cc, 0.08);
  gs.fillRect(0, 0, w, h);

  // Thread body — St Andrew's blue. The main ground-colour of most
  // Blue Scots tartans; saltire reference.
  gs.fillStyle(0x003380, 0.5);
  gs.fillRect(1, cy - 1, w - 2, 2);
  gs.fillStyle(0x1a4eaa, 0.7);
  gs.fillRect(2, cy - 0.7, w - 4, 1.4);

  // Red accent bands at the thread edges — the cross-key thread in
  // most Scottish district tartans. Thin so the saltire-blue reads first.
  gs.fillStyle(0xcc2222, 0.55);
  gs.fillRect(1, cy - 1.1, w - 2, 0.35);
  gs.fillStyle(0xdd3333, 0.45);
  gs.fillRect(1, cy + 0.75, w - 2, 0.35);

  // Central white stripe — the Declaration of Arbroath's pale thread.
  // Independence woven in, not declared.
  gs.fillStyle(0xe0ecff, 0.82);
  gs.fillRect(3, cy - 0.35, w - 6, 0.7);
  gs.fillStyle(0xffffff, 0.92);
  gs.fillRect(4, cy - 0.25, w - 8, 0.5);

  // Thread-end pips — small navy blobs at each terminus suggest a cut
  // strand rather than a printed line; the thread reads as textile, not mark.
  gs.fillStyle(0x0026aa, 0.75);
  gs.fillCircle(1.4, cy, 1.1);
  gs.fillCircle(w - 1.4, cy, 0.9);

  gs.generateTexture('fx_tartan_thread', w, h);
  gs.destroy();
}

/**
 * `fx_simmer_dim_gloam` — Simmer Dim (Jun 18–21) ambient particle.
 *
 * The star the Shetland gloaming holds — pale lilac-gold mote that
 * drifts barely upward and fades so slowly the player isn't sure if
 * it was ever there. Simmer dim is the perpetual midsummer twilight
 * that never darkens past blue-hour: neither full day nor full dark.
 *
 * 8×8 circular. Palette: lilac outer (#c8b8e8) → ivory mid (#f8f0e0)
 * → bright-star core (#fffff8). Very low peak alpha (0.30–0.48) — the
 * gloam is a quality of light, not a particle storm. Long-lived (6–9 s)
 * so even the sparse 4000 ms spawn cadence reads as continuous shimmer.
 *
 * Tonal register: Hearth-edge (the gloaming is warm but edged with the
 * uncanny — you could walk in this light forever). Visually distinct
 * from lambing motes (spring gold, rising fast) by the lilac cast and
 * the near-stillness of each mote's travel.
 *
 * Refs: SCOTTISH_RESEARCH_DEEP.md §14.6 (Shetland simmer dim);
 * DESIGN_IDEAS.md §2 seasonal event catalogue.
 */
export function bakeFxSimmerDimGloam(scene: Phaser.Scene): void {
  const size = 8;
  const cx = size / 2;
  const cy = size / 2;
  const gs = scene.add.graphics();

  // Outer gloaming halo — pale lilac. The twilight that Shetland keeps
  // from June solstice to the last sliver of night; the colour between
  // day-gold and true-dark.
  gs.fillStyle(0xc8b8e8, 0.14);
  gs.fillCircle(cx, cy, 3.8);

  // Mid band — warm cream + lilac tinge. The sky where day and gloam
  // overlap: neither gold nor purple, both at once.
  gs.fillStyle(0xe8dff0, 0.25);
  gs.fillCircle(cx, cy, 2.6);

  // Inner warm-ivory body. Hearth warmth that endures in the long light.
  gs.fillStyle(0xf8f0e0, 0.55);
  gs.fillCircle(cx, cy, 1.6);

  // Star-bright core — the gloam-star that the eye catches just before
  // it decides the sky is still too light for stars.
  gs.fillStyle(0xfffff8, 0.88);
  gs.fillCircle(cx - 0.2, cy - 0.2, 0.7);
  gs.fillStyle(0xffffff, 1);
  gs.fillCircle(cx - 0.3, cy - 0.3, 0.3);

  gs.generateTexture('fx_simmer_dim_gloam', size, size);
  gs.destroy();
}
