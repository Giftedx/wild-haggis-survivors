# Variant #10 Cailleach — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the tenth playable haggis variant — Cailleach — with stat deltas, palette, sprite, unlock, and full bilingual banter pool.

**Architecture:** Extend existing `VARIANTS` catalogue with one new entry. Add `cursed_victories` unlock condition to the tagged `VariantUnlockCondition` union + migration seed from `runHistory`. New palette + accent style feed the shared `haggisComposition` drawers. 24 EN + 24 SCS banter keys across 6 sub-pools honour the parity fence. No new mechanic — stat + palette + banter only.

**Tech Stack:** TypeScript, Phaser 3, Vitest, existing variant pipeline.

**Spec:** `docs/superpowers/specs/2026-04-22-variant-cailleach-design.md`

---

## File Structure

### Modified files
- `src/data/variants.ts` — add 10th entry + extend `VariantKey` union + `HaggisAccentStyle` union + `VariantUnlockCondition` union
- `src/data/variantWireUp.test.ts` — roster count bump 9 → 10
- `src/data/variants.test.ts` — new Cailleach-specific shape tests
- `src/utils/save.ts` — add `cursedVictoriesCompleted: number` unlock counter + coerce + retroactive seed
- `src/utils/save.test.ts` — migration + seed tests
- `src/core/i18n.ts` — Cailleach EN strings (name, flavor, unlock hint, 24 banter keys, deed label)
- `src/core/i18n.scs.ts` — matching SCS
- `src/art/kiltPalette.ts` — add `cailleach` kilt palette entry
- `src/data/achievements.ts` (or the scene emitting victory events) — `ach_cailleach_unlock` grant on 3rd cursed victory
- `src/entities/haggisComposition/drawers/accessory.ts` (or accessory atlas) — silver crone-hair tuft + rowan-berry pip for Cailleach variant

---

## Task 1: Save migration — cursedVictoriesCompleted counter

**Files:**
- Modify: `src/utils/save.ts`
- Modify: `src/utils/save.test.ts`

Enables the unlock without shipping the variant yet. Fully reversible standalone.

- [ ] **Step 1: Read the existing save shape**

```bash
grep -n "cursedVictoriesCompleted\|skipActIntermissions\|unlocks\b" src/utils/save.ts | head -30
```

Find:
- The `SaveData` / `GameSave` interface
- Where similar counter fields live (goldTotal, highestLevel, etc.)
- The coerce helper (`toNumber` or similar)
- Whether unlocks are a sibling record or a flat counter

- [ ] **Step 2: Add the failing test**

Append to `src/utils/save.test.ts`:

```typescript
describe('cursedVictoriesCompleted migration', () => {
  it('defaults to 0 on fresh save', () => {
    const loaded = loadSaveFromString(JSON.stringify({}));
    expect(loaded.cursedVictoriesCompleted).toBe(0);
  });

  it('preserves a saved counter value', () => {
    const loaded = loadSaveFromString(JSON.stringify({ cursedVictoriesCompleted: 2 }));
    expect(loaded.cursedVictoriesCompleted).toBe(2);
  });

  it('coerces invalid values to 0', () => {
    const loaded = loadSaveFromString(JSON.stringify({ cursedVictoriesCompleted: 'no' }));
    expect(loaded.cursedVictoriesCompleted).toBe(0);
  });

  it('seeds retroactively from runHistory on first load', () => {
    const loaded = loadSaveFromString(JSON.stringify({
      runHistory: [
        { mode: 'victory', curseKey: 'heavy_legs', seed: 'a' },
        { mode: 'death', curseKey: 'heavy_legs', seed: 'b' },
        { mode: 'victory', curseKey: null, seed: 'c' },
        { mode: 'victory', curseKey: 'iron_grip', seed: 'd' },
      ],
    }));
    expect(loaded.cursedVictoriesCompleted).toBe(2);
  });
});
```

Names for `loadSaveFromString` should match whatever test helper the existing tests use. If there's no exported test helper, call the production load path (e.g. `SaveManager.load()` with a stubbed storage) — match existing tests' pattern.

