# Art & Music Continuity Polish — Design Spec

**Date**: 2026-04-21
**Branch**: `art-music-polish-pass`
**Goal**: Every visual and audio element feels handcrafted, intentional, and continuous across the entire game. Zero orphan styles, zero tonal clashes, zero "different designer per page" moments.

---

## Architecture: Palette-First DAG

```
Layer 0: Palette Consolidation ─── THE BOTTLENECK
    ├── Layer 1a: Tartan System Unification
    ├── Layer 1b: UI Component Factories
    ├── Layer 1c: VFX Palette + Timing Standards
    └── Layer 1d: Audio Frequency Corrections
Layer 2: Scene Consumer Migration ─── depends on 1a + 1b + 1c
Layer 3: Integration Feel Pass ─── holistic testing
```

Layers 1a–1d are independent of each other and can be worked in parallel. Layer 2 consumes all of them. Layer 3 is the final "play it and feel it" pass.

---

## Layer 0: Palette Consolidation

### Problem

60+ inline hex colors across scene files. 15+ gray variants, 4+ gold variants, undocumented mauve family. Existing `COLORS` / `COLORS_CSS` in config.ts cover core UI but miss text/label colors used in Chronicle, GameOver, PauseMenu, MenuFooter, CurseScene, BootScene.

### Solution

Extend `COLORS_CSS` with semantic text color families. Every inline hex string in scene files replaced with a named constant.

#### New Text Color Constants (added to COLORS_CSS)

**Gray family** (cool-blue grays used for body text, labels, hints):

| Constant | Hex | Replaces | Semantic Use |
|----------|-----|----------|-------------|
| `TEXT_BRIGHT` | `#e4e9f0` | `#e4e9f0`, `#cdd4e0` | Brightest body text, bold titles |
| `TEXT_PRIMARY` | `#c4cdd8` | `#c4cdd8`, `#c4dcff` | Standard body text |
| `TEXT_SECONDARY` | `#9ea8bb` | `#9ea8bb`, `#9fb0cf`, `#a8b0c0` | Secondary labels |
| `TEXT_MUTED` | `#8a93a8` | `#8a93a8`, `#8a9ab8`, `#8097c2` | De-emphasized info |
| `TEXT_SUBTITLE` | `#7f8ca7` | `#7f8ca7`, `#7a8a98` | Italic subtitles, scene context |
| `TEXT_DIM` | `#596780` | `#596780`, `#556280` | Footer text, fine print |

Note: Existing `HINT` (`#6a7390`), `COOL_GREY` (`#c8d0e0`), `WARM_TAN` (`#e8d4a0`), `DUSTY_TAN` (`#b8a88a`) remain unchanged.

**Gold family** (extend existing WHISKY_GOLD + TOAST_GOLD):

| Constant | Hex | Replaces | Semantic Use |
|----------|-----|----------|-------------|
| `CRIT_GOLD` | `#ffdd44` | `#ffdd44` in damageNumberStyle, evolution VFX, boss death | Brightest gold — crits, legendary moments |
| `COMBO_AMBER` | `#e8a830` | `#e8a830` in comboDisplay | Warm amber — combo 20+ tier |
| `REWARD_GOLD` | `#ffcc44` | `#ffcc44` in toasts, boss ring secondary | Reward/pickup gold |

**Mauve family** (curse/death theme):

| Constant | Hex | Replaces | Semantic Use |
|----------|-----|----------|-------------|
| `CURSE_MAUVE` | `#c8a0a0` | `#c8a0a0` in GameOver, Chronicle | Curse text, death banners |
| `CURSE_MAUVE_BRIGHT` | `#e8a0c6` | `#e8a0c6` in GameOver, CurseScene | Curse emphasis |

**Green family**:

| Constant | Hex | Replaces | Semantic Use |
|----------|-----|----------|-------------|
| `POSITIVE_GREEN` | `#44dd44` | `#44dd44` in toasts, weapon acquire | Acquisition, heal |
| `VICTORY_GREEN` | `#77c977` | `#77c977`, `#73c37d` | Victory text, unlocks |

**Warm accent**:

