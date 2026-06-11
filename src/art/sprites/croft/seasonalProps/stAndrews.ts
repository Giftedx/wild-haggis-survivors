import * as Phaser from 'phaser';
import type { CroftLayout } from '../../../../scenes/croft/CroftComposition';
import { drawSegment } from './_shared';
// ── St Andrew's palette ──────────────────────────────────────────

const SALTIRE_BLUE = 0x0a4a8a;
const SALTIRE_BLUE_DARK = 0x062a5a;
const SALTIRE_BLUE_HI = 0x3a78b8;
const SALTIRE_WHITE = 0xfaf8f0;
const SALTIRE_WHITE_HI = 0xffffff;
const SALTIRE_TWINE = 0x4a3018;
const HERRING_OUTLINE = 0x180a02;
const HERRING_BACK = 0x1a3848;
const HERRING_BELLY = 0xc8c4b0;
const HERRING_HI = 0xeae6cc;
const HERRING_FIN = 0x3a5060;
const HERRING_GILL = 0x682820;
const HERRING_EYE = 0xfff0c8;
const HERRING_PLATE = 0xa89a82;
const HERRING_PLATE_HI = 0xc8baa0;
const HERRING_GARNISH = 0x3a6a18;

/**
 * St Andrew's Day croft props (Nov 27 – Dec 3 window). Closes the
 * cohort prop authoring 8/8.
 *
 * The Scottish national-day set: a saltire bunting flag strung
 * across the mantelpiece (the white-X-on-blue cross — load-bearing
 * national symbol per SCOTTISH_RESEARCH §13), plus a smoked
 * herring (kipper) on a plate beside the table — Andrew is the
 * fisher-saint (Sea of Galilee net-mender; patron of fishing
 * villages from Anstruther to Stornoway), so the fisher-meal is
 * the diegetic feast for his day.
 */
export function drawStAndrewsProps(
  g: Phaser.GameObjects.Graphics,
  layout: CroftLayout,
): void {
  drawSaltireBunting(g, layout.mantelpiece.x + 12, layout.mantelpiece.y - 6);
  drawSmokedHerring(g, layout.table.x, layout.table.y);
}

function drawSaltireBunting(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Twine line — thin string the bunting hangs from. Catenary
  // approximated by drawing two segments dipping at the centre.
  const lineLen = 22;
  g.fillStyle(SALTIRE_TWINE, 1);
  drawSegment(g, cx - lineLen / 2, cy - 2, cx, cy + 0.5, 0.4);
  drawSegment(g, cx, cy + 0.5, cx + lineLen / 2, cy - 2, 0.4);

  // Three saltire flags strung along the line — left, centre, right.
  // Centre flag dips lowest (catenary low point).
  drawSingleSaltireFlag(g, cx - 7, cy - 0.5);
  drawSingleSaltireFlag(g, cx, cy + 1.5);
  drawSingleSaltireFlag(g, cx + 7, cy - 0.5);
}

function drawSingleSaltireFlag(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  const w = 6;
  const h = 4.5;

  // Flag shadow — slightly behind the flag itself.
  g.fillStyle(0x000000, 0.18);
  g.fillRect(cx - w / 2 + 0.4, cy + 0.4, w, h);

  // Flag body — saltire blue background.
  g.fillStyle(SALTIRE_BLUE_DARK, 1);
  g.fillRect(cx - w / 2, cy, w, h);
  g.fillStyle(SALTIRE_BLUE, 1);
  g.fillRect(cx - w / 2 + 0.3, cy + 0.3, w - 0.6, h - 0.6);
  // Subtle blue highlight band — wind-catch on the upper edge.
  g.fillStyle(SALTIRE_BLUE_HI, 0.5);
  g.fillRect(cx - w / 2 + 0.4, cy + 0.4, w - 0.8, 0.6);

  // White saltire X — two diagonal bands crossing the flag. Drawn as
  // sequential thick segments so the diagonals read at small scale
  // even after rasterization.
  g.fillStyle(SALTIRE_WHITE, 1);
  drawDiagonalBand(g, cx - w / 2 + 0.4, cy + 0.4, cx + w / 2 - 0.4, cy + h - 0.4, 1.0);
  drawDiagonalBand(g, cx - w / 2 + 0.4, cy + h - 0.4, cx + w / 2 - 0.4, cy + 0.4, 1.0);

  // Bright cross-centre — the X intersection catches the candlelight.
  g.fillStyle(SALTIRE_WHITE_HI, 1);
  g.fillCircle(cx, cy + h / 2, 0.6);

  // Twine attachment dot at top-centre — hangs the flag from the line.
  g.fillStyle(SALTIRE_TWINE, 1);
  g.fillCircle(cx, cy - 0.2, 0.4);
}

