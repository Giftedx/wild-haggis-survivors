import Phaser from 'phaser';

export function bakeKelpie(scene: Phaser.Scene): void {
  const s = 48;
  const g = scene.add.graphics();
  const cx = s / 2, cy = s / 2 + 2;

  // ── White trainers ──
  g.fillStyle(0xcccccc, 1);
  g.fillRect(cx - 9, cy + 16, 7, 4);
  g.fillRect(cx + 2, cy + 16, 7, 4);
  g.fillStyle(0xeeeeee, 1);
  g.fillRect(cx - 8, cy + 17, 5, 2);
  g.fillRect(cx + 3, cy + 17, 5, 2);
  // Trainer stripes
  g.fillStyle(0x2244cc, 1);
  g.fillRect(cx - 7, cy + 17, 1, 2);
  g.fillRect(cx + 5, cy + 17, 1, 2);

  // ── White socks pulled HIGH (the classic ned look) ──
  g.fillStyle(0xeeeeee, 1);
  g.fillRect(cx - 7, cy + 10, 5, 7);
  g.fillRect(cx + 3, cy + 10, 5, 7);
  g.fillStyle(0xdddddd, 1);
  // Sock ribbing
  g.fillRect(cx - 7, cy + 11, 5, 1);
  g.fillRect(cx - 7, cy + 13, 5, 1);
  g.fillRect(cx + 3, cy + 11, 5, 1);
  g.fillRect(cx + 3, cy + 13, 5, 1);

  // ── Shell suit trousers — shiny blue with white stripe ──
  g.fillStyle(0x1133aa, 1);
  g.fillRect(cx - 8, cy + 4, 6, 8);
  g.fillRect(cx + 2, cy + 4, 6, 8);
  g.fillStyle(0x2255cc, 1);
  g.fillRect(cx - 7, cy + 5, 4, 6);
  g.fillRect(cx + 3, cy + 5, 4, 6);
  // White side stripe (the iconic tracksuit stripe)
  g.fillStyle(0xeeeeee, 0.8);
  g.fillRect(cx - 8, cy + 5, 1, 6);
  g.fillRect(cx + 7, cy + 5, 1, 6);
  // Sheen highlight (shiny synthetic material)
  g.fillStyle(0x4477dd, 0.4);
  g.fillRect(cx - 6, cy + 6, 2, 4);
  g.fillRect(cx + 4, cy + 6, 2, 4);

  // ── Shell suit jacket — same shiny blue, zip front ──
  g.fillStyle(0x0e2888, 1);
  g.fillRect(cx - 10, cy - 8, 20, 14);
  g.fillStyle(0x1133aa, 1);
  g.fillRect(cx - 9, cy - 7, 18, 12);
  g.fillStyle(0x2255cc, 1);
  g.fillRect(cx - 8, cy - 6, 16, 10);
  // Jacket sheen
  g.fillStyle(0x4477ee, 0.3);
  g.fillRect(cx - 6, cy - 5, 6, 8);
  // White side stripes on jacket
  g.fillStyle(0xeeeeee, 0.8);
  g.fillRect(cx - 10, cy - 7, 1, 12);
  g.fillRect(cx + 9, cy - 7, 1, 12);
  // Zip line (centre)
  g.fillStyle(0xaaaaaa, 0.7);
  g.fillRect(cx, cy - 6, 1, 10);
  // Zip pull
  g.fillStyle(0xcccccc, 1);
  g.fillRect(cx - 1, cy - 2, 2, 2);
  // Collar — popped up (of course)
  g.fillStyle(0x0e2888, 1);
  g.fillRect(cx - 8, cy - 10, 16, 3);
  g.fillStyle(0x1133aa, 1);
  g.fillRect(cx - 7, cy - 9, 14, 2);

  // ── Gold chain (visible at neckline — THE ned accessory) ──
  g.fillStyle(0xddaa00, 0.8);
  g.lineStyle(1, 0xccaa00, 0.9);
  g.lineBetween(cx - 5, cy - 8, cx - 2, cy - 6);
  g.lineBetween(cx - 2, cy - 6, cx + 2, cy - 6);
  g.lineBetween(cx + 2, cy - 6, cx + 5, cy - 8);
  // Chain pendant (Sovereign coin or cross — tiny gold dot)
  g.fillStyle(0xddaa00, 1);
  g.fillCircle(cx, cy - 5, 1.2);
  g.fillStyle(0xffcc33, 0.7);
  g.fillCircle(cx, cy - 5, 0.6);

  // ── Arms (one in pocket, one gesturing "come ahead") ──
  g.fillStyle(0x1133aa, 1);
  g.fillRect(cx - 13, cy - 4, 4, 8);
  g.fillRect(cx + 9, cy - 4, 4, 8);
  // Skin-colour hands
  g.fillStyle(0xddaa88, 1);
  g.fillRect(cx - 13, cy + 3, 3, 3);
  g.fillRect(cx + 10, cy + 3, 3, 3);
  // SOVEREIGN RING on right hand (massive gold ring — the ned signet)
  g.fillStyle(0xddaa00, 1);
  g.fillCircle(cx + 12, cy + 4, 1.5);
  g.fillStyle(0xffcc33, 1);
  g.fillCircle(cx + 12, cy + 4, 0.8);

  // ── Head ──
  g.fillStyle(0xcc9966, 1);
  g.fillCircle(cx, cy - 14, 8);
  g.fillStyle(0xddaa77, 1);
  g.fillCircle(cx, cy - 14, 7);
  // Ruddy cheeks (been oot in the cauld, or just bravado)
  g.fillStyle(0xddaa88, 0.5);
  g.fillCircle(cx - 4, cy - 12, 2);
  g.fillCircle(cx + 4, cy - 12, 2);
  // Thin buzz-cut hair (just visible under cap at the sides)
  g.fillStyle(0x554433, 0.3);
  g.fillRect(cx - 7, cy - 17, 2, 3);
  g.fillRect(cx + 5, cy - 17, 2, 3);

  // Narrowed suspicious eyes (sizing you up)
  g.fillStyle(0xffffff, 1);
  g.fillRect(cx - 4, cy - 16, 3, 2);
  g.fillRect(cx + 1, cy - 16, 3, 2);
  g.fillStyle(0x222222, 1);
  g.fillRect(cx - 3, cy - 16, 2, 2);
  g.fillRect(cx + 2, cy - 16, 2, 2);

  // Aggressive eyebrows (furrowed — "what are YOU lookin at")
  g.fillStyle(0x553322, 1);
  g.fillRect(cx - 5, cy - 17, 4, 1);
  g.fillRect(cx + 1, cy - 17, 4, 1);

  // Mouth — sneering grin (missing tooth adds character)
  g.fillStyle(0x553322, 1);
  g.fillRect(cx - 3, cy - 11, 6, 1);
  g.fillStyle(0xeeeeee, 1);
  g.fillRect(cx - 2, cy - 11, 1, 1);
  // Gap tooth (one missing — been in a scrap)
  g.fillRect(cx + 2, cy - 11, 1, 1);

  // ── Burberry check cap — tilted at 45° (THE ned signature) ──
  // Cap body — beige check pattern
  g.fillStyle(0xccaa77, 1);
  g.fillEllipse(cx + 2, cy - 20, 18, 7);
  g.fillStyle(0xddbb88, 1);
  g.fillEllipse(cx + 2, cy - 21, 16, 5);
  // Burberry check pattern (red/black lines on beige)
  g.fillStyle(0xcc3322, 0.5);
  g.fillRect(cx - 4, cy - 22, 12, 1);
  g.fillRect(cx - 2, cy - 20, 8, 1);
  g.fillStyle(0x222222, 0.3);
  g.fillRect(cx - 1, cy - 23, 1, 4);
  g.fillRect(cx + 4, cy - 23, 1, 4);
  // Peak (brim) tilted up
  g.fillStyle(0xaa8855, 1);
  g.fillRect(cx - 6, cy - 19, 8, 2);
  g.fillStyle(0xbbaa66, 1);
  g.fillRect(cx - 5, cy - 19, 6, 1);

  // ── Buckfast bottle in hand (optional but peak ned) ──
  g.fillStyle(0x224422, 1);
  g.fillRect(cx + 10, cy + 1, 3, 6);
  g.fillStyle(0x336633, 1);
  g.fillRect(cx + 10, cy + 2, 2, 4);
  // Cream label
  g.fillStyle(0xddcc88, 1);
  g.fillRect(cx + 10, cy + 3, 2, 2);
  // Gold cap
  g.fillStyle(0xddaa00, 1);
  g.fillRect(cx + 10, cy + 1, 2, 1);

  g.generateTexture('kelpie', s, s);
  g.destroy();
}

/** Midgie swarm — a roiling cloud of tiny biting midges. The individual
 *  bugs are too small to draw, so the sprite is a dark buzzing cloud
 *  with glowing red eyes scattered through it and tiny wing-flicker dots. */
/** Midgie swarm — a roiling hellcloud of biting Highland midges.
 *  The sprite is a dark seething mass with scattered red eyes, wing flicker,
 *  and tiny silhouettes of individual midges at the edges. Pure dread. */
