---
name: Wild Haggis Survivors
colors:
  # ── Surfaces ────────────────────────────────────────────────
  background: "#1a1a2e"              # Night-moor base — the screen behind everything
  surface: "#111728"                 # Primary panel fill — menus, overlays, card backdrops
  surface-dim: "#0a0a14"             # Warm ink — text stroke on bold titles
  surface-bright: "#1a1a28"          # Secondary surface — card interiors, list rows
  surface-container-lowest: "#0a0a1a" # Deep night — boot splash base
  surface-container-low: "#111728"    # Default panel
  surface-container: "#1a1a28"        # Card / tile interior
  surface-container-high: "#252540"   # Tertiary button fill
  surface-container-highest: "#3a4357" # Secondary button fill
  on-surface: "#c4cdd8"              # Default body text on dark panels
  on-surface-variant: "#9ea8bb"      # Secondary labels on panels
  outline: "#2a3450"                 # Standard panel border
  outline-variant: "#596780"         # Fine-print dividers

  # ── Brand & action ──────────────────────────────────────────
  primary: "#005eb8"                 # Scottish blue — primary button fill
  on-primary: "#ffffff"
  primary-container: "#0077dd"       # Primary button hover
  secondary: "#d4a017"               # Whisky gold — accent, titles, XP bar, currency
  on-secondary: "#0a0a14"
  secondary-container: "#ddaa00"     # Legendary / evolution gold
  tertiary: "#6b3fa0"                # Heather purple — moor flora, sigil accents
  on-tertiary: "#ffffff"

  # ── Semantic ────────────────────────────────────────────────
  error: "#cc3333"                   # HUD HP red
  on-error: "#ffffff"
  error-container: "#ff4444"         # Danger flash — damage vignette, low-FPS, HP crit
  success: "#44dd44"                 # Weapon acquire, heal, health orb
  warning: "#ffdd88"                 # Toast / achievement / act-intermission title
  crit: "#ffdd44"                    # Crits, legendary particles, evolution beams

  # ── Rarity ladder (upgrade cards) ───────────────────────────
  rarity-common: "#888888"
  rarity-uncommon: "#44aa44"
  rarity-rare: "#4488dd"
  rarity-legendary: "#ddaa00"

  # ── Art palette — sprite anchors, six families ──────────────
  art-peat-shadow: "#3a2818"
  art-peat-mid: "#5a3e20"            # Haggis body default
  art-peat-warm: "#4a2e18"
  art-heather-dark: "#8060a0"
  art-heather-mid: "#9070b0"
  art-heather-bright: "#b090d0"
  art-loch-deep: "#2a4a6a"
  art-loch-mid: "#4a7090"
  art-loch-cool: "#6a90b0"
  art-gold-aged: "#c8a040"
  art-gold-warm: "#d4b055"
  art-gold-bright: "#ffc840"
  art-stone-shadow: "#2a2a30"
  art-stone-mid: "#4a4a50"
  art-stone-highlight: "#8a8a90"
  art-red-deep: "#aa2020"
  art-red-arterial: "#c42828"
  art-red-dried: "#901818"
  art-sprite-red: "#cc2222"          # Clothing / armour / boss HP fill

  # ── World & environment ─────────────────────────────────────
  world-grass: "#2d5a27"             # Highland grass floor
  world-sky: "#4a7fb5"               # Mid-day sky reference
  world-heather: "#6b3fa0"           # Moor carpet
  world-stone: "#7a6e5d"             # Cairn / ruin stone

  # ── Text family (cool-blue greys, six stops) ────────────────
  text-bright: "#e4e9f0"             # Bold titles, emphasis
  text-primary: "#c4cdd8"            # Default body
  text-secondary: "#9ea8bb"          # Less prominent info
  text-muted: "#8a93a8"              # Tertiary context
  text-subtitle: "#7f8ca7"           # Italic scene context / timestamps
  text-dim: "#596780"                # Footer / fine print
  text-hint: "#6a7390"               # De-emphasized labels, placeholders

  # ── Warm text accents ───────────────────────────────────────
  warm-tan: "#e8d4a0"                # Tertiary button text, HUD secondary, card body
  dusty-tan: "#b8a88a"               # Subdued body, descriptions
  label-tan: "#b69643"               # Stat labels (Game-Over etc.)
  status-tan: "#8a7a6a"              # Muted informational (tagline)

  # ── Narrative accents ───────────────────────────────────────
  curse-mauve: "#c8a0a0"             # Death banners, curse labels
  curse-mauve-bright: "#e8a0c6"      # Active curse display
  victory-green: "#77c977"           # Victory / unlock
  combo-amber: "#e8a830"             # Combo counter 20–49 tier

