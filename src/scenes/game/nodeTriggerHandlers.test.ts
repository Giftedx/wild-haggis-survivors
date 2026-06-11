/**
 * nodeTriggerHandlers — dispatch contract for the seven node-trigger
 * types. Pure tests; do NOT boot Phaser (per CLAUDE.md "Phaser imports
 * break in node-env vitest").
 *
 * Coverage matrix:
 *   - rest: heals + grants reroll tokens + finalizes synchronously.
 *   - hidden / relic: spawns a relic at the node position + finalizes
 *     with `'relic'` outcome.
 *   - hidden / lore-fallback: when relicSystem returns null (all held)
 *     finalizes with `'lore_fragment'` outcome (no relic spawn).
 *   - encounter: registers a wave on the tracker (kind 'encounter')
 *     and forceSpawns the declared mix; finalize fires from the
 *     wave's onClear callback.
 *   - elite: registers a wave (kind 'elite'), guaranteed-relic drops
 *     at the kill position when the wave clears, finalize fires.
 *   - shrine / replay branch: applies the recorded boon (when not
 *     'refused') AND finalizes with the recorded choice — no prompt
 *     is opened, no enter/exit-prompt bracket runs.
 *   - shrine / interactive branch: opens the NodePromptUI and brackets
 *     with NODE_PROMPT timeManager request; resolving the prompt
 *     applies the picked boon + releases the bracket + finalizes.
 *   - trader / replay branch: spends gold for the recorded item and
 *     applies the matching effect (relic / passive / reroll); finalize
 *     fires with the recorded choice.
 *   - bargain / replay branch: 'accept' takes hp damage + applies
 *     offer; 'refused' surfaces toast + skips offer; finalize fires
 *     with the recorded choice in both branches.
 */
import { describe, it, expect, vi } from 'vitest';

import {
  dispatchNodeTrigger,
  type NodeTriggerHandlerDeps,
} from './nodeTriggerHandlers';
import type { NodeDef } from '../../data/nodeTypes';
import type { NodeMapState } from '../../systems/NodeMapSystem';
import type { NodeWaveMember } from '../../systems/nodeEvents/NodeWaveTracker';

interface RegisteredWave {
  index: number;
  nodeKey: string;
  kind: 'encounter' | 'elite';
  buildMembers: (tag: string) => readonly NodeWaveMember[];
  onClear: (pos: { x: number; y: number }) => void;
  initialPos: { x: number; y: number };
}

