/**
 * Pure helper for `GameScene.init(data)` input parsing.
 *
 * Extracted so the init-data contract is testable without booting
 * Phaser — the real `init()` just forwards to this function and assigns
 * the returned fields onto `this`. Keeps the GameScene class free of
 * untestable parsing logic, per the node-env vitest gotcha documented
 * in CLAUDE.md.
 */
import { isReplayBlob, type ReplayBlob } from '../replay/replayBlob';

/** Shape of `scene.start('Game', data)` payload. */
export interface GameSceneInitDataInput {
  seed?: number | null;
  isDaily?: boolean;
  forceVariantKey?: string;
  replay?: ReplayBlob;
}

/**
 * Canonical resolved form — every field is either a validated value or
 * `null` / `false`. No `undefined` leaks through.
 */
export interface ResolvedGameSceneInit {
  pendingRunSeed: number | null;
  runIsDaily: boolean;
  pendingForceVariantKey: string | null;
  pendingReplay: ReplayBlob | null;
}

/**
 * Parse + validate the init payload.
 *
 * Precedence: a valid `replay` blob wins. Its `seed` + `variantKey`
 * override any `seed` / `forceVariantKey` the caller also passed (they
 * would be inconsistent otherwise — the blob captured what was live).
 * Daily mode is forced off during playback so the per-day challenge
 * record isn't polluted with replay attempts.
 *
 * Malformed `replay` is dropped (treated as absent), and the rest of
 * the payload stands. This keeps a stale or ill-formed blob from
 * crashing the scene launch.
 */
export function parseGameSceneInitData(
  data?: GameSceneInitDataInput,
): ResolvedGameSceneInit {
  const base: ResolvedGameSceneInit = {
    pendingRunSeed: typeof data?.seed === 'number' ? data.seed : null,
    runIsDaily: Boolean(data?.isDaily),
    pendingForceVariantKey:
      typeof data?.forceVariantKey === 'string' ? data.forceVariantKey : null,
    pendingReplay: null,
  };

  if (data?.replay && isReplayBlob(data.replay)) {
    base.pendingReplay = data.replay;
    base.pendingRunSeed = data.replay.seed;
    base.pendingForceVariantKey = data.replay.variantKey;
    base.runIsDaily = false;
  }

  return base;
}
