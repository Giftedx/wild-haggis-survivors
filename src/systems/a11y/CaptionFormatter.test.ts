import { describe, it, expect } from 'vitest';
import { formatCaption } from './CaptionFormatter';

describe('formatCaption', () => {
  it('wraps an SFX event in square brackets', () => {
    expect(formatCaption({ type: 'sfx', label: 'bodhrán drop' })).toBe('[bodhrán drop]');
  });

  it('prefixes an SFX direction arrow when present', () => {
    expect(formatCaption({ type: 'sfx', label: 'boss approaching', direction: 'E' }))
      .toBe('[→ boss approaching]');
    expect(formatCaption({ type: 'sfx', label: 'rumble', direction: 'NW' }))
      .toBe('[↖ rumble]');
  });

  it('prefixes a music event with ♪', () => {
    expect(formatCaption({ type: 'music', label: 'pibroch swell' }))
      .toBe('♪ pibroch swell');
  });

  it('renders speech as "speaker: text" when speaker present', () => {
    expect(formatCaption({ type: 'speech', speaker: 'Gran', text: 'Mind how ye go' }))
      .toBe('Gran: Mind how ye go');
  });

  it('renders anonymous speech as plain text', () => {
    expect(formatCaption({ type: 'speech', text: 'The moor mourns.' }))
      .toBe('The moor mourns.');
  });

  it('trims whitespace around SFX / music labels', () => {
    expect(formatCaption({ type: 'sfx', label: '  low hum  ' })).toBe('[low hum]');
    expect(formatCaption({ type: 'music', label: ' fiddle joins ' })).toBe('♪ fiddle joins');
  });
});
