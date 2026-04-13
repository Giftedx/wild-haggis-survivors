# Design polish & UX hardening — Soul charter

This document anchors **player-facing tone**, **UX priorities**, and **where “soul” must show up** so shipped work stays coherent. Implementation details live in code (`src/core/i18n.ts`, scenes, `JuiceSystem`, HUD, etc.); this file is the **north star**.

---

## Soul charter (non-negotiable)

- The game must feel **handcrafted, warm, playful, and brave** in every player-facing moment.
- The **haggis fantasy** (scrappy drift, stubborn survival, cheeky Scottish flavor) is the **emotional center**.
- **Failure** is **informative and compassionate**, never shaming.
- **Progression beats** feel **celebratory and human**, not transactional.
- No major surface ships with **placeholder-feeling** UI, art, copy, or sound.

---

## Soul design principles

1. **Kindness in friction** — Always explain consequences and next steps clearly.
2. **Joy in motion** — Movement and combat feedback feel alive and characterful.
3. **Pride in mastery** — Improvements reward learning, not only stat stacking.
4. **Cozy between storms** — Non-combat spaces emotionally decompress the player.
5. **Craft coherence** — Typography, icons, wording, and audio feel like **one authored world**.

---

## Soul weave matrix (where soul must appear)

| Area | Intent |
|------|--------|
| **Run start** | Identity handoff (variant fantasy + intent) in the **first few seconds**. |
| **Combat** | Readable, flavorful weapon feedback; meaningful micro-celebrations. |
| **Level-up & evolution** | Excitement **plus** clarity; avoid sterile “spreadsheet choice” feeling. |
| **Failure & recovery** | Supportive language, clear takeaway, hopeful replay path. |
| **Meta & menus** | Tactile responsiveness, clear purpose, cozy tone; no dead/silent flow. |
| **Accessibility / readability** | Comfort is part of kindness, not an optional afterthought. |

---

## Objectives (execution order)

1. **Stabilize high-impact UX first** — Truthful HUD, non-overlapping results, clear progression language.
2. **Prevent regressions** — Turn critical design assumptions into **tests** where practical (i18n keys, layout contracts, copy that must not regress).
3. **Defer broader foundation** — Icons/accessibility schema expansions **after** shipping blockers are resolved.
4. **Ship bar** — Each shipped change should satisfy the Soul Charter in **function**, **tone**, and **feel**.

---

## For contributors

- Prefer **data-driven** balance in `src/config.ts` and `src/data/*`; prefer **copy** in `src/core/i18n.ts` for player-facing strings.
- **HUD, pause overlay, boss warnings, treasure toasts, upgrade feedback, and boot splash title** should use `t('ui…')` (or card/evolution keys resolved through `t`) — not hardcoded literals in scenes — so voice and future locales stay coherent.
- When adding toasts, banners, or overlays: match existing **warm Scots-tinged** voice; avoid cold system jargon unless it is clearly diegetic.
- Before claiming work is done: `npm test` and, for shippable changes, `npm run build` (see `AGENTS.md`).
