import * as Phaser from 'phaser';
import { cardIconBg } from './_shared';

/**
 * `ucard_tuning_fork` — Wild Living World Phase 2 passive icon.
 *
 * A brass tuning fork held vertical on the card with a soft glow at
 * the tines (the moment after a struck note rings out). Three thin
 * concentric arcs around the head sell the audible vibration without
 * relying on motion. Brass body keeps it warm; the spark of pale
 * highlight ties it visually to the Whetstone card so both rhythm/
 * blade-evolution passives read as "small craft tools".
 *
 * Pairs with the Waulking Mallet weapon for the Pibroch Hammer
 * evolution. Pure card icon — no in-world entity uses this texture.
 */
export function drawTuningFork(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  cardIconBg(g, s, 0x12141d);
  const cx = 16;
  const cy = 16;

  // Drop shadow under the handle.
  g.fillStyle(0x000000, 0.4);
  g.fillEllipse(cx, cy + 11, 8, 1.6);

  const BRASS_DARK = 0x4a3a14;
  const BRASS = 0xb88a32;
  const BRASS_HI = 0xe8c060;
  const BRASS_GLINT = 0xfff0a0;

  // ── Handle — short stem, brass, the bit you grip between thumb
  // and forefinger.
  g.fillStyle(BRASS_DARK, 1);
  g.fillRect(cx - 1.6, cy + 2, 3.2, 9);
  g.fillStyle(BRASS, 1);
  g.fillRect(cx - 1.2, cy + 2, 2.4, 8.6);
  g.fillStyle(BRASS_HI, 1);
  g.fillRect(cx - 0.8, cy + 2.4, 0.9, 7.4);

  // ── Yoke — U-bend where the two tines join.
  g.fillStyle(BRASS_DARK, 1);
  g.fillRoundedRect(cx - 5, cy - 1, 10, 4, 1.6);
  g.fillStyle(BRASS, 1);
  g.fillRoundedRect(cx - 4.4, cy - 0.6, 8.8, 3.2, 1.3);
  g.fillStyle(BRASS_HI, 0.8);
  g.fillRect(cx - 3.6, cy - 0.3, 7.2, 0.7);

  // ── Tines — two upright bars rising from the yoke, equal length.
  for (const dx of [-3.4, 3.4]) {
    // Dark outline
    g.fillStyle(BRASS_DARK, 1);
    g.fillRoundedRect(cx + dx - 1.2, cy - 11, 2.4, 11, 0.8);
    g.fillStyle(BRASS, 1);
    g.fillRoundedRect(cx + dx - 0.9, cy - 11, 1.8, 10.5, 0.6);
    g.fillStyle(BRASS_HI, 1);
    g.fillRect(cx + dx - 0.5, cy - 10.6, 0.7, 9.7);
  }

  // ── Glint at the top of one tine — the haggis just struck it.
  g.fillStyle(BRASS_GLINT, 1);
  g.fillCircle(cx + 3.4, cy - 10.3, 0.9);
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(cx + 3.1, cy - 10.6, 0.5, 0.5);

  // ── Three concentric arcs across the top — visible audio.
  // Drawn as thin partial rings using fillEllipse pairs (Phaser
  // Graphics doesn't ship a partial-ring primitive; ellipse-overlay
  // is the cheapest legible shape).
  const arcColours = [0xffe080, 0xb88a32, 0x6a5018];
  const arcAlphas = [0.75, 0.55, 0.35];
  for (let i = 0; i < 3; i++) {
    const r = 4 + i * 3.2;
    g.lineStyle(0.8, arcColours[i], arcAlphas[i]);
    g.strokeEllipse(cx + 3.4, cy - 10, r * 2, r * 2);
  }
  // No explicit "reset" — Phaser 4's `Graphics.lineStyle` is set per
  // stroke call (every other icon follows the same convention; see
  // `runeGlyph.ts`, `irnBru.ts`). The next call would set its own
  // width/colour/alpha if it needed strokes.

  g.generateTexture('ucard_tuning_fork', s, s);
  g.destroy();
}
