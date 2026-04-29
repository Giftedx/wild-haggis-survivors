/**
 * H1 M3 T21 — Seasonal croft props.
 *
 * Props auto-swap based on the active seasonal event (E1 framework):
 *
 *   burns_night — haggis platter on the table, "Address" card pinned
 *                 by the hearth, thistle bloomed bright on the sill.
 *   hogmanay    — reserved (Phase 2 authoring, see spec §3).
 *   beltane     — reserved.
 *   samhain     — reserved.
 *
 * Off-season draws nothing. Kept as a pure Phaser drawer — CroftScene
 * calls `drawSeasonalProps` with the active event key and the layout.
 * The drawer is a no-op for unknown keys so future events merge cleanly.
 *
 * Rewrite pass (lift from 6 → target 8-9):
 *  - Platter: ribbon-rim gloss, plated parsley sprig with stem, taller
 *    layered steam (5 wisps in two columns, fading upward) so the dish
 *    reads "fresh from the oven" without animation.
 *  - Whisky glass: tumbler silhouette (curved sides, base bevel) with
 *    a meniscus highlight — not a thin outlined rectangle.
 *  - Card: tape splits into two corner pieces, "TO A HAGGIS" reads as
 *    a centred caps line above the body text, signature curlicue
 *    lifted to look like a real Burns flourish.
 *  - Thistle: tapered curved stem, paired serrated leaves, calyx
 *    globe with armoured bracts, star-burst floret crown — the same
 *    motif language as the standalone deco_thistle.
 */

import * as Phaser from 'phaser';
import type { CroftLayout } from '../../../scenes/croft/CroftComposition';

export function drawSeasonalProps(
  g: Phaser.GameObjects.Graphics,
  eventKey: string | null,
  layout: CroftLayout,
): void {
  if (!eventKey) return;
  switch (eventKey) {
    case 'burns_night':
      drawBurnsNightProps(g, layout);
      return;
    case 'bracken_turn':
      drawBrackenTurnProps(g, layout);
      return;
    case 'lammas':
      drawLammasProps(g, layout);
      return;
    case 'imbolc':
      drawImbolcProps(g, layout);
      return;
    case 'hogmanay':
      drawHogmanayProps(g, layout);
      return;
    // beltane / samhain / st_andrews props land when individual E1
    // phases ship them.
    default:
      return;
  }
}

// ── Burns Night palette ────────────────────────────────────────────

const PLATTER_OUTLINE = 0x0a0604;
const PLATTER_RIM = 0x6a4818;
const PLATTER_METAL = 0xc0a878;
const PLATTER_SHEEN = 0xf6e8b4;
const HAGGIS_OUTLINE = 0x180a02;
const HAGGIS_DARK = 0x3a1e0a;
const HAGGIS_MID = 0x6a3a14;
const HAGGIS_HI = 0x9a5a28;
const HAGGIS_PEPPER = 0x1a0a04;
const PARSLEY_DARK = 0x1a4810;
const PARSLEY_MID = 0x2a7018;
const PARSLEY_HI = 0x6aa030;
const STEAM_OUTER = 0xeae0c4;
const STEAM_INNER = 0xfaf2dc;
const WHISKY_BASE = 0x8a4a14;
const WHISKY_MID = 0xd48a28;
const WHISKY_HI = 0xffd070;
const GLASS_OUTLINE = 0x1a1a22;
const GLASS_BODY = 0x32323a;
const GLASS_HI = 0xb0c4d8;
const CARD_PAPER = 0xeee0b8;
const CARD_HI = 0xf8eccc;
const CARD_EDGE = 0x7a5428;
const CARD_FOLD = 0xc0a87c;
const INK = 0x2a1808;
const INK_FAINT = 0x6a4828;
const TAPE = 0xefe0a0;
const TAPE_SHADOW = 0xb09858;
const STEM_OUTLINE = 0x0a1808;
const STEM_BODY = 0x2a4a18;
const STEM_HI = 0x5a8828;
const LEAF_DARK = 0x1a3810;
const LEAF_MID = 0x3a6a18;
const CALYX_DARK = 0x0a2810;
const CALYX_MID = 0x2a5818;
const CALYX_HI = 0x4a7828;
const BRACT_DARK = 0x081a08;
const THISTLE_DEEP = 0x3a0e5a;
const THISTLE_MID = 0x6a28a8;
const THISTLE_BRIGHT = 0xa848e0;
const THISTLE_TIP = 0xe890ff;
const POLLEN = 0xffe48c;

function drawBurnsNightProps(
  g: Phaser.GameObjects.Graphics,
  layout: CroftLayout,
): void {
  drawHaggisPlatter(g, layout.table.x, layout.table.y);
  drawAddressCard(g, layout.mantelpiece.x + 8, layout.mantelpiece.y - 18);
  drawThistleBloom(g, layout.thistle.x, layout.thistle.y);
}

