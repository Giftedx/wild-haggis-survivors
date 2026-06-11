# M1 — Moor Road multi-node expansion design spec

**Date:** 2026-04-23
**Initiative:** M1 (`docs/HUGE_INITIATIVES_MASTER_PLAN.md`)
**Status:** Draft
**Prerequisite:** W2 Moor Road shipped (2026-04-16). This spec *extends* W2 — does not replace it.

---

## 1. Problem statement

W2 ships three acts with a single 3-route picker at each act transition. Players make two binary-ish choices per run (picker A at ~5:00 on Gordon kill; picker B at ~10:00 on Tour Bus kill). The picker work is excellent: data-driven routes, `modifierDeltas` + `onResume`, Chronicle breadcrumb, banter parity.

But: **two decision points across 25 minutes is thin**, compared to the roguelite-canonical node-map structures. Slay the Spire has ~14 nodes per act (with forking paths). Hades has ~8 chamber choices per biome. FTL has ~15–20 system jumps.

`ROGUELITE_RESEARCH.md §Tier S3, §Pattern-4` calls this out: the *map itself* is a decision. Scattering more choices across the run — with *pre-visible rewards* — creates strategic tempo the single-picker cannot.

### Player outcome

Each act becomes a short path of 3–5 choices between bosses. Node types are visible ahead of time (icons: battle / shrine / trader / hidden / bargain / rest / elite). Players plan their run shape moment-to-moment instead of just at the two picker forks.

### Why this is additive, not replacing

Existing W2 picker continues as the *anchor* at each act-end. What changes: between the act-start and the boss, 3–5 sub-nodes punctuate the combat stretch with specific events.

---

## 2. The node types (v1)

### 7 node types

| Type | Icon | Frequency | Effect |
|---|---|---|---|
| **Encounter** | crossed-dirks | Most common (40% of generated nodes) | A scripted wave-pulse with a specific enemy mix; slightly tougher than baseline spawn-director spawn. |
| **Shrine** | standing-stone | 15% | Temporary buff (damage / speed / luck) for 60s. Pictish-carved stone art. |
| **Wee Trader** | sporran-on-staff | 15% | Mid-run merchant. 3 items offered (random Relic + random passive + random reroll token); pay in gold. |
| **Hidden** | faint-thistle | 10% | Empty until the player finds it (small cairn, visual cue only). Rewards a rare Relic or lore fragment. Tied to C1 Almanac unlocks. |
| **Bargain** | cailleach-shadow | 10% | Cailleach's Bargain — trade HP for a buff, Relic, or route alteration. Grave/Fey tonal register. |
| **Rest** | hearth-flame | 5% | Partial heal (+30% max HP) + one free card reroll. |
| **Elite** | gold-boss-silhouette | 5% | Guaranteed elite spawn + guaranteed Relic drop on kill. Higher difficulty. |