function makeDeps(overrides: Partial<NodeTriggerHandlerDeps> = {}): {
  deps: NodeTriggerHandlerDeps;
  spies: {
    finalize: ReturnType<typeof vi.fn>;
    setIndex: ReturnType<typeof vi.fn>;
    peek: ReturnType<typeof vi.fn>;
    showToast: ReturnType<typeof vi.fn>;
    showPrompt: ReturnType<typeof vi.fn>;
    request: ReturnType<typeof vi.fn>;
    release: ReturnType<typeof vi.fn>;
    forceSpawn: ReturnType<typeof vi.fn>;
    rollDrop: ReturnType<typeof vi.fn>;
    spawnRelic: ReturnType<typeof vi.fn>;
    grantReroll: ReturnType<typeof vi.fn>;
    grantPassive: ReturnType<typeof vi.fn>;
    spawnGem: ReturnType<typeof vi.fn>;
    addCoinGold: ReturnType<typeof vi.fn>;
    spendCoinGold: ReturnType<typeof vi.fn>;
    setCurseCoolMul: ReturnType<typeof vi.fn>;
    playerHeal: ReturnType<typeof vi.fn>;
    playerTakeDamage: ReturnType<typeof vi.fn>;
  };
  registered: RegisteredWave[];
  modifiers: { goldMult: number; weaponCooldownMult: number; damageTakenMult: number };
} {
  const finalize = vi.fn();
  const setIndex = vi.fn();
  const peek = vi.fn().mockReturnValue(null);
  const showToast = vi.fn();
  const showPrompt = vi.fn();
  const request = vi.fn();
  const release = vi.fn();
  const forceSpawn = vi.fn().mockReturnValue({
    active: true,
    nodeWaveTag: null,
    x: 0,
    y: 0,
  });
  const rollDrop = vi.fn().mockReturnValue({ key: 'test_relic' });
  const spawnRelic = vi.fn();
  const grantReroll = vi.fn();
  const grantPassive = vi.fn();
  const spawnGem = vi.fn();
  const addCoinGold = vi.fn();
  const spendCoinGold = vi.fn().mockReturnValue(true);
  const setCurseCoolMul = vi.fn();
  const playerHeal = vi.fn();
  const playerTakeDamage = vi.fn();

  const registered: RegisteredWave[] = [];

  const modifiers = { goldMult: 1, weaponCooldownMult: 1, damageTakenMult: 1 };

  const deps: NodeTriggerHandlerDeps = {
    player: {
      x: 100,
      y: 200,
      getMaxHp: () => 100,
      getHp: () => 50,
      heal: playerHeal,
      takeDamage: playerTakeDamage,
    } as unknown as NodeTriggerHandlerDeps['player'],
    runRng: {
      // Deterministic enough for tests — pick first, return 0.5.
      pick: <T,>(arr: readonly T[]) => arr[0],
      next: () => 0.5,
      nextInt: () => 0,
      int: (min: number, _max: number) => min,
    } as unknown as NodeTriggerHandlerDeps['runRng'],
    runScore: {
      addCoinGold,
      spendCoinGold,
      getGoldBalance: () => 100,
    } as unknown as NodeTriggerHandlerDeps['runScore'],
    runModifiers: modifiers as unknown as NodeTriggerHandlerDeps['runModifiers'],
    tempBuffBag: {} as unknown as NodeTriggerHandlerDeps['tempBuffBag'],
    ownedPassives: [],
    nodeWaveTracker: {
      register: vi.fn((index, nodeKey, kind, buildMembers, onClear, initialPos) => {
        registered.push({ index, nodeKey, kind, buildMembers, onClear, initialPos });
        return `tag-${index}`;
      }),
    } as unknown as NodeTriggerHandlerDeps['nodeWaveTracker'],
    spawnSystem: { forceSpawn } as unknown as NodeTriggerHandlerDeps['spawnSystem'],
    relicSystem: { rollDrop } as unknown as NodeTriggerHandlerDeps['relicSystem'],
    relicPickupSpawner: { spawn: spawnRelic } as unknown as NodeTriggerHandlerDeps['relicPickupSpawner'],
    weaponSystem: { setCurseCooldownMul: setCurseCoolMul } as unknown as NodeTriggerHandlerDeps['weaponSystem'],
    xpSystem: { spawnGem } as unknown as NodeTriggerHandlerDeps['xpSystem'],
    upgradeUI: { grantReroll } as unknown as NodeTriggerHandlerDeps['upgradeUI'],
    levelUpFlow: { grantPassive } as unknown as NodeTriggerHandlerDeps['levelUpFlow'],
    juice: { showToast } as unknown as NodeTriggerHandlerDeps['juice'],
    timeManager: { request, release } as unknown as NodeTriggerHandlerDeps['timeManager'],
    nodePromptUI: { show: showPrompt } as unknown as NodeTriggerHandlerDeps['nodePromptUI'],
    peekReplayChoiceFor: peek,
    setInteractivePromptIndex: setIndex,
    finalizeNodeVisit: finalize,
    ...overrides,
  };

  return {
    deps,
    spies: {
      finalize,
      setIndex,
      peek,
      showToast,
      showPrompt,
      request,
      release,
      forceSpawn,
      rollDrop,
      spawnRelic,
      grantReroll,
      grantPassive,
      spawnGem,
      addCoinGold,
      spendCoinGold,
      setCurseCoolMul,
      playerHeal,
      playerTakeDamage,
    },
    registered,
    modifiers,
  };
}

function makeNode(type: NodeDef['type'], data: Record<string, unknown> = {}): NodeDef {
  return {
    key: `node-${type}-1`,
    type,
    nameKey: `nodes.${type}.name`,
    weightInBank: 1,
    actAffinity: [1, 2, 3],
    data,
  };
}

function makeState(index: number): NodeMapState {
  return {
    nodes: [makeNode('encounter')],
    worldPositions: [{ x: 500, y: 600 }],
    visited: [false],
    visitedIndex: index,
  } as unknown as NodeMapState;
}

