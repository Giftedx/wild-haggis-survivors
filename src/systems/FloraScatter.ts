/**
 * FloraScatter — places ~200 seeded decoration sprites across the world
 * with per-biome variant weighting and gentle sway animation.
 *
 * Performance: all 200 images use visibility culling (camera bounds +
 * margin). Only visible sprites update position each frame.
 */
import * as Phaser from 'phaser';
import type { BiomeManager } from './BiomeManager';
import type { BiomeId } from '../data/biomes';
import type { RNG } from '../utils/rng';
import { getActiveSeasonalEventKey } from './SeasonalEventManager';
import { safeAddImage } from '../scenes/safeAddImage';

interface FloraSprite {
  image: Phaser.GameObjects.Image;
  baseX: number;
  baseY: number;
  phase: number;
  swayable: boolean;
}

/** Weighted texture tables per biome. Each entry: [textureKey, cumulativeWeight]. */
type WeightedEntry = readonly [string, number];

/**
 * Sparse urban props injected into the heather biome — Glasgow lurking
 * at the moor's edge. Total weight 0.10 (≈ 1-in-10 heather scatter),
 * five entries at 0.02 each.
 */
const HEATHER_URBAN_PROPS: readonly string[] = [
  'deco_chippy_sign',
  'deco_bus_stop',
  'deco_newsprint',
  'deco_close_door',
  'deco_scaffold_post',
];
const HEATHER_URBAN_TOTAL = 0.10;
const HEATHER_URBAN_PER_ENTRY = HEATHER_URBAN_TOTAL / HEATHER_URBAN_PROPS.length; // 0.02

const STORY_PROPS_BY_BIOME: Readonly<Record<BiomeId, readonly string[]>> = {
  heather: [
    'deco_waymarker_post',
    'deco_pictish_stone',
    'deco_rowan_charm',
    'deco_burns_scrap',
    'deco_milestone',
  ],
  bog: [
    'deco_clootie_ribbons',
    'deco_washer_cloth',
    'deco_peat_spade',
    'deco_fairy_ring',
    'deco_brahan_eye_stone',
  ],
  pine: [
    'deco_ruined_croft',
    'deco_pech_tools',
    'deco_catsith_saucer',
    'deco_standing_stone_glyph',
    'deco_crannog_stake',
  ],
  loch: [
    'deco_selkie_skin',
    'deco_fishing_net',
    'deco_salmon_leap',
    'deco_bridge_plank',
    'deco_machair_shell',
  ],
  coastal: [
    // B5 Phase 1 — coastal-flavoured story props. Reuses loch's
    // marine-folklore set (machair shell, fishing net, salmon leap,
    // bridge plank) plus selkie-skin (per Risk 5: gender-neutral
    // *people of the seal* folklore, not the seal-woman bride trope).
    'deco_selkie_skin',
    'deco_fishing_net',
    'deco_machair_shell',
    'deco_bridge_plank',
    'deco_salmon_leap',
  ],
  haar: [
    // B5 Phase 1b — haar-flavoured story props. Fey palette;
    // east-coast cold sea-fog. Reuses pine's catsith-saucer (the
    // fog brings out the fey court) and loch's bridge plank (the
    // pier in fog), plus heather's milestone (waymarker swallowed
    // by haar reads as story tension), brahan_eye_stone (the seer
    // stone — vision motif fits "what does the haar hide?"), and
    // standing_stone_glyph (Pictish stone in fog is iconic).
    'deco_brahan_eye_stone',
    'deco_catsith_saucer',
    'deco_bridge_plank',
    'deco_milestone',
    'deco_standing_stone_glyph',
  ],
  frost: [
    // B5 Phase 2 — frost-flavoured story props. Grave palette;
    // Cairngorms in winter. Pictish stone (the high tops have
    // many), milestone (snow-bound waymarker), standing-stone
    // glyph (the Bodach Glas walks past these), brahan-eye stone
    // (cold seer-stone — the seer foresaw deep winter), antler
    // shed (already authored — winter detail). NO ruined-croft
    // per Risk 4 (Highland Clearances dignity).
    'deco_pictish_stone',
    'deco_milestone',
    'deco_standing_stone_glyph',
    'deco_brahan_eye_stone',
    'deco_antler_shed',
  ],
  // Highland Horrors — Cairngorm Plateau story props. Exposed summit
  // archaeology: Pictish stone (Cairngorm tops carry many), milestone
  // (snow-bound waymarker reads as eerie isolation), standing_stone_glyph
  // (ancient summit markers), antler shed (red deer shed in the corries),
  // brahan_eye_stone (the seer's cold stone — "the tops make seers of us all").
  cairngorm: [
    'deco_pictish_stone',
    'deco_milestone',
    'deco_standing_stone_glyph',
    'deco_antler_shed',
    'deco_brahan_eye_stone',
  ],
  // Highland Horrors — Glen Coe story props. Valley of grief and beauty;
  // handle respectfully. Rowan charm (planted at glen entries for protection),
  // standing_stone_glyph (the glen has old stones), milestone (the Military
  // Road ran through here post-Culloden), antler shed (Glen Coe red deer),
  // sheep skull (the glen tests everything). NO ruined-croft per Risk 4.
  glen_coe: [
    'deco_rowan_charm',
    'deco_standing_stone_glyph',
    'deco_milestone',
    'deco_antler_shed',
    'deco_sheep_skull',
  ],
  // Clyde Shipyard story props. Industrial archaeology: scaffold post
  // (the dry-dock staging), close door (tenement entry off the yard),
  // newsprint (shipyard workers' packed-lunch wrapper, Glesga Daily Record),
  // bus stop (shift change transport), waymarker post (the yard's painted
  // directional sign, repurposed). NO ruined-croft (wrong era/context).
  clyde_shipyard: [
    'deco_scaffold_post',
    'deco_close_door',
    'deco_newsprint',
    'deco_bus_stop',
    'deco_waymarker_post',
  ],
  // Black Bog — no story props. The ink swallows markers. The only
  // thing placed here is silence.
  black_bog: [],
};
const STORY_PROP_TOTAL = 0.08;

