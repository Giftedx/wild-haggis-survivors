import { describe, it, expect } from 'vitest';
import {
  buildLivingWorldTracks,
  livingWorldTracksSummary,
  type LivingWorldTrackKey,
} from './livingWorldTracks';

describe('livingWorldTracks (Croft Living-Moor panel view-model)', () => {
  it('emits an ordered, stable list with one entry per track', () => {
    const list = buildLivingWorldTracks();
    const keys = list.map((e) => e.key);
    const expected: LivingWorldTrackKey[] = [
      'companions',
      'selkie_forms',
      'rhythm',
      'atmosphere',
      'music_bridge',
      'croft_home',
    ];
    expect(keys).toEqual(expected);
  });

  it('marks shipped Wild Living World mechanics as "shipped"', () => {
    // Phase 2 graduation: `croft_home` joined the shipped tracks once
    // the companion picker landed (2026-05-11).
    const list = buildLivingWorldTracks();
    const shipped = list.filter((e) => e.status === 'shipped').map((e) => e.key);
    expect(shipped).toEqual([
      'companions',
      'selkie_forms',
      'rhythm',
      'atmosphere',
      'music_bridge',
      'croft_home',
    ]);
  });

  it('marks the croft surface as "shipped" after the Phase 2 picker landed', () => {
    // Wild Living World Phase 2 graduated `croft_home` from
    // 'introduced' (the M1 stub status) to 'shipped' once the
    // persistent companion picker (`livingWorldUnlocks` +
    // CroftScene picker panel) shipped on 2026-05-11.
    const list = buildLivingWorldTracks();
    const croft = list.find((e) => e.key === 'croft_home');
    expect(croft).toBeDefined();
    expect(croft?.status).toBe('shipped');
  });

  it('order is monotonically increasing', () => {
    const list = buildLivingWorldTracks();
    for (let i = 1; i < list.length; i++) {
      expect(list[i].order).toBeGreaterThan(list[i - 1].order);
    }
  });

  it('does not crash when called with an empty context', () => {
    expect(() => buildLivingWorldTracks({})).not.toThrow();
    expect(() => buildLivingWorldTracks(undefined)).not.toThrow();
  });

  it('summary tallies shipped/introduced/planned correctly', () => {
    const list = buildLivingWorldTracks();
    const s = livingWorldTracksSummary(list);
    expect(s.total).toBe(list.length);
    expect(s.shipped + s.introduced + s.planned).toBe(s.total);
    // Phase 2: croft_home graduated to 'shipped' (6 shipped, 0 in-progress).
    expect(s.shipped).toBe(6);
    expect(s.introduced).toBe(0);
    expect(s.planned).toBe(0);
  });

  it('every entry references a non-empty i18n key (no orphan placeholder)', () => {
    const list = buildLivingWorldTracks();
    for (const e of list) {
      expect(e.displayNameKey).toMatch(/^ui\.croft\.livingWorld\./);
      expect(e.descriptionKey).toMatch(/^ui\.croft\.livingWorld\./);
    }
  });
});
