# REVIEW.md — Adversarial Read of the Project, 2026-05-10

> **2026-05-10 update.** The `docs/QUALITY_BAR.md` doc cited throughout this review was demoted, shrunk, and renamed to [`CONTRIBUTING.md`](../CONTRIBUTING.md) on the same day in response to finding C7. The review's links to `QUALITY_BAR.md` now 404; the substantive arguments still apply against the new CONTRIBUTING.md doc, just at a smaller surface area.

**Reviewer:** skeptical senior engineer who just inherited the codebase. **Posture:** the previous owner is suspected of overconfidence. Earlier work is not sacred, including the planning pass that wrote `docs/QUALITY_BAR.md` two days ago.

> **Methodology.** Read the canon docs (root + `docs/` north stars + a sample of ADRs/specs/status) with fresh eyes. Cross-checked claimed numbers against `wc -l`, `git log`, dist build output, e2e specs, and source code. Spent equal time looking for what's **not** said as for what is.

> **Bottom line up front.** This project has built a documentation industry around an unreleased browser game with no defined ship destination. The discipline scaffolding has become its own deliverable. Three of the most-cited "non-negotiable" gates are violated in the working tree right now. Velocity is being optimised at the expense of validation. **The previous planning pass solved the wrong problem.** It codified engineering discipline; it should have asked what the project is for.

---

## Critical issues

### C1 — There is no ship target. Everything else assumes one.

