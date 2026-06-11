import * as Phaser from 'phaser';
import type { CroftLayout } from '../../../../scenes/croft/CroftComposition';
import { drawSegment } from './_shared';
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
export function drawBrackenTurnProps(
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