| Constant | Hex | Replaces | Semantic Use |
|----------|-----|----------|-------------|
| `LABEL_TAN` | `#b69643` | `#b69643`, `#dcc38a` | Warm labels in GameOver |
| `STATUS_TAN` | `#8a7a6a` | `#8a7a6a` in PauseMenu, BootScene | Status/copyright text |

#### Numeric COLORS (hex int) additions

| Constant | Value | Replaces | Use |
|----------|-------|----------|-----|
| `CRIT_GOLD` | `0xffdd44` | Inline `0xffdd44` in JuiceSystem, VFX | Bright gold for particles/rings |
| `REWARD_GOLD` | `0xffcc44` | Inline `0xffcc44` in boss death, toasts | Reward particle color |
| `POSITIVE_GREEN` | `0x44dd44` | Inline `0x44dd44` in pickups, weapon acquire | Green effects |
| `COMBO_AMBER` | `0xe8a830` | Inline `0xe8a830` | Combo warm tier |

#### Enforcement

- Extend existing `colorsCss.test.ts` to validate new CSS↔hex pairs
- Add lint rule or test: no raw hex string literals (`/#[0-9a-f]{6}/i`) in `src/scenes/` files — must import from `COLORS_CSS`
- No raw hex int literals (`/0x[0-9a-f]{6}/i`) in `src/systems/` files for colors already in `COLORS` — must import

#### Migration Map

Every scene file with inline colors gets migrated:
- `ChronicleScene.ts` — ~12 inline colors → named constants
- `GameOverScene.ts` — ~10 inline colors → named constants
- `PauseMenu.ts` — ~3 inline colors → named constants
- `MenuScene.ts` — ~2 inline colors → named constants
- `CurseScene.ts` — ~2 inline colors → named constants
- `BootScene.ts` — ~1 inline color → named constant
- `menuFooterPalette.ts` — ~5 inline colors → named constants
- `gameOverPanelTheme.ts` — ~2 inline colors → named constants
- `gameOverVariantChip.ts` — ~2 inline colors → named constants
- `comboDisplay.ts` — ~2 inline colors → named constants
- `damageNumberStyle.ts` — ~2 inline colors → named constants
- `installRunIntroFx.ts` — ~1 inline color → named constant

---

## Layer 1a: Tartan System Unification

### Problem

Three separate tartan systems with zero shared code:
1. **Player kilts** — variant-aware via `resolveKiltPalette(variantKey)` returning `KiltPalette { field, fieldDark, stripe, accent }`
2. **Enemy tartans** — hardcoded per-enemy (angryScotsman, piper, tourist, ghost, ceilidhCaller, edinburghGhostGuide) using independent hex values
3. **Card tartan sash** — hardcoded generic Royal Stewart in `cards.ts`

Enemy tartans are louder (more saturated) than player kilts. No shared palette.

### Design Decision: Two Tartan Families

**Player Tartan** — variant-specific identity. Already works via `resolveKiltPalette()`. No change needed except ensuring the upgrade card kilt icon always uses the active variant (already does via `ucard_kilt_<key>`).

**Highland Tartan** — one shared generic Scottish palette for all enemies and the tartan sash card. Based on Royal Stewart but tuned to sit *below* player kilt saturation in visual hierarchy.

#### New: `HIGHLAND_TARTAN` constant in `kiltPalette.ts`

```typescript
export const HIGHLAND_TARTAN: KiltPalette = {
  field: 0xa83030,     // muted Stewart red (less saturated than angryScotsman's 0xcc2222)
  fieldDark: 0x6b1a1a, // shadow
  stripe: 0x1a4422,    // dark forest green
  accent: 0xd4a017,    // whisky gold (ties to game's primary accent)
};
```

Design rationale:
- `field` at `0xa83030` reads as "Scottish red" but sits below player kilt saturation — player's tartan always pops more
- `accent` uses `WHISKY_GOLD` (`0xd4a017`) — ties enemy tartans into the game's gold accent language
- Green stripe matches existing forest-green usage in classic variant kilt

#### Enemy Migration

All 6 enemy sprites with hardcoded tartans switch to `HIGHLAND_TARTAN`:

| Enemy | Current | After |
|-------|---------|-------|
| angryScotsman | `0xcc2222` field, `0x114411` green, `0x2244aa` blue | `HIGHLAND_TARTAN.field`, `.stripe`, `.accent` |
| piper | `0x003366` navy, `0x004488` stripe | `HIGHLAND_TARTAN` (kilt section only) |
| tourist | Hardcoded red+green bucket hat | `HIGHLAND_TARTAN` for tartan elements |
| ghost | `0x6a1818` red, `0x2a0a0a` black, `0xdaaa40` gold | `HIGHLAND_TARTAN` for tartan bleed |
| ceilidhCaller | Hardcoded red+green sash | `HIGHLAND_TARTAN` for sash |
| edinburghGhostGuide | Hardcoded red band on hat | `HIGHLAND_TARTAN.field` for band |

#### Card Tartan Sash Migration

`ucard_tartan_sash` in `cards.ts` switches from hardcoded Royal Stewart to `HIGHLAND_TARTAN`.

#### Visual Hierarchy (Intentional)

```
Player kilt:   variant-specific, highest saturation → YOUR identity
Enemy tartans: HIGHLAND_TARTAN, moderate saturation → "Scottish opponent"
World decor:   No tartans (rocks, thistles are natural palette)
```

Player can always tell "that's MY tartan" vs "that's an enemy."

---

## Layer 1b: UI Component Factories

### Problem

- `ActIntermissionScene` uses zero factory buttons — fully ad-hoc rectangles with manual hover
- Toggle component differs between MenuScene (text-only click) and SettingsScene (draggable slider)
- Pagination (Chronicle, MetaShop) is unstyled text with no hover feedback
- Disabled buttons (Shop, MetaShop) look identical to enabled — `disableInteractive()` with no visual change
- No panel/overlay factory — each scene creates its own stroke/fill patterns

### Solution

Extend existing `gameButton.ts` + add 3 new micro-factories. Keep them small — one file each, no abstraction beyond what's needed.

#### 1b-i: Extend `createGameButton` — Disabled State

Add optional `disabled?: boolean` to `GameButtonOpts`. When true:
- `rect` fill → desaturated (lerp toward `0x333340`, 50%)
- `rect` alpha → 0.6
- `label` alpha → 0.5
- `disableInteractive()` called automatically
- Hover effects suppressed

Add `setGameButtonDisabled(btn, disabled: boolean)` helper for runtime toggle (Shop buy buttons change state when gold changes).

#### 1b-ii: New `createGameToggle` factory (`src/ui/gameToggle.ts`)

Unified toggle for both MenuScene and SettingsScene. Replaces ad-hoc text toggles and custom slider toggles.

```typescript
interface GameToggleOpts {
  x: number;
  y: number;
  width: number;
  label: string;
  initialValue: boolean;
  onChange: (value: boolean) => void;
  uiScale?: number;
}
```

Visual design:
- Track: rounded rect (`COLORS.PANEL_SURFACE` off, `COLORS.SCOTTISH_BLUE` on)
- Thumb: small circle (white) that slides left/right
- Label: `textStyle('label')` positioned left of track
- Click toggles state, calls `onChange`
- Hover: track brightens slightly (same `attachButtonHoverFill` pattern)

This replaces:
- MenuScene text toggles (lines ~520-553)
- SettingsScene custom slider toggles

