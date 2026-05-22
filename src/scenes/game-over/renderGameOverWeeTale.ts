/**
 * Wee Tale render — single italic prose epitaph closing the run.
 *
 * Sits between the variant / curse chips at the head of the Game
 * Over panel and the weapon-damage / gold / unlock inner panels.
 * The line is picked via the tag-driven `pickWeeTale` from a
 * `WeeTaleContext` built from the payload; seeded determinism
 * comes from a sub-RNG branched off the run seed (so the same run
 * always closes with the same line, even if the scene is destroyed
 * and recreated — e.g. screenshot-back-to-result-screen).
 *
 * The helper resolves boss / source / variant keys to display
 * names through `getEnemyDisplayName` + `formatRunVariantLabel`
 * before substituting into the i18n template, so a template that
 * references `{boss}` reads "Gordon" rather than "gordon".
 *
 * Architectural note: lives in `game-over/` alongside the other
 * row helpers but keeps its Phaser surface minimal — adds one
 * `Phaser.GameObjects.Text` and a fade-in tween. Returns the
 * mounted text object so callers can inspect / dispose if needed
 * (E2E uses this to query the rendered string).
 */
import * as Phaser from 'phaser';
import { COLORS_CSS } from '../../config';
import { textStyle } from '../../ui/typography';
import { t } from '../../core/i18n';
import { createRNG } from '../../utils/rng';
import {
  type WeeTaleContext,
  pickWeeTale,
} from '../../utils/weeTale';
import type { GameOverPayload } from '../gameOverPayload';
import type { VariantKey } from '../../data/variants';
import type { BiomeId } from '../../data/biomes';
import { getEnemyDisplayName } from '../../data/enemies';
import { formatRunVariantLabel, getVariantByKey } from '../../data/variants';

export interface RenderGameOverWeeTaleOpts {
  scene: Phaser.Scene;
  payload: GameOverPayload;
  /** Centre X of the Game Over panel. */
  panelCenterX: number;
  /** Y at which to render the italic prose line. */
  centerY: number;
  /** Max width before Phaser wraps the line. */
  maxWidth: number;
  uiScale: number;
  depth: number;
}

/**
 * Render the wee tale onto the scene. Returns the mounted text
 * object (or `null` if the picker produced no matching template —
 * in production the catalogue's `death` / `victory` fallbacks
 * guarantee a match, so `null` only happens on a deliberate test-
 * mode skip).
 */
export function renderGameOverWeeTale(
  opts: RenderGameOverWeeTaleOpts,
): Phaser.GameObjects.Text | null {
  const { scene, payload, panelCenterX, centerY, maxWidth, uiScale, depth } = opts;

  const ctx = buildWeeTaleContextFromPayload(payload);
  // Seed-deterministic sample: branch a sub-RNG from the run seed
  // so the same run always renders the same line, even across
  // page reloads (the seed is recoverable from the URL share
  // codec) and replay playback. The XOR magic isolates this
  // stream from gameplay RNG so adding / removing a wee-tale
  // template doesn't perturb fight outcomes.
  const seedBase = typeof payload.runSeed === 'number' && Number.isFinite(payload.runSeed)
    ? payload.runSeed
    : 0;
  const rng = createRNG((seedBase ^ 0x57E74A1E) >>> 0);
  const pick = pickWeeTale(ctx, rng.next());
  if (pick === null) return null;

  const params = resolveDisplayNames(pick.params, payload);
  const line = t(pick.i18nKey, params);

  const text = scene.add
    // `subtitle` role is italic by design (FONT_SCALE in
    // `ui/typography.ts`) — no need to override fontStyle.
    .text(panelCenterX, centerY, line, textStyle('subtitle', {
      fontSize: '15px',
      color: COLORS_CSS.DUSTY_TAN,
      align: 'center',
      wordWrap: { width: Math.max(120, Math.floor(maxWidth)) },
    }))
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(depth)
    .setAlpha(0)
    .setScale(uiScale)
    .setData('weeTaleKey', pick.i18nKey);

  scene.tweens.add({ targets: text, alpha: 1, duration: 360, delay: 520 });

  return text;
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
 *
 * Variant key resolves via `formatRunVariantLabel(VariantDef)` so
 * the rendered name matches the variant chip's label exactly.
 */
function resolveDisplayNames(
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
    out.variant = payload.variantLabel.length > 0
      ? payload.variantLabel
      : formatRunVariantLabel(getVariantByKey(params.variant as VariantKey));
  }
  return out;
}