describe('dispatchNodeTrigger — rest', () => {
  it('heals, grants reroll tokens, and finalizes synchronously', () => {
    const node = makeNode('rest', { healRatio: 0.5, rerollTokens: 2 });
    const { deps, spies } = makeDeps();

    dispatchNodeTrigger(deps, node, 0, makeState(0));

    expect(spies.playerHeal).toHaveBeenCalledWith(50); // 100 maxHp * 0.5
    expect(spies.grantReroll).toHaveBeenCalledTimes(2);
    expect(spies.showToast).toHaveBeenCalledTimes(1);
    expect(spies.finalize).toHaveBeenCalledWith(0, node.key);
  });
});

describe('dispatchNodeTrigger — hidden', () => {
  it('spawns a relic at the node position and finalizes with "relic" outcome', () => {
    const node = makeNode('hidden', { rewardPool: ['rare_relic'] });
    const { deps, spies } = makeDeps();

    dispatchNodeTrigger(deps, node, 0, makeState(0));

    expect(spies.spawnRelic).toHaveBeenCalledWith({ key: 'test_relic' }, 500, 600, 'hidden_node');
    expect(spies.finalize).toHaveBeenCalledWith(0, node.key, 'relic');
  });

  it('falls back to lore_fragment when relicSystem returns null', () => {
    const node = makeNode('hidden', { rewardPool: ['rare_relic'] });
    const { deps, spies } = makeDeps();
    spies.rollDrop.mockReturnValue(null);

    dispatchNodeTrigger(deps, node, 0, makeState(0));

    expect(spies.spawnRelic).not.toHaveBeenCalled();
    expect(spies.finalize).toHaveBeenCalledWith(0, node.key, 'lore_fragment');
  });
});

describe('dispatchNodeTrigger — encounter', () => {
  it('registers a wave with kind "encounter" and forceSpawns the declared mix', () => {
    const node = makeNode('encounter', { enemyMix: [{ key: 'midge', count: 3 }] });
    const { deps, spies, registered } = makeDeps();

    dispatchNodeTrigger(deps, node, 0, makeState(0));

    expect(registered).toHaveLength(1);
    expect(registered[0].kind).toBe('encounter');
    expect(registered[0].nodeKey).toBe(node.key);
    expect(registered[0].initialPos).toEqual({ x: 500, y: 600 });

    // Drive buildMembers to confirm forceSpawn fires per declared count.
    const members = registered[0].buildMembers('tag-0');
    expect(spies.forceSpawn).toHaveBeenCalledTimes(3);
    expect(members).toHaveLength(3);

    // Driving onClear triggers finalize.
    registered[0].onClear({ x: 500, y: 600 });
    expect(spies.finalize).toHaveBeenCalledWith(0, node.key);
  });
});

describe('dispatchNodeTrigger — elite', () => {
  it('registers a wave with kind "elite" and drops a guaranteed relic at the kill position', () => {
    const node = makeNode('elite', { enemyKey: 'gordon', guaranteedRelic: true });
    const { deps, spies, registered } = makeDeps();

    dispatchNodeTrigger(deps, node, 0, makeState(0));

    expect(registered).toHaveLength(1);
    expect(registered[0].kind).toBe('elite');

    // Drive the wave to clear at a specific kill position.
    registered[0].buildMembers('tag-0');
    registered[0].onClear({ x: 750, y: 800 });

    expect(spies.rollDrop).toHaveBeenCalledWith('elite', deps.runRng, { luckMultiplier: 2 });
    expect(spies.spawnRelic).toHaveBeenCalledWith({ key: 'test_relic' }, 750, 800, 'elite');
    expect(spies.finalize).toHaveBeenCalledWith(0, node.key);
  });
});

