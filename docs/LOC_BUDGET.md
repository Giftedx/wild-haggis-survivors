# LOC Budget Ratchet

Test: `src/utils/locBudget.test.ts`

Policy: each top-of-file ceiling can only be **lowered**, never raised silently. Raising one requires an inline comment explaining why (e.g. "post-merge of feature X — to be split in follow-up Y").

## Why this exists

GameScene shipped to ≤1656 LOC under T401 (charter target ≤1200). Within four months it regrew to 2983 LOC as features landed inline. Without a guardrail, every helper extraction silently leaks back as the next feature lands as orchestrator code. The ratchet locks the floor.

Same pattern applies to every god-shaped file in the codebase. Extract → lower the ceiling → next feature is forced to extract.

## Status (2026-05-09)

After Phase 0–7 of `docs/superpowers/plans/2026-04-30-codebase-restructure.md`:

| File | Original | Current ceiling | Reduction |
|------|----------|-----------------|-----------|
| `core/i18n.ts` | 4720 | 115 | -98% (Phase 3 namespaces) |
| `core/i18n.scs.ts` | 4010 | 20 | -100% (Phase 3 barrel) |
| `utils/save.ts` | 1840 | 95 | -95% (Phase 1 split) |
| `art/sprites/icons/cards.ts` | 1725 | 5 | -100% (Phase 2 barrel) |
| `art/sprites/icons/weapons.ts` | 1615 | 5 | -100% (Phase 2 barrel) |
| `art/sprites/croft/seasonalProps.ts` | 1550 | 5 | -100% (Phase 2 barrel) |
| `art/sprites/decorations/biomeProps.ts` | 1095 | 5 | -100% (Phase 2 barrel) |
| `ui/HUD.ts` | 1225 | 1100 | -10% (Phase 4 builders) |
| `systems/JuiceSystem.ts` | 1380 | 1065 | -23% (Phase 6 sub-systems) |
| `scenes/GameScene.ts` | 2985 | 1680 | -44% (Phase 5 helper extraction; T401 floor 1656 honoured) |
| `scenes/GameOverScene.ts` | 1310 | 300 | -77% (Phase 5 panel/row/link/action builders under scenes/game-over/) |
| `scenes/SettingsScene.ts` | 1350 | 685 | -49% (Phase 5 row builders under scenes/settings/) |

Charter target for `scenes/GameScene.ts` is ≤1200 (T401 spec). Reaching it requires
the formal facade rewrite (Combat / Progression / Nodes / Persistence) explicitly
out of scope for the 2026-04-30 restructure plan. The ratchet at 1680 locks the
post-Phase-5 floor against silent regrowth.

Passive guards (already-tight files on the ratchet, not primary deflation targets):

| File | Current ceiling | Note |
|------|-----------------|------|
| `entities/Enemy.ts` | 1570 | Hot path; factored via `entities/` siblings |
| `entities/Player.ts` | 1540 | Hot path; factored via `entities/` siblings |
| `systems/AudioSystem.ts` | 1245 | Orchestrator; no obvious sub-system seams. Bumped 2026-05-09 (1210→1245) for Pibroch sting (`playPibrochStingImmediate` / `playPibrochSting`) |
| `systems/WeaponSystem.ts` | 1335 | Orchestrator; sub-system seams thin. Bumped 2026-05-09 (1330→1335) for Pibroch sting wiring (`pibrochAligned` const + `audio.playPibrochSting()`) |
| `data/banter.ts` | 2240 | Pure data, parity-fenced |

## Updating

**Lower a ceiling:** edit the constant in `src/utils/locBudget.test.ts`, run `npm test -- locBudget`.

**Raise a ceiling:** **strongly discouraged**. If absolutely necessary, add an inline comment with the linked task that will lower it again, e.g.:

```ts
['ui/HUD.ts', 1300], // raised from 1100 for spec X — split in T999
```

The CI gate fires when a file grows past its ceiling. Either split the file or own the ceiling raise with a comment that names the next deflation work.

## Files audited but kept whole (passive ratchet guards)

These sit on the ratchet at their natural size as anti-regrowth guardrails, not
as primary deflation targets:

- `entities/Player.ts` — heavily factored via `entities/` siblings (driftMastery, whiskyBreath, burnLeapInput, dashReverseStumble, mantlePulse, Player.mantle, playerLevelScaling, softBoundarySteer, playerGrowthScale, xpGemMagnet, xpGemTier) plus cross-system consumers (`systems/runes/runeConsumer.ts`). Marginal yield, hot-path risk.
- `entities/Enemy.ts` — same shape as Player, hot path.
- `data/banter.ts` — pure data, parity-fenced; splitting would move bytes without architectural payoff.
- `systems/AudioSystem.ts` — orchestrator with no obvious sub-system seams.
- `systems/WeaponSystem.ts` — orchestrator; sub-system seams thin.
