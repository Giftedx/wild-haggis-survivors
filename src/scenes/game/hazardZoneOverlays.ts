/**
 * Decorative Graphics overlays for the four static-zone hazard types.
 * Pre-rework, lava/heal/slick/fog were each rendered as two stacked
 * `scene.add.ellipse` calls — colour washes that read "circle marks
 * ground" but had zero per-hazard identity at gameplay scale. Each
 * overlay below adds a Graphics layer that draws the unmistakable
 * tells:
 *
 *   - Lava: jagged dark cracks running across the patch + ember
 *     pinpricks + a darker cooling-edge ring stroke.
 *   - Heal: a small Celtic high-cross at centre + herb sprig dabs
 *     at three points around the rim + sparkle motes.
 *   - Slick: a smashed-bottle silhouette dropped off-centre with an
 *     amber glaze trail dripping from it.
 *   - Fog: drifting tendril wisps (3 elongated streaks) layered above
 *     the alpha pulse so the patch feels like weather.
 *
 * Each overlay returns a Graphics instance the caller can push into
 * the zone's `visuals` array so cleanup paths work unchanged.
 *
 * Notes:
 *  - All shapes are drawn relative to a centre `(x, y)` so callers
 *    don't have to translate.
 *  - Depth `-0.5` so the overlay sits ABOVE the base/glow ellipses
 *    (which use depth `-1`) but below world entities.
 *  - These run at run-start (lava+heal) or on enemy death
 *    (slick+fog), so a one-shot Graphics draw is the right cost
 *    profile — no per-frame redraw.
 */
import * as Phaser from 'phaser';

const OVERLAY_DEPTH = -0.5;

/**
 * Layer a lava-crack + ember overlay on top of the existing pulse
 * ellipses. The cracks are deterministic given `(x, y, r)` so the
 * same hazard layout produces the same crack pattern across runs —
 * keeps the T1 replay contract clean.
 */
