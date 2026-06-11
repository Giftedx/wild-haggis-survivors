# A1 M2 — Non-colour-alone signal census

> **Status:** Engineering census of every colour-coded UI / HUD signal
> in WHS, paired with the existing non-colour cue (shape, motion,
> typography, icon, position, audio caption). WCAG 1.4.1 (Use of
> Color, Level A) compliance check. Companion to
> `docs/A1_COLORBLIND_AUDIT.md`.
>
> Pass criterion: every gameplay-critical signal must carry meaning
> through at least one non-colour channel. Aesthetic colour is allowed
> to be colour-only.

## Method

Each signal classified as **GAMEPLAY-CRITICAL** (player needs it to
play meaningfully) or **AESTHETIC** (colour can stand alone). For
gameplay-critical signals, list the non-colour cue.

**Non-colour cue categories:**
- **SHAPE** — distinctive silhouette / icon / shape
- **MOTION** — animated cue (pulse, slide, magnetise)
- **TYPE** — typography (weight / size / case / italic)
- **TEXT** — explicit textual label
- **CAPTION** — A1 M4 caption emit
- **POSITION** — fixed UI position implies meaning
- **AUDIO** — distinct sound stinger
- **NONE** — colour-only ⚠️ (must be fixed or marked aesthetic)

## In-run HUD

| Signal | Class | Colour | Non-colour cue | Source | Notes |
|--------|-------|--------|----------------|--------|-------|
| HP bar fill (`Player`) | gameplay-critical | green→yellow→red gradient | **MOTION** (fill-width drops with HP); **POSITION** (top-left fixed) | `src/ui/HudHpBar.ts` | Width is primary; gradient is reinforcement. Pass. |
| Player low-HP heartbeat pulse | gameplay-critical | red vignette | **MOTION** (pulse rate scales with HP fraction); **AUDIO** (heartbeat onset); **CAPTION** (`low_hp` "HP dangerously low — heartbeat thunders.") | `JuiceSystem.update` + `GameTickers.lowHp` | Triple-cue. Pass. |
| XP bar fill | gameplay-critical | cyan → bright cyan on near-cap | **MOTION** (fill-width); **POSITION** (under HP bar fixed) | `src/ui/HudXpBar.ts` | Fill width primary. Pass. |
| Curse chip (HUD overlay) | gameplay-critical | mauve | **SHAPE** (chip with curse sigil icon); **TEXT** (curse name) | `src/ui/HudCurseChip.ts` | Icon + label both visible. Pass. |
| Combo counter | gameplay-critical | tier-coloured (white→amber→gold→legendary) | **TYPE** (size grows with tier); **POSITION** (centre-top); **AUDIO** (tier-up stinger) | `JuiceSystem.showCombo` | Size primary. Pass. |
| Damage numbers (normal) | gameplay-critical | white | **TYPE** (regular weight); **MOTION** (rises 15px) | `JuiceSystem.showDamageNumber` | Pass. |
| Damage numbers (crit) | gameplay-critical | gold `#ffdd44` | **TYPE** (bold + 30% larger + "CRIT" tween) | `JuiceSystem.showDamageNumber` (isCrit branch) | Typography primary. Pass. |
| Damage numbers (armor blocked) | gameplay-critical | blue `#88aaff` | **TEXT** ("BLOCK X" verbatim label) | `PlayerHitResolver.handle` blocked branch | Text primary. Pass. |
| Damage numbers (heal) | gameplay-critical | green | **TEXT** (`+N` prefix); **MOTION** (rises like all damage numbers) | `JuiceSystem.showDamageNumber` heal branch | Pass. |
| Toast (achievement) | gameplay-critical | gold `#ffdd88` | **MOTION** (slide-in); **TEXT** ("Achievement: ..."); **AUDIO** (`playAchievement`); **CAPTION** | `JuiceSystem.showToast` + wireSceneEventBus | Quad-cue. Pass. |
| Toast (boss enrage) | gameplay-critical | red `#ff4444` | **TEXT** ("Boss enrages"); **AUDIO** (`playBossEnrage`); **CAPTION** (`boss_enrage`) | wireSceneEventBus | Pass. |
| Toast (codex first cull) | gameplay-critical | cyan `#aaddff` | **TEXT** (enemy name); **AUDIO** (`playKill`) | wireSceneEventBus | Pass. |
| Speedrun timer | informational | dim white | **TYPE** (monospace); **POSITION** (corner) | `src/ui/SpeedrunTimer.ts` | Pass. |
| Boss HP bar (top of screen) | gameplay-critical | red fill / dark BG | **POSITION** (only appears when boss spawns); **TEXT** (boss name); **MOTION** (fill drops) | `src/ui/HudBossBar.ts` | Pass. |
| Dash cooldown indicator | gameplay-critical | gold ready / dim cooldown | **MOTION** (fill ring sweeps as cooldown ticks); **POSITION** (above player) | `src/ui/PlayerDashIndicator.ts` | Sweep is primary. Pass. |
| Aim aura (during charge weapons) | gameplay-critical | cyan/violet per weapon | **SHAPE** (per weapon); **MOTION** (oscillates with charge) | `WeaponSystem` aim aura per weapon | Pass. |