typography:
  # Everything uses a single monospace family. Titles are bold with
  # a heavy ink stroke — pixel-art chunkiness is the typographic
  # signature. Subtitle is the only italic role.
  display:
    fontFamily: monospace
    fontSize: 48px
    fontWeight: "700"
    lineHeight: 56px
    strokeWidth: 7px
    strokeColor: "{colors.surface-dim}"
  title:
    fontFamily: monospace
    fontSize: 30px
    fontWeight: "700"
    lineHeight: 36px
    strokeWidth: 4px
    strokeColor: "{colors.surface-dim}"
  heading:
    fontFamily: monospace
    fontSize: 22px
    fontWeight: "700"
    lineHeight: 28px
    strokeWidth: 3px
    strokeColor: "#000000"
  body:
    fontFamily: monospace
    fontSize: 16px
    fontWeight: "700"
    lineHeight: 22px
    strokeWidth: 2px
    strokeColor: "#000000"
  label:
    fontFamily: monospace
    fontSize: 13px
    fontWeight: "700"
    lineHeight: 18px
    strokeWidth: 2px
    strokeColor: "#000000"
  small:
    fontFamily: monospace
    fontSize: 11px
    fontWeight: "700"
    lineHeight: 14px
    strokeWidth: 2px
    strokeColor: "#000000"
  subtitle:
    fontFamily: monospace
    fontSize: 13px
    fontWeight: "400"
    fontStyle: italic
    lineHeight: 18px
    strokeWidth: 0

rounded:
  # Pixel-art UI — corners are square. Only the card-rarity glow
  # and toast pips take any curvature, and that is drawn, not CSS.
  none: 0px
  sm: 0px
  DEFAULT: 0px
  md: 0px
  lg: 0px
  xl: 0px
  full: 9999px                       # Circular pips / minimap dots only

spacing:
  unit: 8px                          # All layout snaps to an 8px grid
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  xxl: 64px
  hud-margin: 20px                   # HUD edge inset from viewport
  card-gap: 16px                     # Gap between level-up cards
  panel-padding: 24px                # Inside-panel content inset
  overlay-inset: 40px                # Inset of full-screen overlay content

elevation:
  # Depth is conveyed by a dim backdrop + a slightly lighter panel,
  # not by blur or shadow. Game is pixel-art and opaque.
  base:
    dim: 0                           # Playfield — no overlay
  overlay-standard:
    dim-color: "{colors.surface-dim}"
    dim-alpha: 0.82                  # Level-up, pause, death, act intermission
  overlay-high-contrast:
    dim-color: "{colors.surface-dim}"
    dim-alpha: 0.92                  # A11y high-contrast toggle
  panel-flat:
    surface: "{colors.surface}"
    stroke-width: 2px
    stroke-color: "{colors.outline}"
    stroke-alpha: 0.8
  panel-accent:
    surface: "{colors.surface}"
    stroke-width: 2px
    stroke-color: "{colors.secondary}"
    stroke-alpha: 0.6                # Curse tiles, highlighted cards

motion:
  ease-default: Sine.easeInOut
  ease-punch: Quad.easeOut
  fade-in: 400ms
  fade-out: 400ms
  boot-splash-total: 2000ms          # Highland-dawn staggered reveal
  title-bob: 800ms                   # yoyo, -4px amplitude
  hit-freeze: 20ms                   # Wall-clock timeScale=0 on kill
  screen-shake-kill: 80ms
  screen-shake-boss: 240ms
  screen-shake-boss-death: 480ms
  slow-mo-boss-kill: 900ms
  damage-number-rise: 600ms
  combo-tier-pulse: 180ms
  scene-transition-fade: 400ms
  motion-scale-range: [0, 1]         # a11y amplitude multiplier (duration preserved)

