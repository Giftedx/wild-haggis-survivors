# H1 — Gran's Croft (hub that grows) design spec

**Date:** 2026-04-23
**Initiative:** H1 (`docs/HUGE_INITIATIVES_MASTER_PLAN.md`)
**Status:** Draft
**Prerequisite:** W2 Moor Road, W18 bilingual banter, R1 Relics would benefit but not blocking.

---

## 1. Problem statement

Between-run meta-progression currently routes through `ShopScene.ts` (purchase-focused) and `Chronicle.ts` (history-log). Both are transactional. Neither is *a place the haggis lives*.

Roguelites of masterpiece calibre — Hades (House of Hades), Cult of the Lamb (the cult), Rogue Legacy 2 (the manor), Spelunky 2 (rescued NPCs hub), Loop Hero (camp), DRG:S (the ship) — all share a pattern: **a visually-evolving hub that accumulates the player's achievements as diegetic texture**. See `ROGUELITE_RESEARCH.md §Tier S2` and §Pattern-10 for the full case.

WHS references "Gran's Croft" and "the bothy" informally but has no such scene today. The haggis goes moor → menu → moor. That's a missed Soul Charter opportunity — the moor's *warmth* needs a hearth.

### Player outcome

A cosy, persistent scene the player returns to between runs that *visibly grows* as they progress. Gran is there. Trophies accumulate on the mantelpiece. The drove of unlocked variants silhouettes by the window. A book (the Highland Almanac — see C1 flagship) sits on the table. The wireless hums with a pibroch-flavoured menu music layer. Every boss kill, route first, variant unlock adds something to the room.

### Why this unblocks other work

- B1 banter — Gran-voice pool needs a scene where Gran *is*.
- C1 Almanac — the Almanac lives *at* the croft (the book on the table).
- E1 seasonal events — Burns Night piping-in ceremony plays out at the croft.
- Variant unlocks — the drove silhouettes are the reward-moment.

Gran's Croft is the *connective tissue* for the next content wave.

---

## 2. Scene composition

### Visual elements

The croft is a single-screen painterly scene, stylised pixel art consistent with the Art Style Bible palette anchors (peat browns + heather purples + whisky golds dominant; see `docs/ART_STYLE_BIBLE.md`).

| Element | Purpose | Unlock driver | Art cost |
|---|---|---|---|
| **Gran** (seated, knitting) | Always present; voice anchor | none (always visible) | 1 sprite + 2-3 idle animation frames |
| **Hearth fire** | Ambient warmth; particle flicker | none | 1 sprite + 4-frame loop |
| **Mantelpiece** | Boss-kill trophies accumulate | per boss-kill-first | 1 slot per boss (5 currently) |
| **Photo wall** | Route-pick-first photos | per route first-pick | 1 slot per route (6 currently; 18 post-M1) |
| **Drove (window)** | Variant-unlock silhouettes | per variant unlock | 1 silhouette per variant (10 shipped; 13 post-V2) |
| **Bookshelf** | Almanac access | unlocked by C1 flagship | book prop + book UI |
| **Wireless (radio)** | Menu-music layer toggle | always present | sprite + tiny animation |
| **Window view** | Biome rotation based on current variant | none | 1 backdrop per biome |
| **Table with cuppa** | Quit-to-menu entry point | always | 1 sprite |
| **Rug / hearthstone** | Sleep/save moment | always | 1 sprite |
| **Thistle by window** | Seasonal bloom (Burns Night / Beltane) | seasonal event active | 3 states (default / bloomed / wilted) |

### Interaction model

- Entering the croft: fade from MenuScene. Music crossfades to croft-specific layer (pibroch-soft).
- Cursor/touch selects interactive elements. Each has hover-label + click action.
- **Always-available actions:**
  - Start Run (haggis runs through door to moor).
  - Shop (Gran offers the sporran — navigates to `ShopScene`).
  - Almanac (opens C1 book UI).
  - Chronicle (opens existing Chronicle as sub-view).
  - Settings (navigates to `SettingsScene`).
  - Variant picker (walks the drove; per-haggis hover).
  - Quit (sits at table, cuppa animation, returns to MenuScene / closes game).

### Banter integration

Gran's pool (see B1 flagship) fires at croft entry, on trophy click (she comments on the boss killed), on first-visit each session. Priority 30 `gran_commentary`.

---

## 3. Trophy schema

### Mantelpiece (boss kills)

One shelf slot per shipped boss. Trophies visually evolve through first-kill → 10th-kill → cursed-victory-kill:

| Boss | Trophy first-kill | 10th-kill upgrade | Cursed-victory upgrade |
|---|---|---|---|
| Gordon | Chef's ladle | Ladle + apron scrap | Ladle + singed apron + burnt spoon |
| Tour Bus | Bus wheel | Wheel + route number | Wheel + cracked windshield |
| The Laird | Tweed cap | Cap + walking stick | Cap + stick + signet ring |
| Haggis Hunter General | Pith helmet | Helmet + journal | Helmet + journal + broken rifle |
| Taxman | Ledger | Ledger + quill | Ledger + quill + red-ink bleed |