const FLORA_BY_BIOME: Readonly<Record<BiomeId, readonly WeightedEntry[]>> = {
  heather: [
    ['deco_heather', 0.20],
    ['deco_bracken', 0.35],
    ['deco_grouse_feather', 0.48],
    ['deco_wool_tuft', 0.60],
    ['deco_wind_grass', 0.74],
    ['deco_thistle', 0.88],
    ['deco_rock', 1.0],
  ],
  bog: [
    ['deco_bog_cotton', 0.18],
    ['deco_sphagnum', 0.34],
    ['deco_peat_cut', 0.50],
    ['deco_bog_boot', 0.56],
    ['deco_thistle', 0.72],
    ['deco_rock_2', 0.88],
    ['deco_heather', 1.0],
  ],
  pine: [
    ['deco_roots', 0.22],
    ['deco_pine_cone', 0.38],
    ['deco_mushrooms', 0.53],
    ['deco_rowan_berries', 0.66],
    ['deco_rock_3', 0.80],
    ['deco_thistle', 0.91],
    ['deco_heather', 1.0],
  ],
  loch: [
    ['deco_reeds', 0.24],
    ['deco_ripple', 0.40],
    ['deco_driftwood', 0.56],
    ['deco_creel', 0.66],
    ['deco_rock', 0.82],
    ['deco_glasgow_kite', 0.90],
    ['deco_heather', 1.0],
  ],
  // B5 Phase 1 — Seawrack/Coastal flora. Four new authored props
  // (kelp_strand, barnacle_rock, whelk_shell, foam_line) carry the
  // primary biome silhouette. driftwood + creel reused from loch
  // give beachcomber clutter without new texture keys.
  coastal: [
    ['deco_kelp_strand', 0.22],
    ['deco_foam_line', 0.40],
    ['deco_barnacle_rock', 0.56],
    ['deco_driftwood', 0.70],
    ['deco_whelk_shell', 0.84],
    ['deco_creel', 0.92],
    ['deco_rock', 1.0],
  ],
  // B5 Phase 1b — Haar flora. Two new authored props
  // (fog_pier, dripping_heather) sell the fog read; rest borrows
  // from existing biomes — heather + bog_cotton + rocks read fine
  // through the haar shader. Fey palette per ART_STYLE_BIBLE §Fey:
  // 66-79; clarity gates per Risk 7.
  haar: [
    ['deco_dripping_heather', 0.24],
    ['deco_fog_pier', 0.36],
    ['deco_bog_cotton', 0.52],
    ['deco_heather', 0.68],
    ['deco_rock_2', 0.82],
    ['deco_thistle', 0.92],
    ['deco_wind_grass', 1.0],
  ],
  // B5 Phase 2 — Frost flora. Four new authored props
  // (snow_patch, bare_birch, rime_bracken, ptarmigan_print)
  // carry the primary biome silhouette. winter_snowcap reused
  // from existing seasonal moor pack (Dec midwinter); rocks +
  // thistle reused. Grave palette per ART_STYLE_BIBLE §Grave:
  // 80-95.
  frost: [
    ['deco_snow_patch', 0.22],
    ['deco_bare_birch', 0.40],
    ['deco_rime_bracken', 0.56],
    ['deco_ptarmigan_print', 0.70],
    ['deco_winter_snowcap', 0.84],
    ['deco_rock_2', 0.94],
    ['deco_thistle', 1.0],
  ],
  // Highland Horrors — Cairngorm Plateau flora. Exposed quartzite, rime,
  // tough summit vegetation. Reuses frost textures where appropriate (snow,
  // rime bracken, bare birch) — the Cairngorm plateau in autumn reads like a
  // frost biome gone lighter. Rock-heavy: the tops are mostly stone.
  cairngorm: [
    ['deco_rock_3', 0.25],
    ['deco_rime_bracken', 0.42],
    ['deco_snow_patch', 0.56],
    ['deco_bare_birch', 0.68],
    ['deco_wind_grass', 0.80],
    ['deco_rock_2', 0.92],
    ['deco_thistle', 1.0],
  ],
  // Highland Horrors — Glen Coe flora. Dramatic valley: heather, bracken,
  // rocks, and the dark water of the river Coe. Reuses existing textures;
  // the red-black tint of the biome does the visual heavy lifting.
  glen_coe: [
    ['deco_heather', 0.20],
    ['deco_bracken', 0.38],
    ['deco_rock', 0.52],
    ['deco_bare_birch', 0.65],
    ['deco_bog_cotton', 0.76],
    ['deco_rock_2', 0.88],
    ['deco_wind_grass', 1.0],
  ],
  // Clyde Shipyard flora. Industrial dockland: rock rubble (broken
  // concrete and slag), traffic cone (ubiquitous urban clutter),
  // wind grass (scrubland on the dock margins), thistle (still grows
  // through concrete), rocks. No heather or bog cotton — no soil here.
  clyde_shipyard: [
    ['deco_rock', 0.22],
    ['deco_rock_2', 0.40],
    ['deco_traffic_cone', 0.56],
    ['deco_wind_grass', 0.72],
    ['deco_thistle', 0.88],
    ['deco_rock_3', 1.0],
  ],
  // Black Bog flora. Near-featureless ink-dark mire. The sphagnum is
  // black here; the bog-cotton grows but looks wrong. Almost no
  // dressing — the absence is the atmosphere.
  black_bog: [
    ['deco_sphagnum', 0.30],
    ['deco_bog_cotton', 0.55],
    ['deco_peat_cut', 0.72],
    ['deco_rock_2', 0.88],
    ['deco_rock', 1.0],
  ],
};

