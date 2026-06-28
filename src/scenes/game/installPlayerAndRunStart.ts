/**
 * installPlayerAndRunStart — `GameScene.create()` phase 2.
 *
 * Resolves the active variant, installs the T1 replay bridge, applies
 * the curse + sporran + seasonal run-start modifier plans, constructs
 * the Player at the resume/centre spawn, and runs the post-spawn
 * blessing pipeline — in the exact order the inline block used.
 *
 * Why extract: this was the densest stretch of `create()` (~155 LOC of
 * interleaved variant / replay / curse / sporran / seasonal / player
 * wiring). Pulling it into an ordered phase installer makes the run-start
 * sequence legible and shrinks the scene class toward the facade target.
 * Behaviour is identical: same call order, same field writes, same RNG
 * consumption (`buildSeasonalRunStartPlan` advances `runRng` at the same
 * point; `installReplayRecording` reads `runRng.seed`) so replay
 * determinism (ADR-0002) is byte-for-byte preserved.
 *
 * The three values the rest of `create()` needs downstream
 * (`selectedVariant`, `spawnPx`, `spawnPy`) are returned rather than
 * stashed on the scene, mirroring the original locals.
 *
 * Why type-couple to GameScene (precedent: `buildCombatCollisionHooks`):
 * the phase reads + writes many scene fields outside any sub-system's
 * public surface. A type-only `import type { GameScene }` keeps the
 * wiring honest without a runtime import cycle.
 */
import * as Phaser from 'phaser';
import { GAME } from '../../config';
import type { GameScene } from '../GameScene';
import type { SaveData } from '../../utils/save/types';
import type { IRunState } from '../../core/SaveManager';
import { getVariantByKey, type VariantDef } from '../../data/variants';
import { ensureVariantAtlas } from '../boot/variantAtlasBaker';
import { installReplayPlayback, installReplayRecording } from './replayBridgeInstall';
import { resolveReplayMode } from '../../replay/replayConfig';
import { applyAssistGameSpeedToken } from '../../systems/accessibility/assistGameSpeed';
import { getAssistModeGameSpeed } from '../../systems/accessibility/AssistMode';
import { StatComposer } from '../../core/StatComposer';
import { applyCurseAndComposeStats } from './applyCurseAndComposeStats';
import { applySporranRunStartPostSpawn, buildSporranRunStartPlan } from './sporranRunStart';
import { applySeasonalRunStartPostSpawn, buildSeasonalRunStartPlan } from './seasonalRunStart';
import { Player } from '../../entities/Player';
import { registerDebugHotkeys } from '../dev/debugHotkeys';
import { t } from '../../core/i18n';

/** The `create()` locals phase 2 produces for later phases. */
export interface PlayerAndRunStartResult {
  readonly selectedVariant: VariantDef;
  readonly spawnPx: number;
  readonly spawnPy: number;
}