export function spawnLavaOverlay(
  scene: Phaser.Scene,
  x: number,
  y: number,
  r: number,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.setPosition(x, y);
  g.setDepth(OVERLAY_DEPTH);

  // Cooling-edge ring — a darker outline just outside the molten core
  // gives the patch a charred lip. Not a hard stroke; layered low-alpha
  // ovals fake a soft thermal gradient.
  g.lineStyle(1.6, 0x3a0808, 0.7);
  g.strokeEllipse(0, 0, r * 2 + 2, r * 1.5 + 2);
  g.lineStyle(1, 0x6a2008, 0.5);
  g.strokeEllipse(0, 0, r * 2 - 1, r * 1.5 - 1);

  // Cracks — 4 jagged dark lines radiating from off-centre. Drawn as
  // chained line segments with small angular jitter so each crack
  // reads as broken stone, not a perfect ray.
  const seedAngle = ((x * 17 + y * 23) % 360) * (Math.PI / 180);
  for (let i = 0; i < 4; i++) {
    const baseAngle = seedAngle + (i / 4) * Math.PI * 2;
    const segCount = 4;
    let cx = (Math.cos(baseAngle - Math.PI) * r) / 4;
    let cy = (Math.sin(baseAngle - Math.PI) * r * 0.75) / 4;
    g.lineStyle(1.4, 0x1a0404, 0.95);
    for (let s = 0; s < segCount; s++) {
      const tn = (s + 1) / segCount;
      const nx = Math.cos(baseAngle + (s * 0.4 - 0.2)) * r * tn;
      const ny = Math.sin(baseAngle + (s * 0.4 - 0.2)) * r * 0.75 * tn;
      g.lineBetween(cx, cy, nx, ny);
      cx = nx;
      cy = ny;
    }
  }

  // Ember pinpricks — bright orange sparks dotted along the cracks
  // and across the magma. Mix of small + tiny so it reads as live coal.
  const emberSpots: [number, number, number][] = [
    [-r * 0.4, -r * 0.2, 1.6],
    [r * 0.5, -r * 0.3, 1.4],
    [r * 0.2, r * 0.35, 1.2],
    [-r * 0.55, r * 0.25, 1.4],
    [r * 0.0, -r * 0.5, 1.0],
    [r * 0.65, r * 0.1, 1.0],
    [-r * 0.25, r * 0.45, 0.9],
  ];
  for (const [ex, ey, er] of emberSpots) {
    g.fillStyle(0xff8a20, 0.85);
    g.fillCircle(ex, ey, er);
    g.fillStyle(0xffe070, 0.95);
    g.fillCircle(ex, ey, er * 0.5);
  }

  // Bubbling pockets — three small darker pools that look like cooled
  // crust over still-molten rock.
  g.fillStyle(0x4a1408, 0.7);
  g.fillCircle(-r * 0.15, -r * 0.4, r * 0.12);
  g.fillCircle(r * 0.35, r * 0.2, r * 0.1);
  g.fillCircle(-r * 0.45, r * 0.05, r * 0.08);

  // Slow ember pulse tween — only the brightest pinpricks, on the
  // overlay alpha. Cheap and deterministic.
  scene.tweens.add({
    targets: g,
    alpha: { from: 0.85, to: 1 },
    yoyo: true,
    repeat: -1,
    duration: 1200,
    ease: 'Sine.easeInOut',
  });

  // Two rising ember sprites — wakes the patch up with motion. Each
  // ember rises ~30px, scales down, fades, then resets via tween repeat.
  // Texture-exists guard for unit tests that skip BootScene.
  if (scene.textures.exists('fx_ember_spark')) {
    const startsForCycles: [number, number, number][] = [
      [-r * 0.25, r * 0.15, 0],
      [r * 0.3, r * 0.2, 1500], // staggered
    ];
    for (const [ox, oy, delay] of startsForCycles) {
      const ember = scene.add.image(x + ox, y + oy, 'fx_ember_spark');
      ember.setDepth(OVERLAY_DEPTH);
      ember.setScale(0.8);
      ember.setAlpha(0);
      scene.tweens.add({
        targets: ember,
        y: y + oy - 28,
        alpha: { from: 0, to: 0.95, duration: 400 },
        scale: { from: 0.8, to: 0.4 },
        duration: 2400,
        delay,
        repeat: -1,
        yoyo: false,
        onRepeat: () => {
          ember.setPosition(x + ox, y + oy);
          ember.setAlpha(0);
          ember.setScale(0.8);
        },
      });
    }
  }

  return g;
}

/**
 * Layer a Celtic-cross + herb-sprig overlay on the heal patch. The
 * cross itself is a small high-cross silhouette at centre (vertical
 * bar + arms + ringed wreath at the join — the iconic Iona/Highland
 * cross shape). Herb sprigs are three-leaf clusters dabbed at the
 * patch rim. Sparkle motes drift via tween for the "this is sacred"
 * feel.
 */
