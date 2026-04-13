import { describe, expect, it } from 'vitest';
import { classifyDeath, headlineKeyFor, tipKeyFor, type ClassifierInput } from './deathCauseClassifier';
import type { DamageEvent } from '../systems/DeathCauseTracker';
import { HAZARD_SOURCE_KEY } from '../systems/DeathCauseTracker';

function hit(overrides: Partial<DamageEvent> = {}): DamageEvent {
  return {
    gameTimeSec: 100,
    sourceKey: 'tourist',
    amount: 3,
    sourceIsBoss: false,
    sourceIsElite: false,
    sourceIsHazard: false,
    hpAfter: 10,
    maxHpAfter: 100,
    ...overrides,
  };
}

function input(events: DamageEvent[], opts: Partial<ClassifierInput> = {}): ClassifierInput {
  const deathTime = events.length > 0 ? events[events.length - 1].gameTimeSec : 0;
  return {
    events,
    lastHealthyAtSec: deathTime, // default: healthy right up to the end
    deathGameTimeSec: deathTime,
    ...opts,
  };
}

describe('classifyDeath', () => {
  it('no events → unlucky (tracker was empty at death)', () => {
    const c = classifyDeath(input([]));
    expect(c.tag).toBe('unlucky');
    expect(c.sourceKey).toBeNull();
  });

  it('last hit was a hazard → hazard', () => {
    const c = classifyDeath(input([
      hit({ sourceKey: 'taxman', sourceIsBoss: true }), // earlier boss hit — shouldn't override hazard
      hit({ sourceKey: HAZARD_SOURCE_KEY, sourceIsHazard: true, hpAfter: 0, amount: 3 }),
    ]));
    expect(c.tag).toBe('hazard');
    expect(c.sourceKey).toBeNull();
  });

  it('last hit from a boss → boss_crushed with source key', () => {
    const c = classifyDeath(input([
      hit(),
      hit({ sourceKey: 'taxman', sourceIsBoss: true, hpAfter: 0, amount: 20, maxHpAfter: 100 }),
    ]));
    expect(c.tag).toBe('boss_crushed');
    expect(c.sourceKey).toBe('taxman');
  });

  it('last hit from an elite (non-boss) → elite_kill', () => {
    const c = classifyDeath(input([
      hit({ sourceKey: 'chef', sourceIsElite: true, hpAfter: 0, amount: 8 }),
    ]));
    expect(c.tag).toBe('elite_kill');
    expect(c.sourceKey).toBe('chef');
  });

  it('one-shot when last hit takes >= 50% of max HP', () => {
    const c = classifyDeath(input([
      hit({ sourceKey: 'highland_cow', amount: 60, maxHpAfter: 100, hpAfter: 0 }),
    ]));
    expect(c.tag).toBe('one_shot');
    expect(c.sourceKey).toBe('highland_cow');
  });

  it('boss takes priority over one-shot when both would apply', () => {
    const c = classifyDeath(input([
      hit({ sourceKey: 'taxman', sourceIsBoss: true, amount: 80, maxHpAfter: 100, hpAfter: 0 }),
    ]));
    expect(c.tag).toBe('boss_crushed');
  });

  it('same_killer when 3+ hits from same enemy in last 3s', () => {
    const c = classifyDeath(input([
      hit({ sourceKey: 'highland_cow', gameTimeSec: 98.5 }),
      hit({ sourceKey: 'highland_cow', gameTimeSec: 99.2 }),
      hit({ sourceKey: 'highland_cow', gameTimeSec: 99.8, hpAfter: 0, amount: 2 }),
    ]));
    expect(c.tag).toBe('same_killer');
    expect(c.sourceKey).toBe('highland_cow');
    expect(c.hitsFromSource).toBe(3);
  });

  it('old hits outside 3s window do NOT contribute to same_killer', () => {
    const c = classifyDeath(input([
      hit({ sourceKey: 'highland_cow', gameTimeSec: 80 }),  // 20s ago — excluded
      hit({ sourceKey: 'highland_cow', gameTimeSec: 85 }),  // excluded
      hit({ sourceKey: 'sheep', gameTimeSec: 99.5 }),
      hit({ sourceKey: 'sheep', gameTimeSec: 100, hpAfter: 0, amount: 2 }),
    ], { deathGameTimeSec: 100 }));
    // Only 2 recent sheep hits + 0 cows in window → not same_killer, only 1 distinct source → not swarmed → unlucky
    expect(c.tag).toBe('unlucky');
  });

  it('swarmed when 3+ distinct sources hit in last 3s (none dominant)', () => {
    const c = classifyDeath(input([
      hit({ sourceKey: 'tourist', gameTimeSec: 98 }),
      hit({ sourceKey: 'sheep', gameTimeSec: 99 }),
      hit({ sourceKey: 'terrier', gameTimeSec: 99.5 }),
      hit({ sourceKey: 'eagle', gameTimeSec: 99.9, hpAfter: 0, amount: 2 }),
    ]));
    expect(c.tag).toBe('swarmed');
    expect(c.sourceKey).toBeNull();
  });

  it('low_hp_neglect when player sat below 30% for >= 8s with no other pattern', () => {
    // One mild hit so events non-empty, no boss/elite/hazard/oneshot/samekill/swarm.
    const c = classifyDeath(input(
      [hit({ sourceKey: 'tourist', amount: 2, hpAfter: 0, maxHpAfter: 100, gameTimeSec: 100 })],
      { lastHealthyAtSec: 90, deathGameTimeSec: 100 }
    ));
    expect(c.tag).toBe('low_hp_neglect');
  });

  it('low_hp_neglect does NOT fire when another pattern wins', () => {
    const c = classifyDeath(input(
      [hit({ sourceKey: 'taxman', sourceIsBoss: true, amount: 20, hpAfter: 0, gameTimeSec: 100 })],
      { lastHealthyAtSec: 50, deathGameTimeSec: 100 }
    ));
    expect(c.tag).toBe('boss_crushed');
  });

  it('unlucky fallback for single random hit with no other pattern', () => {
    const c = classifyDeath(input(
      [hit({ sourceKey: 'tourist', amount: 2, hpAfter: 0, maxHpAfter: 100 })],
      { lastHealthyAtSec: 99, deathGameTimeSec: 100 }
    ));
    expect(c.tag).toBe('unlucky');
  });

  it('two hits from same killer is NOT enough — threshold is 3', () => {
    const c = classifyDeath(input([
      hit({ sourceKey: 'highland_cow', gameTimeSec: 99 }),
      hit({ sourceKey: 'highland_cow', gameTimeSec: 100, hpAfter: 0, amount: 2 }),
    ]));
    expect(c.tag).toBe('unlucky');
  });
});

describe('i18n key helpers', () => {
  it('headlineKeyFor produces a stable dot-path per tag', () => {
    expect(headlineKeyFor({ tag: 'boss_crushed', sourceKey: 'taxman' })).toBe('ui.gameOver.whit_headline_boss_crushed');
    expect(headlineKeyFor({ tag: 'unlucky', sourceKey: null })).toBe('ui.gameOver.whit_headline_unlucky');
  });

  it('tipKeyFor matches the tag', () => {
    expect(tipKeyFor({ tag: 'same_killer', sourceKey: 'highland_cow' })).toBe('ui.gameOver.whit_tip_same_killer');
  });
});
