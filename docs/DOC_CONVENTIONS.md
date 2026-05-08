# DOC_CONVENTIONS.md

Rules for writing, naming, and locating documentation in this repo. The goal is that a new contributor (human or AI agent) can find the right file by structure alone, and that AI agents writing new docs land them in the right place automatically.

> **Source-of-truth hierarchy** (when files disagree):
> 1. Memory entries `~/.claude/projects/.../memory/MEMORY.md` + per-initiative `project_*_status.md` — most current.
> 2. [`docs/PRD.md`](PRD.md) "Flagship status" — current snapshot of what's shipped.
> 3. [`docs/superpowers/plans/INDEX.md`](superpowers/plans/INDEX.md) — index over per-file STATUS markers (the markers themselves can drift; the INDEX is curated).
> 4. `git log --oneline` + working-tree files — ground truth for code claims.

Lower-priority docs that conflict with these should be brought into line, not preserved.

---

## File location rules

### Repo-root canon (5 files, do not move)

These are referenced by tooling and CLAUDE/AGENTS docs:

| File | Why root |
|---|---|
| `README.md` | Entry point for humans + tooling (npm, GitHub, Cloudflare Pages). |
| `AGENTS.md` | Cross-agent working agreement. Cited from `.cursor/`, plugins, etc. |
| `CLAUDE.md` | Claude Code's project memory. Loaded automatically. |
| `DESIGN.md` | Frontmatter design-system tokens (colors, typography, motion). Consumed by tooling. |
| `REVISION_NOTES.md` | Out-of-scope sprite-pass items kept at root for visibility. |

### `docs/` root canon (design north stars)

These are evergreen and cited by `CLAUDE.md`/`AGENTS.md` as primary references:

- `INDEX.md` — top-level map.
- `PRD.md` — live product snapshot.
- `DESIGN_SOUL.md` — Soul charter, voice, tone.
- `VOICE_CARD.md` — two-register voice, variants.
- `ART_STYLE_BIBLE.md` — palette anchors, tonal palettes, motifs.
- `DESIGN_IDEAS.md` — sketchpad.
- `BANTER_AUTHORING.md` — recipe for adding banter leaves.
- `HUGE_INITIATIVES_MASTER_PLAN.md` — flagship roster.
- `HUGE_INITIATIVES_VERDICT.md` — 2026-04-16 audit trail.
- `DOC_CONVENTIONS.md` — this file.
- `OPEN_QUESTIONS.md` — stakeholder decisions blocking work.

### Status trackers

Two acceptable locations. Pick by **who cites the file**:

| Cited from | Location | Example |
|---|---|---|
| Code, tests, e2e (absolute path) | `docs/<NAME>.md` (root of `docs/`) | `docs/A1_PEAT_AUDIT.md`, `docs/MOBILE_DEVICE_TEST_MATRIX.md`, `docs/P3_BACKEND_DECISION_MATRIX.md` |
| Only other docs | `docs/status/<domain>/<NAME>.md` | `docs/status/cultural/CULTURAL_REVIEW_PACKET.md`, `docs/status/engine/SCENE_REFACTOR_GAP_AUDIT.md` |

Why the split: moving a file referenced from code (e.g. via a hardcoded relative path in a test) is a code change. Keep those at `docs/` root unless you're prepared to update every reference. New trackers with no code references should land under `docs/status/<domain>/`.

The `status/cultural/CULTURAL_REVIEW_STATUS.json` manifest is read by `src/data/culturalReviewStatus.test.ts` via a hardcoded path — moving or renaming requires a code change.

### Specs and plans

- **Specs** live at `docs/superpowers/specs/YYYY-MM-DD-<slug>-design.md` (date-prefixed).
- **Plans** live at `docs/superpowers/plans/YYYY-MM-DD-<slug>.md` (date-prefixed, no `-design` suffix).
- Each spec is paired with a plan of the same `<slug>`. Cross-cutting work may have a spec without a plan or vice versa — note the asymmetry in the relevant INDEX.
- **Don't move shipped specs/plans to `archive/`.** They're cited from ADRs, status docs, and other plans. The plans INDEX itself notes "Files are kept in-tree (not archived) because 28+ references across `docs/` link to plan paths."

### ADRs

- `docs/adr/NNNN-kebab-case-title.md`. Numbered sequentially.
- DRAFT ADRs use `.draft.md` suffix (e.g. `0006-cloud-save-backend.draft.md`).
- ADRs have a `**Status:**` field at the top: `Proposed | Accepted | Superseded by NNNN | Deprecated | DRAFT`. When implementation ships, flip Proposed → Accepted with the date and add an `**Update:**` block summarising deltas from the original decision.
- Template: `docs/adr/0000-template.md`.