export function spawnHealOverlay(
  scene: Phaser.Scene,
  x: number,
  y: number,
  r: number,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.setPosition(x, y);
  g.setDepth(OVERLAY_DEPTH);

  // Celtic high-cross silhouette — small, pale gold so it reads as a
  // sacred mark rather than a hard UI element. Vertical bar + crossbar
  // + ringed wreath at the join.
  const crossH = r * 0.55;
  const crossW = crossH * 0.18;
  const armW = crossH * 0.55;
  const armH = crossW;
  const ringR = crossH * 0.18;
  const ringInner = ringR * 0.65;

  // Cross outline (slightly darker for definition)
  g.fillStyle(0x4a6628, 0.85);
  g.fillRect(-crossW / 2 - 0.5, -crossH / 2 - 0.5, crossW + 1, crossH + 1);
  g.fillRect(-armW / 2 - 0.5, -armH / 2 - 0.5, armW + 1, armH + 1);
  // Cross body — pale celadon green so it harmonises with the heal palette
  g.fillStyle(0xa8d088, 0.95);
  g.fillRect(-crossW / 2, -crossH / 2, crossW, crossH);
  g.fillRect(-armW / 2, -armH / 2, armW, armH);
  // Cross top-light highlight — a single brighter pip on the upper bar
  g.fillStyle(0xeaf8c8, 0.9);
  g.fillRect(-crossW / 2, -crossH / 2, crossW * 0.4, crossH * 0.18);
  g.fillRect(-armW / 2, -armH / 2, armW * 0.18, armH * 0.4);

  // Wreath ring at the cross join — the unmistakable Celtic anchor
  g.lineStyle(1.6, 0x4a6628, 0.9);
  g.strokeCircle(0, 0, ringR);
  g.lineStyle(1, 0xc4e8a0, 0.85);
  g.strokeCircle(0, 0, ringR);
  // Wreath knot dots — 4 cardinal points around the ring
  g.fillStyle(0xeaf8c8, 0.9);
  g.fillCircle(0, -ringR, 0.6);
  g.fillCircle(ringR, 0, 0.6);
  g.fillCircle(0, ringR, 0.6);
  g.fillCircle(-ringR, 0, 0.6);
  // Inner sacred dot
  g.fillStyle(0xeaf8c8, 0.85);
  g.fillCircle(0, 0, ringInner);

  // Herb sprigs — three dabbed at rim positions (top-left, right,
  // bottom). Each sprig is a tiny stem + 3 leaflet ovals (rowan-leaf
  // shape). Healing herb traditions: rowan (protective), heather
  // (cleansing), bog myrtle (healing).
  const sprigPositions: [number, number, number][] = [
    [-r * 0.55, -r * 0.42, -0.4], // top-left, slight CCW tilt
    [r * 0.6, -r * 0.1, 0.3],     // right
    [-r * 0.1, r * 0.55, 0.0],    // bottom-centre
  ];
  for (const [sx, sy, tilt] of sprigPositions) {
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);
    // Stem
    g.fillStyle(0x2a4818, 1);
    const stemL = 5;
    for (let s = 0; s < stemL; s++) {
      g.fillRect(sx - cosT * s * 0.3, sy + sinT * s * 0.3, 0.6, 0.6);
    }
    // Three leaflet ovals
    g.fillStyle(0x4a8030, 1);
    g.fillEllipse(sx + cosT * 1.5 - sinT * 1.5, sy + sinT * 1.5 + cosT * 1.5, 1.6, 1.0);
    g.fillEllipse(sx + cosT * 1.5 + sinT * 1.5, sy + sinT * 1.5 - cosT * 1.5, 1.6, 1.0);
    g.fillEllipse(sx + cosT * 3.0, sy + sinT * 3.0, 1.4, 0.9);
    g.fillStyle(0x9ad860, 0.9);
    g.fillEllipse(sx + cosT * 1.5 - sinT * 1.5, sy + sinT * 1.5 + cosT * 1.5, 0.9, 0.5);
    g.fillEllipse(sx + cosT * 3.0, sy + sinT * 3.0, 0.7, 0.4);
  }

  // Sparkle motes — six tiny white dots scattered around the cross.
  // Tweened alpha pulse for "blessing" feel without strobing.
  const moteSpots: [number, number, number][] = [
    [-r * 0.35, -r * 0.1, 0.5],
    [r * 0.3, -r * 0.35, 0.45],
    [r * 0.15, r * 0.2, 0.45],
    [-r * 0.45, r * 0.3, 0.4],
    [r * 0.45, r * 0.4, 0.4],
    [-r * 0.2, -r * 0.55, 0.45],
  ];
  for (const [mx, my, mr] of moteSpots) {
    g.fillStyle(0xeaf8c8, 0.9);
    g.fillCircle(mx, my, mr);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(mx, my, mr * 0.45);
  }

  // Soft alpha breathe on the overlay (gentle shimmer)
  scene.tweens.add({
    targets: g,
    alpha: { from: 0.8, to: 1 },
    yoyo: true,
    repeat: -1,
    duration: 1800,
    ease: 'Sine.easeInOut',
  });

  return g;
}

