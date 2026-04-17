/**
 * Pure progress calculators for the Deeds (Achievements) browse screen.
 *
 * Save state is split across two managers (SaveManager meta save vs
 * utils/save gameplay save); rather than take either dependency, this
 * module accepts a single `DeedStatsSnapshot` so it's trivially testable
 * and callers can compose the snapshot however they like.
 *
 * Three deeds are intentionally "binary" — in-run events with no persisted
 * progress proxy (taxman kill, first evolution, all-bosses-in-one-run).
 * These show as locked with a mystery hint until the unlock event fires;
 * revealing a 0/1 progress bar would leak the trigger condition and kill
 * the surprise of the first unlock.
 */
import { ACHIEVEMENT_DEFS, type AchievementId } from '../core/BalanceConfig';
import { COLORS, COLORS_CSS } from '../config';
import { formatClock, getCodexRosterTotal } from './chronicleAggregates';

/**
 * Header subtitle + colour for the Deeds screen, keyed on the
 * earned-vs-total state.
 *
 *   0 earned          → "_empty"    (warm introduction, soft tan)
 *   earned >= total   → "_complete" (celebratory gold — total > 0 required)
 *   anything between  → "_partial"  (neutral progress, same soft tan)
 */
export interface DeedsSubtitleStyle {
  key: string;
  color: string;
}

export function resolveDeedsSubtitleStyle(earned: number, total: number): DeedsSubtitleStyle {
  if (earned === 0) {
    return { key: 'ui.deeds.sub_empty', color: '#b8a88a' };
  }
  if (earned >= total && total > 0) {
    return { key: 'ui.deeds.sub_complete', color: '#f7d27a' };
  }
  return { key: 'ui.deeds.sub_partial', color: '#b8a88a' };
}

export type DeedStatus = 'locked' | 'in_progress' | 'unlocked';

/**
 * Description text shown on the Deeds card. Binary-locked deeds
 * (taxman kill, first evolution, all-bosses-in-one-run) hide their
 * real trigger condition behind a "mystery" hint so the first unlock
 * is still a surprise. Everything else reads straight from the def.
 */
export interface DeedDescription {
  text: string;
  /** True for the italic mystery hint; scene uses this for fontStyle. */
  italic: boolean;
}

export interface DeedDescriptionInput {
  status: DeedStatus;
  isBinary: boolean;
  /** i18n key already resolved by the caller (`t(def.descriptionKey)`). */
  fullDescription: string;
  /** i18n string for the "???" mystery hint (`t('ui.deeds.locked_mystery')`). */
  mysteryHint: string;
}

/**
 * Progress bar colours for the Deeds card (threshold deeds only —
 * binary deeds don't render a bar). Two states:
 *
 *   unlocked: gold fill, gold numeric label (celebrate achievement)
 *   in_progress / locked: cool slate fill, muted numeric label
 */
export interface DeedProgressBarStyle {
  fillColor: number;
  labelColor: string;
}

export const DEED_PROGRESS_BAR_UNLOCKED: DeedProgressBarStyle = {
  fillColor: COLORS.WHISKY_GOLD, labelColor: COLORS_CSS.WHISKY_GOLD,
};
export const DEED_PROGRESS_BAR_LOCKED: DeedProgressBarStyle = {
  fillColor: 0x4a6090, labelColor: '#8a93a8',
};

export function resolveDeedProgressBarStyle(unlocked: boolean): DeedProgressBarStyle {
  return unlocked ? DEED_PROGRESS_BAR_UNLOCKED : DEED_PROGRESS_BAR_LOCKED;
}

export function resolveDeedDescription(input: DeedDescriptionInput): DeedDescription {
  const isLockedBinary = input.status !== 'unlocked' && input.isBinary;
  return isLockedBinary
    ? { text: input.mysteryHint, italic: true }
    : { text: input.fullDescription, italic: false };
}

/**
 * Every colour the Deeds card renderer needs, keyed on status.
 * Pure selector — returning all six fields at once keeps the three
 * state rows (bg, icon, title, status, desc, stroke) in lockstep.
 */
export interface DeedCardPalette {
  bgColor: number;
  strokeColor: number;
  strokeWidth: number;
  strokeAlpha: number;
  iconChar: string;
  iconColor: string;
  titleColor: string;
  statusColor: string;
  descColor: string;
}