[`docs/OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) Q9 is **"Public ship decision (timeline + venue)"** and is marked **Priority: Low**. Steam? itch.io? Browser-only? Native? No date target. No success metric.

But the rest of the project assumes the answer is settled:

- [`docs/HUGE_INITIATIVES_MASTER_PLAN.md`](HUGE_INITIATIVES_MASTER_PLAN.md) lists kill criteria like "If 15-relic launch tests show build dominance (one relic picked >60% of runs), rebalance and defer launch." There are no launch tests. There is no telemetry. The kill criterion can never fire.
- [`docs/PRD.md`](PRD.md) tracks "Flagship status" with shipped/partial/deferred markers as if towards a release.
- [`docs/QUALITY_BAR.md`](QUALITY_BAR.md) Filter #1 says "stand the test of time, after the contributor who wrote it has rotated off." For whom? There is no team to rotate.
- [ADR-0006](adr/0006-cloud-save-backend.md) ratifies a Workers + D1 + Resend cloud-save architecture. Cloud save for what user count? On what timeline?

Without Q9 answered, the apparatus is **velocity theatre**. The 2026-05-09 mechanics sprint shipped 13 features in one day (PRD lines 46–66). Twelve of the thirteen ([`9f6a694`](https://github.com/...) Race the Beithir / [`12357dc`](https://github.com/...) Shinty Parry / [`805e03c`](https://github.com/...) Stag Antler / etc.) have been touched only by AI agents. Per the user's own framing, no human has played them. The project's growth rate is decoupled from any consumer.

**What I'd do instead.** Promote Q9 to Priority: Critical. Pick one of three honest answers:

1. **"This is a portfolio piece for me; never shipping for revenue."** Then delete the kill-criterion language, the cloud-save ADR, the mobile-device matrix, the cultural-review gates, and most of `docs/superpowers/specs/`. Keep the game. The 8-doc research foundation becomes an art project, which is fine, but stop pretending it's flagship infrastructure.
2. **"Free browser game on Cloudflare Pages, no monetisation, ship within 8 weeks."** Then declare a feature freeze TODAY. Stop the mechanics sprints. Resolve native review (Q5) + PEAT (Q6) + a real human playtest cycle. Delete deferred features (P3 cloud, W95 mobile, W27 capture Phase 2) from the master plan instead of parking them.
3. **"Paid Steam release in N months."** Then find collaborators. A solo dev cannot legally ship Burns-citational content + Gaelic + Doric + Shetlandic + Norn-tinged voice variants without native review without exposing themselves to legitimate criticism. The QUALITY_BAR's "stand the test of time" filter would catch this if it were enforced; it isn't being enforced.

Refuse to do any more flagship work until Q9 is closed. The cost of that refusal is zero, because the work-in-progress can wait. The cost of continuing without it is more sunk effort into untargeted artefacts.

### C2 — The LOC ratchet is a logbook of permission slips, not a ratchet.

[`src/utils/locBudget.test.ts`](../src/utils/locBudget.test.ts) docstring says: *"Lower an entry only after that file has been split. Never raise silently."* [`docs/LOC_BUDGET.md`](LOC_BUDGET.md) reinforces: *"each top-of-file ceiling can only be lowered, never raised silently."*

In reality, on **2026-05-09 alone**, six ceilings were raised, multiple times each:

| File | Ceiling change in one day | Reason given |
|---|---|---|
| `entities/Player.ts` | 1556 → 1620 → 1705 → 1720 → 1840 → **1860** | Stance + Parry + Clootie + Beithir + Stag Antler |
| `systems/WeaponSystem.ts` | 1360 → 1385 → 1415 → 1450 → **1685** | Grudge emit + Shinty + Sgian + Stag |
| `systems/AudioSystem.ts` | 1210 → 1245 → 1315 → 1365 → **1500** | Pibroch + Parry SFX + Lemmings + Beithir trio |
| `ui/HUD.ts` | 1100 → 1165 → 1245 → **1310** | Stance + Parry + Beithir |
| `data/banter.ts` | 2375 → 2400 → 2430 → 2455 → 2490 → 2535 → 2565 → 2620 → **2700** | Eight new mechanic banter pools |
| `entities/Enemy.ts` | 1570 → 1585 → **1670** | Nicnevin + Beithir |

The ratchet didn't ratchet. It documented the bumps with paragraph-long inline comments and let them through. The "never raise silently" rule is satisfied (every bump has a comment), but the *intent* — force extraction before raising — is dead.

[`docs/PRD.md:71`](PRD.md) still claims "GameScene 1672 LOC (ceiling 1680, T401 floor 1656)". The actual current state is **1818 LOC, ceiling 1830**. PRD is stale by one day; my own [`docs/QUALITY_BAR.md`](QUALITY_BAR.md) sacred-invariants table says "GameScene ≤ 1680" and is wrong on day three.

The 2026-04-30 codebase-restructure plan landed with seven phases of extraction work specifically to enable the ratchet. One day later (2026-05-09) the ratchet was raised six times in a single sprint. The discipline survived approximately 24 hours.

**What I'd do instead.** One of:

1. **Hard-freeze the ceilings for 30 days.** No bumps, only splits. If a feature can't fit, it doesn't ship. Test the discipline as a discipline, not a logbook.
2. **Delete the ratchet test entirely** and stop pretending it's a gate. Replace with a single reporting check that prints "GameScene grew by N% since last release tag" so the regression is visible without a faux-gate that always passes.

Option 1 is harder. Option 2 is more honest about current behaviour. Either is better than the current state of "we have a discipline document and we ignore it."

### C3 — 13 mechanics shipped 2026-05-09 with zero integration coverage. Tests are green and feature behaviour is unverified.

> **2026-05-10 update.** Largely closed. 7 specs landed in Phase 3 (commit 9cbf6ee) but 4 of those (shinty_parry / stance_toggle / sporran_deck / grudge_ledger) shipped without verification and were silently broken by the `COUNTDOWN`-token pause gate (Player.update returns early during the 3-2-1 freeze, so any keypress inside the wait window is dropped) and a `keyboard.press()` race against Phaser's per-frame key-state poll. The follow-up commit fixed those 3 + added 4 NEW specs (whisky_breath, drift_mastery, cairn_stack, stag_antler). Status now: 10 passing + 1 declaratively skipped (grudge_ledger — `DEBUG.killCurrentBoss` routes through Enemy.events, not WeaponSystem.events, so the ledger listener never fires; tracked as `grudge-event-split` TODO in the spec body, fix is a source-code change to forward Enemy-emit kills through WeaponSystem). Untouched: sgian_dubh + shinty_stick (auto-firing weapons; helper tests dominate, no input wiring at risk).

Verified by `grep` against `e2e/*.spec.ts`: no e2e spec covers `beithir`, `shinty_parry`, `stance_toggle`, `clootie`, `stag_antler`, `sgian_dubh`, `whisky_breath`, `drift_mastery`, `cairn_stack`, `lemming`, `grudge_ledger`, or `sporran_deck` (the few false-positive matches are for the older `sporran_of_holding` relic).

Unit tests for the pure helpers exist (verified — `raceTheBeithir.test.ts`, `shintyParry.test.ts`, `stanceToggle.test.ts`, `clootieRagWager.test.ts`, `grudgeLedger.test.ts`, `lemmingsTrigger.test.ts`, `sporranDeck.test.ts`). They test state machines in isolation. They cannot detect:

- Whether pressing E in-game actually opens the parry window (wiring).
- Whether the Beithir spawns at game-second 660 (wiring + spawn system).
- Whether Q actually re-bakes the drift matrix on cycle (wiring + recalcStats).
- Whether the Lemmings parade fires after 90s coastal idle (wiring + biome detection + idle predicate).
- Whether a Sporran-deck pre-run pick actually applies its modifier in-game (wiring + RunModifiers + scene init data).

[`docs/QUALITY_BAR.md`](QUALITY_BAR.md) "New mechanic chain" requires a helper test. It does not require integration test or e2e. The chain passes for shipped-but-unwired features.

The PRD claims the sprint shipped "13 features in one day". That is a code-shipped count, not a play-shipped count. The implicit assumption is that helper tests + types + lint passing = feature works. **It doesn't.** Phaser scene wiring is glue logic that helper tests don't cover. Field-test of any of the 13 features may reveal: keybind clashes, scene-pause edge cases, save-roundtrip drops, replay non-determinism, audio scheduling races.

**What I'd do instead.** Add to the New Mechanic Chain in `QUALITY_BAR.md`: *Step 11: One e2e smoke spec under `e2e/<mechanic>.spec.ts` that drives the input through the running game and asserts an observable state change* (a HUD widget appearing, a banter line firing, a save-state field bumping). The bar is a smoke spec — not a comprehensive integration suite — but it catches "did wiring break" which is the dominant failure mode of helper-tested-only mechanics.

Then write the missing 13 specs before shipping anything else. If that's too tedious, the bar wasn't worth writing.

### C4 — Cultural content shipped to production without native-speaker review.

[`docs/OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) Q5 (Priority: Medium-high): native-speaker review for Doric / Shetlandic / Gaelic / Burns Canongate is **open**. Live build at [`wild-haggis-survivors.pages.dev`](https://wild-haggis-survivors.pages.dev) ships:

- Doric Quinie variant with author-only Doric voice ([`src/data/variants.ts`](../src/data/variants.ts)).
- Peerie Shetlander with author-only Shetlandic / Norn-tinged voice.
- Burns's Wee Beastie with author-only Burns-citational voice — and `docs/C2_BURNS_PROVENANCE.md` flags this for Kinsley + Canongate provenance audit.
- 8 Gaelic banter leaves flagged for native review (per memory `project_b1_phase1_status`).

The ship is reversible (variants/banter are data). The reputational + ethical exposure of being seen to ship dialect content the writer doesn't speak is not. [`docs/research/CULTURAL_SENSITIVITIES_RESEARCH.md`](research/CULTURAL_SENSITIVITIES_RESEARCH.md) is one of the eight north-star research docs the project pretends to honour. It explicitly warns about exactly this posture.

The QUALITY_BAR doc I wrote two days ago has a "Secure" filter and an "Accessibility" chain. It does not have a "Cultural review" chain or a "do not ship dialect content without a native speaker" rule. That's a gap I introduced.

**What I'd do instead.**

1. Either (a) un-publish the unreviewed variants from production until review closes, or (b) prepend a clearly visible "early-access; dialect content under review" splash on the live build.
2. Add a 7th chain to QUALITY_BAR.md: **Cultural review chain** — any dialect content (Scots / Doric / Shetlandic / Gaelic / Norn) requires either a named native-speaker review record or a "DRAFT — author only" caption visible to the player.
3. Q5 ceases to be Priority: Medium-high and becomes blocking. Source one Doric, one Shetlandic, one Burns scholar, one Gaelic native via paid consultant search. If the budget for that doesn't exist, descope the variant pack to Glaswegian + classic only and remove the rest.

### C5 — A1 Accessibility flagship is "shipped" but the safety-critical audit hasn't been performed.

[`docs/HUGE_INITIATIVES_MASTER_PLAN.md:55`](HUGE_INITIATIVES_MASTER_PLAN.md) shows A1 as 🟡 partial: "M2–M6 shipped 2026-04-24; M1 PEAT human-gated." The kill criterion reads: *"If PEAT audit flags unfixable seizure risk in shipped VFX, mandate rebuild of that VFX — no player-facing ship until resolved."*

The PEAT audit has not been run. The criterion can never fire. Live build is shipping VFX that has not been seizure-screened, while the project simultaneously claims a "ship-quality bar" of accessibility.

The QUALITY_BAR doc I wrote two days ago cites [`docs/A1_PEAT_AUDIT.md`](A1_PEAT_AUDIT.md) as the source-of-truth for photosensitivity safety. That file is a 25-row matrix, not an audit result. Citing an unread checklist as canon is the documentation-industry pattern at its most acute: the apparatus exists, the inspection doesn't.

**What I'd do instead.**

1. Either (a) commission a paid PEAT pass from an accessibility consultancy ($500–$2000 typical), or (b) acknowledge in [`README.md`](../README.md) and the live build's first-launch splash that VFX has not been independently audited, then descope the "Steam Accessibility tag" claim from PRD.
2. Pin the production build's `reduceFlashing` setting to default-on until (a) lands. The current default is off ([`src/utils/save/types.ts`](../src/utils/save/types.ts) `DEFAULT_SETTINGS`). Pinning costs nothing and removes the reasonably-foreseeable harm.

### C6 — Doc-to-code ratio is upside down. The project is a documentation industry.

Counts (verified):
- **866** markdown files (excl. node_modules/.git/dist).
- **852** TypeScript source files (excl. tests).
- **485** test files.
- **33** design specs in `docs/superpowers/specs/`.
- **45** implementation plans in `docs/superpowers/plans/`.
- **6** ADRs.
- **8** research north-star docs at ~150k words.

A solo-dev unreleased browser game has more markdown files than source files. The 33 specs + 45 plans implies an average of ~78 multi-page documents per "flagship-class" piece of work, where the master plan recognises ~20 flagships. The maintenance cost of those 78 docs is non-zero — every memory bump, CLAUDE.md update, INDEX.md update, spec truth-up, plan status flip is human-or-agent attention paid to documentation rather than to play.

The framing presented as virtue ("the discipline is what makes this possible") obscures the actual question: *if the documentation overhead is justified, what does it produce?* The answer should be a shippable, played, validated game. It produces more documentation.

**What I'd do instead.**

1. **Aggressive doc-archival.** Move every spec/plan/dispatch dir older than 14 days to `docs/archive/`. The plans INDEX claims "kept in-tree because 28+ references across docs/ link to plan paths" — so audit those references. Either the reference is load-bearing (rare) or it's stale (likely) and the plan can move.
2. **Cap research/.** The 8 research docs are reference material. Move to a `research/` subrepo or freeze edits for one quarter; verify whether any change to a research doc has shipped to a feature. If not in 90 days, it's a museum.
3. **One spec per flagship, full stop.** No `2026-04-23-foo-design.md` + `2026-04-26-foo-followups.md` + `2026-04-29-foo-truth-up.md`. Truth-up the original; archive nothing in-place.
4. **Memory entries are not flagship records.** The 70+ entries in `~/.claude/projects/.../memory/MEMORY.md` (per the index file I saw) are private agent state, not project documentation. They should not be cited from project docs. The project docs should be self-contained.

### C7 — The previous planning pass (QUALITY_BAR.md) solved the wrong problem.

The doc I wrote two days ago codifies five filters + six chains + sacred invariants + pre-ship gate + trade-off template + engineering practices. It is a competent engineering-discipline document. **It is the wrong document.**

What it assumes:
- The project has a destination (it doesn't — see C1).
- The discipline scaffolding is the binding constraint on quality (it isn't — the constraint is whether anyone has played the game).
- AI-agent contributors will read and follow it (they will, because they have to — but human verification of the result is missing).
- Codifying invariants makes them durable (the LOC invariant survived 24 hours — see C2).

What it does:
- Adds friction to changes that are already over-engineered for a solo project (every mechanic now traverses 6 chains + 5 filters + Soul Check).
- Makes me, the writing agent, feel productive without addressing C1–C6.
- Cites file-paths and line-numbers that drift the moment any of those files change (PRD claims I encoded as "GameScene ≤ 1680" were already stale).
- Becomes a fifth canon doc next to README + CLAUDE + AGENTS + DESIGN_SOUL — and per C6, the project has too many of these already.

**What I'd do instead.**

1. Demote QUALITY_BAR.md from a "non-negotiable standard" to a contributor's guide. Keep the contents; reframe the rhetoric. Stop calling it canon.
2. Replace the headline filter set with a one-question pre-ship gate: ***"Can a real human play the change without a contributor walking them through it?"*** If no, don't ship. If yes, ship. Everything else (LOC, i18n parity, replay determinism) is in service of that question.
3. Acknowledge that the bar is aspirational on first contact with the codebase: GameScene already breaks the cited LOC ceiling, A1_PEAT cited as canonical hasn't been audited, native review cited as gate hasn't gated the ship. A bar that the live state already violates has no force.

---

## Substantive concerns

### S1 — Three save stores. Duplication. Migration to one owner deferred indefinitely.

[`README.md:40-43`](../README.md) and [`docs/PRD.md:12-15`](PRD.md): three independent localStorage keys (`whs_save` v18, `whs_meta_save` v9, `whs_game_settings` v1). Per CLAUDE.md, "the historical `whs_save` and the newer `whs_meta_save` overlap on some fields by design — the migration to a single owner is a future cleanup tracked in P3."

P3 (cloud saves) is its own gated-on-humans flagship. It's not a save-architecture cleanup. The "future cleanup" has been future-cleanup-ish for unknown duration — the deferred-overlap predates the 2026-04-23 master-plan refresh, which is at least 17 days ago, and probably longer.

Three save stores in a solo-dev game is an architectural smell that compounds: every save-touching feature now ostensibly requires deciding which store, every migration ostensibly chains through the right one, every cloud-save plan handles the trinity. ADR-0006 doesn't address consolidation.

**What I'd do.** Schedule a 1-day spike to merge `whs_meta_save` into `whs_save`. Schema bump v18→v19 + migration step + delete `whs_meta_save` reads after one playable session loads cleanly from the merged store. If the spike fails, the answer is "the duplication is structural" and that goes in an ADR. Right now it's deferred without analysis.

### S2 — PRD line 70 contradicts line 71.

[`docs/PRD.md`](PRD.md):

- Line 70: "T401 GameScene decomposition — ongoing slice extractions; running journal at `docs/status/engine/SCENE_REFACTOR_GAP_AUDIT.md`. **GameScene 3526 → ~3418 LOC** across recent slices."
- Line 71: "Codebase restructure (2026-04-30) — Phases 0–7 SHIPPED by 2026-05-09 [...]; **GameScene 1672 LOC** (ceiling 1680, T401 floor 1656)."

Both claims about current GameScene state. Both can't be right. Actual current state (verified): **1818 LOC**.

This is exactly the genre of doc-drift the project's own DOC_CONVENTIONS warns against (line 148: "If a doc claim disagrees with the code [...] verify the code first"). The PRD breaks its own rule.

**What I'd do.** Either (a) reword line 70 to make clear it tracks a *historical* T401 chain that's been superseded, or (b) delete line 70 and let the codebase-restructure entry stand alone. Pick one.

### S3 — Master plan kill criteria are unverifiable.

Sample kill criteria from [`HUGE_INITIATIVES_MASTER_PLAN.md`](HUGE_INITIATIVES_MASTER_PLAN.md):

- Relics R1: *"If 15-relic launch tests show build dominance (one relic picked >60% of runs)..."* — **There are no telemetry events tracking relic-pick frequency.** No "launch tests" exist.
- Variants V2: *"If any variant's unlock-gate completion rate <5% over 1 month of telemetry..."* — **No telemetry on unlock-gate completion.**
- Banter B1: *"If EN→SCS parity fence fails for >2 weeks with new lines pending translation..."* — At least this one is checkable (CI gate). But the action ("pause English authoring") has never been triggered, so the rule is untested.
- W71 rig: *"If rig inflates frame time >10% against Sept 2026 perf baseline on target devices..."* — **There is no Sept 2026 perf baseline.** No "target devices" are listed concretely.

Kill criteria written in product-team voice for a project that has no users + no telemetry + no QA team. They are aspirational gating language. The master plan honours them as if they're real gates.

**What I'd do.** Audit every kill criterion in the master plan. For each, ask: *can this fire?* If no, either (a) build the telemetry to make it real, or (b) replace with a manual-checkable criterion ("solo dev plays for 30 minutes, decides whether the variant pulls its weight"). Cosmetic kill criteria are noise.

### S4 — Replay determinism cosmetic-only carve-outs are author-asserted, not test-enforced.

[ADR-0002](adr/0002-deterministic-replay-format.md) Phase 3 added fixed-step physics + the `runRng` discipline. The QUALITY_BAR.md replay chain says: *"Cosmetic-only randomness (UI shuffle with no replay-side effect) may use `Math.random` but state the cosmetic-only carve-out explicitly."*

The Sporran v1 spec calls out a `Date.now()`-seeded ephemeral RNG for the DRAW shuffle as cosmetic-only. **Nothing tests this.** A future agent could add a different `Math.random()` call, claim "cosmetic", and the test gate at [`src/replay/replayDeterminism.test.ts`](../src/replay/replayDeterminism.test.ts) would only catch it if the call influences a recorded frame's output.

Carve-outs by assertion are carve-outs by trust. Trust is fine in a 2-person team; in an AI-agent-only codebase where the assertion is made in a Markdown comment, it's deferred risk.

**What I'd do.** Either (a) add a static analysis step that flags any `Math.random()` outside an allowlist of files known cosmetic-only, or (b) admit the cosmetic-only carve-out is honour-system and document the failure mode (replays drift over time as cosmetic uses accumulate state effects via emergent gameplay paths).

### S5 — The "AI-only codebase" framing surfaced after the QUALITY_BAR was written.

The user's prompt earlier today: *"this is a codebase only touched by AI agents (mostly claude code and claude opus 4.7 1m max)."*

The QUALITY_BAR doc was written before that disclosure. It assumes a contributor-set that includes humans (e.g. "the contributor who wrote it has rotated off"; "agent dispatch...cross-check report against actual code state"). Half the friction the bar adds — checklists, declared trade-offs, charter discipline — is friction designed for human-team coordination.

For an AI-agent-only repo, the binding constraints are different:
- Agents will follow whatever discipline they're told to follow as long as it's clearly stated and the gates pass.
- Agents will not catch problems the gates don't catch (see C3 — wiring bugs).
- Agents will optimise for the bar that is enforced (LOC-comment-bumping is enforced; LOC-not-bumping is not — see C2).
- Agents have no opinion about whether the project has a destination (see C1 — they ship features into a void).

The bar I wrote is a human-team discipline doc. The repo is an AI-team execution context. That mismatch is structural.

**What I'd do.** Rewrite the bar in two passes:

1. *For AI agents:* a programmatic gate spec — what tests run, what static checks fire, what failure conditions block ship. Markdown is decorative; the gate is the ENV. Move enforcement into CI / hooks / pre-commit checks.
2. *For the human owner:* a one-page weekly review checklist — *did I play it? did I cut anything? did I close any humans-in-the-loop questions?* That's the binding discipline.

Stop pretending the bar is for both audiences.

### S6 — Charter creep as project mode.

Adding a single mechanic touches: pure helper file + helper test + scene-game orchestrator + `Player.ts` wire + `GameScene.ts` wire + i18n EN keys + i18n SCS keys + banter pool entry (with priority decision) + sprite bake function in BootScene + `CLAUDE.md` `### Key Mechanics` entry + LOC budget bump + memory bump + spec truth-up if charter'd + CHANGELOG-equivalent in PRD + sometimes an ADR.

Per the QUALITY_BAR's "New mechanic chain" — this is correct. The chain has 10 numbered steps. With the cultural-review chain proposed in C4, it would be 11.

For solo-dev unreleased browser game, **this is too many touch points per feature**. Each touch point is a place for drift. The drift IS visible (PRD line 70 vs line 71; QUALITY_BAR's own LOC claim was stale on day 3).

**What I'd do.** Reduce the touch surface by ~50%:

- Drop the "memory bump on ship" requirement — memory is private agent state, not project record. The git log is the project record.
- Drop the "CLAUDE.md `### Key Mechanics` entry" requirement — the source code's structure is the architecture, not a redundant prose summary in CLAUDE.md.
- Drop "spec truth-up" — instead, write specs *post-ship* as architecture documentation, and only for features that survive the first month of use.
- Keep: helper + test + i18n + e2e smoke (the new requirement from C3).

Accept that the result is less documented; gain that the docs you keep aren't drifting.

### S7 — `BURNS_EVOLUTION_THRESHOLD` is a brittle compile-time invariant.

[`src/utils/save/schema.ts:28`](../src/utils/save/schema.ts) — `BURNS_EVOLUTION_THRESHOLD = 10` — must be lifted in lockstep with adding a new evolution recipe. **And** the achievement copy in EN + SCS must be updated to match ("all nine legends" → "all ten legends"). The QUALITY_BAR sacred-invariants table even surfaces this lock.

Across the 2026-05-09 sprint this lifted **three times** (7→8→9→10) for Shinty + Sgian + Stag. Three opportunities for the EN/SCS copy + threshold to drift.

The discipline appears to have held (CLAUDE.md current says "10 of the 11 weapons"). But this whole pattern — derived constant + linked copy + manual lift — is the kind of foot-gun that's quiet for 12 ships and then bites on lift 13.

**What I'd do.** Make the threshold **derived** from `EVOLUTION_RECIPES.length` in `src/data/upgrades.ts` rather than a manually-lifted constant. The achievement copy interpolates the count from the same source. Eliminate the manual sync.

### S8 — Engineering practices in QUALITY_BAR are honour-system, not lint-enforced.

I expected the codebase to violate the bar. Verified — the rules **are** being followed in the working tree:

- `it.skip(` / `it.only(` / `xit(` etc.: **zero** matches in `src/`.
- Production `as any`: **zero** real matches (4 grep hits are doc-comment text like "read as any goblin").
- `@ts-ignore` / `@ts-expect-error`: 5 hits, all in test files marked `// @ts-expect-error — deliberately malformed`. Legitimate.
- `console.log`: 1 hit, in [`src/dev/TuningPanel.ts:184`](../src/dev/TuningPanel.ts) — dev tooling only.

So the bar's "no bypassing safety nets" rules are intact today. **None are enforced by lint or CI.** They survive on author discipline. In an AI-agent-only codebase that ships 13 features in one day (C3), author-discipline drift is when the next regression lands — and the working-tree audit is the only gate that would catch it. The QUALITY_BAR's "verify before report" practice would, applied to itself, flag this.

**What I'd do.** Add ESLint rules: `no-console: ["error", { allow: ["warn", "error"] }]`, `@typescript-eslint/no-explicit-any: error`, `vitest/no-disabled-tests: error`, `vitest/no-focused-tests: error`. Rules that are observably-followed today should be codified as gates so they stay followed automatically. Reduce QUALITY_BAR's "Engineering practices" prose to a citation: *"Enforced by ESLint config; see `eslint.config.ts`."*

---

## Minor issues

### M1 — Doc count drift across canon

- `README.md:21`: "~5092 cases as of 2026-05-09".
- `docs/PRD.md:16`: "5092 test cases (verified 2026-05-09 via npm test)".
- `docs/QUALITY_BAR.md`: "4899+ unit tests" (which I wrote two days ago citing memory; should match PRD).
- Memory `project_repo_health`: "4899 tests / 470 files + 36 e2e (verified 2026-05-09)" — this is the source of my QUALITY_BAR figure, but it conflicts with PRD same-day.

Three different live numbers. Pick one. Probably the PRD number (5092) is correct because it was generated from `npm test` output. My QUALITY_BAR figure is stale. Update.

### M2 — README architecture is inconsistent with PRD

- [`README.md:37`](../README.md): "BootScene → MenuScene → GameScene ↔ ShopScene" (omits CroftScene + MetaShop).
- [`docs/PRD.md:11`](PRD.md): "Boot → Menu (variants) → Game (...) → Shop / MetaShop. CroftScene is the persistent hub between runs."

README's 30-second arch summary is misleading. Either spell out the full graph or punt to PRD/CLAUDE.md.

### M3 — `HUGE_INITIATIVES_VERDICT.md` location stale in README

[`README.md:71`](../README.md) lists `HUGE_INITIATIVES_VERDICT.md` directly under `docs/`. Per [`DOC_CONVENTIONS.md:48`](DOC_CONVENTIONS.md), the file moved to `docs/archive/HUGE_INITIATIVES_VERDICT.md` on 2026-05-09. README diagram is stale.

### M4 — CLAUDE.md `### Key Mechanics` entries are paragraph-walls

Each new mechanic gets a 3-7 line paragraph entry citing references and rationale. By the 13th mechanic of one sprint, the section is unscannable. The Beithir entry alone is 17 lines of prose. There's no signal-to-noise advantage over: a one-line index entry + a link to the helper file's docstring.

**What I'd do.** Rewrite `### Key Mechanics` as a one-liner-per-mechanic table. Each row: name + file path + 1-sentence summary. Move the prose into the helper file as a `/** */` docstring at the top, where it's near the code that defines the behaviour.

### M5 — `INDEX.md` table-of-contents has redundant priority signalling

[`docs/INDEX.md`](INDEX.md): the "What's the standard every change must clear?" row I added two days ago is **bold**, includes "**non-negotiable**", and points to the same file the design-canon table also points to. Two visual highlights for one doc is overkill.

---

## What I'd do next (the two or three things)

1. **Resolve Q9 today.** Solo dev or owner picks one of: portfolio piece (no ship), free Cloudflare Pages release with date target ≤8 weeks, or paid release with collaborators. The choice cascades into everything else. A single Slack-message-or-equivalent decision unblocks dozens of stalled trade-offs. **Do this before any more mechanic work.**

2. **Stop the mechanics velocity for 30 days.** No new mechanics. No new variants. No new banter pools. Use the time to: (a) play the build for two hours daily and write down what's actually broken; (b) write the 13 missing e2e specs from C3; (c) source PEAT + native review or descope the affected variants; (d) consolidate the three save stores per S1 or write the ADR explaining why not. Velocity is the wrong metric in this project's current state.

3. **Choose: enforce the bar, or rewrite it.** The QUALITY_BAR.md I wrote two days ago is aspirational on day three. Either (a) add CI-enforced gates for every rule (`no-console`, `no any`, LOC ratchet that actually ratchets, e2e-required-for-mechanics), and tear out the rules that can't be enforced; or (b) demote the doc from "non-negotiable" to "contributor's guide" and shrink the headline filters to one question: *can a human play this change without a walkthrough?* Either is honest. The current state is neither.

---

## What I couldn't find substantive criticism in

- **`docs/research/` corpus**: I read partial sections only, but the research docs are well-scoped reference material and the criticism of them is not "they're wrong" but "they're disproportionate to a solo-dev unreleased game's actual content needs" (covered in C6). The docs themselves, on their own merits, are competent.
- **`docs/DESIGN_SOUL.md`**: an aspirational design charter. I don't think aspirational charters need adversarial review; they're statements of intent and either the work matches them or it doesn't. The work-vs-charter question is downstream of C1.
- **ADRs 0001–0006**: each documents a specific decision with alternatives + consequences. They're the strongest doc category in the repo. No fundamental problems.
- **`src/utils/save/migrations.ts` chain**: I didn't review every step but the discipline of bump-version + migration-step is sound and enforced by the schema-version test.

---

**Final note.** The project has built an impressive amount of *something* in two months. What it has not built is evidence that what it built is good. The discipline scaffolding is the artefact most thoroughly reviewed; the game itself has not been played. Velocity without validation is the dominant pattern. The QUALITY_BAR I wrote two days ago accelerated that pattern instead of correcting it.

The most honest version of next-steps: pick a destination (C1), stop adding (the velocity-stop in §"What I'd do next"), validate what's there. Do those three things and the rest of this review's findings collapse into manageable backlog. Don't, and the next review six weeks from now will find the same problems with bigger numbers.
