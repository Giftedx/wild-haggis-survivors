/**
 * Upgrade-card icons — `ucard_*` 32×32 textures shown on the level-up
 * card selection. Nine passive-accessory cards + nine stat-boost
 * cards = 18 icons total. Each has a shared dark rounded frame with
 * a category-tinted inner fill via `cardIconBg`.
 *
 * Consolidated into one file for the same reason as weapons.ts: they
 * share a style (shared bg helper, 32×32, centre-composition) and
 * read as families at the call site.
 */

import * as Phaser from 'phaser';
import { resolveKiltPalette, HIGHLAND_TARTAN } from '../../kiltPalette';
import { VARIANT_KEYS } from '../../../data/variants';

/**
 * Shared card icon background — dark border, tinted interior, subtle
 * corner roundness. Used by every card icon in this file.
 */
function cardIconBg(g: Phaser.GameObjects.Graphics, s: number, bgColor: number): void {
  g.fillStyle(0x0b111c, 1);
  g.fillRoundedRect(1, 1, s - 2, s - 2, 6);
  g.fillStyle(bgColor, 1);
  g.fillRoundedRect(3, 3, s - 6, s - 6, 4);
}

// ═══════════════════════════════════════════════════════════════════════════
//  PASSIVE CARD ICONS — culturally-loaded accessories
// ═══════════════════════════════════════════════════════════════════════════

/**
 * `ucard_sporran` — Highland sporran pickup icon. Design pivot: old
 * icon read as "generic fur pouch" with no Scottish specificity at
 * 32px. New pitch — proper sporran hanging FROM A KILT BELT (brown
 * strap with brass buckle at top), ORNATE BRASS CANTLE plate with
 * a thistle emblem across the top of the pouch, FUR POUCH BODY with
 * visible tufts, and THREE LONG HORSE-HAIR TASSELS with brass caps
 * hanging 60%+ of pouch height. Every anchor says "worn-as-kilt-
 * accessory" rather than "leather bag".
 */
function drawSporran(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x3d2a20);
  const cx = 16, cy = 16;

  // ── KILT BELT — brown strap across the top, establishes that
  // this is worn at the waist. ──
  g.fillStyle(0x1a0e06, 1);
  g.fillRect(cx - 14, cy - 10, 28, 3);
  g.fillStyle(0x3a2212, 1);
  g.fillRect(cx - 14, cy - 10, 28, 1.5);
  // Brass belt buckle at centre
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx - 2, cy - 10, 4, 3);
  g.fillStyle(0xfadc6a, 1);
  g.fillRect(cx - 2, cy - 10, 4, 1);

  // ── BRASS CANTLE — ornate metal plate across the top of the
  // pouch. Unmistakable "sporran" architectural detail. ──
  g.fillStyle(0x5a3810, 1);
  g.fillRect(cx - 10, cy - 7, 20, 4);
  g.fillStyle(0xc8a848, 1);
  g.fillRect(cx - 9, cy - 7, 18, 3);
  g.fillStyle(0xfadc6a, 1);
  g.fillRect(cx - 9, cy - 7, 18, 0.8);
  // THISTLE emblem centred on the cantle — Scottish anchor
  g.fillStyle(0x4a1a6a, 1);
  g.fillCircle(cx, cy - 5.5, 1.3);
  g.fillStyle(0x2a5a14, 1);
  g.fillRect(cx - 0.5, cy - 4.5, 1, 1);
  g.fillStyle(0x6a2a9a, 1);
  g.fillCircle(cx - 0.2, cy - 5.8, 0.6);

  // ── FUR POUCH BODY — dark brown with visible tufts. Taller
  // and more rectangular than a generic oval. ──
  g.fillStyle(0x1a0e06, 1);
  g.fillRoundedRect(cx - 9, cy - 3, 18, 13, 3);
  g.fillStyle(0x3a2212, 1);
  g.fillRoundedRect(cx - 8, cy - 2, 16, 11, 2.5);
  // Fur tufts — short vertical strokes showing hair texture
  g.fillStyle(0x5a3212, 0.95);
  for (let i = 0; i < 14; i++) {
    g.fillRect(cx - 7 + i, cy - 1.5 + (i % 3) * 0.6, 0.6, 2.2);
  }
  // Lower shadow on the pouch (weight hangs down)
  g.fillStyle(0x0a0604, 0.55);
  g.fillRect(cx - 8, cy + 5, 16, 4);

  // ── THREE LONG HORSE-HAIR TASSELS — the signature silhouette
  // tell. Each has a brass cap at the top + dark horsehair body
  // + splayed fringe at the tip. Hang well below the pouch. ──
  const tasselXs = [cx - 5, cx, cx + 5];
  for (const tx of tasselXs) {
    // Brass cap at top
    g.fillStyle(0xc8a848, 1);
    g.fillRect(tx - 1.3, cy + 9, 2.6, 1.5);
    g.fillStyle(0xfadc6a, 1);
    g.fillRect(tx - 1.3, cy + 9, 2.6, 0.5);
    // Tassel body — dark horsehair column
    g.fillStyle(0x1a0e06, 1);
    g.fillRect(tx - 1, cy + 10.5, 2, 3.5);
    g.fillStyle(0x3a2010, 1);
    g.fillRect(tx - 0.5, cy + 10.5, 1, 3.5);
    // Splayed fringe strands at the tip
    g.fillStyle(0x1a0e06, 1);
    g.fillRect(tx - 1.6, cy + 14, 0.6, 1.8);
    g.fillRect(tx - 0.3, cy + 14, 0.6, 1.8);
    g.fillRect(tx + 1, cy + 14, 0.6, 1.8);
  }

  g.generateTexture('ucard_sporran', s, s);
  g.destroy();
}

/**
 * `ucard_whisky_flask` — hip flask pickup icon. Design pivot (v2):
 * old icon had tartan label too thin + amber porthole too small to
 * read as "Scottish whisky" at 32px. New pitch — classic hip-flask
 * silhouette with a BIG AMBER WINDOW occupying the lower 2/3 of
 * the body (glass-panel flask showing the golden contents), tartan
 * label band across the SHOULDER (Royal Stewart red + green + gold),
 * and a bright gold whisky meniscus line. The amber glow is now
 * the dominant colour tell — "this is whisky, not a generic flask".
 */
function drawWhiskyFlask(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x332211);
  const cx = 16, cy = 16;

  // ── Screw cap on top — tapered brass flask cap. ──
  g.fillStyle(0x1a1008, 1);
  g.fillRect(cx - 3, cy - 12, 6, 3);
  g.fillStyle(0x5a3818, 1);
  g.fillRect(cx - 3, cy - 12, 6, 2);
  g.fillStyle(0x8a6028, 1);
  g.fillRect(cx - 2.5, cy - 12, 5, 0.6);
  // Cap ridges
  g.fillStyle(0x1a1008, 1);
  g.fillRect(cx - 3, cy - 11, 6, 0.4);
  g.fillRect(cx - 3, cy - 10.3, 6, 0.4);

  // ── Flask neck — narrow column between cap and body. ──
  g.fillStyle(0x2a2a32, 1);
  g.fillRect(cx - 2, cy - 9, 4, 3);
  g.fillStyle(0x6a6a72, 1);
  g.fillRect(cx - 2, cy - 9, 4, 1);

  // ── FLASK BODY — classic kidney-bean hip-flask curve. Pewter
  // outer shell acts as a frame around the amber window. ──
  g.fillStyle(0x0a0a12, 1);
  g.fillRoundedRect(cx - 9, cy - 6, 18, 18, 5);
  g.fillStyle(0x5a5a68, 1);
  g.fillRoundedRect(cx - 8, cy - 5, 16, 16, 4);

  // ── BIG AMBER WHISKY WINDOW — occupies the lower 2/3 of the
  // flask. Glass panel showing the golden contents. This is the
  // dominant silhouette tell — the icon reads "whisky" at a glance. ──
  g.fillStyle(0x3a1a04, 1);
  g.fillRoundedRect(cx - 6, cy - 2, 12, 11, 2);
  g.fillStyle(0xa06818, 1);
  g.fillRoundedRect(cx - 5.5, cy - 1.5, 11, 10, 1.8);
  g.fillStyle(0xd88a28, 1);
  g.fillRoundedRect(cx - 5.5, cy - 1.5, 11, 7, 1.8);
  g.fillStyle(0xf8b040, 1);
  g.fillRoundedRect(cx - 5.5, cy - 1.5, 11, 3.5, 1.8);
  // Bright amber highlight — sells the glow
  g.fillStyle(0xffd878, 0.92);
  g.fillRect(cx - 4, cy, 3, 6);
  g.fillStyle(0xfff0c0, 0.9);
  g.fillRect(cx - 4, cy, 1.5, 6);
  // Whisky meniscus — gold surface line
  g.fillStyle(0xfff0c0, 0.85);
  g.fillRect(cx - 5, cy - 1, 10, 0.6);

  // ── TARTAN LABEL BAND — wraps across the SHOULDER of the flask
  // above the amber window. Royal Stewart red + dark green + gold. ──
  g.fillStyle(0x0a0000, 1);
  g.fillRect(cx - 9, cy - 6, 18, 3);
  g.fillStyle(0x8a1818, 1);
  g.fillRect(cx - 9, cy - 5.5, 18, 2.5);
  // Dark green crossbar
  g.fillStyle(0x0a3018, 0.9);
  g.fillRect(cx - 9, cy - 4.6, 18, 0.8);
  // Gold vertical stripes
  g.fillStyle(0xdaaa40, 1);
  g.fillRect(cx - 6, cy - 5.5, 0.6, 2.5);
  g.fillRect(cx + 1, cy - 5.5, 0.6, 2.5);
  g.fillRect(cx + 5, cy - 5.5, 0.6, 2.5);
  // Cream highlight line
  g.fillStyle(0xf0e8c8, 0.7);
  g.fillRect(cx - 8, cy - 5.3, 16, 0.3);

  // ── Pewter sheen highlight on the left edge of the flask. ──
  g.fillStyle(0xbabac8, 0.8);
  g.fillRect(cx - 7, cy - 3, 0.8, 14);
  g.fillStyle(0xdcdce8, 0.85);
  g.fillRect(cx - 7.5, cy - 3, 0.4, 14);

  // ── Small chain linking cap to body. ──
  g.lineStyle(0.7, 0x6a6a72, 1);
  g.lineBetween(cx + 3, cy - 11, cx + 7, cy - 6);

  g.generateTexture('ucard_whisky_flask', s, s);
  g.destroy();
}

