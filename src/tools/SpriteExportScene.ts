/**
 * SpriteExportScene — composites ALL game textures into a single large PNG
 * for visual review. Activated by visiting the dev server with ?export=sprites
 *
 * Each sprite is drawn at 4× scale with its texture key as a label.
 * Sprites are grouped by category with section headers.
 * Background is transparent for easy review.
 */
import * as Phaser from 'phaser';
import { COLORS, COLORS_CSS } from '../config';
import { ENEMY_TYPES } from '../data/enemies';
import { ACCESSORY_REGISTRY } from '../entities/haggisComposition/accessoryRegistry';
import { ALL_ANIMATION_STATES } from '../animation/textureAtlas';

interface SpriteEntry {
  key: string;
  width: number;
  height: number;
  category: string;
}

// `?compact=1` halves SCALE + MAX_CELL_DIM and tightens MAX_ITEMS_PER_CATEGORY
// so the composite canvas fits inside headless Chromium's framebuffer
// attachment limits. Default mode produces the high-fidelity reference PNG;
// compact mode produces a smaller draft that always exports — useful when
// the sprite set has grown past the headless export ceiling.
const COMPACT_MODE =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('compact') === '1';

const SCALE = COMPACT_MODE ? 3 : 6;
const PADDING = COMPACT_MODE ? 8 : 16;
const LABEL_HEIGHT = COMPACT_MODE ? 12 : 20;
const SECTION_HEIGHT = COMPACT_MODE ? 28 : 48;
const COLS = 8;

type DrawableSource = HTMLCanvasElement | HTMLImageElement | ImageBitmap | OffscreenCanvas;
function isDrawableSource(v: unknown): v is DrawableSource {
  if (v instanceof HTMLCanvasElement) return true;
  if (v instanceof HTMLImageElement) return true;
  if (typeof ImageBitmap !== 'undefined' && v instanceof ImageBitmap) return true;
  if (typeof OffscreenCanvas !== 'undefined' && v instanceof OffscreenCanvas) return true;
  return false;
}

/** Ends with `_<state>_<frame>`. These are the Phase-0 atlas textures
 *  (`haggis_classic_idle_0`, `tam_o_shanter_walking_2`, etc.). They share
 *  one subject across many frames, so we category-group them separately
 *  from the legacy single-frame sprites. Sourced from the atlas module
 *  + accessory registry so adding a new state/accessory updates this
 *  tool automatically. */
const ATLAS_STATE_NAMES = ALL_ANIMATION_STATES;
const ACCESSORY_IDS = Object.keys(ACCESSORY_REGISTRY);

function isAtlasFrameKey(key: string): boolean {
  const parts = key.split('_');
  if (parts.length < 3) return false;
  const frame = parts[parts.length - 1];
  const state = parts[parts.length - 2];
  if (!/^\d+$/.test(frame)) return false;
  return (ATLAS_STATE_NAMES as readonly string[]).includes(state);
}


/** Every enemy texture key in data/enemies.ts, sourced automatically.
 *  Dedupes aliased textures (e.g. `berserker` shares `angry_scotsman`)
 *  and excludes `deep_fryer`, which lives in its own Hazards bucket. */
const ENEMY_TEXTURE_KEYS: ReadonlySet<string> = new Set(
  Object.values(ENEMY_TYPES)
    .map(e => e.texture)
    .filter((k): k is string => typeof k === 'string' && k !== 'deep_fryer'),
);