function drawHaggisPlatter(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Contact shadow under the platter — a soft pool, then a tighter dark
  // core so the silver looks SET DOWN rather than floating.
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, cy + 4, 36, 5);
  g.fillStyle(0x000000, 0.32);
  g.fillEllipse(cx, cy + 3.5, 28, 3);

  // Platter rim (darker brass) wrapping the polished metal centre.
  g.fillStyle(PLATTER_OUTLINE, 1);
  g.fillEllipse(cx, cy, 33, 10);
  g.fillStyle(PLATTER_RIM, 1);
  g.fillEllipse(cx, cy, 31, 9);
  g.fillStyle(PLATTER_METAL, 1);
  g.fillEllipse(cx, cy - 0.4, 28, 7.5);
  // Wide gloss sweep across the metal — sells "polished silver".
  g.fillStyle(PLATTER_SHEEN, 0.78);
  g.fillEllipse(cx - 4, cy - 1.2, 16, 2.4);
  g.fillStyle(0xffffff, 0.5);
  g.fillEllipse(cx - 8, cy - 1.5, 6, 1.2);

  // Haggis dome.
  g.fillStyle(HAGGIS_OUTLINE, 1);
  g.fillEllipse(cx, cy - 4.2, 21, 10.5);
  g.fillStyle(HAGGIS_DARK, 1);
  g.fillEllipse(cx, cy - 4, 19, 9);
  g.fillStyle(HAGGIS_MID, 1);
  g.fillEllipse(cx - 1, cy - 5, 15, 6);
  g.fillStyle(HAGGIS_HI, 0.85);
  g.fillEllipse(cx - 2, cy - 6.5, 9, 2.4);
  // Pepper grains scattered across the dome.
  g.fillStyle(HAGGIS_PEPPER, 0.85);
  g.fillCircle(cx - 4, cy - 5.5, 0.5);
  g.fillCircle(cx + 2, cy - 6, 0.5);
  g.fillCircle(cx + 5, cy - 4.5, 0.5);
  g.fillCircle(cx - 6, cy - 3.5, 0.5);
  g.fillCircle(cx + 7, cy - 3, 0.4);
  // Skin-burst seam — a darker line across the top.
  g.fillStyle(HAGGIS_OUTLINE, 0.8);
  g.fillRect(cx - 6, cy - 6.4, 12, 0.5);
  g.fillStyle(HAGGIS_HI, 0.7);
  g.fillRect(cx - 5.4, cy - 6.7, 10, 0.4);

  // Steam — five wisps in two columns, taller and rising. Outer ring
  // is dark cream, inner core is brighter; fades upward.
  const wisps: Array<[number, number, number, number]> = [
    [-4, -11, 2.0, 0.55],
    [0, -13, 2.2, 0.6],
    [4, -10, 2.0, 0.5],
    [-2, -16, 1.8, 0.42],
    [3, -15, 1.6, 0.38],
  ];
  for (const [dx, dy, r, a] of wisps) {
    g.fillStyle(STEAM_OUTER, a);
    g.fillCircle(cx + dx, cy + dy, r);
  }
  for (const [dx, dy, r, a] of wisps) {
    g.fillStyle(STEAM_INNER, Math.min(0.85, a + 0.18));
    g.fillCircle(cx + dx, cy + dy, Math.max(0.7, r - 0.8));
  }

  // Parsley sprig — proper sprig: thin stem, three leaflet clusters,
  // catch-light on the brightest leaflet.
  g.fillStyle(STEM_OUTLINE, 1);
  g.fillRect(cx + 8.4, cy - 5, 0.8, 5);
  g.fillStyle(PARSLEY_DARK, 1);
  g.fillCircle(cx + 8, cy - 2.4, 1.7);
  g.fillCircle(cx + 10.6, cy - 4.2, 1.5);
  g.fillCircle(cx + 11.4, cy - 1.8, 1.4);
  g.fillStyle(PARSLEY_MID, 1);
  g.fillCircle(cx + 8, cy - 2.4, 1.2);
  g.fillCircle(cx + 10.6, cy - 4.2, 1.0);
  g.fillCircle(cx + 11.4, cy - 1.8, 0.9);
  g.fillStyle(PARSLEY_HI, 0.85);
  g.fillCircle(cx + 10.4, cy - 4.4, 0.5);

  // Whisky tumbler — squat glass with curved sides (built from
  // overlapping rounded rect + ellipse cap), amber dram with a
  // meniscus highlight.
  // Glass body outline.
  g.fillStyle(GLASS_OUTLINE, 1);
  g.fillRoundedRect(cx + 17, cy - 8.5, 7, 11, 1.4);
  // Glass interior tint (cool grey-blue, sells transparent crystal).
  g.fillStyle(GLASS_BODY, 0.85);
  g.fillRoundedRect(cx + 17.6, cy - 8, 5.8, 10, 1);
  // Whisky liquid — fills lower 55%.
  g.fillStyle(WHISKY_BASE, 1);
  g.fillRect(cx + 17.6, cy - 3.2, 5.8, 5.2);
  g.fillStyle(WHISKY_MID, 1);
  g.fillRect(cx + 18, cy - 3, 5, 4.8);
  g.fillStyle(WHISKY_HI, 0.75);
  g.fillRect(cx + 18.4, cy - 2.6, 1.2, 4);
  // Meniscus — the curved surface of the dram.
  g.fillStyle(WHISKY_HI, 0.95);
  g.fillEllipse(cx + 20.5, cy - 3.1, 5.4, 0.9);
  g.fillStyle(0xffffff, 0.75);
  g.fillRect(cx + 18.6, cy - 3.4, 2.2, 0.4);
  // Glass rim and side highlight.
  g.fillStyle(GLASS_HI, 0.95);
  g.fillRect(cx + 17.6, cy - 8.4, 5.8, 0.6);
  g.fillStyle(GLASS_HI, 0.6);
  g.fillRect(cx + 17.6, cy - 8, 0.7, 9);
  // Base bevel.
  g.fillStyle(GLASS_OUTLINE, 1);
  g.fillRect(cx + 17.4, cy + 1.5, 6.2, 1);
}

