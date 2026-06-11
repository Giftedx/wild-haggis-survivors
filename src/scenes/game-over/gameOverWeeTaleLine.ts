/**
 * Pure Wee Tale line composition for the Game Over footer.
 *
 * Kept separate from `renderGameOverWeeTale.ts` so node-env unit tests can
 * lock seeded determinism, locale resolution, and raw-key scrubbing without
 * importing Phaser at module evaluation time.
 */
import { t } from '../../core/i18n';
import { getEnemyDisplayName } from '../../data/enemies';
import { formatRunVariantLabel, getVariantByKey } from '../../data/variants';
import type { VariantKey } from '../../data/variants';
import type { BiomeId } from '../../data/biomes';
import { createRNG } from '../../utils/rng';
import { pickWeeTale, type WeeTaleContext } from '../../utils/weeTale';
import type { GameOverPayload } from '../gameOverPayload';

export interface GameOverWeeTaleLine {
  readonly i18nKey: string;
  readonly line: string;
}

/**
 * Compose the deterministic footer line for a Game Over payload.
 * Returns null only if the Wee Tale catalogue has no matching template.
 */
export function buildGameOverWeeTaleLine(payload: GameOverPayload): GameOverWeeTaleLine | null {
  const ctx = buildWeeTaleContextFromPayload(payload);
  // Branch a sub-RNG from the run seed so the same run always renders the
  // same closing line while keeping this stream isolated from gameplay RNG.
  const seedBase = typeof payload.runSeed === 'number' && Number.isFinite(payload.runSeed)
    ? payload.runSeed
    : 0;
  const rng = createRNG((seedBase ^ 0x57E74A1E) >>> 0);
  const pick = pickWeeTale(ctx, rng.next());
  if (pick === null) return null;

  const params = resolveWeeTaleDisplayNames(pick.params, payload);
  return {
    i18nKey: pick.i18nKey,
    line: t(pick.i18nKey, params),
  };
}

/**
 * Build the `WeeTaleContext` from a `GameOverPayload`. Defensive:
 * any field the payload omits (legacy save, mid-run crash before
 * the composer wrote it) collapses to the safe default that the
 * picker handles gracefully. Test mocks can pass a stripped payload
 * and still get a valid context.
 */
export function buildWeeTaleContextFromPayload(payload: GameOverPayload): WeeTaleContext {
  return {
    mode: payload.mode,
    variantKey: (payload.variantKey ?? 'classic') as VariantKey,
    timeSurvivedSec: payload.summary?.timeSurvivedSec ?? 0,
    bossesKilled: payload.bossKilledKeys ?? [],
    deathSourceKey: payload.deathCause?.sourceKey ?? undefined,
    routes: [], // Route LABELS are on the payload (already i18n-resolved); the
                // picker only needs route presence at the umbrella level,
                // not key strings. Pass empty for now — extend if route-tag
                // templates ever land.
    relics: [],
    biomes: (payload.biomesVisited ?? []) as readonly BiomeId[],
    ironmoor: payload.ironmoor === true,
    curseKey: payload.curseKey,
    postBellSec: payload.postBellSec,
    // v2 — thread the run name through so the picker can route to
    // variant-voiced `{name}`-bearing templates. Empty / missing on
    // legacy saves; the picker's `has_name` tag gate handles that.
    runName: payload.name ?? undefined,
  };
}

/**
 * Translate the raw enemy / variant *keys* in the picker's params
 * to human display names so the rendered template reads "Gordon"
 * not "gordon". The picker stays key-only (i18n-agnostic); display
 * name resolution belongs here at the scene layer.
 */
export function resolveWeeTaleDisplayNames(
  params: Readonly<Record<string, string | number>>,
  payload: GameOverPayload,
): Record<string, string | number> {
  const out: Record<string, string | number> = { ...params };
  if (typeof params.boss === 'string') {
    out.boss = getEnemyDisplayName(params.boss);
  }
  if (typeof params.source === 'string') {
    out.source = getEnemyDisplayName(params.source);
  }
  if (typeof params.variant === 'string') {
    // Prefer the already-rendered variantLabel from the payload (matches
    // the chip exactly); fall back to a fresh resolution if the
    // payload lost the label.
    const variantLabel = payload.variantLabel ?? '';
    out.variant = variantLabel.length > 0
      ? variantLabel
      : formatRunVariantLabel(getVariantByKey(params.variant as VariantKey));
  }
  return out;
}
