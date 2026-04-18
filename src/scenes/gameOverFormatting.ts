import { t } from '../core/i18n';
import { EVOLUTION_RECIPES } from '../core/BalanceConfig';
import { WEAPON_DEFS, type WeaponKey } from '../data/weapons';
import { sortedWeaponDamageEntries } from '../systems/RunStatsTracker';
import { getEnemyDisplayName } from '../data/enemies';
import { headlineKeyFor, tipKeyFor, type DeathCause } from '../core/deathCauseClassifier';
import { getVariantByKey, type VariantKey } from '../data/variants';
import type { PostcardLabels, PostcardPayload } from '../utils/postcard';
import type { GameOverPayload } from './gameOverPayload';

import { formatClockTime } from '../utils/formatClockTime';
export { formatClockTime };

/**
 * Inputs for the Game Over "damage by weapon" table — the summary
 * fields it needs are a narrow slice of `GameOverPayload['summary']`.
 * Declared locally so the helper doesn't pull in the full payload
 * type (keeps unit tests independent of scene wiring).
 */
export interface WeaponDamageRowsInput {
  weaponDamage: Record<string, number>;
  enemiesKilled: number;
  timeSurvivedSec: number;
  goldEarned: number;
  maxRows: number;
}

/**
 * Build the multiline "damage by weapon" panel shown on Game Over:
 * header line (kills / time / gold), then up to `maxRows` weapon
 * entries with label / damage / %, with a "+N more" tail if the
 * sorted list overflows. If no weapons dealt damage, a single
 * placeholder line replaces the table body.
 *
 * Pure: all dependencies are module-level imports (i18n, weapon defs,
 * evolution recipes, the sort helper) — no scene/Phaser state.
 */
export function buildWeaponDamageRows(input: WeaponDamageRowsInput): string {
  const entries = sortedWeaponDamageEntries(input.weaponDamage);
  const totalDamage = entries.reduce((sum, e) => sum + e.damage, 0);
  const lines: string[] = [
    t('ui.gameOver.damage_summary', {
      kills: input.enemiesKilled,
      time: formatClockTime(input.timeSurvivedSec),
      gold: input.goldEarned,
    }),
  ];
  if (entries.length === 0) {
    lines.push(t('ui.gameOver.no_weapon_damage'));
    return lines.join('\n');
  }
  const cap = Math.max(0, Math.floor(input.maxRows));
  const evoDisplay = new Map(EVOLUTION_RECIPES.map((r) => [r.evolvedWeapon, t(r.nameKey)]));
  for (const e of entries.slice(0, cap)) {
    const def = WEAPON_DEFS[e.key as WeaponKey];
    const label = (def ? t(def.nameKey) : (evoDisplay.get(e.key) ?? e.key)).slice(0, 18);
    const pct = totalDamage > 0 ? Math.round((e.damage / totalDamage) * 100) : 0;
    lines.push(`${label.padEnd(18, ' ')} ${e.damage.toString().padStart(6, ' ')}   ${pct.toString().padStart(2, ' ')}%`);
  }
  if (entries.length > cap) {
    lines.push(t('ui.gameOver.more_weapons', { count: entries.length - cap }));
  }
  return lines.join('\n');
}

/**
 * Map a GameOverPayload → the PostcardPayload consumed by
 * downloadPostcard. Pure — curseLabel is resolved by the caller
 * (so the helper doesn't depend on curse defs + i18n). Summary
 * is optional-guarded so a corrupted payload doesn't crash the
 * postcard writer (enemiesKilled / timeSurvivedSec → 0).
 */
export function buildPostcardPayloadFromGameOver(
  payload: GameOverPayload,
  curseLabel?: string | null,
): PostcardPayload {
  return {
    mode: payload.mode === 'victory' ? 'victory' : 'death',
    enemiesKilled: payload.summary?.enemiesKilled ?? 0,
    timeSurvivedSec: payload.summary?.timeSurvivedSec ?? 0,
    seedCode: payload.seedCode,
    variantLabel: payload.variantLabel,
    ironmoor: payload.ironmoor,
    postBellSec: payload.postBellSec,
    curseLabel: curseLabel ?? undefined,
    labels: buildPostcardLabels(),
  };
}

/**
 * Resolve locale-aware postcard labels through `t()`. Called at render
 * time so a mid-run locale switch reflects in the next save — the
 * labels object is read once per download, not cached at boot.
 */
export function buildPostcardLabels(): PostcardLabels {
  return {
    time: t('ui.gameOver.postcard_time_label'),
    kills: t('ui.gameOver.postcard_kills_label'),
    seed: t('ui.gameOver.postcard_seed_label'),
    victory: t('ui.gameOver.postcard_outcome_victory'),
    fell: t('ui.gameOver.postcard_outcome_fell'),
    ironmoor: t('ui.gameOver.postcard_ironmoor_tag'),
    pastBell: (clock) => t('ui.gameOver.postcard_past_bell', { clock }),
    curseTag: (curse) => t('ui.gameOver.postcard_curse_tag', { curse }),
  };
}

/**
 * Label for the "↻ same seed" link on Game Over. Matches the
 * chronicle rerun tooltip: when a curse was active, the label calls
 * it out so players know the rerun will re-apply the curse. `curseLabel`
 * is the already-i18n-resolved display name (scene reads `t(curseDef.nameKey)`).
 */
export function formatRerunSeedLinkLabel(curseLabel?: string | null): string {
  if (curseLabel && curseLabel.length > 0) {
    return t('ui.gameOver.rerun_same_seed_with_curse', { curse: curseLabel });
  }
  return t('ui.gameOver.rerun_same_seed');
}