sound:
  music: procedural, layered (Highland pad, FM felt piano, heartbeat, Euclidean rhythm)
  sfx-throttle: AudioContext-time based (AoE hits collapse to one voice per frame)
  compressor: DynamicsCompressorNode on output bus
  captions: opt-in via Comfort settings

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    hoverColor: "{colors.primary-container}"
    textColor: "{colors.on-primary}"
    typography: "{typography.heading}"
    rounded: "{rounded.none}"
    height: 44px
    cursor: hand
  button-secondary:
    backgroundColor: "{colors.surface-container-highest}"
    hoverColor: "#4a5568"
    textColor: "{colors.on-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    height: 40px
  button-tertiary:
    backgroundColor: "{colors.surface-container-high}"
    hoverColor: "#2a2244"
    textColor: "{colors.warm-tan}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    height: 36px
  # Semantic override variants — same factory as the three tiers, but
  # with `fillOverride` / `hoverOverride` / `textColorOverride` baked in
  # for contexts where colour itself carries meaning.
  button-success:
    backgroundColor: "#2d6a3e"           # Meta progression (Lasting Boons), SELECTED states
    hoverColor: "#3a8f4f"
    textColor: "#ffffff"
    typography: "{typography.heading}"
    rounded: "{rounded.none}"
  button-warning:
    backgroundColor: "#8b6914"           # Daily Challenge — aged gold, warm darker
    hoverColor: "#a87e1a"
    textColor: "#fff3d1"                 # Cream-warm, not pure white
    typography: "{typography.heading}"
    rounded: "{rounded.none}"
  button-curse:
    backgroundColor: "{colors.curse-mauve-bright}"  # Curse CTA — "TAKE IT ON"
    hoverColor: "#ffbadc"
    textColor: "{colors.surface-dim}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
  button-ghost:
    backgroundColor: "{colors.surface}"  # OPTIONS on main menu — outlined, sits on canvas
    hoverColor: "{colors.surface-bright}"
    textColor: "{colors.warm-tan}"
    typography: "{typography.body}"
    borderColor: "{colors.outline}"
    borderWidth: 2px
    rounded: "{rounded.none}"
  panel:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.outline}"
    borderWidth: 2px
    borderAlpha: 0.8
    padding: "{spacing.panel-padding}"
  panel-accent:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.secondary}"
    borderWidth: 2px
    borderAlpha: 0.6
    padding: "{spacing.panel-padding}"
  card-rarity-common:
    borderColor: "{colors.rarity-common}"
    borderWidth: 2px
    backgroundColor: "{colors.surface-bright}"
  card-rarity-uncommon:
    borderColor: "{colors.rarity-uncommon}"
    borderWidth: 2px
    backgroundColor: "{colors.surface-bright}"
  card-rarity-rare:
    borderColor: "{colors.rarity-rare}"
    borderWidth: 3px
    backgroundColor: "{colors.surface-bright}"
  card-rarity-legendary:
    borderColor: "{colors.rarity-legendary}"
    borderWidth: 3px
    backgroundColor: "{colors.surface-bright}"
    glow: true
  toast:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.warning}"
    typography: "{typography.label}"
    borderColor: "{colors.secondary}"
    borderWidth: 1px
    fadeIn: 200ms
    holdMs: 2400ms
    fadeOut: 400ms
  hp-bar:
    backgroundColor: "{colors.surface-dim}"
    borderColor: "{colors.outline}"
    borderWidth: 1px
    height: 12px
    # Four-tier state palette — bar smoothly lerps toward target (~300ms).
    # Thresholds are strict-greater-than gates on the HP fraction.
    fillStates:
      healthy:                           # hpFrac > 0.60
        color: "#44cc44"
      caution:                           # hpFrac > 0.35
        color: "#cccc44"
      danger:                            # hpFrac > 0.15
        color: "#dd8844"
      critical:                          # hpFrac ≤ 0.15
        color: "#cc3333"
    lowHpPulse:
      threshold: 0.30                    # Below this, alpha oscillates
      alphaCenter: 0.70
      alphaAmplitude: 0.30
      phaseStepPerTick: 0.12
  xp-bar:
    backgroundColor: "{colors.surface-dim}"
    fillColor: "{colors.secondary}"
    borderColor: "{colors.outline}"
    borderWidth: 1px
    height: 8px
  minimap:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.outline}"
    enemyDot: "{colors.error}"
    eliteDot: "{colors.secondary}"
    bossDiamond: "{colors.rarity-legendary}"
    playerDot: "{colors.success}"
    viewportFrame: "{colors.text-muted}"
  damage-number:
    typography: "{typography.label}"
    textColor: "{colors.text-bright}"
    critColor: "{colors.crit}"
    healColor: "{colors.success}"
    riseDistance: 28px
    riseDuration: "{motion.damage-number-rise}"
  boss-warning:
    textColor: "{colors.error-container}"
    typography: "{typography.title}"
    flashColor: "{colors.error-container}"
    flashAlpha: 0.35
  tutorial-toast:
    backgroundColor: "{colors.surface-dim}"
    textColor: "{colors.warm-tan}"
    typography: "{typography.body}"
    borderColor: "{colors.secondary}"
    borderWidth: 1px
    padding: 16px
    position: top-center
    fadeIn: 300ms
    fadeOut: 400ms
    holdMs: 4000ms
  pause-overlay:
    dimColor: "{colors.surface-dim}"
    dimAlpha: 0.82
    titleColor: "{colors.secondary}"     # Whisky-gold "PAUSED"
    titleTypography: "{typography.display}"
    statLabelColor: "{colors.text-secondary}"
    statValueColor: "{colors.text-bright}"
    resumeButton: "{components.button-primary}"
    auxButton: "{components.button-secondary}"
    audioStateColor: "{colors.success}"  # "SFX: ON" / "Music: ON" green