SettingsScene **volume sliders** remain custom (they're continuous 0-1 ranges, not boolean toggles). Only the on/off toggles migrate.

#### 1b-iii: New `createPaginationNav` factory (`src/ui/gamePagination.ts`)

```typescript
interface GamePaginationOpts {
  scene: Phaser.Scene;
  x: number;
  y: number;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  uiScale?: number;
}
```

Visual: Two tertiary-tier mini-buttons (◀ / ▶) flanking a "Page X/Y" label. Uses `createGameButton` with tertiary tier internally. Consistent hover feedback.

Replaces bare `add.text('PREV')` / `add.text('NEXT')` in:
- ChronicleScene
- MetaShopScene

#### 1b-iv: ActIntermissionScene Route Cards → Factory

Not a new generic factory — route cards are unique enough to warrant their own file, but they should use `gameButton` tier colors and `attachButtonHoverFill` for consistency.

New file: `src/ui/routeCard.ts`

```typescript
interface RouteCardOpts {
  scene: Phaser.Scene;
  x: number; y: number;
  width: number; height: number;
  route: RouteDef;
  onSelect: () => void;
}
```

Internally uses:
- `COLORS.PANEL_SURFACE` for card background (matches all other panels)
- `resolveActIntermissionCardStyle()` for accent stroke (already exists, good)
- `attachButtonHoverFill()` for hover behavior (consistent with all buttons)
- `textStyle()` for all text (consistent with typography scale)

Replaces inline rectangle creation in ActIntermissionScene (~lines 96-118).

#### 1b-v: Panel Stroke Standardization

No new factory needed. Instead, define two panel stroke presets in `src/ui/panelStyle.ts`:

```typescript
export const PANEL_STROKE = {
  standard: { width: 2, color: 0x2a3450, alpha: 0.8 },
  accent:   { width: 2, color: COLORS.WHISKY_GOLD, alpha: 0.6 },
} as const;
```

All scenes importing panel stroke values switch to these presets. Covers:
- MenuScene top panel stroke
- ActIntermission card stroke
- CurseScene tile stroke
- SettingsScene back button stroke
- GameOverScene panel stroke

---

## Layer 1c: VFX Palette + Timing Standards

### Problem

- Toast colors fragmented: `#ffcc44`, `#ffdd44`, `#ffdd00`, `#ff8800` for similar events
- Ring expansion speeds vary without pattern (200ms to 1000ms)
- Pickup pulse rates differ with no rationale (600ms, 700ms, 800ms)
- Some effects skip a11y scaling (`scaledParticleCount` not used consistently)
- Easing inconsistency across similar effects

### Solution

#### 1c-i: Toast Color Standardization

New file: `src/ui/toastPalette.ts`

```typescript
export const TOAST_COLORS = {
  reward:    COLORS_CSS.REWARD_GOLD,    // #ffcc44 — gold pickups, milestone rewards
  legendary: COLORS_CSS.LEGENDARY,       // #ddaa00 — evolution, legendary card
  positive:  COLORS_CSS.POSITIVE_GREEN,  // #44dd44 — weapon acquire, heal
  info:      COLORS_CSS.COOL_GREY,       // #c8d0e0 — neutral status
  warning:   '#ff8844',                  // orange — curse, danger
} as const;
```

All toast calls migrate to use `TOAST_COLORS[category]` instead of inline hex.

#### 1c-ii: Effect Timing Presets

New file: `src/systems/effectTimingPresets.ts`

```typescript
export const RING_TIMING = {
  tight: 200,    // kill burst, small impacts
  medium: 400,   // weapon acquire, pickup collect
  grand: 700,    // boss death, evolution, level milestone
} as const;

export const FLASH_TIMING = {
  short: 100,    // triple elite chain
  medium: 200,   // level-up, white flash
  long: 400,     // boss death
  epic: 500,     // evolution spectacle
} as const;

export const PARTICLE_DURATION = {
  fast: { min: 250, max: 400 },    // kill burst
  medium: { min: 400, max: 600 },  // moor moment
  grand: { min: 800, max: 1400 },  // boss death, evolution
} as const;
```

JuiceSystem methods migrate to reference these presets. Not mandatory for every tween — just the repeated patterns that should feel unified.

#### 1c-iii: Pickup Pulse Unification

All pickup glows use the same base pulse: **scale 1.5, duration 700ms**. Currently:
- Treasure: 1.5, 800ms
- Golden: 1.6, 700ms
- Orb: 1.4, 600ms

Unified to: **1.5 scale, 700ms** for all three. The visual distinction comes from color and size, not pulse rate. Tiny pulse differences are imperceptible and add maintenance burden.

#### 1c-iv: A11y Scaling Audit

Ensure `scaledParticleCount()` is used for ALL particle effects, not just boss/evolution:
- Kill burst: currently hardcoded 3/6 → use `scaledParticleCount(3, 6)`
- Moor moment: currently hardcoded 5/11 → use `scaledParticleCount(5, 11)`
- Chest collect: currently hardcoded 12 → use `scaledParticleCount(6, 12)`

Ensure ALL screen flashes go through `scaledFlashAlpha()`. Audit every `flashWhite`, `flashRed`, `flashColored` call site.

---

## Layer 1d: Audio Frequency Corrections

### Problem

7 SFX use frequencies outside A Dorian mode (A-B-C-D-E-F#-G). The procedural music engine operates in A Dorian — off-key SFX create tonal friction.

### Corrections

All corrections keep the *emotional intent* of each SFX while aligning to A Dorian scale degrees.

#### 1. Level-Up Arpeggio (highest priority)

**Current**: C5 (523) → E5 (659) → G5 (784) = **C major triad** — foreign key
**Fix**: A4 (440) → C5 (523) → E5 (659) = **A minor triad** — diatonic to A Dorian, still feels triumphant as ascending minor

Rationale: A minor triad preserves the ascending arpeggio feel. C and E are both in A Dorian. The emotional lift comes from the ascending motion, not the major quality.

#### 2. Card Reveal

**Current**: G4 (392) → B4 (493.88) → D5 (587.33) = **G major triad** — B natural clashes
**Fix**: G4 (392) → A4 (440) → D5 (587.33) = **G-A-D** — all Dorian degrees, open fifth feel

Rationale: Replacing B4 with A4 keeps the ascending motion and adds the tonic note. G-A-D is a sus4 voicing of D — consonant, slightly mysterious (perfect for card reveal).

#### 3. Achievement

**Current**: C5 (523) + G5 (784) = **C-G fifth** — C is technically in Dorian but the fifth reads as C major
**Fix**: A4 (440) + E5 (659) = **A-E fifth** — the Dorian root fifth, unambiguous triumph

#### 4. Purchase Ding

**Current**: 660 → 990 Hz exponential ramp — E5 to B5, off-grid
**Fix**: 587 → 880 Hz exponential ramp — D5 to A5, perfect fourth in Dorian, same ascending energy

#### 5. Menu Click

**Current**: 700 Hz sine — unanchored between F5 and G5
**Fix**: 392 Hz (G4) sine — diatonic, warm, lower pitch matches menu's calm mood

#### 6. Elite Affix — Swift

**Current**: 520 → 1240 Hz sine — starts on C#5 (outside Dorian)
**Fix**: 440 → 880 Hz sine — A4 to A5 octave sweep, on-key shimmer

#### 7. Elite Affix — Volatile

**Current**: 420 → 70 Hz sawtooth — starts on G#3 (outside Dorian)
**Fix**: 440 → 55 Hz sawtooth — A3 to A1, on-key dark rumble, same menacing feel

### Scene Transition Audio

#### Menu → Game Crossfade

Currently: wind stops abruptly on shutdown, game music fades in independently.
Fix: Overlap by 800ms — wind begins fade-out (0.8s) while `musicEngine.start()` fades in (existing ~1.5s ramp). The 800ms overlap creates a smooth handoff instead of silence gap.

Implementation: In GameScene.create(), call `audio.startAmbientWindFadeOut(800)` before `musicEngine.start()`. New method on AudioSystem that starts the wind fade if it's currently playing (no-op if not).

#### Game → Shop Transition

Currently: music engine self-manages stop, shop drone starts independently.
Fix: `musicEngine.fadeOut(600)` called explicitly in GameScene shutdown when transitioning to Shop (not GameOver). Shop drone fade-in (existing 2s) overlaps with music tail. Net effect: harmonic handoff from A Dorian drone → D3 shop drone (D is in the Dorian scale — consonant transition).

#### Game → GameOver Transition

Currently: music engine not explicitly stopped — may linger.
Fix: `musicEngine.fadeOut(800)` called in the game-over trigger path. 800ms fade creates a "dying away" feel before the death screen loads. No ambient wind on GameOver (it's a stats screen, brief silence is appropriate).

#### Boss Arrival Sting Coordination

Currently: `playBossFanfare()` (piano) and `playBossWarning()` (sub-bass swell) fire independently with separate ducking.
Fix: Sequence them: warning swell (1.5s) → fanfare starts at swell peak. Single combined duck (0.6 strength) for the full 3s window. Implemented as `playBossArrival()` method that orchestrates both.

#### Intermission Ambient

Currently: ActIntermissionScene is silent.
Fix: Play ambient wind at half volume (0.04 instead of 0.08). The intermission is a brief choice screen — full silence feels like a bug, subtle wind provides continuity. Use existing `startAmbientWind()` with a volume parameter override.

---

## Layer 2: Scene Consumer Migration

With Layers 0 + 1a-1d complete, every scene gets a migration pass. This is mechanical — replacing inline values with named constants and ad-hoc components with factories.

### Per-Scene Migration Checklist

#### MenuScene
- [ ] Replace ~2 inline color strings with `COLORS_CSS.*`
- [ ] Replace text toggles with `createGameToggle()`
- [ ] Variant badge hover → use `attachButtonHoverFill` from existing system (already close)

#### MainMenuScene
- [ ] Verify all buttons use `createGameButton` (already mostly compliant)
- [ ] Daily Challenge / Meta Upgrades custom fill overrides → ensure they reference named colors

#### GameScene (HUD/overlays only)
- [ ] Damage number colors → reference `COLORS_CSS.CRIT_GOLD`, `COLORS.WHISKY_GOLD`, `COLORS_CSS.WARM_TAN`
- [ ] Combo display → reference `COLORS_CSS.COMBO_AMBER`

#### ShopScene
- [ ] Buy button disabled state → use `setGameButtonDisabled()`
- [ ] Inline toast colors → `TOAST_COLORS.reward`

#### MetaShopScene
- [ ] Buy button disabled state → use `setGameButtonDisabled()`
- [ ] Pagination → replace with `createPaginationNav()`

#### ActIntermissionScene
- [ ] Route cards → use `routeCard.ts` factory
- [ ] All text → verify `textStyle()` usage

#### GameOverScene
- [ ] Replace ~10 inline color strings with named constants
- [ ] Panel stroke → `PANEL_STROKE.standard`

#### ChronicleScene
- [ ] Replace ~12 inline color strings with named constants
- [ ] Pagination → replace with `createPaginationNav()`

#### SettingsScene
- [ ] Boolean toggles (SFX on/off, music on/off, etc.) → `createGameToggle()`
- [ ] Volume sliders remain custom (continuous range, not boolean)
- [ ] Back button stroke → `PANEL_STROKE.standard`

#### CurseScene
- [ ] Replace ~2 inline colors with named constants
- [ ] Tile stroke → `PANEL_STROKE.accent` (gold accent matches curse theme)

#### PauseMenu
- [ ] Replace ~3 inline colors with named constants

#### BootScene
- [ ] Replace copyright text color with `COLORS_CSS.STATUS_TAN`

#### Enemy Sprites (6 files)
- [ ] angryScotsman.ts → `HIGHLAND_TARTAN`
- [ ] piper.ts → `HIGHLAND_TARTAN`
- [ ] tourist.ts → `HIGHLAND_TARTAN`
- [ ] ghost.ts → `HIGHLAND_TARTAN`
- [ ] ceilidhCaller.ts → `HIGHLAND_TARTAN`
- [ ] edinburghGhostGuide.ts → `HIGHLAND_TARTAN`

#### Card Icons
- [ ] `ucard_tartan_sash` → `HIGHLAND_TARTAN`

#### JuiceSystem
- [ ] Toast calls → `TOAST_COLORS.*`
- [ ] Ring timings → `RING_TIMING.*`
- [ ] Flash timings → `FLASH_TIMING.*`
- [ ] Particle counts → `scaledParticleCount()` everywhere

#### AudioSystem
- [ ] 7 SFX frequency corrections (Layer 1d values)
- [ ] New `playBossArrival()` orchestration method
- [ ] New `startAmbientWindFadeOut(ms)` for crossfade support
- [ ] Ambient wind volume parameter for intermission half-volume

#### ProceduralMusicEngine
- [ ] Explicit `fadeOut(600)` wired into GameScene→Shop transition
- [ ] Explicit `fadeOut(800)` wired into game-over trigger

---

## Layer 3: Integration Feel Pass

After all code changes, a manual play-through testing:

### Visual Continuity Checklist
- [ ] Select each of 9 haggis variants → kilt tartan carries through: menu preview, in-game sprite, upgrade card icon
- [ ] All buttons across all scenes have consistent hover behavior (no ad-hoc hovers)
- [ ] Disabled shop buttons are visually distinct from enabled
- [ ] All text colors feel like they belong to one palette (no "wait, that gray is different")
- [ ] Enemy tartans read as "generic Highland" — less saturated than player kilt
- [ ] Panel strokes are uniform across overlays
- [ ] Pagination looks identical in Chronicle and MetaShop
- [ ] Toggles look identical in Menu and Settings

### Audio Continuity Checklist
- [ ] Menu → Game: smooth wind-to-music crossfade, no silence gap
- [ ] Level-up SFX feels consonant with background music (A minor triad)
- [ ] Card reveal feels consonant (G-A-D voicing)
- [ ] Purchase ding feels consonant (D5→A5 ramp)
- [ ] Menu click is warm, not piercing (G4 vs old 700Hz)
- [ ] Boss arrival: warning swell → fanfare sequence feels orchestrated, not competing
- [ ] Game → Shop: music fades smoothly into shop drone
- [ ] Game → GameOver: music fades to silence, no abrupt cut
- [ ] Intermission: subtle wind ambient, not dead silence
- [ ] Elite affix SFX (swift, volatile) don't clash with music

### Regression Checklist
- [ ] All existing tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] E2E smoke passes (`npm run test:e2e`)
- [ ] No visual regressions in: damage numbers, combo counter, boss HP bar, minimap, edge indicators
- [ ] Hit-freeze still works correctly
- [ ] Evolution spectacle still fires all 8 layers
- [ ] Moor moment burst still fires
- [ ] Accessibility: reduced particles, reduced motion, high contrast all still work

---

## Files Created/Modified Summary

### New Files (6)
- `src/ui/gameToggle.ts` — Boolean toggle factory
- `src/ui/gamePagination.ts` — Pagination nav factory
- `src/ui/routeCard.ts` — Intermission route card component
- `src/ui/panelStyle.ts` — Panel stroke presets
- `src/ui/toastPalette.ts` — Toast color categories
- `src/systems/effectTimingPresets.ts` — Ring/flash/particle timing presets

### Modified Files (~30)
- `src/config.ts` — New color constants
- `src/art/kiltPalette.ts` — `HIGHLAND_TARTAN` constant
- `src/ui/gameButton.ts` — Disabled state support
- `src/systems/JuiceSystem.ts` — Toast palette, timing presets, a11y scaling
- `src/systems/AudioSystem.ts` — 7 SFX frequency fixes, crossfade methods, boss arrival
- `src/systems/music/ProceduralMusicEngine.ts` — Explicit fadeOut wiring
- 6× enemy sprite files — `HIGHLAND_TARTAN` migration
- 1× card icon file — tartan sash migration
- ~12× scene files — Color constant + factory migrations
- `src/systems/comboDisplay.ts` — Named color constants
- `src/systems/damageNumberStyle.ts` — Named color constants

### Test Coverage
- Extend `colorsCss.test.ts` for new CSS↔hex pairs
- Add `gameToggle.test.ts` — factory returns expected structure
- Add `gamePagination.test.ts` — page bounds, callback firing
- Add `panelStyle.test.ts` — preset values match expected
- Add `toastPalette.test.ts` — all categories defined
- Existing `typography.test.ts` unchanged (no typography changes)

---

## Scope Boundaries — What This Does NOT Touch

- **Typography scale**: The 7-role scale (display/title/heading/body/label/small/subtitle) is solid. No changes.
- **Font family**: Monospace throughout. No changes.
- **Game balance**: No stat, timing, spawn, or difficulty changes.
- **Haggis body palettes**: The 9 variant body colors are intentional design. No changes.
- **Kilt-to-body color "mismatch"**: 6/9 variants have kilt colors that differ from body — this is intentional (tartan is clan identity, not body color). No changes.
- **Volume sliders in Settings**: Continuous 0-1 range controls stay custom. Only boolean toggles migrate.
- **Shop ambient loop mood coupling**: Out of scope — would require significant music engine refactor. The drone serves its purpose as is.
- **Biome-specific percussion**: Out of scope — interesting but not a continuity issue.
- **Phase 1 haggis atlas** (all variants animated): Out of scope — large rendering refactor.