/** Map a real-month index (0-11) to a synthetic seasonal hint when no
 *  formal seasonal event is firing. April-May → spring, October-November
 *  → autumn, January-February → thaw. Returned as the same string keys
 *  the seasonal-event helper uses so the rest of the lookup is uniform. */
function inferSeasonHint(month: number): string | null {
  if (month === 9 || month === 10) return 'samhain'; // Oct, Nov → autumn leaves
  if (month === 3 || month === 4) return 'beltane'; // Apr, May → spring shoots
  if (month === 0 || month === 1) return 'hogmanay'; // Jan, Feb → thaw puddles
  if (month === 11) return 'midwinter'; // Dec → snowcap on heather
  if (month >= 5 && month <= 7) return 'lammas'; // Jun, Jul, Aug → summer barley
  return null;
}

/**
 * Build a season-augmented + urban-augmented variant of the base biome
 * table. Existing thresholds rescale to make room; new entries are
 * appended (urban) or prepended (seasonal) so cumulative weight stays
 * exactly 1.0.
 *
 * - `samhain` → +deco_autumn_leaves @ ~0.12 in pine + heather
 * - `beltane` → +deco_spring_shoot @ ~0.10 in heather + bog
 * - `hogmanay`/`burns_night` → +deco_thaw_puddle @ ~0.10 in bog
 * - `midwinter` (Dec) → +deco_winter_snowcap @ ~0.11 in heather + pine
 * - `lammas` (Jun–Aug) → +deco_summer_barley @ ~0.10 in heather + bog
 * - heather always gets HEATHER_URBAN_PROPS @ 0.10 total (season-independent)
 */