- [ ] **Step 3: Run test to verify fail**

Run: `npx vitest run src/utils/save.test.ts`
Expected: FAIL — field missing / doesn't coerce.

- [ ] **Step 4: Implement**

In `src/utils/save.ts`:
- Add `cursedVictoriesCompleted: number` to the save interface alongside existing counters
- Add `cursedVictoriesCompleted: 0` to the default-save factory
- In the coerce function: `cursedVictoriesCompleted: toNumber(obj.cursedVictoriesCompleted, 0)`
- After coerce, if `obj.cursedVictoriesCompleted` was absent (use `!('cursedVictoriesCompleted' in obj)` check) AND a `runHistory` array exists, seed retroactively:
  ```typescript
  if (!('cursedVictoriesCompleted' in raw) && Array.isArray(raw.runHistory)) {
    result.cursedVictoriesCompleted = raw.runHistory.filter(
      (r: unknown): r is { mode: string; curseKey: string | null } =>
        typeof r === 'object' && r !== null && 'mode' in r && 'curseKey' in r,
    ).filter((r) => r.mode === 'victory' && r.curseKey != null).length;
  }
  ```

Wrap the seed logic in try/catch — corrupt runHistory shouldn't break load.

- [ ] **Step 5: Run tests pass**

Run: `npx vitest run src/utils/save.test.ts`
Expected: PASS.

- [ ] **Step 6: Run full CI**

Run: `npx vitest run`
Expected: no regressions.

- [ ] **Step 7: Commit**

```bash
git add src/utils/save.ts src/utils/save.test.ts
git commit -m "feat(save): cursedVictoriesCompleted counter with retroactive seed"
```

---

## Task 2: Cailleach kilt palette + accessory visuals

**Files:**
- Modify: `src/art/kiltPalette.ts`

- [ ] **Step 1: Read existing kilt palette shape**

```bash
grep -n "KILT_PALETTES\|KiltPalette\b\|cailleach" src/art/kiltPalette.ts
```

Note the `KiltPalette` type (likely `{ field, fieldDark, stripe, accent }` or similar) and how other entries look.

- [ ] **Step 2: Add cailleach entry**

In `KILT_PALETTES`, add:

```typescript
  cailleach: {
    field: 0x2a4a2a,        // moss green
    fieldDark: 0x1a2f1a,    // deeper moss shadow
    stripe: 0x8a2828,       // rowan-berry red
    accent: 0xd4d0c0,       // silver-white crone edge
  },
```

Match whatever keys the `KiltPalette` interface requires. If there are extra fields (e.g. `highlight`), fill them with values that harmonise — deep teal-green for highlight, dark moss for shadow.

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: PASS — type check confirms all KiltPalette fields populated.

- [ ] **Step 4: Commit**

```bash
git add src/art/kiltPalette.ts
git commit -m "feat(art): Cailleach kilt palette — moss + rowan + silver"
```

---

## Task 3: Cailleach variant def + unlock condition

**Files:**
- Modify: `src/data/variants.ts`
- Modify: `src/data/variants.test.ts`
- Modify: `src/data/variantWireUp.test.ts`

- [ ] **Step 1: Add `cursed_victories` to the unlock union**

In `src/data/variants.ts`, extend `VariantUnlockCondition`:

```typescript
export type VariantUnlockCondition =
  | { type: 'default' }
  | { type: 'best_time'; required: number }
  | { type: 'best_kills'; required: number }
  | { type: 'total_gold_earned'; required: number }
  | { type: 'victories'; required: number }
  | { type: 'cursed_victories'; required: number };
```

- [ ] **Step 2: Extend `VariantKey` and `HaggisAccentStyle`**

```typescript
export type VariantKey = 'classic' | 'moor_runner' | 'iron_belly' | 'glen_forager' | 'surefoot' | 'pipe_breath' | 'laird' | 'wee_ghostie' | 'glaswegian' | 'cailleach';

export type HaggisAccentStyle = 'none' | 'racing_band' | 'iron_belly' | 'forager' | 'surefoot' | 'pipe_breath' | 'laird' | 'wee_ghostie' | 'cailleach';
```

