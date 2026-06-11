/**
 * T401 slice 7 — Node-map lifecycle install + teardown for GameScene.
 *
 * Pulls the install (NodeMapUI + NodePromptUI construction +
 * `nodeMapSystem.setTriggerListener` registration) and teardown
 * (`reset()` on `nodeMapSystem` + `nodeWaveTracker`, `destroy()` on
 * `nodeMapUI` + `nodePromptUI`, null both UIs) for the run-scoped
 * node-map subsystem out of `src/scenes/GameScene.ts` into a single
 * Phaser-import-free coordinator.
 *
 * Why extract: the run-scoped node-map has TWO destruction call sites
 * with divergent error-handling shapes:
 *   - `resetTransientRunState` (called from `create()` at scene reuse)
 *     uses bare `?.destroy()` — no try/catch. Bare destroys expose
 *     failures during dev so engineers notice partial-init regressions.
 *   - `runEndShutdown.ts` (called via `events.once('shutdown')`) wraps
 *     `nodeMapUI?.destroy()` and `nodePromptUI?.destroy()` in
 *     `try { … } catch { /* ignore *‍/ }` to keep the wider shutdown
 *     sequence going if a partial-init dies.
 * Consolidating teardown into ONE helper without unifying the
 * error-handling policy preserves both shapes — caller decides.
 *
 * Why Option A (preferred): the helper provides the **mechanism**
 * (which method to call, in which order, with which side-effects).
 * Each call site provides the **policy** (whether to wrap in
 * try/catch). `resetTransientRunState` calls `tearDownNodeMap(...)`
 * bare — a thrown destroy will surface during dev. `runEndShutdown`
 * wraps the call in a single try/catch, mirroring the silenced-catch
 * shape it had pre-extraction (one catch around the whole node-map
 * teardown is a behaviour-equivalent collapse: the original wrapped
 * each `destroy()` independently, but the helper now runs them in a
 * specific order and a thrown destroy stops the rest of the helper
 * — that's safe because the caller's outer try/catch already silences
 * any failure here, AND the system `reset()` calls happen FIRST
 * (before any destroy), so the run-state flush always lands).
 *
 * Option B was considered (helper does try/catch internally; both call
 * sites become uniformly safe). Rejected because:
 *   - it silences the bare-destroy signal in `resetTransientRunState`
 *     forever (engineers would no longer notice partial-init failures
 *     during scene reuse — a future regression would land silently);
 *   - the divergent error-handling at the two sites is intentional
 *     (run-end shutdown protects the global teardown sequence; transient
 *     reset wants the diagnostic);
 *   - "policy at the caller" is the standard split for slice 6's
 *     setter-callback pattern; matching that contract here keeps the
 *     extraction discipline consistent.
 *
 * No Phaser imports — vitest under node-env breaks on Phaser eval (see
 * CLAUDE.md gotchas). The helper imports `NodeMapUI` and `NodePromptUI`
 * because it constructs them, but those classes are already eagerly
 * imported in `GameScene.ts` (lazy-scene-loader rule unaffected).
 *
 * Determinism contract (CLAUDE.md "Replay determinism"): install order
 * is preserved one-for-one — UIs are constructed FIRST, then the
 * trigger listener is registered. The trigger-listener body must NOT
 * eagerly capture `nodePromptUI` in its closure — it must re-resolve
 * via the deps every time so post-teardown calls are no-ops via the
 * `?.show(…)` optional-chain (see "Stale callback guards" in
 * CLAUDE.md).
 *
 * Scene reuse contract (CLAUDE.md "Scene reuse"): two installs in
 * sequence (recycled scene instance) construct two fresh UIs.
 * `tearDownNodeMap` between installs nulls both UI refs via the setter
 * callbacks so the second install starts from a clean slate.
 */
import type Phaser from 'phaser';
import type { NodeMapSystem, NodeMapState } from '../../systems/NodeMapSystem';
import type { NodeWaveTracker } from '../../systems/nodeEvents/NodeWaveTracker';
import { NodeMapUI } from '../../ui/NodeMapUI';
import { NodePromptUI } from '../../ui/NodePromptUI';

/**
 * Listener fired by `nodeMapSystem.tick(...)` when the player crosses
 * a node trigger radius. Mirrors `NodeTriggerListener` from
 * `src/systems/NodeMapSystem.ts` so the helper does not pull the type
 * through a re-export.
 */
export type NodeMapTriggerListener = (index: number, state: NodeMapState) => boolean | void;

/**
 * Inputs to {@link installNodeMap}. Setter callbacks (Option B-style
 * indirection from slice 6's `runEndShutdown.ts`) let the helper write
 * the constructed UIs back onto GameScene fields without holding a
 * direct reference to the scene instance.
 */