/** Run `create()` phase 2: variant + replay + curse + player + run-start. */
export function installPlayerAndRunStart(
  scene: GameScene,
  { save, resumeRun }: { save: SaveData; resumeRun: IRunState | null },
): PlayerAndRunStartResult {
  // Create the player (resume position) or world center.
  // Seeded / daily runs can override the saved variant so all players
  // face the same starting conditions — required for fair leaderboards
  // and shareable seeds. Override is ignored when resuming a run.
  const selectedVariant = resumeRun
    ? getVariantByKey(resumeRun.selectedVariantKey)
    : getVariantByKey(scene.pendingForceVariantKey ?? save.selectedVariant);
  scene.pendingForceVariantKey = null;
  scene.activeVariant = selectedVariant;

  // ADR-0005 lazy-bake descope (2026-05-11): BootScene only warms the
  // default + saved variants. If the active variant is neither (replay
  // playback of a non-default seed, daily challenge, /forceVariant
  // debug path), bake the atlas now — idempotent, ~13ms per cold
  // variant, well under the run-start budget. AnimationController
  // calls `sprite.setTexture(atlasKey(...))` during Player
  // construction below, so the cache MUST be warm before then.
  ensureVariantAtlas(scene, selectedVariant.key);

  // T1 replay — mutually exclusive modes (playback wins over record).
  // Slice in `replayBridgeInstall.ts`; recorder build deferred below
  // so the v2 meta captures the live curse + composed stats.
  scene.replayRecorder = null;
  const { replayMode, replayInput, playbackV2, consumePending } =
    installReplayPlayback({
      pendingReplay: scene.pendingReplay,
      resolvedMode: resolveReplayMode(),
    });
  scene.replayInput = replayInput;
  if (consumePending) scene.pendingReplay = null;
  applyAssistGameSpeedToken(scene.timeManager, {
    speed: getAssistModeGameSpeed(),
    replayMode,
  });

  const metaSave = scene.metaSaveManager.load();
  const baseStats = StatComposer.getPlayerStats(metaSave);

  // T303 + T1 v2 — curse application + composedStats derivation.
  // Slice in `applyCurseAndComposeStats.ts`. Resolution rules
  // (precedence, resume/daily gates, replay-determinism override)
  // live in the helper; this call site only owns the field
  // assignments + the consume-once null-out for `pendingCurseKey`.
  const curseResult = applyCurseAndComposeStats({
    pendingCurseKey: scene.pendingCurseKey,
    resumeRun: !!resumeRun,
    runIsDaily: scene.runIsDaily,
    playbackV2,
    baseStats,
  });
  if (curseResult.consumePending) scene.pendingCurseKey = null;
  scene.runModifiers = curseResult.runModifiers;
  scene.activeCurseKey = curseResult.activeCurseKey;
  const composedStats = curseResult.composedStats;

  // S1 Phase 1 — Sporran Deck picks. Mutates the modifier bag in
  // place BEFORE seasonal so first-footing / blessing layering still
  // multiplies on top of any sporran curse penalties + boons. The
  // post-spawn heal lands alongside the seasonal heal pipeline below.
  // Resumed runs short-circuit: the picks were already absorbed at
  // the original run-start.
  const sporranRunStart = buildSporranRunStartPlan({
    resumeRun: !!resumeRun,
    pickedSporranIds: scene.pendingSporranIds,
    runModifiers: scene.runModifiers,
  });
  scene.pendingSporranIds = null;
  // Snapshot what actually applied (stale-id filtered) so the replay
  // recorder + run-history recorder both pull from the same source
  // of truth — see field doc above.
  scene.committedSporranIds = sporranRunStart.appliedIds;

  // Seasonal run-start hooks. Modifier-bag deltas apply now, before
  // systems snapshot the bag; post-spawn heal/player bonuses/toast
  // apply after Player construction below.
  const seasonalRunStart = buildSeasonalRunStartPlan({
    resumeRun: !!resumeRun,
    disableSeasonalEvents: scene.settingsManager.load().disableSeasonalEvents,
    now: new Date(),
    runRng: scene.runRng,
    runModifiers: scene.runModifiers,
  });

  // T1 Phase 3 — recorder construction + route-queue seeding. Slice in
  // `replayBridgeInstall.ts`; built here so the v2 blob captures the
  // live curse + composed stats. `pushRoute` is fed from the Moor
  // Road resolver further down (search: `runActState.recordPick`).
  ({
    replayRecorder: scene.replayRecorder,
    pendingReplayRoutes: scene.pendingReplayRoutes,
  } = installReplayRecording({
    replayMode,
    playbackV2,
    seed: scene.runRng.seed,
    variantKey: selectedVariant.key,
    build: import.meta.env.PROD ? 'whs-prod' : 'whs-dev',
    curseKey: scene.activeCurseKey,
    composedStats,
    sporranPicks: scene.committedSporranIds,
    // The Moor Remembers (spec 2026-05-22) — snapshot meta-save
    // cairns at run-start so replay reproduces the same moor even
    // after live FIFO rotation. Reads the same source as the live
    // CairnOfEchoesScheduler.load() path (consistent with T1).
    cairns: scene.metaSaveManager.getFallenCairns(),
  }));
  const spawnPx = resumeRun
    ? Phaser.Math.Clamp(resumeRun.playerX, 40, GAME.WORLD_WIDTH - 40)
    : GAME.WORLD_WIDTH / 2;
  const spawnPy = resumeRun
    ? Phaser.Math.Clamp(resumeRun.playerY, 40, GAME.WORLD_HEIGHT - 40)
    : GAME.WORLD_HEIGHT / 2;
  scene.player = new Player(
    scene,
    spawnPx,
    spawnPy,
    selectedVariant.textureKey,
    scene.timeManager,
    composedStats,
    scene.replayInput ?? undefined,
  );
  // U1 M4 — give Player live access to the run's rune effect bag so
  // getMaxHp / getDamageMultiplier / getXpMultiplier / getCritChance
  // / getLuckDrawBonus / getMoveSpeed fold the bag at read time. The
  // accessor returns the *current* bag so a per-run reset (`runeBag =
  // createRuneEffectBag()` above) is picked up without re-wiring.
  scene.player.setRuneBagAccessor(() => scene.runeBag);
  registerDebugHotkeys(scene, {
    getPlayer: () => scene.player,
    getScene: () => scene,
  });

  // S1 Phase 1 + 1.5 — Sporran Deck post-spawn. Heal +
  // damage-multiplier (the latter for `quirk_haggis_blooded`).
  // Damage-mult lives Player-side; the addDamageMultiplier hook
  // mirrors the seasonal pipeline.
  applySporranRunStartPostSpawn(sporranRunStart, {
    heal: (amount) => scene.player.heal(amount),
    addDamageMultiplier: (amount) => scene.player.addDamageMultiplier(amount),
  });

  // Seasonal post-spawn application. Toast is delayed so it lands
  // after the run-start ceremony settles into the HUD.
  applySeasonalRunStartPostSpawn(seasonalRunStart, {
    heal: (amount) => scene.player.heal(amount),
    addXpMultiplier: (amount) => scene.player.addXpMultiplier(amount),
    addCritChance: (amount) => scene.player.addCritChance(amount),
    addLifesteal: (amount) => scene.player.addLifesteal(amount),
    addAoeMultiplier: (amount) => scene.player.addAoeMultiplier(amount),
    addPickupRadius: (amount) => scene.player.addPickupRadius(amount),
    addCritDamageMultiplier: (amount) => scene.player.addCritDamageMultiplier(amount),
    addDamageMultiplier: (amount) => scene.player.addDamageMultiplier(amount),
    addMaxHp: (amount) => scene.player.addMaxHp(amount),
    showToastAfter: (delayMs, key, color) => {
      scene.time.delayedCall(delayMs, () => {
        if (!scene.scene.isActive('Game')) return;
        scene.juice.showToast(t(key), color);
      });
    },
  });

  return { selectedVariant, spawnPx, spawnPy };
}
