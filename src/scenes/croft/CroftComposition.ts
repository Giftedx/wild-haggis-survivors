/**
 * Pure layout helper for CroftScene. Returns absolute screen positions for
 * every interactive/decorative element in Gran's Croft. No Phaser imports —
 * must remain node-env compatible so CroftComposition.test.ts can exercise it.
 *
 * Design notes:
 *   - Positions are absolute coordinates (pixels) keyed by element.
 *   - `uiScale` influences sprite dimensions (not positions); caller applies
 *     scale at draw time. Layout stays stable so hit-testing maths are
 *     independent of UI scale.
 *   - Co-ordinate origin is top-left of the canvas, matching Phaser.
 *
 * Composition (700 × 500 reference frame, positions scale with width/height):
 *
 *     ┌──────────────────────────────────────┐
 *     │ window/drove  mantelpiece  photo wall │
 *     │   + thistle    + hearth    + wireless │
 *     │  (backdrop)      Gran       bookshelf │
 *     │              rug   table              │
 *     └──────────────────────────────────────┘
 *
 * Visitors layered on top: postie at the doorway (left edge), neighbour-
 * wifie by the window, sheepdog standing right of Gran, weans on the rug
 * front-and-centre, and a returning haggis pal beside the bookshelf.
 */

export interface CroftLayoutInput {
  uiScale: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect extends Point {
  w: number;
  h: number;
}

/**
 * The drawable elements of the croft — every field is a Point or Rect
 * so iterating CROFT_DRAW_ORDER yields a uniform geometry union.
 * `CroftLayout` extends this with non-drawable metadata (`center`,
 * `spriteScale`) the renderer also needs at compose time.
 */
export interface CroftElements {
  /** Gran herself, seated (sprite anchor). */
  gran: Point;
  /** Hearth fire anchor. */
  hearth: Point;
  /** Mantelpiece strip (trophies laid across). */
  mantelpiece: Rect;
  /** Photo wall region (route polaroids pinned here). */
  photoWall: Rect;
  /** Window area — drove silhouettes line up along the sill. */
  drove: Rect;
  /** Bookshelf (Almanac entry). */
  bookshelf: Point;
  /** Wireless (radio prop). */
  wireless: Point;
  /** Window backdrop (biome view). */
  windowView: Rect;
  /** Table + cuppa foreground. */
  table: Point;
  /** Rug / hearthstone foreground. */
  rug: Rect;
  /** Thistle prop beside the window. */
  thistle: Point;
  /** Highland postie standing at the doorway (left edge). */
  postie: Point;
  /** Neighbour-wifie cradling a basket of eggs near the window. */
  neighbour: Point;
  /** Pair of weans playing on the rug, foreground-and-centre. */
  weans: Point;
  /** Standing border collie beside Gran, near the hearth. */
  sheepdog: Point;
  /** Returning haggis pal home from the moor, beside the bookshelf. */
  returningPal: Point;
}

export interface CroftLayout extends CroftElements {
  /** Canvas center — useful for diagnostics / fade anchors. */
  center: Point;
  /** Uniform scale factor caller should apply to each sprite. */
  spriteScale: number;
}

/**
 * Compute absolute positions for every croft element.
 *
 * @param input - viewport and UI scale.
 * @returns layout with absolute positions.
 */
export function layoutCroft(input: CroftLayoutInput): CroftLayout {
  const { uiScale, width, height } = input;
  const cx = width / 2;
  const cy = height / 2;

  // Vertical bands — top wall (0.25h), mid wall (0.5h), foreground (0.85h).
  const topBand = height * 0.25;
  const midBand = height * 0.52;
  const foreBand = height * 0.85;

  return {
    center: { x: cx, y: cy },
    // Gran sits slightly right of center, close to the hearth.
    gran: { x: cx + width * 0.08, y: midBand + height * 0.08 },
    // Hearth left-of-center, mid-band.
    hearth: { x: cx - width * 0.05, y: midBand + height * 0.05 },
    // Mantelpiece above the hearth.
    mantelpiece: {
      x: cx - width * 0.22,
      y: topBand,
      w: width * 0.4,
      h: height * 0.08,
    },
    // Photo wall on the right interior wall. Pre-fix the wall's right
    // edge (0.94 × width) ran 90+ px past the action-column left edge
    // (width − 168) at desktop widths — the OOT THE DOOR / SPORRAN /
    // ALBUM / WIRELESS buttons covered the rightmost polaroid column.
    // Trimmed width 0.26 → 0.20 and shifted x 0.68 → 0.62 so the wall
    // ends at 0.82 × width with a clear gutter before the buttons.
    photoWall: {
      x: width * 0.62,
      y: topBand - height * 0.05,
      w: width * 0.2,
      h: height * 0.3,
    },
    // Drove silhouettes along window sill (left half).
    drove: {
      x: width * 0.04,
      y: midBand,
      w: width * 0.3,
      h: height * 0.1,
    },
    bookshelf: { x: width * 0.9, y: midBand },
    wireless: { x: width * 0.82, y: topBand + height * 0.05 },
    // Window backdrop behind drove silhouettes.
    windowView: {
      x: width * 0.04,
      y: topBand - height * 0.08,
      w: width * 0.3,
      h: height * 0.3,
    },
    // Table & cuppa foreground, centered slightly right.
    table: { x: cx + width * 0.12, y: foreBand },
    rug: {
      x: cx - width * 0.18,
      y: foreBand - height * 0.02,
      w: width * 0.36,
      h: height * 0.08,
    },
    thistle: { x: width * 0.08, y: foreBand - height * 0.1 },
    // Postie at the doorway — left edge, vertical mid-band so he reads as
    // standing in the entryway. Below the drove window, above the foreground.
    postie: { x: width * 0.1, y: midBand + height * 0.12 },
    // Neighbour-wifie tucked between the drove window and the hearth so
    // she shares the left half of the room without crowding the mantelpiece.
    neighbour: { x: width * 0.28, y: midBand + height * 0.06 },
    // Weans on the rug, foreground-centred ahead of Gran. Sits on top of
    // the rug strip so the pair anchors the warmth-stack visually.
    weans: { x: cx - width * 0.04, y: foreBand - height * 0.04 },
    // Sheepdog standing alert beside Gran on the hearth side — slightly
    // forward so he reads as nearer the viewer than she is.
    sheepdog: { x: cx + width * 0.18, y: midBand + height * 0.13 },
    // Returning pal beside the bookshelf on the right wall — a wee bit
    // forward of the bookshelf hit so he doesn't block the Almanac click.
    returningPal: { x: width * 0.82, y: midBand + height * 0.1 },
    spriteScale: uiScale,
  };
}

/**
 * All element keys in draw order (back-to-front).
 * Caller renders sprites in this order so foreground props sit on top.
 */
export const CROFT_DRAW_ORDER: readonly (keyof CroftElements)[] = [
  'windowView',
  'drove',
  'thistle',
  'mantelpiece',
  'photoWall',
  'bookshelf',
  'wireless',
  'hearth',
  // Visitors sit just behind Gran / the foreground props so she still
  // reads as the focal point, but in front of mantelpiece / drove /
  // bookshelf which they may visually overlap.
  'postie',
  'neighbour',
  'sheepdog',
  'returningPal',
  'rug',
  'weans',
  'table',
  'gran',
] as const;

/**
 * Phaser scene key for CroftScene. Exposed as a pure constant so
 * tests + callers can reference it without importing the scene class
 * (which would drag Phaser into node-env vitest).
 */
export const CROFT_SCENE_KEY = 'Croft';

/**
 * The i18n keys CroftScene reads at render time. Kept here so a
 * single source of truth drives both the scene and its smoke test —
 * adding a new string means adding it to this list, adding the EN
 * value, and (ideally) adding the SCS overlay.
 */
export const CROFT_I18N_KEYS = [
  'ui.croft.title',
  'ui.croft.subtitle',
  'ui.croft.gran_greet',
  'ui.croft.back',
  'ui.croft.actions.start_run',
  'ui.croft.actions.shop',
  'ui.croft.actions.chronicle',
  'ui.croft.actions.settings',
] as const;

export type CroftI18nKey = (typeof CROFT_I18N_KEYS)[number];