/**
 * Layer a smashed-Buckfast-bottle silhouette + amber glaze on the slick
 * patch. The bottle is OFF-CENTRE (so the splash reads "this is where
 * the bottle landed") with a curved glaze trail dripping toward the rim.
 * Quick wet sheen highlight tells "still sticky".
 */
export function spawnSlickOverlay(
  scene: Phaser.Scene,
  x: number,
  y: number,
  r: number,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.setPosition(x, y);
  g.setDepth(OVERLAY_DEPTH);

  // Smashed bottle silhouette — neck + label-banded body, lying on its
  // side, dropped off-centre. Dark bottle-green base.
  const bx = -r * 0.35;
  const by = -r * 0.05;
  // Bottle body
  g.fillStyle(0x0a1a08, 1);
  g.fillRoundedRect(bx - 5, by - 2, 9, 4, 1.4);
  g.fillStyle(0x224010, 1);
  g.fillRoundedRect(bx - 4.5, by - 1.5, 8, 3, 1.2);
  // Bottle highlight (brown-glass shoulder)
  g.fillStyle(0x4a7028, 0.85);
  g.fillRect(bx - 4, by - 1.4, 6, 0.5);
  // Bottle neck
  g.fillStyle(0x0a1a08, 1);
  g.fillRect(bx + 4, by - 1.2, 3, 2.4);
  g.fillStyle(0x224010, 1);
  g.fillRect(bx + 4, by - 0.9, 3, 1.8);
  // Bottle label — yellow strip with red B (Buckfast)
  g.fillStyle(0xeac848, 1);
  g.fillRect(bx - 3, by - 1, 4, 2);
  g.fillStyle(0xa01818, 1);
  g.fillRect(bx - 1.5, by - 0.4, 1.4, 1.4);
  // Bottle cap (gold)
  g.fillStyle(0xc8a040, 1);
  g.fillRect(bx + 6.4, by - 1, 1.2, 2);
  g.fillStyle(0xfadc6a, 0.9);
  g.fillRect(bx + 6.4, by - 1, 1.2, 0.5);
  // Crack in the bottle (jagged white-grey line through the body)
  g.lineStyle(0.6, 0xeaf0d8, 0.8);
  g.lineBetween(bx - 3, by - 1.5, bx - 1, by);
  g.lineBetween(bx - 1, by, bx + 1, by - 1.2);

  // Glass shards — 4 small triangles scattered around the bottle
  g.fillStyle(0xa8c478, 0.85);
  g.fillTriangle(bx - 6, by + 2.5, bx - 4.5, by + 3.5, bx - 5.5, by + 4);
  g.fillTriangle(bx + 8, by - 2, bx + 9.5, by - 1, bx + 8.5, by - 0.5);
  g.fillTriangle(bx + 2, by - 3, bx + 3, by - 2, bx + 2.5, by - 1.5);
  g.fillStyle(0xeaf6c8, 0.9);
  g.fillTriangle(bx - 6, by + 2.5, bx - 5, by + 3, bx - 5.5, by + 3.5);

  // Amber glaze trail — curved drip from the bottle mouth toward the
  // rim. Three connected ovals so the curve is built into the shape.
  g.fillStyle(0xc8841c, 0.7);
  g.fillEllipse(r * 0.05, r * 0.15, r * 0.55, r * 0.2);
  g.fillEllipse(r * 0.3, r * 0.3, r * 0.4, r * 0.15);
  g.fillStyle(0xeac848, 0.85);
  g.fillEllipse(r * 0.05, r * 0.1, r * 0.4, r * 0.1);
  g.fillEllipse(r * 0.3, r * 0.25, r * 0.25, r * 0.08);

  // Specular wet sheen — single bright pinprick on the glaze, tells
  // "still sticky"
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(r * 0.05, r * 0.08, 0.6);
  g.fillCircle(r * 0.3, r * 0.22, 0.5);

  return g;
}

