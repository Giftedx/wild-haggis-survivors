/**
 * UI chrome kit — `ui_card_frame_*` rarity overlays for level-up cards,
 * `ui_banter_corner_*` warmth ornaments for dialogue bubbles, and the
 * `ui_toast_frame` parchment plaque behind toast notifications. Every
 * sprite anchors to a Scottish object (timber, brass, saltire, thistle,
 * ember, parchment) so the meta-warmth layer feels like a pub bulletin
 * board, not a slick AAA HUD. Palette is restrained and held inside
 * the ART_STYLE_BIBLE Hearth tonal map — never shouty, never rainbow.
 */

import * as Phaser from 'phaser';

export function bakeCardFrameCommon(scene: Phaser.Scene): void {
  const w = 36, h = 44;
  const g = scene.add.graphics();

  // Drop shadow under the card frame
  g.fillStyle(0x0a0604, 0.35);
  g.fillRoundedRect(2, 3, w - 2, h - 2, 4);

  // Outer timber edge — warm peat brown
  g.fillStyle(0x2a1808, 1);
  g.fillRoundedRect(0, 0, w - 2, h - 2, 4);
  g.fillStyle(0x5a3e20, 1);
  g.fillRoundedRect(1, 1, w - 4, h - 4, 3.5);

  // Inner timber face — slightly warmer mid-tone
  g.fillStyle(0x6a4624, 1);
  g.fillRoundedRect(2, 2, w - 6, h - 6, 3);

  // Light catch on the upper-left edge (primary light upper-left)
  g.fillStyle(0x8a6438, 0.9);
  g.fillRect(2, 2, w - 6, 1);
  g.fillRect(2, 2, 1, h - 6);

  // Inner shadow groove — empty card centre, no ornament
  g.fillStyle(0x1a0e06, 1);
  g.fillRoundedRect(3, 3, w - 8, h - 8, 2.5);

  // Inset face (the hole the icon shows through)
  g.fillStyle(0x2a1a0e, 1);
  g.fillRoundedRect(4, 4, w - 10, h - 10, 2);

  // Wood grain — three thin horizontal striations on the timber
  g.fillStyle(0x4a3018, 0.55);
  g.fillRect(2, 8, w - 6, 0.6);
  g.fillRect(2, 22, w - 6, 0.6);
  g.fillRect(2, h - 12, w - 6, 0.6);
  // A vertical grain hint on the right rail
  g.fillStyle(0x4a3018, 0.4);
  g.fillRect(w - 5, 4, 0.5, h - 10);

  g.generateTexture('ui_card_frame_common', w, h);
  g.destroy();
}

export function bakeCardFrameUncommon(scene: Phaser.Scene): void {
  const w = 36, h = 44;
  const g = scene.add.graphics();

  // Drop shadow
  g.fillStyle(0x0a0604, 0.4);
  g.fillRoundedRect(2, 3, w - 2, h - 2, 4);

  // Outer dark trim — bronze undertone
  g.fillStyle(0x2a1808, 1);
  g.fillRoundedRect(0, 0, w - 2, h - 2, 4);

  // Brass edging — aged bronze body
  g.fillStyle(0x8a5e1a, 1);
  g.fillRoundedRect(1, 1, w - 4, h - 4, 3.5);
  g.fillStyle(0xa07028, 1);
  g.fillRoundedRect(2, 2, w - 6, h - 6, 3);

  // Bright brass top-left highlight
  g.fillStyle(0xc89040, 0.9);
  g.fillRect(2, 2, w - 6, 1);
  g.fillRect(2, 2, 1, h - 6);

  // Inset face
  g.fillStyle(0x1a0e06, 1);
  g.fillRoundedRect(3, 3, w - 8, h - 8, 2.5);
  g.fillStyle(0x2a1a0e, 1);
  g.fillRoundedRect(4, 4, w - 10, h - 10, 2);

  // Four corner stud rivets — small, restrained
  const studs: Array<[number, number]> = [
    [3.5, 3.5],
    [w - 5.5, 3.5],
    [3.5, h - 5.5],
    [w - 5.5, h - 5.5],
  ];
  for (const [sx, sy] of studs) {
    g.fillStyle(0x5a3010, 1);
    g.fillCircle(sx, sy, 1.2);
    g.fillStyle(0xc89040, 1);
    g.fillCircle(sx, sy, 0.9);
    g.fillStyle(0xfadc6a, 0.85);
    g.fillCircle(sx - 0.25, sy - 0.25, 0.4);
  }

  // Faint engraved pattern — top + bottom centre dot pairs (subtle "stamped" feel)
  g.fillStyle(0x5a3010, 0.7);
  g.fillRect(w / 2 - 4, 2, 1, 0.6);
  g.fillRect(w / 2 - 1, 2, 1, 0.6);
  g.fillRect(w / 2 + 2, 2, 1, 0.6);
  g.fillRect(w / 2 - 4, h - 4, 1, 0.6);
  g.fillRect(w / 2 - 1, h - 4, 1, 0.6);
  g.fillRect(w / 2 + 2, h - 4, 1, 0.6);

  g.generateTexture('ui_card_frame_uncommon', w, h);
  g.destroy();
}

