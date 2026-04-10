export const BALANCE = {
  xp: {
    gemPoolMax: 500,
    gemPrewarm: 50,
    criticalHpMagnetThreshold: 0.15,
    criticalHpMagnetMultiplier: 3,
    collectDistancePx: 20,
  },
  weapons: {
    projectilePoolMax: 200,
    projectilePrewarm: 30,
    trailEveryNFrames: 3,
    minEffectiveCooldownMs: 50,
  },
  player: {
    dashCooldownMs: 2000,
    dashSpeed: 600,
    dashDurationMs: 150,
    postDashGraceMs: 50,
    dashAfterImageCount: 5,
    netSlowAmount: 80,
    shieldCooldownMs: 20000,
    baseHitboxRadius: 20,
  },
  enemy: {
    rangedStandoffPx: 200,
    orbitRadiusPx: 180,
    phaseToggleMs: 2000,
    spawnerWarmupMs: 500,
    spawnerIntervalMs: 4000,
    hazardTtlMs: 10000,
    diveDespawnMarginPx: 300,
    rangedCooldownMs: 3000,
  },
} as const;