/** Categorize a texture key for grouping */
function categorize(key: string): string {
  // Phase-0 atlas frames — per-subject groups so readers can compare
  // every frame of one variant / accessory at a glance.
  if (isAtlasFrameKey(key)) {
    if (key.startsWith('haggis_')) {
      const parts = key.split('_');
      // haggis_<variant>_<state>_<frame>
      const variantKey = parts.slice(1, -2).join('_');
      return `Haggis Frames — ${variantKey}`;
    }
    for (const accId of ACCESSORY_IDS) {
      if (key.startsWith(`${accId}_`)) return `Accessory Frames — ${accId}`;
    }
    return 'Atlas Frames — Other';
  }

  if (key.startsWith('haggis_') && !key.includes('hunter') && !key.includes('ball') && !key.includes('cannon')) return 'Player Variants';
  if (key.startsWith('boss_prop_')) return 'Boss Props';
  if (key.startsWith('boss_')) return 'Bosses';
  if (key.startsWith('wicon_')) return 'Weapon Icons';
  if (key.startsWith('ucard_')) return 'Card Icons';
  if (key.startsWith('relic_')) return 'Relic Icons';
  if (key.startsWith('node_marker_')) return 'Node Markers';
  if (key.startsWith('moor_token_')) return 'Moor Moment Tokens';
  if (key.startsWith('croft_')) return 'Croft Props';
  if (key.startsWith('deco_')) return 'Decorations';
  if (key.startsWith('hud_')) return 'HUD Elements';
  if (key.startsWith('fx_telegraph_')) return 'Telegraph Effects';
  if (key.startsWith('fx_')) return 'Effects';
  if (['thistle', 'caber', 'haggis_ball'].includes(key)) return 'Projectiles';
  if (['xp_gem', 'health_orb', 'chest'].includes(key)) return 'Pickups';
  if (['entity_shadow', 'boss_shadow'].includes(key)) return 'Shadows';
  if (key === 'deep_fryer') return 'Hazards';
  if (ENEMY_TEXTURE_KEYS.has(key)) return 'Enemies';
  return 'Other';
}

/**
 * Base category-order. Atlas-frame groups are appended dynamically so
 * a new variant or accessory shows up without touching this list.
 */
const BASE_CATEGORY_ORDER = [
  'Player Variants',
  'Enemies',
  'Bosses',
  'Hazards',
  'Projectiles',
  'Pickups',
  'Weapon Icons',
  'Card Icons',
  'Relic Icons',
  'Node Markers',
  'Moor Moment Tokens',
  'Decorations',
  'Croft Props',
  'Boss Props',
  'HUD Elements',
  'Shadows',
  'Telegraph Effects',
  'Effects',
  'Other',
];

// Preferred order within atlas-frame groups: variants first (classic
// before the rest), then accessories in draw-depth order.
const HAGGIS_VARIANT_ORDER = [
  'classic',
  'moor_runner',
  'iron_belly',
  'glen_forager',
  'surefoot',
  'pipe_breath',
  'wee_ghostie',
  'laird',
  'glaswegian',
];
const ACCESSORY_ORDER_IN_EXPORT = [
  'loch_water',
  'highland_shield',
  'kilt',
  'tartan_sash',
  'sporran',
  'whisky_flask',
  'irn_bru',
  'tam_o_shanter',
  'thistle_crown',
];

function buildCategoryOrder(cats: Set<string>): string[] {
  const atlasHaggis = HAGGIS_VARIANT_ORDER
    .map((v) => `Haggis Frames — ${v}`)
    .filter((c) => cats.has(c));
  const atlasAccessories = ACCESSORY_ORDER_IN_EXPORT
    .map((a) => `Accessory Frames — ${a}`)
    .filter((c) => cats.has(c));
  const atlasOther = cats.has('Atlas Frames — Other') ? ['Atlas Frames — Other'] : [];
  const base = BASE_CATEGORY_ORDER.filter((c) => cats.has(c));
  return [...base, ...atlasHaggis, ...atlasAccessories, ...atlasOther];
}

