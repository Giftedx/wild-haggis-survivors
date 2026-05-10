# C1 — Highland Almanac design spec

**Date:** 2026-04-23
**Initiative:** C1 (`docs/HUGE_INITIATIVES_MASTER_PLAN.md`)
**Status:** Draft
**Prerequisite:** H1 Gran's Croft benefits from this but not strict prereq (Almanac can open from Chronicle too). B1 Banter Push helpful (banter tracking is a page). C2 Weapon lore pass helpful (item-flavour powers one page).

---

## 1. Problem statement

WHS has strong post-run reflection via `ChronicleScene` (lists past runs). It has strong *goal progression* via `DeedsScene` (achievements). What it lacks is **discovery-log meta** — the "I've seen 47 of the 80 beasties in this game; here are silhouettes of the ones I haven't seen yet" feeling.

`ROGUELITE_RESEARCH.md §Tier A1` and §Pattern-12 (Discovery-Log / Journal Meta) cite Spelunky's Journal, Isaac's secret list, Hades's Fated List, Cult of the Lamb's codex. All serve the same psychological function: **the player is scholar of the game's world, and the game tracks their scholarship**.

WHS's moor has more to study than most roguelikes: 32 enemies + 5 bosses (soon to grow), 6 routes (soon to be 18+ per M1), ~35 items (soon to be 50+ with R1 Relics), potentially hundreds of banter lines per pool. A quiet shelf of books that track what the player has encountered, silhouetted the unseen, and teased the rare — that's a flagship-scale addition.

### Player outcome

- After 10 runs, the player visits the Almanac and sees "I've seen 12 of 32 enemies. 7 of 6 routes (that extra one is a hidden route — how did I find that?). 3 of 15 relics. 84 of 300+ banter lines."
- Silhouettes of unseen beasties create curiosity.
- Rare banter lines shown as "???" tease the collector.
- The book *on Gran's croft table* is the Almanac.

### Why it's a flagship (A-tier, not polish)

- New scene (`AlmanacScene`) + 4 page layouts.
- New save fields (tracking counters per discoverable).
- Wiring into every existing content system (enemies, routes, items, banter) to record "seen" on first encounter.
- Art budget for silhouette-renders of every beastie.

Substantial system work; high lasting value for completionist players.

---

## 2. The four books

### Book 1: Beasties (enemies + bosses)

**Contents:** Every enemy type in the game + every boss.

**Entry per beastie:**
- **Name** — in-world name (not code-key).
- **Silhouette** if unseen; full sprite if seen.
- **Encounter count** — how many times the player has killed this beastie across all runs.
- **First seen** — run number + date.
- **Lore text** — 1-3 sentences of Gran-voice description (authored during C2 flavour pass extension).
- **Where found** — biomes / time ranges / seasonal conditions.
- **Drop info** (if applicable) — "This one has been known to drop…"

**Visual design:** book-spread layout, two beasties per page (one left, one right). Right-page always has beastie art; left-page has the lore + stats. Unseen beasties appear as silhouettes with *"???"* name; lore reads *"Not yet encountered."*

### Book 2: Weys (routes)

**Contents:** Every Moor Road route the player has picked + every route they've *not* picked (shown as silhouette-map-sketch).

**Entry per wey:**
- **Name** (e.g., *Up the Brae*, *Through the Kirkyard*).
- **Illustrated banner** — a painted scene of the route (sunrise hill for Brae, ruined kirkyard for Kirkyard, etc.).
- **First picked** — run number + date.
- **Pick count.**
- **Lore** — what the route represents, where it goes, what the moor remembers of it.
- **Effect summary** — what happens mechanically when this route fires.

**Extension:** when M1 Moor Road node-map ships, nodes the player has visited also appear in this book (as sub-entries per act).

### Book 3: Finds (items)

**Contents:** All weapons, evolutions, passives, relics, permanent upgrades.

**Entry per find:**
- **Name** + icon.
- **Flavour text** (from C2 lore pass).
- **First acquired** — run number + date.
- **Acquisition count** — across all runs.
- **Rarity marker.**

**Visual:** grid of icons; tap any for expanded entry.

### Book 4: Banter (lines heard)

**Contents:** Every banter pool's heard-lines tracked. Unheard lines shown as *"???"* with context hint ("This line fires on low HP, but you haven't heard it yet").

