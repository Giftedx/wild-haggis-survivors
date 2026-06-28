/**
 * buildCairnSystemHooks — assembles the deps bag passed to
 * {@link installCairnSystems} (CairnStackingScheduler +
 * CairnOfEchoesScheduler) from `GameScene.create()`.
 *
 * Why extract: ~33 LOC including the cairn-boon-picker launch closure.
 * Pulling it into a sibling builder shrinks the scene class without
 * changing behaviour.
 *
 * Unlike the pure-`scene` builders, this bag reads two `create()` locals
 * (`resumeRun`, `replayCairns`) that are not scene fields, so they are
 * threaded in as an explicit second argument rather than re-derived —
 * keeping the resume-snapshot + replay-cairn semantics byte-identical.
 *
 * Why type-couple to GameScene (precedent: `buildCombatCollisionHooks`):
 * the bag reads private methods (handleCairnWalkOver, spawnCairnSprite,
 * destroyCairnSprite). A type-only `import type { GameScene }` keeps the
 * wiring honest without a runtime import cycle.
 */
import type { GameScene } from '../GameScene';
import type { InstallCairnSystemsDeps } from './installCairnSystems';
import type { IRunState } from '../../core/SaveManager';
import type { FallenCairn } from '../../utils/save/fallenCairns';
import { CairnBoonPickerScene } from '../CairnBoonPickerScene';

/** The two `create()` locals the cairn deps bag closes over. */
export interface CairnSystemHookLocals {
  readonly resumeRun: IRunState | null;
  readonly replayCairns: FallenCairn[] | null;
}

/**
 * Build the {@link InstallCairnSystemsDeps} bag for the given scene.
 *
 * Fresh object — no caching. Built once per `create()` alongside the
 * `installCairnSystems(...)` call.
 */
export function buildCairnSystemHooks(
  scene: GameScene,
  { resumeRun, replayCairns }: CairnSystemHookLocals,
): InstallCairnSystemsDeps {
  return {
    getRng: () => scene.runRng,
    getPlayer: () => scene.player,
    getVictoryPending: () => scene.runScore.victoryPending,
    getJuice: () => scene.juice,
    getBanter: () => scene.banter,
    spawnCairnStone: (onCollect, onExpired) => {
      scene.pickupSpawner.spawnCairnStone(onCollect, onExpired);
    },
    caption: (id, msg, tint, dur) => scene.caption(id, msg, tint, dur),
    openCairnBoonPicker: (options, onPick) => {
      scene.timeManager.request('CAIRN_BOON', { pausePhysics: true, timeScale: 0 });
      scene.scene.launch(CairnBoonPickerScene.KEY, {
        options,
        onPick: (id: Parameters<typeof onPick>[0]) => {
          scene.timeManager.release('CAIRN_BOON');
          onPick(id);
        },
      });
    },
    cairnResume: resumeRun ? {
      stoneCount: resumeRun.cairnStackCount ?? 0,
      spawnedCount: resumeRun.cairnSpawnedCount ?? 0,
      nextSpawnAtSec: resumeRun.cairnNextSpawnAtSec,
    } : null,
    getCairns: () =>
      replayCairns !== null ? replayCairns : scene.metaSaveManager.getFallenCairns(),
    getRngSample: () => scene.runRng.next(),
    getOldDroverRevealedCount: () => scene.metaSaveManager.getOldDroverRevealedCount(),
    onWalkOver: ({ cairn, whisper }) => scene.handleCairnWalkOver(cairn, whisper),
    onSpriteCreate: (cairn) => scene.spawnCairnSprite(cairn),
    onSpriteDestroy: (cairn) => scene.destroyCairnSprite(cairn),
  };
}
