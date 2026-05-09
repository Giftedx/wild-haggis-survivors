# QUALITY_BAR.md — The Non-Negotiable Standard

**Every change in this repo clears five filters. No exceptions. Trade-offs get declared, not hidden.**

> **Source:** owner directive, 2026-05-10. Promoted from private memory to canon docs and made enforceable. This doc supersedes any unwritten "we usually try to" expectation.

The repo runs lean: 484 test files / 852 source files / 4899+ unit tests / zero TODO/FIXME markers. The bar is what keeps it that way through one more year of feature pressure.

---

## The five filters

Every change — code, content, copy, doc, commit — passes all five. If a change can't pass one, declare the trade-off in the PR/spec body using the [trade-off template](#trade-off-declaration-template). Do not paper over.

### 1. Stand the test of time

The change should still read as the right call in twelve months, after the contributor who wrote it has rotated off and a stranger inherits it.

**Pass:** clear over clever. Pure helpers + replay determinism over scene state. Naming describes what the thing IS, not what it WAS-named-after or what it WILL-BECOME. Comments explain WHY when non-obvious; otherwise silent. Designed for re-reading, not first-write speed.

**Fail:** trend-chasing patterns, premature abstraction, half-finished impls, comments that restate code, names that reference the current task ("used by the W2 flow"), backwards-compatibility shims for code that hasn't shipped yet.

**Verify:** read your diff cold the next morning. If your future-self has to grep to understand a name, rename it now.

### 2. Ultra efficient

This is a 60-FPS browser game on a single canvas. Every frame is 16.67 ms; every allocation is GC pressure; every KB ships to every player.

**Pass:** no per-frame allocations in hot paths (Player.update, Enemy.update, WeaponSystem.fire*). Cache invalidation correct — see the bag-vs-cached-field gotcha in [`CLAUDE.md`](../CLAUDE.md#phaser-4-gotchas) (`SpawnSystem.spawnIntervalMult` resync pattern). Lookahead scheduler over `setInterval` for music ([`src/systems/music/`](../src/systems/music/)). Bundle delta cited in commit / spec for any feature.

**Fail:** `new Vector2()` inside `update()`. `array.filter().map().reduce()` chains allocating intermediate arrays per frame. Re-reading `RunModifiers` from the bag every tick when the value can't change mid-run. Adding a feature ≥2 KB gzip without justification.

**Verify:** for hot-path code, eyeball allocations (`new`, object literals, array methods that return new arrays). Frame budget is 16.67 ms at 60 FPS — hot paths (`Player.update` / `Enemy.update` / `WeaponSystem.fire*`) are measured in fractions of a millisecond × N entities, so an inner-loop allocation compounds fast. Don't guess — if you suspect a regression, profile in DevTools Performance with a live battle. For bundle adds, run `npm run build` and check the chunk sizes in [`docs/LOC_BUDGET.md`](LOC_BUDGET.md) and the dist output. **Current budget reference (2026-05-10):** `index` 211 KB gzip, `sprite-art` 191 KB gzip, `vendor-phaser` 374 KB gzip (pinned), `i18n.scs` 64 KB gzip (lazy). New systems should sit in the < 5 KB gzip / system band.

### 3. Secure

The threat surface is narrow (single-player browser game, no server today, no remote code execution paths) but the integrity surface is real: a corrupt save shouldn't crash; a malicious i18n string shouldn't escape; a future cloud-save layer shouldn't ship without a threat model.

**Pass:** boundary validation at every IO surface. The save loader already does this — [`src/utils/save/io.ts:71`](../src/utils/save/io.ts) `loadSave()` wraps `JSON.parse` in a `try/catch` returning `createDefaultSave()` on malformed input. Migrations chain through every schema version (no skipping). No `eval`, no `new Function`, no `innerHTML`, no `document.write`, no `dangerouslySetInnerHTML`. Phaser `Text` objects render canvas-side (no DOM XSS vector); keep it that way. No secrets in the bundle (no API keys, no PII, no analytics IDs hard-coded).

**Fail:** swallowing parse errors silently without falling back to a known-good default (silent corruption is worse than a thrown error). Loading user-controlled data into `Function` / `eval` / `JSON.parse` without try/catch. Adding a remote endpoint without an ADR + threat model (P3 cloud save, when it lands, will go through ADR-0006).

**Verify:** grep your diff for `eval(`, `new Function(`, `innerHTML\s*=`, `document.write`. If you added a JSON.parse on user-controlled data, confirm the catch path returns a valid default. If you added a remote endpoint, write the ADR first.

### 4. Technically impressive

The repo has earned scaffolding — T1 deterministic replay, EN/SCS parity-fenced i18n, four-skill expression layer, Sporran/CurseScene draft picker parity, restructure-locked LOC budgets. New work *composes* with these, not bolts on.

**Pass:** new mechanics ship as pure helper (`src/entities/`) + scene-game orchestrator (`src/scenes/game/`) + scene wires. Replay-deterministic given identical input streams (declared in CLAUDE.md entry). Player-facing copy lands in EN + SCS at the same commit. Save touches go through the migration chain. Damage paths use [`isPlayerHazardImmune`](../src/systems/isPlayerHazardImmune.ts), not inlined OR-chains. Sister-system pattern matched (Reliquary ↔ Clootie ↔ Cairn all share shape).

**Fail:** fattening GameScene past its 1680 LOC ceiling ([`docs/LOC_BUDGET.md`](LOC_BUDGET.md)). One-off RNG with `Math.random()` in a state-affecting path (breaks T1 replay — see [ADR-0002](adr/0002-deterministic-replay-format.md)). EN-only copy slipping past the [`ui.banter.*` parity fence](../src/core/i18n.locale.test.ts). Damage path that re-implements the immunity OR-chain inline.

**Verify:** does the change cite which existing system it composes with? If it touches save / i18n / damage / RNG, did you walk the [whole chain](#the-five-chains)? Spec under [`docs/superpowers/specs/`](superpowers/specs/) for non-trivial work — the spec doubles as the dispatch brief.

### 5. Minimal slop

Every line earns its place. Every file earns its existence. Every commit is a single coherent thought.

**Pass:** no defensive `try/catch` around things that don't throw (verify the call chain doesn't already handle it — see [`src/utils/save/io.ts:81`](../src/utils/save/io.ts) `writeSave` already routes through `emitSaveFailure`, no caller-side wrapping needed). No comments restating well-named code. No premature feature flags. No half-finished impls left as "TODO". No deferrals masquerading as features. No hedging language in commits ("attempted to fix", "should resolve") — claim it or don't ship.

**Fail:** "implement a solution for" instead of "fix". `try { ... } catch (e) { console.log(e) }` (silently eats real bugs). `// removed: foo` comments. Feature flags for code that has only one branch in production. Multi-paragraph docstrings on a 5-line function.

**Verify:** read your diff and ask "could this line be deleted without losing meaning?" If yes, delete it.

---

## Engineering practices

These aren't surface-keyed (so they're not chains) and aren't constants (so they're not invariants). They're the cross-cutting disciplines that make the filters self-enforcing.