Weighted to favour Encounters (combat is the game's beating heart) but give variety enough that a 5-node act can hold 3 non-encounter nodes.

### Per-act node count

- **Act 1** (start → Gordon): 3 nodes before the boss + the picker + boss (the picker stays the last choice before act-change).
- **Act 2** (between Gordon and Tour Bus): 3 nodes + picker + boss.
- **Act 3** (post-Tour-Bus through Taxman): 4–5 nodes + Laird boss + 3 nodes + Haggis Hunter General boss + 3 nodes + Taxman.

**Total new decision points per run: ~11–14.** From 2 picker-forks to ~13 node-visits. Roughly 10× the decision density.

### Path visibility

Each act's node map appears at act-start as a small HUD widget (top-right, expandable). Nodes are shown with icons (not rewards — only *type*). Players see what's ahead 1–2 nodes out, full path revealed by the time they reach the picker.

Current-position indicator, next-node-icon always visible.

---

## 3. Node placement & movement

### How nodes integrate with the moor

The moor is continuous (no separate scene per node). Nodes are **destinations** — the player walks toward the next-node marker. Nodes spawn ~2–3 min of combat apart, so reaching each feels like a natural beat in the existing pacing.

When the player reaches a node position (proximity-check), the node triggers its event:

- **Encounter** — specific-mix wave spawns immediately, resolves over ~90s, node cleared when wave dead.
- **Shrine** — player stands in it for 3s, picks a buff from 3 shown, buff applies for 60s.
- **Wee Trader** — NPC sprite appears; UI opens; purchase flow.
- **Hidden** — if player stumbles within 200px, subtle visual + audio cue; interact prompt appears.
- **Bargain** — Cailleach-shadow appears; UI opens; trade or refuse.
- **Rest** — heal animation plays; reroll token granted.
- **Elite** — spawn director forces an elite at the node position.

### Movement prompt

A faint compass / trail (see `ART_STYLE_BIBLE.md` heather motif) on the ground indicates the direction of the next node. Players who ignore the trail just continue surviving; nodes can be skipped by choosing never to approach. (Skipping a node has cost: that reward is gone for the run.)

---

## 4. Non-goals

- **Not replacing the W2 picker.** Act-end picker at acts 1 and 2 remains. Node-map sits *before* the picker.
- **Not procedurally-generated node content.** Each act has a curated bank of nodes; the engine rolls from that bank per act. Not full procgen.
- **Not a separate scene per node.** Node events happen *inside* `GameScene`. No scene transitions during a run.
- **Not bosses as nodes.** Bosses remain their existing spawn triggers.
- **Not skippable-via-menu.** If player wants to skip nodes, they just don't walk to them. No UI toggle.
- **Not unlimited node variants.** 7 types, fixed in v1.
- **Not replacing the existing banter-moor-moment rhythm.** Nodes layer on top of moor moments, don't replace them.

---

## 5. Architecture

### New files

- `src/data/nodeTypes.ts` — 7 node-type definitions + their data shape.
- `src/data/nodeBanks.ts` — per-act node banks (Act 1 bank, Act 2 bank, Act 3 bank × multiple stretches).
- `src/systems/NodeMapSystem.ts` — per-run node-map state, trigger routing, reward application.
- `src/systems/nodeEvents/*.ts` — one file per node-type implementation (pure where possible):
  - `encounterEvent.ts`
  - `shrineEvent.ts`
  - `weeTraderEvent.ts`
  - `hiddenEvent.ts`
  - `bargainEvent.ts`
  - `restEvent.ts`
  - `eliteEvent.ts`
- `src/ui/NodeMapUI.ts` — HUD widget showing current path.
- `src/ui/NodePromptUI.ts` — pop-up UI for Shrine / Trader / Bargain (interaction flow).

### Files to modify

- `src/scenes/game/RunActState.ts` — extend with `currentActNodeMap: NodeMapState`, `currentNodeIndex: number`, `nodeOutcomes: NodeOutcome[]`.
- `src/scenes/GameScene.ts` — call `NodeMapSystem.tick(delta)` in update; handle node-triggered events.
- `src/systems/SpawnSystem.ts` — `forceNodeEncounter(enemyMix, duration)` method.
- `src/data/routes.ts` — W2 picker stays, but routes can *reference* node-map effects (e.g., `up_the_brae` forces Act 1 to include an Elite node).
- `src/core/i18n.ts` + `src/core/i18n.scs.ts` — ~120 new keys × 2 (node names, prompts, banter, flavour).
- `src/utils/save.ts` — `RunHistoryEntry.nodeOutcomes: NodeOutcome[]` (per-run node visit history). Schema v8 → v9.
- `src/scenes/ChronicleScene.ts` — show node outcomes per past run (expandable).

### Data shapes

```typescript
type NodeType = 'encounter' | 'shrine' | 'wee_trader' | 'hidden' | 'bargain' | 'rest' | 'elite';

interface NodeDef {
  key: string;               // stable id for analytics
  type: NodeType;
  nameKey: string;           // i18n
  promptKey?: string;        // for interactive types
  weightInBank: number;      // drop-weight for bank selection
  actAffinity: (1 | 2 | 3)[]; // which acts it can appear in
  data: Record<string, unknown>; // type-specific (enemy mix for Encounter, buffs for Shrine)
}

interface NodeMapState {
  act: 1 | 2 | 3;
  nodes: NodeDef[];          // the generated path for this act
  visited: boolean[];
  currentIndex: number;
  worldPositions: { x: number; y: number }[];  // placement in GameScene
}

interface NodeOutcome {
  nodeKey: string;
  chosenRewardKey?: string;  // if applicable
  visitedAtGameTimeSec: number;
}
```

### Node-map generation

At act start:
1. Determine act.
2. Load `nodeBanks.ACT_${n}`.
3. Roll 3–5 nodes (count depends on act; act 3 longer).
4. Weighted selection — respect `weightInBank`.
5. Constrain: at least 1 Encounter; at most 1 Elite per act; Bargain + Rest are mutually exclusive per act.
6. Place nodes geometrically — spread around the player's current map position, 2–3 minutes of combat apart.

Deterministic given the run seed — enables replay (T1) to reconstruct the node map.

### Replay integration

T1 replay (shipped in ADR-0002 Phase 3) already records `curseKey` + `routes` in v2 metadata. Extend to **v3**: record `nodeOutcomes` array. ReplayInput reconstructs node events from metadata.

Backward compatibility: v1/v2 replays continue to play (with no node-map; replay renders old W2-only flow). **ReplayBlob schema union widens.**

### Tests / fences

- `NodeMapSystem.test.ts` — act-start generation respects bank constraints.
- `nodeBanks.test.ts` — each bank has enough variety to generate a valid 3–5 node path.
- `nodeEvents/*.test.ts` — pure-function tests per event type.
- `save.test.ts` — v8 → v9 migration.
- `replayDeterminism.test.ts` — new `nodeOutcomes` field round-trips.
- `e2e/moor-road-nodes.spec.ts` — Playwright smoke: run starts → encounter → shrine → picker; node-map UI shows progress.

---

## 6. UI / UX

### HUD node-map widget

Top-right corner, default minimised to a small icon + text ("Act 1 — 2 of 4"). Click expands to small path strip showing node-type icons, current position, remaining nodes. Respects `uiScale`.

### Node-reached prompt

For interactive node types (Shrine, Trader, Bargain, Hidden):
1. Proximity detection (player within 80px of node).
2. Interaction prompt appears ("Press [SPACE] to approach the shrine").
3. Player presses → UI opens → choice → apply effect → close UI → node marked visited.

Timer doesn't pause during node UI (intentional — the moor keeps moving). Exception: Bargain events pause to give reading time.

### Visual style

Node icons match the five tonal palettes:
- Encounter → Wild tones (neutral grey-steel).
- Shrine → Fey (pale violet).
- Trader → Wild Comedy (urban sodium-amber).
- Hidden → Hearth-Fey mix (shimmering gold).
- Bargain → Fey/Grave blend (cold blue + shadow).
- Rest → Hearth (warm gold).
- Elite → Grave (deep-red / gold accent).

Per `docs/ART_STYLE_BIBLE.md §Tonal palette map`.

---

## 7. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Node-map UI distracts from combat | HUD widget minimised by default; clean icon-only compact form. uiScale compatible. |
| 13 decision points creates fatigue | Most decisions are quick (Encounter is just 90s of combat; Shrine is 3 buff-picks). Bargain + Trader are the longer deliberations; we limit to 1-2 of those per act. |
| Node-to-node walking feels aimless | Heather trail direction cue + `next-node-icon` on HUD. Players ignore if they prefer to fight baseline spawns. |
| Replay break | Replay v2 plays fine with old single-picker flow. v3 adds node support. Schema-union widens safely. |
| Bundle bloat from 7 event types | Event-type files are ~200 lines each, share a common hook pattern. Budget: +50 KB gzip. |
| Procedural generation creates unwinnable / trivial maps | Constraint-solver in node-map generator: "at least 1 Encounter", "at most 1 Elite", etc. Regression test fixtures. |
| Banter pool doesn't scale to per-node context | Author pattern: 1-2 banter lines per node-type (shared pool), plus node-specific reserved lines for rarer types (Bargain, Hidden). |
| Save v9 migration fragility | `nodeOutcomes` defaults to empty array; existing saves unaffected. Back-compat test for each prior schema. |

---

## 8. Kill criteria

- **Playtest: act completion rate remains ≥90%** (pre-M1 baseline) — node density doesn't slow runs to the point of attrition.
- **Playtest: no single node-type is "always skipped"** (>80% skip rate suggests it's not earning its place — cut or rebalance).
- **Bundle delta** ≤ +60 KB gzip.
- **Replay determinism** unaffected — `replayDeterminism.test.ts` still passes with v3 blobs.
- **`npm run ci:all`** green.
- **Manual check:** each node type triggers correctly; HUD widget scales with uiScale; Replay playback handles v1/v2/v3 blobs.

If >1 in 5 playtesters report "the node walking feels like padding," reduce the per-act node count from 3–5 to 2–3 and reassess.

---

## 9. Cross-references

- `docs/research/ROGUELITE_RESEARCH.md §Tier S3, §Pattern-4` — strategic rationale.
- `docs/research/GAME_FEEL_RESEARCH.md §6.1` — tension curve; nodes create the rhythm.
- `docs/research/NARRATIVE_RESEARCH.md §6.3, §6.5` — ambient text at Shrines, NPC encounters at Wee Traders.
- `docs/research/SCOTTISH_RESEARCH_DEEP.md §1.8 (Corryvreckan, Callanish)` — Shrine visual basis.
- `docs/HUGE_INITIATIVES_MASTER_PLAN.md` — W2 shipped context.
- `docs/superpowers/specs/2026-04-16-moor-road-w2-design.md` — prior picker design.

---

*Spec complete. Plan will break into M1 data + bank scaffolding, M2 node-map UI + proximity detection, M3 per-node-type event implementation (7 separate mini-milestones), M4 save-schema + replay integration, M5 balance + launch.*