export function resolveDeedCardPalette(status: DeedStatus): DeedCardPalette {
  if (status === 'unlocked') {
    return {
      bgColor: 0x2a2015,
      strokeColor: COLORS.WHISKY_GOLD,
      strokeWidth: 2,
      strokeAlpha: 1,
      iconChar: '\u2726', // ✦
      iconColor: '#f7d27a',
      titleColor: '#f5e1a6',
      statusColor: '#9de6a8',
      descColor: '#cabfa0',
    };
  }
  if (status === 'in_progress') {
    return {
      bgColor: 0x10172a,
      strokeColor: 0x3a5078,
      strokeWidth: 1,
      strokeAlpha: 0.8,
      iconChar: '\u25cb', // ○
      iconColor: '#6a7ba8',
      titleColor: '#c7d1e4',
      statusColor: '#a8b3c8',
      descColor: '#95a0ba',
    };
  }
  // locked
  return {
    bgColor: 0x10172a,
    strokeColor: 0x283a5f,
    strokeWidth: 1,
    strokeAlpha: 0.8,
    iconChar: '\u25cb', // ○
    iconColor: '#3d4660',
    titleColor: '#6f7a94',
    statusColor: '#596780',
    descColor: '#5a6478',
  };
}

export interface DeedProgress {
  id: AchievementId;
  status: DeedStatus;
  /** True when no progress proxy is stored — UI should hide progress bar. */
  isBinary: boolean;
  /** Current progress count (e.g. 823 for ach_kills_1000). 0 for binary/unknown. */
  current: number;
  /** Target count for unlock (e.g. 1000). 0 for binary deeds. */
  target: number;
  /** 0..1 ratio; for binary deeds this is 0 when locked, 1 when unlocked. */
  ratio: number;
}

/** Stats drawn from both save layers and passed in as a single snapshot. */
export interface DeedStatsSnapshot {
  /** Meta save: `totalKills + totalKillsSpent` — lifetime cull counter. */
  lifetimeKills: number;
  /** Gameplay save: `bestTime` in seconds (single-run best). */
  bestTimeSec: number;
  /** Gameplay save: total run victories. */
  victories: number;
  /** Meta save: lifetime moor-moment beats (hearth gifts). */
  moorMomentsLifetime: number;
  /** Meta save: array of unlocked achievement IDs. */
  unlockedIds: readonly string[];
  /** Meta save: unique enemy keys recorded in the cull codex (length === discovered count). */
  codexDiscoveredCount: number;
  /** W2 Moor Road: count of distinct route keys picked across all logged runs. */
  uniqueRoutesWalked: number;
  /** Lifetime Ceilidh Chain pulses fired — feeds ach_ceilidh_commander. */
  ceilidhPulsesLifetime: number;
  /** Longest Post-Bell survival in seconds — feeds ach_endless_endurance. */
  bestEndlessSeconds: number;
}

/** Stable display order — progression-oriented, easiest→hardest-ish. */
export const DEED_DISPLAY_ORDER: AchievementId[] = [
  'ach_first_victory',
  'ach_first_evolution',
  'ach_codex_half',
  'ach_codex_loremaster',
  'ach_survive_5m',
  'ach_kills_1000',
  'ach_survive_10m',
  'ach_defeat_taxman',
  'ach_full_run',
  'ach_all_bosses',
  'ach_kills_5000',
  'ach_moor_hearth_30',
  'ach_walk_every_road',
  'ach_ironmoor_victor',
  'ach_laird_victor',
  'ach_full_herd',
  'ach_echo_touched',
  'ach_stone_circle',
  'ach_ceilidh_commander',
  'ach_past_the_bell',
  'ach_endless_endurance',
  'ach_cursed_victor',
];

/** Threshold-deed definitions — id → target (integer). */
const THRESHOLD_TARGETS: Partial<Record<AchievementId, { target: number; readCurrent: (s: DeedStatsSnapshot) => number }>> = {
  ach_kills_1000: { target: 1000, readCurrent: (s) => s.lifetimeKills },
  ach_kills_5000: { target: 5000, readCurrent: (s) => s.lifetimeKills },
  ach_survive_5m: { target: 300, readCurrent: (s) => s.bestTimeSec },
  ach_survive_10m: { target: 600, readCurrent: (s) => s.bestTimeSec },
  ach_full_run: { target: 900, readCurrent: (s) => s.bestTimeSec },
  ach_first_victory: { target: 1, readCurrent: (s) => Math.min(1, s.victories) },
  ach_moor_hearth_30: { target: 30, readCurrent: (s) => s.moorMomentsLifetime },
  ach_walk_every_road: { target: 6, readCurrent: (s) => Math.min(6, s.uniqueRoutesWalked) },
  ach_ceilidh_commander: { target: 15, readCurrent: (s) => s.ceilidhPulsesLifetime },
  ach_endless_endurance: { target: 60, readCurrent: (s) => s.bestEndlessSeconds },
};