## Minimap

| Signal | Class | Colour | Non-colour cue | Source | Notes |
|--------|-------|--------|----------------|--------|-------|
| Player | gameplay-critical | bright green | **SHAPE** (rotated triangle pointing facing direction) | `Minimap` (src/ui/Minimap.ts:138-142) | Rotation primary. Pass. |
| Boss | gameplay-critical | red | **SHAPE** (split-diamond, larger than other dots) | Minimap:111-115 | Diamond primary. Pass. |
| Elite | gameplay-critical | gold ring + affix-tinted inner | **SHAPE** (concentric rings — distinct from any other minimap element) | Minimap:116-123 | Pass. |
| Regular enemy | gameplay-critical | dim red | **SHAPE** (small filled circle) | Minimap:124-128 | Single shape; relies on **size** vs elite. Acceptable but flagged in `A1_COLORBLIND_AUDIT.md` for verification. |
| Chest (golden) | gameplay-critical | gold square | **SHAPE** (square + golden glow) | Minimap:144-152 | Pass. |
| Chest (normal) | gameplay-critical | pale square | **SHAPE** (square) | Minimap:144-152 | Pass. |
| Reliquary | gameplay-critical | amber | **SHAPE** (diamond, smaller than boss) | Minimap:154-164 | **AT RISK under achroma** — same shape as boss. See `A1_COLORBLIND_AUDIT.md` mitigation #2. |
| Camera viewport rect | informational | translucent white outline | **SHAPE** (rectangular outline overlay on minimap) | Minimap | Pass. |

## World / gameplay

| Signal | Class | Colour | Non-colour cue | Source | Notes |
|--------|-------|--------|----------------|--------|-------|
| Player sprite | gameplay-critical | brown haggis | **SHAPE** (haggis silhouette — passes silhouette-test); **MOTION** (player-driven) | `src/sprites/haggis*` | Pass. |
| Enemy sprites (per type) | gameplay-critical | per-type colour | **SHAPE** (every enemy has unique silhouette per Bible §Silhouette-first); **MOTION** (per-AI behaviour) | `src/sprites/enemies/*` | Pass. |
| Elite glow | gameplay-critical | gold | **SHAPE** (1.3× larger sprite scale) + persistent HP bar | `Enemy.markAsElite` (src/entities/Enemy.ts:1417) | Triple-cue. Pass. |
| XP gem | gameplay-critical | cyan | **SHAPE** (hex-faceted gem); **MOTION** (magnetises to player when in range); **AUDIO** (`playXPCollect`) | `src/entities/XpGem.ts` | Pass. |
| Gold pickup | gameplay-critical | yellow | **SHAPE** (round coin); **MOTION** (different bob pattern from XP) | `src/entities/Pickup.ts` | Pass. |
| Health pickup | gameplay-critical | red | **SHAPE** (heart) | `src/entities/Pickup.ts` | Pass. |
| Hazard tile (lava) | gameplay-critical | orange/red glow | **MOTION** (heat shimmer animation); **SHAPE** (distinct from ground) | `src/scenes/game/HazardZones.ts` | Pulse primary. Pass — verify shimmer survives under protan. |
| Hazard tile (slick) | gameplay-critical | teal-blue | **SHAPE** (puddle outline); **MOTION** (slip physics on player when crossed); **AUDIO** (slip sfx) | `HazardZones.ts` | Pass. |
| Hazard tile (healing) | gameplay-critical | soft green | **SHAPE** (circle ring); **MOTION** (gentle pulse); **AUDIO** (`playMoorMoment` on enter) | `HazardZones.ts` | Pass. |
| Net slow debuff (player tint) | gameplay-critical | desaturated tint | **MOTION** (visible movement-speed drop); **SHAPE** (animated rope strands on player); **CAPTION** opportunity | `Player.applyNetSlow` | Acceptable; consider net-strand sprite check. |
| Freeze debuff (enemy) | informational | blue tint | **MOTION** (movement halt — primary cue) | `Enemy.applyFreeze` | Pass. |
| Burn DoT | informational | orange tint | **MOTION** (flame particle on enemy); **AUDIO** (sizzle) | weapon burn behaviour | Pass. |
| Boss warning ring | gameplay-critical | red expanding | **SHAPE** (expanding ring shape — anyone can read "warning"); **AUDIO** (`playBossWarning`); **CAPTION** opportunity | `SpawnSystem.preBossWarning` | Pass. |

