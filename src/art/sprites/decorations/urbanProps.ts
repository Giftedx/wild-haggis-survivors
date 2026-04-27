/**
 * Urban-prop decoration kit for the Glasgow / Close biome — five
 * single-frame sprites that read "Glesga street, no pure satire" the
 * second they hit the floor: chippy neon, bus-stop pole with route 62,
 * crumpled chip-wrap newsprint, tenement close door, scaffold post.
 * Palette pulls Wild Comedy from the Art Style Bible (sodium amber
 * `0xff9030`, wet-pavement grey, Scots-red `0xc42828`, Buckfast green
 * for accents) and every prop ships a weather/wear cue + a specific
 * cultural anchor + an asymmetry so silhouettes don't read as boxy
 * generic dressing. Tone: Still Game warmth, never slapstick.
 */

import * as Phaser from 'phaser';

export function bakeChippySign(scene: Phaser.Scene): void {
  const w = 24, h = 28;
  const g = scene.add.graphics();
  const cx = 12;

  // Layered ground shadow under the wall mount.
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(cx, 27, 18, 2.5);
  g.fillStyle(0x000000, 0.32);
  g.fillEllipse(cx, 26.5, 12, 1.6);

  // Wall-mount bracket — L-iron arm bolted to the wall.
  g.fillStyle(0x2a2a30, 1);
  g.fillRect(cx - 1.5, 22, 3, 4);
  g.fillStyle(0x4a4a50, 1);
  g.fillRect(cx - 1.5, 22, 1, 4);
  g.fillStyle(0x6a6068, 1);
  g.fillCircle(cx - 0.5, 23, 0.5);
  g.fillCircle(cx - 0.5, 25, 0.5);

  // Sign box — cream enamel face with deep dark frame.
  g.fillStyle(0x1a1a1e, 1);
  g.fillRect(2, 5, 20, 18);
  g.fillStyle(0xf4ecd4, 1);
  g.fillRect(3, 6, 18, 16);

  // Sodium-amber flickering fluorescent strip across the top — the
  // Wild Comedy palette anchor. Two-tone gradient (warm centre, cooler
  // ends) sells the "tube about to die" cue.
  g.fillStyle(0xff9030, 1);
  g.fillRect(3, 4, 18, 2);
  g.fillStyle(0xffd070, 1);
  g.fillRect(7, 4, 10, 1);
  g.fillStyle(0xfff4c0, 1);
  g.fillRect(10, 4, 4, 0.7);
  // Dead end (asymmetric flicker — left tube end gone dim).
  g.fillStyle(0x6a4820, 1);
  g.fillRect(3, 4, 3, 1.4);
  // Tube housing brackets.
  g.fillStyle(0x2a2a30, 1);
  g.fillRect(2, 3.5, 1.5, 2.5);
  g.fillRect(20.5, 3.5, 1.5, 2.5);

  // "CHIPPY" in red block letters — chunky condensed.
  g.fillStyle(0xc42828, 1);
  // C
  g.fillRect(4, 8, 2, 4);
  g.fillRect(4, 8, 3, 1);
  g.fillRect(4, 11, 3, 1);
  // H
  g.fillRect(8, 8, 1, 4);
  g.fillRect(10, 8, 1, 4);
  g.fillRect(8, 9.5, 3, 1);
  // I
  g.fillRect(12, 8, 1, 4);
  // P
  g.fillRect(14, 8, 1, 4);
  g.fillRect(14, 8, 2.5, 1);
  g.fillRect(14, 9.5, 2.5, 1);
  g.fillRect(16, 8, 1, 1.5);
  // P
  g.fillRect(18, 8, 1, 4);
  g.fillRect(18, 8, 2.5, 1);
  g.fillRect(18, 9.5, 2.5, 1);
  g.fillRect(20, 8, 1, 1.5);
  // Lettering highlight (top-row warm rim).
  g.fillStyle(0xff5a4a, 0.85);
  g.fillRect(4, 8, 17, 0.4);

  // FISH SUPPER stripe — red band with white dashes for letters.
  g.fillStyle(0xc42828, 1);
  g.fillRect(3, 13.5, 18, 3);
  g.fillStyle(0xff5a4a, 0.7);
  g.fillRect(3, 13.5, 18, 0.6);
  // White letter dashes.
  g.fillStyle(0xfaf4e8, 0.95);
  // FISH
  g.fillRect(4, 14.5, 1.2, 0.6);
  g.fillRect(5.6, 14.5, 0.8, 0.6);
  g.fillRect(6.8, 14.5, 1.2, 0.6);
  g.fillRect(8.4, 14.5, 1, 0.6);
  // SUPPER
  g.fillRect(10.5, 14.5, 1.2, 0.6);
  g.fillRect(12.1, 14.5, 1, 0.6);
  g.fillRect(13.5, 14.5, 1.2, 0.6);
  g.fillRect(15.1, 14.5, 1, 0.6);
  g.fillRect(16.5, 14.5, 1.2, 0.6);
  g.fillRect(18.1, 14.5, 1, 0.6);
  // Underline shadow.
  g.fillStyle(0x7a1414, 1);
  g.fillRect(3, 16, 18, 0.5);

  // Fish silhouette icon — wee curved body bottom-left.
  g.fillStyle(0x3a4a58, 1);
  g.fillEllipse(7, 19, 6, 2.8);
  g.fillTriangle(4.2, 19, 3, 17.8, 3, 20.2);
  g.fillStyle(0x6a8090, 1);
  g.fillEllipse(7, 18.5, 5, 1.4);
  // Fish eye.
  g.fillStyle(0xfaf4e8, 1);
  g.fillCircle(8.5, 18.7, 0.4);
  g.fillStyle(0x000000, 1);
  g.fillCircle(8.5, 18.7, 0.2);

  // Chip-pile icon bottom-right — three golden batons.
  g.fillStyle(0xd49028, 1);
  g.fillRect(14, 18, 1.2, 3);
  g.fillRect(15.5, 17.5, 1.2, 3.4);
  g.fillRect(17, 18.2, 1.2, 2.7);
  g.fillStyle(0xffc868, 0.85);
  g.fillRect(14, 18, 0.4, 3);
  g.fillRect(15.5, 17.5, 0.4, 3.4);
  g.fillRect(17, 18.2, 0.4, 2.7);
  // Chip browned ends.
  g.fillStyle(0x8a5818, 1);
  g.fillRect(14, 20.6, 1.2, 0.5);
  g.fillRect(15.5, 20.5, 1.2, 0.4);
  g.fillRect(17, 20.5, 1.2, 0.4);

  // Weather wear — soot streak on top frame from the fluorescent
  // tube heat + grease drip down right side. Asymmetric.
  g.fillStyle(0x2a2018, 0.55);
  g.fillRect(4, 6, 14, 0.6);
  g.fillStyle(0x6a4828, 0.5);
  g.fillRect(20.4, 7, 0.6, 8);
  g.fillRect(20.5, 12, 0.5, 4);
  // Rain stain dribble bottom edge.
  g.fillStyle(0x4a4040, 0.4);
  g.fillRect(4, 21.6, 16, 0.4);

  g.generateTexture('deco_chippy_sign', w, h);
  g.destroy();
}

