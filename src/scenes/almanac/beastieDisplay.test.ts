import { describe, expect, it } from 'vitest';
import { resolveBeastieDisplay, SILHOUETTE_TINT, SILHOUETTE_ALPHA, SILHOUETTE_NAME } from './beastieDisplay';

describe('resolveBeastieDisplay', () => {
  it('returns full display state for a seen beastie', () => {
    const display = resolveBeastieDisplay({ seen: true, displayName: 'Tourist' });
    expect(display.tint).toBeNull();
    expect(display.alpha).toBe(1);
    expect(display.displayName).toBe('Tourist');
    expect(display.isSilhouette).toBe(false);
  });

  it('returns silhouette state for an unseen beastie — tint + dim + "???" name', () => {
    const display = resolveBeastieDisplay({ seen: false, displayName: 'Tourist' });
    expect(display.tint).toBe(SILHOUETTE_TINT);
    expect(display.alpha).toBe(SILHOUETTE_ALPHA);
    expect(display.displayName).toBe(SILHOUETTE_NAME);
    expect(display.isSilhouette).toBe(true);
  });

  it('silhouette alpha sits between fully-transparent and opaque — readable but clearly unknown', () => {
    expect(SILHOUETTE_ALPHA).toBeGreaterThan(0.25);
    expect(SILHOUETTE_ALPHA).toBeLessThan(1);
  });

  it('silhouette tint is a very dark colour — reads as shadow against the panel bg', () => {
    // Each channel ≤ 0x40 (64) so the tint blacks-out the sprite without
    // pure #000 (which loses silhouette edge definition at low alpha).
    expect((SILHOUETTE_TINT >> 16) & 0xff).toBeLessThanOrEqual(0x40);
    expect((SILHOUETTE_TINT >> 8) & 0xff).toBeLessThanOrEqual(0x40);
    expect(SILHOUETTE_TINT & 0xff).toBeLessThanOrEqual(0x40);
  });

  it('silhouette display never leaks the real display name — preserves mystery', () => {
    const display = resolveBeastieDisplay({ seen: false, displayName: 'Gordon the Chef' });
    expect(display.displayName).not.toContain('Gordon');
  });
});