function drawAddressCard(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
): void {
  const w = 24;
  const h = 16;
  // Card body — soft shadow + edge + paper + paper highlight.
  g.fillStyle(0x000000, 0.22);
  g.fillRect(x + 1.5, y + 1.5, w, h);
  g.fillStyle(CARD_EDGE, 1);
  g.fillRect(x, y, w, h);
  g.fillStyle(CARD_PAPER, 1);
  g.fillRect(x + 1, y + 1, w - 2, h - 2);
  // Soft sheen — top-left corner where the firelight catches.
  g.fillStyle(CARD_HI, 0.7);
  g.fillRect(x + 1, y + 1, w - 2, 1.2);
  g.fillStyle(CARD_HI, 0.5);
  g.fillRect(x + 1, y + 1, 1, h - 2);
  // Soft fold-shadow at the bottom-right.
  g.fillStyle(CARD_FOLD, 0.65);
  g.fillRect(x + 1, y + h - 2.4, w - 2, 1.2);

  // Title bar — "TO A HAGGIS" caps line, drawn as 7 short ink bars
  // with kerning; a nod-to-typography that reads at a glance.
  g.fillStyle(INK, 1);
  const titleY = y + 3;
  const titleStart = x + 4;
  const letters = [1.6, 1.2, 0.8, 1.4, 1.0, 1.4, 1.6, 1.0, 1.6, 1.4, 1.4];
  let lx = titleStart;
  for (const lw of letters) {
    g.fillRect(lx, titleY, lw, 1.1);
    lx += lw + 0.5;
  }
  // Title underline rule.
  g.fillStyle(INK_FAINT, 0.9);
  g.fillRect(x + 3, y + 4.6, w - 6, 0.4);

  // Body text — three faint ink lines of varying length.
  g.fillStyle(INK_FAINT, 0.85);
  g.fillRect(x + 3, y + 6.5, w - 7, 0.5);
  g.fillRect(x + 3, y + 8.4, w - 9, 0.5);
  g.fillRect(x + 3, y + 10.3, w - 8, 0.5);

  // Burns signature flourish — a longer curving stroke + tail. Built
  // from three connected segments so it reads as a hand-written name.
  g.fillStyle(INK, 1);
  g.fillRect(x + w - 12, y + h - 4.5, 8, 0.6);
  g.fillRect(x + w - 6, y + h - 5, 0.6, 1.6);
  g.fillRect(x + w - 4, y + h - 4.5, 0.6, 1.2);
  g.fillRect(x + w - 8, y + h - 3.6, 0.6, 1);
  // Quill flick — a short diagonal off the last letter.
  g.fillStyle(INK_FAINT, 0.85);
  g.fillRect(x + w - 3.5, y + h - 5.4, 1.2, 0.5);

  // Two pieces of TAPE at the upper corners — proper torn-strip look,
  // shadow rect underneath, slightly different angles.
  g.fillStyle(TAPE_SHADOW, 0.7);
  g.fillRect(x - 2, y - 2.6, 7, 3);
  g.fillRect(x + w - 5, y - 2.4, 7, 3);
  g.fillStyle(TAPE, 0.95);
  g.fillRect(x - 1.5, y - 2.4, 6.4, 2.8);
  g.fillRect(x + w - 4.6, y - 2.2, 6.2, 2.8);
  // Tape highlight strip.
  g.fillStyle(0xffffff, 0.4);
  g.fillRect(x - 1.2, y - 2.2, 5.6, 0.5);
  g.fillRect(x + w - 4.3, y - 2, 5.4, 0.5);
}

function drawThistleBloom(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Soft contact shadow at the base.
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(cx, cy + 9, 14, 3);

  // Stem — TAPERED curve, drawn as four slightly offset rects so it
  // bends gently up-and-right. Outline darker, body brighter.
  g.fillStyle(STEM_OUTLINE, 1);
  g.fillRect(cx - 1.5, cy + 6, 2.4, 4);
  g.fillRect(cx - 1.4, cy + 2, 2.2, 4);
  g.fillRect(cx - 1.2, cy - 2, 2, 4);
  g.fillRect(cx - 1, cy - 5, 1.8, 3);
  g.fillStyle(STEM_BODY, 1);
  g.fillRect(cx - 0.7, cy + 6, 1.6, 4);
  g.fillRect(cx - 0.6, cy + 2, 1.5, 4);
  g.fillRect(cx - 0.4, cy - 2, 1.4, 4);
  g.fillRect(cx - 0.2, cy - 5, 1.2, 3);
  g.fillStyle(STEM_HI, 0.85);
  g.fillRect(cx - 0.5, cy + 6, 0.4, 13);

  // Two serrated leaves flanking the stem (mirror).
  g.fillStyle(LEAF_DARK, 1);
  g.fillTriangle(cx - 8, cy + 4, cx, cy + 1, cx - 1, cy + 7);
  g.fillTriangle(cx + 8, cy + 4, cx, cy + 1, cx + 1, cy + 7);
  g.fillStyle(LEAF_MID, 1);
  g.fillTriangle(cx - 7, cy + 4, cx - 1, cy + 2, cx - 1, cy + 6);
  g.fillTriangle(cx + 7, cy + 4, cx + 1, cy + 2, cx + 1, cy + 6);
  // Leaf-edge spikes — three per leaf.
  g.fillStyle(LEAF_DARK, 1);
  g.fillTriangle(cx - 7, cy + 2, cx - 8, cy + 4, cx - 6, cy + 4);
  g.fillTriangle(cx - 6, cy + 6, cx - 8, cy + 6.5, cx - 5, cy + 6.5);
  g.fillTriangle(cx + 7, cy + 2, cx + 8, cy + 4, cx + 6, cy + 4);
  g.fillTriangle(cx + 6, cy + 6, cx + 8, cy + 6.5, cx + 5, cy + 6.5);
  // Leaf vein.
  g.fillStyle(STEM_HI, 0.85);
  g.fillRect(cx - 5, cy + 4, 4, 0.4);
  g.fillRect(cx + 1, cy + 4, 4, 0.4);

  // Calyx globe — armoured base with vertical ribbing and four short
  // outward bracts.
  g.fillStyle(CALYX_DARK, 1);
  g.fillCircle(cx, cy - 2, 4.4);
  g.fillStyle(CALYX_MID, 1);
  g.fillCircle(cx, cy - 2, 3.6);
  g.fillStyle(CALYX_HI, 0.95);
  g.fillCircle(cx - 0.6, cy - 3, 2.4);
  // Vertical ribbing.
  g.fillStyle(CALYX_DARK, 0.7);
  g.fillRect(cx - 2.4, cy - 3, 0.4, 4);
  g.fillRect(cx - 0.8, cy - 3, 0.4, 4);
  g.fillRect(cx + 0.8, cy - 3, 0.4, 4);
  g.fillRect(cx + 2.4, cy - 3, 0.4, 4);
  // Six radiating bracts (short spikes around the globe waist).
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const tx = cx + Math.cos(a) * 6;
    const ty = cy - 2 + Math.sin(a) * 6;
    const lx = cx + Math.cos(a - 0.3) * 3.6;
    const ly = cy - 2 + Math.sin(a - 0.3) * 3.6;
    const rx = cx + Math.cos(a + 0.3) * 3.6;
    const ry = cy - 2 + Math.sin(a + 0.3) * 3.6;
    g.fillStyle(BRACT_DARK, 1);
    g.fillTriangle(lx, ly, tx, ty, rx, ry);
  }

  // Floret crown — bristly purple. Dark base + bright inner +
  // hot tip + radiating bristles.
  g.fillStyle(THISTLE_DEEP, 1);
  g.fillEllipse(cx, cy - 6, 7, 3.2);
  g.fillStyle(THISTLE_MID, 1);
  g.fillEllipse(cx, cy - 6.4, 5.6, 2.6);
  g.fillStyle(THISTLE_BRIGHT, 1);
  g.fillEllipse(cx, cy - 7, 3.8, 1.8);
  // Bristly filaments — vertical with stagger heights and kink.
  const bristleX = [-3.4, -2.4, -1.4, -0.4, 0.6, 1.6, 2.6, 3.6];
  for (let i = 0; i < bristleX.length; i++) {
    const ax = cx + bristleX[i];
    const h = 2.2 + (i % 3) * 0.8;
    g.fillStyle(THISTLE_BRIGHT, 1);
    g.fillRect(ax, cy - 7 - h, 0.5, h);
  }
  // Hot pink tips — only on the centre four bristles for visual rhythm.
  g.fillStyle(THISTLE_TIP, 1);
  g.fillRect(cx - 2.4, cy - 10.4, 0.5, 0.6);
  g.fillRect(cx - 0.4, cy - 11, 0.5, 0.7);
  g.fillRect(cx + 1.6, cy - 10.4, 0.5, 0.6);
  g.fillRect(cx + 0.6, cy - 11.4, 0.4, 0.5);
  // Pollen specks floating above the crown.
  g.fillStyle(POLLEN, 0.9);
  g.fillCircle(cx + 1.2, cy - 12.4, 0.4);
  g.fillCircle(cx - 2.0, cy - 13.0, 0.4);
  g.fillCircle(cx + 2.4, cy - 13.6, 0.3);
}

