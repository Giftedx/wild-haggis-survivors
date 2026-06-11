/**
 * NodeWaveTracker (M1 F1 + F2) — tracks the enemies spawned by an
 * encounter or elite node so the node is only finalized once they die.
 *
 * Pure per-frame polling: members expose `isAliveForWave(tag)` which
 * returns false once the underlying Enemy goes inactive OR the pool
 * re-acquires it under a different tag. When no members are alive,
 * the tracker fires `onClear` with the last-known centroid of the
 * wave (captured one tick before all members died) and drops the
 * wave from its pending list.
 *
 * Why pure: keeps the tracker testable without Phaser, mirrors the
 * headless-helper pattern established for the other node-event
 * resolvers. Scene adapts Enemy → NodeWaveMember inline.
 */

export type NodeWaveKind = 'encounter' | 'elite';

export interface NodeWaveMember {
  readonly x: number;
  readonly y: number;
  isAliveForWave(tag: string): boolean;
}

interface NodeWaveRecord {
  tag: string;
  nodeIndex: number;
  nodeKey: string;
  kind: NodeWaveKind;
  members: readonly NodeWaveMember[];
  lastKnownPos: { x: number; y: number };
  onClear: (pos: { x: number; y: number }) => void;
  cleared: boolean;
}

export class NodeWaveTracker {
  private waves: NodeWaveRecord[] = [];
  private counter = 0;

  /**
   * Allocate a tag and register a wave. `buildMembers(tag)` receives the
   * assigned tag so the caller can stamp it on freshly spawned enemies
   * before the tracker starts polling them. If `buildMembers` returns an
   * empty list the wave fires `onClear(initialPos)` synchronously — the
   * encounter resolver can still return an empty enemyMix, and we don't
   * want the node to stall forever in that case.
   */
  register(
    nodeIndex: number,
    nodeKey: string,
    kind: NodeWaveKind,
    buildMembers: (tag: string) => readonly NodeWaveMember[],
    onClear: (pos: { x: number; y: number }) => void,
    initialPos: { x: number; y: number },
  ): string {
    const tag = `node-${nodeIndex}-${this.counter++}`;
    const members = buildMembers(tag);
    const record: NodeWaveRecord = {
      tag,
      nodeIndex,
      nodeKey,
      kind,
      members,
      lastKnownPos: { x: initialPos.x, y: initialPos.y },
      onClear,
      cleared: false,
    };
    this.waves.push(record);
    if (members.length === 0) {
      record.cleared = true;
      onClear(record.lastKnownPos);
      this.pruneCleared();
    }
    return tag;
  }

  /**
   * Per-frame poll. For each pending wave, compute the centroid of still-
   * alive members; if any alive → stash that centroid as the new
   * last-known pos. If none alive → fire `onClear` with the prior
   * last-known pos (captured on the tick before the final kill).
   */
  tick(): void {
    for (const wave of this.waves) {
      if (wave.cleared) continue;
      let sumX = 0;
      let sumY = 0;
      let alive = 0;
      for (const m of wave.members) {
        if (m.isAliveForWave(wave.tag)) {
          sumX += m.x;
          sumY += m.y;
          alive++;
        }
      }
      if (alive > 0) {
        wave.lastKnownPos = { x: sumX / alive, y: sumY / alive };
        continue;
      }
      wave.cleared = true;
      wave.onClear(wave.lastKnownPos);
    }
    this.pruneCleared();
  }

  reset(): void {
    this.waves = [];
    this.counter = 0;
  }

  /** Test + debug helper. */
  pendingCount(): number {
    return this.waves.length;
  }

  private pruneCleared(): void {
    this.waves = this.waves.filter((w) => !w.cleared);
  }
}
