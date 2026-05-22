# Specs Index

> **2026-05-10 archive.** Specs older than 14 days were moved to [`docs/archive/superpowers/specs/`](../../archive/superpowers/specs/) per `docs/REVIEW.md` C6 (doc-archival sweep). Shipped initiatives are decision history; the live design tracking lives in this directory only.

## Active

Each row links spec ↔ paired plan.

| Initiative | Spec | Plan |
|---|---|---|
| Sporran Deck (Phase 0–1.5 shipped 2026-05-09; Phase 2+ deferred) | [2026-05-09-sporran-deck-design.md](2026-05-09-sporran-deck-design.md) | [`../plans/2026-05-09-sporran-deck-phase0.md`](../plans/2026-05-09-sporran-deck-phase0.md) |
| Sporran Deck Phase 2 (chronicle persistence — ✅ shipped 2026-05-10 in `e183bcb` + `b658b8d` + `1c3dd31`; Phase 3 pool expansion in `f514cb8`) | [2026-05-10-sporran-deck-phase2-design.md](2026-05-10-sporran-deck-phase2-design.md) | (no plan; landed as a single cohesive change) |
| Polish tranche — Sgian Dubh e2e smoke (2026-05-11) | [2026-05-11-polish-tranche-e2e-smoke-design.md](2026-05-11-polish-tranche-e2e-smoke-design.md) | E2E: [`e2e/sgian-dubh.spec.ts`](../../../e2e/sgian-dubh.spec.ts) |
| The Moor Remembers — persistent cairns + grandfather voice (2026-05-22, V1) | [2026-05-22-the-moor-remembers-design.md](2026-05-22-the-moor-remembers-design.md) | [`../plans/2026-05-22-the-moor-remembers.md`](../plans/2026-05-22-the-moor-remembers.md) |

## Archived (shipped, kept for decision history)

Browse [`docs/archive/superpowers/specs/`](../../archive/superpowers/specs/). 31 specs covering 2026-04-09 through 2026-04-30.

## Discovery rule

When working on a topic that may have a historic spec:

1. Look in this active directory first.
2. Grep `docs/archive/superpowers/specs/` by slug.
3. Cross-reference paired plans (also archived; same slug, no `-design` suffix).
4. Cross-reference per-initiative status doc(s) under `docs/status/<domain>/` or root `<INITIATIVE>_*.md`.

When this INDEX disagrees with paired plans INDEX about ship state, trust the plans INDEX.
