# R1 — Relics (third progression tier) design spec

**Date:** 2026-04-23
**Initiative:** R1 (`docs/HUGE_INITIATIVES_MASTER_PLAN.md`)
**Status:** Draft
**Prerequisite:** W2 Moor Road shipped (gives us elites as drop sources). H1 Gran's Croft helpful for trophy display but not blocking.

---

## 1. Problem statement

WHS's in-run progression is two-tier: weapons (active) and passives (stat modifiers). Both scale linearly with cards drawn at level-ups. Over a 25-minute run, the player accumulates ~10–14 cards from a weighted pool of commons/uncommons/rares/legendaries.

Canonical roguelite progression has a **third tier** — rarer, run-altering items that come from *specific rare sources* (boss drops, elite pockets, event rewards). See `ROGUELITE_RESEARCH.md §Tier A5`:

- Slay the Spire → Relics.
- Hades → Keepsakes + Hammers.
- Returnal → Parasites.
- Isaac → Trinkets + unique items.
- Dead Cells → Mutations.

This tier does two jobs that upgrades/passives cannot:

1. **Elevates elites / bosses from modest rewards to run-defining events.** Currently an elite = 3× XP + gold. A Relic-dropping elite = *a run changes shape*.
2. **Creates a slot-constrained decision layer.** 3-slot cap means players choose *which* Relics to keep. Opportunity cost creates strategy.

### Player outcome

Elite kills and boss kills feel *narratively* impactful. A Relic drop is a moment. Players build emergent strategies around Relic-synergies. Late-run decisions ("replace this Relic or keep it?") add tension without adding complexity to the core level-up flow.

### Why now

