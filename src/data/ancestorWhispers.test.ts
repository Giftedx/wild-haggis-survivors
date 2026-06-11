import { describe, expect, it } from 'vitest';
import {
  WHISPER_KEYS,
  pickAncestor,
} from './ancestorWhispers';

describe('ancestorWhispers', () => {
  it('has at least 15 whisper keys', () => {
    expect(WHISPER_KEYS.length).toBeGreaterThanOrEqual(15);
  });

  it('returns null when history is empty', () => {
    const result = pickAncestor({ runHistory: [], rngSample: 0.5 });
    expect(result).toBeNull();
  });

  it('returns a valid ancestor pick for non-empty history', () => {
    const result = pickAncestor({
      runHistory: [
        { name: 'Moira of the Moor', seed: 'a' },
        { name: 'Dughall Peat-heart', seed: 'b' },
      ],
      rngSample: 0.5,
    });
    expect(result).not.toBeNull();
    expect(['Moira of the Moor', 'Dughall Peat-heart']).toContain(result?.name);
    expect(WHISPER_KEYS).toContain(result?.whisperKey);
  });

  it('biases toward recent entries (last 3 at 2x weight)', () => {
    const hist = Array.from({ length: 10 }, (_, i) => ({
      name: `H${i}`,
      seed: `s${i}`,
    }));
    let recentPicks = 0;
    let oldPicks = 0;
    for (let i = 0; i < 2000; i++) {
      const result = pickAncestor({ runHistory: hist, rngSample: Math.random() });
      if (!result) continue;
      const idx = hist.findIndex((h) => h.name === result.name);
      if (idx >= 7) recentPicks++;
      if (idx < 3) oldPicks++;
    }
    expect(recentPicks).toBeGreaterThan(oldPicks * 1.3);
  });
});
