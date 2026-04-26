import { describe, expect, it } from 'vitest';
import { buildCloudSaveEnvelope } from './cloudSaveEnvelope';
import {
  DEFAULT_TOLERANT_WINDOW_MS,
  detectCloudSaveConflict,
  summarizeForConflictDialog,
} from './cloudSaveConflict';

const PAYLOAD = JSON.stringify({
  saveVersion: 17,
  totalKills: 1234,
  unlockedVariants: ['default', 'cailleach', 'doric'],
  almanacEntries: { item_a: true, item_b: true },
});

function envelope(opts: {
  schema?: number;
  ms: number;
  device: string;
  payload?: string;
  force?: boolean;
}) {
  const env = buildCloudSaveEnvelope(opts.payload ?? PAYLOAD, {
    payloadSchemaVersion: opts.schema ?? 17,
    deviceId: opts.device,
    now: opts.ms,
  });
  return opts.force ? { ...env, forceConflictPrompt: true } : env;
}

describe('detectCloudSaveConflict — basic LWW', () => {
  it('treats identical timestamps as in-sync', () => {
    const local = envelope({ ms: 100, device: 'a' });
    const remote = envelope({ ms: 100, device: 'a' });
    expect(detectCloudSaveConflict(local, remote).kind).toBe('in-sync');
  });

  it('returns local-newer when local is well past tolerance window', () => {
    const local = envelope({ ms: 200_000, device: 'a' });
    const remote = envelope({ ms: 100_000, device: 'b' });
    expect(detectCloudSaveConflict(local, remote).kind).toBe('local-newer');
  });

  it('returns remote-newer when remote is well past tolerance window', () => {
    const local = envelope({ ms: 100_000, device: 'a' });
    const remote = envelope({ ms: 200_000, device: 'b' });
    expect(detectCloudSaveConflict(local, remote).kind).toBe('remote-newer');
  });

  it('still LWWs same-device near-simultaneous edits (no dialog)', () => {
    const local = envelope({ ms: 100_500, device: 'same' });
    const remote = envelope({ ms: 100_000, device: 'same' });
    // Same device, dt within tolerance — should still LWW silently.
    expect(detectCloudSaveConflict(local, remote).kind).toBe('local-newer');
  });
});

describe('detectCloudSaveConflict — dialog cases', () => {
  it('surfaces dialog for cross-device near-simultaneous edits', () => {
    const local = envelope({ ms: 100_500, device: 'a' });
    const remote = envelope({ ms: 100_000, device: 'b' });
    const v = detectCloudSaveConflict(local, remote);
    expect(v.kind).toBe('conflict-ambiguous');
    if (v.kind === 'conflict-ambiguous') {
      expect(v.localSummary.deviceId).toBe('a');
      expect(v.remoteSummary.deviceId).toBe('b');
    }
  });

  it('respects custom tolerance window', () => {
    // dt = 5000ms, custom window 1000ms → outside tolerance → silent LWW.
    const local = envelope({ ms: 105_000, device: 'a' });
    const remote = envelope({ ms: 100_000, device: 'b' });
    expect(
      detectCloudSaveConflict(local, remote, { tolerantWindowMs: 1_000 }).kind,
    ).toBe('local-newer');
  });

  it('honours envelope.forceConflictPrompt', () => {
    const local = envelope({ ms: 200_000, device: 'a', force: true });
    const remote = envelope({ ms: 100_000, device: 'b' });
    expect(detectCloudSaveConflict(local, remote).kind).toBe('conflict-ambiguous');
  });

  it('honours opts.forceConflict', () => {
    const local = envelope({ ms: 200_000, device: 'a' });
    const remote = envelope({ ms: 100_000, device: 'a' });
    expect(
      detectCloudSaveConflict(local, remote, { forceConflict: true }).kind,
    ).toBe('conflict-ambiguous');
  });
});

