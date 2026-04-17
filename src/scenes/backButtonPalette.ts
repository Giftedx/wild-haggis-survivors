/**
 * Pure 2-state fill palette for the standard "Back" button used on
 * every non-gameplay scene (Settings, Chronicle, Deeds, CurseScene,
 * MetaShop, the No/Cancel button in the Ironmoor confirm dialog).
 *
 * A single shared palette means the button reads identically no
 * matter which screen the player is on — the hover nudge is 1 step
 * brighter than the idle navy, nothing more. Previously each scene
 * declared the two hex literals (0x252540, 0x2a2244) inline next to
 * pointerover / pointerout handlers, so a one-pixel tweak meant
 * chasing six files.
 */

export interface BackButtonPalette {
  idle: number;
  hover: number;
}

export const BACK_BUTTON_FILL_IDLE = 0x252540;
export const BACK_BUTTON_FILL_HOVER = 0x2a2244;

export function resolveBackButtonPalette(): BackButtonPalette {
  return {
    idle: BACK_BUTTON_FILL_IDLE,
    hover: BACK_BUTTON_FILL_HOVER,
  };
}