/** Darken a hex color by multiplying each channel. */
function darkenHex(hex: number, factor: number): number {
  const r = Math.floor(((hex >> 16) & 0xff) * factor);
  const gg = Math.floor(((hex >> 8) & 0xff) * factor);
  const b = Math.floor((hex & 0xff) * factor);
  return (r << 16) | (gg << 8) | b;
}

function drawKilt(scene: Phaser.Scene, variantKey: string = 'classic'): void {
  const s = 32, g = scene.add.graphics();
  const palette = resolveKiltPalette(variantKey);
  const bgColor = darkenHex(palette.field, 0.3);
  cardIconBg(g, s, bgColor);
  const cx = 16;
  g.fillStyle(palette.fieldDark, 1);
  g.fillRect(cx - 10, 8, 20, 18);
  g.fillStyle(palette.field, 1);
  g.fillRect(cx - 9, 9, 18, 16);
  // 2-tone warp threads — primary stripe + 1px slightly-darker companion
  // immediately to the LEFT of each. Reads as "woven fabric" instead of
  // flat checks at 32px, killing the moiré read called out in the audit.
  const warpDark = darkenHex(palette.stripe, 0.55);
  g.fillStyle(palette.stripe, 0.7);
  g.fillRect(cx - 6, 9, 2, 16);
  g.fillRect(cx + 1, 9, 2, 16);
  g.fillRect(cx + 6, 9, 2, 16);
  g.fillStyle(warpDark, 0.55);
  g.fillRect(cx - 7, 9, 1, 16);
  g.fillRect(cx, 9, 1, 16);
  g.fillRect(cx + 5, 9, 1, 16);
  // 2-tone weft threads — primary stripe + 1px slightly-darker companion
  // one row below.
  g.fillStyle(palette.stripe, 0.5);
  g.fillRect(cx - 9, 12, 18, 1);
  g.fillRect(cx - 9, 17, 18, 1);
  g.fillRect(cx - 9, 22, 18, 1);
  g.fillStyle(warpDark, 0.4);
  g.fillRect(cx - 9, 13, 18, 1);
  g.fillRect(cx - 9, 18, 18, 1);
  g.fillRect(cx - 9, 23, 18, 1);
  g.fillStyle(palette.accent, 0.6);
  g.fillRect(cx - 9, 14, 18, 1);
  g.fillRect(cx - 9, 20, 18, 1);
  g.fillRect(cx - 2, 9, 1, 16);
  g.fillStyle(darkenHex(palette.fieldDark, 0.5), 0.4);
  g.fillRect(cx - 4, 9, 1, 16);
  g.fillRect(cx + 4, 9, 1, 16);
  g.fillStyle(0x2a1a0a, 1);
  g.fillRect(cx - 10, 7, 20, 3);
  g.fillStyle(0x3a2a1a, 1);
  g.fillRect(cx - 9, 8, 18, 1);
  // Belt highlight stroke — thin warm band along the top of the belt
  // gives the leather depth the audit said was missing.
  g.fillStyle(0x6a4818, 0.7);
  g.fillRect(cx - 9, 7.4, 18, 0.5);
  // Buckle — bumped from 4×3 to 5×4 so it actually reads at 32px
  // (audit: "buckle is tiny" called on every kilt). Layered shadow +
  // body + highlight + specular dot.
  g.fillStyle(0x4a3008, 1);
  g.fillRect(cx - 3, 6, 6, 5);
  g.fillStyle(0xccaa44, 1);
  g.fillRect(cx - 2.5, 6.5, 5, 4);
  g.fillStyle(0xffdd66, 1);
  g.fillRect(cx - 2, 7, 4, 1);
  g.fillStyle(0xfff0a8, 0.9);
  g.fillRect(cx - 1.5, 7.2, 1.5, 0.5);
  // Per-variant signature inset — placed in the kilt's lower-centre
  // dead space so it doesn't fight the tartan or the buckle. Each
  // motif is a tiny 2–3px tell that ties the card to its variant.
  drawKiltSignature(g, variantKey, cx);
  // Classic variant keeps the backwards-compat 'ucard_kilt' key;
  // all variants also get 'ucard_kilt_<key>'.
  const variantTexKey = `ucard_kilt_${variantKey}`;
  g.generateTexture(variantTexKey, s, s);
  if (variantKey === 'classic') {
    g.generateTexture('ucard_kilt', s, s);
  }
  g.destroy();
}

/**
 * Per-variant kilt signature inset. Drawn over the lower-centre tartan
 * field so it sits inside the kilt silhouette without touching belt or
 * buckle. Each motif is < 12 pixel ops and pulls from the variant's
 * thematic palette so the inset reads as "this kilt belongs to this
 * haggis", not as a generic ornament.
 */
function drawKiltSignature(
  g: Phaser.GameObjects.Graphics,
  variantKey: string,
  cx: number,
): void {
  const yc = 24;
  switch (variantKey) {
    case 'classic': {
      // Thistle pip — purple bloom + green calyx, the brand anchor.
      g.fillStyle(0x4a1a6a, 1);
      g.fillCircle(cx, yc - 1, 1.5);
      g.fillStyle(0x8a4ab0, 1);
      g.fillCircle(cx - 0.3, yc - 1.3, 0.9);
      g.fillStyle(0x2a5a14, 1);
      g.fillRect(cx - 0.5, yc, 1, 1.2);
      break;
    }
    case 'moor_runner': {
      // Green leaf — moor-grass speed.
      g.fillStyle(0x2a5a14, 1);
      g.fillTriangle(cx - 1.5, yc, cx + 1.5, yc, cx, yc - 2);
      g.fillStyle(0x6fb350, 0.9);
      g.fillRect(cx - 0.3, yc - 1.5, 0.6, 1.5);
      break;
    }
    case 'iron_belly': {
      // Rivet — armoured-belly tell, bright steel.
      g.fillStyle(0x2a2e35, 1);
      g.fillCircle(cx, yc - 1, 1.4);
      g.fillStyle(0x8a8a90, 1);
      g.fillCircle(cx, yc - 1, 1);
      g.fillStyle(0xddddee, 0.9);
      g.fillCircle(cx - 0.3, yc - 1.3, 0.4);
      break;
    }
    case 'glen_forager': {
      // Oat sprig — three berries on a stem.
      g.fillStyle(0xd4a017, 1);
      g.fillCircle(cx - 1.2, yc - 0.5, 0.7);
      g.fillCircle(cx, yc - 1.2, 0.7);
      g.fillCircle(cx + 1.2, yc - 0.5, 0.7);
      g.fillStyle(0x6a4a18, 1);
      g.fillRect(cx - 0.2, yc - 0.5, 0.5, 1.5);
      break;
    }
    case 'surefoot': {
      // Boot stud cluster — surefoot grip.
      g.fillStyle(0x1a0a04, 1);
      g.fillRect(cx - 2, yc - 1, 4, 1.5);
      g.fillStyle(0x8a8a90, 1);
      g.fillCircle(cx - 1.5, yc - 0.3, 0.4);
      g.fillCircle(cx, yc - 0.3, 0.4);
      g.fillCircle(cx + 1.5, yc - 0.3, 0.4);
      break;
    }
    case 'pipe_breath': {
      // Wisp — three shrinking ellipses for the moor-exhale.
      g.fillStyle(0xcceaf8, 0.85);
      g.fillEllipse(cx - 1.5, yc - 0.5, 2, 0.9);
      g.fillEllipse(cx + 0.5, yc - 1, 1.6, 0.7);
      g.fillEllipse(cx + 2, yc - 1.5, 1, 0.5);
      break;
    }
    case 'wee_ghostie': {
      // Halo dot — spectral ring + bright centre.
      g.lineStyle(0.6, 0xe0fcff, 0.85);
      g.strokeCircle(cx, yc - 1, 1.6);
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(cx, yc - 1, 0.7);
      break;
    }
    case 'laird': {
      // Crown pip — three gold tines and a ruby.
      g.fillStyle(0xd4a017, 1);
      g.fillRect(cx - 2, yc, 4, 1);
      g.fillTriangle(cx - 2, yc, cx - 1, yc - 1.3, cx, yc);
      g.fillTriangle(cx, yc, cx, yc - 1.6, cx + 1, yc);
      g.fillTriangle(cx, yc, cx + 1, yc - 1.3, cx + 2, yc);
      g.fillStyle(0xcc2222, 1);
      g.fillCircle(cx, yc - 0.8, 0.4);
      break;
    }
    case 'glaswegian': {
      // Traffic-cone wedge — Duke of Wellington tribute.
      g.fillStyle(0x1a0e06, 1);
      g.fillTriangle(cx - 1.5, yc, cx + 1.5, yc, cx, yc - 2.4);
      g.fillStyle(0xff6622, 1);
      g.fillTriangle(cx - 1.2, yc, cx + 1.2, yc, cx, yc - 2.2);
      g.fillStyle(0xffaa55, 0.85);
      g.fillRect(cx - 0.7, yc - 1, 1.4, 0.4);
      break;
    }
    case 'anticlockwise': {
      // Counter-clockwise spiral — motion cue.
      g.fillStyle(0xe0d8c0, 0.9);
      g.fillCircle(cx + 1, yc, 0.5);
      g.fillCircle(cx, yc - 1, 0.5);
      g.fillCircle(cx - 1, yc - 0.4, 0.5);
      g.fillCircle(cx - 0.5, yc + 0.5, 0.4);
      g.fillStyle(0xffffff, 0.95);
      g.fillTriangle(cx + 1.5, yc - 0.5, cx + 2, yc + 0.5, cx + 0.7, yc + 0.3);
      break;
    }
    case 'cailleach': {
      // Frost dot — winter-hag rime.
      g.fillStyle(0xcceaf8, 0.95);
      g.fillCircle(cx - 1.2, yc - 0.5, 0.6);
      g.fillCircle(cx + 1.2, yc - 0.5, 0.6);
      g.fillCircle(cx, yc - 1.2, 0.6);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(cx, yc - 0.8, 0.4);
      break;
    }
    case 'doric_quinie': {
      // Barley ear — Aberdeenshire harvest.
      g.fillStyle(0x6a4a18, 1);
      g.fillRect(cx, yc - 2, 0.6, 2);
      g.fillStyle(0xd4a017, 1);
      g.fillCircle(cx - 0.6, yc - 1.6, 0.5);
      g.fillCircle(cx + 1, yc - 1.6, 0.5);
      g.fillCircle(cx - 0.4, yc - 0.6, 0.5);
      g.fillCircle(cx + 0.8, yc - 0.6, 0.5);
      break;
    }
    case 'peerie_shetlander': {
      // White-cap wave glint — Shetland sea.
      g.fillStyle(0xcceaf8, 0.85);
      g.fillRect(cx - 2, yc - 0.3, 4, 0.7);
      g.fillStyle(0xffffff, 0.95);
      g.fillCircle(cx - 1, yc, 0.4);
      g.fillCircle(cx + 1, yc, 0.4);
      break;
    }
    case 'burns_wee_beastie': {
      // Rolled scroll — poet's tribute.
      g.fillStyle(0xe8d8a8, 1);
      g.fillRect(cx - 2, yc - 0.8, 4, 1.4);
      g.fillStyle(0xfff0c8, 1);
      g.fillRect(cx - 2, yc - 0.8, 4, 0.4);
      g.fillStyle(0x6a4a18, 1);
      g.fillCircle(cx - 2, yc - 0.1, 0.6);
      g.fillCircle(cx + 2, yc - 0.1, 0.6);
      g.fillStyle(0x111111, 0.85);
      g.fillCircle(cx, yc, 0.3);
      break;
    }
    default:
      break;
  }
}

