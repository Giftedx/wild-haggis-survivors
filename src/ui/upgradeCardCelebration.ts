import type { UpgradeCard } from '../data/upgrades';

/**
 * Pure specs for the level-up cozy moment:
 * - `legendaryTrailSpec`: 8 spark-trail particles flying card → HUD XP bar
 *   on a legendary pick (gated by reduceParticles).
 * - `resolveRarityPillPulseSpec`: alpha-pulse tween spec for the rarity
 *   pill — legendary/epic get a slow breathing pulse, common/rare stay
 *   static. Keeping this pure lets the UI layer stay thin and testable.
 */

export interface LegendaryTrailParticle {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delay: number;
  duration: number;
  radius: number;
}

export function legendaryTrailSpec(
  origin: { x: number; y: number },
  target: { x: number; y: number },
  count: number,
  reduceParticles: boolean,
): LegendaryTrailParticle[] {
  if (reduceParticles) return [];
  const out: LegendaryTrailParticle[] = [];
  const stagger = 40;
  for (let i = 0; i < count; i++) {
    // Jitter start positions within a small radius so the burst fans out
    // rather than leaving a single streak — deterministic via index math
    // so unit tests stay stable.
    const angle = (i / count) * Math.PI * 2;
    const r = 6;
    out.push({
      startX: origin.x + Math.cos(angle) * r,
      startY: origin.y + Math.sin(angle) * r,
      endX: target.x,
      endY: target.y,
      delay: i * stagger,
      duration: 420,
      radius: 3,
    });
  }
  return out;
}

export interface RarityPillPulseSpec {
  alphaFrom: number;
  alphaTo: number;
  duration: number;
}

export function resolveRarityPillPulseSpec(
  rarity: UpgradeCard['rarity'],
): RarityPillPulseSpec | null {
  if (rarity === 'legendary') {
    return { alphaFrom: 0.25, alphaTo: 0.45, duration: 2000 };
  }
  return null;
}