describe('detectCloudSaveConflict — schema-version safety', () => {
  it('refuses to overwrite local with newer-schema cloud', () => {
    const local = envelope({ schema: 17, ms: 100_000, device: 'a' });
    const remote = envelope({ schema: 18, ms: 200_000, device: 'b' });
    const v = detectCloudSaveConflict(local, remote);
    expect(v.kind).toBe('refuse-cloud-newer-schema');
  });

  it('allows pushing local one version ahead of cloud (common after migration)', () => {
    const local = envelope({ schema: 18, ms: 200_000, device: 'a' });
    const remote = envelope({ schema: 17, ms: 100_000, device: 'b' });
    expect(detectCloudSaveConflict(local, remote).kind).toBe('local-newer');
  });

  it('refuses to push when local is two+ versions ahead of cloud', () => {
    const local = envelope({ schema: 19, ms: 200_000, device: 'a' });
    const remote = envelope({ schema: 17, ms: 100_000, device: 'b' });
    expect(detectCloudSaveConflict(local, remote).kind).toBe('refuse-cloud-older-schema');
  });

  it('schema refusal supersedes timestamp comparison', () => {
    // Even if local is "older", if remote is newer-schema we refuse.
    const local = envelope({ schema: 17, ms: 999_999, device: 'a' });
    const remote = envelope({ schema: 18, ms: 1, device: 'b' });
    expect(detectCloudSaveConflict(local, remote).kind).toBe('refuse-cloud-newer-schema');
  });
});

describe('summarizeForConflictDialog', () => {
  it('extracts headline stats from a real-shaped payload', () => {
    const env = envelope({ ms: 1_700_000_000_000, device: 'a' });
    const s = summarizeForConflictDialog(env);
    expect(s.totalKills).toBe(1234);
    expect(s.variantsUnlocked).toBe(3);
    expect(s.almanacEntries).toBe(2);
    expect(s.lastModifiedISO).toBe('2023-11-14T22:13:20.000Z');
    expect(s.deviceId).toBe('a');
    expect(s.payloadSchemaVersion).toBe(17);
  });

  it('returns zero counts when inner payload is unparseable', () => {
    const env = envelope({ ms: 1, device: 'a', payload: '"not-json-shape"' });
    const s = summarizeForConflictDialog(env);
    expect(s.totalKills).toBe(0);
    expect(s.variantsUnlocked).toBe(0);
    expect(s.almanacEntries).toBe(0);
  });

  it('handles array-shaped almanac entries', () => {
    const env = envelope({
      ms: 1,
      device: 'a',
      payload: JSON.stringify({
        totalKills: 5,
        unlockedVariants: ['x'],
        almanacEntries: ['a', 'b', 'c'],
      }),
    });
    const s = summarizeForConflictDialog(env);
    expect(s.almanacEntries).toBe(3);
  });

  it('coerces malformed counts to zero rather than throwing', () => {
    const env = envelope({
      ms: 1,
      device: 'a',
      payload: JSON.stringify({
        totalKills: -5,
        unlockedVariants: 'not-an-array',
      }),
    });
    const s = summarizeForConflictDialog(env);
    expect(s.totalKills).toBe(0);
    expect(s.variantsUnlocked).toBe(0);
  });
});

describe('detectCloudSaveConflict — invariants', () => {
  it('default tolerance window matches the documented 60s', () => {
    expect(DEFAULT_TOLERANT_WINDOW_MS).toBe(60_000);
  });

  it('is symmetric for non-conflict cases (local↔remote swap flips verdict)', () => {
    const a = envelope({ ms: 200_000, device: 'a' });
    const b = envelope({ ms: 100_000, device: 'b' });
    const fwd = detectCloudSaveConflict(a, b);
    const rev = detectCloudSaveConflict(b, a);
    expect(fwd.kind).toBe('local-newer');
    expect(rev.kind).toBe('remote-newer');
  });
});