/**
 * `ucard_tam_o_shanter` — Scottish Blue Bonnet (tam o' shanter).
 * Design pivot (v2): prior icon used a diced red/white chequer band
 * with 2×2 pixel squares that resolved to "noise stripe" at 1× scale,
 * leaving only the pom-pom as a read so the silhouette said "any
 * round hat". New pitch: classic Blue Bonnet — flat wide dark-blue
 * beret body + BOLD RED TOORIE (pom-pom) dominant on top + solid
 * dark headband + small silver cap-badge as the Scottish anchor.
 * Single-colour band lets the toorie pop instead of competing.
 */
function drawTamOShanter(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x2a2238);
  const cx = 16, cy = 17;
  // ── Flat wide beret body — the Blue Bonnet silhouette. ──
  g.fillStyle(0x050a1a, 1);
  g.fillEllipse(cx, cy + 1, 26, 12);
  g.fillStyle(0x152245, 1);
  g.fillEllipse(cx, cy, 24, 10);
  g.fillStyle(0x253365, 1);
  g.fillEllipse(cx - 1, cy - 1, 20, 8);
  g.fillStyle(0x3a4a8a, 0.7);
  g.fillEllipse(cx - 2, cy - 2, 12, 4);
  // ── Solid dark headband (no chequers — chequers blur at 1×). ──
  g.fillStyle(0x050812, 1);
  g.fillRect(cx - 13, cy + 6, 26, 4);
  g.fillStyle(0x152245, 1);
  g.fillRect(cx - 12, cy + 6, 24, 1);
  // ── Silver cap-badge on the band front — Scottish regimental tell. ──
  g.fillStyle(0x2a2a2a, 1);
  g.fillCircle(cx, cy + 8, 2);
  g.fillStyle(0xaaaaaa, 1);
  g.fillCircle(cx, cy + 8, 1.5);
  g.fillStyle(0xeeeeee, 1);
  g.fillCircle(cx - 0.3, cy + 7.7, 0.7);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx - 0.5, cy + 7.5, 0.3);
  // ── BOLD RED TOORIE (pom-pom) — dominant anchor, 4-layer specular. ──
  g.fillStyle(0x3a0404, 1);
  g.fillCircle(cx, cy - 7, 5);
  g.fillStyle(0x881010, 1);
  g.fillCircle(cx, cy - 7, 4.3);
  g.fillStyle(0xcc2020, 1);
  g.fillCircle(cx - 0.5, cy - 7.5, 3.3);
  g.fillStyle(0xee4040, 1);
  g.fillCircle(cx - 1, cy - 8, 2);
  g.fillStyle(0xff8070, 0.9);
  g.fillCircle(cx - 1.3, cy - 8.3, 1);
  g.fillStyle(0xffddbb, 0.8);
  g.fillCircle(cx - 1.5, cy - 8.5, 0.5);
  // Pom fibres — faint texture dots around the toorie edge
  g.fillStyle(0x3a0404, 0.7);
  g.fillCircle(cx + 2.5, cy - 5.5, 0.5);
  g.fillCircle(cx - 3, cy - 5, 0.5);
  g.fillCircle(cx + 3, cy - 8, 0.4);
  g.fillCircle(cx - 2.5, cy - 9, 0.4);
  g.generateTexture('ucard_tam_o_shanter', s, s);
  g.destroy();
}

/**
 * `ucard_irn_bru` — Scottish health drink icon. Design pivot: old
 * icon had a thin blue stripe on an orange bottle — read as "any
 * generic orange soda" because the Scottish anchor was too faint
 * at 32px. New pitch — clear bottle full of ORANGE Irn-Bru with a
 * BOLD BLUE LABEL featuring a WHITE SALTIRE (Scottish flag cross)
 * and yellow trim stripes. Blue + yellow + orange = unmistakable
 * Irn-Bru brand palette; the saltire locks in "Scottish".
 */
function drawIrnBru(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x44220f);
  const cx = 16;

  // ── Bottle cap — dark blue with yellow rim (Irn-Bru brand). ──
  g.fillStyle(0x0a1a44, 1);
  g.fillRect(cx - 3, 4, 6, 4);
  g.fillStyle(0x2244aa, 1);
  g.fillRect(cx - 3, 4, 6, 3);
  g.fillStyle(0xffcc22, 1);
  g.fillRect(cx - 3, 7, 6, 1);
  // Cap ridges
  g.fillStyle(0x0a1a44, 1);
  g.fillRect(cx - 3, 5, 6, 0.4);
  g.fillRect(cx - 3, 6, 6, 0.4);

  // ── Bottle neck. ──
  g.fillStyle(0x0a0a12, 1);
  g.fillRect(cx - 2, 8, 4, 2);

  // ── BOTTLE BODY outline + ORANGE IRN-BRU liquid. The orange
  // is the dominant tell. ──
  g.fillStyle(0x1a0a00, 1);
  g.fillRoundedRect(cx - 7, 10, 14, 16, 3);
  g.fillStyle(0xdd5500, 1);
  g.fillRoundedRect(cx - 6, 11, 12, 14, 2);
  g.fillStyle(0xff7711, 1);
  g.fillRoundedRect(cx - 6, 12, 12, 12, 2);
  g.fillStyle(0xff9933, 1);
  g.fillRoundedRect(cx - 5, 12, 10, 10, 1.5);
  // Orange fizz highlight
  g.fillStyle(0xffbb55, 0.85);
  g.fillRect(cx - 3, 13, 3, 8);
  g.fillStyle(0xffdd88, 0.55);
  g.fillRect(cx - 2, 14, 2, 7);

  // ── BLUE LABEL BAND with WHITE SALTIRE — the Scottish-flag
  // anchor. Unmistakable Irn-Bru + Scotland. ──
  g.fillStyle(0x0a0a2a, 1);
  g.fillRect(cx - 7, 15.5, 14, 8);
  g.fillStyle(0x1a3a88, 1);
  g.fillRect(cx - 7, 16, 14, 7);
  // WHITE SALTIRE — two diagonals crossing
  g.lineStyle(1.6, 0xffffff, 1);
  g.lineBetween(cx - 6, 16.5, cx + 6, 22.5);
  g.lineBetween(cx + 6, 16.5, cx - 6, 22.5);
  // Yellow trim stripes top + bottom of label
  g.fillStyle(0xffcc22, 1);
  g.fillRect(cx - 7, 15.5, 14, 0.6);
  g.fillRect(cx - 7, 22.8, 14, 0.6);

  // ── Glass sheen highlight. ──
  g.fillStyle(0xffffff, 0.3);
  g.fillRect(cx - 6, 12, 1.5, 13);
  g.fillStyle(0xffffff, 0.15);
  g.fillRect(cx - 5, 12, 0.8, 13);

  g.generateTexture('ucard_irn_bru', s, s);
  g.destroy();
}

/**
 * `ucard_loch_water` — loch-water pickup icon. Design pivot (v2):
 * old icon tried to paint a whole miniature loch scene inside the
 * jar — two mountains, snow caps, ripples, inverted reflection —
 * and everything collapsed to a blue-green smudge at 32px. New
 * pitch: strip to ONE bold mountain silhouette with a single snow
 * cap, a thick teal water band filling the lower half, one clean
 * ripple line, and a prominent glass rim/sheen. The silhouette
 * anchor is "bottled mountain-and-water" not "detailed landscape".
 */
function drawLochWater(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x12334a);
  const cx = 16;

  // ── Cork stopper on top — classic "bottled" signal. ──
  g.fillStyle(0x4a3018, 1);
  g.fillRect(cx - 4, 3, 8, 4);
  g.fillStyle(0x8a6838, 1);
  g.fillRect(cx - 4, 3, 8, 3);
  g.fillStyle(0xaa8040, 1);
  g.fillRect(cx - 3.5, 3, 7, 1);

  // ── Jar neck — short narrow column. ──
  g.fillStyle(0x0a2030, 1);
  g.fillRect(cx - 3.5, 7, 7, 3);
  g.fillStyle(0x2a5a80, 0.75);
  g.fillRect(cx - 3, 7, 6, 2.5);

  // ── Glass jar body — wide rounded rect. Dark outline + lighter
  // interior. ──
  g.fillStyle(0x0a1820, 1);
  g.fillRoundedRect(cx - 10, 9, 20, 19, 4);
  g.fillStyle(0x1a3a58, 1);
  g.fillRoundedRect(cx - 9, 10, 18, 17, 3);

  // ── BIG MOUNTAIN — ONE bold silhouette filling upper-mid of the
  // jar. Dark slate purple. Apex near 13-14 for clarity. ──
  g.fillStyle(0x0a1028, 1);
  g.fillTriangle(cx - 8, 22, cx, 11, cx + 8, 22);
  g.fillStyle(0x1a1e40, 1);
  g.fillTriangle(cx - 7, 22, cx, 12, cx + 7, 22);
  // Shaded right face (darker)
  g.fillStyle(0x0a0e20, 0.85);
  g.fillTriangle(cx, 12, cx + 7, 22, cx + 1, 22);
  // Sunlit left face (lighter)
  g.fillStyle(0x2a2e58, 1);
  g.fillTriangle(cx - 6, 22, cx, 13, cx - 1, 22);

  // ── SNOW CAP — single bold white triangle at the apex. Large
  // enough to read at 32px. ──
  g.fillStyle(0xffffff, 1);
  g.fillTriangle(cx - 2, 14, cx, 11, cx + 2, 14);
  // Snow-tail drip on the left face
  g.fillStyle(0xe0e8f0, 1);
  g.fillTriangle(cx - 2, 14, cx - 1, 14, cx - 1.5, 15.5);

  // ── TEAL WATER BAND — thick horizontal band at the lower half.
  // Bold so it reads as "water" instantly. ──
  g.fillStyle(0x1a4a68, 1);
  g.fillRect(cx - 9, 22, 18, 5);
  g.fillStyle(0x2a7aa0, 1);
  g.fillRect(cx - 9, 22, 18, 2);
  g.fillStyle(0x4a9ac0, 1);
  g.fillRect(cx - 9, 22, 18, 0.8);

  // ── ONE CLEAN RIPPLE — single curved line across the water. ──
  g.fillStyle(0xcceaf8, 1);
  g.fillRect(cx - 5, 24.5, 8, 0.6);
  g.fillRect(cx - 6, 25, 2, 0.5);
  g.fillRect(cx + 4, 25, 3, 0.5);

  // ── Glass rim highlight — crisp white band at the top of the
  // jar body. ──
  g.fillStyle(0xffffff, 0.7);
  g.fillRect(cx - 9, 10, 18, 0.6);

  // ── Glass sheen — single vertical highlight on the left edge. ──
  g.fillStyle(0xffffff, 0.45);
  g.fillRect(cx - 9, 11, 1, 15);

  g.generateTexture('ucard_loch_water', s, s);
  g.destroy();
}

