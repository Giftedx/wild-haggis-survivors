import { describe, expect, it } from 'vitest';
import {
  CROFT_GREET_DEFAULT_KEY,
  pickGranGreetingKey,
} from './grudgeGreeting';

describe('pickGranGreetingKey', () => {
  it('returns the kettle greeting when no ledger exists (fresh save)', () => {
    expect(pickGranGreetingKey({})).toBe(CROFT_GREET_DEFAULT_KEY);
    expect(pickGranGreetingKey({ grudgeVerdictsLifetime: undefined })).toBe(
      CROFT_GREET_DEFAULT_KEY,
    );
  });

  it('returns the kettle greeting when only even verdicts are banked', () => {
    expect(pickGranGreetingKey({ grudgeVerdictsLifetime: { even: 12 } })).toBe(
      CROFT_GREET_DEFAULT_KEY,
    );
  });

  it('a single styled victory colours the greeting immediately', () => {
    expect(
      pickGranGreetingKey({ grudgeVerdictsLifetime: { reckless: 1 } }),
    ).toBe('ui.croft.gran_greet_grudge.reckless');
  });

  it('dominant verdict wins over smaller counts', () => {
    expect(
      pickGranGreetingKey({
        grudgeVerdictsLifetime: { coward: 5, precise: 2, even: 9 },
      }),
    ).toBe('ui.croft.gran_greet_grudge.coward');
  });

  it('even counts never outvote a styled verdict', () => {
    expect(
      pickGranGreetingKey({
        grudgeVerdictsLifetime: { even: 40, bruiser: 1 },
      }),
    ).toBe('ui.croft.gran_greet_grudge.bruiser');
  });

  it('ties resolve in judgeGrudge precedence order (precise > reckless > coward > bruiser)', () => {
    expect(
      pickGranGreetingKey({
        grudgeVerdictsLifetime: { bruiser: 3, coward: 3 },
      }),
    ).toBe('ui.croft.gran_greet_grudge.coward');
    expect(
      pickGranGreetingKey({
        grudgeVerdictsLifetime: { reckless: 3, precise: 3 },
      }),
    ).toBe('ui.croft.gran_greet_grudge.precise');
  });

  it('ignores unknown verdict keys a future save might carry', () => {
    expect(
      pickGranGreetingKey({
        grudgeVerdictsLifetime: { legendary: 99, precise: 1 },
      }),
    ).toBe('ui.croft.gran_greet_grudge.precise');
  });
});