### Tests are how the bar self-enforces

Pure helpers ship with unit tests at `<name>.test.ts` next to the source. State machines test invariants (e.g. `cycleStance` round-trip, `judgeGrudge` precedence). Save migration steps have roundtrip tests. New mechanics include ≥1 test that would have failed before the implementation existed. No `.skip`, `.todo`, `.only`, `xit`, or `it.only` left in committed code. **Vitest passes ≠ tsc passes** — `npm run build` is the type-correctness gate; vitest's esbuild is permissive on TS shape errors. Always run both before declaring green.

### Dependency restraint

Repo runs lean: Phaser, Vite, Vitest, Playwright, ESLint, TypeScript. Adding an npm package needs three checks documented in the PR or spec body:

1. **Bundle delta** — gzip cost vs. status quo. > 5 KB gzip needs strong justification.
2. **Maintenance signal** — last commit, open advisories (`npm audit`), license compatibility (no copyleft).
3. **Alternative considered** — could a 50-line helper or an already-loaded dep do the job?

New deps with player-facing impact require an ADR. The lean dep tree is part of the bar — protect it.

### No bypassing safety nets

- No `git commit --no-verify` (skips hooks).
- No `as any` / `as unknown as X` to silence type errors. Cast at the boundary; narrow inside. If you must, add a paired `// SAFETY:` comment naming the invariant that holds.
- No `// @ts-ignore` / `// @ts-expect-error` without paired comment + follow-up task ID.
- No `it.skip` / `xit` / `it.only` shipped to main.
- No `console.log` debugging artifacts in committed code (use a structured logger or remove).
- No swallowing exceptions — `try { ... } catch {}` without action is a bug. Log, recover with a known-good default, or rethrow.

