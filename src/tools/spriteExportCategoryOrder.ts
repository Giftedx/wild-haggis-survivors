/**
 * Base category order. Atlas frame groups follow this list.
 */
const BASE_CATEGORY_ORDER = [
  'Player Variants',
  'Player Expressions',
  'Wildlife',
  'Enemies',
  'Bosses',
  'Hazards',
  'Projectiles',
  'Pickups',
  'Weapon Flourishes',
  'Weapon Icons',
  'Card Icons',
  'Relic Icons',
  'Node Markers',
  'Moor Moment Tokens',
  'Decorations',
  'Croft Props',
  'Boss Props',
  'HUD Elements',
  'HUD Status Badges',
  'Shadows',
  'Telegraph Effects',
  'Weather Effects',
  'Effects',
  'Other',
];

// Put preferred variants first. Put accessories in draw-depth order.
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

export function buildCategoryOrder(cats: Set<string>): string[] {
  const atlasHaggis = HAGGIS_VARIANT_ORDER
    .map((v) => `Haggis Frames — ${v}`)
    .filter((c) => cats.has(c));
  const remainingHaggis = [...cats]
    .filter((c) => c.startsWith('Haggis Frames — ') && !atlasHaggis.includes(c))
    .sort((a, b) => a.localeCompare(b));
  const atlasAccessories = ACCESSORY_ORDER_IN_EXPORT
    .map((a) => `Accessory Frames — ${a}`)
    .filter((c) => cats.has(c));
  const remainingAccessories = [...cats]
    .filter((c) => c.startsWith('Accessory Frames — ') && !atlasAccessories.includes(c))
    .sort((a, b) => a.localeCompare(b));
  const atlasOther = cats.has('Atlas Frames — Other') ? ['Atlas Frames — Other'] : [];
  const base = BASE_CATEGORY_ORDER.filter((c) => cats.has(c));
  return [
    ...base,
    ...atlasHaggis,
    ...remainingHaggis,
    ...atlasAccessories,
    ...remainingAccessories,
    ...atlasOther,
  ];
}
