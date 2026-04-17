import { describe, expect, it } from 'vitest';
import { resolveReplayModeFromEnv } from './replayConfig';

describe('resolveReplayModeFromEnv', () => {
  it('defaults to off when both sources empty', () => {
    expect(resolveReplayModeFromEnv({})).toBe('off');
    expect(resolveReplayModeFromEnv({ globalMode: null, storageMode: null })).toBe('off');
  });

  it('honours globalMode "record"', () => {
    expect(resolveReplayModeFromEnv({ globalMode: 'record' })).toBe('record');
  });

  it('honours storageMode "record" when globalMode absent', () => {
    expect(resolveReplayModeFromEnv({ storageMode: 'record' })).toBe('record');
  });

  it('global takes priority over storage', () => {
    expect(resolveReplayModeFromEnv({ globalMode: 'off', storageMode: 'record' })).toBe('off');
  });

  it('case-insensitive', () => {
    expect(resolveReplayModeFromEnv({ globalMode: 'RECORD' })).toBe('record');
    expect(resolveReplayModeFromEnv({ storageMode: 'Off' })).toBe('off');
  });

  it('unknown values resolve to off', () => {
    expect(resolveReplayModeFromEnv({ globalMode: 'play' })).toBe('off');
    expect(resolveReplayModeFromEnv({ globalMode: 'nonsense' })).toBe('off');
    expect(resolveReplayModeFromEnv({ storageMode: 'true' })).toBe('off');
  });
});