/**
 * Layer drifting tendril wisps on the haar fog patch. The base/glow
 * ellipses already give the alpha haze; this overlay adds 3 elongated
 * wisp streaks that slowly drift through the patch so it feels like
 * weather, not a static puddle.
 *
 * Returns an array of GameObjects (Graphics body + optional fx wisp
 * image) so callers can push everything into the zone's visuals list
 * for cleanup-on-expire.
 */
export function spawnFogOverlay(
  scene: Phaser.Scene,
  x: number,
  y: number,
  r: number,
): Phaser.GameObjects.GameObject[] {
  const g = scene.add.graphics();
  g.setPosition(x, y);
  g.setDepth(OVERLAY_DEPTH);

  // Three drifting tendrils — long thin ovals at varied angles. Each
  // is a 3-ellipse stack (dark base / mid / pale highlight) so the
  // tendril has a faint pearled core.
  const tendrils: [number, number, number, number][] = [
    [-r * 0.35, -r * 0.2, r * 1.15, 0.05],
    [r * 0.1, r * 0.15, r * 0.95, -0.18],
    [-r * 0.1, r * 0.45, r * 0.75, 0.25],
  ];
  for (const [tx, ty, len, tilt] of tendrils) {
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);
    // Approximate rotated tendril by drawing several small ellipses
    // along an axis. Phaser Graphics doesn't pivot ellipses, so we
    // simulate the tilt by chaining mini-circles at offsets.
    for (let i = -3; i <= 3; i++) {
      const ix = tx + cosT * (i / 3) * (len / 2);
      const iy = ty + sinT * (i / 3) * (len / 2);
      const w = (1 - Math.abs(i) / 4) * 4 + 1.5;
      g.fillStyle(0x88a4b8, 0.35);
      g.fillCircle(ix, iy, w);
      g.fillStyle(0xc8d8e4, 0.32);
      g.fillCircle(ix, iy, w * 0.6);
      g.fillStyle(0xeaf2f8, 0.28);
      g.fillCircle(ix, iy, w * 0.3);
    }
  }

  // Pale moon spot — a single dim bright disc near centre, the
  // "something in the mist" tell. Subtle.
  g.fillStyle(0xeaf2f8, 0.18);
  g.fillCircle(0, -r * 0.05, r * 0.18);
  g.fillStyle(0xffffff, 0.12);
  g.fillCircle(0, -r * 0.05, r * 0.1);

  // Drift tween — slowly slides the overlay sideways so the wisps look
  // like they're carried by wind. Distance kept small so the patch
  // doesn't migrate visibly off its mechanical centre.
  scene.tweens.add({
    targets: g,
    x: x + r * 0.15,
    yoyo: true,
    repeat: -1,
    duration: 3000,
    ease: 'Sine.easeInOut',
  });

  // Layer one fx_haar_drift_wisp texture instance on top so the patch
  // gets the long horizontal tendril smear (the texture has a brighter
  // pearl spine than what we can fake in plain Graphics). Texture-exists
  // guard keeps unit-test stubs that skip BootScene from rendering the
  // missing-texture placeholder.
  const objects: Phaser.GameObjects.GameObject[] = [g];
  if (scene.textures.exists('fx_haar_drift_wisp')) {
    const wisp = scene.add.image(x - r * 0.2, y, 'fx_haar_drift_wisp');
    wisp.setDepth(OVERLAY_DEPTH);
    wisp.setAlpha(0.6);
    wisp.setScale(Math.max(1.2, r / 22));
    scene.tweens.add({
      targets: wisp,
      x: x + r * 0.4,
      alpha: { from: 0.7, to: 0.35 },
      yoyo: true,
      repeat: -1,
      duration: 3400,
      ease: 'Sine.easeInOut',
    });
    objects.push(wisp);
  }

  return objects;
}