**Entry per pool:**
- **Pool name** (Gran commentary / Haggis monologue / Cailleach whispers / etc.).
- **Lines heard: X of Y.**
- **Expandable** — click to see the pool's heard lines as text, hear them again via UI.
- **Unheard lines** — *"???"* with trigger context.

**Rare banter (1%-rate lines):** shown differently — "✨ Rare whisper you've not yet heard. Try low-HP in the Grave biome."

**Chart view** per pool — shows heard-fraction visually.

---

## 3. Save tracking

### New save fields

```typescript
interface DiscoveryLog {
  beastiesSeen: Record<EnemyKey, {
    firstSeenAt: { runId: string; timestamp: number };
    killCount: number;
    seenCount: number;
  }>;
  
  routesVisited: Record<RouteKey, {
    firstPickedAt: { runId: string; timestamp: number };
    pickCount: number;
  }>;
  
  findsAcquired: Record<FindKey, {
    firstAcquiredAt: { runId: string; timestamp: number };
    acquireCount: number;
  }>;
  
  banterHeard: Record<string /* leaf key */, {
    firstHeardAt: { runId: string; timestamp: number };
    hearCount: number;
  }>;
  
  almanacVisits: number;
}
```

Schema bump.

### Wiring hooks

- `SpawnSystem.onEnemySpawned()` → first-seen increment.
- `Enemy.onDeath()` → kill-count increment.
- `RouteSystem.onRoutePicked()` → pick-count increment.
- `PlayerInventory.onItemAcquired()` → acquire-count increment.
- `BanterSystem.onLineFired()` → hear-count + first-heard increment.

All pure; testable.

### Retroactive seed

For existing saves: scan `runHistory` at load time, reconstruct discovery state as best as possible. Historical kill counts are imprecise (run history only stores totals); beasties-seen defaults to "seen at least once if a run-summary mentions them" (tolerable approximation).

---

## 4. Non-goals

- **Not achievements.** Deeds already exist. Almanac is *tracking*, Deeds is *goal-gating*.
- **Not run history.** Chronicle already does that.
- **Not player-authored notes.** No notes / bookmarks feature.
- **Not wiki import / export.** No external data surface.
- **Not a story log / cutscene viewer.** No cutscenes in WHS.
- **Not spoiler-revealing for unencountered content.** Silhouettes + "???" preserve mystery.
- **Not friend-comparison / leaderboards.** Solo data only.
- **Not editable flavour.** Lore text read-only.
- **Not unlimited persistence.** Banter track-per-leaf caps to 1000+ heard (unlikely to hit).

---

## 5. Architecture

### New files

- `src/scenes/AlmanacScene.ts` — main scene, tab-based book navigation.
- `src/scenes/almanac/BeastiesBook.ts` — Book 1 renderer.
- `src/scenes/almanac/WeysBook.ts` — Book 2 renderer.
- `src/scenes/almanac/FindsBook.ts` — Book 3 renderer.
- `src/scenes/almanac/BanterBook.ts` — Book 4 renderer.
- `src/systems/DiscoveryLog.ts` — pure state management for the discovery log; all increments routed through here.
- `src/ui/AlmanacEntryUI.ts` — reusable entry-card component.

### Files to modify

- `src/utils/save.ts` — extend `SaveData` with `discoveryLog: DiscoveryLog`. Schema bump to v11 (or whichever based on flagship order).
- `src/systems/SpawnSystem.ts` — hook first-seen recording.
- `src/entities/Enemy.ts` — hook kill-count recording.
- `src/scenes/ActIntermissionScene.ts` — hook route-pick recording.
- `src/systems/BanterSystem.ts` — hook line-fire recording.
- `src/scenes/CroftScene.ts` (H1) — bookshelf/table provides Almanac entry point.
- `src/scenes/ChronicleScene.ts` — add "View Almanac" button (alt entry).
- `src/scenes/MenuScene.ts` — add main menu entry (if H1 not yet shipped).
- `src/core/i18n.ts` + `src/core/i18n.scs.ts` — Almanac UI strings + beastie lore + route lore + find flavour (mostly reuses C2 flavour keys) = ~100 new UI keys × 2 locales.

### Tests / fences

- `DiscoveryLog.test.ts` — pure-function tests for increments, serialisation, retroactive seed.
- `AlmanacScene.smoke.test.ts` — basic scene-load + tab-switch.
- `save.test.ts` — v10 → v11 migration with retroactive seed.
- `e2e/almanac-navigation.spec.ts` — Playwright smoke: enter Almanac, tab through four books, close.

### Bundle delta