// ── Bracken-turn palette ───────────────────────────────────────────

const BRACKEN_STEM = 0x4a2810;
const BRACKEN_DARK = 0x6a3818;
const BRACKEN_MID = 0x9a5828;
const BRACKEN_BRIGHT = 0xc88840;
const BRACKEN_VEIN = 0xf4d088;
const ROWAN_BERRY = 0xb02418;
const ROWAN_HI = 0xe04a30;

/**
 * Bracken-turn croft props (Nov 4 – Nov 26 window). The thistle slot
 * gets replaced by a small bunch of bronze bracken fronds sat in a
 * weathered tin pail; a tiny rowan-berry sprig leans against it. The
 * autumn signature in the crofthouse — the moor's coat reflected on
 * the hearth corner.
 */
function drawBrackenTurnProps(
  g: Phaser.GameObjects.Graphics,
  layout: CroftLayout,
): void {
  drawBrackenBunch(g, layout.thistle.x, layout.thistle.y);
}

function drawBrackenBunch(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Soft contact shadow under the pail.
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, cy + 6, 18, 3);

  // Tin pail — weathered grey body, darker rim, narrow handle hint.
  g.fillStyle(0x18181c, 1);
  g.fillRoundedRect(cx - 7, cy - 2, 14, 9, 1.5);
  g.fillStyle(0x52525a, 1);
  g.fillRoundedRect(cx - 6, cy - 1, 12, 7, 1);
  g.fillStyle(0x70707a, 1);
  g.fillRoundedRect(cx - 5.5, cy - 0.6, 11, 2, 0.8);
  // Rim band — slightly darker than the body to read as a lip.
  g.fillStyle(0x2a2a32, 1);
  g.fillRect(cx - 7, cy - 2, 14, 1.4);
  // Handle slip — tiny vertical line at each side.
  g.fillStyle(0x18181c, 1);
  g.fillRect(cx - 7, cy - 4, 0.6, 2.5);
  g.fillRect(cx + 6.4, cy - 4, 0.6, 2.5);
  // Front stamp / tarnish dot.
  g.fillStyle(0x2e2e34, 0.85);
  g.fillCircle(cx, cy + 3, 0.7);

  // Fronds rising from the pail. Five stems at varying heights and
  // angles fan outward; each ends in a copper-bronze leaflet pair.
  const fronds: Array<{ baseX: number; tipX: number; tipY: number; bend: number }> = [
    { baseX: cx - 4, tipX: cx - 9, tipY: cy - 14, bend: -0.2 },
    { baseX: cx - 1.5, tipX: cx - 3, tipY: cy - 17, bend: -0.05 },
    { baseX: cx + 0.5, tipX: cx + 0.5, tipY: cy - 19, bend: 0.0 },
    { baseX: cx + 2, tipX: cx + 5, tipY: cy - 16, bend: 0.1 },
    { baseX: cx + 4, tipX: cx + 9, tipY: cy - 13, bend: 0.18 },
  ];

  for (const frond of fronds) {
    drawBrackenFrond(g, frond.baseX, cy - 2, frond.tipX, frond.tipY, frond.bend);
  }

  // Rowan sprig leaning against the front of the pail — three berries
  // on a thin curved stem, signalling autumn alongside the bracken.
  g.fillStyle(BRACKEN_STEM, 1);
  g.fillRect(cx - 2, cy + 4, 0.6, 4);
  g.fillRect(cx - 2.4, cy + 1.5, 0.6, 3);
  // Three berries clustered.
  g.fillStyle(ROWAN_BERRY, 1);
  g.fillCircle(cx - 2.7, cy + 1, 1.2);
  g.fillCircle(cx - 1.8, cy + 0.6, 1.1);
  g.fillCircle(cx - 1.2, cy + 1.4, 1);
  // Bright highlights on each berry — the wet sheen.
  g.fillStyle(ROWAN_HI, 0.9);
  g.fillCircle(cx - 3, cy + 0.6, 0.4);
  g.fillCircle(cx - 2.1, cy + 0.2, 0.35);
  g.fillCircle(cx - 1.5, cy + 1, 0.3);
}

/**
 * Single bracken frond — a stem rising from `(baseX, baseY)` to a tip
 * at `(tipX, tipY)`, with paired serrated leaflets along the spine
 * and a final copper crown at the tip. `bend` is a small horizontal
 * offset applied at midpoint to suggest the frond's natural curve.
 */