/**
 * `ucard_thistle_crown` — crown fashioned from a thistle. Design pivot
 * (v2): prior icon was gold tines + band + bare purple ball on top +
 * loose gems. The thistle read was weak — just a purple circle with
 * no plant anchor (no green, no spikes, no calyx). Looked like any
 * crown with a jewel. New pitch: BIG THISTLE BLOOM dominates the top
 * half with GREEN SPIKY CALYX (the armoured cup that says "thistle"
 * unmistakably), bristly PURPLE/PINK FLORETS fanning upward, lower
 * gold crown band with just THREE tines (reduced from five so the
 * thistle wins centre-mass). Single ruby at band-centre as the royal
 * gem. Green leaves flank the calyx so "plant" reads even before
 * colour registers. Crown + thistle now stack cleanly, thistle wins.
 */
function drawThistleCrown(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x3a214d);
  const cx = 16, cy = 18;

  // Lower crown band — brass/gold, thick chunky band
  g.fillStyle(0x5a4008, 1);
  g.fillRect(cx - 10, cy + 4, 20, 5);
  g.fillStyle(0xbb8818, 1);
  g.fillRect(cx - 10, cy + 5, 20, 3);
  g.fillStyle(0xffdd55, 1);
  g.fillRect(cx - 10, cy + 5, 20, 1);
  // Band bottom shadow line
  g.fillStyle(0x2a1c04, 1);
  g.fillRect(cx - 10, cy + 8, 20, 1);

  // Three small gold tines on the band — low profile so thistle dominates
  const tines = [-7, 0, 7];
  const theights = [3, 4, 3];
  for (let i = 0; i < 3; i++) {
    const tx = cx + tines[i];
    const th = theights[i];
    g.fillStyle(0x5a4008, 1);
    g.fillTriangle(tx - 2, cy + 5, tx, cy + 5 - th, tx + 2, cy + 5);
    g.fillStyle(0xbb8818, 1);
    g.fillTriangle(tx - 1.3, cy + 5, tx, cy + 6 - th, tx + 1.3, cy + 5);
    g.fillStyle(0xffdd55, 0.85);
    g.fillTriangle(tx - 0.6, cy + 5, tx, cy + 6.5 - th, tx, cy + 5);
  }

  // Ruby at band centre — royal gem
  g.fillStyle(0x5a0404, 1);
  g.fillCircle(cx, cy + 6.5, 1.8);
  g.fillStyle(0xcc1818, 1);
  g.fillCircle(cx, cy + 6.5, 1.3);
  g.fillStyle(0xff5a4a, 1);
  g.fillCircle(cx - 0.3, cy + 6.2, 0.6);

  // GREEN SPIKY CALYX — the armoured cup that makes this specifically
  // a thistle not any round flower. Pointed green triangles forming
  // a bulb under the bloom.
  g.fillStyle(0x1a3a0a, 1);
  g.fillEllipse(cx, cy - 1, 9, 5);
  g.fillStyle(0x2a5a18, 1);
  g.fillEllipse(cx, cy - 2, 7.5, 4);
  g.fillStyle(0x4a8a28, 1);
  g.fillEllipse(cx - 1, cy - 2.5, 4, 2);
  // Calyx spike points — 5 pointed triangles around the top rim
  g.fillStyle(0x1a3a0a, 1);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.4;
    const sx = cx + Math.cos(a) * 4;
    const sy = cy - 2 + Math.sin(a) * 2;
    g.fillTriangle(sx - 1, sy + 0.5, sx + 1, sy + 0.5, sx + Math.cos(a) * 1.5, sy + Math.sin(a) * 1.5 - 1);
  }
  g.fillStyle(0x4a8a28, 0.9);
  g.fillTriangle(cx - 3.5, cy - 3, cx - 2.5, cy - 3, cx - 3, cy - 5);
  g.fillTriangle(cx + 2.5, cy - 3, cx + 3.5, cy - 3, cx + 3, cy - 5);
  g.fillTriangle(cx - 0.5, cy - 3, cx + 0.5, cy - 3, cx, cy - 5.5);

  // Green LEAVES flanking the calyx — two curved blades
  g.fillStyle(0x1a3a0a, 1);
  g.fillTriangle(cx - 6, cy - 1, cx - 10, cy + 2, cx - 5, cy + 2);
  g.fillTriangle(cx + 6, cy - 1, cx + 10, cy + 2, cx + 5, cy + 2);
  g.fillStyle(0x2a5a18, 1);
  g.fillTriangle(cx - 6, cy - 0.5, cx - 9, cy + 1.5, cx - 5, cy + 1.5);
  g.fillTriangle(cx + 6, cy - 0.5, cx + 9, cy + 1.5, cx + 5, cy + 1.5);
  g.fillStyle(0x4a8a28, 0.85);
  g.fillTriangle(cx - 6, cy, cx - 8, cy + 1, cx - 5, cy + 1);
  g.fillTriangle(cx + 6, cy, cx + 8, cy + 1, cx + 5, cy + 1);

  // PURPLE BLOOM — bristly florets fanning upward from the calyx.
  // The purple mass.
  g.fillStyle(0x3a1255, 1);
  g.fillEllipse(cx, cy - 6, 8, 6);
  g.fillStyle(0x5a2288, 1);
  g.fillEllipse(cx, cy - 6.5, 7, 5);
  g.fillStyle(0x8844bb, 1);
  g.fillEllipse(cx - 0.5, cy - 7, 5, 3.5);

  // Bristly florets — radial spikes fanning up + out (thistle signature)
  g.fillStyle(0xaa66cc, 1);
  const floretAngles = [-Math.PI * 0.85, -Math.PI * 0.65, -Math.PI * 0.5, -Math.PI * 0.35, -Math.PI * 0.15];
  for (const a of floretAngles) {
    const fx = cx + Math.cos(a) * 5.5;
    const fy = cy - 6 + Math.sin(a) * 4;
    g.fillRect(fx - 0.4, fy - 0.4, 0.8, 0.8);
    const tx = cx + Math.cos(a) * 7.5;
    const ty = cy - 6 + Math.sin(a) * 6;
    g.fillCircle(tx, ty, 0.7);
  }
  // Brighter magenta tips on the highest florets
  g.fillStyle(0xff88dd, 0.95);
  g.fillCircle(cx, cy - 12, 0.8);
  g.fillCircle(cx - 3, cy - 11, 0.7);
  g.fillCircle(cx + 3, cy - 11, 0.7);

  // Bright pink specular at bloom centre
  g.fillStyle(0xff88dd, 1);
  g.fillCircle(cx - 1, cy - 7, 1);
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(cx - 1.3, cy - 7.3, 0.4);

  g.generateTexture('ucard_thistle_crown', s, s);
  g.destroy();
}

/**
 * `ucard_highland_shield` — Highland targe (round leather-bossed
 * shield). Design pivot (v2): prior icon was concentric grey circles
 * with 4 cardinal dots — read as "generic metal target", not a
 * Scottish targe. New pitch: TAN LEATHER BODY (warm russet, not
 * cold grey), BLUE SALTIRE X etched across the face (Scottish
 * anchor), FULL RING OF 12 BRASS RIVETS around the rim (the targe
 * tell), central domed brass boss with specular stack. Leather
 * warmth + saltire + rivet ring = unmistakably Highland targe.
 */