- [ ] **Step 3: Add the Cailleach VariantDef entry**

Append to `VARIANTS` after the last existing entry (likely `glaswegian`):

```typescript
  {
    key: 'cailleach',
    nameKey: 'variant.cailleach.name',
    flavorKey: 'variant.cailleach.flavor',
    textureKey: 'haggis_cailleach',
    modifiers: {
      moveSpeedPct: -15,
      maxHpFlat: 10,
      pickupRadiusFlat: 35,
      // crit chance handled via damage/crit modifier if present; if VariantModifier
      // has no crit field, omit — Cailleach's +8% crit ships as a follow-up when
      // the stat surface exists. Variants without a crit modifier: document and skip.
    },
    unlock: { type: 'cursed_victories', required: 3 },
    appearance: {
      accentStyle: 'cailleach',
      palette: {
        outline: 0x0f1a12,
        bodyDark: 0x2a3d2e,
        bodyLight: 0x3a4f3a,   // deep forest teal
        fur: 0x4a5f4a,
        snout: 0x2a3d2e,
        accent: 0xd4d0c0,      // silver-white
      },
    },
  },
```

**NOTE on crit chance**: If `VariantModifier` has no crit field today, SKIP the +8% crit. Document the gap in the commit message. Shipping 4 of 5 stat deltas is preferable to inventing a new modifier field this session.

- [ ] **Step 4: Bump variantWireUp.test.ts roster count**

Open `src/data/variantWireUp.test.ts`. Find the assertion that checks total variant count (likely `expect(VARIANTS.length).toBe(9)` or `VARIANTS).toHaveLength(9)`). Change to 10.

- [ ] **Step 5: Add variant-specific tests**

Append to `src/data/variants.test.ts`:

```typescript
describe('cailleach variant', () => {
  const v = VARIANTS.find((x) => x.key === 'cailleach');

  it('is present in the catalogue', () => {
    expect(v).toBeDefined();
  });

  it('has the mythic-elder stat profile', () => {
    expect(v?.modifiers.moveSpeedPct).toBe(-15);
    expect(v?.modifiers.maxHpFlat).toBe(10);
    expect(v?.modifiers.pickupRadiusFlat).toBe(35);
  });

  it('unlocks on 3 cursed victories', () => {
    expect(v?.unlock).toEqual({ type: 'cursed_victories', required: 3 });
  });

  it('uses the cailleach accent style', () => {
    expect(v?.appearance.accentStyle).toBe('cailleach');
  });
});
```

- [ ] **Step 6: Run build and tests**

Run: `npm run build && npx vitest run src/data/`
Expected: PASS — types resolve, roster count matches, cailleach entry shaped correctly.

NOTE: the `variantWireUp.test.ts` fence may flag the new variant for missing i18n / sprite keys. That's expected — those land in Tasks 4–7. If tests fail, re-run after each of those tasks.

Tasks should commit independently even if variantWireUp is red mid-chain — the fence will go green at T7. Don't block Task 3 commit on T7.

- [ ] **Step 7: Commit**

```bash
git add src/data/variants.ts src/data/variants.test.ts src/data/variantWireUp.test.ts
git commit -m "feat(variant): Cailleach mythic-elder def + cursed_victories unlock

Stat deltas: -15% speed, +10 HP, +35% pickup radius. +8% crit
deferred until VariantModifier grows a crit field."
```

---

## Task 4: Cailleach unlock condition resolver

**Files:**
- Modify: `src/data/variants.ts` (unlock resolver function)
- Or: wherever `VariantUnlockCondition` is consumed

- [ ] **Step 1: Find the unlock resolver**

```bash
grep -rn "type === 'victories'\|type === 'best_time'\|type === 'best_kills'" src/
```

There's likely a function that takes a `VariantUnlockCondition` + `VariantProgressSnapshot` and returns a `VariantUnlockProgress` for UI. Find it.

- [ ] **Step 2: Add the `cursed_victories` case**

In that resolver's switch / match, add:

```typescript
case 'cursed_victories': {
  const current = progress.cursedVictoriesCompleted ?? 0;
  return {
    label: t('variant.unlock.cursed_victories'),
    current,
    required: condition.required,
    currentText: String(current),
    requiredText: String(condition.required),
    ratio: Math.min(1, current / condition.required),
  };
}
```

The `progress` argument is whatever `VariantProgressSnapshot` is — confirm it has `cursedVictoriesCompleted`. If not, extend `VariantProgressSnapshot` to include it:

```typescript
export interface VariantProgressSnapshot {
  bestTime: number;
  bestKills: number;
  totalGoldEarned: number;
  victories: number;
  cursedVictoriesCompleted: number;  // NEW
  unlockedVariants?: readonly VariantKey[];
}
```

- [ ] **Step 3: Update the snapshot builder**

Find where `VariantProgressSnapshot` is constructed from `SaveData`. Add the new field:

```typescript
cursedVictoriesCompleted: save.cursedVictoriesCompleted ?? 0,
```

- [ ] **Step 4: Add the i18n key**

Add to `src/core/i18n.ts`:
```typescript
'variant.unlock.cursed_victories': 'Cursed victories',
```

(This is a short UI label — the compact form users see in the variant picker. The rest of banter + flavor ships in Task 6.)

Add SCS mirror to `src/core/i18n.scs.ts`:
```typescript
'variant.unlock.cursed_victories': 'Cursed wins',
```

- [ ] **Step 5: Run build + tests**

Run: `npm run build && npx vitest run`
Expected: PASS (or variantWireUp still red until Task 6 i18n fills).

- [ ] **Step 6: Commit**

```bash
git add src/data/variants.ts src/core/i18n.ts src/core/i18n.scs.ts
git commit -m "feat(variant): cursed_victories unlock resolver + progress snapshot"
```

---

## Task 5: Cailleach sprite + accessory

**Files:**
- Modify: `src/scenes/BootScene.ts` (or wherever the haggis atlas is baked)
- Modify: `src/entities/haggisComposition/AccessoryDrawer.ts` (or an accessory-atlas drawer)
- Modify: `src/art/sprites/entities/haggis.ts` (or whatever the haggis sprite drawer is)

- [ ] **Step 1: Find existing variant sprite pattern**

```bash
grep -rn "glaswegian\b" src/art/sprites/ src/entities/ | head -20
```

Glaswegian was the 9th variant shipped — its approach is the clearest template. Note:
- How a new accent style is drawn (accessory drawer + atlas bake)
- Where `textureKey: 'haggis_glaswegian'` gets baked
- What sprite composition layers change (kilt, body, accent)

- [ ] **Step 2: Add Cailleach sprite to the atlas bake**

In `BootScene.ts` (or wherever haggis variants are baked), add a new call for Cailleach matching the existing Glaswegian pattern. Cailleach uses:
- Body palette: `bodyDark=0x2a3d2e, bodyLight=0x3a4f3a, fur=0x4a5f4a, snout=0x2a3d2e, accent=0xd4d0c0`
- Accent style: `'cailleach'` — silver crone-hair tuft at crown + small rowan-red pip near the ear

- [ ] **Step 3: Implement the 'cailleach' accent drawing**

In the accessory drawer (find where `accentStyle === 'laird'` etc. is handled), add a case for `cailleach`:

```typescript
case 'cailleach': {
  // Silver crone-hair tuft — wispy top-of-head accent
  g.fillStyle(0xd4d0c0, 0.9);
  g.fillEllipse(cx, cy - 14, 6, 3);
  g.fillEllipse(cx - 3, cy - 15, 2, 2);
  g.fillEllipse(cx + 3, cy - 15, 2, 2);

  // Rowan-berry pip at the right temple (unlock reminder)
  g.fillStyle(0x8a2828, 1);
  g.fillCircle(cx + 6, cy - 10, 1.2);
  break;
}
```

Adapt the coordinates to match whatever the existing accent drawer uses as the head origin. The pattern for Laird / Wee Ghostie accents is the reference.

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: PASS — sprite bakes cleanly, no type errors.

