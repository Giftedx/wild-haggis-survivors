# ADR 0004 — SeasonalEventManager uses device-local date, not server time or in-game clock

**Status:** Accepted
**Date:** 2026-04-23 (proposed); 2026-04-24 (accepted on E1 ship)
**Supersedes:** —
**Superseded by:** —

> **Update 2026-04-24:** E1 flagship shipped. `src/systems/SeasonalEventManager.ts` is live with device-local date math; `SEASONAL_EVENTS` cohort grew to eight (beltane, samhain, st_andrews, hogmanay, burns_night, imbolc, lammas, bracken_turn) by 2026-04-29 — the original calendar in this ADR documented six. Decision unchanged.

## Context

E1 flagship ships a seasonal-events framework with Burns Night as the first event. `SCOTTISH_RESEARCH_DEEP.md §22` catalogues ~12 real-world Scottish calendar events (Hogmanay, Burns Night, Imbolc, Up Helly Aa, Beltane, Samhain, Lammas, St Andrew's Day, Glorious Twelfth, Bracken-turn, Culloden anniversary, etc.). Each would shift the game's presentation during its real-world window — decorations at Gran's Croft, themed run-start ceremonies, reserved banter, variant-unlock paths.

Three possible implementations of "how does the game know it's Burns Night right now?":

1. **Server time.** A backend endpoint returns current date / active-event list. Game polls on boot.
2. **In-game clock.** The game tracks its own calendar (new-player starts in fictional January, days pass every N runs). Decoupled from the real world.
3. **Device-local date.** Client reads user's system clock on every boot + scene transition. Matches real world from the user's perspective.

The Soul Charter (warmth, no-FOMO) and WHS's product posture (solo indie, no monetisation, no backend infrastructure) strongly pre-select option 3. But we need to document *why* — future contributors will reasonably ask: "Why not server-authoritative? Can't a player cheat Burns Night by changing their clock?"

## Decision

**`SeasonalEventManager` reads the device's local date (`new Date()`) on every boot and scene transition. Events activate when today's date falls within their declared window. No server component; no fictional in-game calendar.**

A player with their clock set to Jan 25 — regardless of the actual date — experiences Burns Night. This is acceptable. See Consequences below.

Pure-function wrapper keeps tests deterministic:

```typescript
// Tests pass 'now' explicitly; production uses real Date.
function isSeasonalEventActive(eventKey: string, now = new Date()): boolean {
  const event = SEASONAL_EVENTS[eventKey];
  if (!event) return false;
  return isInWindow({ m: now.getMonth() + 1, d: now.getDate() }, event.dateWindow);
}
```

Events are declared in `src/data/seasonalEvents.ts` with `{startMonth, startDay, endMonth, endDay}` windows. Year-boundary-crossing windows (Dec 28 → Jan 3 for Hogmanay) handled via wrap-around logic.

## Alternatives considered

1. **Server-authoritative time** (§Context option 1). Rejected:
    - WHS is a browser game with no backend.
    - Adding a backend for this single feature is an enormous scope explosion.
    - Players playing offline (core WHS value — "offline-first" per past PRDs) couldn't use seasonal events.
    - Privacy cost: every boot makes a network request.
    - Failure-mode: server down means no Burns Night for anyone.

2. **In-game fictional calendar** (§Context option 2). Rejected:
    - Decouples seasonal events from their cultural meaning. Burns Night in November (because the fictional clock says so) is a voided reference to a living tradition.
    - Adds a second calendar that new players don't understand.
    - Breaks the "no FOMO" Soul Charter rule harder — the player has no intuitive map from "today is Jan 25 in my life" → "my game celebrates Burns Night".
    - Loses the cross-player synchronisation that makes seasonal events social ("my whole friend group played Burns Night tonight").

3. **Opt-in manual trigger** (e.g., Settings → "Celebrate Burns Night now"). Considered as a *secondary* mechanism (useful for players who missed it, testing in dev). Added as future option — not the default. Default remains date-gated, because surprise-delight on 25 January is *the point* of seasonal content.

## Consequences

### Positive

- **No backend.** WHS stays offline-first.
- **Cultural resonance.** Burns Night fires on Burns Night. Hogmanay fires on Hogmanay.
- **Test-friendly.** `isSeasonalEventActive(key, mockedDate)` is pure; every edge case (year-boundary wrap, leap years, DST) testable without touching system clock.
- **Zero latency.** Date check is ~0.01ms.
- **Timezone correct.** A Scot in Glasgow and a Scottish-descent player in Melbourne both experience Burns Night on their respective Jan 25.

### Negative / cost

- **Device clock is trustable only to the user.** A player who sets their clock forward can trigger Burns Night in July. Acceptable: there's nothing to "cheat" — Burns Night unlocks (e.g., Burns's Wee Beastie variant) are also achievable year-round via the normal progression path. Seasonal events celebrate; they don't gate. No economic/competitive integrity concern.
- **No cross-player "Burns Night is LIVE NOW" synchrony for multiplayer features.** WHS has no multiplayer (P1 in master plan parking lot stays deferred). If multiplayer ships later, this ADR would need extension for shared events.
- **Timezone + DST edge cases.** Handled via MM-DD comparisons (no HH:MM), making all date checks timezone-agnostic. Leap-day February 29 doesn't overlap any event window as currently defined.
- **Device clock wrong → events misfire.** Rare. Acceptable. Users who actively manipulate their clock are consenting to the consequence.

### Neutral

- **Memory cost:** nil. SeasonalEventManager is a few hundred lines of pure-function code + data table.
- **Perf:** one date-comparison per scene transition. Immeasurable.

## Notes

- **Opt-out via `disableSeasonalEvents` setting** is required (default `false` — events on by default). Players who prefer the un-decorated experience or find surprise-content disorienting can opt out completely.
- **Content warnings** (`contentWarnings` setting, per A1 Accessibility flagship + `CULTURAL_SENSITIVITIES_RESEARCH.md §2.3`) gate sensitive events like the Culloden anniversary. Date-gating alone is insufficient for content with real-world trauma; the warning layer is additive.
- **No-FOMO invariant:** every seasonal unlock must also be achievable year-round via the normal progression path. Seasonal windows celebrate; they don't gate. Burns's Wee Beastie variant unlock-path gates on "complete a run during Burns Night with all 8 weapons at L5" — a player can wait for Burns Night 2027, 2028, etc. Unlock never expires.

## References

- `docs/research/SCOTTISH_RESEARCH_DEEP.md §22` — full seasonal calendar (12+ events).
- `docs/research/SCOTTISH_RESEARCH_DEEP.md §11` — Burns Night ritual + wild haggis myth.
- `docs/research/CULTURAL_SENSITIVITIES_RESEARCH.md §2.3` — Culloden respectful handling.
- `docs/superpowers/specs/2026-04-23-seasonal-events-burns-night-design.md` — E1 spec.
- `docs/superpowers/plans/2026-04-23-seasonal-events-burns-night.md` — E1 plan.