### Dispatch sessions

- New dispatch session: `docs/dispatch/YYYY-MM-DD/`.
- Each session gets a `00_task_list.md`, `Execution_Log.md`, and `task_NN.md` per work unit.
- After reconciliation to `master`, leave the directory in place. The dirname carries the date and the `Execution_Log.md` records the reconciliation tip.
- One reconciled batch lives under `docs/top-10-tasks/` (the 2026-04-26 morning top-10 batch). It's preserved there as a self-contained record; the dispatch dir at `docs/dispatch/2026-04-26/` is a separate, later session.

### Audit / one-off docs

Date-prefix one-off audits: `docs/<NAME>_AUDIT_YYYY-MM-DD.md` (e.g. `SPRITE_AUDIT_2026-04-27.md`, `SCENE_REFACTOR_AUDIT_2026-04-26.md`). This disambiguates from running journals (which use a stable name without a date suffix).

### Multi-model audit reports

Stored at `docs/report-<modelname>-YYMMDD.md` (e.g. `docs/report-claude-opus-4.7-250426.md`). Group by date if multiple models audited the same day.

---

## STATUS markers

Plan files carry a STATUS marker on line 3, in a blockquote. The two accepted forms:

```
> **STATUS:** SHIPPED YYYY-MM-DD — <one-line provenance / commit ref>
> **STATUS:** Draft | Open | In progress | Partial — <one-line current state>
```

When a plan's actual status diverges from its line 3 marker, **trust the plans INDEX** (`docs/superpowers/plans/INDEX.md`) over the file marker. The INDEX is curated; the markers can rot.

When shipping, update both:
1. The file's line-3 STATUS marker.
2. The plans INDEX entry (move from "Active" to "Shipped" section if applicable).
3. The corresponding row in `docs/HUGE_INITIATIVES_MASTER_PLAN.md` (strikethrough the ID + initiative cells; replace tier with `—`).

Specs do not carry STATUS markers — they're evergreen design intent. Live status lives in the paired plan.

---

## Naming

- **Filenames:** kebab-case for non-status content (`grans-croft.md`, `art-music-polish-pass.md`); `SCREAMING_SNAKE` for status trackers and root-canon files (`A1_PEAT_AUDIT.md`, `BANTER_GAPS.md`).
- **Slugs:** stable across spec ↔ plan ↔ status ↔ ADR for the same initiative. Example: `accessibility-foundation` appears in spec, plan, and (under the A1 prefix) in `A1_*` status trackers.
- **Date prefix:** ISO format `YYYY-MM-DD-`. Specs, plans, dispatch dirs, and one-off audits all use this.
- **No emojis in filenames.** Emojis in headers are allowed (`✅`, `🟡`, `⏳`); they're searchable and don't break paths.

---

## Cross-references

- Use **relative paths** in markdown links so files survive being read on GitHub, Cloudflare Pages, or local IDE preview.
- When linking from `docs/superpowers/specs/X.md` to a doc-root tracker, the path is `../../<NAME>.md`. From `docs/status/<domain>/X.md` to a doc-root tracker: `../../<NAME>.md` as well.
- Code paths use `src/...` (forward slashes) regardless of OS.
- Memory references use the bare key (e.g. `project_a1_m5_status`) without an extension or path — agents resolve them via `~/.claude/projects/.../memory/`.

---

## When you write a new doc

1. **Decide what kind it is.** Plan? Spec? ADR? Status tracker? One-off audit?
2. **Pick the location** from the rules above.
3. **Match the existing siblings** — naming, frontmatter, STATUS marker, tone. The spec/plan slugs should be paired.
4. **Add it to the relevant INDEX.** Specs INDEX, plans INDEX, top-level INDEX, or ADR README, depending on type. An orphan doc doesn't exist for discovery.
5. **Cite it from a north-star** if it's load-bearing. New status trackers should appear in `docs/INDEX.md`'s status table. New ADRs should appear in `adr/README.md`.

---

## When you discover drift

If a doc claim disagrees with the code or a more authoritative doc:

1. **Verify the code first** — read the file, check the constant, run the grep. The memory + git log + working tree always win over docs.
2. **Fix the lower-priority source.** PRD says X, code says Y → fix the PRD. Plan STATUS says Draft, INDEX says shipped → fix the marker.
3. **Do not "preserve history"** by leaving stale claims in place — note the change inline if it's load-bearing (e.g. ADR `**Update:**` block) but bring the doc to current truth.
4. **Surface to the user only if the fix changes intent**, not when it's a routine path/version bump.