function drawHighlandShield(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x1a2a44);
  const cx = 16, cy = 16;

  // ── Dark leather outline ring. ──
  g.fillStyle(0x2a1204, 1);
  g.fillCircle(cx, cy, 13);
  // Mid leather — warm russet, not grey.
  g.fillStyle(0x6a3818, 1);
  g.fillCircle(cx, cy, 12);
  // Lighter leather face — full face tone.
  g.fillStyle(0x8a5a30, 1);
  g.fillCircle(cx - 0.5, cy - 0.5, 11);
  // Upper-left leather dome sheen.
  g.fillStyle(0xaa7040, 1);
  g.fillCircle(cx - 2, cy - 2, 6);
  g.fillStyle(0xcc9050, 0.6);
  g.fillCircle(cx - 3, cy - 3, 3);

  // ── SALTIRE X — thick blue diagonal bars. Sits inside the rivet
  // ring. Scottish flag overlay is the national identity anchor. ──
  // NW-SE bar shadow
  g.fillStyle(0x0a1a44, 1);
  g.fillTriangle(cx - 8.8, cy - 5.2, cx - 5.2, cy - 8.8, cx + 8.8, cy + 5.2);
  g.fillTriangle(cx - 5.2, cy - 8.8, cx + 8.8, cy + 5.2, cx + 5.2, cy + 8.8);
  // NE-SW bar shadow
  g.fillTriangle(cx - 8.8, cy + 5.2, cx - 5.2, cy + 8.8, cx + 8.8, cy - 5.2);
  g.fillTriangle(cx - 5.2, cy + 8.8, cx + 8.8, cy - 5.2, cx + 5.2, cy - 8.8);
  // NW-SE bar bright saltire blue
  g.fillStyle(0x3a66bb, 1);
  g.fillTriangle(cx - 8, cy - 4.5, cx - 4.5, cy - 8, cx + 8, cy + 4.5);
  g.fillTriangle(cx - 4.5, cy - 8, cx + 8, cy + 4.5, cx + 4.5, cy + 8);
  // NE-SW bar bright saltire blue
  g.fillTriangle(cx - 8, cy + 4.5, cx - 4.5, cy + 8, cx + 8, cy - 4.5);
  g.fillTriangle(cx - 4.5, cy + 8, cx + 8, cy - 4.5, cx + 4.5, cy - 8);

  // ── 12 BRASS RIVETS around the rim at r=10.5. The targe tell. ──
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const rx = cx + Math.cos(a) * 10.5;
    const ry = cy + Math.sin(a) * 10.5;
    g.fillStyle(0x3a1e08, 1);
    g.fillCircle(rx, ry, 1.3);
    g.fillStyle(0xccaa44, 1);
    g.fillCircle(rx, ry, 0.9);
    g.fillStyle(0xffdd77, 1);
    g.fillCircle(rx - 0.3, ry - 0.3, 0.5);
  }

  // ── CENTRAL BRASS BOSS — domed stack covering the saltire crossing. ──
  g.fillStyle(0x2a1404, 1);
  g.fillCircle(cx, cy, 4);
  g.fillStyle(0x8a6620, 1);
  g.fillCircle(cx, cy, 3.3);
  g.fillStyle(0xccaa44, 1);
  g.fillCircle(cx - 0.3, cy - 0.3, 2.5);
  g.fillStyle(0xeecc55, 1);
  g.fillCircle(cx - 0.7, cy - 0.7, 1.5);
  g.fillStyle(0xffee88, 1);
  g.fillCircle(cx - 1, cy - 1, 0.8);
  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(cx - 1.1, cy - 1.1, 0.4);

  g.generateTexture('ucard_highland_shield', s, s);
  g.destroy();
}

/**
 * `ucard_tartan_sash` — tartan-sash accessory icon. Design pivot:
 * old icon was a raw tartan-stripe band with a corner brooch that
 * read as "fabric sample". New pitch — paint the sash ACROSS A DARK
 * TORSO SILHOUETTE so it's unmistakably WORN, not a loose scrap.
 * Brooch pins at the left shoulder, red-gold-green tartan stripes
 * run along the sash axis, gold fringe tails trail at the waist.
 */
function drawTartanSash(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x3b1f2d);
  const cx = 16;

  // ── Dark torso silhouette — the body the sash drapes over. ──
  g.fillStyle(0x0a0608, 1);
  g.fillRoundedRect(cx - 10, 6, 20, 22, 6);
  g.fillStyle(0x1a0c14, 1);
  g.fillRoundedRect(cx - 9, 7, 18, 20, 5);
  // Neckline V-cut
  g.fillStyle(0x3b1f2d, 1);
  g.fillTriangle(cx - 3, 7, cx + 3, 7, cx, 12);

  // ── Sash body — thick diagonal Highland tartan parallelogram from left
  // shoulder down to right waist. ──
  g.fillStyle(HIGHLAND_TARTAN.fieldDark, 1);
  g.fillTriangle(cx - 10, 9, cx - 6, 9, cx + 10, 27);
  g.fillTriangle(cx - 10, 9, cx + 10, 27, cx + 6, 27);
  g.fillStyle(HIGHLAND_TARTAN.field, 1);
  g.fillTriangle(cx - 9.5, 9.5, cx - 6.5, 9.5, cx + 9, 26.5);
  g.fillTriangle(cx - 9.5, 9.5, cx + 9, 26.5, cx + 6.5, 26.5);
  g.fillStyle(HIGHLAND_TARTAN.field, 1);
  g.fillTriangle(cx - 8.5, 10, cx - 7, 10, cx + 8, 26);
  g.fillTriangle(cx - 8.5, 10, cx + 8, 26, cx + 6.5, 26);

  // ── Gold pinstripe down the sash axis. ──
  g.fillStyle(HIGHLAND_TARTAN.accent, 1);
  g.fillTriangle(cx - 8, 11, cx - 7.5, 11, cx + 7.5, 25.5);
  g.fillTriangle(cx - 8, 11, cx + 7.5, 25.5, cx + 7, 25.5);
  // Dark green secondary stripe
  g.fillStyle(HIGHLAND_TARTAN.stripe, 0.95);
  g.fillTriangle(cx - 9, 11.5, cx - 8.5, 11.5, cx + 7, 25);
  g.fillTriangle(cx - 9, 11.5, cx + 7, 25, cx + 6.5, 25);

  // ── Tartan cross-beads suggesting perpendicular weave. ──
  const beads: [number, number][] = [
    [cx - 6, 12], [cx - 2, 17], [cx + 2, 21], [cx + 6, 25],
  ];
  for (const [px, py] of beads) {
    g.fillStyle(0x1a0404, 1);
    g.fillCircle(px, py, 0.9);
  }

  // ── Brooch at the shoulder — silver disc with amethyst stone. ──
  g.fillStyle(0x4a4a58, 1);
  g.fillCircle(cx - 8, 10, 3);
  g.fillStyle(0xaabacc, 1);
  g.fillCircle(cx - 8, 10, 2.3);
  g.fillStyle(0xdcdce8, 1);
  g.fillCircle(cx - 8, 10, 1.5);
  g.fillStyle(0x8844aa, 1);
  g.fillCircle(cx - 8, 10, 0.9);
  g.fillStyle(0xcc88ee, 1);
  g.fillCircle(cx - 8.2, 9.8, 0.4);

  // ── Gold fringe tails at the waist end. ──
  g.fillStyle(HIGHLAND_TARTAN.accent, 1);
  g.fillRect(cx + 7, 26, 0.7, 3);
  g.fillRect(cx + 8, 26, 0.7, 3.5);
  g.fillRect(cx + 9, 26, 0.7, 2.8);
  g.fillStyle(0x6a5020, 1);
  g.fillRect(cx + 7, 28.5, 0.7, 0.5);
  g.fillRect(cx + 8, 29, 0.7, 0.5);

  g.generateTexture('ucard_tartan_sash', s, s);
  g.destroy();
}

// ═══════════════════════════════════════════════════════════════════════════
//  STAT BOOST CARD ICONS
// ═══════════════════════════════════════════════════════════════════════════

function drawStatHealth(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x2c1f2a);
  const cx = 16, cy = 16;
  g.fillStyle(0x881122, 1);
  g.fillCircle(cx - 4, cy - 2, 6);
  g.fillCircle(cx + 4, cy - 2, 6);
  g.fillTriangle(cx - 10, cy, cx + 10, cy, cx, cy + 11);
  g.fillStyle(0xcc2244, 1);
  g.fillCircle(cx - 4, cy - 2, 5);
  g.fillCircle(cx + 4, cy - 2, 5);
  g.fillTriangle(cx - 9, cy - 1, cx + 9, cy - 1, cx, cy + 10);
  g.fillStyle(0xee4466, 1);
  g.fillCircle(cx - 4, cy - 3, 3);
  g.fillStyle(0xff6688, 0.6);
  g.fillCircle(cx - 5, cy - 4, 1.5);
  g.fillStyle(0xffffff, 0.4);
  g.fillCircle(cx - 5, cy - 5, 1);
  g.generateTexture('ucard_stat_health', s, s);
  g.destroy();
}

function drawStatSpeed(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x213047);
  const cx = 16, cy = 16;

  // ── Warm motion-flicker ground glow — replaces the generic cool
  // halo so the icon reads as warm peat-and-fire instead of "lightning
  // bolt". ART_STYLE_BIBLE Hearth band: warm peat 0x5a3e20, bright
  // gold 0xffc840 for the flicker. ──
  g.fillStyle(0xffc840, 0.18);
  g.fillEllipse(cx, cy + 5, 22, 6);
  g.fillStyle(0xffaa44, 0.28);
  g.fillEllipse(cx, cy + 5, 14, 4);

  // ── Trailing arc — three shrinking gold puffs LEFT of the haggis,
  // following his line of motion. The arc curves slightly so it reads
  // as "speed trail", not parallel slashes. ──
  g.fillStyle(0xd4b055, 0.5);
  g.fillEllipse(cx - 8, cy + 4, 4, 2);
  g.fillStyle(0xd4b055, 0.65);
  g.fillEllipse(cx - 5, cy + 3, 3.5, 1.8);
  g.fillStyle(0xffc840, 0.85);
  g.fillEllipse(cx - 2, cy + 2, 3, 1.6);

  // ── Running-haggis silhouette — compact dot-body + leaning forward
  // pose with two tiny stub legs and a tail nub. Sits centre-right so
  // the trail reads "behind". ──
  // Body silhouette
  g.fillStyle(0x3a2808, 1);
  g.fillEllipse(cx + 3, cy, 11, 7);
  g.fillStyle(0x6b4e0a, 1);
  g.fillEllipse(cx + 3, cy - 0.5, 9, 5.5);
  g.fillStyle(0x8b6914, 1);
  g.fillEllipse(cx + 3, cy - 1, 7, 4);
  // Tail nub trailing back
  g.fillStyle(0x3a2808, 1);
  g.fillCircle(cx - 3, cy + 1, 1.4);
  // Forward-leaning snout
  g.fillStyle(0xd4956b, 1);
  g.fillCircle(cx + 7.5, cy + 0.5, 1.5);
  g.fillStyle(0x3a2808, 1);
  g.fillCircle(cx + 8, cy + 0.5, 0.5);
  // Eye (forward gaze)
  g.fillStyle(0xffffff, 0.95);
  g.fillCircle(cx + 5, cy - 1.5, 1);
  g.fillStyle(0x111111, 1);
  g.fillCircle(cx + 5.5, cy - 1.5, 0.5);
  // Stub legs — mid-stride lean, left leg back / right leg forward
  g.fillStyle(0x1a0e06, 1);
  g.fillRect(cx - 0.5, cy + 3, 1.4, 3);
  g.fillRect(cx + 5, cy + 3, 1.4, 3.5);

  // ── Forward-pointing speed arrow — small chevron just ahead of the
  // snout, locks in "this way fast". Bright gold so it's the eye-
  // catch. ──
  g.fillStyle(0xffc840, 1);
  g.fillTriangle(cx + 11, cy - 2, cx + 13, cy + 1, cx + 11, cy + 4);
  g.fillStyle(0xfff0a8, 0.95);
  g.fillTriangle(cx + 11.5, cy - 0.5, cx + 12.3, cy + 1, cx + 11.5, cy + 2.5);

  // ── Warm specular flicker pips — three tiny sparks scattered along
  // the trail to sell heat-haze motion. ──
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(cx - 7, cy + 1, 0.7);
  g.fillCircle(cx - 4, cy - 1, 0.5);
  g.fillCircle(cx + 1, cy - 4, 0.5);

  g.generateTexture('ucard_stat_speed', s, s);
  g.destroy();
}

