/**
 * `landmark_clootie_tree` — DESIGN_IDEAS §1 Clootie Rag Wager.
 *
 * A bare hawthorn over a holy spring, branches hung with strips of
 * cloth tied by pilgrims as supplications for healing. Real Scottish
 * folk-architecture: Munlochy, Avoch, Culloden, the Black Isle. The
 * cloth represented the affliction; as it rotted on the branch, the
 * affliction was meant to fade — hence the rags' weathered, faded
 * palette here.
 *
 * Visually a 28×40 stand-up landmark:
 *   - Twisted trunk in warm dark brown (sun-warmed bark on the
 *     upper-right edge, dark on the leeward side).
 *   - Sparse bare branches reaching out asymmetrically (no leaves —
 *     clootie hawthorns are typically bare-branch, the sacred shape).
 *   - 4 rag ribbons knotted to branches at varying heights, in muted
 *     supplicant colours (cream, pale blue, faded pink, tan).
 *   - A still well-pool at the base — dark slate-blue with a single
 *     bright highlight reading as "the water just settled".
 *
 * Tonal palette: Wild (slate / brown / muted ribbons) per
 * ART_STYLE_BIBLE.md. The clootie tree is a moor-bound supplication
 * landmark, not a hearth-warm collectible — read closer to the
 * cairn-stone register than the gilt reliquary.
 *
 * Registered in `bakePickups()` so the texture is cached before any
 * `scene.add.sprite('landmark_clootie_tree', …)` call from
 * `clootieTree.ts`. The orchestrator falls back to a tinted rectangle
 * if the texture is missing — pattern matches the texture-exists
 * guard in `CLAUDE.md` § new-system safety checklist.
 */
import * as Phaser from 'phaser';

export const CLOOTIE_TREE_TEXTURE_KEY = 'landmark_clootie_tree';

export function bakeClootieTree(scene: Phaser.Scene): void {
  const w = 28;
  const h = 40;
  const g = scene.add.graphics();

  // ── Ground shadow under the well-pool — soft, layered. ──
  g.fillStyle(0x000000, 0.34);
  g.fillEllipse(w / 2, h - 3, 22, 4);
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(w / 2, h - 2, 26, 5);

  // ── Well-pool — the spring under the tree. Dark slate-blue with a
  //    single bright sliver of reflected light. The pool is the
  //    folkloric heart of the landmark; the tree just marks where to
  //    leave the cloth. ──
  g.fillStyle(0x2a3a4a, 1);
  g.fillEllipse(w / 2, h - 5, 18, 6);
  g.fillStyle(0x4a6a7a, 1);
  g.fillEllipse(w / 2 - 3, h - 6, 6, 1.5);
  g.fillStyle(0x88aabb, 0.9);
  g.fillRect(w / 2 - 4, h - 6.5, 4, 0.5);

  // ── Trunk — twisted, leans slightly left. Warm dark brown body
  //    with a leeward shadow strip and a sun-warmed highlight on the
  //    right edge so the silhouette reads three-dimensional. ──
  g.fillStyle(0x2a1a14, 1);
  g.fillRect(w / 2 - 3, 8, 6, h - 14);
  g.fillStyle(0x4a3a2c, 1);
  g.fillRect(w / 2 - 2.5, 8, 5, h - 14);
  g.fillStyle(0x6a5a4c, 1);
  g.fillRect(w / 2 + 1, 9, 1, h - 16);
  // Bark crack — diagonal slash.
  g.lineStyle(1, 0x2a1a14, 0.7);
  g.beginPath();
  g.moveTo(w / 2 - 1, 12);
  g.lineTo(w / 2 + 1, h - 14);
  g.strokePath();

  // ── Branches — three asymmetric stubs. Bare. The hawthorn at the
  //    holy well is typically winter-shaped, leafless even in summer
  //    by ritual. ──
  g.fillStyle(0x2a1a14, 1);
  g.fillRect(w / 2 - 8, 6, 6, 1.5);  // left low
  g.fillRect(w / 2 + 2, 4, 6, 1.5);  // right mid
  g.fillRect(w / 2 - 4, 2, 4, 1.5);  // left top

  // ── Rag ribbons — knot at the branch, loose tail hanging. Each rag
  //    is a soft cluster: a small "knot" pixel + a tapered "tail"
  //    rect 4-5 px long. Colours sit in the supplicant palette
  //    (cream, pale blue, faded pink, tan) — none saturated, all
  //    weathered. ──
  // cream rag — left-low branch
  g.fillStyle(0xddd0b0, 1);
  g.fillRect(w / 2 - 6, 7, 1.5, 1);
  g.fillRect(w / 2 - 6, 8, 1, 4);
  // pale blue rag — right-mid branch
  g.fillStyle(0xa0a0c0, 1);
  g.fillRect(w / 2 + 5, 5.5, 1.5, 1);
  g.fillRect(w / 2 + 5, 6.5, 1, 5);
  // faded pink rag — left-top branch
  g.fillStyle(0xc09090, 1);
  g.fillRect(w / 2 - 3, 3.5, 1.5, 1);
  g.fillRect(w / 2 - 3, 4.5, 1, 4);
  // tan rag — trunk mid (a low pilgrim's tie)
  g.fillStyle(0xb0a070, 1);
  g.fillRect(w / 2 + 2, 18, 1.5, 1);
  g.fillRect(w / 2 + 2, 19, 1, 3);

  g.generateTexture(CLOOTIE_TREE_TEXTURE_KEY, w, h);
  g.destroy();
}