/** Deeds without any persisted progress proxy — UI treats them as binary. */
const BINARY_DEEDS: ReadonlySet<AchievementId> = new Set<AchievementId>([
  'ach_first_evolution',
  'ach_defeat_taxman',
  'ach_all_bosses',
  'ach_ironmoor_victor',
  'ach_laird_victor',
  'ach_full_herd',
  'ach_echo_touched',
  'ach_stone_circle',
  'ach_past_the_bell',
  'ach_cursed_victor',
]);

export function computeDeedProgress(id: AchievementId, stats: DeedStatsSnapshot): DeedProgress {
  const isUnlocked = stats.unlockedIds.includes(id);

  const codexProgress = computeCodexDeedProgress(id, stats, isUnlocked);
  if (codexProgress) return codexProgress;

  if (BINARY_DEEDS.has(id)) {
    return {
      id,
      status: isUnlocked ? 'unlocked' : 'locked',
      isBinary: true,
      current: isUnlocked ? 1 : 0,
      target: 0,
      ratio: isUnlocked ? 1 : 0,
    };
  }

  const def = THRESHOLD_TARGETS[id];
  if (!def) {
    // Unknown — fall back to binary treatment so it renders gracefully.
    return {
      id,
      status: isUnlocked ? 'unlocked' : 'locked',
      isBinary: true,
      current: isUnlocked ? 1 : 0,
      target: 0,
      ratio: isUnlocked ? 1 : 0,
    };
  }

  const raw = Math.max(0, Math.floor(def.readCurrent(stats)));
  const clamped = Math.min(raw, def.target);
  const ratio = def.target > 0 ? clamped / def.target : 0;
  let status: DeedStatus;
  if (isUnlocked) status = 'unlocked';
  else if (clamped <= 0) status = 'locked';
  else status = 'in_progress';

  return {
    id,
    status,
    isBinary: false,
    current: clamped,
    target: def.target,
    ratio,
  };
}

/** Compute all deeds in display order. */
export function computeAllDeeds(stats: DeedStatsSnapshot): DeedProgress[] {
  return DEED_DISPLAY_ORDER
    .filter((id) => ACHIEVEMENT_DEFS[id])
    .map((id) => computeDeedProgress(id, stats));
}

/** "7 / N deeds" summary used in the scene header (N = `DEED_DISPLAY_ORDER.length`). */
export function deedSummary(stats: DeedStatsSnapshot): { earned: number; total: number } {
  const total = DEED_DISPLAY_ORDER.length;
  const earned = DEED_DISPLAY_ORDER.filter((id) => stats.unlockedIds.includes(id)).length;
  return { earned, total };
}

/** Pretty "current / target" label for threshold deeds (e.g. "823 / 1000"). */
export function formatDeedProgressLabel(d: DeedProgress): string {
  if (d.isBinary) return '';
  // For time-threshold deeds the target is in seconds — format as M:SS.
  const isTime = d.id === 'ach_survive_5m' || d.id === 'ach_survive_10m' || d.id === 'ach_full_run'
    || d.id === 'ach_endless_endurance';
  if (isTime) {
    return `${formatClock(d.current)} / ${formatClock(d.target)}`;
  }
  return `${d.current} / ${d.target}`;
}

function computeCodexDeedProgress(
  id: AchievementId,
  stats: DeedStatsSnapshot,
  isUnlocked: boolean,
): DeedProgress | null {
  if (id !== 'ach_codex_half' && id !== 'ach_codex_loremaster') return null;

  const roster = getCodexRosterTotal();
  const discovered = Math.max(0, Math.floor(stats.codexDiscoveredCount));

  if (id === 'ach_codex_half') {
    const target = Math.max(1, Math.ceil(roster * 0.5));
    const clamped = Math.min(discovered, target);
    const ratio = target > 0 ? clamped / target : 0;
    let status: DeedStatus;
    if (isUnlocked) status = 'unlocked';
    else if (clamped <= 0) status = 'locked';
    else status = 'in_progress';
    return {
      id,
      status,
      isBinary: false,
      current: isUnlocked ? target : clamped,
      target,
      ratio: isUnlocked ? 1 : ratio,
    };
  }

  const target = Math.max(1, roster);
  const clamped = Math.min(discovered, target);
  const ratio = target > 0 ? clamped / target : 0;
  let status: DeedStatus;
  if (isUnlocked) status = 'unlocked';
  else if (clamped <= 0) status = 'locked';
  else status = 'in_progress';

  return {
    id,
    status,
    isBinary: false,
    current: isUnlocked ? target : clamped,
    target,
    ratio: isUnlocked ? 1 : ratio,
  };
}
