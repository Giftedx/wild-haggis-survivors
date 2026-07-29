import { BIOMES } from '../data/biomes';
import { HAZARDS } from '../data/hazards';
import { RELICS } from '../data/relics';
import { RUNES } from '../data/runes';
import { VARIANTS } from '../data/variants';
import { WEAPON_DEFS } from '../data/weapons';
import { SEASONAL_EVENTS } from '../systems/SeasonalEventManager';
import { SAVE_SCHEMA_VERSION } from '../utils/save/schema';
import { BURNS_EVOLUTION_THRESHOLD, EVOLUTION_RECIPES } from './BalanceConfig';

export const REPO_FACTS = {
  'weapons.total': Object.keys(WEAPON_DEFS).length,
  'weapons.evolved': Object.keys(WEAPON_DEFS).filter((weapon) => EVOLUTION_RECIPES.some(({ evolvedWeapon }) => evolvedWeapon === weapon)).length,
  'evolution.recipes': EVOLUTION_RECIPES.length,
  'evolution.burnsThreshold': BURNS_EVOLUTION_THRESHOLD,
  'relics.count': Object.keys(RELICS).length,
  'variants.count': VARIANTS.length,
  'biomes.count': Object.keys(BIOMES).length,
  'hazards.count': Object.keys(HAZARDS).length,
  'runes.count': Object.keys(RUNES).length,
  'seasonalEvents.count': Object.keys(SEASONAL_EVENTS).length,
  'save.schemaVersion': SAVE_SCHEMA_VERSION,
} as const satisfies Readonly<Record<string, number>>;