/**
 * `ucard_stat_pickup` — pickup-range stat icon. Design pivot: old
 * icon had a magnet + flying gem + trail dots competing for attention
 * so the "pickup range" concept got diluted. New pitch — BIG BOLD
 * horseshoe magnet dominates the upper 2/3 of the icon, 3 BRIGHTER
 * concentric cyan field arcs radiating from the pole opening, and a
 * SINGLE bright sparkle-star at the bottom as the "pull target". No
 * clutter — the magnet silhouette carries the meaning.
 */
function drawStatPickup(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x243a22);
  const cx = 16, cy = 15;

  // ── HORSESHOE MAGNET — bigger and bolder than before. Red body
  // + white pole tips. The dominant silhouette. ──
  // Outline shadow
  g.fillStyle(0x2a0808, 1);
  g.fillRect(cx - 10, cy - 10, 20, 5);
  g.fillRect(cx - 10, cy - 10, 5, 14);
  g.fillRect(cx + 5, cy - 10, 5, 14);

  // Red magnet body
  g.fillStyle(0xaa0a0a, 1);
  g.fillRect(cx - 9, cy - 9, 18, 4);
  g.fillRect(cx - 9, cy - 9, 4, 12);
  g.fillRect(cx + 5, cy - 9, 4, 12);
  g.fillStyle(0xdd2222, 1);
  g.fillRect(cx - 9, cy - 9, 18, 3);
  g.fillRect(cx - 9, cy - 9, 3, 11);
  g.fillRect(cx + 6, cy - 9, 3, 11);
  // Highlight
  g.fillStyle(0xff5544, 1);
  g.fillRect(cx - 8, cy - 9, 16, 1);
  g.fillRect(cx - 8, cy - 8, 1, 9);
  g.fillRect(cx + 7, cy - 8, 1, 9);

  // ── WHITE POLE TIPS at the open end — classic horseshoe detail. ──
  g.fillStyle(0xeaeae0, 1);
  g.fillRect(cx - 9, cy + 3, 4, 3);
  g.fillRect(cx + 5, cy + 3, 4, 3);
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx - 9, cy + 3, 4, 1);
  g.fillRect(cx + 5, cy + 3, 4, 1);

  // ── MAGNETIC FIELD ARCS — three concentric cyan arcs radiating
  // from the pole opening. Brighter + bolder than before. ──
  g.lineStyle(1.5, 0x66ddff, 0.9);
  g.beginPath();
  g.arc(cx, cy + 6, 4, Math.PI * 1.0, Math.PI * 2.0);
  g.strokePath();
  g.lineStyle(1.2, 0x88eeff, 0.75);
  g.beginPath();
  g.arc(cx, cy + 6, 7, Math.PI * 1.0, Math.PI * 2.0);
  g.strokePath();
  g.lineStyle(1.0, 0xaaf0ff, 0.55);
  g.beginPath();
  g.arc(cx, cy + 6, 10, Math.PI * 1.0, Math.PI * 2.0);
  g.strokePath();

  // ── PULL-TARGET SPARKLE — single bright 4-point star at the
  // bottom. Sells "thing being drawn toward the magnet" without
  // the clutter of a gem + trail. ──
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx - 0.6, cy + 11, 1.2, 4.5);
  g.fillRect(cx - 2.2, cy + 12.5, 4.5, 1.2);
  g.fillStyle(0xccf4ff, 1);
  g.fillCircle(cx, cy + 13, 1.2);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx, cy + 13, 0.6);

  g.generateTexture('ucard_stat_pickup', s, s);
  g.destroy();
}

/**
 * `ucard_stat_damage` — damage-boost stat icon. Design pivot: old
 * icon used subtle diagonal rect-pillars as sword slashes that
 * read as generic motion lines at 16×16. New pitch — TWO CROSSED
 * BROADSWORD BLADES behind a big CENTRAL DAMAGE BURST. Blades form
 * an X silhouette (combat crest); explosion at centre screams "hit".
 * Flame wisps radiate from the core for impact-energy readability.
 */
function drawStatDamage(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x3c2318);
  const cx = 16, cy = 16;

  // ── CROSSED BROADSWORD BLADES — X-shape behind the burst. ──
  // Sword 1: top-left to bottom-right
  g.fillStyle(0x0a0a0a, 1);
  g.fillTriangle(4, 4, 7, 4, 28, 28);
  g.fillTriangle(4, 4, 28, 28, 28, 25);
  g.fillStyle(0x6a7a8a, 1);
  g.fillTriangle(5, 5, 7, 5, 27, 27);
  g.fillTriangle(5, 5, 27, 27, 27, 25);
  g.fillStyle(0xa8b8c8, 1);
  g.fillTriangle(5, 5, 6, 5, 27, 27);

  // Sword 2: top-right to bottom-left (mirror)
  g.fillStyle(0x0a0a0a, 1);
  g.fillTriangle(28, 4, 25, 4, 4, 28);
  g.fillTriangle(28, 4, 4, 28, 4, 25);
  g.fillStyle(0x6a7a8a, 1);
  g.fillTriangle(27, 5, 25, 5, 5, 27);
  g.fillTriangle(27, 5, 5, 27, 5, 25);
  g.fillStyle(0xa8b8c8, 1);
  g.fillTriangle(27, 5, 26, 5, 5, 27);

  // ── Crossguards — brass horizontal bars where blade meets grip. ──
  g.fillStyle(0x0a0a0a, 1);
  g.fillRect(22, 21, 8, 2.5);
  g.fillRect(2, 21, 8, 2.5);
  g.fillStyle(0xc88a40, 1);
  g.fillRect(23, 21.5, 6, 1.5);
  g.fillRect(3, 21.5, 6, 1.5);

  // ── Grips — leather-wrapped bars. ──
  g.fillStyle(0x3a1a0a, 1);
  g.fillRect(28, 23, 3, 2.5);
  g.fillRect(1, 23, 3, 2.5);

  // ── Pommels — round brass caps at the grip ends. ──
  g.fillStyle(0xc88a40, 1);
  g.fillCircle(30.5, 25, 1.5);
  g.fillCircle(1.5, 25, 1.5);
  g.fillStyle(0xfadc6a, 1);
  g.fillCircle(30.5, 25, 0.8);
  g.fillCircle(1.5, 25, 0.8);

  // ── CENTRAL DAMAGE BURST — orange explosion with hot core. ──
  g.fillStyle(0xff6a10, 0.65);
  g.fillCircle(cx, cy, 7);
  g.fillStyle(0xff8a20, 1);
  g.fillCircle(cx, cy, 5);
  g.fillStyle(0xffaa40, 1);
  g.fillCircle(cx, cy, 3.5);
  g.fillStyle(0xffdd88, 1);
  g.fillCircle(cx, cy, 2);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx, cy, 0.9);

  // ── FLAME WISPS radiating from the core — 4 cardinal + 4 diagonal. ──
  g.fillStyle(0xff8a20, 0.85);
  g.fillTriangle(cx, cy - 8, cx - 1.2, cy - 4, cx + 1.2, cy - 4);
  g.fillTriangle(cx, cy + 8, cx - 1.2, cy + 4, cx + 1.2, cy + 4);
  g.fillTriangle(cx - 8, cy, cx - 4, cy - 1.2, cx - 4, cy + 1.2);
  g.fillTriangle(cx + 8, cy, cx + 4, cy - 1.2, cx + 4, cy + 1.2);

  g.generateTexture('ucard_stat_damage', s, s);
  g.destroy();
}

/**
 * `ucard_stat_drift` — drift-reduction stat icon. Design pivot: old
 * spiral+arrow read as generic "motion" without anchoring the "steer
 * your haggis" concept. New pitch — SHIP'S STEERING WHEEL with six
 * spokes + visible handle-nubs around the rim. The universal
 * control/steering icon. The haggis drift is a steering-correction
 * mechanic, so the wheel IS the mechanic.
 */
function drawStatDrift(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x2a2744);
  const cx = 16, cy = 16;

  // Outer dark wood rim
  g.fillStyle(0x2a1a0a, 1);
  g.fillCircle(cx, cy, 12);
  // Main wood rim
  g.fillStyle(0x6a3818, 1);
  g.fillCircle(cx, cy, 11);
  // Inner dark ring (cutout)
  g.fillStyle(0x1a0e04, 1);
  g.fillCircle(cx, cy, 8.5);
  // Inner ring wood
  g.fillStyle(0x6a3818, 1);
  g.fillCircle(cx, cy, 7.5);
  // Centre hub cutout
  g.fillStyle(0x1a0e04, 1);
  g.fillCircle(cx, cy, 4);

  // Six spokes — thick radial bars from hub to rim
  const spokeAngles = [0, Math.PI / 3, 2 * Math.PI / 3, Math.PI, 4 * Math.PI / 3, 5 * Math.PI / 3];
  for (const a of spokeAngles) {
    // Spoke body
    g.fillStyle(0x6a3818, 1);
    const sx1 = cx + Math.cos(a) * 3;
    const sy1 = cy + Math.sin(a) * 3;
    const sx2 = cx + Math.cos(a) * 8;
    const sy2 = cy + Math.sin(a) * 8;
    // Draw thick spoke as two overlapping triangles for a rectangle
    const perpX = -Math.sin(a) * 1.2;
    const perpY = Math.cos(a) * 1.2;
    g.fillTriangle(sx1 + perpX, sy1 + perpY, sx1 - perpX, sy1 - perpY, sx2 + perpX, sy2 + perpY);
    g.fillTriangle(sx1 - perpX, sy1 - perpY, sx2 + perpX, sy2 + perpY, sx2 - perpX, sy2 - perpY);
    // Spoke highlight
    g.fillStyle(0x8a5028, 1);
    const perpX2 = -Math.sin(a) * 0.5;
    const perpY2 = Math.cos(a) * 0.5;
    g.fillTriangle(sx1 + perpX2, sy1 + perpY2, sx2 + perpX2, sy2 + perpY2, sx2 - perpX2, sy2 - perpY2);
  }

  // Handle nubs — six knobs sticking out beyond the rim
  g.fillStyle(0x4a2810, 1);
  for (const a of spokeAngles) {
    const hx = cx + Math.cos(a) * 13;
    const hy = cy + Math.sin(a) * 13;
    g.fillCircle(hx, hy, 1.8);
  }
  g.fillStyle(0x8a5028, 1);
  for (const a of spokeAngles) {
    const hx = cx + Math.cos(a) * 13;
    const hy = cy + Math.sin(a) * 13;
    g.fillCircle(hx, hy, 1.2);
  }
  g.fillStyle(0xba7848, 0.9);
  for (const a of spokeAngles) {
    const hx = cx + Math.cos(a) * 13;
    const hy = cy + Math.sin(a) * 13;
    g.fillCircle(hx - 0.3, hy - 0.3, 0.5);
  }

  // Centre hub — brass knob with rivet
  g.fillStyle(0xd8a848, 1);
  g.fillCircle(cx, cy, 3);
  g.fillStyle(0xfadc6a, 1);
  g.fillCircle(cx, cy, 2);
  g.fillStyle(0x6a4818, 1);
  g.fillCircle(cx, cy, 0.8);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx - 0.7, cy - 0.7, 0.5);

  // Rim wood-grain highlight on top
  g.fillStyle(0x8a5028, 0.85);
  g.fillEllipse(cx, cy - 11, 6, 1);

  g.generateTexture('ucard_stat_drift', s, s);
  g.destroy();
}

