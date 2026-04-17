import { t } from '../core/i18n';
import { EVOLUTION_RECIPES } from '../core/BalanceConfig';
import { WEAPON_DEFS, type WeaponKey } from '../data/weapons';
import { sortedWeaponDamageEntries } from '../systems/RunStatsTracker';
import { getEnemyDisplayName } from '../data/enemies';
import { headlineKeyFor, tipKeyFor, type DeathCause } from '../core/deathCauseClassifier';

export function formatClockTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = Math.floor(safeSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

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
    const label = (def?.name ?? evoDisplay.get(e.key) ?? e.key).slice(0, 18);
    const pct = totalDamage > 0 ? Math.round((e.damage / totalDamage) * 100) : 0;
    lines.push(`${label.padEnd(18, ' ')} ${e.damage.toString().padStart(6, ' ')}   ${pct.toString().padStart(2, ' ')}%`);
  }
  if (entries.length > cap) {
    lines.push(t('ui.gameOver.more_weapons', { count: entries.length - cap }));
  }
  return lines.join('\n');
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
