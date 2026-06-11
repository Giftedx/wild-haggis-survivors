# E1 — Seasonal events infrastructure + Burns Night design spec

**Date:** 2026-04-23
**Initiative:** E1 (`docs/HUGE_INITIATIVES_MASTER_PLAN.md`)
**Status:** Draft
**Prerequisite:** None strict. B1 Banter Push in progress helpful (Burns Night banter is a B1 pool). H1 Gran's Croft in progress would let seasonal props land in the croft.

---

## 1. Problem statement

WHS is a year-round game. Players play the same moor in January as in June. Nothing in the game reflects the *real-world calendar* — no Hogmanay acknowledgement on 31 December, no Burns Night celebration on 25 January, no Beltane fire on 1 May.

Scotland has exactly the opposite relationship with the calendar: seasonal festivals are culturally central. `SCOTTISH_RESEARCH_DEEP.md §22` catalogues ~12 distinct seasonal moments that have strong living traditions — Hogmanay, Burns Night, Imbolc, St Andrew's Day, Up Helly Aa, Beltane, Samhain, Summer Solstice, Lammas, Glorious Twelfth, Bracken-Turn, Culloden anniversary (respectfully handled).

Burns Night (25 January ± 7 days) is the obvious **first event to ship**: haggis-themed, literary-anchored (every Burns-citational banter line lands here), easy to celebrate without mechanical stakes, and the perfect content-proof for a seasonal framework.

### Player outcome

Players who play on Burns Night week find the game *transformed*: haggis-piped ceremony opens each run, Gran recites the Address to a Haggis at the croft, themed buffs activate, and Burns's Wee Beastie variant (V2 prereq) unlocks only via a run that completes inside the event window. After the window, everything reverts; the unlocked content stays accessible year-round but the celebration has passed.

The **seasonal framework** beneath Burns Night is the real flagship — future events (Hogmanay, Beltane, Samhain, Up Helly Aa) drop into the scaffold as data entries.

---

## 2. The seasonal framework

### How events are defined

Each event is a data entry in `src/data/seasonalEvents.ts`:

```typescript
interface SeasonalEventDef {
  key: string;                    // 'burns_night', 'hogmanay', etc.
  nameKey: string;                // i18n
  descriptionKey: string;         // i18n
  dateWindow: {
    startMonth: number;           // 1-12
    startDay: number;
    endMonth: number;
    endDay: number;
  };
  effects: SeasonalEffect[];      // what activates during the window
  onEnter?: () => void;           // trigger on real-world entry into window
  onExit?: () => void;            // trigger on exit
}

interface SeasonalEffect {
  key: string;                    // 'haggis_pickup_buff', 'croft_thistle_blooms', etc.
  target: 'run' | 'croft' | 'banter_pool' | 'variant_unlock';
  data: Record<string, unknown>;
}
```

### Activation