export function bakeBusStopPole(scene: Phaser.Scene): void {
  const w = 16, h = 40;
  const g = scene.add.graphics();
  const cx = 8;

  // Wet-pavement puddle splash at base — Wild Comedy wet-grey + a
  // sodium-amber reflection lick.
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(cx, 38, 14, 3);
  g.fillStyle(0x4a525a, 0.6);
  g.fillEllipse(cx + 1, 37.5, 10, 2.2);
  g.fillStyle(0x7a8088, 0.55);
  g.fillEllipse(cx + 1.5, 37, 7, 1.4);
  // Amber streetlight reflection in the puddle.
  g.fillStyle(0xff9030, 0.4);
  g.fillRect(cx + 2, 37.2, 4, 0.6);
  g.fillStyle(0xffd070, 0.5);
  g.fillRect(cx + 3, 37.1, 2, 0.4);

  // Concrete base shoe — square slab anchoring the pole.
  g.fillStyle(0x3a3a3e, 1);
  g.fillRect(cx - 3, 34, 6, 3);
  g.fillStyle(0x6a6a70, 1);
  g.fillRect(cx - 3, 34, 6, 1);
  g.fillStyle(0x8a8a90, 1);
  g.fillRect(cx - 3, 34, 5, 0.4);
  // Crack on the slab — wear cue.
  g.fillStyle(0x1a1a1e, 0.7);
  g.fillRect(cx - 1, 35, 0.4, 2);
  g.fillRect(cx - 0.6, 36, 0.3, 1);

  // Pole — tall grey upright (pixel column with highlight).
  g.fillStyle(0x4a4a50, 1);
  g.fillRect(cx - 1.2, 4, 2.4, 30);
  g.fillStyle(0x7a7a82, 1);
  g.fillRect(cx - 1.2, 4, 0.8, 30);
  g.fillStyle(0xa0a0a8, 0.7);
  g.fillRect(cx - 1.2, 4, 0.4, 28);
  // Right-side dark shadow line.
  g.fillStyle(0x2a2a30, 1);
  g.fillRect(cx + 1, 4, 0.4, 30);
  // Rust patches on the lower section — wear cue, asymmetric.
  g.fillStyle(0x8a4818, 0.7);
  g.fillRect(cx - 1.2, 24, 2.4, 0.6);
  g.fillRect(cx - 1, 28, 1.6, 0.5);
  g.fillStyle(0x5a2810, 0.55);
  g.fillRect(cx + 0.4, 24, 1, 0.6);
  g.fillRect(cx - 0.8, 28.4, 1, 0.4);

  // Timetable box halfway up — wee black-framed yellow rectangle
  // with horizontal time lines. Asymmetric (juts left only).
  g.fillStyle(0x1a1a1e, 1);
  g.fillRect(cx - 5.5, 17, 4.5, 5);
  g.fillStyle(0xf4d860, 1);
  g.fillRect(cx - 5, 17.5, 3.5, 4);
  // Time-stripe lines.
  g.fillStyle(0x4a3a18, 0.85);
  g.fillRect(cx - 4.7, 18.2, 3, 0.4);
  g.fillRect(cx - 4.7, 19.1, 2.5, 0.4);
  g.fillRect(cx - 4.7, 20, 2.8, 0.4);
  g.fillRect(cx - 4.7, 20.9, 2.2, 0.4);
  // Mounting bolt to pole.
  g.fillStyle(0x6a6068, 1);
  g.fillCircle(cx - 1.5, 19.5, 0.4);

  // Top sign — Scots-red rectangle, the iconic shape.
  g.fillStyle(0x000000, 0.5);
  g.fillRect(cx - 5.5, 4.5, 12, 8);
  g.fillStyle(0xc42828, 1);
  g.fillRect(cx - 5, 4, 11, 8);
  g.fillStyle(0xe04848, 1);
  g.fillRect(cx - 5, 4, 11, 1);
  g.fillStyle(0x7a1414, 1);
  g.fillRect(cx - 5, 11.5, 11, 0.5);
  // Sign mounting tab to pole.
  g.fillStyle(0x4a4a50, 1);
  g.fillRect(cx - 1.2, 11.8, 2.4, 1.5);

  // Route number "62" in white block letters — the cultural anchor.
  g.fillStyle(0xfaf4e8, 1);
  // 6
  g.fillRect(cx - 3.5, 6, 1, 5);
  g.fillRect(cx - 3.5, 6, 3, 1);
  g.fillRect(cx - 3.5, 8, 3, 1);
  g.fillRect(cx - 3.5, 10, 3, 1);
  g.fillRect(cx - 1.5, 8, 1, 3);
  // 2
  g.fillRect(cx + 1, 6, 3, 1);
  g.fillRect(cx + 3, 6, 1, 3);
  g.fillRect(cx + 1, 8, 3, 1);
  g.fillRect(cx + 1, 8, 1, 3);
  g.fillRect(cx + 1, 10, 3, 1);
  // Letter highlight (top edge bright).
  g.fillStyle(0xffffff, 0.7);
  g.fillRect(cx - 3.5, 6, 3, 0.4);
  g.fillRect(cx + 1, 6, 3, 0.4);

  // Soot grime on the sign edges (rain-down streaks).
  g.fillStyle(0x2a1a18, 0.45);
  g.fillRect(cx - 5, 11, 11, 0.6);
  g.fillRect(cx + 5, 5, 0.4, 7);

  g.generateTexture('deco_bus_stop', w, h);
  g.destroy();
}

