import { afterEach, describe, expect, it, vi } from 'vitest';
import { emitSaveFailure } from './saveFailure';
import { globalEventBus } from '../core/GlobalEventBus';

describe('emitSaveFailure (T131)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits GLOBAL_SAVE_FAILED with extracted Error.message', () => {
    const seen: Array<{ path: string; reason: string }> = [];
    const off = globalEventBus.on('GLOBAL_SAVE_FAILED', (p) => {
      seen.push({ path: p.path, reason: p.reason });
    });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    emitSaveFailure('meta', new Error('quota exceeded'));
    off();
    expect(seen).toEqual([{ path: 'meta', reason: 'quota exceeded' }]);
  });

  it('falls back to "unknown" when err lacks a message', () => {
    const seen: Array<{ path: string; reason: string }> = [];
    const off = globalEventBus.on('GLOBAL_SAVE_FAILED', (p) => {
      seen.push({ path: p.path, reason: p.reason });
    });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    emitSaveFailure('settings', null);
    off();
    expect(seen).toEqual([{ path: 'settings', reason: 'unknown' }]);
  });

  it('writes a structured console.warn with path + reason', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    emitSaveFailure('legacy_save', 'disk write failed');
    expect(warn).toHaveBeenCalledWith('[save] persistence failure (legacy_save): disk write failed');
  });

  it('handles all four documented paths', () => {
    const paths: Array<'meta' | 'active_run' | 'settings' | 'legacy_save'> = [
      'meta',
      'active_run',
      'settings',
      'legacy_save',
    ];
    const seen: string[] = [];
    const off = globalEventBus.on('GLOBAL_SAVE_FAILED', (p) => seen.push(p.path));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const p of paths) emitSaveFailure(p, new Error('x'));
    off();
    expect(seen).toEqual(paths);
  });
});
