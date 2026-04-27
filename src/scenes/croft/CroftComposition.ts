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
 *     │ door  window/drove  hearth photo wall │
 *     │ postie  neighbour   Gran    bookshelf │
 *     │          rug + weans table + dog      │
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
  const narrow = width < 600;

  if (narrow) {
    return {
      center: { x: cx, y: cy },
      gran: { x: cx + width * 0.12, y: height * 0.565 },
      hearth: { x: cx - width * 0.10, y: height * 0.555 },
      mantelpiece: {
        x: cx - width * 0.25,
        y: height * 0.35,
        w: width * 0.5,
        h: height * 0.055,
      },
      photoWall: {
        x: width * 0.66,
        y: height * 0.22,
        w: width * 0.26,
        h: height * 0.18,
      },
      drove: {
        x: width * 0.10,
        y: height * 0.39,
        w: width * 0.36,
        h: height * 0.08,
      },
      bookshelf: { x: width * 0.80, y: height * 0.54 },
      wireless: { x: width * 0.73, y: height * 0.37 },
      windowView: {
        x: width * 0.08,
        y: height * 0.205,
        w: width * 0.38,
        h: height * 0.22,
      },
      table: { x: width * 0.58, y: height * 0.665 },
      rug: {
        x: width * 0.28,
        y: height * 0.615,
        w: width * 0.44,
        h: height * 0.075,
      },
      thistle: { x: width * 0.14, y: height * 0.49 },
      postie: { x: width * 0.17, y: height * 0.58 },
      neighbour: { x: width * 0.35, y: height * 0.535 },
      weans: { x: width * 0.46, y: height * 0.675 },
      sheepdog: { x: width * 0.70, y: height * 0.625 },
      returningPal: { x: width * 0.76, y: height * 0.62 },
      spriteScale: uiScale,
    };
  }

  return {
    center: { x: cx, y: cy },
    // Gran sits right of the hearth as the room's emotional focal point.
    gran: { x: cx + width * 0.105, y: height * 0.57 },
    // Hearth is central enough to warm the whole composition.
    hearth: { x: cx - width * 0.055, y: height * 0.53 },
    mantelpiece: {
      x: cx - width * 0.19,
      y: height * 0.315,
      w: width * 0.31,
      h: height * 0.06,
    },
    // Photo wall on the right interior wall, inside the room frame and
    // clear of the action board.
    photoWall: {
      x: width * 0.655,
      y: height * 0.205,
      w: width * 0.17,
      h: height * 0.255,
    },
    // Drove silhouettes along the window sill on the left wall.
    drove: {
      x: width * 0.082,
      y: height * 0.43,
      w: width * 0.245,
      h: height * 0.09,
    },
    bookshelf: { x: width * 0.805, y: height * 0.55 },
    wireless: { x: width * 0.755, y: height * 0.39 },
    windowView: {
      x: width * 0.075,
      y: height * 0.215,
      w: width * 0.25,
      h: height * 0.285,
    },
    table: { x: cx + width * 0.12, y: height * 0.79 },
    rug: {
      x: cx - width * 0.17,
      y: height * 0.735,
      w: width * 0.35,
      h: height * 0.12,
    },
    thistle: { x: width * 0.095, y: height * 0.67 },
    postie: { x: width * 0.13, y: height * 0.63 },
    neighbour: { x: width * 0.31, y: height * 0.57 },
    weans: { x: cx - width * 0.04, y: height * 0.81 },
    sheepdog: { x: cx + width * 0.20, y: height * 0.68 },
    returningPal: { x: width * 0.745, y: height * 0.655 },
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