export function bakeNewsprint(scene: Phaser.Scene): void {
  const w = 22, h = 16;
  const g = scene.add.graphics();

  // Layered ground shadow — paper has very little height.
  g.fillStyle(0x000000, 0.16);
  g.fillEllipse(11, 14, 18, 2);
  g.fillStyle(0x000000, 0.26);
  g.fillEllipse(11, 13.6, 14, 1.4);

  // Cream paper body — irregular crumpled outline (asymmetric, NOT
  // a clean rectangle). Built as overlapping fillRect quads.
  g.fillStyle(0xf0e4c4, 1);
  g.fillRect(2, 4, 18, 8);
  g.fillRect(3, 3, 14, 1);
  g.fillRect(5, 12, 13, 1);
  // Wee torn corner top-right (asymmetry break).
  g.fillStyle(0xf0e4c4, 1);
  g.fillTriangle(20, 4, 17, 3, 20, 7);
  // Bottom-left fold flap.
  g.fillTriangle(2, 12, 5, 13, 2, 10);
  // Paper darker shadow side (right).
  g.fillStyle(0xd4c898, 0.85);
  g.fillRect(15, 5, 5, 7);
  g.fillRect(17, 4, 3, 8);
  // Crumple ridge — diagonal fold-line catching light.
  g.fillStyle(0xfff4d8, 0.9);
  g.fillRect(4, 5, 6, 0.5);
  g.fillRect(8, 7, 6, 0.4);
  g.fillRect(11, 9, 5, 0.4);
  // Crumple shadow ridge (matches the highlight).
  g.fillStyle(0x9a8868, 0.6);
  g.fillRect(4, 5.6, 6, 0.4);
  g.fillRect(8, 7.5, 6, 0.4);
  g.fillRect(11, 9.5, 5, 0.4);

  // Faint horizontal newsprint columns — grey text lines (3 columns,
  // 4-5 lines each, varied lengths so it reads as type, not stripes).
  g.fillStyle(0x5a5450, 0.6);
  // Column 1.
  g.fillRect(3, 5.5, 4, 0.3);
  g.fillRect(3, 6.3, 3.5, 0.3);
  g.fillRect(3, 7.1, 4, 0.3);
  g.fillRect(3, 7.9, 3, 0.3);
  // Column 2 (heavier text).
  g.fillStyle(0x4a4440, 0.7);
  g.fillRect(8, 5.5, 4, 0.3);
  g.fillRect(8, 6.3, 4.5, 0.3);
  g.fillRect(8, 7.1, 3, 0.3);
  g.fillRect(8, 7.9, 4, 0.3);
  g.fillRect(8, 8.7, 3.5, 0.3);
  // Column 3 (broken by grease).
  g.fillStyle(0x5a5450, 0.5);
  g.fillRect(13, 5.5, 3.5, 0.3);
  g.fillRect(13, 6.3, 4, 0.3);
  // Headline-ish thicker bar top of column 2 (anchor — looks like
  // a real rag).
  g.fillStyle(0x2a2420, 0.8);
  g.fillRect(8, 4.7, 5, 0.5);

  // Grease blot — irregular yellow-translucent stain that DROWNS the
  // newsprint underneath (bottom-right). Weather/wear cue #1.
  g.fillStyle(0xc4a448, 0.45);
  g.fillEllipse(15, 9, 7, 5);
  g.fillStyle(0xb09038, 0.55);
  g.fillEllipse(15.5, 9.2, 5, 3.5);
  g.fillStyle(0xfff4a8, 0.35);
  g.fillEllipse(14, 8.3, 3, 1.5);

  // Vinegar stain — the cultural anchor. Darker brown irregular
  // splatter top-left. Vinegar on chip wrap = unmistakable Glesga
  // chippy. NOT subtle.
  g.fillStyle(0x6a3818, 0.55);
  g.fillEllipse(5, 6.5, 4, 2.5);
  g.fillStyle(0x8a4820, 0.45);
  g.fillEllipse(4.5, 6, 3, 1.6);
  g.fillStyle(0x4a2810, 0.7);
  g.fillCircle(3.5, 7.2, 0.7);
  g.fillCircle(6, 6.8, 0.5);
  // Splatter dots radiating out.
  g.fillStyle(0x6a3818, 0.5);
  g.fillCircle(7.5, 5.5, 0.4);
  g.fillCircle(2.5, 8.5, 0.3);

  // Chip flecks stuck to the paper — the second cultural anchor.
  // Three small browned chip remnants.
  g.fillStyle(0xd49028, 1);
  g.fillRect(9, 10, 1.6, 0.8);
  g.fillRect(11.5, 11, 1.4, 0.7);
  g.fillRect(6.5, 10.5, 1.2, 0.7);
  g.fillStyle(0xffc868, 0.85);
  g.fillRect(9, 10, 0.5, 0.8);
  g.fillRect(11.5, 11, 0.4, 0.7);
  // Browned chip ends.
  g.fillStyle(0x6a3810, 1);
  g.fillRect(10.4, 10, 0.6, 0.8);
  g.fillRect(12.7, 11, 0.4, 0.7);

  g.generateTexture('deco_newsprint', w, h);
  g.destroy();
}

