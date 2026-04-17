import { describe, expect, it } from 'vitest';
import { createRNG } from '../utils/rng';
import { MOOR_MOMENTS, shuffleMoorMoments } from './moorMoments';
import { setLocale, t, DEFAULT_LOCALE } from '../core/i18n';

describe('moorMoments', () => {
  it('shuffle is deterministic for the same seed', () => {
    const a = shuffleMoorMoments(createRNG(42));
    const b = shuffleMoorMoments(createRNG(42));
    expect(a.map((m) => m.id)).toEqual(b.map((m) => m.id));
  });

  it('shuffle permutes all moment ids without loss', () => {
    const s = shuffleMoorMoments(createRNG(7));
    expect(s).toHaveLength(MOOR_MOMENTS.length);
    const ids = new Set(s.map((m) => m.id));
    expect(ids.size).toBe(MOOR_MOMENTS.length);
  });

  it('every moment has a unique id', () => {
    const ids = MOOR_MOMENTS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /**
   * Catches the typo-id bug class — a misspelled `captionKey` quietly
   * resolves to the literal key string at runtime, leaving the moor
   * moment with no caption. Every key referenced by a moment def
   * must exist in EN (the reference locale).
   */
  it('every moment caption + toast key resolves in EN', () => {
    setLocale(DEFAULT_LOCALE);
    try {
      for (const m of MOOR_MOMENTS) {
        const caption = t(m.captionKey);
        const toast = t(m.toastKey);
        expect(caption, `caption for ${m.id}`).not.toBe(m.captionKey);
        expect(toast, `toast for ${m.id}`).not.toBe(m.toastKey);
        if (m.captionKeyHome) {
          const home = t(m.captionKeyHome);
          expect(home, `captionKeyHome for ${m.id}`).not.toBe(m.captionKeyHome);
        }
        if (m.toastKeyHome) {
          const home = t(m.toastKeyHome);
          expect(home, `toastKeyHome for ${m.id}`).not.toBe(m.toastKeyHome);
        }
      }
    } finally {
      setLocale(DEFAULT_LOCALE);
    }
  });

  it('home-biome moments declare both home keys (not just one)', () => {
    for (const m of MOOR_MOMENTS) {
      if (!m.homeBiome) continue;
      expect(m.captionKeyHome, `${m.id} has homeBiome but no captionKeyHome`).toBeTruthy();
      expect(m.toastKeyHome, `${m.id} has homeBiome but no toastKeyHome`).toBeTruthy();
    }
  });

  it('every reward shape is well-formed (positive amounts, magnet has both fields)', () => {
    for (const m of MOOR_MOMENTS) {
      const r = m.reward;
      switch (r.kind) {
        case 'gold':
        case 'xp':
        case 'heal':
          expect(r.amount, `${m.id} ${r.kind}`).toBeGreaterThan(0);
          break;
        case 'magnet':
          expect(r.flatPx, `${m.id} magnet flatPx`).toBeGreaterThan(0);
          expect(r.durationMs, `${m.id} magnet durationMs`).toBeGreaterThan(0);
          break;
      }
    }
  });
});
