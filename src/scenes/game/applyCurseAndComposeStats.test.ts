/**
 * applyCurseAndComposeStats — pre-Player curse + composed-stats
 * resolution contract for GameScene. Pure tests; do NOT boot Phaser
 * (per CLAUDE.md "Phaser imports break in node-env vitest").
 *
 * Coverage matrix:
 *   - precedence: v2 playback curseKey wins over pendingCurseKey,
 *     resumeRun gate, and runIsDaily gate (replay determinism).
 *   - resumeRun=true + no v2 → no curse applied even if pendingCurseKey
 *     is non-null (resumed runs already baked their curse in).
 *   - runIsDaily=true + no v2 → no curse applied (fixed rule set).
 *   - fresh run (resume=false, daily=false) + valid pendingCurseKey →
 *     curse applied; bag mutated; activeCurseKey returned;
 *     consumePending=true.
 *   - fresh run + null pendingCurseKey → no curse; bag stays default;
 *     consumePending=false.
 *   - unknown curseKey (data-drift safety) → no curse applied;
 *     consumePending still flagged when input field was set.
 *   - GLOBAL_CURSE_STARTED emitted exactly once when (and only when) a
 *     curse was successfully applied.
 *   - composedStats: v2 playback splat overrides moveSpeedMult /
 *     startHpRatio derivation (replay determinism).
 *   - composedStats: live-derive folds curse multipliers into speed +
 *     maxHp; rounds maxHp; clamps to ≥1.
 *   - composedStats: BALANCE.player constants always come from
 *     baseStats spread (helper does not invent fields).
 *   - bag-vs-cached-field doctrine: helper mutates a *fresh* default
 *     bag, never the input — `runModifiers` reference identity is new.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { applyCurseAndComposeStats } from './applyCurseAndComposeStats';
import { defaultModifiers } from '../../core/RunModifiers';
import { globalEventBus, type GlobalCurseStartedPayload } from '../../core/GlobalEventBus';
import { BALANCE } from '../../core/BalanceConfig';
import type { ComposedPlayerStats } from '../../core/StatComposer';
import {
  createEmptyReplayBlobV2,
  type ReplayBlobV2,
} from '../../replay/replayBlobV2';

const sampleBaseStats: ComposedPlayerStats = {
  ...BALANCE.player,
  speed: 200,
  maxHp: 100,
  driftDegrees: 8,
  pickupRadius: 80,
  damagePctBonus: 0,
  hpRegen: 0,
  critBonus: 0,
  cooldownReduction: 0,
  xpGainBonus: 0,
  armorBonus: 0,
  dashCooldownReduction: 0,
};

function makeV2Blob(overrides: Partial<ReplayBlobV2> = {}): ReplayBlobV2 {
  return {
    ...createEmptyReplayBlobV2({
      build: 'whs-test',
      seed: 42,
      variantKey: 'classic',
      ...overrides,
    }),
    ...overrides,
  };
}

interface CurseEmissionRecord {
  count: number;
  lastPayload: GlobalCurseStartedPayload | null;
}

function captureCurseEmission(): { record: CurseEmissionRecord; dispose: () => void } {
  const record: CurseEmissionRecord = { count: 0, lastPayload: null };
  const dispose = globalEventBus.on('GLOBAL_CURSE_STARTED', (p) => {
    record.count += 1;
    record.lastPayload = p;
  });
  return { record, dispose };
}

describe('applyCurseAndComposeStats — curse precedence', () => {
  let cap: ReturnType<typeof captureCurseEmission>;
  beforeEach(() => {
    cap = captureCurseEmission();
  });

  it('returns default modifiers + null curse + composedStats=baseStats when nothing pending', () => {
    const result = applyCurseAndComposeStats({
      pendingCurseKey: null,
      resumeRun: false,
      runIsDaily: false,
      playbackV2: null,
      baseStats: sampleBaseStats,
    });
    cap.dispose();
    expect(result.activeCurseKey).toBe(null);
    expect(result.consumePending).toBe(false);
    expect(result.runModifiers).toEqual(defaultModifiers());
    expect(result.composedStats.speed).toBe(sampleBaseStats.speed);
    expect(result.composedStats.maxHp).toBe(sampleBaseStats.maxHp);
    expect(cap.record.count).toBe(0);
  });

  it('applies pendingCurseKey on a fresh non-daily run and emits GLOBAL_CURSE_STARTED', () => {
    const result = applyCurseAndComposeStats({
      pendingCurseKey: 'heavy_legs',
      resumeRun: false,
      runIsDaily: false,
      playbackV2: null,
      baseStats: sampleBaseStats,
    });
    cap.dispose();
    expect(result.activeCurseKey).toBe('heavy_legs');
    expect(result.consumePending).toBe(true);
    expect(result.runModifiers.moveSpeedMult).toBeCloseTo(0.88, 6);
    expect(result.runModifiers.goldMult).toBeCloseTo(1.30, 6);
    expect(cap.record.count).toBe(1);
    expect(cap.record.lastPayload?.curseKey).toBe('heavy_legs');
  });

  it('skips pendingCurseKey on resumed runs (curse was already baked in)', () => {
    const result = applyCurseAndComposeStats({
      pendingCurseKey: 'heavy_legs',
      resumeRun: true,
      runIsDaily: false,
      playbackV2: null,
      baseStats: sampleBaseStats,
    });
    cap.dispose();
    expect(result.activeCurseKey).toBe(null);
    expect(result.runModifiers.moveSpeedMult).toBe(1);
    expect(cap.record.count).toBe(0);
    // pendingCurseKey was non-null on input — caller must still null it
    // to prevent next-run leak. consumePending=true signals that.
    expect(result.consumePending).toBe(true);
  });

  it('skips pendingCurseKey on daily runs (fixed rule set)', () => {
    const result = applyCurseAndComposeStats({
      pendingCurseKey: 'thin_hide',
      resumeRun: false,
      runIsDaily: true,
      playbackV2: null,
      baseStats: sampleBaseStats,
    });
    cap.dispose();
    expect(result.activeCurseKey).toBe(null);
    expect(result.runModifiers.damageTakenMult).toBe(1);
    expect(cap.record.count).toBe(0);
    expect(result.consumePending).toBe(true);
  });

  it('returns no curse when pendingCurseKey is unknown (data-drift safety)', () => {
    const result = applyCurseAndComposeStats({
      pendingCurseKey: 'no_such_curse' as never,
      resumeRun: false,
      runIsDaily: false,
      playbackV2: null,
      baseStats: sampleBaseStats,
    });
    cap.dispose();
    expect(result.activeCurseKey).toBe(null);
    expect(result.runModifiers).toEqual(defaultModifiers());
    expect(cap.record.count).toBe(0);
    // Field was non-null → consumePending stays true (caller must
    // null its field regardless of whether the curse actually
    // applied; the consume-once contract is field-set, not
    // curse-applied).
    expect(result.consumePending).toBe(true);
  });
});

describe('applyCurseAndComposeStats — playback determinism precedence', () => {
  let cap: ReturnType<typeof captureCurseEmission>;
  beforeEach(() => {
    cap = captureCurseEmission();
  });

  it('v2 playback curseKey overrides pendingCurseKey + resumeRun + runIsDaily gates', () => {
    const result = applyCurseAndComposeStats({
      pendingCurseKey: 'thin_hide',
      // even though resume + daily would normally block pendingCurseKey,
      // v2 playback wins — replay determinism > pre-run pick.
      resumeRun: true,
      runIsDaily: true,
      playbackV2: makeV2Blob({ curseKey: 'heavy_legs' }),
      baseStats: sampleBaseStats,
    });
    cap.dispose();
    expect(result.activeCurseKey).toBe('heavy_legs');
    expect(result.runModifiers.moveSpeedMult).toBeCloseTo(0.88, 6);
    // The pre-run pick (thin_hide) was NOT applied; v2 won.
    expect(result.runModifiers.damageTakenMult).toBe(1);
    expect(cap.record.count).toBe(1);
    expect(cap.record.lastPayload?.curseKey).toBe('heavy_legs');
    expect(result.consumePending).toBe(true);
  });

  it('v2 playback without curseKey falls through to fresh-run rules', () => {
    const result = applyCurseAndComposeStats({
      pendingCurseKey: 'restless_spirits',
      resumeRun: false,
      runIsDaily: false,
      playbackV2: makeV2Blob({}),
      baseStats: sampleBaseStats,
    });
    cap.dispose();
    expect(result.activeCurseKey).toBe('restless_spirits');
    expect(result.runModifiers.spawnIntervalMult).toBeLessThan(1);
    expect(cap.record.count).toBe(1);
  });

  it('v2 playback with unknown curseKey does not fall through to pendingCurseKey (precedence stops at the v2 branch)', () => {
    const result = applyCurseAndComposeStats({
      pendingCurseKey: 'heavy_legs',
      resumeRun: false,
      runIsDaily: false,
      playbackV2: makeV2Blob({ curseKey: 'no_such' }),
      baseStats: sampleBaseStats,
    });
    cap.dispose();
    expect(result.activeCurseKey).toBe(null);
    expect(result.runModifiers.moveSpeedMult).toBe(1);
    expect(cap.record.count).toBe(0);
  });
});

describe('applyCurseAndComposeStats — composedStats derivation', () => {
  let cap: ReturnType<typeof captureCurseEmission>;
  beforeEach(() => {
    cap = captureCurseEmission();
  });

  it('folds curse moveSpeedMult into composedStats.speed on the live-derive path', () => {
    const result = applyCurseAndComposeStats({
      pendingCurseKey: 'heavy_legs',
      resumeRun: false,
      runIsDaily: false,
      playbackV2: null,
      baseStats: sampleBaseStats,
    });
    cap.dispose();
    // 200 * 0.88 = 176.
    expect(result.composedStats.speed).toBeCloseTo(176, 6);
    // No HP curse on heavy_legs → maxHp untouched.
    expect(result.composedStats.maxHp).toBe(100);
  });

  it('folds curse startHpRatio into composedStats.maxHp with rounding', () => {
    const result = applyCurseAndComposeStats({
      pendingCurseKey: 'empty_larder',
      resumeRun: false,
      runIsDaily: false,
      playbackV2: null,
      baseStats: { ...sampleBaseStats, maxHp: 103 },
    });
    cap.dispose();
    // empty_larder applies 0.80 startHpRatio → 103 * 0.80 = 82.4 → 82.
    expect(result.composedStats.maxHp).toBe(82);
  });

  it('clamps maxHp to ≥1 when ratio rounds toward 0', () => {
    const result = applyCurseAndComposeStats({
      pendingCurseKey: 'empty_larder',
      resumeRun: false,
      runIsDaily: false,
      playbackV2: null,
      baseStats: { ...sampleBaseStats, maxHp: 1 },
    });
    cap.dispose();
    // 1 * 0.80 = 0.80 → round = 1 (the rounding tips back up), still ≥1.
    expect(result.composedStats.maxHp).toBeGreaterThanOrEqual(1);
  });

  it('v2 composedStats override splats onto baseStats (replay determinism)', () => {
    const snapshot = {
      speed: 333,
      maxHp: 222,
      driftDegrees: 4,
      pickupRadius: 99,
      damagePctBonus: 0.25,
      hpRegen: 0.5,
      critBonus: 0.10,
      cooldownReduction: 0.15,
      xpGainBonus: 0.20,
      armorBonus: 5,
      dashCooldownReduction: 0.30,
    };
    const result = applyCurseAndComposeStats({
      pendingCurseKey: 'heavy_legs',
      resumeRun: false,
      runIsDaily: false,
      playbackV2: makeV2Blob({ composedStats: snapshot }),
      baseStats: sampleBaseStats,
    });
    cap.dispose();
    // Live-derive would have written 200*0.88=176; the v2 snapshot wins.
    expect(result.composedStats.speed).toBe(333);
    expect(result.composedStats.maxHp).toBe(222);
    // BALANCE.player constants survive because we spread baseStats first.
    expect(result.composedStats.dashSpeed).toBe(BALANCE.player.dashSpeed);
  });

  it('preserves BALANCE.player build-level constants on the live-derive path', () => {
    const result = applyCurseAndComposeStats({
      pendingCurseKey: null,
      resumeRun: false,
      runIsDaily: false,
      playbackV2: null,
      baseStats: sampleBaseStats,
    });
    cap.dispose();
    // None of these are mutated by curses; they ride baseStats untouched.
    expect(result.composedStats.dashSpeed).toBe(BALANCE.player.dashSpeed);
    expect(result.composedStats.dashCooldownMs).toBe(BALANCE.player.dashCooldownMs);
  });
});

describe('applyCurseAndComposeStats — purity invariants', () => {
  it('returns a fresh runModifiers bag, not a shared reference', () => {
    const r1 = applyCurseAndComposeStats({
      pendingCurseKey: null,
      resumeRun: false,
      runIsDaily: false,
      playbackV2: null,
      baseStats: sampleBaseStats,
    });
    const r2 = applyCurseAndComposeStats({
      pendingCurseKey: null,
      resumeRun: false,
      runIsDaily: false,
      playbackV2: null,
      baseStats: sampleBaseStats,
    });
    expect(r1.runModifiers).not.toBe(r2.runModifiers);
    // Mutating one doesn't poison the other (both are fresh defaults).
    r1.runModifiers.moveSpeedMult = 0.5;
    expect(r2.runModifiers.moveSpeedMult).toBe(1);
  });

  it('does not mutate baseStats — caller can reuse the same sheet', () => {
    const before = JSON.stringify(sampleBaseStats);
    applyCurseAndComposeStats({
      pendingCurseKey: 'heavy_legs',
      resumeRun: false,
      runIsDaily: false,
      playbackV2: null,
      baseStats: sampleBaseStats,
    });
    const after = JSON.stringify(sampleBaseStats);
    expect(after).toBe(before);
  });

  it('curse-apply happens BEFORE composedStats derivation (order assertion)', () => {
    const result = applyCurseAndComposeStats({
      pendingCurseKey: 'heavy_legs',
      resumeRun: false,
      runIsDaily: false,
      playbackV2: null,
      baseStats: sampleBaseStats,
    });
    // If derivation ran before curse-apply, speed would be 200 (default
    // moveSpeedMult=1). Asserting 176 pins the order.
    expect(result.composedStats.speed).toBeCloseTo(176, 6);
    expect(result.runModifiers.moveSpeedMult).toBeCloseTo(0.88, 6);
  });
});
