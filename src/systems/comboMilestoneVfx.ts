export interface ComboMilestoneVfx {
  pulseScale: number;        // Multiplied with base scale for the pulse tween
  flashColor: number | null; // null = no flash
  flashDurationMs: number;
  burstParticles: number;    // 0 = no burst
}

/** Returns milestone VFX config, or null if this count is not a milestone. */
export function resolveComboMilestoneVfx(count: number): ComboMilestoneVfx | null {
  switch (count) {
    case 11: return { pulseScale: 1.3, flashColor: null, flashDurationMs: 0, burstParticles: 0 };
    case 50: return { pulseScale: 1.5, flashColor: 0xffe088, flashDurationMs: 80, burstParticles: 8 };
    case 100: return { pulseScale: 1.8, flashColor: 0xffd700, flashDurationMs: 120, burstParticles: 16 };
    case 200: return { pulseScale: 2.0, flashColor: 0xffd700, flashDurationMs: 150, burstParticles: 24 };
    default: return null;
  }
}