The research surfaced 15–20 specific Relic candidates with WHS-native flavour (Cairn Stone, Sporran of Holding, Gran's Teapot, Highland Torque, etc. — see `ROGUELITE_RESEARCH.md §Tier A5`). Content is half-designed already. Remaining work is architecture.

---

## 2. Design rules

### The three slots

- **3 Relic slots per run, hard cap.** Cannot expand within a single run.
- **Cannot swap mid-run without cost.** If a player picks up a 4th Relic, they must discard one of the held 3 (manual choice, not auto). Discarded Relic disappears.
- **Slots persist across death.** If a run ends and the player resurrects (Highland Shield), held Relics survive.
- **Slots reset at run end.** Relics do not persist across runs in v1. (Permanent Relic-keepsake is Phase 2 candidate; see Non-goals.)

### Drop sources (rare, curated)

| Source | Drop rate | Design rationale |
|---|---|---|
| **Elite kill** | 15% per elite (currently ~1 elite per 3 min after 2:00; expected ~2 Relics/run at that rate) | Makes elites narratively valuable |
| **Boss kill (first phase)** | 100% chance of a guaranteed Relic drop from Tier-2+ bosses (Tour Bus, The Laird, Haggis Hunter General, Taxman — not Gordon) | Bosses anchor the run rhythm |
| **Treasure chest (legendary only)** | 25% chance the legendary roll is a Relic instead of weapon/evolution | Preserves existing chest economy |
| **Moor Road Hidden node** (post-M1 flagship) | Specific Hidden nodes can offer Relics as reward | Ties to M1 flagship content |
| **Cailleach's Bargain** (future Bargain event) | A high-stakes trade: health-for-Relic | Completes the "devil deal" vocabulary |

**Total expected Relics per 25-min run: ~2–4.** Players will often reach 3-slot cap mid-run and must decide whether to accept a 4th.

### Rarity tiers

Relics have three rarities, drop-weight-balanced:

- **Common** (50% of drops): simple persistent stat boost or modest rule. Example: *Sporran of Holding* — +2 gold per pickup.
- **Uncommon** (35%): conditional rule with higher payoff. Example: *Cairn Stone* — enemies killed while in heather spawn a pickup-rushing gem.
- **Rare** (15%): run-defining effect. Example: *Gran's Teapot* — after 5s of not taking damage, heal 5% HP/s.

Weighted pool ensures rares are genuine moments. A single rare Relic can sometimes *make* the run.

### No Relic synergies as first-class system

Unlike weapons (where `EVOLUTION_RECIPES` pairs weapon + passive), **Relics do not chain**. Emergent synergies are fine (Cairn Stone + heather-density biome = accidental pickup-spam), but no curated "2-Relic combo unlocks a 3rd effect." Keeps Relics readable.

---

## 3. The 18 launch Relics

Authored following the tonal palette spec + research candidates. Each Relic has: name, rarity, effect (one-sentence rule), flavour text (Dark-Souls-style), drop-source affinity.

### Common (8 Relics)

| Name | Effect | Flavour |
|---|---|---|
| **Sporran of Holding** | +2 gold per pickup collected. | *"Capacious beyond reason. Gran insists it's just well-organised."* |
| **Oatcake Stash** | Heal 2 HP when you enter a healing circle. | *"One for each knee. Never knew when ye'd need 'em."* |
| **Gran's Thimble** | Critical hits deal +8% damage. | *"Precision passed through eight generations of mending."* |
| **Lucky Heather Sprig** | +3% luck (affects card-draw rarity). | *"Found in the peat below where a shepherd fell in 1820. Still fragrant."* |
| **Bronze Clasp** | First hit each second deals +15% damage. | *"A brooch once pinned a plaid at Bannockburn. The plaid is gone."* |
| **Ceilidh Dancer's Ribbon** | Pickup-chain bonus activates at 5 in a row (default 8). | *"Lost in the Strip the Willow of 1949. Never stopped spinning."* |
| **Damp Tinder** | Fire hazards deal 40% less damage to the haggis. | *"Won't burn for anything. Not for want of trying."* |
| **Whisky Dram** | Once per run, regain 20% HP instantly (activate via sporran menu). | *"A wee sip for the road. Don't let Gran see."* |

### Uncommon (7 Relics)

| Name | Effect | Flavour |
|---|---|---|
| **Cairn Stone** | Enemies killed in heather spawn a pickup-magnet gem (1 per 5s). | *"The top stone of a walker's cairn on the path to Ben Macdui. Still warm, somehow."* |
| **Pictish Compass** | Reveals chest and Relic-drop positions on minimap. | *"Knotwork points home. Not always the same home."* |
| **Highland Torque** | +100% damage to elites. Elites spawn 20% more often. | *"Twisted gold from the Moray Firth. Clasps around the haggis like it was always meant to."* |
| **Bodhrán Skin** | Combat music-bass layer grants damage bonus on-beat (±80 ms). | *"Tight as bone. Hum it to test the tuning."* |
| **Clootie Rag** | Lifesteal doubled for 5s after taking damage. | *"Tied at a holy well in Easter Ross. The well has since dried."* |
| **Fishermen's Net** | Enemies moving away from player take +30% damage. | *"Marked with the name of a boat that never came home."* |
| **Midgie Repellent** | Immune to midge-swarm stacking damage. | *"Formula lost. The bottle refills on its own between runs."* |

### Rare (3 Relics)

| Name | Effect | Flavour |
|---|---|---|
| **Gran's Teapot** | After 5s without taking damage, heal 5% max HP per second until damaged again. | *"Warm. Always warm. The kettle has been on since 1951."* |
| **Fingal's Horn** | Once per run, summon 3 spectral Fianna warriors for 10s. Activate via sporran menu. | *"Found in a cave on Staffa. It has been silent for eight centuries. Now it waits for one note."* |
| **Stone of Destiny (shard)** | +50% XP from all sources. Boss HP increased by 15%. | *"A splinter the size of a thumbnail. Nobody noticed it missing."* |

### Reserved slots (Phase 2 candidates, not v1)

- **Cailleach's Whisker** — rare; appears only after Bargain event.
- **Taxman's Quill** — rare; appears only on specific boss-refusal.
- **Prince Charlie's Pocket Mirror** — Jacobite-themed, Seasonal event.

### Drop-source affinity

Each Relic has 1–3 preferred drop sources. Elite-kills favour stat-boost Relics (Gran's Thimble, Bronze Clasp). Boss-drops favour run-defining Rares (Gran's Teapot, Stone of Destiny shard). Chest rare-rolls favour uncommons. This adds light thematic coherence without hard rules.

---

## 4. UI

### Slot display (HUD)

Three Relic-slot icons on the right side of HUD, above the combo counter. Each slot shows:
- Relic icon (thistle-bordered if rare; plain if common).
- Tooltip on hover (shows name + effect + flavour).
- Subtle pulse if the Relic has an active/conditional trigger currently firing.

Empty slots show a simple dotted-outline placeholder.

### Pickup moment

Relic dropped → floats in place (not auto-collected). Player walks over it → pickup prompt ("Pick up the *Cairn Stone*?"). Pressing action key collects.

If all 3 slots are full: pickup UI opens showing the 3 held + the new one. Player selects one to discard (or cancels pickup). Selected Relic disappears from game.

### Pickup celebration

Per `GAME_FEEL_RESEARCH.md §2.5` moment recipe:
- 400ms pause-beat on collection.
- Thistle-burst particle VFX (rare-rarity Relics get gold-thistle particles).
- Stinger SFX unique to Relic rarity (common / uncommon / rare distinct).
- Reserved first-time banter: "A Relic, hen. Tuck it away."

### Sporran menu

Existing pause menu extends — new "Relics" tab shows full slot inventory with effects readable in detail. Active Relics (Whisky Dram, Fingal's Horn) triggerable from this menu.

---

## 5. Non-goals

- **No Relic crafting or upgrading.** Relics are found, not built.
- **No Relic-chain synergies as first-class system.** No "2 Relics combine into a 3rd effect."
- **No persistent-across-runs Relics.** Slots reset at run end. (Permanent-keepsake Relics are Phase 2; Hades Keepsake-system is the reference.)
- **No Relic trading with NPCs.** You find it or you don't.
- **No Relic-specific balance per variant.** A Relic has the same effect regardless of which haggis holds it.
- **No rarity-elevation-via-play** (e.g., "kill 10 enemies to upgrade your Relic"). Rarities are fixed at drop.
- **No curses / negative Relics.** If we add Cursed Relics, it's a Phase 2 ticket.
- **No active-ability slot.** Active Relics (Whisky Dram, Fingal's Horn) are triggered via sporran menu (existing pause), not a dedicated active-button. A true "active ability slot" with its own button-binding is a separate future flagship.

---

## 6. Architecture

### New files

- `src/data/relics.ts` — Relic catalogue with `RelicDef` interface (name, rarity, effect, flavour, drop-affinity).
- `src/systems/RelicSystem.ts` — manages player's 3 slots, drop rolls, effect application.
- `src/systems/relics/relicEffects.ts` — pure functions implementing each Relic's effect (testable without Phaser).
- `src/ui/RelicSlotUI.ts` — HUD slot widget.
- `src/ui/RelicPickupPrompt.ts` — pickup UI (3-held + discard picker).
- `src/data/relicDrops.ts` — drop-source wiring (elite drop rolls, boss drops, chest overrides).

### Files to modify

- `src/systems/SpawnSystem.ts` — elite-kill hook fires Relic drop roll.
- `src/scenes/game/handleBossDeath.ts` (or equivalent) — Tier-2+ boss drops guaranteed Relic.
- `src/scenes/game/evolutionChest.ts` — legendary chest 25% rolls Relic instead.
- `src/systems/Player.ts` — `applyRelicEffects()` called each `update()`; Relic effect modifiers composed per-frame.
- `src/core/i18n.ts` + `src/core/i18n.scs.ts` — 18 Relic names + 18 effects + 18 flavour texts × 2 locales = ~108 leaf keys.
- `src/utils/save.ts` — `RunHistoryEntry.relics: RelicKey[]` (track which Relics appeared per run; for Chronicle display and Almanac). Schema v7 (if B1 lands first) → **v8**.
- `src/data/banter.ts` — new `relic_pickup` pool, priority 50; first-time Relic banter reserved.
- `src/scenes/game/PauseMenu.ts` — add Relics tab.
- `src/scenes/ChronicleScene.ts` — show held Relics per past run.
- `docs/PRD.md` — note Relic system.

### Data shape

```typescript
interface RelicDef {
  key: string;                       // e.g. 'cairn_stone'
  rarity: 'common' | 'uncommon' | 'rare';
  nameKey: string;                   // i18n path
  effectKey: string;                 // i18n path (short one-sentence)
  flavourKey: string;                // i18n path (longer Dark-Souls-ish)
  iconSprite: string;
  particleColour: number;            // for pickup VFX
  dropAffinity: Array<'elite' | 'boss' | 'chest' | 'hidden_node' | 'bargain'>;
  activate?: boolean;                // if true, triggerable from sporran menu (Whisky Dram, Fingal's Horn)
  applyPerFrame?: (ctx: RelicContext) => void;
  onPickup?: (ctx: RelicContext) => void;
  onDiscard?: (ctx: RelicContext) => void;
  onEnterHealingCircle?: (ctx: RelicContext) => void;
  // ... hook functions per Relic's effect
}

interface RelicSlot {
  def: RelicDef | null;
  activationUses?: number;  // for one-shot Relics like Whisky Dram
  internalState?: Record<string, unknown>; // e.g., Gran's Teapot damage-free timer
}

interface PlayerState {
  // existing...
  relicSlots: [RelicSlot, RelicSlot, RelicSlot];
}
```

### Drop-roll flow

```
elite_killed → RelicSystem.rollDrop(source: 'elite')
  → if (random < 0.15 * luck_modifier):
      → select Relic from pool weighted by rarity (50/35/15) and drop-affinity
      → spawn RelicPickup entity at elite's death position
      → pickup entity lives 60 s before despawning (urgency without instant-lose)
```

### Tests / fences

- `relicEffects.test.ts` — each of 18 Relics has pure-function test covering its rule.
- `RelicSystem.test.ts` — slot-cap enforcement, drop roll weights, elite/boss/chest source routing.
- `save.test.ts` — migration + `RunHistoryEntry.relics` round-trip.
- `e2e/relic-pickup.spec.ts` — Playwright smoke: kill elite → relic drops → pickup → HUD shows slot filled.

---

## 7. Balance hooks

- **Luck modifier on drop roll.** Existing luck stat (sporran, lucky_heather shop upgrade) increases elite-drop chance from 15% base.
- **Cursed-variant modifier.** Cursed runs (Ironmoor + others) may boost drop rate to 25% to compensate for higher difficulty.
- **Per-variant affinity.** Some variants may have innate Relic-affinity (e.g., future "Treasure Hunter" variant starts with +1 slot or +10% drop rate). Not v1.

### Emergent-synergy audit

Each launch-Relic pair should be playtested for broken combos. Known *likely-strong* combinations (acceptable — build-diversity signal):
- Gran's Teapot + Damp Tinder + Sporran of Holding = safe tank build.
- Highland Torque + Fingal's Horn = elite-demolisher.
- Cairn Stone + Ceilidh Dancer's Ribbon = pickup-chain god.

Known *potentially-broken* (check during playtest):
- Stone of Destiny shard + combat-lean build might snowball XP too hard → test for act-1-at-2:00 concerns.
- Midgie Repellent + heavy midge-swarm biome = removes a challenge class; might be too flat.

If any combination makes the run "solved" (>80% pick rate when available), rebalance.

---

## 8. Non-goals (expanded)

(Restating per §5 for clarity.)

- Not cross-run persistent (Phase 2 Keepsake system).
- Not expandable slot count v1.
- Not craftable.
- Not sellable / tradeable.
- Not cursed (negative effect).
- Not synergy-chained.

---

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| 18 Relics is too many for launch balance | Launch with 12 (8 common + 3 uncommon + 1 rare), stage remaining 6 in monthly drops after telemetry lands. |
| Rare Relic dominance (one Relic wins every run) | Balance pass post-launch: if a Rare has >70% pick rate when offered, nerf within 2 weeks. |
| Slot-cap UI confuses players | Pickup UI shows clear *"you have 3; pick one to discard or cancel"*. Tooltip-heavy. First-time tutorial banter from Gran explains. |
| Relic drops lag boss rhythm | Drop rate telemetry (opt-in) measures ~2–4/run target. Adjust elite-drop rate between patches. |
| Bundle bloat | Procedural icons + shared particle pool. Budget: +40 KB gzip for 18 Relics. |
| i18n 108-key authoring load | Phase with B1 flagship — part of the banter density push. Author together. |
| Save migration touches existing runHistory | Append-only field; defaults to empty array if missing. Backward-compatible. |

---

## 10. Kill criteria

- **Balance check:** after 2 weeks of playtest telemetry, no single Relic is picked >70% when available (rares) or >55% (commons).
- **Bundle delta:** +40 KB gzip or less.
- **`npm run ci:all`** green (lint + 2950+ vitest + build + e2e including new `relic-pickup.spec.ts`).
- **Manual check:** elite kill → Relic drops → pickup UI works at uiScale 1.4× + highContrastUi enabled.
- **No crash path:** slot-management under all configurations of 0, 1, 2, 3 held Relics with a 4th offered.

If playtest shows confusion on the discard-picker UI (>3/10 testers miscollect), revert to Phase 1 with 2 slots instead of 3 until UX improves.

---

## 11. Cross-references

- `docs/DESIGN_SOUL.md` — Moment recipe (Part 6) for Relic pickup.
- `docs/ART_STYLE_BIBLE.md` — signature motifs (thistle for rare Relics).
- `docs/VOICE_CARD.md` — flavour text tone (Hearth + slight mystical).
- `docs/research/ROGUELITE_RESEARCH.md §Tier A5` — strategic rationale, Keepsake reference.
- `docs/research/NARRATIVE_RESEARCH.md §3.3, §6.2` — Dark-Souls-style item descriptions; flavour-text technique.
- `docs/research/SCOTTISH_RESEARCH.md §1.6, §1.8` — historical/mythic sources for Relic naming.
- `docs/research/SCOTTISH_RESEARCH_DEEP.md §22.9–22.10` — Clootie wells, holy sites; named-relic grounding.

---

*Spec complete. Plan will break into ~4 milestones: M1 data + schema, M2 drop-roll + pickup, M3 effect application + UI, M4 balance playtest + launch.*
