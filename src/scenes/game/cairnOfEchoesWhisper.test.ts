import { describe, expect, it } from 'vitest';
import {
  pickWhisper,
  type WhisperPickContext,
} from './cairnOfEchoesWhisper';

function ctx(overrides: Partial<WhisperPickContext> = {}): WhisperPickContext {
  return {
    variantKey: 'classic',
    isFirstDeathTouchEver: false,
    oldDroverRevealedCount: 0,
    rngSample: 0.5,
    ...overrides,
  };
}

describe('pickWhisper — past-self routing', () => {
  it('routes Cailleach variant to cailleach line', () => {
    const result = pickWhisper(ctx({ variantKey: 'cailleach', rngSample: 0.5 }));
    expect(result.kind).toBe('past_self');
    expect(result.i18nKey).toBe('ui.cairn.whisper.past_self.cailleach');
  });

  it('routes unsupported variant to classic line', () => {
    const result = pickWhisper(ctx({ variantKey: 'iron_belly', rngSample: 0.5 }));
    expect(result.kind).toBe('past_self');
    expect(result.i18nKey).toBe('ui.cairn.whisper.past_self.classic');
  });

  it('routes first death ever to first_death line regardless of variant', () => {
    const result = pickWhisper(ctx({ variantKey: 'cailleach', isFirstDeathTouchEver: true, rngSample: 0.5 }));
    expect(result.kind).toBe('past_self');
    expect(result.i18nKey).toBe('ui.cairn.whisper.past_self.first_death');
  });
});

describe('pickWhisper — grandfather routing', () => {
  it('grandfather roll fires below the threshold', () => {
    const result = pickWhisper(ctx({ rngSample: 0.005 }));
    expect(result.kind).toBe('grandfather');
    expect(result.i18nKey).toBe('ui.cairn.grandfather.01');
  });

  it('grandfather sequence advances with revealed count', () => {
    const result = pickWhisper(ctx({ rngSample: 0.005, oldDroverRevealedCount: 7 }));
    expect(result.kind).toBe('grandfather');
    expect(result.i18nKey).toBe('ui.cairn.grandfather.08');
  });

  it('grandfather caps at 25 — no roll at full', () => {
    const result = pickWhisper(ctx({ rngSample: 0.005, oldDroverRevealedCount: 25 }));
    expect(result.kind).toBe('past_self');
  });

  it('roll above threshold goes to past-self', () => {
    const result = pickWhisper(ctx({ rngSample: 0.5 }));
    expect(result.kind).toBe('past_self');
  });

  it('grandfather + first_death prefers first_death (rule order)', () => {
    const result = pickWhisper(ctx({ isFirstDeathTouchEver: true, rngSample: 0.005 }));
    expect(result.kind).toBe('past_self');
    expect(result.i18nKey).toBe('ui.cairn.whisper.past_self.first_death');
  });
});

describe('pickWhisper — determinism', () => {
  it('same seed sample → same result', () => {
    const a = pickWhisper(ctx({ rngSample: 0.42 }));
    const b = pickWhisper(ctx({ rngSample: 0.42 }));
    expect(a).toEqual(b);
  });
});