Failures are signal. Debug the root cause; don't suppress it.

### Single source of truth for constants

Gameplay tunables live in [`src/config.ts`](../src/config.ts) or [`src/data/*.ts`](../src/data/). UI tokens live in [`DESIGN.md`](../DESIGN.md) frontmatter (per [`DOC_CONVENTIONS.md`](DOC_CONVENTIONS.md)). Magic numbers inline in scenes are bug magnets — if a value appears in two files, one of them is wrong. The one exception: tightly-scoped helper-internal constants (e.g. `BURST_MS = 320` inside `driftMastery.ts`) that are never read from outside the helper.

When a magic number escapes the helper into a sibling system, it gets named and moved to the right data file in the same change. Don't ship the second copy.

### Verify before report

When dispatching agents, when citing memory, when paraphrasing prior conversation: cross-check against current code state before treating the claim as truth. Memory snapshots are point-in-time, not authoritative. Agent reports describe intent, not necessarily what was done. A remembered fact gets verified before it becomes a recommendation; an agent's diff gets read before it gets reported as shipped.

This applies inside this doc too — when citing a file path or line number, confirm it resolves before publishing.

### Documentation is part of done

- New mechanic = entry in [`CLAUDE.md`](../CLAUDE.md) `### Key Mechanics`.
- Architectural change = ADR under [`docs/adr/`](adr/).
- Spec drift on a charter'd item = spec truth-up before close.
- New canon doc = entry in [`docs/INDEX.md`](INDEX.md) + [`docs/DOC_CONVENTIONS.md`](DOC_CONVENTIONS.md) root-canon list.
- Memory bump on ship for non-trivial work (per `~/.claude/CLAUDE.md` reflect rule).

A change that exists only in the commit message will rot. Externalize to docs that future-self (or future-contributor) can find by structure.

---

## The six chains

Cross-cutting changes ship the whole chain or none of it. Partial chains rot fast.

### Save state chain

Touching anything persisted in `whs_save` / `whs_meta_save` / `whs_game_settings`:

1. Bump `SAVE_SCHEMA_VERSION` in [`src/utils/save/schema.ts`](../src/utils/save/schema.ts) (currently 18).
2. Add `migrateV{N-1}ToV{N}` step in [`src/utils/save/migrations.ts`](../src/utils/save/migrations.ts).
3. Update the type in [`src/utils/save/types.ts`](../src/utils/save/types.ts).
4. Add a bumper helper in [`src/utils/save/bumpers.ts`](../src/utils/save/bumpers.ts) if the field is mutated mid-session.
5. Add a query helper in [`src/utils/save/queries.ts`](../src/utils/save/queries.ts) if read from multiple call-sites.
6. Update [`src/utils/save/history.ts`](../src/utils/save/history.ts) if persisted across runs.
7. Add migration unit test under [`src/utils/save/`](../src/utils/save/) covering the new step.
8. Add i18n keys (EN + SCS) if surfaced in UI.
9. Declare replay status in CLAUDE.md entry: deterministic / cosmetic-only.

### i18n parity chain

Touching player-facing copy:

1. Add EN key in the relevant namespace under [`src/core/i18n/`](../src/core/i18n/).
2. Add SCS key in [`src/core/i18n.scs.ts`](../src/core/i18n.scs.ts) — required for `ui.banter.*` (CI-fenced), strongly preferred for everything else.
3. Resolve at the call site via `t('namespace.key')`. Never hard-code English.
4. CI gate: [`src/core/i18n.locale.test.ts`](../src/core/i18n.locale.test.ts) enforces SCS→EN subset (no orphan overlays) and EN→SCS scoped to `ui.banter.*`.

### Damage path chain

Touching anything that can damage the player:

1. Use [`isPlayerHazardImmune(postHitIframed, dashInvincible, hazardLeaping, assistInvincible)`](../src/systems/isPlayerHazardImmune.ts) — never inline the OR chain. Both [`HazardZones.ts`](../src/scenes/game/HazardZones.ts) and [`HazardsSystem.ts`](../src/systems/HazardsSystem.ts) share it; pre-2026-04-28 they drifted (HazardsSystem missed post-hit iframes + Assist Mode).
2. Apply post-hit iframes via the canonical Player path; don't reset them out from under another system.
3. Confirm the path respects parry hooks (`Player.tryParryProjectile`) where relevant.
4. Confirm the path respects Burn-Leap / dash invincibility in `update()` ordering.