describe('dispatchNodeTrigger — shrine replay branch', () => {
  it('applies the recorded boon and finalizes without opening the prompt', () => {
    const node = makeNode('shrine', {
      buffPool: ['buff_gold'],
      durationMs: 5000,
    });
    const { deps, spies } = makeDeps();
    spies.peek.mockReturnValue('buff_gold');

    dispatchNodeTrigger(deps, node, 0, makeState(0));

    // 'buff_gold' is an immediate (non-registered) shrine boon → addCoinGold(50).
    expect(spies.addCoinGold).toHaveBeenCalledWith(50);
    expect(spies.showPrompt).not.toHaveBeenCalled();
    expect(spies.request).not.toHaveBeenCalled();
    expect(spies.finalize).toHaveBeenCalledWith(0, node.key, 'buff_gold');
  });

  it('skips boon application when the recorded choice is "refused" but still finalizes', () => {
    const node = makeNode('shrine', {
      buffPool: ['buff_gold'],
      durationMs: 5000,
    });
    const { deps, spies } = makeDeps();
    spies.peek.mockReturnValue('refused');

    dispatchNodeTrigger(deps, node, 0, makeState(0));

    expect(spies.addCoinGold).not.toHaveBeenCalled();
    expect(spies.finalize).toHaveBeenCalledWith(0, node.key, 'refused');
  });
});

describe('dispatchNodeTrigger — shrine interactive branch', () => {
  it('opens the prompt with the resolver candidates and brackets with NODE_PROMPT', () => {
    const node = makeNode('shrine', {
      buffPool: ['buff_gold'],
      durationMs: 5000,
    });
    const { deps, spies } = makeDeps();

    dispatchNodeTrigger(deps, node, 0, makeState(0));

    // enterInteractivePrompt: setIndex(0) then NODE_PROMPT request.
    expect(spies.setIndex).toHaveBeenCalledWith(0);
    expect(spies.request).toHaveBeenCalledWith('NODE_PROMPT', {
      pausePhysics: true,
      timeScale: 0,
    });
    expect(spies.showPrompt).toHaveBeenCalledTimes(1);

    // Drive the prompt's onResolve with a picked key — exit bracket fires.
    const opts = spies.showPrompt.mock.calls[0][0] as { onResolve: (k: string | null) => void };
    opts.onResolve('buff_gold');

    expect(spies.addCoinGold).toHaveBeenCalledWith(50);
    expect(spies.release).toHaveBeenCalledWith('NODE_PROMPT');
    expect(spies.setIndex).toHaveBeenLastCalledWith(-1);
    expect(spies.finalize).toHaveBeenCalledWith(0, node.key, 'buff_gold');
  });
});

describe('dispatchNodeTrigger — trader replay branch', () => {
  it('spends gold and applies the recorded reroll item without opening the prompt', () => {
    const node = makeNode('wee_trader', {
      itemPool: ['relic', 'passive', 'reroll'],
      itemCount: 3,
      priceRange: [10, 20],
    });
    const { deps, spies } = makeDeps();
    spies.peek.mockReturnValue('reroll');

    dispatchNodeTrigger(deps, node, 0, makeState(0));

    expect(spies.spendCoinGold).toHaveBeenCalledTimes(1);
    expect(spies.grantReroll).toHaveBeenCalledTimes(1);
    expect(spies.showPrompt).not.toHaveBeenCalled();
    expect(spies.finalize).toHaveBeenCalledWith(0, node.key, 'reroll');
  });
});

describe('dispatchNodeTrigger — bargain replay branch', () => {
  it('accept: takes hpCost damage and applies the offer; finalizes "accept"', () => {
    const node = makeNode('bargain', {
      offerPool: ['gold_boost'],
      hpCostRatio: 0.2,
    });
    const { deps, spies, modifiers } = makeDeps();
    spies.peek.mockReturnValue('accept');

    dispatchNodeTrigger(deps, node, 0, makeState(0));

    expect(spies.playerTakeDamage).toHaveBeenCalled();
    // gold_boost path → goldMult bumped 1.1x.
    expect(modifiers.goldMult).toBeCloseTo(1.1);
    expect(spies.finalize).toHaveBeenCalledWith(0, node.key, 'accept');
  });

  it('refused: skips damage + offer, surfaces refusal toast, finalizes "refused"', () => {
    const node = makeNode('bargain', {
      offerPool: ['gold_boost'],
      hpCostRatio: 0.2,
    });
    const { deps, spies, modifiers } = makeDeps();
    spies.peek.mockReturnValue('refused');

    dispatchNodeTrigger(deps, node, 0, makeState(0));

    expect(spies.playerTakeDamage).not.toHaveBeenCalled();
    expect(modifiers.goldMult).toBe(1);
    expect(spies.showToast).toHaveBeenCalled();
    expect(spies.finalize).toHaveBeenCalledWith(0, node.key, 'refused');
  });
});
