/**
 * Moor Road node marker sprites. Each marker reads as its own concept
 * (warning sign, cairn, pedlar's pack, fairy ring, etc.) instead of
 * the prior "coloured icon stamped inside a circular bowl" template.
 *
 * Audit ranked the family at the 8.0 floor with the note "repeated
 * circles flatten" — this pass replaces the shared `base()` halo
 * with bespoke silhouettes anchored by a small drop shadow only.
 * Texture keys, canvas size (44×44), and pivot remain unchanged so
 * `NodeMarkerSystem` and `textureForNode()` need no edits.
 */
import * as Phaser from 'phaser';

type DrawFn = (g: Phaser.GameObjects.Graphics) => void;

const W = 44;
const H = 44;

function bake(scene: Phaser.Scene, key: string, draw: DrawFn): void {
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, W, H);
  g.destroy();
}

/** Soft elliptical drop shadow shared by every marker — sells "sitting
 *  on the moor" without the old halo bowl that flattened silhouettes. */
function groundShadow(g: Phaser.GameObjects.Graphics, cx: number, baseY: number, w = 18): void {
  g.fillStyle(0x000000, 0.32);
  g.fillEllipse(cx, baseY, w, 4.5);
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(cx, baseY, w + 4, 6);
}

/** Tiny coloured tag at the top-left so colourblind players keep the
 *  old colour cue even though the bowl is gone. ~3px corner pip. */
function colourTag(g: Phaser.GameObjects.Graphics, colour: number): void {
  g.fillStyle(colour, 0.85);
  g.fillCircle(7, 7, 2.6);
  g.fillStyle(0xffffff, 0.55);
  g.fillCircle(6.5, 6.5, 0.9);
}