/**
 * `ucard_stat_defense` — defense stat icon. Design pivot: old icon
 * was a rounded-rect slab with a central pillar + scalloped top
 * that read as "door" or "castle tower". New pitch — classic
 * HIGHLAND TARGE (round riveted shield) with a saltire etched on
 * the face + a vertical broadsword behind it, all the unambiguous
 * marks of Scottish defensive iconography.
 */
function drawStatDefense(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x1f2e3a);
  const cx = 16, cy = 16;

  // ── Vertical broadsword behind — visible top + bottom only. ──
  g.fillStyle(0x2a3848, 1);
  g.fillRect(cx - 1, 3, 2, 26);
  g.fillStyle(0x5a6e82, 1);
  g.fillRect(cx - 0.5, 3, 1, 25);
  g.fillStyle(0x5a6e82, 1);
  g.fillTriangle(cx - 1, 3, cx + 1, 3, cx, 1);
  g.fillStyle(0xc8dae8, 0.85);
  g.fillRect(cx - 0.3, 3, 0.6, 8);
  // Crossguard
  g.fillStyle(0x4a3418, 1);
  g.fillRect(cx - 6, cy - 10, 12, 2);
  g.fillStyle(0x7a5428, 1);
  g.fillRect(cx - 5, cy - 10, 10, 1);
  // Pommel at bottom
  g.fillStyle(0x4a3418, 1);
  g.fillCircle(cx, 29, 2);
  g.fillStyle(0x7a5428, 1);
  g.fillCircle(cx, 29, 1.3);

  // ── Round targe shield — fills the middle. ──
  g.fillStyle(0x2a1a0a, 1);
  g.fillCircle(cx, cy, 11);
  g.fillStyle(0x5a3818, 1);
  g.fillCircle(cx, cy, 10);
  g.fillStyle(0x556677, 1);
  g.fillCircle(cx, cy, 9);
  g.fillStyle(0x7a8a9a, 1);
  g.fillCircle(cx - 1, cy - 1, 7.5);
  // Concentric ring grooves
  g.lineStyle(1, 0x3a4858, 0.9);
  g.strokeCircle(cx, cy, 7);
  g.lineStyle(0.8, 0x3a4858, 0.8);
  g.strokeCircle(cx, cy, 4.5);

  // ── Saltire etched on the shield face — pale white X. ──
  g.lineStyle(1.3, 0xe8f0f8, 0.6);
  g.lineBetween(cx - 6, cy - 6, cx + 6, cy + 6);
  g.lineBetween(cx - 6, cy + 6, cx + 6, cy - 6);

  // ── Centre boss — chunky steel dome with specular. ──
  g.fillStyle(0x2a3440, 1);
  g.fillCircle(cx, cy, 3);
  g.fillStyle(0x6a7a8a, 1);
  g.fillCircle(cx, cy, 2.3);
  g.fillStyle(0xaabacc, 1);
  g.fillCircle(cx, cy, 1.5);
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(cx - 0.4, cy - 0.4, 0.6);

  // ── Brass rivets around the rim at 8 positions. ──
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const rx = cx + Math.cos(a) * 9;
    const ry = cy + Math.sin(a) * 9;
    g.fillStyle(0x2a1a0a, 1);
    g.fillCircle(rx, ry, 0.9);
    g.fillStyle(0xaa8a3a, 1);
    g.fillCircle(rx, ry, 0.6);
    g.fillStyle(0xddbb55, 0.9);
    g.fillCircle(rx - 0.2, ry - 0.2, 0.3);
  }

  g.generateTexture('ucard_stat_defense', s, s);
  g.destroy();
}

/**
 * `ucard_stat_utility` — utility stat icon. Design pivot: old icon
 * was a generic 8-point gold radial star that could have been any
 * category's burst. New pitch — an ANTIQUE SKELETON KEY with a
 * THISTLE-SHAPED BOW: the key is universal "utility/access"
 * iconography, and the thistle-bow keeps the Scottish anchor.
 */
function drawStatUtility(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x2d2d22);
  const cx = 16, cy = 16;

  // ── Warm gold aura behind the key. ──
  g.fillStyle(0xd8a848, 0.15);
  g.fillCircle(cx, cy, 13);

  // ── Thistle bow at the top — green calyx with radiating bracts. ──
  g.fillStyle(0x1a3810, 1);
  g.fillEllipse(cx, cy - 5, 7, 4);
  g.fillStyle(0x3a6a18, 1);
  g.fillEllipse(cx, cy - 5, 6, 3);
  g.fillStyle(0x1a3810, 1);
  g.fillTriangle(cx - 4, cy - 5, cx - 6, cy - 7, cx - 3, cy - 4);
  g.fillTriangle(cx + 4, cy - 5, cx + 6, cy - 7, cx + 3, cy - 4);
  g.fillTriangle(cx - 2, cy - 7, cx, cy - 9, cx + 2, cy - 7);

  // Purple thistle bloom inside the bow
  g.fillStyle(0x4a1868, 1);
  g.fillEllipse(cx, cy - 7, 6, 4);
  g.fillStyle(0x8a3ab0, 1);
  g.fillEllipse(cx, cy - 7, 5, 3);
  // Bristly purple florets radiating upward
  g.fillStyle(0xcc78dd, 1);
  for (let i = 0; i < 7; i++) {
    const bx = cx - 3 + i;
    const h = 1.5 + (i % 3) * 0.5;
    g.fillRect(bx, cy - 9 - h, 0.5, h);
  }
  // Bright tip dots
  g.fillStyle(0xffccee, 1);
  g.fillCircle(cx, cy - 11, 0.6);
  g.fillCircle(cx - 2, cy - 10, 0.4);
  g.fillCircle(cx + 2, cy - 10, 0.4);

  // ── Key shaft — thick vertical gold bar. ──
  g.fillStyle(0x4a3008, 1);
  g.fillRect(cx - 1.5, cy - 2, 3, 13);
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx - 1, cy - 2, 2, 13);
  g.fillStyle(0xfadc6a, 1);
  g.fillRect(cx - 0.5, cy - 2, 1, 13);

  // ── Key bit — antique L-shape with two teeth. ──
  g.fillStyle(0x4a3008, 1);
  g.fillRect(cx - 1.5, cy + 10, 7, 2.5);
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx - 1, cy + 10, 6, 2);
  g.fillStyle(0xfadc6a, 1);
  g.fillRect(cx - 1, cy + 10, 6, 0.6);
  // First tooth (downward)
  g.fillStyle(0x4a3008, 1);
  g.fillRect(cx + 1, cy + 12, 1.8, 2.5);
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx + 1.3, cy + 12, 1.2, 2);
  // Second tooth
  g.fillStyle(0x4a3008, 1);
  g.fillRect(cx + 3.5, cy + 12, 1.8, 2);
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx + 3.8, cy + 12, 1.2, 1.5);

  // ── Sparkle at the thistle tip — magical key. ──
  g.fillStyle(0xffffff, 0.95);
  g.fillRect(cx - 3, cy - 11, 0.8, 0.4);
  g.fillRect(cx - 3.3, cy - 11.3, 0.4, 0.8);

  g.generateTexture('ucard_stat_utility', s, s);
  g.destroy();
}

/**
 * `ucard_stat_cooldown` — weapon cooldown-reduction stat icon.
 * Design pivot: old hourglass-between-posts read as "gears" or
 * "pressure clamp". New pitch — proper POCKET-WATCH CLOCK FACE
 * with visible hour/minute hands + 12 tick marks + crown stem +
 * ring loop on top. Universal "time/cooldown" icon that reads at
 * 32px without needing culture context.
 */
