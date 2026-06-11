/**
 * id → AccessoryDrawer map. Populated by each accessory drawer module
 * registering itself. Drawer ids match their passive-item keys in
 * `passiveEffects.ts` so a picked passive can equip the visible
 * accessory with a single lookup.
 */

import type { AccessoryDrawer } from './AccessoryDrawer';
import { TAM_O_SHANTER_DRAWER } from './drawers/tamOShanter';
import { KILT_DRAWER } from './drawers/kilt';
import { HIGHLAND_SHIELD_DRAWER } from './drawers/highlandShield';
import { SPORRAN_DRAWER } from './drawers/sporran';
import { THISTLE_CROWN_DRAWER } from './drawers/thistleCrown';
import { TARTAN_SASH_DRAWER } from './drawers/tartanSash';
import { WHISKY_FLASK_DRAWER } from './drawers/whiskyFlask';
import { IRN_BRU_DRAWER } from './drawers/irnBru';
import { LOCH_WATER_DRAWER } from './drawers/lochWater';

export const ACCESSORY_REGISTRY: Readonly<Record<string, AccessoryDrawer>> = {
  tam_o_shanter: TAM_O_SHANTER_DRAWER,
  kilt: KILT_DRAWER,
  highland_shield: HIGHLAND_SHIELD_DRAWER,
  sporran: SPORRAN_DRAWER,
  thistle_crown: THISTLE_CROWN_DRAWER,
  tartan_sash: TARTAN_SASH_DRAWER,
  whisky_flask: WHISKY_FLASK_DRAWER,
  irn_bru: IRN_BRU_DRAWER,
  loch_water: LOCH_WATER_DRAWER,
};

export function getAccessoryDrawer(id: string): AccessoryDrawer | undefined {
  return ACCESSORY_REGISTRY[id];
}