export function bakeCloseDoor(scene: Phaser.Scene): void {
  const w = 16, h = 32;
  const g = scene.add.graphics();
  const cx = 8;

  // Worn step at the bottom — sandstone slab, the contact ground.
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, 31, 14, 2);
  g.fillStyle(0x6a4828, 1);
  g.fillRect(1, 28, 14, 4);
  g.fillStyle(0x8a6038, 1);
  g.fillRect(1, 28, 14, 1);
  g.fillStyle(0xa07848, 0.8);
  g.fillRect(2, 28, 12, 0.4);
  // Step wear-pattern — central worn dip from foot traffic. Wear cue.
  g.fillStyle(0x4a3018, 0.7);
  g.fillEllipse(cx, 30, 8, 1.4);
  g.fillStyle(0x2a1810, 0.6);
  g.fillRect(5, 30.4, 6, 0.5);

  // Red sandstone arch surround — the iconic Glasgow tenement red.
  // Outer arch frame.
  g.fillStyle(0x7a3018, 1);
  g.fillRect(0, 6, 16, 22);
  g.fillStyle(0x9a4020, 1);
  g.fillRect(1, 7, 14, 21);
  // Arch keystone-curve at top — chunky semi-circle sandstone.
  g.fillStyle(0x7a3018, 1);
  g.fillRect(0, 5, 16, 2);
  g.fillStyle(0x9a4020, 1);
  g.fillRect(2, 4, 12, 2);
  g.fillStyle(0xb05028, 1);
  g.fillRect(3, 3, 10, 1.5);
  // Sandstone block-line texture (horizontal seams).
  g.fillStyle(0x5a2010, 0.7);
  g.fillRect(1, 12, 14, 0.4);
  g.fillRect(1, 19, 14, 0.4);
  // Vertical block joins (asymmetric).
  g.fillStyle(0x5a2010, 0.5);
  g.fillRect(5, 7, 0.4, 5);
  g.fillRect(10, 12, 0.4, 7);
  g.fillRect(7, 19, 0.4, 9);
  // Highlight on left edge (sunlight grazing).
  g.fillStyle(0xc05838, 0.7);
  g.fillRect(1, 7, 0.5, 21);

  // Wee window panel above the door — the "fanlight" glass.
  g.fillStyle(0x1a2028, 1);
  g.fillRect(3, 8, 10, 4);
  g.fillStyle(0x3a4858, 1);
  g.fillRect(3.5, 8.5, 9, 3);
  // Window frame mullion (vertical bar in the middle).
  g.fillStyle(0x2a1810, 1);
  g.fillRect(7.7, 8, 0.6, 4);
  g.fillRect(3, 9.8, 10, 0.4);
  // Glass reflection — sodium-amber light catching the pane.
  g.fillStyle(0xff9030, 0.5);
  g.fillRect(4, 9, 3, 0.6);
  g.fillStyle(0xffd070, 0.45);
  g.fillRect(8.5, 10.4, 3, 0.5);

  // Smoke wisp drifting OUT of the window — the affectionate
  // cultural cue: someone inside on the fags. Soft grey curls.
  g.fillStyle(0xc8c0b8, 0.6);
  g.fillCircle(11, 7, 1);
  g.fillCircle(11.7, 6, 0.8);
  g.fillCircle(12.3, 5, 0.6);
  g.fillStyle(0xe8e0d4, 0.5);
  g.fillCircle(11, 7, 0.5);
  g.fillCircle(11.7, 6, 0.4);

  // Door — dark wood, recessed in the arch.
  g.fillStyle(0x1a1008, 1);
  g.fillRect(3, 13, 10, 15);
  g.fillStyle(0x3a2818, 1);
  g.fillRect(3.5, 13, 9, 15);
  g.fillStyle(0x5a3a20, 0.85);
  g.fillRect(3.5, 13, 0.6, 15);
  // Door panels — two stacked recessed rectangles.
  g.fillStyle(0x1a1008, 1);
  g.fillRect(4.5, 14.5, 7, 5);
  g.fillRect(4.5, 20.5, 7, 6);
  g.fillStyle(0x4a3220, 1);
  g.fillRect(5, 15, 6, 4);
  g.fillRect(5, 21, 6, 5);
  // Panel inner-shadow.
  g.fillStyle(0x6a4828, 0.7);
  g.fillRect(5, 15, 6, 0.5);
  g.fillRect(5, 21, 6, 0.5);

  // Brass numeral "23" — the cultural anchor.
  g.fillStyle(0x8a6810, 1);
  g.fillRect(5.5, 16.5, 5, 1.6);
  g.fillStyle(0xc8a020, 1);
  g.fillRect(5.5, 16.5, 5, 0.6);
  // 2 (two horizontal strokes hinted).
  g.fillStyle(0x4a3008, 1);
  g.fillRect(6, 17, 2, 0.4);
  // 3 (right side strokes hinted).
  g.fillRect(8.5, 17, 2, 0.4);

  // Brass door handle — wee orb halfway down.
  g.fillStyle(0x4a3008, 1);
  g.fillCircle(11, 22, 0.9);
  g.fillStyle(0xa88018, 1);
  g.fillCircle(11, 22, 0.7);
  g.fillStyle(0xffd860, 1);
  g.fillCircle(10.7, 21.7, 0.3);

  // Soot grime down the door (rain-stripe wear). Weather cue.
  g.fillStyle(0x2a1810, 0.4);
  g.fillRect(4, 15, 0.5, 12);
  g.fillRect(11, 14, 0.4, 13);

  g.generateTexture('deco_close_door', w, h);
  g.destroy();
}

