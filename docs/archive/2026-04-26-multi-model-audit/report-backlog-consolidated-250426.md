# Consolidated pre-release backlog (three-agent synthesis)

**Sources:** `report-claude-opus-4.7-250426.md`, `report-gpt5.5-250426.md`, `report-composer-2-fast-250426.md`  
**Created:** 2026-04-26  
**Tags:** **[Opus]** Claude Opus 4.7 report · **[GPT]** GPT 5.5 report · **[Composer]** Composer (composer-2-fast) report

This document deduplicates and prioritizes findings from those audits into a single execution-oriented backlog.

> **Status as of 2026-04-26 (later same day) — partial movement since synthesis.** The dispatch package at [`dispatch/2026-04-26/00_task_list.md`](dispatch/2026-04-26/00_task_list.md) and the post-audit snapshot in [`dispatch/2026-04-26/Execution_Log.md`](dispatch/2026-04-26/Execution_Log.md) are the live source of truth for ship state. Quick reconciliation against `git log` / memory:
>
> - **P0.1** (resume + input + nav bundle) — partial: resume/input/route fixes landed across `T401/T402/T407/T122` commits; verify against `git log --oneline -25`.
> - **P0.2** (runes ship or don't) — **shipped** as ship: U1 M4 wired offers + 25/30 grounded rune effect consumers (commit `a86afe5`, 2026-04-26). Five ungrounded runes wait on biomes from #5; document that, not "ship or don't."
> - **P0.3** (Assist Mode wire or hide) — partial: invincibility / post-dash grace / combo window wired; **game speed still hidden**; replay snapshot helper added but expose-vs-hide decision still open.
> - **P0.4** (save failure UX) — **open**. Still silent on quota / private mode.
> - **P0.5** (regression tests for resume) — partial: per-domain test growth across recent commits; matrix not formally walked.
> - **P1.1** (boss kill vs death same frame) — **open**.
> - **P1.2** (real-device mobile) — human gate; matrix doc tightened.
> - **P1.3** (cultural copy gate) — **infrastructure shipped** (commit `b3bec32`: CULTURAL_REVIEW_STATUS.json + Vitest gate). Reviewer sign-off still required for Doric / Shetlandic / Burns / Gaelic+Cailleach.
> - **P1.4** (document bagpipes utility-only in Almanac) — **open**.
> - **P1.5** (gamepad E2E) — **open**.
> - **P1.6** (FTUE / first-run) — partial: drift micro-practice shipped (commit `286b931`); curses/hubs gating + tooltip pass still open.
> - **P2 / P3** — assume stale; re-verify before pulling. P2.10 bundle gate has a script + baselines (commit `7559336`) but the CI hook is still TODO.
>
> **Action for any agent reading this doc:** treat the table below as the *audit synthesis*, not the *to-do list*. Use the dispatch ledger for current work, and update this banner instead of the rows when state moves again.

---

## P0 — Release / trust blockers

| # | Item | Notes | Sources |
|---|------|--------|---------|
| P0.1 | **Land the resume + input + nav bundle** (relics, Act3/node map, route timers, gamepad bindings, node prompt focus, Croft `returnTarget`) | Single integration merge that clears most critical resume/input bugs. | [Opus] MF1, B3–B6; [GPT] must-fix rows (resume, routes, gamepad, nodes) |
| P0.2 | **Rune strategy: ship or don’t** | Either enable offers + verify effects end-to-end, or pull rune messaging from player-facing comms until true. Align conditions/biomes with live game ([GPT] Piper/bagpipes naming, dead conditions). | [Opus] MF2, B1; [GPT] rune wiring + conditions |
| P0.3 | **Assist Mode: wire or hide** | No persisted toggles that do nothing in combat. | [Opus] MF3, B7; [GPT] Assist; [Composer] Assist unused call sites |
| P0.4 | **Player-visible save failure** (quota / private mode) | Toast or banner + logging; today often silent. | [Opus] MF4, B2; [GPT] save swallowed; [Composer] dual-store confusion (pair with messaging) |
| P0.5 | **Regression tests for resume** after relic / rune / node / route timer / act changes | Closes the gap where unit volume is high but “visible promise” seams are thin. | [GPT] must-fix; [Opus] §11 matrix |

---

## P1 — High impact before “1.0” / broad audience

| # | Item | Notes | Sources |
|---|------|--------|---------|
| P1.1 | **Boss kill vs death same frame** | Single resolution / no double GameOver path. | [Opus] MF6, B21 |
| P1.2 | **Real-device mobile check** (hang / touch / perf) | Especially where marathon or P4 fixes are claimed but not hardware-verified. | [Opus] MF7, B19 |
| P1.3 | **Cultural / copy gate** (Doric, Shetlandic, Burns/Canongate) | Ship policy: block or label “pending review.” | [Opus] MF5; [GPT] narrative consistency |
| P1.4 | **Document bagpipes as utility-only** (Almanac / goals) | Avoid “all evolutions” trap. | [Opus] MF8, B14 |
| P1.5 | **Gamepad E2E** (Playwright `gamepadconnected` or equivalent) | Primary input with no E2E is a coverage hole. | [Opus] B20, SF6 |
| P1.6 | **FTUE / first-run path** | Fewer hub buttons early; gate curses/hubs; drift micro-practice; tooltips for variant / evolution. | All three; [Opus] SF1–SF2, SF4; [GPT] first-run; [Composer] cognitive load |

---

## P2 — Should fix (quality, maintainability, polish)

| # | Item | Notes | Sources |
|---|------|--------|---------|
| P2.1 | **Skip intermissions: surface auto-picked route** | Short toast / label. | [Opus] B9, SF3 |
| P2.2 | **UpgradeCards: scene-scoped keyboard** vs `window` keydown | Lowers leak / missed-cleanup risk. | [Opus] B11, SF5 |
| P2.3 | **Replace `pendingCurseKey` singleton** with explicit scene payload | Cross-run curse bleed. | [Opus] B13, SF9; [Composer] global curse |
| P2.4 | **TimeManager pause refcount** (intermission ∩ pause) | Edge-case audit + test. | [Opus] B22, SF15 |
| P2.5 | **Locale change preserves `returnTo`** | Croft/settings round-trip. | [Opus] B23; [GPT] Croft returns |
| P2.6 | **Modal focus model** shared (Curse, route, node prompt, GameOver links) | | [GPT] should-fix |
| P2.7 | **Replay / history write guards** | Replay completion must not corrupt meta history. | [GPT] edge matrix |
| P2.8 | **Cap or compress replay blobs** | Quota / silent loss. | [Opus] B15; [GPT] replay pressure |
| P2.9 | **Mobile touch E2E expansion** | Beyond one-tap smoke. | [Opus] B19, SF7 |
| P2.10 | **Bundle / FMP strategy** | Large chunks; lazy dev scenes; chunk split. | [Composer] payload |
| P2.11 | **Croft visual / placeholder pass** | Comments/placeholders vs menu polish. | [Composer] Croft |
| P2.12 | **Debug hotkeys registration** | Only when `DEV` / flag. | [Composer] |
| P2.13 | **Docs: Phaser 3 vs 4** in AGENTS (if still wrong) | | [GPT] |
| P2.14 | **Daily challenge / endless fields** | Ship UI or remove dead schema. | [Opus] B17–B18, NTH3–NTH4 |
| P2.15 | **Weak assertions cleanup** (`toBeTruthy` sweep) | Coverage quality. | [Opus] B25, NTH2 |
| P2.16 | **Contributor diagram: `whs_save` vs `whs_meta_save` vs settings** | Reduces resume bugs from confusion. | [GPT] refactor; [Composer] dual persistence |

---

## P3 — Nice to have / longer horizon

| # | Item | Notes | Sources |
|---|------|--------|---------|
| P3.1 | **`GameScene` decomposition** / orchestrator facade | | All three |
| P3.2 | **Run identity / “what changed this run” panel** | Routes, relics, runes, curse, act. | [GPT] design; [Opus] SF13 adjacent |
| P3.3 | **GameOver: change variant/curse on retry** | | [Opus] SF14 |
| P3.4 | **MainMenu “last patch” + Almanac progress badge** | Retention / clarity. | [Opus] SF12–SF13 |
| P3.5 | **Croft timer / listener hygiene** (stress reuse) | | [Opus] B12, NTH9 |
| P3.6 | **Save compaction** (`seenEnemies`, discovery log) | Long-run bloat. | [Opus] B24, NTH7 |
| P3.7 | **DOM or focus abstraction for canvas menus** | Deeper a11y. | [GPT] nice-to-have |
| P3.8 | **Visual regression** (high UI scale, mobile) | | [GPT] should-fix |

---

## Suggested execution order

1. **P0.1** (merge + green CI)
2. **P0.2** + **P0.3** (product decisions; engineering can parallelize)
3. **P0.4** + **P0.5** (fast trust wins)
4. **P1** in any order; **P1.2** and **P1.5** pair well with P0.1 verification
5. **P2** as ongoing sprint filler; **P3** when stabilizing after beta

---

## Coverage map (reports → themes)

| Theme | Opus | GPT | Composer |
|-------|:----:|:---:|:--------:|
| Resume / routes / nodes | ✓ | ✓ | (persistence) |
| Runes truthfulness | ✓ | ✓ | light |
| Gamepad runtime | ✓ | ✓ | remap E2E mentioned |
| Assist | ✓ | ✓ | ✓ |
| Save failure UX | ✓ | ✓ | dual-store |
| Onboarding / complexity | ✓ | ✓ | ✓ |
| `GameScene` size | ✓ | ✓ | ✓ |
