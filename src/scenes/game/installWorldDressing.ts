/**
 * installWorldDressing — Phase 5 Bucket 1 partial of the GameScene
 * regrowth audit.
 *
 * Builds the three cosmetic world-dressing systems that depend on
 * the biome partition: scattered flora, wildlife (sheep / midges /
 * coos), and the rolling atmospheric mist layer. Each takes its own
 * RNG branch so a given run seed deterministically reproduces the
 * dressing layout.
 *
 * Determinism contract: the three `runRng.branch()` calls happen in
 * the same flora → wildlife → mist order they did inline; reordering
 * shifts every downstream sub-seed and breaks T1 replay byte-accuracy.
 *
 * The caller still owns the field assignments — this helper just
 * constructs + creates + returns the new instances. Prior instances
 * are destroyed inside the helper so the caller's reset block is one
 * line shorter.
 */
import type Phaser from 'phaser';
import { FloraScatter } from '../../systems/FloraScatter';
import { WildlifeSystem } from '../../systems/WildlifeSystem';
import { MistLayer } from '../../systems/MistLayer';
import type { BiomeManager } from '../../systems/BiomeManager';
import type { RNG } from '../../utils/rng';

export interface InstallWorldDressingInputs {
  scene: Phaser.Scene;
  biomeManager: BiomeManager | null;
  runRng: RNG;
  worldWidth: number;
  worldHeight: number;
  reduceParticles: boolean;
  prior: {
    floraScatter: FloraScatter | null;
    wildlifeSystem: WildlifeSystem | null;
    mistLayer: MistLayer | null;
  };
}

export interface InstallWorldDressingResult {
  floraScatter: FloraScatter | null;
  wildlifeSystem: WildlifeSystem | null;
  mistLayer: MistLayer | null;
}

export function installWorldDressing(
  inputs: InstallWorldDressingInputs,
): InstallWorldDressingResult {
  inputs.prior.floraScatter?.destroy();
  inputs.prior.wildlifeSystem?.destroy();
  inputs.prior.mistLayer?.destroy();

  if (!inputs.biomeManager) {
    return { floraScatter: null, wildlifeSystem: null, mistLayer: null };
  }

  const floraScatter = new FloraScatter();
  floraScatter.create(
    inputs.scene,
    inputs.biomeManager,
    inputs.worldWidth,
    inputs.worldHeight,
    inputs.runRng.branch(),
  );

  const wildlifeSystem = new WildlifeSystem();
  wildlifeSystem.create(
    inputs.scene,
    inputs.biomeManager,
    inputs.worldWidth,
    inputs.worldHeight,
    inputs.runRng.branch(),
  );

  const mistLayer = new MistLayer();
  mistLayer.create(
    inputs.scene,
    inputs.worldWidth,
    inputs.worldHeight,
    inputs.runRng.branch(),
    inputs.reduceParticles,
  );

  return { floraScatter, wildlifeSystem, mistLayer };
}
