import * as Phaser from 'phaser';
import type { CroftLayout } from '../../../../scenes/croft/CroftComposition';
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

export function drawBurnsNightProps(
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