/**
 * Draw a wide diagonal band as a row of overlapping circles. Used
 * for the saltire-X strokes; uniform width across the diagonal
 * regardless of slope (the perpendicular-projection a thicker
 * `fillRect` rotation would need is overkill at this scale).
 */
function drawDiagonalBand(
  g: Phaser.GameObjects.Graphics,
  x0: number, y0: number,
  x1: number, y1: number,
  w: number,
): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const steps = Math.max(4, Math.ceil(Math.sqrt(dx * dx + dy * dy) * 2));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    g.fillCircle(x0 + dx * t, y0 + dy * t, w / 2);
  }
}

function drawSmokedHerring(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Plate underneath — pale porcelain.
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(cx, cy + 4, 18, 2);
  g.fillStyle(HERRING_PLATE, 0.85);
  g.fillEllipse(cx, cy + 1.8, 16, 4.5);
  g.fillStyle(HERRING_PLATE_HI, 0.85);
  g.fillEllipse(cx, cy + 1.4, 13, 3);

  // Fish silhouette — long oval body with tapering tail.
  g.fillStyle(HERRING_OUTLINE, 1);
  g.fillEllipse(cx - 1, cy, 13, 4.5);
  // Tail fluke — triangular fan at the right edge.
  g.fillTriangle(cx + 5, cy, cx + 8, cy - 2, cx + 8, cy + 2);
  g.fillTriangle(cx + 5, cy, cx + 8, cy + 2, cx + 7, cy);

  // Top half — smoked-blue back with darker dorsal stripe.
  g.fillStyle(HERRING_BACK, 1);
  g.fillEllipse(cx - 1, cy - 0.4, 12, 3.4);
  // Dorsal darker line.
  g.fillStyle(HERRING_OUTLINE, 0.6);
  g.fillRect(cx - 6, cy - 1.6, 11, 0.5);

  // Belly — pale buttery underside.
  g.fillStyle(HERRING_BELLY, 1);
  g.fillEllipse(cx - 1, cy + 0.6, 11.5, 2.8);
  // Belly highlight — bright cream ribbon along the lower curve.
  g.fillStyle(HERRING_HI, 0.85);
  g.fillEllipse(cx - 1, cy + 1.2, 8, 1.2);

  // Dorsal fin — small triangular ridge on top.
  g.fillStyle(HERRING_FIN, 1);
  g.fillTriangle(cx - 2, cy - 1.6, cx, cy - 3.4, cx + 1, cy - 1.6);

  // Pectoral fin — small fan near the gills.
  g.fillStyle(HERRING_FIN, 1);
  g.fillTriangle(cx - 4, cy + 0.6, cx - 5, cy + 2.4, cx - 3, cy + 1.6);

  // Gill slit — dark curve behind the eye.
  g.fillStyle(HERRING_GILL, 1);
  g.fillEllipse(cx - 4.5, cy - 0.4, 1.2, 1.8);

  // Eye — small bright ring on the head.
  g.fillStyle(HERRING_OUTLINE, 1);
  g.fillCircle(cx - 5.5, cy - 0.6, 0.7);
  g.fillStyle(HERRING_EYE, 1);
  g.fillCircle(cx - 5.6, cy - 0.7, 0.4);
  g.fillStyle(0x180a02, 1);
  g.fillCircle(cx - 5.55, cy - 0.65, 0.2);

  // Tiny scale-stipple along the back — three dots reading as the
  // herring's silver-flecked scale pattern.
  g.fillStyle(HERRING_HI, 0.7);
  g.fillCircle(cx - 3, cy - 0.8, 0.3);
  g.fillCircle(cx, cy - 0.8, 0.3);
  g.fillCircle(cx + 3, cy - 0.8, 0.3);

  // Garnish sprig — a small parsley fleck at the head end of the
  // plate. Reads as "served fresh" at small scale.
  g.fillStyle(HERRING_GARNISH, 1);
  g.fillCircle(cx - 7.5, cy + 1.6, 0.6);
  g.fillCircle(cx - 8.2, cy + 1.2, 0.5);
  g.fillCircle(cx - 7.8, cy + 0.6, 0.45);
}