export function bakeCardFrameRare(scene: Phaser.Scene): void {
  const w = 36, h = 44;
  const g = scene.add.graphics();

  // Drop shadow
  g.fillStyle(0x0a0a14, 0.45);
  g.fillRoundedRect(2, 3, w - 2, h - 2, 4);

  // Dark outer trim
  g.fillStyle(0x141828, 1);
  g.fillRoundedRect(0, 0, w - 2, h - 2, 4);

  // Silver edging
  g.fillStyle(0x8a8a90, 1);
  g.fillRoundedRect(1, 1, w - 4, h - 4, 3.5);

  // Saltire-blue inset stripe (recessed band)
  g.fillStyle(0x2a4a6a, 1);
  g.fillRoundedRect(2, 2, w - 6, h - 6, 3);
  g.fillStyle(0x3a6aaa, 1);
  g.fillRoundedRect(3, 3, w - 8, h - 8, 2.5);

  // Silver top-left highlight rail
  g.fillStyle(0xc8c8d0, 0.9);
  g.fillRect(1, 1, w - 4, 1);
  g.fillRect(1, 1, 1, h - 4);

  // Inset face — empty card centre
  g.fillStyle(0x0a1428, 1);
  g.fillRoundedRect(4, 4, w - 10, h - 10, 2);
  g.fillStyle(0x141a2e, 1);
  g.fillRoundedRect(5, 5, w - 12, h - 12, 1.5);

  // Four corner saltire pips (small white X marks on silver)
  const pips: Array<[number, number]> = [
    [3.5, 3.5],
    [w - 5.5, 3.5],
    [3.5, h - 5.5],
    [w - 5.5, h - 5.5],
  ];
  for (const [px, py] of pips) {
    g.fillStyle(0x141828, 1);
    g.fillCircle(px, py, 1.3);
    g.fillStyle(0xddeeff, 1);
    g.fillRect(px - 1, py - 0.3, 2, 0.6);
    g.fillRect(px - 0.3, py - 1, 0.6, 2);
    // Diagonal saltire bars
    g.fillRect(px - 0.85, py - 0.85, 0.5, 0.5);
    g.fillRect(px + 0.35, py - 0.85, 0.5, 0.5);
    g.fillRect(px - 0.85, py + 0.35, 0.5, 0.5);
    g.fillRect(px + 0.35, py + 0.35, 0.5, 0.5);
  }

  // Subtle starburst at top centre — six tiny rays + bright dot
  const sx = w / 2;
  const sy = 2.5;
  g.fillStyle(0xddeeff, 0.85);
  g.fillCircle(sx, sy, 1.1);
  g.fillStyle(0xffffff, 0.95);
  g.fillCircle(sx, sy, 0.55);
  g.fillStyle(0x8fb8e0, 0.7);
  g.fillRect(sx - 2.4, sy - 0.15, 4.8, 0.3);
  g.fillRect(sx - 0.15, sy - 1.6, 0.3, 3.2);
  g.fillStyle(0x8fb8e0, 0.5);
  g.fillRect(sx - 1.7, sy - 1.7, 0.4, 0.4);
  g.fillRect(sx + 1.3, sy - 1.7, 0.4, 0.4);

  g.generateTexture('ui_card_frame_rare', w, h);
  g.destroy();
}