export function getBiomeTable(
  biome: BiomeId,
  seasonKey: string | null,
): readonly WeightedEntry[] {
  const base = FLORA_BY_BIOME[biome];
  let table: WeightedEntry[] = base.map((e) => [e[0], e[1]] as WeightedEntry);

  // Step 1: seasonal prepend.
  const seasonInjections: Array<{ biomes: BiomeId[]; key: string; weight: number }> = [];
  if (seasonKey === 'samhain') {
    seasonInjections.push({ biomes: ['pine', 'heather'], key: 'deco_autumn_leaves', weight: 0.12 });
  } else if (seasonKey === 'beltane') {
    seasonInjections.push({ biomes: ['heather', 'bog'], key: 'deco_spring_shoot', weight: 0.10 });
  } else if (seasonKey === 'hogmanay' || seasonKey === 'burns_night') {
    seasonInjections.push({ biomes: ['bog'], key: 'deco_thaw_puddle', weight: 0.10 });
  } else if (seasonKey === 'midwinter') {
    seasonInjections.push({ biomes: ['heather', 'pine'], key: 'deco_winter_snowcap', weight: 0.11 });
  } else if (seasonKey === 'lammas') {
    seasonInjections.push({ biomes: ['heather', 'bog'], key: 'deco_summer_barley', weight: 0.10 });
  }
  for (const inj of seasonInjections) {
    if (!inj.biomes.includes(biome)) continue;
    // Scale all existing thresholds by (1 - weight), then prepend the new entry at `weight`.
    const scale = 1 - inj.weight;
    table = [
      [inj.key, inj.weight] as WeightedEntry,
      ...table.map(([k, t]) => [k, inj.weight + t * scale] as WeightedEntry),
    ];
  }

  // Step 2: heather urban props — append at 0.02 each, scaling existing down to 0.90.
  if (biome === 'heather') {
    const scale = 1 - HEATHER_URBAN_TOTAL;
    const scaled = table.map(([k, t]) => [k, t * scale] as WeightedEntry);
    const urbanEntries: WeightedEntry[] = HEATHER_URBAN_PROPS.map(
      (k, i) => [k, scale + HEATHER_URBAN_PER_ENTRY * (i + 1)] as WeightedEntry,
    );
    table = [...scaled, ...urbanEntries];
  }

  // Step 3: sparse story props — low frequency, across every biome.
  // These are visual treats, so they must not crowd out the core biome
  // readability. Total injection is 8% of flora scatter.
  const storyProps = STORY_PROPS_BY_BIOME[biome];
  if (storyProps.length > 0) {
    const scale = 1 - STORY_PROP_TOTAL;
    const scaled = table.map(([k, t]) => [k, t * scale] as WeightedEntry);
    const per = STORY_PROP_TOTAL / storyProps.length;
    const storyEntries: WeightedEntry[] = storyProps.map(
      (k, i) => [k, scale + per * (i + 1)] as WeightedEntry,
    );
    table = [...scaled, ...storyEntries];
  }

  return table;
}

const FLORA_COUNT = 200;
const CULL_MARGIN = 150;

function pickTexture(table: readonly WeightedEntry[], roll: number): string {
  for (const [key, threshold] of table) {
    if (roll < threshold) return key;
  }
  return table[table.length - 1][0];
}