### State RNG / replay chain

Touching any randomness that affects gameplay state:

1. Use `getRunRng()` / `runRng` — never `Math.random()` and never `Date.now()`-seeded ephemeral RNG for state-affecting rolls. Cosmetic-only randomness (UI shuffle with no replay-side effect) may use `Math.random` but **state the cosmetic-only carve-out explicitly** in the code/spec — Sporran v1 did this for its draft DRAW shuffle.
2. RNG-stream order in lifecycle resets (`resetTransientRunState`) is a contract — append at the tail, never insert mid-sequence. Order is [reliquary → clootie → ...], locked.
3. Arcade physics is `fps:60, fixedStep:true` ([`src/main.ts`](../src/main.ts)). Don't revert to variable-delta integration; replay format ([ADR-0002](adr/0002-deterministic-replay-format.md)) assumes it.
4. CI gate: [`src/replay/replayDeterminism.test.ts`](../src/replay/replayDeterminism.test.ts).
5. Declare replay status in CLAUDE.md entry: "replay-deterministic given identical input streams (T1 contract)" or named cosmetic-only carve-out.

### New mechanic chain

Adding a new mechanic / system:

1. Pure helper at `src/entities/<name>.ts` or `src/systems/<name>.ts` — state machine + edge events, no Phaser imports, replay-deterministic.
2. Helper unit test at `src/entities/<name>.test.ts` or `src/systems/<name>.test.ts`.
3. Phaser-bound orchestrator at `src/scenes/game/<name>.ts` if there are scene-side effects (sprites, tweens, SFX).
4. Wire from `Player.update` / `GameScene.create` / `GameScene.update` (after [`isGameplayPaused()`](../src/scenes/GameScene.ts) early-return).
5. Texture-exists guards on every `scene.add.image`/`sprite` so unit-test stubs that skip BootScene baking don't render the magenta missing-texture placeholder.
6. i18n keys (EN + SCS) for any copy.
7. Banter pool entry if the mechanic has a voiceful moment — see [`docs/BANTER_AUTHORING.md`](BANTER_AUTHORING.md).
8. CLAUDE.md entry under `### Key Mechanics` (replay status declared, sister-systems cited, references to research).
9. Memory bump on ship.
10. Spec truth-up if the work was charter'd.

### Accessibility chain

Touching anything player-facing visual, audio, or input. The repo has earned scaffolding here ([`docs/ACCESSIBILITY_RESEARCH.md`](research/ACCESSIBILITY_RESEARCH.md), the `A1_*` audit docs, a Settings layer with `reducedMotion` / `disableHazards` / `reduceParticles` / `disableSeasonalEvents` opt-outs); new work has to compose with it, not undo it.

