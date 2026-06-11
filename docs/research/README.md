# WHS Research Foundation

Eight deep reference documents supporting Wild Haggis Survivors's masterpiece-grade development. Each is the product of focused research; together they form the knowledge graph that Soul Charter, Voice Card, Art Style Bible, and every downstream spec and plan draw from.

**Total corpus:** ~150,000 words across 8 documents.

**Rule of thumb:** cite the relevant section in any PR or spec that touches the subject. Kept the knowledge alive; saved rediscovery time.

---

## The eight docs

### 1. [`ROGUELITE_RESEARCH.md`](./ROGUELITE_RESEARCH.md)
*Structural & mechanical canon. ~17k words.*

25 roguelites deep-dived across four clusters (survivor-likes, action roguelites, strategy/deck-builders, hybrids). 14 cross-game design patterns extracted. Plus a WHS-specific **gap analysis** with 26 tiered opportunities (S-tier big bets, A-tier adds, B-tier polish, C-tier deferred) mapped to current systems.

**Consult when:** designing a new mechanical system; picking the next flagship; weighing a content idea against precedent.

**Key sections:** §Cluster A (survivor-likes — WHS's home genre); §Cross-Game Pattern Library; §WHS Gap Analysis.

---

### 2. [`SCOTTISH_RESEARCH.md`](./SCOTTISH_RESEARCH.md)
*Folklore, geography, history, culture — gazetteer-style. ~17k words.*

Dense entries across four parts (folklore & mythology, geography & places, history & figures, culture/food/music/language) plus a WHS content-mining section cross-referencing every finding to specific game content opportunities.

**Consult when:** adding a new enemy, biome, weapon, route, NPC; writing banter with Scottish flavour; grounding any design choice in living culture.

**Key sections:** §Part 1 (folklore creatures); §Part 5 (WHS content mining).

---

### 3. [`GAME_FEEL_RESEARCH.md`](./GAME_FEEL_RESEARCH.md)
*The craft of masterpiece feel. ~15k words.*

Canon of game-feel thinking (Nijman, Sakurai, Thorson, Korb). Eight iconic moments deconstructed into repeatable stack ingredients. Technical toolkit (hit-stop, screen shake, squash-stretch, tween curves, input buffering, permanence). Audio as feel. Visual language. Emotional architecture. Scottish-specific feel. WHS application map with 80+ tagged opportunities.

**Consult when:** any change touches VFX, SFX, hit-feel, camera, moment design, or emotional pacing.

**Key sections:** §Part 2 (Anatomy of Great Moments — the 7-ingredient recipe); §Part 3 (Technical Toolkit); §Part 11 (WHS Application Map).

---

### 4. [`MUSIC_ART_TECH_RESEARCH.md`](./MUSIC_ART_TECH_RESEARCH.md)
*Engineering layer — Phaser 3 + Web Audio + WebGL. ~14k words.*

Music architecture (scheduler, AudioContext lifecycle, AudioWorklet, adaptive music patterns). Synthesis paradigms. Modern pixel-art pipelines (Dead Cells's 3D-to-2D, Aseprite, procedural). Shader art for 2D games (palette swap, outline, dissolve, heat-shimmer, haar fog, bloom, SDF) with GLSL examples. Procedural content (noise, WFC, procedural tartan). 2D lighting. Performance. The 2024-2026 AI-era tooling landscape with ethics framework.

**Consult when:** designing a music-engine feature, a shader effect, a procedural content system, or an art/asset pipeline.

**Key sections:** §Part 6 (Shader Art — with concrete GLSL); §Part 11 (WHS Technical Opportunities — 100+ tagged).

---

### 5. [`SCOTTISH_RESEARCH_DEEP.md`](./SCOTTISH_RESEARCH_DEEP.md)
*Comprehensive Scottish encyclopaedia. ~28k words.*

25 parts covering: geography & regions (including all 32 council areas), cities/towns/villages (exhaustive), islands, mountains/lochs/rivers/coasts, wildlife, deep chronological history, politics & government, clans, law/education/religion, economy & industry, **haggis (the definitive deep-dive including wild-haggis myth)**, food & drink, languages (Gaelic/Scots/Scottish English/Norn/Pictish), dialects (Glaswegian/Edinburgh/Doric/Shetlandic/Orcadian/Borders/Fife), literature, visual arts & architecture, music & performing arts, film/TV/theatre/comedy, sports, inventors & thinkers, games industry (DMA/Rockstar North/Abertay), mythology/folklore/customs, diaspora, famous-Scots catalogue.

**Consult when:** deep Scottish grounding is needed beyond the gazetteer; dialect-authentic voice authoring; historical accuracy check; haggis-specific content (see §11 for the wild haggis myth — core to the game's identity).

**Key sections:** §Part 11 (Haggis — wild haggis myth is gold); §Part 14 (Regional dialects); §Part 15 (Burns canon); §Part 21 (Scottish games industry — WHS's lineage).

---

### 6. [`ACCESSIBILITY_RESEARCH.md`](./ACCESSIBILITY_RESEARCH.md)
*Accessibility engineering playbook. ~13k words.*

10 parts: foundational principles, photosensitivity & seizure safety (critical — WCAG 2.2 SC 2.3.1 + PEAT tool + specific WHS risk audit), visual (colorblind design + all simulator tools), audio (captions scope), motor (remapping + Celeste Assist Mode lessons), cognitive, platform requirements (Steam tags + Xbox XAGs), WHS audit against current Comfort matrix with Tier S/A/B/C priority, testing methodology (community consultants), Soul Charter alignment with proposed accessibility manifesto.

**Consult when:** any particle-dense VFX (photosensitivity); any colour-coded system (colorblind); any new input mechanic (motor); before any public release.

**Key sections:** §Part 2 (Photosensitivity — non-optional); §Part 8 (WHS Accessibility Audit).

---

### 7. [`CULTURAL_SENSITIVITIES_RESEARCH.md`](./CULTURAL_SENSITIVITIES_RESEARCH.md)
*Ethics reference for Scottish content. ~9k words.*

Foundational principles; outsider-writing-Scotland pitfalls; **handling historical trauma** (Glencoe, Clearances, Culloden, Killing Times — with respectful practice guidance); **community consultation protocols** (Gaelic, Traveller, Northern Isles, disability, LGBTQ+); language & dialect representation; **trademark & IP** (Buckfast, Irn-Bru, Tunnock's); religious & political sensitivities (sectarianism, independence); representing living communities; AI/production ethics; Soul Charter filter; practical checklists.

**Consult when:** writing content that touches historical atrocity, a marginalised community, a regional dialect, a trademarked product, or political-adjacent topics.

**Key sections:** §Part 2 (Historical Trauma — Clearances, Glencoe, Culloden); §Part 5 (Trademarks); §Part 10 (Checklists).

---

### 8. [`NARRATIVE_RESEARCH.md`](./NARRATIVE_RESEARCH.md)
*Storytelling architecture for roguelites. ~11k words.*

The storytelling paradox in looping games; eight narrative-vocabulary tools (cutscenes, environmental, item flavour, dialogue, diegetic UI, atmosphere, meta-narrative, emergent); **seven case studies** (Hades, Hollow Knight, Dark Souls, Isaac, Spelunky, Inscryption, Outer Wilds) with technique extraction; Scottish narrative traditions (ballad, seanchaidh, Burns, bothy ballad, lament, Gran-voice); WHS narrative architecture (cast of voices, per-run arc, meta-arc, lineage); narrative building blocks (banter pools, Dark-Souls item text, ambient text, Almanac, NPCs); the ending problem; WHS application map.

**Consult when:** writing narrative content (banter, flavour, NPC encounters); designing a Meta-progression arc; scoping a new narrative feature (Almanac, Lineage).

**Key sections:** §Part 3 (Case Studies — Dark Souls item-text technique); §Part 5 (WHS's cast of voices); §Part 8 (Application map).

---

## How the corpus interlocks

Research docs reference each other and flow into the foundational docs:

```
ROGUELITE ─────┐
               │
SCOTTISH ──────┤
               ├──► DESIGN_SOUL ──► VOICE_CARD ──► ART_STYLE_BIBLE
SCOTTISH_DEEP ─┤             │
               │             ▼
GAME_FEEL ─────┤          DESIGN_IDEAS ──► HUGE_INITIATIVES_MASTER_PLAN
               │                                    │
MUSIC_ART_TECH ┤                                    ▼
               │                            docs/superpowers/specs/*
ACCESSIBILITY ─┤                                    │
               │                                    ▼
CULTURAL ──────┤                            docs/superpowers/plans/*
               │
NARRATIVE ─────┘
```

Every spec under `docs/superpowers/specs/` cites the relevant research section. Every PR touching player-facing work should cite research + foundational docs via the Soul Check (six questions — see `DESIGN_SOUL.md`).

---

## Author & status

- **Authored:** April 2026, Claude at Michael's direction.
- **Status:** Living documents. Update when understanding deepens, facts shift, or new research supplants prior.
- **Fact-audit cadence:** re-check date-sensitive facts (census figures, living-person status, trademark ownership) yearly.

See each doc's Changelog footer for version history.
