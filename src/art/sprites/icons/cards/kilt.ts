import * as Phaser from 'phaser';
import { cardIconBg, darkenHex } from './_shared';
import { resolveKiltPalette } from '../../../kiltPalette';
export function drawKilt(scene: Phaser.Scene, variantKey: string = 'classic'): void {
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
