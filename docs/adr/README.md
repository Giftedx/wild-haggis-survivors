# Architecture Decision Records (ADRs)

Short, dated records of a decision, the context that forced it, the
alternatives considered, and the expected consequences. ADRs exist so
the *why* behind a structural choice survives the inevitable time gap
between the decision and the next person who has to touch that code.

## When to write one

- Before picking between two credible framework / library / shape
  choices (e.g. state machine vs event bus, Phaser scene vs. DOM
  overlay).
- When introducing a convention that new code will follow (e.g.
  `ISceneContext` surfaces, banter tone register split).
- When deliberately *not* adopting a popular pattern (document the
  tradeoff so future reviewers don't re-open the debate cold).
- When reversing a previous ADR — superseding records stay, they don't
  get rewritten.

Don't write an ADR for:
- A routine bug fix — the commit message + PR description are the
  record.
- A tiny local refactor with no cross-file implications.
- A hot-take design opinion without a concrete decision attached.

## How to add one

1. Copy `0000-template.md` to `NNNN-kebab-case-title.md` where `NNNN`
   is the next sequential number padded to four digits.
2. Fill in every section — prefer brief over exhaustive. A 150-line
   ADR that captures the real tradeoff beats a 1000-line one that
   tries to document everything.
3. Update this README's index below.
4. Commit under the normal flow (`docs(adr): …`).

## Index

| # | Title | Status |
|---|-------|--------|
| 0000 | Template | Reference |
| [0001](0001-i18n-literal-field-guard-static-not-headless.md) | i18n literal-field guard uses a static walk, not a headless Phaser render | Accepted |