1. **Reduce-motion respected.** Honor the existing settings. New screen-shake / parallax / continuous animation routes through the relevant opt-out — don't add a fourth toggle without an ADR.
2. **Photosensitive-safe.** No rapid full-screen flashes at > 3 Hz. New flash / burst / strobe effects clear [`docs/A1_PEAT_AUDIT.md`](A1_PEAT_AUDIT.md) (the canonical photosensitivity audit) before ship. When in doubt, gate behind `reducedMotion`.
3. **Colorblind-distinct.** Signal via shape + intensity + position, never color alone. See [`docs/A1_NON_COLOUR_ALONE.md`](A1_NON_COLOUR_ALONE.md). Elite glyph + boss diamond + hazard shape are the canonical patterns.
4. **Captions where audio carries meaning.** Tracked in [`docs/A1_CAPTIONS_INDEX.md`](A1_CAPTIONS_INDEX.md). Boss warnings, intro stings, narrative beats all need text equivalents.
5. **Input parity.** Any new mouse / touch interaction also works on keyboard + gamepad. CurseScene/SporranScene tile pickers are the model.
6. **Assist Mode considered.** See [`docs/A1_ASSIST_MODE_CALLSITES.md`](A1_ASSIST_MODE_CALLSITES.md) — the UI is deliberately hidden until balance + replay-determinism passes; new damage-mod / speed-mod / invincibility toggles must respect that gate (don't ship them visible).

---

## Sacred invariants

Some constraints are fragile-by-default. They are documented here AND at the site. Surface them when adding/agent-briefing in the area.

| Invariant | Source-of-truth | The lock |
|---|---|---|
| Replay determinism | [ADR-0002](adr/0002-deterministic-replay-format.md), [`replayDeterminism.test.ts`](../src/replay/replayDeterminism.test.ts) | All state-affecting RNG via `runRng`; arcade fixed-step `fps:60`; lifecycle RNG-stream order locked |
| LOC budgets | [LOC_BUDGET.md](LOC_BUDGET.md), [`src/utils/locBudget.test.ts`](../src/utils/locBudget.test.ts) | GameScene ≤ 1680 (T401 floor 1656); GameOverScene ≤ 300; SettingsScene ≤ 685; Enemy ≤ 1570; Player ≤ 1540 — ratchet down only |
| i18n parity | [`i18n.locale.test.ts`](../src/core/i18n.locale.test.ts) | SCS→EN subset (no orphans); EN→SCS scoped to `ui.banter.*` |
| Schema migration | [`save/schema.ts`](../src/utils/save/schema.ts), [`save/migrations.ts`](../src/utils/save/migrations.ts) | Version bump requires matching `migrateV{N-1}ToV{N}` step; chain runs on every load |
| Hazard immunity | [`isPlayerHazardImmune.ts`](../src/systems/isPlayerHazardImmune.ts) | Single shared predicate; both HazardZones + HazardsSystem read it |
| Burns evolution count | `BURNS_EVOLUTION_THRESHOLD` in [`save/schema.ts`](../src/utils/save/schema.ts) | Currently 10. Lift +1 when shipping a new evolution recipe; update achievement copy in EN + SCS to match. |

When adding a constant, threshold, or ordering that's fragile-by-default, write a one-line comment at the declaration explaining the lock, and (if feasible) add a paired test.

---

## Pre-ship 5-question gate

Before merging, answer these in the PR/spec body. A "no" is not a block — it's a declared trade-off (see template below).

1. **Filters cleared?** All five filters pass. Anything that doesn't is declared in the trade-off section.
2. **Chains walked?** If the change touched save / i18n / damage / RNG / mechanic, every chain step landed in this same change.
3. **Invariants surfaced?** If the change is in the neighbourhood of a sacred invariant, the invariant is named in the PR body.
4. **Verification proof?** Quote actual `npm run ci` output (lint + test count + build success). For UI / feel work, screenshot or recorded behaviour.
5. **Soul Check passed?** [Six questions in `DESIGN_SOUL.md`](DESIGN_SOUL.md). For player-facing work; skip for pure-engine work.

---

## Trade-off declaration template

Paste into the PR/spec when a filter can't be cleared:

```markdown
## Quality bar trade-offs

- **Filter:** [stand the test of time | ultra efficient | secure | technically impressive | minimal slop]
- **Why this change can't clear it:** <one paragraph>
- **What we gained by accepting the trade-off:** <one paragraph>
- **Follow-up to lift the trade-off:** <task ID + path, or "won't lift, structural">
- **Reviewer sign-off required:** <yes/no — yes for security, replay, schema; otherwise no>
```

If you can't fill all five fields cleanly, the trade-off isn't ready — keep working.

---

## Cross-references

- [`AGENTS.md`](../AGENTS.md) — agent working agreement; cites this doc as the standard.
- [`CLAUDE.md`](../CLAUDE.md) — Claude-specific gotchas and patterns; cites this doc.
- [`docs/DESIGN_SOUL.md`](DESIGN_SOUL.md) — Soul Check + Warmth Audit (player-facing filter, parallel to this doc).
- [`docs/DOC_CONVENTIONS.md`](DOC_CONVENTIONS.md) — file location + naming rules.
- [`docs/LOC_BUDGET.md`](LOC_BUDGET.md) — per-file LOC ceilings.
- [`docs/INDEX.md`](INDEX.md) — top-level docs map.
- [`docs/adr/0002-deterministic-replay-format.md`](adr/0002-deterministic-replay-format.md) — replay determinism contract.
- [`docs/research/`](research/) — eight reference docs grounding design intent.

---

## When this doc changes

- **Trivial wording:** edit in place. No ceremony.
- **Filter additions or sacred-invariant additions:** update via spec under [`docs/superpowers/specs/`](superpowers/specs/) so the change is reviewable.
- **Filter relaxations:** owner sign-off required. Capture as ADR (`docs/adr/NNNN-quality-bar-relaxation.md`) explaining why and what compensates.

The bar is non-negotiable per change. The bar itself is revisable per ADR.