export function bakeCardFrameLegendary(scene: Phaser.Scene): void {
  const w = 36, h = 44;
  const g = scene.add.graphics();

  // Outer glow rim — radial halo before the card
  g.fillStyle(0xffc840, 0.16);
  g.fillRoundedRect(0, 1, w, h - 2, 5);
  g.fillStyle(0xffc840, 0.22);
  g.fillRoundedRect(0, 0, w - 1, h - 1, 4.5);

  // Drop shadow
  g.fillStyle(0x1a0e06, 0.45);
  g.fillRoundedRect(2, 3, w - 2, h - 2, 4);

  // Outer dark trim
  g.fillStyle(0x2a1808, 1);
  g.fillRoundedRect(0, 0, w - 2, h - 2, 4);

  // Gold edging
  g.fillStyle(0xc8a040, 1);
  g.fillRoundedRect(1, 1, w - 4, h - 4, 3.5);
  // Deeper gold-shadow inset band
  g.fillStyle(0x8a5e1a, 1);
  g.fillRoundedRect(2, 2, w - 6, h - 6, 3);
  // Bright gold raised face
  g.fillStyle(0xd4b055, 1);
  g.fillRoundedRect(3, 3, w - 8, h - 8, 2.5);

  // Bright gold top-left highlight
  g.fillStyle(0xffc840, 0.95);
  g.fillRect(1, 1, w - 4, 1);
  g.fillRect(1, 1, 1, h - 4);
  g.fillStyle(0xffe890, 0.7);
  g.fillRect(2, 2, w - 6, 0.6);

  // Inset face — empty card centre
  g.fillStyle(0x1a0e06, 1);
  g.fillRoundedRect(4, 4, w - 10, h - 10, 2);
  g.fillStyle(0x2a1a0e, 1);
  g.fillRoundedRect(5, 5, w - 12, h - 12, 1.5);

  // Thistle bloom motifs at all 4 corners — tiny purple bulb + green sepals
  const blooms: Array<[number, number]> = [
    [4, 4],
    [w - 6, 4],
    [4, h - 6],
    [w - 6, h - 6],
  ];
  for (const [bx, by] of blooms) {
    // Green sepal base
    g.fillStyle(0x2a5a14, 1);
    g.fillRect(bx - 0.8, by + 0.5, 1.6, 1);
    g.fillStyle(0x3a7a1a, 1);
    g.fillRect(bx - 0.8, by + 0.5, 1.6, 0.4);
    // Purple bloom bulb
    g.fillStyle(0x4a1a6a, 1);
    g.fillCircle(bx, by, 1.4);
    g.fillStyle(0x6a2a9a, 1);
    g.fillCircle(bx - 0.15, by - 0.15, 1.0);
    g.fillStyle(0xb090d0, 0.85);
    g.fillCircle(bx - 0.4, by - 0.4, 0.5);
    // Three tiny purple bristle tips above bloom
    g.fillStyle(0x8060a0, 0.85);
    g.fillRect(bx - 1.1, by - 1.6, 0.4, 0.6);
    g.fillRect(bx - 0.2, by - 1.8, 0.4, 0.6);
    g.fillRect(bx + 0.7, by - 1.6, 0.4, 0.6);
  }

  // Two ruby pips at top corners-inboard (premium tell)
  const rubies: Array<[number, number]> = [
    [w / 2 - 5, 3],
    [w / 2 + 5, 3],
  ];
  for (const [rx, ry] of rubies) {
    g.fillStyle(0x4a0808, 1);
    g.fillCircle(rx, ry, 1.0);
    g.fillStyle(0xc42828, 1);
    g.fillCircle(rx, ry, 0.7);
    g.fillStyle(0xff6868, 0.9);
    g.fillCircle(rx - 0.2, ry - 0.2, 0.3);
  }

  g.generateTexture('ui_card_frame_legendary', w, h);
  g.destroy();
}

