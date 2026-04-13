import { describe, expect, it, vi, beforeEach } from 'vitest';

describe('audioContext', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('returns null when AudioContext construction fails', async () => {
    vi.stubGlobal(
      'AudioContext',
      class {
        constructor() {
          throw new Error('unavailable');
        }
      },
    );
    const { getAudioContext, getOutputNode } = await import('./audioContext');
    expect(getAudioContext()).toBeNull();
    expect(getOutputNode()).toBeNull();
  });

  it('returns the same context until it is closed', async () => {
    vi.stubGlobal(
      'AudioContext',
      class Fake {
        state = 'running';
        destination = {} as AudioDestinationNode;
        createDynamicsCompressor() {
          return {
            threshold: { value: 0 },
            knee: { value: 0 },
            ratio: { value: 0 },
            connect: vi.fn(),
            disconnect: vi.fn(),
          };
        }
      },
    );
    const { getAudioContext } = await import('./audioContext');
    const a = getAudioContext();
    const b = getAudioContext();
    expect(a).not.toBeNull();
    expect(b).toBe(a);
  });

  it('recreates context and disconnects the old compressor when state is closed', async () => {
    vi.stubGlobal(
      'AudioContext',
      class Fake {
        state = 'running';
        destination = {} as AudioDestinationNode;
        createDynamicsCompressor() {
          return {
            threshold: { value: 0 },
            knee: { value: 0 },
            ratio: { value: 0 },
            connect: vi.fn(),
            disconnect: vi.fn(),
          };
        }
      },
    );
    const { getAudioContext, getOutputNode } = await import('./audioContext');
    const first = getAudioContext()!;
    const out = getOutputNode();
    expect(out).not.toBeNull();
    (first as unknown as { state: string }).state = 'closed';
    const second = getAudioContext();
    expect(second).not.toBeNull();
    expect(second).not.toBe(first);
    expect((out as unknown as { disconnect: ReturnType<typeof vi.fn> }).disconnect).toHaveBeenCalled();
  });

  it('getOutputNode refreshes via getAudioContext and returns the compressor', async () => {
    vi.stubGlobal(
      'AudioContext',
      class Fake {
        state = 'running';
        destination = {} as AudioDestinationNode;
        createDynamicsCompressor() {
          return {
            threshold: { value: 0 },
            knee: { value: 0 },
            ratio: { value: 0 },
            connect: vi.fn(),
            disconnect: vi.fn(),
          };
        }
      },
    );
    const { getOutputNode } = await import('./audioContext');
    const node = getOutputNode();
    expect(node).not.toBeNull();
    expect((node as unknown as { connect: ReturnType<typeof vi.fn> }).connect).toHaveBeenCalled();
  });
});
