/**
 * Wild Living World Initiative — Croft surface (first slice).
 *
 * Pure view-model for a Croft / Chronicle entry-point that lists the
 * Living World tracks currently shipped and their status. The first
 * slice is intentionally read-only: no save schema bump, no persistent
 * unlock state. The function ingests `LivingWorldTrackContext` (which
 * a future slice can hydrate from real save reads) and returns an
 * ordered list of entries the Croft UI can render.
 *
 * Design intent:
 *   - Surface the initiative as a "Living Moor" / "Whistle Post" panel.
 *   - Show each track in one of three states: shipped, introduced
 *     (mechanic exists but no unlock UX yet), or planned.
 *   - Keep i18n keys stable so EN + SCS overlays can grow independently.
 *
 * Replay determinism: not coupled. This is a between-runs view layer.
 * Save migrations: none — `LivingWorldTrackContext` is constructed
 * from already-persisted fields by the caller.
 */

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
 * Minimal context that drives status resolution. The first slice does
 * not read any of these — every track is hard-coded. Future slices
 * will check unlock flags here so adding a new track stays a single
 * data-edit.
 */
export interface LivingWorldTrackContext {
  /** Has the player ever finished a run with a companion present? */
  readonly hasFinishedCompanionRun?: boolean;
  /** Has the player ever started a Selkie run? */
  readonly hasPlayedSelkie?: boolean;
  /** Has the player ever fired the Waulking Mallet? */
  readonly hasFiredWaulkingMallet?: boolean;
  /** Has the player ever encountered the Up Helly Aa motif? */
  readonly hasSeenUpHellyAaMotif?: boolean;
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
 * Phase 2 rules (every shipped track is `'shipped'`; `croft_home`
 * graduated to `'shipped'` once the persistent companion picker
 * (`livingWorldUnlocks` + Croft picker panel) landed).
 */
function resolveStatus(
  key: LivingWorldTrackKey,
  _ctx: LivingWorldTrackContext,
): LivingWorldTrackStatus {
  switch (key) {
    case 'companions':
    case 'selkie_forms':
    case 'rhythm':
    case 'atmosphere':
    case 'music_bridge':
    case 'croft_home':
      return 'shipped';
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
