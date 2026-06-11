import { BIOMES, type BiomeId } from '../../data/biomes';
import { capHaarForA11y, type HaarA11ySettings } from './haarA11y';
import { DEFAULT_HAAR_TRANSITION } from './haarTransition';

/**
 * Resolve the haar density that should hold while the player stands inside
 * the given biome, with accessibility caps applied. Lochs and bogs breathe
 * mist (ambient > 0); pine + heather sit drier (ambient 0). `capHaarForA11y`
 * gates the result via motionScale + reduceParticles.
 *
 * GameScene consumes this when BiomeController reports a biome change:
 * the returned density is the new tween target for `HaarFogController`.
 */
export function biomeHaarTarget(settings: HaarA11ySettings, biome: BiomeId): number {
  const ambient = BIOMES[biome].ambientHaarDensity;
  return capHaarForA11y(settings, ambient, DEFAULT_HAAR_TRANSITION).density;
}