function isSwayable(textureKey: string): boolean {
  if (textureKey.includes('rock')) return false;
  if (textureKey.includes('peat')) return false;
  if (textureKey.includes('creel')) return false;
  if (textureKey.includes('driftwood')) return false;
  if (textureKey.includes('boot')) return false;
  if (textureKey.includes('ripple')) return false;
  if (textureKey.includes('pine_cone')) return false;
  if (textureKey.includes('grouse_feather')) return false;
  if (textureKey.includes('wool_tuft')) return false;
  // Static seasonal / urban props.
  if (textureKey.includes('thaw_puddle')) return false;
  if (textureKey.includes('chippy_sign')) return false;
  if (textureKey.includes('bus_stop')) return false;
  if (textureKey.includes('close_door')) return false;
  if (textureKey.includes('scaffold_post')) return false;
  // Static coastal props (foam settled on wet sand, shells lying flat).
  if (textureKey.includes('foam_line')) return false;
  if (textureKey.includes('whelk_shell')) return false;
  // Static haar props (pier piling is solid; dripping heather has
  // its own internal water-bead motion, no need for sway jitter).
  if (textureKey.includes('fog_pier')) return false;
  if (textureKey.includes('dripping_heather')) return false;
  // Static frost props (snow patches lie flat; rime locks bracken
  // in place; bare birch silhouettes are wind-stiffened anyway;
  // footprint is ground decal).
  if (textureKey.includes('snow_patch')) return false;
  if (textureKey.includes('bare_birch')) return false;
  if (textureKey.includes('rime_bracken')) return false;
  if (textureKey.includes('ptarmigan_print')) return false;
  // Story props are mostly solid landmarks or placed objects. Clootie
  // ribbons already include visual motion in their silhouette; keep
  // runtime sway off so they do not jitter like grass.
  for (const props of Object.values(STORY_PROPS_BY_BIOME)) {
    if (props.includes(textureKey)) return false;
  }
  return true;
}

export class FloraScatter {
  private flora: FloraSprite[] = [];
  private time = 0;

  create(
    scene: Phaser.Scene,
    biomeManager: BiomeManager,
    worldW: number,
    worldH: number,
    rng: RNG,
  ): void {
    // Clean up previous run (scene instance reuse).
    this.destroy();

    // Sample the seasonal hint ONCE per scatter pass — getActiveSeasonalEventKey
    // is cheap but it shouldn't be called per tile. Fall back to a month-based
    // hint when no formal seasonal event is firing so the moor still shifts
    // tone with the calendar.
    const now = new Date();
    const seasonKey = getActiveSeasonalEventKey(now) ?? inferSeasonHint(now.getMonth());

    // Memo per-biome tables so we only renormalize once per biome.
    const tableCache = new Map<BiomeId, readonly WeightedEntry[]>();
    const tableFor = (biome: BiomeId): readonly WeightedEntry[] => {
      let t = tableCache.get(biome);
      if (!t) {
        t = getBiomeTable(biome, seasonKey);
        tableCache.set(biome, t);
      }
      return t;
    };

    for (let i = 0; i < FLORA_COUNT; i++) {
      const x = rng.float(0, worldW);
      const y = rng.float(0, worldH);
      const biome = biomeManager.biomeAt(x, y);
      const table = tableFor(biome);
      const textureKey = pickTexture(table, rng.next());
      const scale = 0.8 + rng.next() * 0.4;
      const phase = rng.next() * Math.PI * 2;
      const swayable = isSwayable(textureKey);

      // Guard via safeAddImage — when a unit-test stub skips BootScene
      // baking, the missing-texture key returns null and we skip the
      // sprite. Production paths always have the texture from Boot.
      const img = safeAddImage(scene, x, y, textureKey);
      if (!img) continue;
      img.setDepth(-3 + (y / worldH) * 0.5);
      img.setAlpha(0.7);
      img.setScale(scale);
      img.setVisible(false); // culled by default until update runs

      this.flora.push({ image: img, baseX: x, baseY: y, phase, swayable });
    }
  }

  update(delta: number, camera: Phaser.Cameras.Scene2D.Camera): void {
    this.time += delta * 0.001;
    const cam = camera.worldView;
    const left = cam.x - CULL_MARGIN;
    const right = cam.right + CULL_MARGIN;
    const top = cam.y - CULL_MARGIN;
    const bottom = cam.bottom + CULL_MARGIN;

    for (const f of this.flora) {
      if (f.baseX < left || f.baseX > right || f.baseY < top || f.baseY > bottom) {
        f.image.setVisible(false);
        continue;
      }
      f.image.setVisible(true);

      if (f.swayable) {
        const sx = Math.sin(this.time * 1.2 + f.phase) * 1.5;
        const sy = Math.cos(this.time * 0.8 + f.phase * 1.3) * 0.8;
        f.image.setPosition(f.baseX + sx, f.baseY + sy);
      }
    }
  }

  destroy(): void {
    for (const f of this.flora) f.image.destroy();
    this.flora = [];
    this.time = 0;
  }
}