export function bakeNodeMarkers(scene: Phaser.Scene): void {
  // ─────────────────────────────────────────────────────────────
  // ENCOUNTER — wooden warning post with triangular sign
  // ─────────────────────────────────────────────────────────────
  bake(scene, 'node_marker_encounter', (g) => {
    groundShadow(g, 22, 40);
    // Post
    g.fillStyle(0x2a1808, 1);
    g.fillRect(20, 22, 4, 16);
    g.fillStyle(0x6a4220, 1);
    g.fillRect(20.5, 22, 3, 16);
    g.fillStyle(0x8a5a30, 0.6);
    g.fillRect(21, 23, 0.8, 14);
    // Sign frame
    g.fillStyle(0x1a0e04, 1);
    g.fillTriangle(22, 6, 8, 24, 36, 24);
    // Sign face — Highland warning yellow
    g.fillStyle(0xf2c43a, 1);
    g.fillTriangle(22, 9, 11, 23, 33, 23);
    // Inner edge highlight
    g.fillStyle(0xffe88c, 0.6);
    g.fillTriangle(22, 10, 12, 22, 32, 22);
    g.fillStyle(0xf2c43a, 1);
    g.fillTriangle(22, 12, 13, 21, 31, 21);
    // Exclamation
    g.fillStyle(0x4a1a08, 1);
    g.fillRect(21, 14, 2, 5);
    g.fillRect(21, 20, 2, 1.6);
    // Nail in post
    g.fillStyle(0x1a1208, 1);
    g.fillCircle(20.5, 27, 0.7);
    g.fillCircle(23.5, 27, 0.7);
    colourTag(g, 0xd56a3a);
  });

  // ─────────────────────────────────────────────────────────────
  // ELITE — laurel-flanked golden five-point star
  // ─────────────────────────────────────────────────────────────
  bake(scene, 'node_marker_elite', (g) => {
    groundShadow(g, 22, 40);
    // Two laurel leaves at the base
    g.fillStyle(0x2a4a14, 1);
    g.fillEllipse(13, 36, 8, 4);
    g.fillEllipse(31, 36, 8, 4);
    g.fillStyle(0x4d7528, 1);
    g.fillEllipse(13, 35.5, 6, 3);
    g.fillEllipse(31, 35.5, 6, 3);
    g.fillStyle(0x76a13a, 0.85);
    g.fillEllipse(13, 35, 4, 2);
    g.fillEllipse(31, 35, 4, 2);
    // Five-point star — outline
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 14 : 6;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      pts.push([22 + Math.cos(a) * r, 22 + Math.sin(a) * r]);
    }
    g.fillStyle(0x3a2008, 1);
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
    g.fillPath();
    // Inner star (slightly smaller, gold)
    const inner: Array<[number, number]> = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 12.5 : 5.2;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      inner.push([22 + Math.cos(a) * r, 22 + Math.sin(a) * r]);
    }
    g.fillStyle(0xe0b84a, 1);
    g.beginPath();
    g.moveTo(inner[0][0], inner[0][1]);
    for (let i = 1; i < inner.length; i++) g.lineTo(inner[i][0], inner[i][1]);
    g.closePath();
    g.fillPath();
    // Bright centre + radial glints
    g.fillStyle(0xffef8a, 1);
    g.fillCircle(22, 22, 3.5);
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(20.5, 20.5, 1.2);
    // Tip glints
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(22, 9, 0.9);
    g.fillCircle(34, 17, 0.7);
    g.fillCircle(10, 17, 0.7);
    colourTag(g, 0xe0b84a);
  });

  // ─────────────────────────────────────────────────────────────
  // REST — crossed logs with a small fire and embers
  // ─────────────────────────────────────────────────────────────
  bake(scene, 'node_marker_rest', (g) => {
    groundShadow(g, 22, 40, 22);
    // Two crossed logs (X-frame)
    g.fillStyle(0x2a1408, 1);
    g.fillRect(8, 30, 28, 4);
    g.fillStyle(0x6a3818, 1);
    g.fillRect(9, 30.5, 26, 3);
    g.fillStyle(0x4a2410, 0.7);
    g.fillRect(9, 32, 26, 1);
    // End rings
    g.fillStyle(0xa66838, 1);
    g.fillCircle(9, 32, 1.6);
    g.fillCircle(35, 32, 1.6);
    g.fillStyle(0x4a2410, 1);
    g.fillCircle(9, 32, 0.7);
    g.fillCircle(35, 32, 0.7);
    // Second log (rotated, behind the first)
    g.fillStyle(0x2a1408, 1);
    g.fillTriangle(11, 36, 33, 36, 22, 26);
    g.fillStyle(0x5a3018, 1);
    g.fillTriangle(13, 35, 31, 35, 22, 28);
    // Flame — orange/yellow tongues
    g.fillStyle(0xc83a08, 1);
    g.fillTriangle(22, 8, 14, 28, 30, 28);
    g.fillStyle(0xf26a18, 1);
    g.fillTriangle(22, 11, 16, 27, 28, 27);
    g.fillStyle(0xffae3a, 1);
    g.fillTriangle(22, 14, 18, 26, 26, 26);
    g.fillStyle(0xfff4a8, 0.95);
    g.fillTriangle(22, 18, 20, 25, 24, 25);
    // Inner hot core
    g.fillStyle(0xffffff, 0.7);
    g.fillEllipse(22, 23, 2, 3);
    // Ember sparks rising
    g.fillStyle(0xffd86a, 0.9);
    g.fillCircle(20, 6, 0.8);
    g.fillCircle(26, 9, 0.7);
    g.fillCircle(24, 4, 0.6);
    g.fillStyle(0xff8a3a, 0.85);
    g.fillCircle(18, 12, 0.5);
    g.fillCircle(28, 13, 0.5);
    colourTag(g, 0x7bb06a);
  });

  // ─────────────────────────────────────────────────────────────
  // HIDDEN — torn parchment scroll with a question mark
  // ─────────────────────────────────────────────────────────────
  bake(scene, 'node_marker_hidden', (g) => {
    groundShadow(g, 22, 40, 22);
    // Parchment back shadow
    g.fillStyle(0x2a2218, 1);
    g.fillRoundedRect(8, 12, 28, 24, 2);
    // Parchment body
    g.fillStyle(0xd8c890, 1);
    g.fillRoundedRect(9, 13, 26, 22, 2);
    g.fillStyle(0xe8d8a8, 1);
    g.fillRoundedRect(10, 14, 24, 20, 1.5);
    // Torn lower edge — jagged triangles
    g.fillStyle(0xc8b878, 1);
    g.fillTriangle(10, 33, 14, 36, 18, 33);
    g.fillTriangle(18, 33, 22, 36, 26, 33);
    g.fillTriangle(26, 33, 30, 36, 34, 33);
    // Burn / age stains
    g.fillStyle(0xa68a48, 0.45);
    g.fillCircle(13, 17, 1.6);
    g.fillCircle(31, 30, 1.4);
    g.fillStyle(0x6a4818, 0.35);
    g.fillRect(11, 32, 4, 1);
    g.fillRect(28, 14, 5, 0.8);
    // Question mark — bold ink
    g.fillStyle(0x2a1808, 1);
    // Top curve (approximate via filled wedges)
    g.fillEllipse(22, 19, 8, 3);
    g.fillRect(24, 19, 2.5, 4);
    g.fillRect(22, 22.5, 4, 2.2);
    g.fillRect(21, 24, 2.6, 2.6);
    // Dot
    g.fillRect(21, 28.5, 2.5, 2.5);
    // Ink highlight
    g.fillStyle(0x6a3a18, 0.6);
    g.fillEllipse(22, 18.5, 5, 1);
    // Frayed edge pixel marks
    g.fillStyle(0xb89858, 0.7);
    g.fillRect(9, 18, 1, 0.5);
    g.fillRect(35, 22, 1, 0.5);
    colourTag(g, 0x8aa0b8);
  });

  // ─────────────────────────────────────────────────────────────
  // SHRINE — three-stone cairn with a faint witch-light glow
  // ─────────────────────────────────────────────────────────────
  bake(scene, 'node_marker_shrine', (g) => {
    groundShadow(g, 22, 40, 22);
    // Faint purple aura
    g.fillStyle(0xa887d8, 0.18);
    g.fillCircle(22, 18, 16);
    g.fillStyle(0xc4a8e8, 0.22);
    g.fillCircle(22, 20, 11);
    // Bottom (largest) stone
    g.fillStyle(0x1a1410, 1);
    g.fillEllipse(22, 36, 22, 8);
    g.fillStyle(0x4a4238, 1);
    g.fillEllipse(22, 35, 19, 6);
    g.fillStyle(0x6a604e, 0.85);
    g.fillEllipse(21, 34, 14, 3);
    // Middle stone
    g.fillStyle(0x1a1410, 1);
    g.fillEllipse(22, 27, 16, 6);
    g.fillStyle(0x5a504a, 1);
    g.fillEllipse(22, 26.5, 14, 5);
    g.fillStyle(0x80766a, 0.85);
    g.fillEllipse(21, 26, 10, 2.5);
    // Top stone
    g.fillStyle(0x1a1410, 1);
    g.fillEllipse(22, 19, 11, 5);
    g.fillStyle(0x6a605a, 1);
    g.fillEllipse(22, 18.5, 9, 4);
    g.fillStyle(0x90867a, 0.85);
    g.fillEllipse(21, 18, 5, 2);
    // Moss tuft on the top stone
    g.fillStyle(0x4d6828, 1);
    g.fillEllipse(20, 16.8, 4, 1.6);
    g.fillStyle(0x76a13a, 0.9);
    g.fillEllipse(20, 16.5, 2.5, 1);
    // Witch-light bead floating above
    g.fillStyle(0xdcc8ff, 0.85);
    g.fillCircle(22, 10, 1.8);
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(22, 10, 0.9);
    g.fillStyle(0xa887d8, 0.6);
    g.fillCircle(22, 10, 3);
    // Tiny rune mark on the middle stone
    g.fillStyle(0x2a1a30, 0.85);
    g.fillRect(20, 25, 0.6, 3);
    g.fillRect(19, 26, 3, 0.6);
    colourTag(g, 0xa887d8);
  });

  // ─────────────────────────────────────────────────────────────
  // WEE TRADER — pedlar's pack with rolled fabric and a lantern
  // ─────────────────────────────────────────────────────────────
  bake(scene, 'node_marker_trader', (g) => {
    groundShadow(g, 22, 40, 24);
    // Wooden frame (back support poles)
    g.fillStyle(0x2a1408, 1);
    g.fillRect(11, 14, 1.6, 22);
    g.fillRect(31, 14, 1.6, 22);
    g.fillStyle(0x6a3818, 1);
    g.fillRect(11.2, 14, 1.2, 22);
    g.fillRect(31.2, 14, 1.2, 22);
    // Main pack body — leather satchel
    g.fillStyle(0x2a1808, 1);
    g.fillRoundedRect(10, 22, 24, 16, 2);
    g.fillStyle(0x7a3a14, 1);
    g.fillRoundedRect(11, 23, 22, 14, 2);
    g.fillStyle(0x9a5028, 0.9);
    g.fillRoundedRect(12, 24, 20, 6, 1.5);
    // Strap across the front
    g.fillStyle(0x4a2810, 1);
    g.fillRect(10, 28, 24, 2);
    g.fillStyle(0x6a3a18, 1);
    g.fillRect(10, 28.3, 24, 1.4);
    // Brass buckle
    g.fillStyle(0xc88a14, 1);
    g.fillRect(20, 27, 4, 4);
    g.fillStyle(0xe8b048, 1);
    g.fillRect(20.3, 27.3, 3.4, 3.4);
    g.fillStyle(0x6e4408, 1);
    g.fillRect(21.5, 28, 1, 2.5);
    // Rolled fabric (tartan-ish) sticking out the top
    g.fillStyle(0x4a1818, 1);
    g.fillRect(13, 17, 5, 6);
    g.fillStyle(0x8a3030, 1);
    g.fillRect(13.5, 17.5, 4, 5);
    g.fillStyle(0xd4a017, 0.85);
    g.fillRect(13.5, 19, 4, 0.6);
    g.fillStyle(0xffe48a, 0.85);
    g.fillRect(15, 17.5, 0.6, 5);
    // Bundled jars / wares (small bumps)
    g.fillStyle(0x2a3a44, 1);
    g.fillCircle(25, 19, 2.5);
    g.fillStyle(0x4a6a78, 1);
    g.fillCircle(25, 18.5, 2);
    g.fillStyle(0xffffff, 0.65);
    g.fillCircle(24.5, 18, 0.6);
    // Hanging lantern on right pole
    g.fillStyle(0x1a1208, 1);
    g.fillRect(31, 11, 1, 4);
    g.fillStyle(0x2a1808, 1);
    g.fillRect(28, 14, 6, 6);
    g.fillStyle(0xffd460, 1);
    g.fillRect(29, 15, 4, 4);
    g.fillStyle(0xffeea0, 0.9);
    g.fillRect(29.5, 15.5, 3, 3);
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(31, 17, 0.8);
    // Lantern glow halo
    g.fillStyle(0xffd460, 0.18);
    g.fillCircle(31, 17, 6);
    colourTag(g, 0xd4a860);
  });

  // ─────────────────────────────────────────────────────────────
  // BARGAIN — open coin pouch, gold spilling out
  // ─────────────────────────────────────────────────────────────
  bake(scene, 'node_marker_bargain', (g) => {
    groundShadow(g, 22, 40, 24);
    // Spilled coins on the ground (behind the pouch)
    for (const [x, y] of [[8, 36], [12, 37.5], [33, 36.5], [37, 37], [16, 38], [29, 38]] as const) {
      g.fillStyle(0x6e4408, 1);
      g.fillEllipse(x, y, 5, 1.8);
      g.fillStyle(0xe0b84a, 1);
      g.fillEllipse(x, y - 0.4, 4.4, 1.4);
      g.fillStyle(0xffe48a, 0.7);
      g.fillEllipse(x - 0.6, y - 0.7, 2, 0.5);
    }
    // Pouch back shadow
    g.fillStyle(0x2a1408, 1);
    g.fillEllipse(22, 28, 22, 16);
    // Pouch body — leather
    g.fillStyle(0x6a3818, 1);
    g.fillEllipse(22, 28, 20, 14);
    g.fillStyle(0x8a4a20, 1);
    g.fillEllipse(22, 27, 18, 12);
    // Pouch rim (open mouth)
    g.fillStyle(0x2a1408, 1);
    g.fillEllipse(22, 18, 14, 4);
    g.fillStyle(0x4a2810, 1);
    g.fillEllipse(22, 18, 12, 3);
    // Drawstring loops dangling
    g.fillStyle(0x2a1408, 1);
    g.fillRect(15, 17, 0.8, 5);
    g.fillRect(28, 17, 0.8, 5);
    g.fillStyle(0x6a4220, 1);
    g.fillCircle(15.4, 22, 1.2);
    g.fillCircle(28.4, 22, 1.2);
    // Gold coins inside the pouch (stacked)
    g.fillStyle(0xc88a14, 1);
    g.fillEllipse(22, 17, 11, 3);
    g.fillStyle(0xe8b048, 1);
    g.fillEllipse(22, 16.5, 10, 2.5);
    g.fillStyle(0xffd86a, 1);
    g.fillEllipse(22, 16, 9, 2);
    g.fillStyle(0xfff4c8, 0.85);
    g.fillEllipse(20, 15.5, 4, 1);
    // Single coin standing on its edge poking out
    g.fillStyle(0x6e4408, 1);
    g.fillCircle(30, 13, 3);
    g.fillStyle(0xffd86a, 1);
    g.fillCircle(30, 13, 2.4);
    g.fillStyle(0x8a5818, 1);
    g.fillRect(28.6, 12.6, 2.8, 0.8);
    g.fillStyle(0xfff4c8, 0.85);
    g.fillCircle(29.3, 12.3, 0.7);
    // Faint sparkle
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(33, 10, 0.7);
    g.fillCircle(11, 12, 0.6);
    colourTag(g, 0xcc5870);
  });

  // ─────────────────────────────────────────────────────────────
  // PICTISH STONE — tall menhir with carved spiral and beast mark
  // ─────────────────────────────────────────────────────────────
  bake(scene, 'node_marker_pictish_stone', (g) => {
    groundShadow(g, 22, 40, 22);
    // Stone outline
    g.fillStyle(0x12120e, 1);
    g.fillRoundedRect(13, 6, 18, 32, 3);
    // Stone body — weathered grey-green
    g.fillStyle(0x6a7468, 1);
    g.fillRoundedRect(14, 7, 16, 30, 2.5);
    g.fillStyle(0x808a78, 1);
    g.fillRoundedRect(14.5, 7.5, 15, 29, 2);
    // Vertical lichen streaks
    g.fillStyle(0x4d6828, 0.5);
    g.fillRect(15, 10, 0.8, 18);
    g.fillRect(28, 12, 0.6, 14);
    g.fillStyle(0x8aa040, 0.6);
    g.fillRect(17, 8, 1, 6);
    // Light edge highlight (left)
    g.fillStyle(0xc8d0b0, 0.5);
    g.fillRect(15, 8, 1, 26);
    // Carved spiral (top symbol)
    g.lineStyle(1.2, 0x2a2a1a, 0.95);
    g.beginPath();
    g.moveTo(22, 12);
    g.arc(22, 13, 1.2, -Math.PI / 2, Math.PI * 1.5, false);
    g.strokePath();
    g.lineStyle(1.2, 0x2a2a1a, 0.95);
    g.strokeCircle(22, 13, 2.6);
    g.lineStyle(1, 0x2a2a1a, 0.9);
    g.strokeCircle(22, 13, 4);
    // Pictish beast — abstract crescent + V-rod
    g.fillStyle(0x2a2a1a, 1);
    g.fillEllipse(22, 21, 10, 2);
    g.fillRect(17, 21, 1.5, 4);
    g.fillRect(26, 21, 1.5, 4);
    // Bottom Z-rod
    g.lineStyle(1.2, 0x2a2a1a, 0.9);
    g.beginPath();
    g.moveTo(17, 28);
    g.lineTo(22, 30);
    g.lineTo(22, 28);
    g.lineTo(27, 30);
    g.strokePath();
    // Carved highlight (catches light)
    g.fillStyle(0xd8d0b0, 0.55);
    g.fillRect(20, 11, 0.4, 1);
    g.fillRect(21, 19, 0.4, 1);
    // Heather tuft at base
    g.fillStyle(0x6a3a8a, 0.85);
    g.fillCircle(11, 38, 1.2);
    g.fillCircle(33, 38, 1);
    colourTag(g, 0x90a090);
  });

  // ─────────────────────────────────────────────────────────────
  // CLOOTIE TREE — gnarled bare tree with wind-blown rags
  // ─────────────────────────────────────────────────────────────
  bake(scene, 'node_marker_clootie_tree', (g) => {
    groundShadow(g, 22, 40, 22);
    // Trunk (gnarled, slightly angled)
    g.fillStyle(0x1a0e04, 1);
    g.fillRect(20, 16, 4, 22);
    g.fillStyle(0x4a2810, 1);
    g.fillRect(20.5, 16.5, 3, 21);
    g.fillStyle(0x6a3a18, 0.9);
    g.fillRect(21, 17, 1.5, 19);
    // Bark texture lines
    g.fillStyle(0x2a1408, 1);
    g.fillRect(21.5, 19, 0.5, 6);
    g.fillRect(21.8, 26, 0.5, 8);
    // Root flare
    g.fillStyle(0x1a0e04, 1);
    g.fillTriangle(15, 38, 22, 34, 19, 38);
    g.fillTriangle(29, 38, 22, 34, 25, 38);
    g.fillStyle(0x4a2810, 0.9);
    g.fillTriangle(16, 37, 21, 35, 19, 37);
    // Bare branches
    g.lineStyle(1.6, 0x1a0e04, 1);
    g.beginPath();
    g.moveTo(22, 16);
    g.lineTo(13, 8);
    g.moveTo(22, 16);
    g.lineTo(31, 7);
    g.moveTo(22, 18);
    g.lineTo(8, 18);
    g.moveTo(22, 18);
    g.lineTo(36, 16);
    g.moveTo(22, 14);
    g.lineTo(22, 4);
    g.strokePath();
    // Branch highlights (sun catches the upper edge)
    g.lineStyle(0.6, 0x6a3a18, 0.85);
    g.beginPath();
    g.moveTo(22, 16);
    g.lineTo(13, 8);
    g.moveTo(22, 16);
    g.lineTo(31, 7);
    g.strokePath();
    // Smaller twig fork
    g.lineStyle(1, 0x2a1408, 0.95);
    g.beginPath();
    g.moveTo(13, 8);
    g.lineTo(10, 4);
    g.moveTo(31, 7);
    g.lineTo(34, 3);
    g.strokePath();
    // Rags tied on — pink, blue, cream, each with a wind-blown angle
    // Pink rag (left)
    g.fillStyle(0xc44060, 1);
    g.fillTriangle(11, 9, 7, 14, 8, 9);
    g.fillStyle(0xf0a0b8, 0.9);
    g.fillTriangle(10, 10, 7.5, 13, 9, 10);
    // Blue rag (right)
    g.fillStyle(0x4a78c8, 1);
    g.fillTriangle(31, 9, 36, 12, 32, 9);
    g.fillStyle(0x9fc0e8, 0.9);
    g.fillTriangle(31, 10, 35, 12, 32, 10);
    // Cream rag (centre)
    g.fillStyle(0xc8b878, 1);
    g.fillTriangle(22, 14, 18, 22, 22, 18);
    g.fillStyle(0xe8d8a8, 0.85);
    g.fillTriangle(22, 15, 19, 21, 22, 18);
    // Tied knots
    g.fillStyle(0x2a1408, 1);
    g.fillCircle(11, 9, 0.9);
    g.fillCircle(31, 9, 0.9);
    g.fillCircle(22, 14, 0.8);
    colourTag(g, 0x88a070);
  });

  // ─────────────────────────────────────────────────────────────
  // FAIRY RING — oval ring of fly agaric mushrooms (top-down view)
  // ─────────────────────────────────────────────────────────────
  bake(scene, 'node_marker_fairy_ring', (g) => {
    groundShadow(g, 22, 38, 30);
    // Soft fairy-light ground glow
    g.fillStyle(0xd890e0, 0.15);
    g.fillEllipse(22, 26, 30, 14);
    g.fillStyle(0xf0c8f0, 0.18);
    g.fillEllipse(22, 26, 22, 9);
    // Ring of mushrooms — 7 around a flat ellipse
    const count = 7;
    type Mushroom = { x: number; y: number; sx: number; sy: number; tilt: number };
    const mushrooms: Mushroom[] = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 - Math.PI / 2;
      const x = 22 + Math.cos(a) * 14;
      const y = 26 + Math.sin(a) * 7;
      // Front mushrooms larger than back ones (depth read)
      const depthScale = 0.8 + (Math.sin(a) + 1) * 0.25;
      mushrooms.push({ x, y, sx: depthScale, sy: depthScale, tilt: Math.cos(a) * 0.6 });
    }
    // Sort back-to-front so front mushrooms overlap rear ones
    mushrooms.sort((a, b) => a.y - b.y);
    for (const m of mushrooms) {
      const sx = m.sx;
      const sy = m.sy;
      // Stem
      g.fillStyle(0x2a1408, 1);
      g.fillRect(m.x - 1 * sx + m.tilt, m.y - 1, 2 * sx, 4 * sy);
      g.fillStyle(0xf0e0c0, 1);
      g.fillRect(m.x - 0.7 * sx + m.tilt, m.y - 0.5, 1.4 * sx, 3.5 * sy);
      // Cap shadow
      g.fillStyle(0x6a1014, 1);
      g.fillEllipse(m.x, m.y - 1.5, 6.5 * sx, 3.6 * sy);
      // Cap red
      g.fillStyle(0xc41a1a, 1);
      g.fillEllipse(m.x, m.y - 2, 6 * sx, 3.2 * sy);
      // Cap top brighter
      g.fillStyle(0xea3a3a, 1);
      g.fillEllipse(m.x - 0.4, m.y - 2.5, 4.4 * sx, 2 * sy);
      // White spots
      g.fillStyle(0xfff4d8, 0.95);
      g.fillCircle(m.x - 1.2 * sx, m.y - 2.4, 0.7 * sx);
      g.fillCircle(m.x + 1 * sx, m.y - 2, 0.6 * sx);
      g.fillCircle(m.x + 0.2, m.y - 3, 0.5 * sx);
      // Rim highlight
      g.fillStyle(0xff7a3a, 0.7);
      g.fillEllipse(m.x - 1.5, m.y - 3, 1.6 * sx, 0.5 * sy);
    }
    // Fairy sparkle in centre
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(22, 22, 1.4);
    g.fillStyle(0xfff4ff, 0.7);
    g.fillCircle(22, 22, 2.6);
    g.fillStyle(0xd890e0, 0.5);
    g.fillCircle(22, 22, 4);
    // Tiny floating motes
    g.fillStyle(0xffe8ff, 0.85);
    g.fillCircle(15, 18, 0.6);
    g.fillCircle(29, 19, 0.6);
    g.fillCircle(22, 14, 0.5);
    colourTag(g, 0xd890e0);
  });

  // ─────────────────────────────────────────────────────────────
  // ROWAN — rowan branch with cluster of red berries and leaves
  // ─────────────────────────────────────────────────────────────
  bake(scene, 'node_marker_rowan', (g) => {
    groundShadow(g, 22, 40, 22);
    // Branch (curved, going up-right to down-left)
    g.fillStyle(0x1a0e04, 1);
    g.fillRect(8, 32, 28, 3);
    g.fillStyle(0x4a2810, 1);
    g.fillRect(8.5, 32.5, 27, 2);
    g.fillStyle(0x6a3a18, 0.85);
    g.fillRect(9, 33, 26, 1);
    // A short stub (smaller branch fork)
    g.fillStyle(0x2a1808, 1);
    g.fillRect(20, 24, 2.2, 9);
    g.fillStyle(0x4a2810, 1);
    g.fillRect(20.3, 24, 1.6, 9);
    // Pinnate leaves — pairs of small ovals along a central vein
    function leafPair(cx: number, cy: number, scale: number, tone: number): void {
      g.fillStyle(0x2a3a18, 1);
      g.fillEllipse(cx - 3 * scale, cy, 4 * scale, 1.6 * scale);
      g.fillEllipse(cx + 3 * scale, cy, 4 * scale, 1.6 * scale);
      g.fillStyle(tone, 1);
      g.fillEllipse(cx - 3 * scale, cy - 0.2, 3.4 * scale, 1.3 * scale);
      g.fillEllipse(cx + 3 * scale, cy - 0.2, 3.4 * scale, 1.3 * scale);
      // Highlight
      g.fillStyle(0xa8d860, 0.5);
      g.fillEllipse(cx - 3 * scale, cy - 0.6, 1.5 * scale, 0.5 * scale);
      g.fillEllipse(cx + 3 * scale, cy - 0.6, 1.5 * scale, 0.5 * scale);
    }
    leafPair(15, 24, 1.0, 0x4d7528);
    leafPair(15, 21, 0.85, 0x5a8a30);
    leafPair(15, 18, 0.7, 0x76a13a);
    leafPair(15, 15.5, 0.55, 0x8aaa48);
    // Tip leaf (single)
    g.fillStyle(0x2a3a18, 1);
    g.fillEllipse(15, 13, 2.6, 1.2);
    g.fillStyle(0x76a13a, 1);
    g.fillEllipse(15, 13, 2, 0.9);
    // Berry cluster on the right
    const berries: Array<[number, number, number]> = [
      [27, 22, 1.6], [30, 23, 1.5], [33, 22, 1.4],
      [28, 25, 1.6], [31, 26, 1.7], [27, 28, 1.5],
      [30, 29, 1.4], [33, 27, 1.3],
    ];
    // Berry shadow layer
    for (const [x, y, r] of berries) {
      g.fillStyle(0x4a0808, 1);
      g.fillCircle(x, y, r + 0.3);
    }
    for (const [x, y, r] of berries) {
      g.fillStyle(0xc41818, 1);
      g.fillCircle(x, y, r);
      g.fillStyle(0xea3a3a, 1);
      g.fillCircle(x - 0.4, y - 0.4, r * 0.6);
      g.fillStyle(0xffaa6a, 0.85);
      g.fillCircle(x - 0.6, y - 0.6, r * 0.25);
    }
    // Berry stems (fine pixel ticks)
    g.fillStyle(0x2a1808, 0.85);
    for (const [x, y] of berries) {
      g.fillRect(x - 0.2, y - 2.2, 0.4, 1);
    }
    colourTag(g, 0xc82018);
  });

  // ─────────────────────────────────────────────────────────────
  // LOCH VOTIVE — small loch surface with a sword pommel rising
  // ─────────────────────────────────────────────────────────────
  bake(scene, 'node_marker_loch_votive', (g) => {
    groundShadow(g, 22, 40, 26);
    // Loch surface — overhead ellipse
    g.fillStyle(0x0a1a26, 1);
    g.fillEllipse(22, 32, 30, 12);
    g.fillStyle(0x1a3040, 1);
    g.fillEllipse(22, 32, 28, 10);
    g.fillStyle(0x2a4a60, 1);
    g.fillEllipse(22, 31.5, 26, 8.5);
    // Bright water highlight
    g.fillStyle(0x70b8d8, 1);
    g.fillEllipse(22, 31, 22, 6);
    g.fillStyle(0x9fd8ec, 0.85);
    g.fillEllipse(20, 30, 14, 3);
    // Ripple rings around the sword
    g.lineStyle(0.8, 0xffffff, 0.55);
    g.strokeEllipse(22, 31, 14, 5);
    g.lineStyle(0.6, 0xffffff, 0.35);
    g.strokeEllipse(22, 31, 20, 7);
    // Sword pommel emerging — blade angled slightly
    // Crossguard
    g.fillStyle(0x1a1410, 1);
    g.fillRect(15, 19, 14, 2.4);
    g.fillStyle(0xa68a48, 1);
    g.fillRect(15, 19.3, 14, 1.8);
    g.fillStyle(0xe8c878, 1);
    g.fillRect(15.5, 19.5, 13, 0.7);
    // Crossguard end caps
    g.fillStyle(0x6a4818, 1);
    g.fillCircle(15, 20.2, 1.4);
    g.fillCircle(29, 20.2, 1.4);
    g.fillStyle(0xe8c878, 0.85);
    g.fillCircle(15, 19.8, 0.6);
    g.fillCircle(29, 19.8, 0.6);
    // Grip
    g.fillStyle(0x2a1408, 1);
    g.fillRect(20.5, 11, 3, 8);
    g.fillStyle(0x6a3818, 1);
    g.fillRect(20.7, 11.2, 2.6, 7.6);
    // Grip wrap (diagonal stripes)
    g.fillStyle(0x3a1c08, 1);
    for (let i = 0; i < 4; i++) {
      g.fillRect(20.5, 12 + i * 1.8, 3, 0.6);
    }
    // Pommel — round gilded
    g.fillStyle(0x1a1208, 1);
    g.fillCircle(22, 9, 3);
    g.fillStyle(0xc88a14, 1);
    g.fillCircle(22, 9, 2.4);
    g.fillStyle(0xe8b048, 1);
    g.fillCircle(21.5, 8.5, 1.6);
    g.fillStyle(0xffe48a, 0.85);
    g.fillCircle(21, 8, 0.7);
    // Pommel central jewel
    g.fillStyle(0x2a4a60, 1);
    g.fillCircle(22, 9, 0.9);
    g.fillStyle(0x70b8d8, 0.95);
    g.fillCircle(22, 9, 0.55);
    // Tiny droplets falling from crossguard back into water
    g.fillStyle(0x9fd8ec, 0.95);
    g.fillCircle(13, 24, 0.6);
    g.fillCircle(31, 25, 0.6);
    g.fillCircle(13.5, 28, 0.4);
    g.fillCircle(30.5, 28, 0.4);
    // Water surface sparkles
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(15, 33, 0.7);
    g.fillCircle(28, 34, 0.6);
    g.fillCircle(20, 35, 0.5);
    colourTag(g, 0x70b8d8);
  });
}
