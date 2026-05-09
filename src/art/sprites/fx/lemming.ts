/**
 * `fx_lemming` — DESIGN_IDEAS §13 Scottish-games-lineage homage.
 *
 * A tiny pixel lemming: green hair, blue tunic, two stub legs. The
 * 1991 silhouette by DMA Design (Dundee) is a 14×16-ish sprite —
 * iconic enough at this scale that the brain reads it instantly even
 * without a face. WHS pays affectionate tribute to Scotland's
 * foundational games studio: the parade walks across the screen at
 * 90 s of coastal idle, falls off the cliff, and is gone. Once-per-
 * variant.
 *
 * Visually 10×14 px:
 *   - Bright DMA-green hair (4×3 cap on top).
 *   - Pale skin (2-pixel face strip; no features — silhouette only).
 *   - Royal-blue tunic (full body, 6×6 block).
 *   - Two darker-blue legs (2×3 each, splayed for the walk pose).
 *
 * Tonal palette: Wild Comedy (per ART_STYLE_BIBLE) — primary saturated
 * colours that pop against the muted moor; the joke is partly that
 * the cartoon-bright sprite reads as transplanted from another era's
 * games.
 *
 * Registered in `bakeFx()` so the texture is cached before any
 * `scene.add.image('fx_lemming', …)` call from the LemmingsEasterEgg
 * orchestrator. The orchestrator falls back to a tinted rect if the
 * texture is missing — pattern matches the texture-exists guard from
 * CLAUDE.md § new-system safety checklist.
 */
import * as Phaser from 'phaser';

export const LEMMING_TEXTURE_KEY = 'fx_lemming';

export function bakeLemming(scene: Phaser.Scene): void {
  const w = 10;
  const h = 14;
  const g = scene.add.graphics();

  // ── Body silhouette — outline first so the in-fill colours are
  //    contained against the moor's clutter. Single-pixel dark border. ──
  g.fillStyle(0x1a1a2a, 1);
  g.fillRect(2, 1, 6, 12);

  // ── Hair cap — DMA-green, the signature feature. 4-wide cap with a
  //    small forward-tuft. ──
  g.fillStyle(0x44dd44, 1);
  g.fillRect(3, 2, 4, 2);
  g.fillStyle(0x66ee66, 1);
  g.fillRect(4, 1, 2, 1);

  // ── Face strip — pale skin, two pixels tall. No features — keeping
  //    the pixel honest at this scale. ──
  g.fillStyle(0xf0c8a0, 1);
  g.fillRect(3, 4, 4, 2);

  // ── Tunic — royal blue body. The colour-pop frames the silhouette
  //    against any biome. ──
  g.fillStyle(0x3050cc, 1);
  g.fillRect(3, 6, 4, 5);

  // ── Tunic shoulder highlight — a pixel of brighter blue on the
  //    left edge so the body reads slightly three-dimensional even at
  //    this scale. ──
  g.fillStyle(0x6080ee, 1);
  g.fillRect(3, 6, 1, 3);

  // ── Legs — two stub legs, splayed in a walk pose. Darker than the
  //    tunic so the silhouette transitions cleanly. ──
  g.fillStyle(0x1a3088, 1);
  g.fillRect(3, 11, 1, 2);
  g.fillRect(6, 11, 1, 2);

  // ── Foot accents — a single pixel below each leg so the walk pose
  //    pops mid-stride. ──
  g.fillStyle(0x40406a, 1);
  g.fillRect(3, 13, 1, 1);
  g.fillRect(6, 13, 1, 1);

  g.generateTexture(LEMMING_TEXTURE_KEY, w, h);
  g.destroy();
}
