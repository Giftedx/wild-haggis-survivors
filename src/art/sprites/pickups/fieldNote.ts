/**
 * `pickup_field_note` — a Haggis Wildlife Foundation field note dropped on
 * a `haggis_hunter` enemy kill. Wild-haggis-myth tribute (DESIGN_IDEAS.md
 * §11): the faux-naturalist "Foundation" tagged the haggis like a
 * specimen and noted the clockwise drift in their absurd-serious
 * cataloguing voice. Mechanically a flavoured XP gem with a 12 s
 * despawn — sister to the tourist Polaroid (lifecycle parity) but
 * voiced by a *different* faction (tourists snap photos; hunters
 * write notebooks).
 *
 * Visually a 20×22 folded sheet of fieldwork paper:
 *   - cream parchment body with a warm-tan fold crease down the middle
 *   - three tan-ink scribble lines (mock-handwriting at sprite scale)
 *   - a moss-green tag cord knotted at the top-right corner (the
 *     specimen-tag silhouette that ties the prop to the
 *     "Foundation" lineage in a single visual beat)
 *   - tiny rolled bottom-left corner — the page has been folded and
 *     re-folded in a hunter's pocket
 *   - subtle drop shadow underneath, same shape as the polaroid prop
 *     so the two pickups read as a pair
 *
 * Tonal palette: Hearth (cream + warm-tan + moss-green + ink) per
 * ART_STYLE_BIBLE.md. Picks up the same Hearth slot as the polaroid
 * (cream-paper-on-moor) but the green tag-cord is the visual tell
 * that this is the *naturalist's* drop, not the *tourist's*.
 *
 * Registered in `bakePickups()` so the texture is cached before any
 * `scene.add.image('pickup_field_note', …)` call from PickupSpawner.
 */
import * as Phaser from 'phaser';

export const FIELD_NOTE_TEXTURE_KEY = 'pickup_field_note';

export function bakeFieldNote(scene: Phaser.Scene): void {
  const w = 20;
  const h = 22;
  const g = scene.add.graphics();

  // Drop shadow underneath — matches the polaroid silhouette so the
  // two pickups read as a kindred pair when both lie on the same moor.
  g.fillStyle(0x000000, 0.25);
  g.fillEllipse(w / 2, h - 1, w - 4, 2);

  // Cream parchment body. Slight off-white so it holds against the
  // bright moor backgrounds; faint warm-tan stroke for definition
  // against the heather.
  g.fillStyle(0xf3ecd4, 1);
  g.fillRoundedRect(0, 0, w, h - 1, 1);
  g.lineStyle(1, 0xb8a574, 0.85);
  g.strokeRoundedRect(0.5, 0.5, w - 1, h - 2, 1);

  // Centre fold crease — a single warm-tan vertical hairline. The
  // page has been folded once down the middle (a fieldworker's
  // habit; pocket-flat). Reads the prop as "notebook page" rather
  // than "photograph", separating it from the polaroid silhouette.
  g.lineStyle(1, 0xc9b78a, 0.5);
  g.beginPath();
  g.moveTo(w / 2, 2);
  g.lineTo(w / 2, h - 4);
  g.strokePath();

  // Three tan-ink scribble lines — mock-handwriting at this scale.
  // Top one short ("entry no."), middle one the longest ("the body
  // text"), bottom one a half-line ("trailing signature"). Avoid
  // running off the centre crease so the fold reads first.
  g.fillStyle(0x5a3a18, 1);
  g.fillRect(3, 4, 5, 1);  // top — short header line
  g.fillRect(11, 4, 5, 1); // top — right-page header line
  g.fillRect(3, 8, 6, 1);  // mid — body line left
  g.fillRect(11, 8, 6, 1); // mid — body line right
  g.fillRect(3, 11, 6, 1); // mid — body line 2 left
  g.fillRect(11, 11, 6, 1); // mid — body line 2 right
  g.fillRect(3, 14, 4, 1); // sig — short trailing left
  g.fillRect(11, 14, 4, 1); // sig — short trailing right

  // Tiny rolled bottom-left corner — sells "folded and re-folded".
  // A short tan curve carved out of the page's lower-left, then
  // shaded as a slightly darker triangle to fake depth.
  g.fillStyle(0xe5d9b3, 1);
  g.fillTriangle(0, h - 5, 4, h - 1, 0, h - 1);
  g.lineStyle(1, 0xb8a574, 0.7);
  g.beginPath();
  g.moveTo(0, h - 5);
  g.lineTo(4, h - 1);
  g.strokePath();

  // Moss-green specimen-tag cord at the top-right corner. A short
  // diagonal stroke from the page edge out to a tiny knot. The
  // cord visually anchors the field-note to the
  // "Foundation tagged-the-haggis" lineage in §11 — the faux-
  // naturalist tells the joke at a single-pixel scale.
  g.lineStyle(1, 0x4a6a3a, 1);
  g.beginPath();
  g.moveTo(w - 4, 1);
  g.lineTo(w - 1, 4);
  g.strokePath();
  // Knot pip on the cord's outer end.
  g.fillStyle(0x3a5a2a, 1);
  g.fillRect(w - 2, 4, 2, 2);
  // Tag pip — small green dot at the cord's outer end suggesting
  // the metal eyelet on a specimen tag.
  g.fillStyle(0x8aae6a, 1);
  g.fillRect(w - 2, 1, 1, 1);

  g.generateTexture(FIELD_NOTE_TEXTURE_KEY, w, h);
  g.destroy();
}