rendering:
  pixelArt: true
  roundPixels: true
  antialiasing: false
  canvas:
    width: 800
    height: 600
  world:
    width: 3000
    height: 3000
  physics:
    engine: arcade
    gravity: 0
    fixedStep: true
    stepHz: 60
---

# Wild Haggis Survivors — Design System

## Brand & style

Wild Haggis Survivors is a **warm pixel-art bullet-heaven** dressed in a **Highland-at-dusk** palette and a **Scots-tinted** voice. The look is handcrafted, tactile, and a little cheeky — every sprite is drawn in code, every panel snaps to the same 8px grid, and every font glyph is the same bold monospace hammered out of the same chunky ink stroke. The emotional register is **Still Game warmth by default, Limmy bite for failures and bosses** — cozy between storms, brave in them, never sterile.

Four adjectives describe the intended feel: **handcrafted, warm, playful, brave**. The haggis fantasy — a drifting, stubborn wee beast veering clockwise across a moor — is the emotional centre, and every surface (HUD, level-up card, toast, death panel) is tuned so that scrappy identity comes through in the first few seconds of a run and never shades into spreadsheet UI.

## Colour

The palette is two families braided together.

**UI chrome** runs on a cool near-black night-moor base (`background`, `surface`, `surface-bright`) lit almost exclusively by two accent colours: a **Scottish blue** for primary action (buttons, minimap viewport), and a **whisky gold** for value, progress, and celebration (titles, XP bar, currency, toast highlights, legendary borders). Everything else on the chrome — body copy, labels, fine print — sits on a six-stop cool-blue grey ramp from `text-bright` down to `text-dim`. Warm tans (`warm-tan`, `dusty-tan`, `label-tan`) peek through on card bodies, stat labels, and the Game-Over panel to pull the UI back from feeling clinical.

**Sprite art** uses six named anchor families — **peat, heather, loch, gold, stone, red** — with a shadow / mid / highlight triple per family. This is a deliberate constraint: procedural drawers pick an anchor and a lighter or darker sibling from the same family rather than inventing one-off hex values, and the result is that a stone cairn, a boss axe, and a thistle crown all sit inside the same painted world.

Semantic colours are small and specific: HP red for player health only; a brighter danger red (`error-container`) for damage-flash vignettes, critical-HP pulses, and low-FPS warnings (so it punches through particle noise); a saturated success green for weapon acquires, heals, and pickup orbs; toast gold for transient warmth (act titles, achievements). Rarity on upgrade cards walks a four-rung ladder — grey / green / blue / gold — and legendary draws add a drawn glow on top of the border bump.

The HP bar itself is not one colour but a **four-state palette**: green above 60%, yellow above 35%, orange above 15%, red below. The bar lerps smoothly between adjacent states over ~300ms; below 30% HP the fill alpha oscillates on a sine-driven pulse so critical HP is read as urgency, not just hue. This is the single HUD element where colour state is doing narrative work.

Curse-state UI lives in its own mauve pocket (`curse-mauve`, `curse-mauve-bright`) to signal "this run carries weight" without shouting in HP red.

## Typography

One family, one weight, one treatment: **bold monospace, pixel-crisp, over a heavy near-black ink stroke**. The stroke is not decorative — it is how type survives against a moving pixel-art playfield. Seven roles walk a 48 → 11 pixel scale, each role carrying its own stroke thickness so that a title on a boss-warning overlay hits harder than the same word on a card body:

- **display** (48px / 7px stroke) — boot splash, victory banner, game-over gravitas.
- **title** (30px / 4px) — scene headers, boss names.
- **heading** (22px / 3px) — primary buttons, card titles.
- **body** (16px / 2px) — card body, secondary buttons, HUD numbers.
- **label** (13px / 2px) — stat rows, tooltips, toast text.
- **small** (11px / 2px) — fine print, version tag, footers.
- **subtitle** (13px italic, no stroke) — the only italic role; pause subtitles, scene context, timestamps.

Italic sits outside the stroke pattern because it is only ever drawn over darkness, where a stroke would muddy the glyph edge. Everywhere else the stroke is mandatory — removing it is a bug.

## Layout & spacing

Everything snaps to an **8px grid**. Scene edges respect a 20px HUD margin so nothing crowds the viewport safe area (the mobile virtual-joystick lives in that border). Level-up cards and route cards sit on a fixed 16px inter-card gap. Panel interiors inset by 24px before content begins. Full-screen overlays hold their content in a 40px inset from the overlay frame so dim backdrop and content breathe apart.

The game canvas is a fixed **800 × 600** scaled-to-fit target over a **3000 × 3000** world. World boundaries are **soft** — the player slows and is gently pushed back near the edge, never hard-walled — so the frame of play is visual, not rigid.

A **`uiScale`** setting (0.8 – 1.4) multiplies text, button, HUD, and minimap scale across every scene simultaneously. No scene is exempt. This is an accessibility knob, not a per-scene override, and the spacing tokens above are the unscaled truth.

## Elevation & depth

There is no blur, no glass, no drop shadow. Depth is drawn with three tools:

1. **A dim colour wash.** Full-screen overlays (level-up, pause, death, act intermission) drop an 82%-opaque near-black sheet over the playfield. The high-contrast accessibility variant raises that to 92%. This is the *only* dim value in the game.
2. **A flat lighter panel on top.** Panels are solid `surface` (`#111728`) with a 2px outline at 80% alpha, and card interiors step up one tone to `surface-bright` (`#1a1a28`) for internal layering. A gold-accent stroke variant (60% alpha) marks curse tiles and highlighted cards.
3. **A chunky 1–2px sprite outline.** Every enemy, projectile, and boss texture is auto-outlined after bake so silhouettes read against any floor tint. Pickups skip the outline — glows fight with borders.

Panels and cards do not float. They sit.

## Buttons

Three canonical tiers cover most of the interface:

- **Primary** — Scottish blue, white label. The action the player is on-rails toward (`START RUN`, `PLAY`, `RESUME`).
- **Secondary** — slate fill, white label. Paired counter-actions (`END RUN`, `Save last 15s`, pagination).
- **Tertiary** — dark violet fill, warm-tan label. Low-emphasis background chrome.

A handful of scenes layer **semantic overrides** on top of the factory — same geometry, same stroke, different palette — where colour itself is carrying meaning:

- **Success / meta-progression** — `#2d6a3e` fill, used for the main-menu `LASTING BOONS` shortcut and every `SELECTED` state on the variant loadout strip. Reads as "banked, confirmed, yours."
- **Warning / daily ritual** — `#8b6914` fill with a cream `#fff3d1` label — the Daily Challenge button. Warm aged gold, deliberately not whisky-gold so the challenge reads as a separate ritual surface from titling.
- **Curse** — curse-mauve-bright fill on dark ink text. Only used on the `TAKE IT ON` CTA inside the curse picker; signals "this is a cost, not a gift."
- **Ghost** — `surface` fill with a 2px outline, warm-tan label. The `OPTIONS` button and most `BACK` buttons. Sits on the canvas without competing with the primary action.

No variant is allowed to invent its own corner radius, stroke weight, or font. The three tiers own geometry; the overrides only own colour.

## Shape

Corners are **square**. Pixel-art UI reads best when geometry is honest about its grid — rounded corners in a Phaser rectangle quantise to a stepped arc and look broken. The only curvature in the interface is deliberately circular: minimap dots, elite-tag pips, toast badges, XP gems. The `rounded.full` token exists for those cases; every other `rounded.*` token is zero, by design.

Sprite silhouettes follow the opposite rule: **silhouette first, one big iconic shape** readable at small sizes, with chunky 1–2px dark borders so edges never blur into the moor.

## Motion