export function bakeScaffoldPost(scene: Phaser.Scene): void {
  const w = 12, h = 40;
  const g = scene.add.graphics();
  const cx = 6;

  // Layered ground shadow.
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(cx, 38.5, 10, 2);
  g.fillStyle(0x000000, 0.3);
  g.fillEllipse(cx, 38, 7, 1.4);

  // Base plate — square steel foot, chunky.
  g.fillStyle(0x2a2a30, 1);
  g.fillRect(cx - 3.5, 35, 7, 3);
  g.fillStyle(0x5a5a62, 1);
  g.fillRect(cx - 3.5, 35, 7, 1);
  g.fillStyle(0x8a8a92, 0.85);
  g.fillRect(cx - 3.5, 35, 6, 0.4);
  // Plate bolt corners.
  g.fillStyle(0x6a6068, 1);
  g.fillCircle(cx - 2.5, 36.2, 0.4);
  g.fillCircle(cx + 2.5, 36.2, 0.4);
  // Plate chip wear (asymmetric).
  g.fillStyle(0x1a1a1e, 1);
  g.fillRect(cx + 2.8, 37.5, 0.7, 0.5);

  // Vertical pole — silver-grey scaffold tube. Pixel column with
  // highlight and shadow seams.
  g.fillStyle(0x4a4a52, 1);
  g.fillRect(cx - 1.6, 2, 3.2, 33);
  g.fillStyle(0x7a7a82, 1);
  g.fillRect(cx - 1.6, 2, 1, 33);
  g.fillStyle(0xa8a8b0, 0.7);
  g.fillRect(cx - 1.6, 2, 0.5, 31);
  // Right shadow edge.
  g.fillStyle(0x2a2a30, 1);
  g.fillRect(cx + 1.4, 2, 0.5, 33);
  // Pole top cap.
  g.fillStyle(0x2a2a30, 1);
  g.fillRect(cx - 1.8, 1, 3.6, 1.5);
  g.fillStyle(0x6a6068, 1);
  g.fillRect(cx - 1.8, 1, 3.6, 0.5);

  // Horizontal cross-clamp halfway up — the asymmetry break. Stubs
  // out left-only so the silhouette isn't a boring vertical bar.
  g.fillStyle(0x2a2a30, 1);
  g.fillRect(cx - 5.5, 18, 4, 4);
  g.fillStyle(0x5a5a62, 1);
  g.fillRect(cx - 5.5, 18, 4, 1.2);
  g.fillStyle(0x8a8a92, 0.7);
  g.fillRect(cx - 5.5, 18, 3.5, 0.4);
  // Clamp jaw wrapping the main pole — dark inner ring.
  g.fillStyle(0x1a1a1e, 1);
  g.fillRect(cx - 1.8, 18, 3.6, 4);
  g.fillStyle(0x3a3a42, 1);
  g.fillRect(cx - 1.6, 18.5, 3.2, 3);
  // Clamp bolt heads.
  g.fillStyle(0x6a6068, 1);
  g.fillCircle(cx - 4, 19.5, 0.5);
  g.fillCircle(cx - 4, 20.7, 0.5);
  g.fillStyle(0xa0a0a8, 0.85);
  g.fillCircle(cx - 4.1, 19.4, 0.2);
  g.fillCircle(cx - 4.1, 20.6, 0.2);
  // Stub end of the horizontal tube — circular cross-section read.
  g.fillStyle(0x1a1a1e, 1);
  g.fillCircle(cx - 5.4, 20, 1.4);
  g.fillStyle(0x4a4a52, 1);
  g.fillCircle(cx - 5.4, 20, 1);

  // Tartan-yellow scaffold tape wraps — TWO bands. The cultural
  // anchor (Glasgow building sites = endless yellow-and-black hazard
  // tape). Diagonal stripe pattern reads as tape.
  // Upper wrap (around 8-12).
  g.fillStyle(0xf4d020, 1);
  g.fillRect(cx - 1.8, 8, 3.6, 4);
  g.fillStyle(0x1a1a1e, 1);
  // Diagonal stripes (tartan-style hazard).
  g.fillRect(cx - 1.8, 8, 0.8, 1);
  g.fillRect(cx - 0.6, 8.5, 0.8, 1);
  g.fillRect(cx + 0.6, 9, 0.8, 1);
  g.fillRect(cx - 1.8, 10, 0.8, 1);
  g.fillRect(cx - 0.6, 10.5, 0.8, 1);
  g.fillRect(cx + 0.6, 11, 0.8, 1);
  // Tape edge highlight.
  g.fillStyle(0xfff080, 0.85);
  g.fillRect(cx - 1.8, 8, 1, 0.4);

  // Lower wrap (around 28-31).
  g.fillStyle(0xf4d020, 1);
  g.fillRect(cx - 1.8, 28, 3.6, 3.5);
  g.fillStyle(0x1a1a1e, 1);
  g.fillRect(cx - 1.8, 28, 0.8, 1);
  g.fillRect(cx - 0.6, 28.5, 0.8, 1);
  g.fillRect(cx + 0.6, 29, 0.8, 1);
  g.fillRect(cx - 1.8, 30, 0.8, 1);
  g.fillRect(cx - 0.6, 30.5, 0.8, 1);
  // Lower-tape worn corner peeling off.
  g.fillStyle(0x6a5810, 1);
  g.fillRect(cx + 1.4, 31, 0.6, 0.6);
  g.fillStyle(0xfff080, 0.7);
  g.fillRect(cx - 1.8, 28, 1, 0.4);

  // Rust patches on lower section — wear cue. Asymmetric (more on
  // the left where rain settles after running off the clamp).
  g.fillStyle(0x8a4818, 0.75);
  g.fillRect(cx - 1.6, 23, 0.8, 0.5);
  g.fillRect(cx - 1.4, 25, 0.6, 0.4);
  g.fillRect(cx - 1.6, 33, 1.2, 0.5);
  g.fillStyle(0x5a2810, 0.6);
  g.fillRect(cx - 1.6, 23.4, 0.5, 0.3);
  g.fillRect(cx - 1.6, 33.4, 0.8, 0.3);
  // Wee rust drip down to base plate.
  g.fillStyle(0x6a3818, 0.55);
  g.fillRect(cx - 1.5, 34.6, 0.4, 0.6);

  g.generateTexture('deco_scaffold_post', w, h);
  g.destroy();
}