export function bakeBanterCornerHearth(scene: Phaser.Scene): void {
  const s = 8;
  const g = scene.add.graphics();

  // Soft warm-cream curl in the corner — quarter-arc of light
  g.fillStyle(0xf4d8a0, 0.85);
  g.fillCircle(1.5, 1.5, 2.6);
  g.fillStyle(0xf8e4b8, 1);
  g.fillCircle(1.5, 1.5, 1.6);
  // Cream curl tail trailing into the bubble
  g.fillStyle(0xf4d8a0, 0.6);
  g.fillRect(0, 3, 4, 0.8);
  g.fillRect(3, 0, 0.8, 4);

  // Tiny ember at the inboard tip — orange glow + bright core
  g.fillStyle(0xff8838, 0.9);
  g.fillCircle(4.5, 4.5, 1.2);
  g.fillStyle(0xffc068, 1);
  g.fillCircle(4.5, 4.5, 0.8);
  g.fillStyle(0xfff0c0, 1);
  g.fillCircle(4.3, 4.3, 0.35);

  g.generateTexture('ui_banter_corner_hearth', s, s);
  g.destroy();
}

export function bakeBanterCornerEdge(scene: Phaser.Scene): void {
  const s = 8;
  const g = scene.add.graphics();

  // Dark accent corner curl — reads as ink-mark / cutting edge
  g.fillStyle(0x141018, 0.95);
  g.fillCircle(1.5, 1.5, 2.4);
  g.fillStyle(0x2a1a30, 1);
  g.fillCircle(1.5, 1.5, 1.5);
  g.fillStyle(0x141018, 0.6);
  g.fillRect(0, 3, 3.5, 0.7);
  g.fillRect(3, 0, 0.7, 3.5);

  // Thistle pip — tiny green sepal + purple bloom
  g.fillStyle(0x2a5a14, 1);
  g.fillRect(4, 5.5, 1.6, 0.8);
  g.fillStyle(0x3a7a1a, 1);
  g.fillRect(4, 5.5, 1.6, 0.3);
  g.fillStyle(0x4a1a6a, 1);
  g.fillCircle(4.8, 4.8, 1.2);
  g.fillStyle(0x6a2a9a, 1);
  g.fillCircle(4.7, 4.7, 0.85);
  g.fillStyle(0xb090d0, 0.9);
  g.fillCircle(4.5, 4.5, 0.4);
  // Two tiny purple bristles above
  g.fillStyle(0x8060a0, 0.9);
  g.fillRect(4.2, 3.4, 0.4, 0.5);
  g.fillRect(5.0, 3.3, 0.4, 0.5);

  g.generateTexture('ui_banter_corner_edge', s, s);
  g.destroy();
}