export interface NodeMapInstallDeps {
  /** Phaser scene the UIs are anchored to. Passed straight to the UI
   *  constructors — the helper does not introspect it. */
  scene: Phaser.Scene;
  /** Run-scoped node-map state container. Trigger listener is set on it. */
  nodeMapSystem: NodeMapSystem;
  /** Wave tracker — passed through for symmetry with teardown deps;
   *  install does not touch it directly but keeping it in the install
   *  shape keeps the call-site readable. */
  nodeWaveTracker: NodeWaveTracker;
  /** Setter that writes the constructed `NodeMapUI` onto the scene field. */
  setNodeMapUI: (ui: NodeMapUI | null) => void;
  /** Setter that writes the constructed `NodePromptUI` onto the scene field. */
  setNodePromptUI: (ui: NodePromptUI | null) => void;
  /**
   * Trigger listener body — fires on player ↔ node intersection.
   * The helper passes this verbatim to `nodeMapSystem.setTriggerListener`.
   * Callers must re-resolve `nodePromptUI` via captured-this inside the
   * closure rather than eagerly binding the value at install time —
   * teardown nulls the UI ref, and a stale closure would crash.
   */
  onNodeTrigger: NodeMapTriggerListener;
}

/**
 * Returned from {@link installNodeMap} so the caller can immediately use
 * the constructed UIs without re-reading via the setters. The setters
 * still get called — the return is a convenience.
 */
export interface NodeMapInstallRefs {
  nodeMapUI: NodeMapUI;
  nodePromptUI: NodePromptUI;
}

/**
 * Install the node-map lifecycle: construct both UIs, write them back
 * onto the scene via setters, register the trigger listener.
 *
 * Order is load-bearing for replay determinism — UIs MUST be
 * constructed (and the setters MUST run) BEFORE the trigger listener
 * is registered, because the listener body reads the now-set
 * `nodePromptUI` via the captured-this in its closure. Don't reorder.
 */
export function installNodeMap(deps: NodeMapInstallDeps): NodeMapInstallRefs {
  const nodeMapUI = new NodeMapUI(deps.scene);
  const nodePromptUI = new NodePromptUI(deps.scene);
  deps.setNodeMapUI(nodeMapUI);
  deps.setNodePromptUI(nodePromptUI);
  // Listener is registered once per scene-create and lives until reset.
  // Dispatches to per-type handlers which in turn call finalizeNodeVisit.
  // Interactive types (shrine / wee_trader / bargain) route through
  // NodePromptUI so pointer, keyboard, and gamepad paths resolve the
  // same outcome contract.
  deps.nodeMapSystem.setTriggerListener(deps.onNodeTrigger);
  return { nodeMapUI, nodePromptUI };
}

/**
 * Inputs to {@link tearDownNodeMap}. Refs are read for `.destroy()`,
 * then nulled via the setter callbacks. Resets fire on the system +
 * tracker BEFORE any destroy so that even if a destroy throws (and
 * the caller's outer try/catch silences it), the run-state flush
 * always lands.
 */
export interface NodeMapTeardownDeps {
  /** Run-scoped node-map state container — `reset()` is called. */
  nodeMapSystem: NodeMapSystem;
  /** Wave tracker — `reset()` is called. */
  nodeWaveTracker: NodeWaveTracker;
  /** Current NodeMapUI ref — destroyed if non-null, then setter is called with null. */
  nodeMapUI: NodeMapUI | null;
  /** Current NodePromptUI ref — destroyed if non-null, then setter is called with null. */
  nodePromptUI: NodePromptUI | null;
  /** Setter that nulls `scene.nodeMapUI` after destroy. */
  setNodeMapUI: (ui: NodeMapUI | null) => void;
  /** Setter that nulls `scene.nodePromptUI` after destroy. */
  setNodePromptUI: (ui: NodePromptUI | null) => void;
}

/**
 * Tear down the node-map lifecycle: reset the system + tracker, then
 * destroy + null both UIs.
 *
 * Errors from `nodeMapUI.destroy()` or `nodePromptUI.destroy()`
 * propagate to the caller — the caller decides whether to wrap in
 * try/catch. This keeps the divergent error-handling at the boundary
 * (Option A in the docstring at the top of this file):
 *
 *   - `resetTransientRunState` calls this bare; thrown destroys surface
 *     during dev as a partial-init signal.
 *   - `runEndShutdown.ts` wraps the call in try/catch around the whole
 *     teardown so a thrown destroy doesn't short-circuit the wider
 *     run-end shutdown sequence.
 *
 * Order: resets BEFORE destroys. The system + tracker `reset()` calls
 * are pure field assignments (verified throw-free at slice 7 dispatch)
 * so they always land first; if a destroy then throws, the run-state
 * is already flushed.
 */
export function tearDownNodeMap(deps: NodeMapTeardownDeps): void {
  deps.nodeMapSystem.reset();
  deps.nodeWaveTracker.reset();
  deps.nodeMapUI?.destroy();
  deps.setNodeMapUI(null);
  deps.nodePromptUI?.destroy();
  deps.setNodePromptUI(null);
}
