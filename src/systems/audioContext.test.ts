import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

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

  it('installAudioActivationOnUserGesture registers pointer, touch, keyboard, and gamepad listeners', async () => {
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
    vi.stubGlobal('navigator', { getGamepads: () => [] });

    const types: string[] = [];
    const win = {
      addEventListener(type: string) {
        types.push(type);
      },
      removeEventListener: vi.fn(),
    } as unknown as Window & typeof globalThis;

    const { installAudioActivationOnUserGesture } = await import('./audioContext');
    installAudioActivationOnUserGesture(win);

    expect(types).toContain('pointerdown');
    expect(types).toContain('keydown');
    expect(types).toContain('touchstart');
    expect(types).toContain('gamepadconnected');
    expect(types).toContain('pagehide');
  });

  it('runWhenAudioActivated yields via macrotask once activated — regression: P4-13 microtask bomb', async () => {
    // Simulate headless-WebKit degraded state: ctx construction throws
    // so `getAudioContext` perpetually returns null post-activation. Before
    // the fix, a caller that re-queues on null (e.g. AudioSystem.ensureContext)
    // would chain `queueMicrotask` into an infinite tight loop that starved
    // the event loop and blocked Playwright `page.evaluate` messages.
    vi.stubGlobal(
      'AudioContext',
      class {
        constructor() {
          throw new Error('webkit-headless-style failure');
        }
      },
    );
    vi.stubGlobal('navigator', { getGamepads: () => [] });

    const listeners = new Map<string, EventListener>();
    const win = {
      addEventListener(type: string, listener: EventListener) {
        listeners.set(type, listener);
      },
      removeEventListener: vi.fn(),
      setInterval: () => 0,
      clearInterval: () => undefined,
    } as unknown as Window & typeof globalThis;

    const queueMicrotaskSpy = vi.fn((fn: () => void) => fn());
    const setTimeoutSpy = vi.fn();
    vi.stubGlobal('queueMicrotask', queueMicrotaskSpy);
    vi.stubGlobal('setTimeout', setTimeoutSpy);

    const mod = await import('./audioContext');
    mod.installAudioActivationOnUserGesture(win);

    // Pre-activation: queues on array, neither scheduler fires.
    let retryCount = 0;
    const retryCb = (): void => {
      retryCount += 1;
    };
    mod.runWhenAudioActivated(retryCb);
    expect(setTimeoutSpy).not.toHaveBeenCalled();
    expect(queueMicrotaskSpy).not.toHaveBeenCalled();

    // Fire gesture → activate. Flush drains queue via direct call, not
    // via setTimeout/queueMicrotask — so retryCount bumps once.
    listeners.get('keydown')?.({} as Event);
    expect(retryCount).toBe(1);

    // Post-activation re-queue must go through setTimeout (macrotask),
    // NOT queueMicrotask. That's the regression guard.
    mod.runWhenAudioActivated(retryCb);
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(queueMicrotaskSpy).not.toHaveBeenCalled();
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

describe('createRecordingAudioStream', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    process.env.VITEST = 'true';
  });

  afterEach(() => {
    delete process.env.VITEST;
  });

  it('returns a MediaStream when AudioContext is available', async () => {
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
        createMediaStreamDestination() {
          return {
            stream: new MediaStream(),
            connect: vi.fn(),
            disconnect: vi.fn(),
          };
        }
      },
    );
    vi.stubGlobal('MediaStream', class Fake {});

    const { createRecordingAudioStream, disposeRecordingAudioStream } = await import('./audioContext');
    const stream = createRecordingAudioStream();
    expect(stream).toBeInstanceOf(MediaStream);
    disposeRecordingAudioStream();
  });

  it('returns null when AudioContext is unavailable', async () => {
    vi.stubGlobal(
      'AudioContext',
      class {
        constructor() {
          throw new Error('unavailable');
        }
      },
    );
    const { createRecordingAudioStream, disposeRecordingAudioStream } = await import('./audioContext');
    const stream = createRecordingAudioStream();
    expect(stream).toBeNull();
    disposeRecordingAudioStream();
  });

  it('reuses the same destination node across calls', async () => {
    const destinations: unknown[] = [];
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
        createMediaStreamDestination() {
          const dest = {
            stream: new MediaStream(),
            connect: vi.fn(),
            disconnect: vi.fn(),
          };
          destinations.push(dest);
          return dest;
        }
      },
    );
    vi.stubGlobal('MediaStream', class Fake {});

    const { createRecordingAudioStream, disposeRecordingAudioStream } = await import('./audioContext');
    const a = createRecordingAudioStream();
    const b = createRecordingAudioStream();
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect(a).toBe(b);
    expect(destinations).toHaveLength(1);
    disposeRecordingAudioStream();
    const c = createRecordingAudioStream();
    expect(c).toBeDefined();
    expect(destinations).toHaveLength(2);
    disposeRecordingAudioStream();
  });
});