function drawStatCooldown(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x2a2238);
  const cx = 16, cy = 16;

  // Watch-loop ring on top (where the chain would attach)
  g.lineStyle(1.5, 0xd8a848, 1);
  g.strokeCircle(cx, cy - 14, 1.8);
  // Watch crown stem (between loop and body)
  g.fillStyle(0xd8a848, 1);
  g.fillRect(cx - 1, cy - 12, 2, 2);
  g.fillStyle(0xfadc6a, 1);
  g.fillRect(cx - 0.5, cy - 12, 1, 2);

  // Outer gold case ring
  g.fillStyle(0x8a6018, 1);
  g.fillCircle(cx, cy, 11.5);
  g.fillStyle(0xd8a848, 1);
  g.fillCircle(cx, cy, 10.5);
  g.fillStyle(0xfadc6a, 0.9);
  g.fillCircle(cx, cy - 0.5, 9.5);

  // Watch face — cream/ivory
  g.fillStyle(0xf4e8d0, 1);
  g.fillCircle(cx, cy, 9);
  g.fillStyle(0xfaf0dc, 1);
  g.fillCircle(cx, cy - 0.5, 8);

  // 12 TICK MARKS around the dial
  g.fillStyle(0x1a1008, 1);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const isMajor = i % 3 === 0;
    const r1 = 8;
    const r2 = isMajor ? 6.5 : 7.3;
    const sx1 = cx + Math.cos(a) * r1;
    const sy1 = cy + Math.sin(a) * r1;
    const sx2 = cx + Math.cos(a) * r2;
    const sy2 = cy + Math.sin(a) * r2;
    // Use a thick rect aligned along the radial line via perpendicular offset
    const perpX = -Math.sin(a) * (isMajor ? 1 : 0.5);
    const perpY = Math.cos(a) * (isMajor ? 1 : 0.5);
    g.fillTriangle(sx1 + perpX, sy1 + perpY, sx1 - perpX, sy1 - perpY, sx2 + perpX, sy2 + perpY);
    g.fillTriangle(sx1 - perpX, sy1 - perpY, sx2 + perpX, sy2 + perpY, sx2 - perpX, sy2 - perpY);
  }

  // HOUR HAND — thick, pointing up-right (10 o'clock-ish position)
  g.fillStyle(0x0a0a10, 1);
  // Hour hand as a thick triangle
  g.fillTriangle(cx, cy, cx - 4, cy - 3, cx - 0.7, cy);
  g.fillTriangle(cx, cy, cx - 0.7, cy, cx - 3, cy - 4);

  // MINUTE HAND — longer, thinner, pointing up
  g.fillStyle(0x0a0a10, 1);
  g.fillTriangle(cx, cy, cx - 0.5, cy - 7, cx + 0.5, cy - 7);

  // Centre pin (where the hands meet)
  g.fillStyle(0xd8a848, 1);
  g.fillCircle(cx, cy, 1.5);
  g.fillStyle(0xfadc6a, 1);
  g.fillCircle(cx, cy, 0.8);

  // Glass sheen on the top-left for depth
  g.fillStyle(0xffffff, 0.3);
  g.fillEllipse(cx - 3, cy - 4, 4, 2);

  g.generateTexture('ucard_stat_cooldown', s, s);
  g.destroy();
}

/**
 * `ucard_stat_knockback` — knockback stat. Design pivot (v2): prior
 * icon was a radial golden core with two concentric stroked circles
 * and four CARDINAL arrows + corner sparkles. Reads "generic AoE
 * burst" or "compass rose" — any radial push effect. No directional
 * anchor, no target. New pitch: DIRECTIONAL SHOVE. Big armoured FIST
 * on the left punching RIGHT with thick impact SHOCKWAVE RINGS + a
 * small TARGET SILHOUETTE being flung right with speed lines. The
 * asymmetry + target-being-punted is unambiguously "knockback" — no
 * confusion with AoE, pickup radius, or speed burst.
 */
function drawStatKnockback(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  cardIconBg(g, s, 0x3a2818);
  const cx = 16, cy = 16;

  // FIST on the left — iron gauntlet silhouette punching right
  // Forearm
  g.fillStyle(0x2a1a06, 1);
  g.fillRect(cx - 14, cy - 2.5, 6, 5);
  g.fillStyle(0x5a3a14, 1);
  g.fillRect(cx - 14, cy - 2, 6, 4);
  g.fillStyle(0x8a6020, 1);
  g.fillRect(cx - 14, cy - 2, 6, 1);
  // Knuckle block
  g.fillStyle(0x2a1a06, 1);
  g.fillRect(cx - 9, cy - 4, 5, 8);
  g.fillStyle(0x7a5420, 1);
  g.fillRect(cx - 9, cy - 3.5, 5, 7);
  g.fillStyle(0xaa8030, 1);
  g.fillRect(cx - 9, cy - 3.5, 5, 2);
  // Brass knuckle studs — 3 bright spikes
  g.fillStyle(0xffdd55, 1);
  g.fillCircle(cx - 5, cy - 2, 0.9);
  g.fillCircle(cx - 5, cy, 0.9);
  g.fillCircle(cx - 5, cy + 2, 0.9);
  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(cx - 5.2, cy - 2.2, 0.4);

  // IMPACT SHOCKWAVE — concentric arc rings bursting from the fist
  // forward-right (not symmetric radial — directional).
  g.lineStyle(2, 0xffcc44, 0.9);
  g.beginPath();
  g.arc(cx - 4, cy, 3.5, -Math.PI * 0.45, Math.PI * 0.45);
  g.strokePath();
  g.lineStyle(1.8, 0xffaa33, 0.75);
  g.beginPath();
  g.arc(cx - 4, cy, 6, -Math.PI * 0.5, Math.PI * 0.5);
  g.strokePath();
  g.lineStyle(1.5, 0xff8822, 0.55);
  g.beginPath();
  g.arc(cx - 4, cy, 9, -Math.PI * 0.55, Math.PI * 0.55);
  g.strokePath();

  // Bright impact flash at knuckle
  g.fillStyle(0xffffcc, 0.9);
  g.fillCircle(cx - 3, cy, 2);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 3, cy, 1);

  // TARGET SILHOUETTE being punted right — small stubby figure
  // launched backward with motion lines.
  g.fillStyle(0x1a0408, 1);
  // Body (little blob)
  g.fillEllipse(cx + 8, cy, 3.5, 4);
  // Head
  g.fillCircle(cx + 8, cy - 3, 1.8);
  // Arms flung back
  g.fillRect(cx + 5, cy - 1, 2, 0.8);
  g.fillRect(cx + 5, cy + 1, 2, 0.8);
  // Little feet up (flying)
  g.fillRect(cx + 10, cy + 1, 1.5, 0.8);
  g.fillRect(cx + 10, cy + 2.5, 1.5, 0.8);

  // Motion speed lines behind the target — "just got hit" punctuation
  g.fillStyle(0xffcc44, 0.9);
  g.fillRect(cx + 4, cy - 2, 3, 0.5);
  g.fillStyle(0xffaa33, 0.8);
  g.fillRect(cx + 3, cy + 1, 3.5, 0.5);
  g.fillStyle(0xff8822, 0.7);
  g.fillRect(cx + 4, cy + 3, 2.5, 0.4);

  // Little impact sparks on target body
  g.fillStyle(0xffffcc, 1);
  g.fillCircle(cx + 7, cy - 1, 0.5);
  g.fillCircle(cx + 9, cy + 1.5, 0.5);

  g.generateTexture('ucard_stat_knockback', s, s);
  g.destroy();
}

/**
 * U1 Rune tier — single shared 32×32 carved-stone panel with a
 * stylised rune-cross glyph. Every rune card points at this texture
 * key in v1; M3 polish will fan out per-id glyph variants (authored or
 * procedural-by-id-hash). See RUNE_GLYPH_TEXTURE_KEY in data/runes.ts.
 */
function drawRuneGlyph(scene: Phaser.Scene): void {
  const s = 32, g = scene.add.graphics();
  // Stone panel background with rune-mauve wash.
  cardIconBg(g, s, 0x2f2940);
  const cx = 16, cy = 16;
  // Outer carved border — chipped stone, not a blank grey tile.
  g.fillStyle(0x171320, 1);
  g.fillRoundedRect(5, 5, 22, 22, 4);
  g.fillStyle(0x4e465e, 1);
  g.fillRoundedRect(6, 6, 20, 20, 3);
  g.fillStyle(0x6a5b7a, 0.55);
  g.fillRoundedRect(8, 8, 16, 16, 2);
  g.lineStyle(0.7, 0x161020, 0.75);
  g.lineBetween(8, 11, 13, 8);
  g.lineBetween(22, 9, 20, 14);
  g.lineBetween(10, 24, 15, 22);
  g.lineBetween(23, 21, 19, 24);

  // Warm glow behind the mark so the card reads magical at 32px.
  g.fillStyle(0xe7c85a, 0.18);
  g.fillCircle(cx, cy, 9);
  g.fillStyle(0x9c7df0, 0.12);
  g.fillCircle(cx, cy, 12);

  // Carved rune cross — dark incised trench first.
  g.lineStyle(3, 0x0e0a14, 1);
  g.beginPath();
  g.moveTo(cx, cy - 7);
  g.lineTo(cx, cy + 7);
  g.moveTo(cx, cy - 4);
  g.lineTo(cx - 4, cy - 7);
  g.moveTo(cx, cy - 4);
  g.lineTo(cx + 4, cy - 7);
  g.moveTo(cx, cy + 3);
  g.lineTo(cx + 4, cy + 6);
  g.strokePath();

  // Lit inlay stroke — gold plus mauve gleam along the carved edge.
  g.lineStyle(1.4, 0xe7c85a, 0.95);
  g.beginPath();
  g.moveTo(cx, cy - 7);
  g.lineTo(cx, cy + 7);
  g.moveTo(cx, cy - 4);
  g.lineTo(cx - 4, cy - 7);
  g.moveTo(cx, cy - 4);
  g.lineTo(cx + 4, cy - 7);
  g.moveTo(cx, cy + 3);
  g.lineTo(cx + 4, cy + 6);
  g.strokePath();
  g.lineStyle(0.7, 0xf6e7a5, 0.9);
  g.beginPath();
  g.moveTo(cx - 0.4, cy - 6);
  g.lineTo(cx - 0.4, cy + 5);
  g.strokePath();
  // Four small thistle/pictish dot anchors around the glyph.
  g.fillStyle(0xb58cff, 0.9);
  g.fillCircle(cx - 7, cy, 1);
  g.fillCircle(cx + 7, cy, 1);
  g.fillCircle(cx, cy - 9, 0.9);
  g.fillCircle(cx, cy + 9, 0.9);
  g.fillStyle(0xffffff, 0.75);
  g.fillCircle(cx - 7.2, cy - 0.3, 0.35);
  g.generateTexture('rune_glyph', s, s);
  g.destroy();
}

/**
 * Bake every upgrade-card icon. Nine accessory cards + nine stat
 * cards = 18 textures total. Order matches BootScene's original call
 * sequence.
 */
export function bakeCardIcons(scene: Phaser.Scene): void {
  // Accessory passive cards
  drawSporran(scene);
  drawWhiskyFlask(scene);
  // Kilt card icon baked per-variant so the card matches the active tartan.
  for (const vk of VARIANT_KEYS) {
    drawKilt(scene, vk);
  }
  drawTamOShanter(scene);
  drawIrnBru(scene);
  drawLochWater(scene);
  drawThistleCrown(scene);
  drawHighlandShield(scene);
  drawTartanSash(scene);
  // Stat boost cards
  drawStatHealth(scene);
  drawStatSpeed(scene);
  drawStatPickup(scene);
  drawStatDamage(scene);
  drawStatDrift(scene);
  drawStatDefense(scene);
  drawStatUtility(scene);
  drawStatCooldown(scene);
  drawStatKnockback(scene);
  // U1 Rune tier — shared glyph.
  drawRuneGlyph(scene);
}
