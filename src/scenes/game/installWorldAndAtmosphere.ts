/**
 * installWorldAndAtmosphere — `GameScene.create()` phase 1.
 *
 * Builds the static world + atmospheric layers in the exact order the
 * inline block used: world bounds → Highland terrain → haar fog →
 * biome partition → world dressing → rune-pulse RNG branch → run
 * lifecycle reset → captions → banter reset.
 *
 * Why extract: `create()` was a ~900-line monolith. Splitting it into
 * ordered phase installers (this is the first) makes the run-start
 * sequence legible and shrinks the scene class toward the facade target.
 * Behaviour is identical: the block is called at the same point in
 * `create()`, performs the same field writes, and — critically — keeps
 * the same `runRng.branch()` ordering (biome branch, then world-dressing
 * internal branches, then the rune-pulse branch) so replay determinism
 * (ADR-0002) is byte-for-byte preserved.
 *
 * Why type-couple to GameScene (precedent: `buildCombatCollisionHooks`):
 * the phase writes many scene fields (haarFog, biomeController,
 * floraScatter, wildlifeSystem, mistLayer, runePulseRng, captionOverlay)
 * outside any sub-system's public surface. A type-only
 * `import type { GameScene }` keeps the wiring honest without a runtime
 * import cycle.
 */
import { GAME } from '../../config';
import type { GameScene } from '../GameScene';
import { createHighlandTerrain } from './highlandTerrain';
import { installHaarFog, handleBiomeEnteredForHaar } from './haarFogInstall';
import { BiomeController } from './BiomeController';
import { installWorldDressing } from './installWorldDressing';
import { CaptionManager } from '../../systems/a11y/CaptionManager';
import { CaptionOverlay } from '../../systems/a11y/CaptionOverlay';

/** Run `create()` phase 1: static world + atmosphere. */
export function installWorldAndAtmosphere(scene: GameScene): void {
  // Set world bounds
  scene.physics.world.setBounds(0, 0, GAME.WORLD_WIDTH, GAME.WORLD_HEIGHT);

  // Draw the Highland ground
  createHighlandTerrain(scene);

  // F1 M5 — attach a persistent HaarFogController to the main camera so
  // biome-driven ambient fog can live across the whole run. WebGL-only;
  // Canvas silently runs without haar.
  scene.haarFog = installHaarFog(scene);

  // Biome partition — voronoi regions seeded from the run RNG.
  // Owns manager, renderer, entry-toast state, and player-modifier push.
  scene.biomeController?.destroy();
  scene.postBellLastReseedSec = -1;
  scene.biomeController = new BiomeController(
    scene,
    scene.runRng.branch(),
    GAME.WORLD_WIDTH,
    GAME.WORLD_HEIGHT,
    { onBiomeEnter: (biome) => handleBiomeEnteredForHaar(scene, scene.haarFog, biome) },
  );
  // World dressing — decorations + atmospheric mist.
  const dressing = installWorldDressing({
    scene,
    biomeManager: scene.getBiomeManager(),
    runRng: scene.runRng,
    worldWidth: GAME.WORLD_WIDTH,
    worldHeight: GAME.WORLD_HEIGHT,
    reduceParticles: scene.settingsManager.load().reduceParticles,
    prior: {
      floraScatter: scene.floraScatter,
      wildlifeSystem: scene.wildlifeSystem,
      mistLayer: scene.mistLayer,
    },
  });
  scene.floraScatter = dressing.floraScatter;
  scene.wildlifeSystem = dressing.wildlifeSystem;
  scene.mistLayer = dressing.mistLayer;

  // Rune-pulse RNG — branched after world-dressing branches so the
  // mist/flora/wildlife sub-seeds keep their pre-2026-04-29 values.
  scene.runePulseRng = scene.runRng.branch();

  // Post-Bell + key handler live on RunLifecycle — reset on every scene
  // create since Phaser reuses scene instances across runs.
  scene.runLifecycle?.reset();

  // Captions — render regardless of whether the setting is enabled so
  // runtime toggling works; CaptionOverlay checks the flag per frame.
  scene.captionOverlay?.destroy();
  scene.captionManager = new CaptionManager();
  scene.captionOverlay = new CaptionOverlay(scene, scene.captionManager);

  // Banter — initialised lazily so juice/caption are wired up first. The
  // wiring happens after JuiceSystem is constructed (search for "this.juice = new").
  scene.banter?.reset();
}
