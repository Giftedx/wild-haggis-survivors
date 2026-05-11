/**
 * Pure helper for `GameScene.init(data)` input parsing.
 *
 * Extracted so the init-data contract is testable without booting
 * Phaser — the real `init()` just forwards to this function and assigns
 * the returned fields onto `this`. Keeps the GameScene class free of
 * untestable parsing logic, per the node-env vitest gotcha documented
 * in CLAUDE.md.
 */
import { isReplayBlobAny, type ReplayBlobAny } from '../replay/replayBlob';
import type { SharedRunSetup } from '../utils/sharedRunUrl';

/**
 * Validate the raw `pickedSporranIds` payload. Accepts a list of
 * non-empty strings; coerces empty lists / non-arrays / non-string
 * entries away. Returns `null` on any rejection so consumers can
 * branch on a single shape (`null` = no Sporran picks).
 */
function parseSporranIds(
  raw: readonly string[] | null | undefined,
): readonly string[] | null {
  if (!Array.isArray(raw)) return null;
  const cleaned = raw.filter(
    (id): id is string => typeof id === 'string' && id.length > 0,
  );
  return cleaned.length > 0 ? cleaned : null;
}

/** Shape of `scene.start('Game', data)` payload. */
export interface GameSceneInitDataInput {
  seed?: number | null;
  isDaily?: boolean;
  forceVariantKey?: string;
  replay?: ReplayBlobAny;
  /**
   * T303 — curse selection passed via scene data (replaces the
   * pre-removal `pendingCurseKey` module singleton). `null` or absent
   * means a clean run. Replay blobs carrying their own `curseKey`
   * override this value (the replay is the source of truth for what
   * was live at record-time).
   */
  curseKey?: string | null;
  /**
   * S1 Phase 1 — Sporran Deck picks (3 of 7 drawn cards) handed off
   * by `SporranScene`. The IDs reference cards in `ALL_SPORRAN_CARDS`;
   * unknown IDs are silently skipped at apply time. `null`, absent, or
   * an empty array means the player took the Curse / clean-run path
   * instead. Replay blobs (v3 from Phase 2 onward) carry their own
   * picks and override the caller-passed list during playback so the
   * recorded run reproduces with byte-identical pre-spawn modifier
   * deltas.
   */
  pickedSporranIds?: readonly string[] | null;
  /**
   * W82 Shared-run URL — present when the run was launched from a
   * `?run=<seed>&v=<variant>&c=<curse>` deep link (BootScene parses the
   * URL, GameScene shows the welcome banner). Decoupled from the
   * other init fields so the seed / variant / curse pipeline doesn't
   * need a special branch.
   */
  sharedRunMeta?: SharedRunSetup | null;
}

/**
 * Canonical resolved form — every field is either a validated value or
 * `null` / `false`. No `undefined` leaks through.
 */
export interface ResolvedGameSceneInit {
  pendingRunSeed: number | null;
  runIsDaily: boolean;
  pendingForceVariantKey: string | null;
  pendingReplay: ReplayBlobAny | null;
  /** T303 — resolved curse key (string) or null for a clean run. */
  pendingCurseKey: string | null;
  /**
   * S1 Phase 1 — Sporran Deck picks (3 of 7 drawn cards). `null` if
   * the run did not go through the Sporran path. Empty array is
   * canonicalised to `null` so consumers can branch on a single shape.
   */
  pendingSporranIds: readonly string[] | null;
  /**
   * W82 Shared-run URL — populated when launched from a deep link;
   * GameScene reads this to show the "Shared run loaded · <variant> ·
   * <curse>" banner on run start. `null` for normal runs.
   */
  pendingSharedRunMeta: SharedRunSetup | null;
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
    pendingCurseKey:
      typeof data?.curseKey === 'string' && data.curseKey.length > 0
        ? data.curseKey
        : null,
    pendingSporranIds: parseSporranIds(data?.pickedSporranIds),
    // Shared-run banner — opaque metadata, presence-only flag. Replay
    // playback paths (below) clear it because a replay was never
    // launched by a shared URL.
    pendingSharedRunMeta: data?.sharedRunMeta ?? null,
  };

  if (data?.replay && isReplayBlobAny(data.replay)) {
    base.pendingReplay = data.replay;
    base.pendingRunSeed = data.replay.seed;
    base.pendingForceVariantKey = data.replay.variantKey;
    base.runIsDaily = false;
    // Replay carries its own curseKey when v2+ recorded one. That always
    // overrides anything the caller stamped on the init payload — the
    // replay must reproduce the run that was actually recorded.
    const blob = data.replay as { curseKey?: unknown; sporranPicks?: unknown };
    base.pendingCurseKey =
      typeof blob.curseKey === 'string' && blob.curseKey.length > 0
        ? blob.curseKey
        : null;
    // S1 Phase 2 — replay-side pick replay. v3+ blobs may carry the
    // recorded sporran picks; if present, override the caller-passed
    // list so the replayed run lands the same RunModifiers deltas +
    // post-spawn heal / damage-mult. v1 / v2 blobs (and v3 blobs from
    // before Phase 2 shipped) lack the field — the override no-ops and
    // the caller-passed list (or null) wins.
    base.pendingSporranIds = parseSporranIds(
      Array.isArray(blob.sporranPicks)
        ? (blob.sporranPicks as readonly string[])
        : (data.pickedSporranIds ?? null),
    );
    // A replay is internal playback — never a shared run, even if the
    // caller (Chronicle) somehow stamped both fields. Keep the banner
    // off so the replay HUD reads cleanly.
    base.pendingSharedRunMeta = null;
  }

  return base;
}