export function bakeBanterCornerFey(scene: Phaser.Scene): void {
  const s = 8;
  const g = scene.add.graphics();

  // Violet corner curl — soft lavender wash
  g.fillStyle(0x5a3a7a, 0.7);
  g.fillCircle(1.5, 1.5, 2.6);
  g.fillStyle(0x8060a0, 0.95);
  g.fillCircle(1.5, 1.5, 1.6);
  g.fillStyle(0x5a3a7a, 0.55);
  g.fillRect(0, 3, 4, 0.8);
  g.fillRect(3, 0, 0.8, 4);

  // Sparkle pip — bright violet four-point twinkle
  const px = 5, py = 5;
  g.fillStyle(0xb090d0, 0.7);
  g.fillCircle(px, py, 1.4);
  g.fillStyle(0xddc8f0, 1);
  g.fillRect(px - 1.4, py - 0.2, 2.8, 0.4);
  g.fillRect(px - 0.2, py - 1.4, 0.4, 2.8);
  g.fillStyle(0xffffff, 1);
  g.fillRect(px - 0.5, py - 0.15, 1, 0.3);
  g.fillRect(px - 0.15, py - 0.5, 0.3, 1);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(px, py, 0.35);
  // A wee secondary spark
  g.fillStyle(0xddc8f0, 0.85);
  g.fillCircle(3.2, 6.5, 0.4);

  g.generateTexture('ui_banter_corner_fey', s, s);
  g.destroy();
}

export function bakeToastFrame(scene: Phaser.Scene): void {
  const w = 80, h = 24;
  const g = scene.add.graphics();

  // Drop shadow under the parchment
  g.fillStyle(0x0a0604, 0.35);
  g.fillRoundedRect(2, 3, w - 2, h - 2, 2);

  // Parchment dark edge — torn paper feel via outer rim
  g.fillStyle(0x6a4624, 1);
  g.fillRoundedRect(0, 0, w - 2, h - 2, 2);

  // Cream parchment body
  g.fillStyle(0xe8d4a0, 1);
  g.fillRoundedRect(1, 1, w - 4, h - 4, 1.5);
  g.fillStyle(0xf0dcb0, 1);
  g.fillRect(2, 2, w - 6, h - 6);

  // Faint torn-paper edge variation — small notches on top + bottom rails
  g.fillStyle(0xe8d4a0, 1);
  for (let i = 6; i < w - 8; i += 7) {
    g.fillRect(i, 1.2, 0.8, 0.6);
    g.fillRect(i + 3, h - 4.4, 0.8, 0.6);
  }
  // Subtle parchment age stains
  g.fillStyle(0xc8a878, 0.25);
  g.fillCircle(18, 9, 3);
  g.fillCircle(54, 14, 3.4);
  g.fillCircle(38, 7, 2.2);

  // Pencil-line border — dim peat-grey rectangle inset
  g.fillStyle(0x3a2818, 0.55);
  g.fillRect(4, 3.5, w - 10, 0.4);
  g.fillRect(4, h - 5.5, w - 10, 0.4);
  g.fillRect(4, 3.5, 0.4, h - 8);
  g.fillRect(w - 6.4, 3.5, 0.4, h - 8);

  // Wood pin — left
  const lx = 4;
  const ly = h / 2;
  g.fillStyle(0x1a0e06, 0.45);
  g.fillCircle(lx + 0.5, ly + 0.5, 2.2);
  g.fillStyle(0x3a2010, 1);
  g.fillCircle(lx, ly, 2);
  g.fillStyle(0x6a4220, 1);
  g.fillCircle(lx, ly, 1.5);
  g.fillStyle(0x8a5a30, 0.95);
  g.fillCircle(lx - 0.4, ly - 0.4, 0.7);
  g.fillStyle(0xc89060, 0.85);
  g.fillCircle(lx - 0.5, ly - 0.55, 0.3);

  // Wood pin — right
  const rx = w - 6;
  const ry = h / 2;
  g.fillStyle(0x1a0e06, 0.45);
  g.fillCircle(rx + 0.5, ry + 0.5, 2.2);
  g.fillStyle(0x3a2010, 1);
  g.fillCircle(rx, ry, 2);
  g.fillStyle(0x6a4220, 1);
  g.fillCircle(rx, ry, 1.5);
  g.fillStyle(0x8a5a30, 0.95);
  g.fillCircle(rx - 0.4, ry - 0.4, 0.7);
  g.fillStyle(0xc89060, 0.85);
  g.fillCircle(rx - 0.5, ry - 0.55, 0.3);

  g.generateTexture('ui_toast_frame', w, h);
  g.destroy();
}