Motion is **short, punchy, and amplitude-scalable**. Durations are fixed; an accessibility `motionScale` slider (0 – 1) multiplies tween *amplitude* while holding duration constant, so layout timing stays deterministic for players who reduce motion.

Key beats:

- **Hit freeze** — a 20ms real-wall-clock `timeScale = 0` on every kill. This is the single loudest piece of game-feel in the system. It runs on `setTimeout`, not Phaser timers, because Phaser timers honour `timeScale` and would freeze themselves.
- **Screen shake** — kill shake ~80ms, boss shake ~240ms, boss-death shake ~480ms, all amplitude-scaled. A toggle disables shake entirely without touching duration.
- **Slow-mo** — ~900ms on boss kills; the game briefly breathes out.
- **Boot splash** — a Highland-dawn painting staggered in over ~2s: sky → stars → mountains → dawn glow → heather wash → haar mist → title → mascot. Stars then fade as dawn brightens. This is a deliberate identity handoff, not a logo screen.
- **Damage numbers** — 600ms rise, 28px travel, typed in `label` scale with crit and heal colour overrides.
- **Scene transitions** — 400ms fade both directions, matching the boot splash's entry tempo.
- **Combo counter** — a 180ms pulse on each tier crossing; at 20+ kills the counter shifts to combo-amber to mark the warm mid-tier.

Every overlay (level-up, pause, death, victory) is interactive-blocked so the virtual joystick cannot fire through it on mobile.

## Sound

Two buses sharing one `AudioContext`: an SFX system and a **procedural music engine**. The music engine is not a looped track — it is four layered voices (Highland pad drone, FM felt piano, heartbeat pulse, Euclidean rhythm) driven by a conductor that reads game-state mood axes (intensity, danger, chaos, triumph) every frame and schedules notes with a lookahead scheduler. When a boss spawns the piano leans in; when the player crests a combo the pad swells; when HP crits the heartbeat takes over.

A dynamics compressor sits on the master bus — both SFX and music route through it — so the mix never clips even when a dozen AoE hits land on the same frame. AoE SFX throttle themselves via audio-clock comparison. The context is never suspended (doing so silences music too).

Captions are an opt-in accessibility mode; every audio cue has a string equivalent.

## Voice & copy

The copy voice is **Scots-tinted, warm by default, bitier on failure**. Player-facing strings live in a single source of truth so tone stays coherent across HUD chips, boss warnings, treasure toasts, upgrade feedback, and boot splash. An optional Scots locale overlay sits on top of the English baseline and falls back per-key when a Scots string is missing — the UI never drops to a raw key. Authoring rules: Still Game warmth for progression, Limmy bite for failure and boss introductions, never cold system jargon unless it is clearly diegetic.

Failure text in particular is informative and compassionate — a dead run shows a clear takeaway and a hopeful replay path, never a shaming gravestone.

## Accessibility

Comfort is a first-class surface, not a settings-menu afterthought. Every knob persists across scene restart and browser reload and is exercised in a strict-combo smoke test on every build:

- **Volume** — master / SFX / music independent sliders.
- **UI scale** — 0.8–1.4 multiplier applied to every scene's text and chrome, including the settings scene itself.
- **Motion scale** — 0 disables tween amplitude without touching duration; gameplay-critical feedback (hit flashes, damage numbers when enabled) is never culled by this.
- **Screen shake / damage numbers** — individual toggles.
- **Reduce particles** — gates ambient decoration only, not gameplay-critical feedback.
- **High-contrast UI** — swaps scene palettes to high-contrast variants and raises overlay dim to 92%.
- **Captions** — on-screen text for audio events.
- **Banter frequency** — four-stop dial (Wheesht / Sparing / Natural / Gabby) throttling flavour copy.
- **Locale** — English baseline, Scots overlay.

`motionScale = 0` combined with high-contrast UI combined with captions on combined with reduced particles combined with banter off must never produce a page error. That combined state is the accessibility contract.

## What design is *not*

- Not glassmorphism, not Material, not corporate neutral. No blur, no drop shadows, no translucent chrome.
- Not rounded. Square corners everywhere except genuinely circular pips.
- Not typographically expressive. One family, one weight, stroked. The expression is in the sprite art and the copy voice, not in type.
- Not apologetic in failure or transactional in progression. Both are characterful.
- Not silent. An empty screen with no audio, no motion, and no copy is a bug.

The north star in one line: every pixel and every word should feel like it was drawn, written, and tuned by one hand that knows exactly what a haggis is and why it drifts clockwise.
