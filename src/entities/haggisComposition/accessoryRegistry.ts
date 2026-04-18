/**
 * id → AccessoryDrawer map. Populated by each accessory drawer module
 * registering itself. Phase 0 ships `tam_o_shanter`; remaining 16
 * accessories land in Phase 2 + 2.5.
 */

import type { AccessoryDrawer } from './AccessoryDrawer';
import { TAM_O_SHANTER_DRAWER } from './drawers/tamOShanter';

export const ACCESSORY_REGISTRY: Readonly<Record<string, AccessoryDrawer>> = {
  tam_o_shanter: TAM_O_SHANTER_DRAWER,
};

export function getAccessoryDrawer(id: string): AccessoryDrawer | undefined {
  return ACCESSORY_REGISTRY[id];
}
