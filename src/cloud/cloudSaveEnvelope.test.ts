import { describe, expect, it } from 'vitest';
import {
  CLOUD_SAVE_ENVELOPE_VERSION,
  MAX_PAYLOAD_BYTES,
  buildCloudSaveEnvelope,
  parseCloudSaveEnvelope,
  serializeCloudSaveEnvelope,
} from './cloudSaveEnvelope';

const SAMPLE_PAYLOAD = JSON.stringify({ saveVersion: 17, totalKills: 42 });

describe('cloudSaveEnvelope — build', () => {
  it('builds with the current envelope version', () => {
    const env = buildCloudSaveEnvelope(SAMPLE_PAYLOAD, {
      payloadSchemaVersion: 17,
      deviceId: 'device-1',
      now: 1_700_000_000_000,
    });
    expect(env.envelopeVersion).toBe(CLOUD_SAVE_ENVELOPE_VERSION);
    expect(env.payloadSchemaVersion).toBe(17);
    expect(env.deviceId).toBe('device-1');
    expect(env.lastModified).toBe(1_700_000_000_000);
    expect(env.payload).toBe(SAMPLE_PAYLOAD);
  });

  it('defaults lastModified to Date.now() when not provided', () => {
    const before = Date.now();
    const env = buildCloudSaveEnvelope(SAMPLE_PAYLOAD, {
      payloadSchemaVersion: 17,
      deviceId: 'device-1',
    });
    const after = Date.now();
    expect(env.lastModified).toBeGreaterThanOrEqual(before);
    expect(env.lastModified).toBeLessThanOrEqual(after);
  });

  it('rejects empty payloads', () => {
    expect(() => buildCloudSaveEnvelope('', {
      payloadSchemaVersion: 17,
      deviceId: 'device-1',
    })).toThrow(/too small/);
  });

  it('rejects oversize payloads', () => {
    const big = '"' + 'x'.repeat(MAX_PAYLOAD_BYTES + 100) + '"';
    expect(() => buildCloudSaveEnvelope(big, {
      payloadSchemaVersion: 17,
      deviceId: 'device-1',
    })).toThrow(/exceeds/);
  });

  it('rejects empty deviceId', () => {
    expect(() => buildCloudSaveEnvelope(SAMPLE_PAYLOAD, {
      payloadSchemaVersion: 17,
      deviceId: '',
    })).toThrow(/deviceId/);
  });

  it('rejects non-finite payloadSchemaVersion', () => {
    expect(() => buildCloudSaveEnvelope(SAMPLE_PAYLOAD, {
      payloadSchemaVersion: NaN,
      deviceId: 'device-1',
    })).toThrow(/payloadSchemaVersion/);
  });
});

describe('cloudSaveEnvelope — parse', () => {
  it('round-trips through serialize/parse', () => {
    const env = buildCloudSaveEnvelope(SAMPLE_PAYLOAD, {
      payloadSchemaVersion: 17,
      deviceId: 'd1',
      now: 1_700_000_000_000,
    });
    const wire = serializeCloudSaveEnvelope(env);
    const parsed = parseCloudSaveEnvelope(JSON.parse(wire));
    expect(parsed).toEqual(env);
  });

  it('throws on non-object input', () => {
    expect(() => parseCloudSaveEnvelope('hi')).toThrow();
    expect(() => parseCloudSaveEnvelope(null)).toThrow();
    expect(() => parseCloudSaveEnvelope(42)).toThrow();
  });

  it('throws on wrong envelopeVersion', () => {
    expect(() => parseCloudSaveEnvelope({
      envelopeVersion: 999,
      payloadSchemaVersion: 17,
      lastModified: 1,
      deviceId: 'd',
      payload: SAMPLE_PAYLOAD,
    })).toThrow(/envelopeVersion/);
  });

  it('throws on missing fields', () => {
    expect(() => parseCloudSaveEnvelope({
      envelopeVersion: CLOUD_SAVE_ENVELOPE_VERSION,
      payloadSchemaVersion: 17,
      lastModified: 1,
      // missing deviceId
      payload: SAMPLE_PAYLOAD,
    })).toThrow(/deviceId/);
  });

  it('throws on negative lastModified', () => {
    expect(() => parseCloudSaveEnvelope({
      envelopeVersion: CLOUD_SAVE_ENVELOPE_VERSION,
      payloadSchemaVersion: 17,
      lastModified: -1,
      deviceId: 'd',
      payload: SAMPLE_PAYLOAD,
    })).toThrow(/lastModified/);
  });

  it('preserves forceConflictPrompt when true', () => {
    const env = buildCloudSaveEnvelope(SAMPLE_PAYLOAD, {
      payloadSchemaVersion: 17,
      deviceId: 'd1',
      now: 1,
    });
    const wire = serializeCloudSaveEnvelope({ ...env, forceConflictPrompt: true });
    const parsed = parseCloudSaveEnvelope(JSON.parse(wire));
    expect(parsed.forceConflictPrompt).toBe(true);
  });

  it('drops forceConflictPrompt when not strictly true', () => {
    const env = buildCloudSaveEnvelope(SAMPLE_PAYLOAD, {
      payloadSchemaVersion: 17,
      deviceId: 'd1',
      now: 1,
    });
    const wire = serializeCloudSaveEnvelope({ ...env, forceConflictPrompt: false });
    const parsed = parseCloudSaveEnvelope(JSON.parse(wire));
    expect(parsed.forceConflictPrompt).toBeUndefined();
  });

  it('rejects payloads beyond MAX_PAYLOAD_BYTES even when other fields are valid', () => {
    const big = '"' + 'x'.repeat(MAX_PAYLOAD_BYTES + 100) + '"';
    expect(() => parseCloudSaveEnvelope({
      envelopeVersion: CLOUD_SAVE_ENVELOPE_VERSION,
      payloadSchemaVersion: 17,
      lastModified: 1,
      deviceId: 'd',
      payload: big,
    })).toThrow(/payload size/);
  });
});