On every `BootScene` load + every scene transition:
- `SeasonalEventManager.tick()` reads current real-world date (user's device local time).
- Matches against all event `dateWindow`s.
- Any event whose window currently contains "today" is *active*.
- Effects apply.

Opt-out: a `disableSeasonalEvents` setting for players who don't want them. Default **off** (events are on by default).

### Time-zone handling

Uses the player's device local-date. If a player is in Australia and it's Jan 26 local-time, Burns Night is still active (the 25 ± 7 window covers Jan 18–Feb 1). Not a precise real-time event; just date-accurate.

Edge cases:
- Player's clock is wrong → events trigger at wrong time. Acceptable.
- DST transitions → harmless.
- Leap years → no impact (all dates are MM-DD).

### No FOMO

Unlock content tied to events (e.g., Burns's Wee Beastie variant) does *not* expire. If a player misses Burns Night 2026, they can earn the unlock during Burns Night 2027. Seasonal content rotates *presentation*, not availability.

---

## 3. Burns Night (first event)

### Window

**18 January – 1 February** (Burns's birthday is 25 January; ± 7 days window for player convenience across timezones and schedules).

### Effects — active during window

**1. Croft decoration** (requires H1 Gran's Croft)
- Small haggis-on-a-platter prop appears on the table.
- Printed "Address to a Haggis" card on the wall.
- Thistle by the window *blooms*.
- Gran-variant banter at croft-entry includes Burns citations.

**2. Run-start "haggis piped in" ceremony**
- Replaces normal run-start cutscene.
- Pipes-in stinger plays (music engine temporarily activates pipe-lead layer).
- Haggis sprite briefly animates with a *ceremonial shuffle* before run begins.
- Banter line pool: Burns citational (`burns_citation` priority 45 from B1) overrides default `run_start` for the week.

**3. Themed buff: "Address the Beastie"**
- Once per run during Burns Night, picking up a specific pickup (Haggis-themed — spawns 1 per run) triggers:
  - Full HP restore.
  - +20% damage for 60s.
  - Gran recites one Burns quotation via banter.
- Pickup spawned randomly in one of the first 3 Moor Road nodes.
- Themed sprite: small haggis-on-a-platter that the player collides with.

**4. Variant unlock path**
- Burns's Wee Beastie variant (V2 §Variant 13) gates on: *complete a run during Burns Night window with 100% weapon evolution (all 8 weapons reached L5).*
- The gate resets each Burns Night (so missing it once doesn't mean forever-lock).

**5. Chronicle stamp**
- Runs during the window get a special "Burns Night" badge in the Chronicle.
- Visible post-event — a memento.

**6. Music layer activation**
- Piper lead-layer activates more frequently during combat.
- Reserved music stinger on boss kills: pipes-flourish version.
- Background ambience adds faint pub-hum (low-volume Still-Game-style).

### Banter

30 EN + 30 SCS banter lines scoped to `seasonal_event` pool, `burns_night` sub-pool:
- 10 lines tied to Gran croft-entry.
- 10 lines tied to run-start pipes-in ceremony.
- 5 lines tied to the haggis-platter pickup.
- 5 lines tied to boss kills during the window.

Every line is Burns citational or Gran-voice honouring Burns.

Example lines:
- (Gran, croft): *"Fair fa' your honest, sonsie face, wee yin. Sit, have a cuppa."*
- (Gran, run-start): *"Address the beastie. Aye, that's the way of it."*
- (Haggis, inner, post-pickup): *"Oh, what a panic's in my breastie! …but I'm fair chuffed, ken."*
- (Gran, boss kill): *"The best-laid schemes o' mice an' men gang aft a-gley. That one's gang."*
- (Gran, death): *"O thou! whatever title suit thee — dearest o' the deid, ye fought braw."*

---

## 4. Non-goals

- **Not FOMO-gating any content.** Every seasonal unlock remains available year-round.
- **Not a live-ops system.** No server-driven event schedule; dates are hard-coded in client data.
- **Not a paywall.** Nothing costs money.
- **Not multi-event-stacking.** One event window at a time (timeline is designed to not overlap).
- **Not time-of-day mechanics.** Events trigger on date, not clock-hour.
- **Not a real-time calendar display.** No in-game calendar UI v1 (Almanac could show seasonal-event history in Phase 2).
- **Not user-definable events.** Calendar is authored, not moddable.
- **Not regionally varied.** Scottish-themed events fire worldwide. (A player in Japan celebrating Burns Night is totally welcome — Burns Night *is* international via the diaspora.)

---

## 5. Architecture

### New files

- `src/data/seasonalEvents.ts` — event definitions.
- `src/systems/SeasonalEventManager.ts` — date-check, activation, deactivation, event-state querying.
- `src/systems/seasonal/burnsNightEffects.ts` — Burns-Night-specific effect handlers.
- `src/ui/SeasonalEventBanner.ts` — optional HUD notification when event is active (small subtle banner).

### Files to modify

- `src/main.ts` — register `SeasonalEventManager`; initialize at boot.
- `src/scenes/BootScene.ts` — call `SeasonalEventManager.tick()` before scene flow.
- `src/scenes/CroftScene.ts` (H1 prereq) — apply seasonal props.
- `src/scenes/GameScene.ts` — check active seasonal events; apply run-level effects.
- `src/systems/music/Conductor.ts` — pipe-layer activation gated on Burns Night event.
- `src/data/banter.ts` — new `seasonal_event` pool (priority 65 per B1 spec).
- `src/core/i18n.ts` + `src/core/i18n.scs.ts` — Burns Night strings + framework strings (~70 keys × 2 locales).
- `src/data/variants.ts` — Burns's Wee Beastie unlock gates on the event-window + evolution-count condition.
- `src/utils/save.ts` — track `seasonalEventsSeen: Set<string>` and `burnsNightRunsCompleted: number`. Schema bump.
- `src/scenes/ChronicleScene.ts` — display Burns Night badge on event-window runs.

### Data shape

```typescript
// Checks against device local time.
function isSeasonalEventActive(eventKey: string, now = new Date()): boolean {
  const event = SEASONAL_EVENTS[eventKey];
  if (!event) return false;
  const m = now.getMonth() + 1;
  const d = now.getDate();
  return isInWindow({ m, d }, event.dateWindow);
}

function activeSeasonalEvents(now = new Date()): string[] {
  return Object.keys(SEASONAL_EVENTS).filter(k => isSeasonalEventActive(k, now));
}
```

### Tests / fences

- `SeasonalEventManager.test.ts` — date-math across year boundaries, window edges, DST.
- `burnsNightEffects.test.ts` — haggis-platter pickup spawns correctly; buff applies; banter triggers.
- `save.test.ts` — `seasonalEventsSeen` + `burnsNightRunsCompleted` migration.
- `variants.test.ts` — Burns's Wee Beastie unlock gates correctly.
- `e2e/burns-night-smoke.spec.ts` — mock the system clock to mid-Burns-Night; verify run-start ceremony, pickup spawn, croft props.

### Clock-mocking for tests

Pure date-check logic lives in `SeasonalEventManager` without global `Date` reference in hot paths. Tests pass `now` explicitly. CI runs independent of system date.

---

## 6. Future events (data-only additions)

Once E1 ships, these events become pure content work:

| Event | Window | Effects preview |
|---|---|---|
| **Hogmanay** | Dec 28 – Jan 3 | First-footer NPC; shortbread/whisky/coal/silver starter pickups; Auld Lang Syne stinger on victory. |
| **Imbolc (Brigid's Day)** | Jan 30 – Feb 3 | Ewes-lactating world tint; earliest-spring banter. |
| **St Andrew's Day** | Nov 27 – Dec 3 | Saltire colour tint; saltire-clad cairn-NPC grants flag buff. |
| **Up Helly Aa** | Last Tue January ± 3 days | Viking-longship-burn event biome transition; Up Helly Aa banter. |
| **Beltane** | Apr 28 – May 4 | Cailleach transforms to May Queen (cailleach variant reskin); fire buffs. |
| **Samhain / Halloween** | Oct 28 – Nov 3 | Cat Sith appears as rare elite; veil-thinning banter. |
| **Culloden anniversary** | Apr 13 – Apr 19 | Jacobite spectre enemies; sombre banter (Grave tonal register); *respectfully handled per CULTURAL_SENSITIVITIES §2.3*. |

Each is a `SeasonalEventDef` entry + ~10–20 banter lines + some sprite/particle work. Ship-rate: one event per sprint after E1 framework lands.

---

## 7. Accessibility

- `disableSeasonalEvents` setting — default off, but opt-out is clear for players who find surprise-content disorienting.
- **Photosensitivity:** run-start haggis-piped ceremony audited via PEAT per A1.
- **Content warnings** (per CULTURAL_SENSITIVITIES §2.3) — Culloden event (when shipped) displays a content warning on entry; skippable via `contentWarnings` setting.
- **Captions** for all seasonal banter + stingers (per existing `captionsEnabled`).

---

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Device clock wrong → events trigger off-calendar | Acceptable cost; no server-time check. Rare and low-impact. |
| Seasonal content bundle bloat | Each event's effects as data + <5 sprites + ~15-20 banter lines. Budget: ~20 KB gzip per event. |
| Overlapping windows (Burns Night + Imbolc edge) | Calendar designed to avoid overlap. Code handles multiple-active gracefully (effects merge). |
| Burns-citational banter risks misattribution | Every direct quotation is verified against a reputable Burns edition. No paraphrase attributed. |
| Burns Night variant unlock feels arbitrary | Clear UI on Cailleach-template locked-state shows remaining criteria. |
| Seasonal-only players feel left out | 52-week design means every player experiences multiple events per year. Almanac tracks past events. |
| Mechanical imbalance during event | Event buffs are small (+20% damage 60s, HP restore) and run-local. No carry-over. |
| Respecting Culloden (when that event ships) | Per `CULTURAL_SENSITIVITIES §2.3`: Grave tone only; no triumphal framing; content warning mandatory. |

---

## 9. Kill criteria

- **`SeasonalEventManager.test.ts`** passes all calendar edge cases.
- **Burns Night e2e smoke** passes with mocked clock.
- **Bundle delta** ≤ +30 KB gzip for Burns Night (framework included).
- **`npm run ci:all`** green (lint + 2980+ vitest + build + e2e).
- **Manual verification during actual Burns Night window** in year +1 (2027) — event triggers, variant unlock accessible, banter appropriate.
- **Opt-out works** — players who disable seasonal events see no changes.

If the Burns Night first-live-year playtest (Jan 2027) shows confusion (>2 in 10 testers miss what's happening), add a seasonal-event banner/tooltip explaining "Burns Night is live" and remove guessing.

---

## 10. Cross-references

- `docs/research/SCOTTISH_RESEARCH_DEEP.md §11` — full haggis + Burns Night ritual context.
- `docs/research/SCOTTISH_RESEARCH_DEEP.md §22` — full seasonal calendar.
- `docs/research/SCOTTISH_RESEARCH_DEEP.md §15.3` — Burns canon for quotation selection.
- `docs/research/ROGUELITE_RESEARCH.md §Tier A4` — seasonal events as content-multiplier pattern.
- `docs/research/CULTURAL_SENSITIVITIES_RESEARCH.md §2.3, §6.3` — Burns context + sectarian / political framing.
- `docs/research/NARRATIVE_RESEARCH.md §5.3 (Burns's voice), §6.6` — seasonal beats as narrative episodes.
- `docs/VOICE_CARD.md` — Burns citational voice.

---

*Spec complete. Plan breaks into M1 framework scaffolding + calendar logic, M2 Burns Night effects implementation, M3 croft-prop integration (pending H1), M4 music-layer wiring + audit + launch.*
