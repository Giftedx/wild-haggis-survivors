/**
 * nodeMapLifecycle — install + teardown contract for the node-map
 * subsystem (NodeMapUI + NodePromptUI + NodeMapSystem trigger listener
 * + NodeWaveTracker reset). Pure tests; do NOT boot Phaser (per
 * CLAUDE.md "Phaser imports break in node-env vitest").
 *
 * Coverage matrix:
 *   - install constructs both UIs, writes them via the setters, and
 *     returns the refs (one test per concern).
 *   - install registers the trigger listener on `nodeMapSystem`.
 *   - install order: setters fire BEFORE the trigger listener is
 *     registered (replay-determinism load-bearing).
 *   - tearDown calls `nodeMapSystem.reset()` and `nodeWaveTracker.reset()`.
 *   - tearDown destroys both UIs.
 *   - tearDown nulls both UI fields via the setters.
 *   - tearDown order: resets fire BEFORE destroys; setters fire AFTER
 *     destroys (Option A contract — run-state flush always lands even
 *     if a destroy throws).
 *   - tearDown propagates errors from `nodeMapUI.destroy()` (caller-
 *     decides-policy contract).
 *   - tearDown propagates errors from `nodePromptUI.destroy()` (mirror).
 *   - tearDown handles null UI refs without throwing (`?.destroy()`
 *     short-circuits, setters still null them).
 *   - Two installs in sequence (scene reuse) construct two fresh UIs
 *     and a tearDown between them clears the first cleanly.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the UI constructors before the helper imports them — vitest
// hoists `vi.mock` to the top of the file. Both UIs touch Phaser at
// runtime; the mocks replace the classes with bare-minimum stubs that
// expose `destroy` as a vitest-spy.
vi.mock('../../ui/NodeMapUI', () => {
  const destroy = vi.fn();
  class NodeMapUI {
    public destroy = destroy;
    constructor(public readonly scene: object) {}
  }
  return { NodeMapUI };
});

vi.mock('../../ui/NodePromptUI', () => {
  const destroy = vi.fn();
  class NodePromptUI {
    public destroy = destroy;
    constructor(public readonly scene: object) {}
  }
  return { NodePromptUI };
});

import {
  installNodeMap,
  tearDownNodeMap,
  type NodeMapInstallDeps,
  type NodeMapTeardownDeps,
  type NodeMapTriggerListener,
} from './nodeMapLifecycle';
import { NodeMapUI } from '../../ui/NodeMapUI';
import { NodePromptUI } from '../../ui/NodePromptUI';
import type { NodeMapSystem } from '../../systems/NodeMapSystem';
import type { NodeWaveTracker } from '../../systems/nodeEvents/NodeWaveTracker';

interface InstallLog {
  events: string[];
  push: (label: string) => void;
}

function makeLog(): InstallLog {
  const events: string[] = [];
  return { events, push: (label) => events.push(label) };
}

interface InstallRefs {
  nodeMapUI: NodeMapUI | null;
  nodePromptUI: NodePromptUI | null;
}

function makeInstallDeps(
  log: InstallLog,
  refs: InstallRefs,
  onNodeTrigger?: NodeMapTriggerListener,
): NodeMapInstallDeps {
  return {
    scene: { id: 'scene' } as unknown as Phaser.Scene,
    nodeMapSystem: {
      setTriggerListener: vi.fn((_listener) => {
        log.push('nodeMapSystem.setTriggerListener');
      }),
    } as unknown as NodeMapSystem,
    nodeWaveTracker: { reset: vi.fn() } as unknown as NodeWaveTracker,
    setNodeMapUI: vi.fn((next) => {
      refs.nodeMapUI = next;
      log.push(`set:nodeMapUI=${next === null ? 'null' : 'value'}`);
    }),
    setNodePromptUI: vi.fn((next) => {
      refs.nodePromptUI = next;
      log.push(`set:nodePromptUI=${next === null ? 'null' : 'value'}`);
    }),
    onNodeTrigger:
      onNodeTrigger ??
      ((_index, _state) => {
        log.push('onNodeTrigger');
      }),
  };
}

function makeTeardownDeps(
  log: InstallLog,
  refs: InstallRefs,
  options: {
    throwingNodeMapDestroy?: boolean;
    throwingNodePromptDestroy?: boolean;
  } = {},
): NodeMapTeardownDeps {
  // Wire spies on the existing refs' destroy methods to capture order.
  // Both `nodeMapUI` and `nodePromptUI` are vitest-mocked instances
  // created via `installNodeMap` in the test setup; we replace the
  // mock's destroy with a fresh vi.fn that pushes to the shared log.
  if (refs.nodeMapUI) {
    (refs.nodeMapUI as { destroy: () => void }).destroy = vi.fn(() => {
      log.push('nodeMapUI.destroy');
      if (options.throwingNodeMapDestroy) {
        throw new Error('nodeMapUI destroy boom');
      }
    });
  }
  if (refs.nodePromptUI) {
    (refs.nodePromptUI as { destroy: () => void }).destroy = vi.fn(() => {
      log.push('nodePromptUI.destroy');
      if (options.throwingNodePromptDestroy) {
        throw new Error('nodePromptUI destroy boom');
      }
    });
  }

  return {
    nodeMapSystem: {
      reset: vi.fn(() => log.push('nodeMapSystem.reset')),
    } as unknown as NodeMapSystem,
    nodeWaveTracker: {
      reset: vi.fn(() => log.push('nodeWaveTracker.reset')),
    } as unknown as NodeWaveTracker,
    nodeMapUI: refs.nodeMapUI,
    nodePromptUI: refs.nodePromptUI,
    setNodeMapUI: vi.fn((next) => {
      refs.nodeMapUI = next;
      log.push(`set:nodeMapUI=${next === null ? 'null' : 'value'}`);
    }),
    setNodePromptUI: vi.fn((next) => {
      refs.nodePromptUI = next;
      log.push(`set:nodePromptUI=${next === null ? 'null' : 'value'}`);
    }),
  };
}

describe('installNodeMap', () => {
  let log: InstallLog;
  let refs: InstallRefs;

  beforeEach(() => {
    log = makeLog();
    refs = { nodeMapUI: null, nodePromptUI: null };
  });

  it('constructs both UIs', () => {
    const deps = makeInstallDeps(log, refs);
    const result = installNodeMap(deps);
    expect(result.nodeMapUI).toBeInstanceOf(NodeMapUI);
    expect(result.nodePromptUI).toBeInstanceOf(NodePromptUI);
  });

  it('writes both UIs via the setters', () => {
    const deps = makeInstallDeps(log, refs);
    installNodeMap(deps);
    expect(deps.setNodeMapUI).toHaveBeenCalledTimes(1);
    expect(deps.setNodePromptUI).toHaveBeenCalledTimes(1);
    expect(refs.nodeMapUI).toBeInstanceOf(NodeMapUI);
    expect(refs.nodePromptUI).toBeInstanceOf(NodePromptUI);
  });

  it('returns the constructed refs', () => {
    const deps = makeInstallDeps(log, refs);
    const result = installNodeMap(deps);
    // The refs returned must be the SAME instances as the ones written
    // via the setters — caller can use either path.
    expect(result.nodeMapUI).toBe(refs.nodeMapUI);
    expect(result.nodePromptUI).toBe(refs.nodePromptUI);
  });

  it('registers the trigger listener on nodeMapSystem', () => {
    const trigger: NodeMapTriggerListener = vi.fn();
    const deps = makeInstallDeps(log, refs, trigger);
    installNodeMap(deps);
    expect(deps.nodeMapSystem.setTriggerListener).toHaveBeenCalledTimes(1);
    expect(deps.nodeMapSystem.setTriggerListener).toHaveBeenCalledWith(trigger);
  });

  it('passes the user-supplied onNodeTrigger callback through verbatim', () => {
    // The helper must not wrap or rebind onNodeTrigger — the GameScene
    // closure captures `this` for re-resolving `nodePromptUI`, and a
    // wrapper would break the stale-callback-guard pattern.
    const trigger: NodeMapTriggerListener = vi.fn();
    const deps = makeInstallDeps(log, refs, trigger);
    installNodeMap(deps);
    const passed = (deps.nodeMapSystem.setTriggerListener as unknown as {
      mock: { calls: Array<[NodeMapTriggerListener]> };
    }).mock.calls[0][0];
    expect(passed).toBe(trigger);
  });

  it('passes the scene to both UI constructors', () => {
    const deps = makeInstallDeps(log, refs);
    const result = installNodeMap(deps);
    // The mock NodeMapUI / NodePromptUI store their constructor scene
    // on `.scene` for inspection.
    expect((result.nodeMapUI as unknown as { scene: object }).scene).toBe(deps.scene);
    expect((result.nodePromptUI as unknown as { scene: object }).scene).toBe(deps.scene);
  });

  it('runs setters BEFORE registering the trigger listener (replay-determinism order)', () => {
    // Pre-extraction order: UIs constructed + assigned to scene fields,
    // THEN setTriggerListener fires (the trigger listener body reads
    // `this.nodePromptUI` via captured-this, so the field must be set
    // before the listener could ever run). The helper preserves this.
    const deps = makeInstallDeps(log, refs);
    installNodeMap(deps);
    const setNodeMapUIIdx = log.events.indexOf('set:nodeMapUI=value');
    const setNodePromptUIIdx = log.events.indexOf('set:nodePromptUI=value');
    const setTriggerIdx = log.events.indexOf('nodeMapSystem.setTriggerListener');
    expect(setNodeMapUIIdx).toBeGreaterThanOrEqual(0);
    expect(setNodePromptUIIdx).toBeGreaterThanOrEqual(0);
    expect(setTriggerIdx).toBeGreaterThanOrEqual(0);
    expect(setNodeMapUIIdx).toBeLessThan(setTriggerIdx);
    expect(setNodePromptUIIdx).toBeLessThan(setTriggerIdx);
  });

  it('two installs in sequence construct two fresh UIs (scene reuse)', () => {
    // Recycled scene instances (per CLAUDE.md "Scene reuse") install a
    // new node-map every `create()` after a tearDown. The helper does
    // not memoize — every install builds new UIs.
    const a = makeInstallDeps(log, refs);
    const first = installNodeMap(a);
    // Pretend a tearDown happens between installs.
    refs.nodeMapUI = null;
    refs.nodePromptUI = null;
    const b = makeInstallDeps(log, refs);
    const second = installNodeMap(b);
    expect(second.nodeMapUI).not.toBe(first.nodeMapUI);
    expect(second.nodePromptUI).not.toBe(first.nodePromptUI);
  });
});

describe('tearDownNodeMap', () => {
  let log: InstallLog;
  let refs: InstallRefs;

  beforeEach(() => {
    log = makeLog();
    refs = { nodeMapUI: null, nodePromptUI: null };
    // Pre-install the node-map so teardown has live refs to destroy.
    const installLog = makeLog();
    installNodeMap(makeInstallDeps(installLog, refs));
  });

  it('resets nodeMapSystem', () => {
    const deps = makeTeardownDeps(log, refs);
    tearDownNodeMap(deps);
    expect(deps.nodeMapSystem.reset).toHaveBeenCalledTimes(1);
  });

  it('resets nodeWaveTracker', () => {
    const deps = makeTeardownDeps(log, refs);
    tearDownNodeMap(deps);
    expect(deps.nodeWaveTracker.reset).toHaveBeenCalledTimes(1);
  });

  it('destroys nodeMapUI', () => {
    const deps = makeTeardownDeps(log, refs);
    const ui = deps.nodeMapUI as NodeMapUI;
    tearDownNodeMap(deps);
    expect(ui.destroy).toHaveBeenCalledTimes(1);
  });

  it('destroys nodePromptUI', () => {
    const deps = makeTeardownDeps(log, refs);
    const ui = deps.nodePromptUI as NodePromptUI;
    tearDownNodeMap(deps);
    expect(ui.destroy).toHaveBeenCalledTimes(1);
  });

  it('nulls nodeMapUI via the setter', () => {
    const deps = makeTeardownDeps(log, refs);
    tearDownNodeMap(deps);
    expect(deps.setNodeMapUI).toHaveBeenCalledWith(null);
    expect(refs.nodeMapUI).toBeNull();
  });

  it('nulls nodePromptUI via the setter', () => {
    const deps = makeTeardownDeps(log, refs);
    tearDownNodeMap(deps);
    expect(deps.setNodePromptUI).toHaveBeenCalledWith(null);
    expect(refs.nodePromptUI).toBeNull();
  });

  it('runs system resets BEFORE any destroy (run-state flush precedes UI teardown)', () => {
    // Even if a destroy throws and the caller's outer try/catch
    // silences it, the system + tracker resets must already have
    // landed. Order: nodeMapSystem.reset → nodeWaveTracker.reset →
    // nodeMapUI.destroy → nodePromptUI.destroy.
    const deps = makeTeardownDeps(log, refs);
    tearDownNodeMap(deps);
    const sysIdx = log.events.indexOf('nodeMapSystem.reset');
    const trackerIdx = log.events.indexOf('nodeWaveTracker.reset');
    const mapDestroyIdx = log.events.indexOf('nodeMapUI.destroy');
    const promptDestroyIdx = log.events.indexOf('nodePromptUI.destroy');
    expect(sysIdx).toBeGreaterThanOrEqual(0);
    expect(trackerIdx).toBeGreaterThanOrEqual(0);
    expect(mapDestroyIdx).toBeGreaterThanOrEqual(0);
    expect(promptDestroyIdx).toBeGreaterThanOrEqual(0);
    // resets BEFORE destroys
    expect(sysIdx).toBeLessThan(mapDestroyIdx);
    expect(trackerIdx).toBeLessThan(mapDestroyIdx);
    expect(sysIdx).toBeLessThan(promptDestroyIdx);
    expect(trackerIdx).toBeLessThan(promptDestroyIdx);
  });

  it('runs setters with null AFTER destroys (destroy/null pair preserved)', () => {
    // Pre-extraction shape:
    //   nodeMapUI?.destroy(); nodeMapUI = null;
    //   nodePromptUI?.destroy(); nodePromptUI = null;
    // The helper preserves the destroy/null pair order.
    const deps = makeTeardownDeps(log, refs);
    tearDownNodeMap(deps);
    const mapDestroyIdx = log.events.indexOf('nodeMapUI.destroy');
    const setMapNullIdx = log.events.indexOf('set:nodeMapUI=null');
    const promptDestroyIdx = log.events.indexOf('nodePromptUI.destroy');
    const setPromptNullIdx = log.events.indexOf('set:nodePromptUI=null');
    expect(mapDestroyIdx).toBeLessThan(setMapNullIdx);
    expect(promptDestroyIdx).toBeLessThan(setPromptNullIdx);
  });

  it('propagates errors from nodeMapUI.destroy() (Option A: caller decides policy)', () => {
    // The helper does NOT try/catch internally — it's the caller's
    // responsibility (resetTransientRunState bare; runEndShutdown
    // wrapped). A throwing destroy must bubble.
    const deps = makeTeardownDeps(log, refs, { throwingNodeMapDestroy: true });
    expect(() => tearDownNodeMap(deps)).toThrow(/nodeMapUI destroy boom/);
  });

  it('propagates errors from nodePromptUI.destroy() (Option A mirror)', () => {
    const deps = makeTeardownDeps(log, refs, { throwingNodePromptDestroy: true });
    expect(() => tearDownNodeMap(deps)).toThrow(/nodePromptUI destroy boom/);
  });

  it('handles null nodeMapUI ref without throwing (`?.destroy()` short-circuit)', () => {
    // Partial-init: a previous teardown ran but nothing was constructed
    // before. Both refs are null. tearDown still runs the resets and
    // calls the setters; the optional-chain prevents the crash.
    refs.nodeMapUI = null;
    refs.nodePromptUI = null;
    const deps = makeTeardownDeps(log, refs);
    expect(() => tearDownNodeMap(deps)).not.toThrow();
    expect(deps.nodeMapSystem.reset).toHaveBeenCalledTimes(1);
    expect(deps.nodeWaveTracker.reset).toHaveBeenCalledTimes(1);
    expect(deps.setNodeMapUI).toHaveBeenCalledWith(null);
    expect(deps.setNodePromptUI).toHaveBeenCalledWith(null);
  });

  it('handles null nodePromptUI alone without throwing (asymmetric partial-init)', () => {
    refs.nodePromptUI = null;
    const deps = makeTeardownDeps(log, refs);
    expect(() => tearDownNodeMap(deps)).not.toThrow();
    // nodeMapUI was destroyed; nodePromptUI was just nulled.
    const mapDestroyIdx = log.events.indexOf('nodeMapUI.destroy');
    expect(mapDestroyIdx).toBeGreaterThanOrEqual(0);
    expect(log.events).not.toContain('nodePromptUI.destroy');
  });

  it('two installs/teardowns in sequence (full scene-reuse cycle)', () => {
    // First install was done in beforeEach. Run a teardown, then a
    // fresh install, then a second teardown — confirms idempotency
    // across reuse cycles.
    const td1 = makeTeardownDeps(log, refs);
    tearDownNodeMap(td1);
    expect(refs.nodeMapUI).toBeNull();
    expect(refs.nodePromptUI).toBeNull();

    const installLog2 = makeLog();
    installNodeMap(makeInstallDeps(installLog2, refs));
    expect(refs.nodeMapUI).toBeInstanceOf(NodeMapUI);
    expect(refs.nodePromptUI).toBeInstanceOf(NodePromptUI);

    // Wire fresh destroy spies on the new UIs so the second teardown's
    // log entries reflect the second cycle.
    const log3 = makeLog();
    const td2 = makeTeardownDeps(log3, refs);
    tearDownNodeMap(td2);
    expect(refs.nodeMapUI).toBeNull();
    expect(refs.nodePromptUI).toBeNull();
    expect(td2.nodeMapSystem.reset).toHaveBeenCalledTimes(1);
    expect(td2.nodeWaveTracker.reset).toHaveBeenCalledTimes(1);
  });
});