## Menus / overlays

| Signal | Class | Colour | Non-colour cue | Source | Notes |
|--------|-------|--------|----------------|--------|-------|
| Pause overlay | gameplay-critical | dim background + gold title | **TEXT** ("Paused"); **POSITION** (centre); **MOTION** (fade-in) | `src/scenes/PauseScene.ts` | Pass. |
| Level-up cards (rarity tier) | gameplay-critical | rarity-colour border | **SHAPE** (border weight scales with rarity); **TYPE** (rarity name printed); **POSITION** (vertical-stack cards) | `src/ui/UpgradeCardsUI.ts` | Pass. |
| Card "selected" highlight | gameplay-critical | gold ring | **SHAPE** (border thickens); **MOTION** (subtle pulse on hover) | `UpgradeCardsUI.ts` | Pass. |
| Curse-pick screen severity | gameplay-critical | red severity dots | **SHAPE** (1–3 dot count); **TEXT** ("Curse name") | `CurseScene` | Count primary. Pass. |
| Game-over panel | gameplay-critical | red title + dim BG | **TEXT** ("Met the moor"); **MOTION** (fade); **POSITION** (centre) | `GameOverScene` | Pass. |
| Settings toggle on/off | informational | green = on / dim = off | **POSITION** (thumb left/right); **TEXT** ("ON" / "OFF" label) | `SettingsScene.addToggleRow` | Pass. |
| Main menu hearth glow | aesthetic | warm orange | n/a (aesthetic only) | `MainMenuScene` | Pass — aesthetic. |
| Almanac entry status | gameplay-critical | locked / unlocked colour | **SHAPE** (lock icon when locked); **TYPE** (italic when locked) | `AlmanacScene` | Icon primary. Pass. |
| Shop affordability | gameplay-critical | dim text when can't afford | **TYPE** (strike-through? — verify); **TEXT** (cost label) | `ShopScene` / `MetaShopScene` | Verify strike-through or icon disable state. |
| Reliquary three-pick | gameplay-critical | rarity tint | **SHAPE** (rarity-icon glyph) + **TEXT** (rarity name + relic name) | `src/scenes/game/ReliquaryPrompt.ts` | Pass. |
| Daily challenge ribbon | informational | gold | **TEXT** ("Today's Daily Run"); **POSITION** (top-strip) | `MainMenuScene` daily ribbon | Pass. |

## Cross-cutting cues that already serve as colour-independent paths

These existing systems are **colour-independent by design** and are
the structural reason WHS scores well on this audit:

1. **Captions** (`src/systems/a11y/CaptionManager.ts`) — every
   gameplay-critical audio cue can fire a caption. M4 catalogue tracks
   coverage. Captions render in the player-set text size.
2. **Audio stingers** — every gameplay event has a sound stinger, so
   eyes-off-screen players still get the cue.
3. **Silhouette-first sprites** (`docs/ART_STYLE_BIBLE.md`) — every
   enemy / pickup passes the black-on-white silhouette test before
   colour is considered.
4. **Minimap shapes** — multi-shape rather than multi-colour.
5. **High-contrast UI** toggle — strengthens chrome contrast and
   outline weights for low-vision and CVD overlap users.
6. **Caption text scale slider** (existing, M4) — tunable up to 1.4×
   for low-vision players.

## Recommended follow-ups

1. **Reliquary minimap mark** — under achroma, the size delta vs the
   boss diamond may collapse. Either rotate to point-up triangle or
   inset a tiny cross. Low-impact change.
2. **Lava hazard shimmer amplitude** — confirm motion is visible under
   protan/achroma. If not, double shimmer step-size.
3. **Caption scope expansion** — many systems already fire captions
   (level-up, boss-enrage, victory, death, low-HP, achievements,
   moor-mercy, ancestral-echo, standing-stones, reliquary, evolutions).
   Audit gaps tracked in `docs/A1_CAPTIONS_INDEX.md`.
4. **Bracken-red on Grave palette** — stress-test with simulator. If
   fail, add 1px gold trim to bracken-coded interactables.

## Cross-references

- WCAG 2.2 Success Criterion 1.4.1 — Use of Color (Level A).
- `docs/A1_COLORBLIND_AUDIT.md` — palette × CVD matrix.
- `docs/A1_CAPTIONS_INDEX.md` — caption coverage catalogue.
- `docs/ART_STYLE_BIBLE.md` §Silhouette-first test.
- `docs/research/ACCESSIBILITY_RESEARCH.md` §3.