Trophies persist across save schema bumps. Each has a banter-key associated with Gran's-eye-view commentary ("that Gordon had it comin', eh?").

### Photo wall (route picks)

One polaroid per Moor Road route first-picked. Photo art depicts the route's vibe (e.g., `up_the_brae` = haggis running uphill at sunset). 6 slots today, 18 after M1 Moor Road node expansion. Photos fade from sepia to colour on first pick, then pin to wall.

### Drove (window silhouettes)

One haggis silhouette per variant unlocked. Silhouettes line up at the window. Cursor-hover reveals the variant's name + stats. Click = select for next run.

### Seasonal props

- **Burns Night (25 Jan window):** a small haggis-on-a-platter prop appears on the table with a printed "Address" card. Burns quotation banter fires at croft entry.
- **Hogmanay (31 Dec – 1 Jan):** a sprig of holly, a bottle of whisky, a lump of coal on the hearth. First-footer banter line.
- **Beltane (1 May):** thistle blooms; fire burns brighter.
- **Samhain (31 Oct – 1 Nov):** jack-o'-neep on the hearth; low candlelight; Cailleach banter.

Seasonal props auto-swap based on real-world date (see E1 flagship for infrastructure). Off-season they disappear.

---

## 4. Non-goals

- **Not a village.** One croft, one Gran. No NPC ecosystem in v1. (A future hub flagship could expand — see DESIGN_IDEAS §10 "Hub".)
- **No shop integration.** Clicking "Shop" opens `ShopScene` as a separate screen, preserving existing shop flow. Croft does not absorb shop mechanics.
- **No user-placed decoration.** Trophy positions are authored, not player-arranged.
- **No croft garden / outdoor area.** The scene is one interior screen. Expanding to outdoor biome preview is stretch.
- **No Gran combat / tutorial.** Gran stays seated. No "Gran teaches the basics" mini-game.
- **No croft biome variations.** One croft interior; backdrop through window shifts to show current variant's home biome.
- **No multiplayer / co-op hub.** Solo-only. The drove silhouettes are the closest thing to "others" visible.
- **No time-of-day cycle beyond seasonal events.** Croft lighting is fixed warm-hearth except during named events.

---

## 5. Architecture

### New files

- `src/scenes/CroftScene.ts` — main scene; draws composition + handles interaction.
- `src/scenes/croft/CroftComposition.ts` — pure layout helper (where each element sits); testable without Phaser.
- `src/scenes/croft/CroftTrophies.ts` — pure logic for trophy unlock state (reads from save).
- `src/scenes/croft/CroftInteractionRouter.ts` — element-click → scene-transition mapping.
- `src/scenes/croft/CroftMusic.ts` — pibroch-soft music layer configuration for croft.
- `src/art/sprites/croft/*.ts` — procedural sprite drawers following `BootScene` pattern (Gran, hearth, mantel, window, drove haggis silhouettes, wireless, table).

### Files to modify

- `src/scenes/BootScene.ts` — register new croft sprite atlases (additions to the existing programmatic-sprite pipeline).
- `src/scenes/MenuScene.ts` — add "Enter the Croft" as primary menu action; relegate current "Start Run" to within-croft action.
- `src/core/i18n.ts` + `src/core/i18n.scs.ts` — add `ui.croft.*` strings (Gran banter, hover labels, interaction prompts). ~60 keys × 2 locales.
- `src/data/banter.ts` — register `gran_commentary` pool per B1 (or ensure B1 lands first).
- `src/utils/save.ts` — extend `SaveData.unlocks` with:
  - `bossKillCounts: Record<BossKey, number>` (trophy state).
  - `firstRouteVisits: Set<RouteKey>` (photo wall).
  - `firstBossKills: Set<BossKey>` (unlock gate for each mantel slot).
- `src/utils/save.test.ts` — migration + per-field coverage tests.
- `src/data/variants.ts` — each variant declares `silhouetteSpritePath` for the drove.
- `docs/PRD.md` — note the new CroftScene in the snapshot.
- `docs/BANTER_AUTHORING.md` — add Gran-pool recipe.

### Scene flow changes

**Before:**
`BootScene` → `MenuScene` → `GameScene` → `ShopScene`

**After:**
`BootScene` → `MenuScene` → `CroftScene` (new) → `GameScene` → `CroftScene` (return, not MenuScene)

`ShopScene` becomes a sub-view of `CroftScene` rather than a sibling. `MenuScene` becomes a one-time entry point; returning players land directly in `CroftScene`.

Chronicle and Settings navigate as sub-scenes from Croft. Return-to-Croft is default.

### Data shapes

