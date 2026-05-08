# LOC Budget Ratchet

Test: `src/utils/locBudget.test.ts`

Policy: each top-of-file ceiling can only be **lowered**, never raised silently. Raising one requires an inline comment explaining why (e.g. "post-merge of feature X — to be split in follow-up Y").

## Why this exists

GameScene shipped to ≤1656 LOC under T401 (charter target ≤1200). Within four months it regrew to 2983 LOC as features landed inline. Without a guardrail, every helper extraction silently leaks back as the next feature lands as orchestrator code. The ratchet locks the floor.

Same pattern applies to every god-shaped file in the codebase. Extract → lower the ceiling → next feature is forced to extract.

## Status (2026-05-08)

After Phase 0–4 + 6 of `docs/superpowers/plans/2026-04-30-codebase-restructure.md`:

| File | Original | Current ceiling | Reduction |
|------|----------|-----------------|-----------|
| `core/i18n.ts` | 4720 | 120 | -97% (Phase 3 namespaces) |
| `core/i18n.scs.ts` | 4010 | 20 | -100% (Phase 3 barrel) |
| `utils/save.ts` | 1840 | 100 | -95% (Phase 1 split) |
| `art/sprites/icons/cards.ts` | 1725 | 5 | -100% (Phase 2 barrel) |
| `art/sprites/icons/weapons.ts` | 1615 | 5 | -100% (Phase 2 barrel) |
| `art/sprites/croft/seasonalProps.ts` | 1550 | 5 | -100% (Phase 2 barrel) |
| `art/sprites/decorations/biomeProps.ts` | 1095 | 5 | -100% (Phase 2 barrel) |
| `ui/HUD.ts` | 1225 | 1100 | -10% (Phase 4 builders) |
| `systems/JuiceSystem.ts` | 1380 | 1065 | -23% (Phase 6 sub-systems) |
| `scenes/GameScene.ts` | 2985 | 2880 | -4% (Phase 7 re-baseline; full split deferred to Phase 5) |

Open targets (Phase 5 / future):
- `scenes/GameScene.ts` — 2874 LOC, charter target ≤1200, immediate target ≤1700.

## Updating

**Lower a ceiling:** edit the constant in `src/utils/locBudget.test.ts`, run `npm test -- locBudget`.

**Raise a ceiling:** **strongly discouraged**. If absolutely necessary, add an inline comment with the linked task that will lower it again, e.g.:

```ts
['ui/HUD.ts', 1300], // raised from 1100 for spec X — split in T999
```

The CI gate fires when a file grows past its ceiling. Either split the file or own the ceiling raise with a comment that names the next deflation work.

## Files explicitly out of scope

Not on the ratchet (audited but kept whole):
- `entities/Player.ts` — heavily factored via `entities/` siblings (driftMastery, whiskyBreath, burnLeapInput, dashReverseStumble, mantlePulse, playerLevelScaling, bagpipeLure, softBoundarySteer, playerGrowthScale, runeConsumer). Marginal yield, hot-path risk.
- `entities/Enemy.ts` — same shape as Player, hot path.
- `data/banter.ts` — pure data, parity-fenced; splitting would move bytes without architectural payoff.
- `systems/AudioSystem.ts` — orchestrator with no obvious sub-system seams.