- [ ] **Step 5: Commit**

```bash
git add -A src/scenes/BootScene.ts src/entities/haggisComposition/ src/art/sprites/
git commit -m "feat(art): Cailleach haggis sprite — mythic teal + silver + rowan"
```

Use `-A` with filtered paths; if the commit picks up unrelated files, narrow further.

---

## Task 6: Cailleach EN banter — AUTHORED CONTENT

**Files:**
- Modify: `src/core/i18n.ts`

**IMPORTANT — this task authors the voice.** Don't fill with placeholder text. Use the guidance below.

### Voice register guide

From memory (`feedback_voice_register`, confirmed 2026-04-12):
- **Baseline voice**: Still Game warmth — Jack & Victor pub tone, affectionate, self-deprecating
- **Sharp edge**: Limmy deadpan — short, dry, weird, trust the player to get it
- **Never** explain the joke. Footnote = wrong joke for the spot.
- **Cultural nods**: woven naturally; Glesga punter grins, everyone else still enjoys it

**Cailleach's specific voice** (per spec §2):
- Gaelic-inflected English — weave occasional Gaelic words, always pair with context so non-speakers aren't lost
- Stern-but-fond rebukes
- Dark humour about death, weather, the long view
- Soft wisdom at decision points
- Sharper when wounded (Limmy lean)
- Never cheap jokes; always earned

### Sub-pools (4 keys each, 24 total)

- [ ] **Step 1: Add the 24 EN keys**

In `src/core/i18n.ts`, in the `ui.banter.cailleach` namespace (create the path if absent, matching how Glaswegian is structured):

```typescript
'ui.banter.cailleach.run_start.0': "Aye, the moor kens me. Let's see if it kens you.",
'ui.banter.cailleach.run_start.1': "Hud yer whisht — we've walkin' tae dae.",
'ui.banter.cailleach.run_start.2': "The wind's carryin' a cold word the day.",
'ui.banter.cailleach.run_start.3': "Three winters I watched this glen. One more willnae hurt.",

'ui.banter.cailleach.combat_win.0': "Poor wee sowel. Didnae see ma comin'.",
'ui.banter.cailleach.combat_win.1': "That's a lesson fer ye.",
'ui.banter.cailleach.combat_win.2': "Meath agus gràin — meat and loathing.",
'ui.banter.cailleach.combat_win.3': "The moor takes whit it's owed.",

'ui.banter.cailleach.combat_hurt.0': "Haud yer haund, ye clatty wee besom.",
'ui.banter.cailleach.combat_hurt.1': "I've been colder.",
'ui.banter.cailleach.combat_hurt.2': "Damn right I felt that.",
'ui.banter.cailleach.combat_hurt.3': "Ah'll remember this wan.",

'ui.banter.cailleach.boss_warn.0': "Somethin' auld's comin'. Somethin' bigger than me.",
'ui.banter.cailleach.boss_warn.1': "Mind yer feet. The earth shakes fer a reason.",
'ui.banter.cailleach.boss_warn.2': "Cha b' e seo mo chiad turas — this isnae ma first rodeo.",
'ui.banter.cailleach.boss_warn.3': "Right. Gloves aff.",

'ui.banter.cailleach.victory.0': "Another season. Another tale.",
'ui.banter.cailleach.victory.1': "The Bheinn Mhòr remembers ye now, wee wan.",
'ui.banter.cailleach.victory.2': "Aye — that'll dae.",
'ui.banter.cailleach.victory.3': "Warm yer feet. Ye've earned it.",

'ui.banter.cailleach.death.0': "Och, pet. Rest noo.",
'ui.banter.cailleach.death.1': "Every hag kens the long walk. Yours started the day ye drew breath.",
'ui.banter.cailleach.death.2': "Ye ran a fine run.",
'ui.banter.cailleach.death.3': "The glen'll hold ye. Come back when the snow lifts.",
```

Also add Cailleach's display strings:

