import { describe, expect, it, vi } from 'vitest';
import { playPastSelfWhisper, playGrandfatherWhisper } from './cairnWhisper';

function stubCtx(): { ctx: AudioContext; created: { type: string }[] } {
  const created: { type: string }[] = [];
  const ctx = {
    currentTime: 0,
    sampleRate: 44_100,
    destination: {} as AudioNode,
    createBuffer: vi.fn((channels: number, length: number, _rate: number) => ({
      length,
      numberOfChannels: channels,
      duration: length / 44_100,
      getChannelData: vi.fn(() => new Float32Array(length)),
    })),
    createBufferSource: vi.fn(() => {
      const node = {
        buffer: null,
        connect: vi.fn(() => node),
        start: vi.fn(),
        stop: vi.fn(),
      };
      created.push({ type: 'bufferSource' });
      return node;
    }),
    createGain: vi.fn(() => ({
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    })),
    createBiquadFilter: vi.fn(() => ({
      type: 'lowpass',
      frequency: { setValueAtTime: vi.fn() },
      Q: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
    })),
  } as unknown as AudioContext;
  return { ctx, created };
}

describe('cairnWhisper synths', () => {
  it('past-self whisper schedules a buffer source', () => {
    const { ctx, created } = stubCtx();
    const gain = ctx.createGain();
    playPastSelfWhisper(ctx, 12345, gain as GainNode);
    expect(created.find((n) => n.type === 'bufferSource')).toBeTruthy();
  });

  it('grandfather whisper schedules a buffer source', () => {
    const { ctx, created } = stubCtx();
    const gain = ctx.createGain();
    playGrandfatherWhisper(ctx, 12345, gain as GainNode);
    expect(created.find((n) => n.type === 'bufferSource')).toBeTruthy();
  });

  it('same seed produces same shape (determinism)', () => {
    const a = stubCtx();
    playPastSelfWhisper(a.ctx, 999, a.ctx.createGain() as GainNode);
    const b = stubCtx();
    playPastSelfWhisper(b.ctx, 999, b.ctx.createGain() as GainNode);
    expect(a.created.length).toBe(b.created.length);
  });

  it('past-self uses shorter buffer duration than grandfather', () => {
    const a = stubCtx();
    playPastSelfWhisper(a.ctx, 1, a.ctx.createGain() as GainNode);
    const b = stubCtx();
    playGrandfatherWhisper(b.ctx, 1, b.ctx.createGain() as GainNode);
    // both call createBuffer with (channels, lengthSamples, rate)
    const aLen = (a.ctx.createBuffer as ReturnType<typeof vi.fn>).mock.calls[0][1];
    const bLen = (b.ctx.createBuffer as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(aLen).toBeLessThan(bLen);
  });
});
