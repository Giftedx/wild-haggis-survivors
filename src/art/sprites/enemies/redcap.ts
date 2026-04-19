import Phaser from 'phaser';

export function bakeRedcap(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // Ground shadow.
  g.fillStyle(0x000000, 0.3);
  g.fillEllipse(cx, cy + 10, 16, 3);

  // Stocky body — earthy brown leather-and-rags.
  g.fillStyle(0x2a1e14, 1);
  g.fillEllipse(cx, cy + 5, 14, 10);
  g.fillStyle(0x5a3e20, 1);
  g.fillEllipse(cx, cy + 4, 12, 8);
  // Belt — iron rivet row.
  g.fillStyle(0x2a2a2a, 1);
  g.fillRect(cx - 6, cy + 3, 12, 1);

  // Short stubby legs / boots.
  g.fillStyle(0x1a1408, 1);
  g.fillRect(cx - 5, cy + 9, 3, 3);
  g.fillRect(cx + 2, cy + 9, 3, 3);

  // Arms — one gripping a short iron pike (weapon + threat telegraph).
  g.fillStyle(0x4a2e18, 1);
  g.fillRect(cx - 8, cy + 1, 3, 5);
  g.fillRect(cx + 5, cy + 1, 3, 5);
  // Pike shaft.
  g.fillStyle(0x2a1a10, 1);
  g.fillRect(cx + 7, cy - 7, 1, 10);
  // Pike head — dull iron tip.
  g.fillStyle(0x505058, 1);
  g.fillTriangle(cx + 6, cy - 7, cx + 9, cy - 7, cx + 7.5, cy - 10);

  // Head — round goblinoid, pale sickly green-grey.
  g.fillStyle(0xa0b088, 1);
  g.fillEllipse(cx, cy - 3, 10, 9);

  // Pointed goblin ears.
  g.fillStyle(0x80907a, 1);
  g.fillTriangle(cx - 5, cy - 5, cx - 5, cy - 1, cx - 8, cy - 3);
  g.fillTriangle(cx + 5, cy - 5, cx + 5, cy - 1, cx + 8, cy - 3);

  // Face — hungry yellow eyes + wide toothy grin.
  g.fillStyle(0xffd040, 1);
  g.fillRect(cx - 3, cy - 4, 2, 2);
  g.fillRect(cx + 1, cy - 4, 2, 2);
  // Black pupils.
  g.fillStyle(0x000000, 1);
  g.fillRect(cx - 2, cy - 3, 1, 1);
  g.fillRect(cx + 2, cy - 3, 1, 1);
  // Grin.
  g.fillStyle(0x2a1010, 1);
  g.fillRect(cx - 3, cy - 1, 6, 1);
  // Fangs — one top, one bottom (cartoon goblin read).
  g.fillStyle(0xffffdd, 1);
  g.fillRect(cx - 2, cy - 1, 1, 1);
  g.fillRect(cx + 1, cy - 1, 1, 1);

  // The CAP — crimson, dipped darker at the tip (the signature).
  // Pointed hood shape over the top of the head.
  g.fillStyle(0x901818, 1);
  g.fillTriangle(cx - 6, cy - 7, cx + 6, cy - 7, cx + 3, cy - 14);
  g.fillTriangle(cx - 6, cy - 7, cx + 3, cy - 14, cx - 3, cy - 12);
  // Main cap body — brighter red.
  g.fillStyle(0xc42828, 1);
  g.fillTriangle(cx - 5, cy - 7, cx + 5, cy - 7, cx + 2, cy - 13);
  g.fillTriangle(cx - 5, cy - 7, cx + 2, cy - 13, cx - 2, cy - 11);
  // Dripping "dipped" beads at the brim — dark blood.
  g.fillStyle(0x501010, 1);
  g.fillCircle(cx - 4, cy - 6, 1);
  g.fillCircle(cx + 3, cy - 6, 0.8);
  g.fillStyle(0x300808, 0.9);
  g.fillCircle(cx - 4, cy - 4, 0.6);

  g.generateTexture('redcap', s, s);
  g.destroy();
}

/**
 * Ceilidh Caller — DESIGN_IDEAS section 3 Academic family. Ethereal
 * dance-master; visual suggests "calling the dance" through a
 * raised arm pose and translucent robes. The "forces enemies to
 * move in sync" bullet stays open pending a group-AI pass — the
 * caller's orbit gives the rotational feel now.
 */
