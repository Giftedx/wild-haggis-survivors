# ADR 0000 — Template

**Status:** Reference — copy this file to start a new record.
**Date:** YYYY-MM-DD
**Supersedes:** (or blank)
**Superseded by:** (or blank)

## Context

What forced the decision? What problem are we solving, and what
constraints bound the shape of the answer? Include just enough
background that a reviewer who hasn't touched this corner of the
codebase in six months can understand why this decision matters.

## Decision

The choice we made, stated directly. One or two sentences. No hedging.

## Alternatives considered

- **Option A** — what it is, why it's credible.
- **Option B** — what it is, why it's credible.
- Add more as needed. Don't pad with strawmen.

## Consequences

- **Pros:** the upside we're buying, including things that become
  easier downstream.
- **Cons:** the cost we're paying. Be honest — future readers use this
  section to judge whether the tradeoff still makes sense.
- **Follow-ups:** things we chose to defer but should revisit, with
  the trigger (e.g. "revisit when X ships" or "if Y latency exceeds
  Z ms").

## Rollback

If this decision turns out wrong, how do we walk it back? Keep this
concrete — a single commit revert, a migration script, a feature-flag
toggle, etc. If rollback is hard, say so; that's important context for
future maintainers deciding whether to commit deeper to the path.
