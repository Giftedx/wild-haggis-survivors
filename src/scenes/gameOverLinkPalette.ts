/**
 * Pure palette resolvers for GameOverScene's three tiny text links —
 * the seed readout ("↘ copy seed"), the postcard save ("📮 save"),
 * and the same-seed rerun ("↻ same seed").
 *
 * Seed + postcard share a "copy-action" visual language: a quiet idle
 * colour, a warm hover, and a green confirmation once the action
 * succeeds. The seed link tints idle warmer when the player is on
 * the Daily Moor so the two kinds of run read differently at a
 * glance.
 *
 * The rerun link uses a moss-green palette to sit apart from the
 * copy-action group — it is a navigation, not a share.
 */

export interface CopyActionLinkPalette {
  /** Quiet default colour. */
  idle: string;
  /** Warm amber on hover — invites the click. */
  hover: string;
  /** Mint green shown after the copy/save lands. */
  success: string;
}

export interface RerunLinkPalette {
  /** Moss green idle. */
  idle: string;
  /** Pale lime on hover. */
  hover: string;
}

/** Colour used once a copy/save succeeds (shared by seed + postcard). */
export const COPY_ACTION_SUCCESS_COLOR = '#9de6a8';
/** Warm amber hover colour (shared by seed + postcard). */
export const COPY_ACTION_HOVER_COLOR = '#ffe2a0';

export function resolveCopyActionLinkPalette(isDaily: boolean): CopyActionLinkPalette {
  return {
    idle: isDaily ? '#e2c97a' : '#a8b0c0',
    hover: COPY_ACTION_HOVER_COLOR,
    success: COPY_ACTION_SUCCESS_COLOR,
  };
}

export function resolveRerunLinkPalette(): RerunLinkPalette {
  return {
    idle: '#b8d0a8',
    hover: '#e8fbd0',
  };
}
