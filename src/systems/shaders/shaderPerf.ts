export interface PerfProbe {
  readonly samples: number;
  record(ms: number): void;
  measure<T>(fn: () => T): T;
  avg(): number;
  max(): number;
  reset(): void;
}

export function createPerfProbe(windowSize = 60): PerfProbe {
  const buf: number[] = [];
  let cursor = 0;

  const push = (ms: number): void => {
    if (buf.length < windowSize) {
      buf.push(ms);
    } else {
      buf[cursor] = ms;
      cursor = (cursor + 1) % windowSize;
    }
  };

  return {
    get samples() { return buf.length; },
    record(ms: number): void {
      push(ms);
    },
    measure<T>(fn: () => T): T {
      const t0 = performance.now();
      try {
        return fn();
      } finally {
        push(performance.now() - t0);
      }
    },
    avg(): number {
      if (buf.length === 0) return 0;
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i];
      return sum / buf.length;
    },
    max(): number {
      if (buf.length === 0) return 0;
      let m = buf[0];
      for (let i = 1; i < buf.length; i++) if (buf[i] > m) m = buf[i];
      return m;
    },
    reset(): void {
      buf.length = 0;
      cursor = 0;
    },
  };
}