function drawBrackenFrond(
  g: Phaser.GameObjects.Graphics,
  baseX: number,
  baseY: number,
  tipX: number,
  tipY: number,
  bend: number,
): void {
  const midX = (baseX + tipX) / 2 + bend * Math.abs(tipY - baseY);
  const midY = (baseY + tipY) / 2;

  // Stem — dark olive-brown, thin two-pixel-wide spine drawn in three
  // segments to suggest the curve.
  g.fillStyle(BRACKEN_STEM, 1);
  drawSegment(g, baseX, baseY, midX, midY, 0.8);
  drawSegment(g, midX, midY, tipX, tipY, 0.7);

  // Leaflets paired along the spine — three pairs at quarter / half /
  // three-quarter positions, alternating bright copper and mid bronze.
  const pairs = [
    { t: 0.25, size: 1.6, colour: BRACKEN_DARK },
    { t: 0.50, size: 2.0, colour: BRACKEN_MID },
    { t: 0.75, size: 1.7, colour: BRACKEN_BRIGHT },
  ];
  for (const p of pairs) {
    const lx = baseX + (tipX - baseX) * p.t + bend * (1 - Math.abs(p.t - 0.5) * 2) * Math.abs(tipY - baseY) * 0.5;
    const ly = baseY + (tipY - baseY) * p.t;
    // Perpendicular offset to spine direction.
    const dx = tipX - baseX;
    const dy = tipY - baseY;
    const len = Math.max(0.001, Math.sqrt(dx * dx + dy * dy));
    const nx = -dy / len;
    const ny = dx / len;
    g.fillStyle(p.colour, 1);
    g.fillCircle(lx + nx * 1.6, ly + ny * 1.6, p.size * 0.7);
    g.fillCircle(lx - nx * 1.6, ly - ny * 1.6, p.size * 0.7);
  }

  // Tip crown — a small bright cluster of three leaflets fanning out.
  g.fillStyle(BRACKEN_BRIGHT, 1);
  g.fillCircle(tipX - 1, tipY, 1.4);
  g.fillCircle(tipX + 1, tipY, 1.4);
  g.fillCircle(tipX, tipY - 1, 1.4);
  // Cream-gold vein highlight at the tip (the autumn shine).
  g.fillStyle(BRACKEN_VEIN, 0.85);
  g.fillCircle(tipX, tipY - 0.4, 0.6);
}

/**
 * Draw a thin segment between two points. Used by the bracken-frond
 * spine renderer; the small width is provided for future tuning.
 */
function drawSegment(
  g: Phaser.GameObjects.Graphics,
  x0: number, y0: number,
  x1: number, y1: number,
  w: number,
): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const steps = Math.max(2, Math.ceil(Math.sqrt(dx * dx + dy * dy)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    g.fillCircle(x0 + dx * t, y0 + dy * t, w / 2);
  }
}

// ── Lammas palette ────────────────────────────────────────────────

const SHEAF_STEM = 0xb8902c;
const SHEAF_GRAIN = 0xe6c060;
const SHEAF_HI = 0xfae898;
const SHEAF_TIE = 0x8a4810;
const BANNOCK_CRUST = 0xa05a18;
const BANNOCK_CRUMB = 0xd29a48;
const BANNOCK_HI = 0xf2c478;
const BANNOCK_BUTTER = 0xfae0a0;

/**
 * Lammas croft props (Jul 29 – Aug 4 window). Lùnastal — first
 * harvest. The kitchen table gets a small wheat sheaf bundle tied
 * with hemp twine, plus a wee bannock loaf beside it (the loaf-mass
 * tradition). Both painted modestly so the props read as
 * "set down for the supper" rather than centrepiece-heroic.
 */
function drawLammasProps(
  g: Phaser.GameObjects.Graphics,
  layout: CroftLayout,
): void {
  drawWheatSheaf(g, layout.table.x - 10, layout.table.y);
  drawBannock(g, layout.table.x + 10, layout.table.y + 1);
}

function drawWheatSheaf(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Soft contact shadow for the sheaf base.
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, cy + 6, 12, 2);

  // Tied bundle of wheat stems — thin tapered straws fanning slightly
  // upward. Drawn as 7 stems at staggered angles, base meeting at the
  // tie point, fanning ±0.25 rad at the top so the bundle reads as
  // hand-gathered, not machine-stamped.
  const tieY = cy + 2;
  const stemTopY = cy - 12;
  const stemCount = 7;
  for (let i = 0; i < stemCount; i++) {
    // Symmetric fan: −0.3 to +0.3 rad spread across the bundle.
    const t = (i - (stemCount - 1) / 2) / ((stemCount - 1) / 2); // -1..+1
    const tipX = cx + t * 5;
    g.fillStyle(SHEAF_STEM, 1);
    drawSegment(g, cx, tieY, tipX, stemTopY, 0.7);
  }

  // Grain heads at each stem tip — small ovals in three-tone gold.
  for (let i = 0; i < stemCount; i++) {
    const t = (i - (stemCount - 1) / 2) / ((stemCount - 1) / 2);
    const tipX = cx + t * 5;
    // Outer dark grain.
    g.fillStyle(SHEAF_STEM, 1);
    g.fillEllipse(tipX, stemTopY, 1.6, 3);
    // Mid grain — main wheat-gold.
    g.fillStyle(SHEAF_GRAIN, 1);
    g.fillEllipse(tipX, stemTopY, 1.2, 2.6);
    // Highlight catches the sun on top.
    g.fillStyle(SHEAF_HI, 0.85);
    g.fillEllipse(tipX, stemTopY - 0.5, 0.7, 1.4);
    // Tiny dark awn (whisker) above each grain — the hairlike spike
    // characteristic of barley/wheat ears.
    g.fillStyle(SHEAF_STEM, 1);
    g.fillRect(tipX - 0.2, stemTopY - 4, 0.4, 2);
  }

  // Hemp tie — short horizontal band wrapped around the bundle base.
  g.fillStyle(SHEAF_TIE, 1);
  g.fillRect(cx - 3, tieY, 6, 1.8);
  g.fillStyle(0xc06824, 1);
  g.fillRect(cx - 2.8, tieY + 0.3, 5.6, 0.5);
  // Two trailing tie-ends curling down from the knot.
  g.fillStyle(SHEAF_TIE, 1);
  g.fillRect(cx + 1.4, tieY + 1.6, 0.5, 2.4);
  g.fillRect(cx - 1.8, tieY + 1.6, 0.5, 2.0);
}