- Four scene files (~600 lines each ~ 2400 LOC) + DiscoveryLog + UI components.
- Icons for beasties reuse existing enemy sprite atlases (no new art).
- Book-page art: 4 backgrounds + shared UI chrome = ~30KB gzip.
- i18n strings: ~10KB gzip.

**Total budget: +60 KB gzip.**

---

## 6. UI / UX

### Scene layout

Single scene, tab-bar across top (Beasties / Weys / Finds / Banter). Click tab to switch book. Book content scrollable.

### Navigation

- **Mouse/touch:** click tab; scroll to pan the book pages; click entry to expand.
- **Keyboard:** arrow keys navigate; enter expands entry; escape closes.
- **Gamepad:** left-stick navigates; A expands; B closes.

### Visual style

Book-as-artefact. Paper texture. Hand-drawn icons. Inked borders around silhouettes. Progression indicator at bottom: "X of Y discovered."

Respects `uiScale` + `highContrastUi`.

### Banter replay

On Banter Book, expanded entry has "Hear Again" button — re-triggers the banter line via `BanterSystem.forceFire()`. Useful for players wanting to re-read a favourite line.

---

## 7. Accessibility

Per `docs/research/ACCESSIBILITY_RESEARCH.md`:
- Full keyboard navigation (tab order, focus indicator).
- Screen reader-friendly (all text exposed; entries readable in reading order).
- High contrast mode variant.
- `uiScale` respected.
- Silhouette reveal accessible via keyboard (not hover-only).
- Captions enabled for "Hear Again" re-trigger.

---

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Save size bloat for mature players | Compression of heard-banter log; cap hearCount at 1000 (beyond, just increment cap). |
| Retroactive seed is imprecise | Accept imprecision; mark discovery pre-C1 entries as "seen before your first journal entry" with a tiny icon. |
| Silhouette reveal spoils surprise | Silhouette shows *outline only*, no colour. Reveal on first in-game encounter. Balance: silhouette = enough to tease, not enough to identify. |
| 4 books = fragmentation | Tab UI clear. Bookshelf / table entry in Croft signals "the Almanac is *a* book, with chapters." |
| Banter book fills too slowly | ~300-500 lines is a long-tail. Expected: casual player fills ~40% over 50 hours; completionist fills ~95% over 200 hours. Target: still discoveries to make at 100 hours. |
| Players who don't care about collection ignore Almanac | Fine. Not required for any mechanical progression. Purely opt-in. |
| Incomplete discovery-log on pre-C1 save migration | Graceful — show "beastie first seen before Almanac existed" rather than "never seen." |

---

## 9. Kill criteria

- **`DiscoveryLog.test.ts`** passes all increment/serialisation cases.
- **Save migration v10 → v11** with retroactive seed tested against fixtures.
- **`AlmanacScene.smoke.test.ts`** + `e2e/almanac-navigation.spec.ts` green.
- **`npm run ci:all`** green (lint + 3000+ vitest + build + e2e).
- **Bundle delta ≤ +60 KB gzip.**
- **Manual smoke:** enter Almanac, each book renders, each entry expands, silhouettes visible for unseen beasties, "Hear Again" replays banter.
- **Accessibility smoke:** full keyboard nav + screen-reader reads entry cards correctly.

If any book's data source (routes, banter, finds, beasties) fails to wire cleanly in time, ship the Almanac with partial books and mark the missing ones as "coming soon." Beasties + Finds are the most valuable; ship at minimum those two.

---

## 10. Cross-references

- `docs/research/ROGUELITE_RESEARCH.md §Tier A1, §Pattern-12` — discovery-log pattern.
- `docs/research/NARRATIVE_RESEARCH.md §6.4` — Almanac as knowledge-progression.
- `docs/research/SCOTTISH_RESEARCH_DEEP.md §1 (folklore), §2 (places), §12 (food)` — content source for lore.
- `docs/superpowers/specs/2026-04-23-grans-croft-design.md` — H1 hub where Almanac lives.
- `docs/superpowers/specs/2026-04-23-weapon-lore-pass-design.md` — C2 provides `flavourKey` content used in Finds book.
- `docs/superpowers/specs/2026-04-23-banter-density-push-design.md` — B1 banter-line tracking feeds Book 4.

---

*Spec complete. Plan breaks into M1 DiscoveryLog + save schema, M2 AlmanacScene scaffolding + Beasties book, M3 Weys + Finds books, M4 Banter book + rare-teasing, M5 Croft integration + smoke.*
