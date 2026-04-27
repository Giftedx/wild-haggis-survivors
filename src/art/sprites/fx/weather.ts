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