function drawBannock(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Plate shadow underneath.
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(cx, cy + 3, 11, 1.8);

  // Round bannock — three stacked ellipses for outline, crust, and
  // crumb. Reads as a flat oatcake-style loaf rather than a yeasted
  // bread, which is the Lammas tradition.
  g.fillStyle(BANNOCK_CRUST, 1);
  g.fillEllipse(cx, cy, 9, 4.2);
  g.fillStyle(BANNOCK_CRUMB, 1);
  g.fillEllipse(cx, cy - 0.4, 7.5, 3.4);
  // Top sheen catches the kitchen window light.
  g.fillStyle(BANNOCK_HI, 0.85);
  g.fillEllipse(cx - 1, cy - 1.2, 4, 1.2);
  // Cross-scored quarters — the traditional Scottish bannock mark
  // (folk-belief: the cross keeps the fairies out of the loaf).
  g.fillStyle(BANNOCK_CRUST, 0.85);
  g.fillRect(cx - 3.5, cy - 0.3, 7, 0.5);
  g.fillRect(cx - 0.3, cy - 1.6, 0.5, 2.6);

  // A small pat of butter melting on top — single warm dot with a
  // brighter highlight, sells "fresh from the oven."
  g.fillStyle(BANNOCK_BUTTER, 0.85);
  g.fillCircle(cx + 0.6, cy - 1.4, 0.9);
  g.fillStyle(0xfff0c8, 0.95);
  g.fillCircle(cx + 0.4, cy - 1.6, 0.4);
}

// ── Imbolc palette ────────────────────────────────────────────────

const SNOWDROP_STEM = 0x2a5828;
const SNOWDROP_LEAF = 0x4a7838;
const SNOWDROP_PETAL = 0xf8f8f4;
const SNOWDROP_INNER = 0xc8e4c0;
const SNOWDROP_HEART = 0x88b878;
const RUSH_DARK = 0x6a5028;
const RUSH_MID = 0xa07840;
const RUSH_HI = 0xd0a060;
const RUSH_TIE = 0x4a3018;

/**
 * Imbolc croft props (Feb 2 – Feb 8 window). Brìde / Brigid is
 * stirring; the croft sets out two folk-tokens for her: a small
 * sprig of snowdrops in a wee jug on the mantelpiece (the year's
 * first flower, pushed up through the cold) and a St Brìde's cross
 * plaited from rushes hung above (the four-armed equal-cross with
 * a square-woven heart, traditional charm against fire and harm).
 */
function drawImbolcProps(
  g: Phaser.GameObjects.Graphics,
  layout: CroftLayout,
): void {
  drawSnowdropSprig(g, layout.mantelpiece.x + 8, layout.mantelpiece.y - 14);
  drawStBridesCross(g, layout.mantelpiece.x + 24, layout.mantelpiece.y - 22);
}

function drawSnowdropSprig(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Wee earthenware jug — squat, two-tone clay with a small handle hint.
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, cy + 7, 10, 1.8);
  // Body — flat-bottomed pot.
  g.fillStyle(0x4a2a14, 1);
  g.fillRoundedRect(cx - 4.5, cy + 1, 9, 6.5, 1);
  g.fillStyle(0x7a4a24, 1);
  g.fillRoundedRect(cx - 4, cy + 1.5, 8, 5.5, 0.8);
  // Top rim + neck.
  g.fillStyle(0x4a2a14, 1);
  g.fillRect(cx - 5, cy + 0.5, 10, 1.4);
  // Single highlight stripe — fresh-thrown clay shine.
  g.fillStyle(0xa06a3a, 0.6);
  g.fillRect(cx - 3, cy + 2, 1, 4);

  // Three snowdrop stems rising fae the jug. Each stem ends in a
  // single drooping bell-flower with three pure-white outer petals,
  // a pale-green inner cup, and a tiny green heart-mark.
  const stems = [
    { tipX: cx - 3, tipY: cy - 9 },
    { tipX: cx - 0.5, tipY: cy - 11 },
    { tipX: cx + 2.5, tipY: cy - 8 },
  ];
  for (const s of stems) {
    // Stem.
    g.fillStyle(SNOWDROP_STEM, 1);
    drawSegment(g, cx, cy + 0.5, s.tipX, s.tipY, 0.6);
    // Single sword-leaf along each stem (mid-stem).
    const lx = (cx + s.tipX) / 2;
    const ly = (cy + s.tipY) / 2;
    g.fillStyle(SNOWDROP_LEAF, 1);
    g.fillEllipse(lx - 1.5, ly + 1, 0.8, 3);
    // Bell-flower drooping fae the stem tip.
    drawSnowdropBell(g, s.tipX, s.tipY);
  }
}

function drawSnowdropBell(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Stem-tip green crook + tiny calyx where the flower hangs.
  g.fillStyle(SNOWDROP_STEM, 1);
  g.fillRect(cx - 0.3, cy - 0.4, 0.6, 1.2);
  g.fillStyle(SNOWDROP_HEART, 1);
  g.fillCircle(cx, cy + 0.6, 0.5);

  // Three outer petals — pure-white droplets.
  g.fillStyle(SNOWDROP_PETAL, 1);
  g.fillEllipse(cx, cy + 2.6, 2.4, 2.6);
  g.fillEllipse(cx - 1.2, cy + 2.4, 1.4, 2.4);
  g.fillEllipse(cx + 1.2, cy + 2.4, 1.4, 2.4);

  // Inner cup — pale green heart-print on the centre droplet.
  g.fillStyle(SNOWDROP_INNER, 0.85);
  g.fillEllipse(cx, cy + 2.8, 1.2, 1.6);
  g.fillStyle(SNOWDROP_HEART, 1);
  g.fillRect(cx - 0.3, cy + 3.2, 0.6, 0.8);
}