/**
 * Leading label for the Game Over seed readout — picks the daily /
 * normal copy variant. Scene appends the copy-hint tail separately.
 */
export function formatSeedReadoutLabel(code: string, isDaily: boolean): string {
  return isDaily
    ? t('ui.gameOver.seed_daily', { code })
    : t('ui.gameOver.seed_normal', { code });
}

/**
 * Heading text + colour for the Game Over "new variant unlocked" /
 * "next-run tip" panel. Three states:
 *   - no unlocks          → blue "next tip" heading
 *   - exactly one unlock  → green "unlock_single" heading
 *   - 2+ unlocks          → green "unlock_multi" heading
 */
export interface UnlockHeading {
  text: string;
  color: string;
}

export function resolveUnlockHeading(variantKeys: readonly VariantKey[]): UnlockHeading {
  const hasUnlocks = variantKeys.length > 0;
  if (!hasUnlocks) {
    return { text: t('ui.gameOver.next_tip'), color: '#8aa4d7' };
  }
  const text = variantKeys.length === 1
    ? t('ui.gameOver.unlock_single')
    : t('ui.gameOver.unlock_multi');
  return { text, color: '#77c977' };
}

/**
 * Body text for the unlock list panel. Returns null when there is a
 * single unlock (the scene renders the variant name + flavour
 * separately in that case) or when there are zero unlocks.
 * 2 variants render on separate lines; 3+ render as a bulleted list.
 */
export function formatUnlockBodyText(variantKeys: readonly VariantKey[]): string | null {
  if (variantKeys.length < 2) return null;
  const names = variantKeys.map((k) => t(getVariantByKey(k).nameKey));
  if (variantKeys.length === 2) {
    return names.join('\n');
  }
  return names.map((n) => `- ${n}`).join('\n');
}

/**
 * Build the italic death-insight line — "{headline} — {tip}" — shown
 * under the Game Over title. The classifier picks the tag; the scene
 * then asks this helper to render the blend. `{source}` in the
 * headline is interpolated with a display-name-resolved enemy label
 * when the classifier identified one, else the voice-appropriate
 * fallback "something".
 */
export function formatDeathInsightLine(cause: DeathCause): string {
  const sourceLabel = cause.sourceKey ? getEnemyDisplayName(cause.sourceKey) : 'something';
  const headline = t(headlineKeyFor(cause), { source: sourceLabel });
  const tip = t(tipKeyFor(cause));
  return `${headline} — ${tip}`;
}

/**
 * Trim a loadout summary string to at most `maxDetailLines` non-empty
 * lines and, if anything was dropped, append a "+N more" i18n line.
 * Pure: only reads `t('ui.gameOver.more_weapons', …)` via the module
 * i18n singleton.
 *
 * Used by the Game Over panel to keep the loadout block from pushing
 * action buttons off-screen on dense runs.
 */
export function boundedLoadoutSummary(rawSummary: string, maxDetailLines: number): string {
  const detailLines = rawSummary
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const capped = Math.max(0, Math.floor(maxDetailLines));
  const visible = detailLines.slice(0, capped);
  if (detailLines.length > capped) {
    visible.push(t('ui.gameOver.more_weapons', { count: detailLines.length - capped }));
  }
  return visible.join('\n');
}

export interface GoldBreakdownInput {
  timeSurvivedSec: number;
  enemiesKilled: number;
  bossGold: number;
  coinGold: number;
  /** Matches `RunSummary.goldMult` / `computeGoldReward` — breakdown lines sum to earned gold. */
  goldMult?: number;
}

/**
 * Integer breakdown lines that sum to the same total as `computeGoldReward` in `utils/save.ts`
 * (single floor on the full base × multiplier — not independent floors per line).
 */
export function computeGoldBreakdown(input: GoldBreakdownInput): {
  timeGold: number;
  killGold: number;
  bossGold: number;
  coinGold: number;
  total: number;
} {
  const mult =
    input.goldMult != null && Number.isFinite(input.goldMult) && input.goldMult > 0
      ? input.goldMult
      : 1;
  // Align with `normalizeRunSummary` in `utils/save.ts` (rounded seconds, integer kills/gold).
  const tSec = Math.max(0, Math.round(input.timeSurvivedSec));
  const kCulls = Math.max(0, Math.floor(input.enemiesKilled));
  const rawTime = tSec * 0.4;
  const rawKill = kCulls * 0.4;
  const rawBoss = Math.max(0, Math.floor(input.bossGold));
  const rawCoin = Math.max(0, Math.floor(input.coinGold));
  const base = rawTime + rawKill + rawBoss + rawCoin;
  const total = Math.floor(base * mult);
  if (total <= 0) {
    return { timeGold: 0, killGold: 0, bossGold: 0, coinGold: 0, total: 0 };
  }
  if (base <= 0) {
    return { timeGold: 0, killGold: 0, bossGold: 0, coinGold: 0, total };
  }
  const raw = [rawTime, rawKill, rawBoss, rawCoin];
  const targets = raw.map((r) => (r / base) * total);
  const floors = targets.map((t) => Math.floor(t));
  const rem = total - (floors[0] + floors[1] + floors[2] + floors[3]);
  const order = [0, 1, 2, 3].sort((i, j) => {
    const fi = targets[i] - floors[i];
    const fj = targets[j] - floors[j];
    return fj - fi;
  });
  const out = [...floors];
  for (let k = 0; k < rem; k++) {
    out[order[k]]++;
  }
  return {
    timeGold: out[0],
    killGold: out[1],
    bossGold: out[2],
    coinGold: out[3],
    total,
  };
}
