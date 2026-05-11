/**
 * Wild Living World Initiative — Croft "Living Moor" panel view-model.
 *
 * Pure data: maps persisted save slices (`runHistory`, `totalRuns`) into
 * `LivingWorldTrackContext`, then resolves each track to shipped vs
 * introduced vs planned for the Croft UI. No schema bump — only reads
 * fields that already exist on `SaveData`.
 *
 * Status semantics (player-facing chip + rows):
 *   - **shipped** — "OOT ON THE MOOR": this player has touched the slice
 *     in a logged run (or the hub row for `croft_home`).
 *   - **introduced** — "JUST AWA": ships in the build, not yet earned on
 *     this save from history signals we trust.
 *   - **planned** — "NO YET": reserved for future tracks / keys.
 *
 * Replay determinism: not coupled. Between-runs view layer only.
 */

import type { SaveData } from '../../utils/save/types';

/** Stable identifiers for each Living World track. */
export type LivingWorldTrackKey =
  | 'companions'
  | 'selkie_forms'
  | 'rhythm'
  | 'atmosphere'
  | 'music_bridge'
  | 'croft_home';

export type LivingWorldTrackStatus = 'shipped' | 'introduced' | 'planned';

export interface LivingWorldTrackVM {
  readonly key: LivingWorldTrackKey;
  /** i18n key resolved by the caller (`t(displayNameKey)`). */
  readonly displayNameKey: string;
  /** i18n key resolved by the caller (`t(descriptionKey)`). */
  readonly descriptionKey: string;
  readonly status: LivingWorldTrackStatus;
  /**
   * Stable order for rendering. Lower = earlier. Hand-curated so the
   * first user-facing tracks appear first, regardless of insertion
   * order in the source list.
   */
  readonly order: number;
}

/**
 * Signals derived from save + run history. Callers normally build this
 * with `deriveLivingWorldTrackContextFromSave(save)`; tests may set fields
 * directly.
 */
export interface LivingWorldTrackContext {
  /** Any finished run on this save (`totalRuns` or non-empty history). */
  readonly hasFinishedCompanionRun?: boolean;
  /** Logged run used the Selkie variant. */
  readonly hasPlayedSelkie?: boolean;
  /** Logged run had Waulking Mallet or Pibroch Hammer in the end-of-run weapon list. */
  readonly hasFiredWaulkingMallet?: boolean;
  /** Logged run was taken during the Up Helly Aa seasonal window. */
  readonly hasSeenUpHellyAaMotif?: boolean;
  /**
   * Long enough survival for reactive score layers to register — proxy
   * for "A Moor That Listens" without replaying audio in Croft.
   */
  readonly hasHeardReactiveMusicBridge?: boolean;
}

/** Seconds survived on any single run — at or above counts for music-bridge shipped. */
export const LIVING_WORLD_MUSIC_BRIDGE_MIN_SURVIVAL_SEC = 45;

/**
 * Hydrate track context from persisted save fields (no I/O).
 */
export function deriveLivingWorldTrackContextFromSave(
  save: Pick<SaveData, 'totalRuns' | 'runHistory'>,
): LivingWorldTrackContext {
  const runs = save.runHistory ?? [];
  const anyRunFinished = save.totalRuns > 0 || runs.length > 0;

  return {
    hasFinishedCompanionRun: anyRunFinished,
    hasPlayedSelkie: runs.some((e) => e.variantKey === 'selkie'),
    hasFiredWaulkingMallet: runs.some((e) =>
      (e.weaponKeys ?? []).some(
        (w) => w === 'waulking_mallet' || w === 'pibroch_hammer',
      ),
    ),
    hasSeenUpHellyAaMotif: runs.some((e) => e.seasonalEvent === 'up_helly_aa'),
    hasHeardReactiveMusicBridge: runs.some(
      (e) => (e.timeSurvivedSec ?? 0) >= LIVING_WORLD_MUSIC_BRIDGE_MIN_SURVIVAL_SEC,
    ),
  };
}

const TRACKS: ReadonlyArray<Omit<LivingWorldTrackVM, 'status'>> = [
  {
    key: 'companions',
    displayNameKey: 'ui.croft.livingWorld.companions.name',
    descriptionKey: 'ui.croft.livingWorld.companions.description',
    order: 1,
  },
  {
    key: 'selkie_forms',
    displayNameKey: 'ui.croft.livingWorld.selkieForms.name',
    descriptionKey: 'ui.croft.livingWorld.selkieForms.description',
    order: 2,
  },
  {
    key: 'rhythm',
    displayNameKey: 'ui.croft.livingWorld.rhythm.name',
    descriptionKey: 'ui.croft.livingWorld.rhythm.description',
    order: 3,
  },
  {
    key: 'atmosphere',
    displayNameKey: 'ui.croft.livingWorld.atmosphere.name',
    descriptionKey: 'ui.croft.livingWorld.atmosphere.description',
    order: 4,
  },
  {
    key: 'music_bridge',
    displayNameKey: 'ui.croft.livingWorld.musicBridge.name',
    descriptionKey: 'ui.croft.livingWorld.musicBridge.description',
    order: 5,
  },
  {
    key: 'croft_home',
    displayNameKey: 'ui.croft.livingWorld.croftHome.name',
    descriptionKey: 'ui.croft.livingWorld.croftHome.description',
    order: 6,
  },
];

/**
 * Resolve status for a single track against the supplied context.
 *
 * Rules: `croft_home` is always shipped (this panel). Other tracks flip
 * to shipped only when `runHistory` / `totalRuns` shows the player has
 * encountered that slice; otherwise `introduced` (in the build, not yet
 * on their hoofprint).
 */
function resolveStatus(
  key: LivingWorldTrackKey,
  ctx: LivingWorldTrackContext,
): LivingWorldTrackStatus {
  switch (key) {
    case 'croft_home':
      return 'shipped';
    case 'companions':
      return ctx.hasFinishedCompanionRun ? 'shipped' : 'introduced';
    case 'selkie_forms':
      return ctx.hasPlayedSelkie ? 'shipped' : 'introduced';
    case 'rhythm':
      return ctx.hasFiredWaulkingMallet ? 'shipped' : 'introduced';
    case 'atmosphere':
      return ctx.hasSeenUpHellyAaMotif ? 'shipped' : 'introduced';
    case 'music_bridge':
      return ctx.hasHeardReactiveMusicBridge ? 'shipped' : 'introduced';
    default:
      return 'planned';
  }
}

/**
 * Build the ordered, status-resolved track list for the Croft "Living
 * Moor" panel. Stable order so consumers can rely on rendering layout.
 */
export function buildLivingWorldTracks(
  ctx: LivingWorldTrackContext = {},
): LivingWorldTrackVM[] {
  return TRACKS
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((t) => ({
      ...t,
      status: resolveStatus(t.key, ctx),
    }));
}

/**
 * Header-pill summary for the Croft panel ("N of M live").
 * 'shipped' counts as live; 'introduced' counts as in-progress;
 * 'planned' counts as locked.
 */
export function livingWorldTracksSummary(
  entries: readonly LivingWorldTrackVM[],
): { shipped: number; introduced: number; planned: number; total: number } {
  let shipped = 0;
  let introduced = 0;
  let planned = 0;
  for (const e of entries) {
    if (e.status === 'shipped') shipped++;
    else if (e.status === 'introduced') introduced++;
    else planned++;
  }
  return { shipped, introduced, planned, total: entries.length };
}