function drawStBridesCross(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // St Brìde's cross — equal-armed plaited rush cross with a square
  // woven heart at the centre. Painted as four arms (12×3 each)
  // overlapping at the heart, with two cross-band weaves per arm so
  // the rush plaiting reads at small scale.
  const armLen = 6;
  const armWidth = 1.6;

  // Soft contact-line on the wall behind.
  g.fillStyle(0x000000, 0.18);
  g.fillRect(cx - armLen - 0.5, cy + 1, (armLen * 2) + 1, 0.7);

  // Four rush arms — order: vertical first (north + south), then
  // horizontal (east + west) overlapping the vertical at the heart.
  // North arm.
  g.fillStyle(RUSH_DARK, 1);
  g.fillRect(cx - armWidth / 2, cy - armLen, armWidth, armLen);
  g.fillStyle(RUSH_MID, 1);
  g.fillRect(cx - armWidth / 2 + 0.3, cy - armLen + 0.3, armWidth - 0.6, armLen - 0.5);
  // South arm.
  g.fillStyle(RUSH_DARK, 1);
  g.fillRect(cx - armWidth / 2, cy, armWidth, armLen);
  g.fillStyle(RUSH_MID, 1);
  g.fillRect(cx - armWidth / 2 + 0.3, cy + 0.2, armWidth - 0.6, armLen - 0.5);
  // East arm.
  g.fillStyle(RUSH_DARK, 1);
  g.fillRect(cx, cy - armWidth / 2, armLen, armWidth);
  g.fillStyle(RUSH_MID, 1);
  g.fillRect(cx + 0.2, cy - armWidth / 2 + 0.3, armLen - 0.5, armWidth - 0.6);
  // West arm.
  g.fillStyle(RUSH_DARK, 1);
  g.fillRect(cx - armLen, cy - armWidth / 2, armLen, armWidth);
  g.fillStyle(RUSH_MID, 1);
  g.fillRect(cx - armLen + 0.3, cy - armWidth / 2 + 0.3, armLen - 0.5, armWidth - 0.6);

  // Square woven heart — overlapping rushes form a 3×3 diamond at
  // centre. Rendered as one slightly brighter rect to suggest the
  // weave catches the hearth-light differently than the arm shafts.
  g.fillStyle(RUSH_HI, 0.85);
  g.fillRect(cx - 1.2, cy - 1.2, 2.4, 2.4);
  g.fillStyle(RUSH_MID, 1);
  g.fillRect(cx - 0.4, cy - 0.4, 0.8, 0.8);

  // Cross-band weave hints — short dark stripes across each arm
  // where rush bundles cross the spine. Two per arm.
  g.fillStyle(RUSH_TIE, 1);
  // North arm bands.
  g.fillRect(cx - armWidth / 2 - 0.3, cy - armLen + 1.5, armWidth + 0.6, 0.4);
  g.fillRect(cx - armWidth / 2 - 0.3, cy - armLen + 3.5, armWidth + 0.6, 0.4);
  // South arm bands.
  g.fillRect(cx - armWidth / 2 - 0.3, cy + 1.5, armWidth + 0.6, 0.4);
  g.fillRect(cx - armWidth / 2 - 0.3, cy + 3.5, armWidth + 0.6, 0.4);
  // East arm bands.
  g.fillRect(cx + 1.5, cy - armWidth / 2 - 0.3, 0.4, armWidth + 0.6);
  g.fillRect(cx + 3.5, cy - armWidth / 2 - 0.3, 0.4, armWidth + 0.6);
  // West arm bands.
  g.fillRect(cx - armLen + 1.5, cy - armWidth / 2 - 0.3, 0.4, armWidth + 0.6);
  g.fillRect(cx - armLen + 3.5, cy - armWidth / 2 - 0.3, 0.4, armWidth + 0.6);

  // Tied-rush ends — small frayed stubs at each arm tip.
  g.fillStyle(RUSH_TIE, 1);
  g.fillCircle(cx, cy - armLen, 0.5);
  g.fillCircle(cx, cy + armLen, 0.5);
  g.fillCircle(cx + armLen, cy, 0.5);
  g.fillCircle(cx - armLen, cy, 0.5);
}

// ── Hogmanay palette ──────────────────────────────────────────────

const BUN_DARK = 0x2a1408;
const BUN_MID = 0x4a2810;
const BUN_HI = 0x7a4818;
const BUN_FRUIT = 0x6a1818;
const BUN_PEEL = 0xc89030;
const DRAM_GLASS_OUTLINE = 0x1a1a22;
const DRAM_GLASS_BODY = 0x32323a;
const DRAM_GLASS_HI = 0xc0d4e8;
const DRAM_WHISKY_BASE = 0x6a3208;
const DRAM_WHISKY_MID = 0xc88830;
const DRAM_WHISKY_HI = 0xffd070;
const FOOTER_OUTLINE = 0x080208;
const FOOTER_COAT = 0x1a1a26;
const FOOTER_FACE = 0x6a4828;
const FOOTER_HAIR = 0x180408;
const FOOTER_GIFT = 0x4a2010;
const FOOTER_GIFT_HI = 0x9a5a28;
const COIN_GOLD = 0xd4a040;

/**
 * Hogmanay croft props (Dec 28 – Jan 3 window). The Scottish New
 * Year set: a small black bun (rich-fruit pastry) on the table, a
 * tumbler of whisky beside it, and a silhouette of the first-footer
 * (the dark-haired stranger bringing luck) shadowed against the
 * doorway near the croft edge.
 */
function drawHogmanayProps(
  g: Phaser.GameObjects.Graphics,
  layout: CroftLayout,
): void {
  drawBlackBun(g, layout.table.x - 9, layout.table.y);
  drawWhiskyTumbler(g, layout.table.x + 9, layout.table.y - 1);
  // First-footer silhouette near the hearth side — uses the hearth
  // position offset to land at "the doorway" implied by the croft
  // composition.
  drawFirstFooterSilhouette(g, layout.hearth.x + 90, layout.hearth.y - 18);
}

function drawBlackBun(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Soft contact shadow.
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, cy + 5, 13, 2);

  // Pastry shell — the dark-cooked outer crust. Three-tone gradient
  // from dark crust → mid bake → highlight.
  g.fillStyle(BUN_DARK, 1);
  g.fillRoundedRect(cx - 7, cy - 4, 14, 8, 1.5);
  g.fillStyle(BUN_MID, 1);
  g.fillRoundedRect(cx - 6, cy - 3.5, 12, 7, 1);
  g.fillStyle(BUN_HI, 0.7);
  g.fillEllipse(cx - 1, cy - 3.5, 7, 1.4);

  // Cut-face slice — exposed centre showing the dense fruit packing.
  // Drawn on the right third so the slice + intact bun read together.
  g.fillStyle(BUN_DARK, 1);
  g.fillRect(cx + 2, cy - 3.5, 5, 7);
  g.fillStyle(0x4a3a1c, 1); // Fruity packed-meal interior.
  g.fillRect(cx + 2.5, cy - 3, 4, 6);

  // Currants + raisin pips — small dark dots with brighter peel-flecks
  // suggesting candied citrus.
  g.fillStyle(BUN_FRUIT, 1);
  g.fillCircle(cx + 3, cy - 1.5, 0.5);
  g.fillCircle(cx + 4.5, cy + 0.5, 0.55);
  g.fillCircle(cx + 5.5, cy - 0.8, 0.45);
  g.fillCircle(cx + 3.5, cy + 1.5, 0.5);
  g.fillStyle(BUN_PEEL, 0.85);
  g.fillRect(cx + 3.8, cy - 0.4, 0.7, 0.4);
  g.fillRect(cx + 5.0, cy + 1.2, 0.6, 0.35);
}