export class SpriteExportScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SpriteExport' });
  }

  create(): void {
    // Collect all game textures. Skip internal Phaser ones and skip
    // Phase-0 atlas-frame cells — those are per-state / per-accessory
    // animation frames baked by BootScene, and including all of them
    // produces a multi-hundred-thousand-pixel canvas that exceeds
    // browser limits. Use `?export=sprites&atlas=1` to include them.
    const includeAtlasFrames = new URLSearchParams(window.location.search).get('atlas') === '1';
    const allKeys = this.textures.getTextureKeys()
      .filter((k) => !k.startsWith('__') || k === '__whs_missing_texture__')
      .filter((k) => includeAtlasFrames || !isAtlasFrameKey(k));

    // Build entries with dimensions
    const entries: SpriteEntry[] = [];
    for (const key of allKeys) {
      const tex = this.textures.get(key);
      if (!tex || !tex.source || tex.source.length === 0) continue;
      const src = tex.source[0];
      const w = src.width;
      const h = src.height;
      if (w === 0 || h === 0) continue;
      entries.push({ key, width: w, height: h, category: categorize(key) });
    }

    // Group by category. Atlas-frame groups sort by key (so frames
    // appear in order: idle_0, idle_1, walking_0, …); everything else
    // sorts by pixel area so the biggest sprite leads the row.
    //
    // Per-category cap: the BootScene pre-bake pipeline produces many
    // hundreds of transient textures (colour-shifted variants, glow
    // frames, per-hit tints). Without a cap the canvas balloons past
    // browser limits (~16k px per edge) and the export silently dies.
    const MAX_ITEMS_PER_CATEGORY = COMPACT_MODE ? 32 : 64;
    const groups = new Map<string, SpriteEntry[]>();
    const allCats = new Set(entries.map((e) => e.category));
    for (const cat of buildCategoryOrder(allCats)) {
      const items = entries.filter((e) => e.category === cat);
      if (items.length === 0) continue;
      if (cat.startsWith('Haggis Frames') || cat.startsWith('Accessory Frames')) {
        items.sort((a, b) => a.key.localeCompare(b.key));
      } else {
        items.sort((a, b) => (b.width * b.height) - (a.width * a.height));
      }
      groups.set(cat, items.slice(0, MAX_ITEMS_PER_CATEGORY));
    }

    // Calculate canvas dimensions
    // Each cell: max(sprite_width * SCALE, label_width) + PADDING
    // We use a fixed cell size per row based on the largest sprite in that category
    const LEFT_MARGIN = 20;
    const TOP_MARGIN = 20;

    // First pass: calculate total height and max width needed
    let totalHeight = TOP_MARGIN;
    let maxRowWidth = 0;

    const layoutRows: Array<{
      type: 'header';
      text: string;
      y: number;
    } | {
      type: 'sprites';
      items: SpriteEntry[];
      cellW: number;
      cellH: number;
      y: number;
    }> = [];

    // Hard caps so we don't blow past browser canvas limits (~16k px
     // per edge on Chromium). Any sprite larger than MAX_CELL_DIM*SCALE
     // will still render — it just won't inflate the cell beyond these
     // bounds. cellW × COLS + margins must stay < 16384 too.
    const MAX_CELL_DIM = COMPACT_MODE ? 64 : 96;

    for (const [cat, items] of groups) {
      // Section header
      layoutRows.push({ type: 'header', text: cat, y: totalHeight });
      totalHeight += SECTION_HEIGHT;

      // Calculate cell size for this category, capped to avoid oversized
      // sprites blowing out the composite canvas.
      const maxW = Math.min(Math.max(...items.map((e) => e.width * SCALE)), MAX_CELL_DIM * SCALE);
      const maxH = Math.min(Math.max(...items.map((e) => e.height * SCALE)), MAX_CELL_DIM * SCALE);
      const cellW = maxW + PADDING * 2;
      const cellH = maxH + LABEL_HEIGHT + PADDING * 2;

      // Layout rows of COLS items
      for (let i = 0; i < items.length; i += COLS) {
        const row = items.slice(i, i + COLS);
        layoutRows.push({ type: 'sprites', items: row, cellW, cellH, y: totalHeight });
        const rowWidth = LEFT_MARGIN + row.length * cellW;
        maxRowWidth = Math.max(maxRowWidth, rowWidth);
        totalHeight += cellH;
      }

      totalHeight += PADDING; // gap between categories
    }

    totalHeight += TOP_MARGIN;
    const canvasWidth = Math.max(maxRowWidth + LEFT_MARGIN, 800);
    const canvasHeight = totalHeight;
    console.info('[SpriteExport] canvas:', canvasWidth, 'x', canvasHeight, 'entries:', entries.length);

    // Create the export canvas
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d')!;

    // Transparent background — draw a subtle grid for visibility
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw checkerboard so transparency is visible
    const checkSize = 8;
    for (let cy = 0; cy < canvasHeight; cy += checkSize) {
      for (let cx = 0; cx < canvasWidth; cx += checkSize) {
        const isLight = ((cx / checkSize) + (cy / checkSize)) % 2 === 0;
        ctx.fillStyle = isLight ? '#2a2a3e' : '#222236';
        ctx.fillRect(cx, cy, checkSize, checkSize);
      }
    }

    // Draw each layout row
    for (const row of layoutRows) {
      if (row.type === 'header') {
        ctx.fillStyle = COLORS_CSS.WHISKY_GOLD;
        ctx.font = 'bold 18px monospace';
        ctx.fillText(row.text.toUpperCase(), LEFT_MARGIN, row.y + 24);
        // Underline
        const textWidth = ctx.measureText(row.text.toUpperCase()).width;
        ctx.strokeStyle = COLORS_CSS.WHISKY_GOLD;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(LEFT_MARGIN, row.y + 30);
        ctx.lineTo(LEFT_MARGIN + textWidth + 20, row.y + 30);
        ctx.stroke();
      } else {
        const { items, cellW, cellH, y } = row;
        for (let i = 0; i < items.length; i++) {
          const entry = items[i];
          const x = LEFT_MARGIN + i * cellW;

          // Get the source canvas/image from Phaser texture. Phaser 4
          // widens the texture source type — `tex.source[0].image` may
          // be HTMLCanvasElement, HTMLImageElement, ImageBitmap, or
          // OffscreenCanvas depending on how the texture was created.
          // `ctx.drawImage` accepts all CanvasImageSource values, so
          // accept any of them rather than narrow.
          const tex = this.textures.get(entry.key);
          const raw = tex.source[0]?.image ?? tex.getSourceImage();
          const srcCanvas = isDrawableSource(raw) ? raw : null;

          if (srcCanvas) {
            // Draw sprite scaled up, centered in cell
            const scaledW = entry.width * SCALE;
            const scaledH = entry.height * SCALE;
            const drawX = x + (cellW - scaledW) / 2;
            const drawY = y + PADDING;

            // Disable smoothing for crisp pixel art
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(srcCanvas, 0, 0, entry.width, entry.height, drawX, drawY, scaledW, scaledH);
          }

          // Draw label below sprite
          ctx.fillStyle = '#cccccc';
          ctx.font = '10px monospace';
          const label = entry.key;
          const labelW = ctx.measureText(label).width;
          const labelX = x + (cellW - labelW) / 2;
          ctx.fillText(label, labelX, y + cellH - 4);

          // Draw size annotation
          ctx.fillStyle = '#888888';
          ctx.font = '8px monospace';
          const sizeLabel = `${entry.width}×${entry.height}`;
          const sizeW = ctx.measureText(sizeLabel).width;
          ctx.fillText(sizeLabel, x + (cellW - sizeW) / 2, y + cellH - 4 + 10);
        }
      }
    }

    // Auto-download the PNG via Blob URL. Large exports (multi-MB data
     // URLs) aren't reliably treated as downloads by Playwright's
     // `waitForEvent('download')`; Blob URLs fire the event cleanly.
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('[SpriteExport] canvas.toBlob returned null');
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'wild-haggis-survivors-sprites.png';
      link.href = url;
      document.body.appendChild(link);
      link.click();
      // Revoke the object URL after the browser has had a chance to
      // consume the href (next microtask is enough).
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }, 'image/png');

    // Also display in the game window for immediate viewing
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.BG_DARK);

    this.add.text(width / 2, height / 2 - 30, 'SPRITE SHEET EXPORTED', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: COLORS_CSS.WHISKY_GOLD,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 10, `${entries.length} sprites · ${groups.size} categories · ${canvasWidth}×${canvasHeight}px`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 40, 'PNG downloaded automatically. Check yir Downloads folder.', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#888888',
    }).setOrigin(0.5);
  }
}
