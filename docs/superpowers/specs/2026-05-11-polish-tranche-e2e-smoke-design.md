---
title: "Polish tranche — one mechanic e2e smoke"
date: 2026-05-11
status: draft
---

## Goal

Raise confidence in recently shipped, input-wired mechanics by adding **one Playwright smoke spec** that:

- drives a real in-game input (keyboard)
- asserts an observable state change
- runs under `npm run ci:all`

This is deliberately a small, verifiable tranche that improves ship-quality without adding new content.

## Non-goals

- No broad refactors.
- No new mechanics/content/balance.
- No new replay-format work.

## Success criteria

- `npm run ci:all` is green locally.
- A new `e2e/*.spec.ts` test exists for a shipped mechanic with input wiring and asserts a player-visible effect (HUD/toast/counter).

## Candidate mechanics (pick one)

- **Stance toggle (Q)**: assert stance indicator changes.
- **Shinty parry (E)**: assert parry UI/indicator flips or projectile interaction changes.
- **Drift mastery (G)**: assert grip pips change or burst triggers after accumulation.

## Recommendation

Pick the mechanic with the cleanest existing observable affordance (HUD/toast) to keep the smoke stable and non-flaky.