function drawWhiskyTumbler(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Plate / coaster shadow.
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, cy + 6, 9, 1.6);

  // Glass tumbler — squat shape with curved sides, base bevel, narrow
  // neck below the rim.
  g.fillStyle(DRAM_GLASS_OUTLINE, 1);
  g.fillRoundedRect(cx - 4, cy - 5, 8, 10, 0.6);
  g.fillStyle(DRAM_GLASS_BODY, 0.55);
  g.fillRoundedRect(cx - 3.4, cy - 4.5, 6.8, 9, 0.4);

  // Whisky inside — three-tone amber gradient. Fills the bottom
  // two-thirds of the tumbler so the dram reads as a generous pour.
  g.fillStyle(DRAM_WHISKY_BASE, 1);
  g.fillRect(cx - 3.2, cy - 1, 6.4, 5.5);
  g.fillStyle(DRAM_WHISKY_MID, 1);
  g.fillRect(cx - 3, cy - 0.5, 6, 4.5);
  g.fillStyle(DRAM_WHISKY_HI, 0.8);
  g.fillRect(cx - 2.5, cy - 0.4, 5, 1.2);

  // Meniscus — single bright top edge across the whisky surface.
  g.fillStyle(0xfff0c8, 0.9);
  g.fillRect(cx - 3, cy - 1.2, 6, 0.5);

  // Glass highlight — single vertical streak on the left rim.
  g.fillStyle(DRAM_GLASS_HI, 0.6);
  g.fillRect(cx - 3.2, cy - 4, 0.6, 8);
  g.fillStyle(0xffffff, 0.8);
  g.fillRect(cx - 3.0, cy - 3, 0.3, 4);

  // Base bevel — slightly darker band at the very bottom for weight.
  g.fillStyle(DRAM_GLASS_OUTLINE, 0.85);
  g.fillRect(cx - 3.4, cy + 4, 6.8, 1);
}

function drawFirstFooterSilhouette(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Door frame hint — narrow vertical dark line on either side of the
  // figure to suggest the threshold the first-footer is crossing.
  g.fillStyle(0x080208, 0.6);
  g.fillRect(cx - 11, cy - 16, 1, 32);
  g.fillRect(cx + 10, cy - 16, 1, 32);
  // Door-floor strip below.
  g.fillStyle(0x080208, 0.3);
  g.fillRect(cx - 11, cy + 14, 22, 0.8);

  // Silhouette body — long winter coat (full-length, dark navy-black
  // so the figure reads as a near-black cutout against the warmer
  // hearth glow). Drawn as torso + flared coat hem.
  g.fillStyle(FOOTER_OUTLINE, 1);
  // Coat torso — rectangle narrowing from shoulders to waist.
  g.fillRoundedRect(cx - 4, cy - 4, 8, 14, 0.8);
  g.fillStyle(FOOTER_COAT, 1);
  g.fillRoundedRect(cx - 3.5, cy - 3.5, 7, 13, 0.6);
  // Coat hem flaring to the floor.
  g.fillStyle(FOOTER_OUTLINE, 1);
  g.fillTriangle(cx - 4, cy + 8, cx - 6, cy + 14, cx + 6, cy + 14);
  g.fillTriangle(cx - 4, cy + 8, cx + 6, cy + 14, cx + 4, cy + 8);
  g.fillStyle(FOOTER_COAT, 1);
  g.fillTriangle(cx - 3.5, cy + 8, cx - 5.2, cy + 13.6, cx + 5.2, cy + 13.6);
  g.fillTriangle(cx - 3.5, cy + 8, cx + 5.2, cy + 13.6, cx + 3.5, cy + 8);

  // Head — round, mostly silhouette with a sliver of warm-tan face.
  g.fillStyle(FOOTER_OUTLINE, 1);
  g.fillCircle(cx, cy - 7, 3);
  g.fillStyle(FOOTER_FACE, 0.55);
  g.fillCircle(cx + 0.4, cy - 7, 2.4);
  // Dark hair — the LOAD-BEARING detail per Hogmanay folk-tradition
  // (a dark-haired first-footer is the lucky one). Cap-shape on top.
  g.fillStyle(FOOTER_HAIR, 1);
  g.fillCircle(cx, cy - 8.4, 2.6);
  g.fillRect(cx - 2.4, cy - 8.5, 4.8, 1.4);

  // Gift in arms — small dark parcel held against the chest. Tied
  // with twine. Represents the traditional first-footing offerings:
  // shortbread / coal / silver.
  g.fillStyle(FOOTER_GIFT, 1);
  g.fillRoundedRect(cx - 3, cy - 1, 6, 4, 0.4);
  g.fillStyle(FOOTER_GIFT_HI, 0.7);
  g.fillRect(cx - 2.6, cy - 0.6, 5.2, 0.5);
  // Twine cross — single vertical + single horizontal stroke across
  // the parcel.
  g.fillStyle(FOOTER_HAIR, 1);
  g.fillRect(cx - 0.3, cy - 1, 0.6, 4);
  g.fillRect(cx - 3, cy + 0.7, 6, 0.4);

  // Single coin glint at the parcel edge — the silver / gold piece
  // traditionally tucked into the gift bundle.
  g.fillStyle(COIN_GOLD, 1);
  g.fillCircle(cx + 2.4, cy + 2.6, 0.7);
  g.fillStyle(0xfff0c8, 0.95);
  g.fillCircle(cx + 2.2, cy + 2.4, 0.3);
}
