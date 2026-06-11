/**
 * H1 T5 — CroftInteractionRouter.
 *
 * Pure mapping from a Croft interaction key (a clicked element) to
 * the Phaser scene key the player should land in. Kept as a tiny
 * self-contained module so CroftScene can delegate routing and the
 * unit test can cover every action without instantiating Phaser.
 *
 * T8 wires every action into CroftScene buttons. Some targets are
 * intentionally stubbed here (`variant_picker` = 'Menu' until M3
 * drove click lands) so the call-sites stay uniform.
 */

export type CroftActionKey =
  | 'start_run'
  | 'shop'
  | 'settings'
  | 'chronicle'
  | 'deeds'
  | 'almanac'
  | 'variant_picker'
  | 'quit';

/** Phaser scene keys — mirrors the `super({ key: 'X' })` string in each scene file. */
export type SceneKey =
  | 'Boot'
  | 'MainMenu'
  | 'Menu'
  | 'Croft'
  | 'Game'
  | 'GameOver'
  | 'Shop'
  | 'MetaShop'
  | 'Chronicle'
  | 'Deeds'
  | 'Almanac'
  | 'Curse'
  | 'Settings';

export interface CroftRoute {
  target: SceneKey;
  /**
   * Whether this action should be treated as "leaving the croft for a
   * run" (true) vs "popping a sub-view you'll return from" (false).
   * Lets callers decide whether to tween the fade or simply push the
   * sub-scene on top.
   */
  leavesCroft: boolean;
}

const ROUTES: Readonly<Record<CroftActionKey, CroftRoute>> = {
  // Start Run routes to Curse picker first — Curse commits to Game on its own pick.
  start_run: { target: 'Curse', leavesCroft: true },
  shop: { target: 'Shop', leavesCroft: false },
  settings: { target: 'Settings', leavesCroft: false },
  chronicle: { target: 'Chronicle', leavesCroft: false },
  deeds: { target: 'Deeds', leavesCroft: false },
  almanac: { target: 'Almanac', leavesCroft: false },
  /**
   * M3 drove-click flow walks the haggis to a picker overlay. Until
   * M3 ships the picker, clicking the drove relegates to MenuScene
   * so the loadout carousel handles variant selection.
   */
  variant_picker: { target: 'Menu', leavesCroft: true },
  /**
   * "Quit" from the croft returns to the main menu where the
   * player can close the tab or switch profiles.
   */
  quit: { target: 'MainMenu', leavesCroft: true },
};

export function route(key: CroftActionKey): CroftRoute {
  return ROUTES[key];
}

export const CROFT_ACTION_KEYS: readonly CroftActionKey[] = Object.freeze(
  Object.keys(ROUTES) as CroftActionKey[],
);
