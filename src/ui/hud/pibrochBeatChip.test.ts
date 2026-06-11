/**
 * Pibroch Beat Indicator — presenter tests.
 *
 * The chip's drawing code lives in Phaser; the *state* the chip
 * displays is computed by `applyPibrochBeatChipState`. We test the
 * pure helper against stubbed Phaser refs so the behaviour stays
 * regression-proof when CSS-style colour and visibility decisions
 * shift.
 *
 * Behavioural contracts under test:
 *  1. `visible: false` hides everything regardless of other state.
 *  2. `reducedMode: true` shows ONLY the label (no pip flicker) — the
 *     `reduceFlashing` accessibility setting must never see pulses.
 *  3. Full mode lights pips left-to-right based on `beatIndex % 4`.
 *  4. The crescendo (index-3) pip is brighter / wider colour than its
 *     three lead-in siblings.
 *  5. `aligned: true` brightens lit pips to full alpha; misaligned
 *     keeps them at the dimmer 0.8 alpha so the beat read stays clear.
 */
import { describe, it, expect } from 'vitest';
import { applyPibrochBeatChipState, type PibrochBeatChipRefs } from './pibrochBeatChip';

type StubRect = {
  visible: boolean;
  fillColor: number;
  fillAlpha: number;
  setVisible(v: boolean): StubRect;
  setFillStyle(color: number, alpha?: number): StubRect;
};

type StubText = {
  visible: boolean;
  setVisible(v: boolean): StubText;
};

function makeRect(): StubRect {
  const r: StubRect = {
    visible: false,
    fillColor: 0,
    fillAlpha: 1,
    setVisible(v: boolean) { r.visible = v; return r; },
    setFillStyle(color: number, alpha = 1) { r.fillColor = color; r.fillAlpha = alpha; return r; },
  };
  return r;
}

function makeText(): StubText {
  const t: StubText = {
    visible: false,
    setVisible(v: boolean) { t.visible = v; return t; },
  };
  return t;
}

function makeRefs(): PibrochBeatChipRefs {
  return {
    bg: makeRect() as unknown as PibrochBeatChipRefs['bg'],
    reducedLabel: makeText() as unknown as PibrochBeatChipRefs['reducedLabel'],
    pips: [makeRect(), makeRect(), makeRect(), makeRect()] as unknown as PibrochBeatChipRefs['pips'],
  };
}

describe('applyPibrochBeatChipState — visibility gate', () => {
  it('hides background, label, and every pip when visible is false', () => {
    const refs = makeRefs();
    applyPibrochBeatChipState(refs, {
      visible: false,
      reducedMode: false,
      beatIndex: 2,
      aligned: true,
    });
    expect((refs.bg as unknown as StubRect).visible).toBe(false);
    expect((refs.reducedLabel as unknown as StubText).visible).toBe(false);
    for (const pip of refs.pips) {
      expect((pip as unknown as StubRect).visible).toBe(false);
    }
  });
});

describe('applyPibrochBeatChipState — reduceFlashing mode', () => {
  it('shows only the static label, never any pips', () => {
    const refs = makeRefs();
    applyPibrochBeatChipState(refs, {
      visible: true,
      reducedMode: true,
      beatIndex: 7,
      aligned: true,
    });
    expect((refs.bg as unknown as StubRect).visible).toBe(true);
    expect((refs.reducedLabel as unknown as StubText).visible).toBe(true);
    for (const pip of refs.pips) {
      expect((pip as unknown as StubRect).visible).toBe(false);
    }
  });
});

describe('applyPibrochBeatChipState — full mode pip cycle', () => {
  it('lights the leftmost pip at beat 0 and dims the rest', () => {
    const refs = makeRefs();
    applyPibrochBeatChipState(refs, {
      visible: true,
      reducedMode: false,
      beatIndex: 0,
      aligned: false,
    });
    const pips = refs.pips as unknown as StubRect[];
    expect(pips[0].visible).toBe(true);
    expect(pips[0].fillAlpha).toBeCloseTo(0.8);
    expect(pips[1].fillAlpha).toBeCloseTo(0.55);
    expect(pips[2].fillAlpha).toBeCloseTo(0.55);
    expect(pips[3].fillAlpha).toBeCloseTo(0.55);
  });

  it('lights all four pips at beat 3 (crescendo)', () => {
    const refs = makeRefs();
    applyPibrochBeatChipState(refs, {
      visible: true,
      reducedMode: false,
      beatIndex: 3,
      aligned: false,
    });
    const pips = refs.pips as unknown as StubRect[];
    for (let i = 0; i < 4; i++) {
      expect(pips[i].visible).toBe(true);
      expect(pips[i].fillAlpha).toBeCloseTo(0.8);
    }
  });

  it('wraps beat index by mod 4 (beat 7 ~ beat 3)', () => {
    const refs = makeRefs();
    applyPibrochBeatChipState(refs, {
      visible: true,
      reducedMode: false,
      beatIndex: 7,
      aligned: false,
    });
    const pips = refs.pips as unknown as StubRect[];
    for (let i = 0; i < 4; i++) {
      expect(pips[i].fillAlpha).toBeCloseTo(0.8);
    }
  });

  it('clamps negative beat index to 0', () => {
    const refs = makeRefs();
    applyPibrochBeatChipState(refs, {
      visible: true,
      reducedMode: false,
      beatIndex: -5,
      aligned: false,
    });
    const pips = refs.pips as unknown as StubRect[];
    expect(pips[0].fillAlpha).toBeCloseTo(0.8);
    expect(pips[1].fillAlpha).toBeCloseTo(0.55);
  });
});

describe('applyPibrochBeatChipState — alignment brightness', () => {
  it('brightens lit pips to alpha 1 when aligned, 0.8 when misaligned', () => {
    const aligned = makeRefs();
    applyPibrochBeatChipState(aligned, {
      visible: true,
      reducedMode: false,
      beatIndex: 1,
      aligned: true,
    });
    expect(((aligned.pips as unknown as StubRect[])[0]).fillAlpha).toBeCloseTo(1);
    expect(((aligned.pips as unknown as StubRect[])[1]).fillAlpha).toBeCloseTo(1);

    const misaligned = makeRefs();
    applyPibrochBeatChipState(misaligned, {
      visible: true,
      reducedMode: false,
      beatIndex: 1,
      aligned: false,
    });
    expect(((misaligned.pips as unknown as StubRect[])[0]).fillAlpha).toBeCloseTo(0.8);
    expect(((misaligned.pips as unknown as StubRect[])[1]).fillAlpha).toBeCloseTo(0.8);
  });
});

describe('applyPibrochBeatChipState — crescendo distinction', () => {
  it('uses a distinct lit colour for the crescendo pip vs lead-in pips', () => {
    const refs = makeRefs();
    applyPibrochBeatChipState(refs, {
      visible: true,
      reducedMode: false,
      beatIndex: 3,
      aligned: true,
    });
    const pips = refs.pips as unknown as StubRect[];
    expect(pips[3].fillColor).not.toBe(pips[0].fillColor);
  });

  it('uses a distinct dim colour for the crescendo pip while still waiting', () => {
    const refs = makeRefs();
    applyPibrochBeatChipState(refs, {
      visible: true,
      reducedMode: false,
      beatIndex: 0,
      aligned: false,
    });
    const pips = refs.pips as unknown as StubRect[];
    expect(pips[3].fillColor).not.toBe(pips[1].fillColor);
  });
});
