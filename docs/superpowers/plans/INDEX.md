# Plans Index

> **2026-05-10 archive.** Plans older than 14 days were moved to [`docs/archive/superpowers/plans/`](../../archive/superpowers/plans/) per `docs/REVIEW.md` C6. The "kept in-tree because 28 references" reasoning was specific to the moment specs / plans were live work; once shipped, the artefact is decision history and broken links to archive paths are acceptable. Inbound references to archived plans will 404 — that's the trade-off; treat it as a signal to update the citing doc.

## Active

| Initiative | Plan | Status |
|---|---|---|
| Sporran Deck Phase 0 (helper + 11-card pool) | [2026-05-09-sporran-deck-phase0.md](2026-05-09-sporran-deck-phase0.md) | ✅ SHIPPED 2026-05-09 |
| The Moor Remembers V1 (cairns + grandfather voice) | [2026-05-22-the-moor-remembers.md](2026-05-22-the-moor-remembers.md) | ✅ SHIPPED 2026-05-22 |
| The Moor Remembers V2 (Cailleach Gauntlet) | [2026-05-22-moor-remembers-v2.md](2026-05-22-moor-remembers-v2.md) | Open — implementation immediately |

## Archived

Browse [`docs/archive/superpowers/plans/`](../../archive/superpowers/plans/). 43 plans covering 2026-04-09 through 2026-04-30 (verified 2026-05-10), each documenting a shipped or stalled initiative.

## Convention going forward

- Active work gets a plan in this directory.
- Plans get a top-of-file STATUS marker:
  - `> **STATUS: ✅ SHIPPED (YYYY-MM-DD)** — <one-line provenance / commit ref>`
  - `> **STATUS:** <Draft | Open | In progress | Partial> — <one-line current state>`
- On ship, update the marker. Optionally move to `docs/archive/superpowers/plans/` to keep this directory a small set of live work.
- For tasks spanning sessions, prefer charters under whatever the active dispatch directory is rather than re-opening shipped plans.
