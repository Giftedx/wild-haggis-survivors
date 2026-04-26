import { describe, expect, it, vi } from 'vitest';
import {
  finalizeNodeVisit,
  peekReplayChoiceFor,
  type NodeVisitDeps,
} from './nodeVisitFinalizer';
import { RunActState } from './RunActState';
import type { NodeOutcome } from '../../data/nodeTypes';

function fakeNodeMap(): { markVisited: (i: number) => void; visits: number[] } {
  const visits: number[] = [];
  return {
    visits,
    markVisited(i: number): void { visits.push(i); },
  };
}

function fakeClock(timeSec: number): { getGameTimeSec: () => number } {
  return { getGameTimeSec: () => timeSec };
}

function deps(overrides: Partial<NodeVisitDeps> = {}): NodeVisitDeps & {
  marker: ReturnType<typeof fakeNodeMap>;
} {
  const marker = fakeNodeMap();
  return {
    marker,
    nodeMap: marker,
    runActState: new RunActState(),
    replayRecorder: null,
    replayInput: null,
    clock: fakeClock(123),
    ...overrides,
  };
}

describe('finalizeNodeVisit', () => {
  it('marks the node visited and records the outcome on RunActState', () => {
    const d = deps();
    finalizeNodeVisit(d, 2, 'node-key-A');
    expect(d.marker.visits).toEqual([2]);
    const outcomes = d.runActState.nodeOutcomes;
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]).toMatchObject({
      nodeKey: 'node-key-A',
      visitedAtGameTimeSec: 123,
    });
    expect(outcomes[0]?.chosenRewardKey).toBeUndefined();
  });

  it('attaches chosenRewardKey to the recorded outcome only when supplied', () => {
    const d = deps();
    finalizeNodeVisit(d, 0, 'node-key-B', 'reward-X');
    expect(d.runActState.nodeOutcomes[0]?.chosenRewardKey).toBe('reward-X');
  });

  it('forwards the outcome to a replay recorder when present', () => {
    const recorder = { pushNodeOutcome: vi.fn() };
    const d = deps({ replayRecorder: recorder as unknown as NodeVisitDeps['replayRecorder'] });
    finalizeNodeVisit(d, 1, 'node-key-C', 'reward-Y');
    expect(recorder.pushNodeOutcome).toHaveBeenCalledTimes(1);
    expect(recorder.pushNodeOutcome).toHaveBeenCalledWith(expect.objectContaining({
      nodeKey: 'node-key-C',
      chosenRewardKey: 'reward-Y',
      visitedAtGameTimeSec: 123,
    }));
  });

  it('consumes a matching replay outcome when in playback mode', () => {
    const replayInput = {
      peekNextNodeOutcome: vi.fn(() => ({ nodeKey: 'node-key-D' } as NodeOutcome)),
      consumeNodeOutcome: vi.fn(),
    };
    const d = deps({
      replayInput: replayInput as unknown as NodeVisitDeps['replayInput'],
    });
    finalizeNodeVisit(d, 0, 'node-key-D');
    expect(replayInput.consumeNodeOutcome).toHaveBeenCalledTimes(1);
  });

  it('does NOT consume a replay outcome when the next outcome is for a different node', () => {
    const replayInput = {
      peekNextNodeOutcome: vi.fn(() => ({ nodeKey: 'node-key-D' } as NodeOutcome)),
      consumeNodeOutcome: vi.fn(),
    };
    const d = deps({
      replayInput: replayInput as unknown as NodeVisitDeps['replayInput'],
    });
    finalizeNodeVisit(d, 0, 'a-passive-node-finalizing-meanwhile');
    // Peek happens, but consume is skipped — the next interactive node
    // is still expected to consume its own matching outcome.
    expect(replayInput.peekNextNodeOutcome).toHaveBeenCalled();
    expect(replayInput.consumeNodeOutcome).not.toHaveBeenCalled();
  });

  it('walks currentNodeIndex past contiguously visited slots', () => {
    // The fake nodeMap mutates the SAME visited array that runActState
    // sees, mirroring the production contract where NodeMapSystem and
    // RunActState.currentActNodeMap point at one shared map state.
    const visited = [true, true, false, false];
    const sharedMarker = {
      markVisited(i: number): void { visited[i] = true; },
    };
    const d = deps({ nodeMap: sharedMarker });
    d.runActState.currentActNodeMap = {
      seed: 1,
      nodes: [
        { key: 'a', kind: 'pass', position: { x: 0, y: 0 }, gateGameTimeSec: 0 } as never,
        { key: 'b', kind: 'pass', position: { x: 0, y: 0 }, gateGameTimeSec: 0 } as never,
        { key: 'c', kind: 'pass', position: { x: 0, y: 0 }, gateGameTimeSec: 0 } as never,
        { key: 'd', kind: 'pass', position: { x: 0, y: 0 }, gateGameTimeSec: 0 } as never,
      ],
      visited,
      worldPositions: [],
    } as unknown as RunActState['currentActNodeMap'];
    d.runActState.currentNodeIndex = 0;
    finalizeNodeVisit(d, 2, 'c');
    // After finalize, slot 2 is visited; cursor should walk past 0, 1, 2 to 3.
    expect(d.runActState.currentNodeIndex).toBe(3);
  });
});

describe('peekReplayChoiceFor', () => {
  it('returns null outside playback mode', () => {
    expect(peekReplayChoiceFor(null, 'any-key')).toBeNull();
  });

  it('returns null when the replay queue is empty', () => {
    const replayInput = { peekNextNodeOutcome: () => null };
    expect(peekReplayChoiceFor(
      replayInput as unknown as NodeVisitDeps['replayInput'],
      'any-key',
    )).toBeNull();
  });

  it('returns the recorded chosenRewardKey when nodeKey matches', () => {
    const replayInput = {
      peekNextNodeOutcome: () => ({ nodeKey: 'k', chosenRewardKey: 'reward-Z' } as NodeOutcome),
    };
    expect(peekReplayChoiceFor(
      replayInput as unknown as NodeVisitDeps['replayInput'],
      'k',
    )).toBe('reward-Z');
  });

  it('returns null and warns when the next outcome is for a different node', () => {
    const replayInput = {
      peekNextNodeOutcome: () => ({ nodeKey: 'recorded-key' } as NodeOutcome),
    };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      expect(peekReplayChoiceFor(
        replayInput as unknown as NodeVisitDeps['replayInput'],
        'live-key',
      )).toBeNull();
      expect(warn).toHaveBeenCalledOnce();
      const arg = warn.mock.calls[0]?.[0] ?? '';
      expect(String(arg)).toContain('node-outcome mismatch');
    } finally {
      warn.mockRestore();
    }
  });

  it('returns null when the matching outcome has no chosenRewardKey', () => {
    const replayInput = {
      peekNextNodeOutcome: () => ({ nodeKey: 'k' } as NodeOutcome),
    };
    expect(peekReplayChoiceFor(
      replayInput as unknown as NodeVisitDeps['replayInput'],
      'k',
    )).toBeNull();
  });
});
