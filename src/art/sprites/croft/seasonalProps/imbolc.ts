import * as Phaser from 'phaser';
import type { CroftLayout } from '../../../../scenes/croft/CroftComposition';
import { drawSegment } from './_shared';
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
export function drawImbolcProps(
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

