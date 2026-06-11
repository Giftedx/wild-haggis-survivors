import { describe, expect, it } from 'vitest';
import { AUTHORED_TARTANS, pickAuthoredTartan } from './tartanAuthored';
import type { TartanSignature } from './tartan';

const death: TartanSignature = { victory: false };
const plainWin: TartanSignature = { victory: true };
const ironmoorWin: TartanSignature = { victory: true, ironmoor: true };
const cursedWin: TartanSignature = { victory: true, cursed: true };
const postBellWin: TartanSignature = { victory: true, postBell: true };
const ironCursedWin: TartanSignature = { victory: true, ironmoor: true, cursed: true };
const cursedPostBellWin: TartanSignature = { victory: true, cursed: true, postBell: true };
const ironmoorLoss: TartanSignature = { victory: false, ironmoor: true };

describe('pickAuthoredTartan', () => {
  it('no match on plain death — procedural fallback path', () => {
    expect(pickAuthoredTartan(death)).toBeUndefined();
  });

  it('no match on ordinary victory — procedural keeps variant fingerprint', () => {
    expect(pickAuthoredTartan(plainWin)).toBeUndefined();
  });

  it('Ironmoor victory → ironmoor_crown', () => {
    expect(pickAuthoredTartan(ironmoorWin)?.id).toBe('ironmoor_crown');
  });

  it('cursed victory → cursed_triumph', () => {
    expect(pickAuthoredTartan(cursedWin)?.id).toBe('cursed_triumph');
  });

  it('post-Bell victory → taxman_reckoning', () => {
    expect(pickAuthoredTartan(postBellWin)?.id).toBe('taxman_reckoning');
  });

  it('Ironmoor trumps cursed when both fire (priority tiebreak)', () => {
    expect(pickAuthoredTartan(ironCursedWin)?.id).toBe('ironmoor_crown');
  });

  it('cursed trumps post-Bell when both fire (priority tiebreak)', () => {
    expect(pickAuthoredTartan(cursedPostBellWin)?.id).toBe('cursed_triumph');
  });

  it('Ironmoor death does NOT unlock — authored preset gates on victory', () => {
    expect(pickAuthoredTartan(ironmoorLoss)).toBeUndefined();
  });

  it('every authored preset has a distinct id', () => {
    const ids = AUTHORED_TARTANS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every authored preset has a valid 4-colour palette', () => {
    const hex = /^#[0-9a-fA-F]{6}$/;
    for (const t of AUTHORED_TARTANS) {
      expect(t.profile.base).toMatch(hex);
      expect(t.profile.primary).toMatch(hex);
      expect(t.profile.secondary).toMatch(hex);
      expect(t.profile.accent).toMatch(hex);
    }
  });

  it('every authored preset has a distinct palette signature', () => {
    const sigs = AUTHORED_TARTANS.map(
      (t) => `${t.profile.base}|${t.profile.primary}|${t.profile.secondary}|${t.profile.accent}`,
    );
    expect(new Set(sigs).size).toBe(sigs.length);
  });

  it('priorities are strictly ordered — no ties', () => {
    const priorities = AUTHORED_TARTANS.map((t) => t.priority);
    expect(new Set(priorities).size).toBe(priorities.length);
  });
});