```typescript
'variant.cailleach.name': 'Cailleach Haggis',
'variant.cailleach.flavor': 'Mythic elder. Slow, wise, rich in years. Unlock: 3 cursed victories.',
'ach_cailleach_unlock.name': 'Walked Through the Veil',
'ach_cailleach_unlock.desc': 'Finish three cursed runs alive.',
```

- [ ] **Step 2: Verify placement**

Read `src/core/i18n.ts` after editing — the Cailleach keys should slot alongside Glaswegian's keys for visual parity. If the existing file uses nested objects instead of flat dot-paths, nest accordingly — the tree shape is authoritative.

- [ ] **Step 3: Run build + tests**

Run: `npm run build`
Expected: PASS (parity fence will fail without Task 7 SCS — that's expected; commit this and land SCS in Task 7).

- [ ] **Step 4: Commit**

```bash
git add src/core/i18n.ts
git commit -m "feat(i18n): Cailleach EN banter + display strings — Still Game warmth + Limmy edge"
```

---

## Task 7: Cailleach SCS banter — parity with EN

**Files:**
- Modify: `src/core/i18n.scs.ts`

Scots overlay for every key added in Task 6. Authoring goal: equivalent voice in Scots register, not literal translation.

- [ ] **Step 1: Add the 24 SCS keys**

```typescript
'ui.banter.cailleach.run_start.0': "Aye, the muir kens me. Lat's see gin it kens ye.",
'ui.banter.cailleach.run_start.1': "Haud yer tongue — we've walkin tae dae.",
'ui.banter.cailleach.run_start.2': "The wun's cairryin a cauld word the day.",
'ui.banter.cailleach.run_start.3': "Three winters A watched this glen. Ane mair winnae hurt.",

'ui.banter.cailleach.combat_win.0': "Peer wee sowel. Didnae see ma comin.",
'ui.banter.cailleach.combat_win.1': "That's a lesson fer ye.",
'ui.banter.cailleach.combat_win.2': "Meath agus gràin — flesh an fashion.",
'ui.banter.cailleach.combat_win.3': "The muir taks whit it's owed.",

'ui.banter.cailleach.combat_hurt.0': "Haud yer haund, ye clatty wee besom.",
'ui.banter.cailleach.combat_hurt.1': "A've been cauder.",
'ui.banter.cailleach.combat_hurt.2': "Damn richt A felt that.",
'ui.banter.cailleach.combat_hurt.3': "A'll mind this wan.",

'ui.banter.cailleach.boss_warn.0': "Somethin auld's comin. Somethin bigger than me.",
'ui.banter.cailleach.boss_warn.1': "Mind yer feet. The yird shogs fer a raison.",
'ui.banter.cailleach.boss_warn.2': "Cha b' e seo mo chiad turas — this isnae ma first rodeo.",
'ui.banter.cailleach.boss_warn.3': "Richt. Mittens aff.",

'ui.banter.cailleach.victory.0': "Anither saison. Anither tale.",
'ui.banter.cailleach.victory.1': "The Bheinn Mhòr minds ye nou, wee wan.",
'ui.banter.cailleach.victory.2': "Aye — that'll dae.",
'ui.banter.cailleach.victory.3': "Warm yer feet. Ye've earnt it.",

'ui.banter.cailleach.death.0': "Och, pet. Rest nou.",
'ui.banter.cailleach.death.1': "Ilka cailleach kens the lang walk. Yours stairtit the day ye drew braith.",
'ui.banter.cailleach.death.2': "Ye ran a braw run.",
'ui.banter.cailleach.death.3': "The glen'll haud ye. Come back when the snaw lifts.",

'variant.cailleach.name': 'Cailleach Haggis',
'variant.cailleach.flavor': 'Michty elder. Slaw, wyce, rich in years. Unlock: 3 cursed wins.',
'ach_cailleach_unlock.name': 'Walked Through the Veil',
'ach_cailleach_unlock.desc': 'Win three cursed runs.',
```

- [ ] **Step 2: Run parity test**

Run: `npx vitest run src/core/i18n.locale.test.ts`
Expected: PASS — EN ↔ SCS balanced for all new keys.

- [ ] **Step 3: Run full CI**

Run: `npm run ci`
Expected: PASS — lint + all vitest + build. variantWireUp should now be green.

- [ ] **Step 4: Commit**

```bash
git add src/core/i18n.scs.ts
git commit -m "feat(i18n): Cailleach SCS banter parity — Scots register mirror"
```

---

## Task 8: Achievement deed + unlock grant + kill-criterion verification

**Files:**
- Modify: `src/data/achievements.ts` (or wherever deeds are defined)
- Modify: whatever increments `cursedVictoriesCompleted` on victory (likely a RunLifecycle / victory hook)
- Modify: `docs/superpowers/specs/2026-04-22-variant-cailleach-design.md` (append verification)

- [ ] **Step 1: Find the victory path**

```bash
grep -rn "ach_.*_unlock\|VICTORY\|runHistory.push\|mode:.*'victory'" src/scenes/game src/systems | head -20
```

Find where victory is finalised (RunLifecycle.handleVictory or similar). This is where `cursedVictoriesCompleted` should be incremented and the deed granted.

- [ ] **Step 2: Add the deed**

In `src/data/achievements.ts` (or equivalent), add `ach_cailleach_unlock` following the shape of existing deeds (e.g. `ach_ceilidh_commander`). i18n keys `ach_cailleach_unlock.name` / `.desc` are ready from Task 6/7.

- [ ] **Step 3: Wire the grant**

In the victory path: if the run's `curseKey` is non-null, increment `save.cursedVictoriesCompleted`. If the new count >= 3, grant `ach_cailleach_unlock` via the existing AchievementManager.

- [ ] **Step 4: Full CI**

Run: `npm run ci:all`
Expected: PASS — lint + 2920+ vitest + build + e2e.

- [ ] **Step 5: Manual smoke**

Run: `npm run dev`. In the variant picker, Cailleach should:
- Appear last in the list
- Show locked with "0/3 Cursed victories" progress
- Display the mythic-elder sprite (teal + silver + rowan)

In the dev console:
```javascript
// Fake 3 cursed victories to verify unlock UX
save = JSON.parse(localStorage.whs_save); save.cursedVictoriesCompleted = 3; localStorage.whs_save = JSON.stringify(save); location.reload();
```

Cailleach should now be selectable. Start a run — flavor blurb + first run_start banter should fire.

- [ ] **Step 6: Append kill-criterion section to spec**

Edit `docs/superpowers/specs/2026-04-22-variant-cailleach-design.md`. Append:

```markdown

---

## Verification (post-ship, 2026-04-22)

- **Bundle delta** over prior baseline: **<DELTA> KiB** gzip.
- **variantWireUp.test.ts**: ✅ 10-variant roster.
- **i18n parity**: ✅ 24 EN + 24 SCS banter keys + variant display + deed name/desc mirrored.
- **Full CI** (`npm run ci:all`): ✅ lint + vitest + build + e2e.
- **Unlock retroactive seed**: ✅ players with past cursed victories get the counter seeded at load.
- **Manual variant picker smoke**: ✅ Cailleach appears with lock state + correct progress label.
- **Deferred** — +8% crit stat delta. `VariantModifier` has no crit field today; shipped without. Follow-up ticket when stat surface grows.
```

- [ ] **Step 7: Commit**

```bash
git add docs/superpowers/specs/2026-04-22-variant-cailleach-design.md src/data/achievements.ts src/scenes/game/RunLifecycle.ts
git commit -m "feat(variant): Cailleach deed unlock + grant path — roster complete at 10"
```

Match actual paths touched.

---

## Summary

**8 tasks.** Total expected duration: 60-90 min agent time.

- Tasks 1–4: mechanical (save field, palette, variant def, unlock resolver)
- Tasks 5: sprite integration
- Tasks 6–7: authored banter content (highest quality-sensitivity)
- Task 8: achievement wiring + kill-criterion verify

Each task commits independently. Failure at any task reverts only that commit; roster stays at 9 if Task 3 never ships.

No new mechanic, no rig, no biome. Just identity.