```typescript
interface SaveData {
  // existing fields...
  unlocks: {
    // existing...
    bossKillCounts: Record<BossKey, number>;          // for trophy tier
    firstBossKills: Set<BossKey>;                     // for mantel unlock
    firstRouteVisits: Set<RouteKey>;                  // for photo wall
    cursedVictoriesByBoss: Record<BossKey, number>;   // for cursed-variant trophy
  };
}

interface CroftTrophy {
  key: BossKey;
  tier: 'none' | 'first' | 'tenth' | 'cursed';
  spritePath: string;
  banterKey: string;   // Gran's commentary when hovered/clicked
}

interface CroftPhoto {
  routeKey: RouteKey;
  pickCount: number;
  spritePath: string;
  banterKey: string;
}
```

### Save schema bump

v7 → **v8**. Migration reads existing `runHistory` and reconstructs `bossKillCounts`, `firstBossKills`, `firstRouteVisits` from past runs (retroactive seed, graceful for existing players). Missing fields default to empty / 0.

### Tests / fences

- `CroftComposition.test.ts` — layout math (element positions scale with `uiScale`).
- `CroftTrophies.test.ts` — trophy tier computation from save state.
- `CroftInteractionRouter.test.ts` — click routing to correct scene.
- `save.test.ts` — migration v7 → v8 retroactive seed correctness.
- `e2e/croft-smoke.spec.ts` — Playwright smoke: enter croft → click variant → start run → die → return to croft; trophy persists.

---

## 6. Accessibility

Per `docs/research/ACCESSIBILITY_RESEARCH.md`:
- All interactive elements have keyboard focus + tab order.
- Elements have hover labels (readable with `uiScale` + `highContrastUi`).
- Trophies have alt-text for screen-reader compatibility.
- Seasonal prop triggers captioned ("*sprig of holly appears*") if captions enabled.
- Pause-anywhere from Croft.
- Gran-voice captions per new banter pool.

---

## 7. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Croft scene bundle bloat | Procedural sprites (not baked assets) keep each drawer at ~200–500 lines. Budget: +60 KB gzip max. |
| Scene transition latency | Croft sprites pre-warmed in `BootScene` (programmatic generation); transition from MenuScene fades in ~300ms. |
| Trophy state migration fails for existing save | Migration is append-only (never deletes), defaults are empty sets. Corrupted save = trophies start fresh, no data loss. |
| Cognitive overload (too many visible elements) | Progressive reveal — mantel starts empty; fills as trophies earned. New players see only Gran + hearth + basic actions. |
| Gran banter pool feels thin at launch | Ship with at least 10 Gran lines + placeholder-acceptable ("the kettle's on"). B1 flagship fills out. |
| Trophy art budget balloons | Tier-upgrades are sprite-swaps not full redraws. 5 bosses × 3 tiers = 15 sprites + 6 photos + 13 silhouettes = ~34 sprite drawers. Budgetable in one art sprint. |
| Players miss CroftScene and expect old MenuScene flow | `MenuScene` still exists as intro / first-launch. Returning-player flow lands in Croft. |

---

## 8. Kill criteria

- **Croft scene bundle < +80 KB gzip** vs pre-H1 baseline.
- **Scene transition < 500 ms** on target hardware (tested on mid-range device during CI e2e).
- **Save migration v7 → v8** passes all existing save fixtures plus new tests.
- **`npm run ci:all`** green (lint + 2950+ vitest + build + e2e including new `croft-smoke.spec.ts`).
- **Manual smoke check:** enter croft → all trophies from current save display → variant select works → seasonal props appear if active seasonal event.
- **Playtest:** if fewer than 50% of playtesters return to Croft voluntarily (vs 'quit to menu') after 3 runs, Croft is decorative rather than destination — revisit trophy reward rhythm.

If Phase 1 croft ships but feels empty/static, revert to MenuScene default and treat Croft as behind-feature-flag until trophy/banter density catches up.

---

## 9. Cross-references

- `docs/DESIGN_SOUL.md` — Warmth, Hearth tonal register.
- `docs/ART_STYLE_BIBLE.md` — palette anchors, tonal palette map (Hearth palette applies).
- `docs/VOICE_CARD.md` — Gran's voice.
- `docs/research/ROGUELITE_RESEARCH.md §Tier S2, §Pattern-10` — strategic rationale, hub-as-trophy-case pattern.
- `docs/research/NARRATIVE_RESEARCH.md §5.4` — the moor-as-witness frame; Gran's Croft as narrative anchor.
- `docs/research/SCOTTISH_RESEARCH.md §Part 1 folklore (Broonie, Bean-Nighe, etc.)` — Gran and croft are non-mythic; croft has a working kettle, not a brownie. But a brownie on the hearth is a Phase 2 candidate.

---

*Spec complete. Plan breaks into ~3 milestones: M1 scene scaffolding + Gran, M2 trophy system wiring + save migration, M3 drove + photo wall + seasonal props.*
