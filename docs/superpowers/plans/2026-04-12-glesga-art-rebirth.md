# The Glesga Rebirth — Full Art Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework every sprite in BootScene.ts with deep Glaswegian cultural personality — every sprite should have patter, every detail should reward a Glasgow eye.

**Architecture:** All sprites are procedurally generated in `src/scenes/BootScene.ts` using Phaser Graphics API. Each `create*()` method draws to a canvas and calls `generateTexture()`. Hitbox radii live in `src/entities/Enemy.ts:187-197` and must stay in sync with canvas sizes. No external assets — everything is code-drawn.

**Tech Stack:** Phaser 3 Graphics API (fillStyle, fillCircle, fillEllipse, fillRect, fillTriangle, lineStyle, lineBetween, strokeCircle, beginPath/arc/strokePath)

**Key constraint:** `pixelArt: true` rendering — no antialiasing. Shapes must read at small scale. Silhouette-first, then detail layers.

**Cultural north star:** Pure Glesga patter in visual form. Not surface-level Scottish theming — deep Glasgow humour. Every sprite should make a Glaswegian grin because they *get it*.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/scenes/BootScene.ts` | Modify (heavy) | All sprite generation — every `create*()` method |
| `src/entities/Enemy.ts:187-197` | Modify (light) | Hitbox radii — update any that change canvas size |
| `src/data/enemies.ts` | Read only | Verify texture keys match |

**No new files.** All changes are in BootScene.ts with hitbox sync in Enemy.ts.

---

## Task 1: Tourist — "The Absolute Roaster Who Packed For Marbella"

**Files:**
- Modify: `src/scenes/BootScene.ts:687-759` (`createTourist`)
- Verify: `src/entities/Enemy.ts:197` (default radius 20, canvas 48 — no change needed)

The tourist is currently a generic holidaymaker. Rework into a bewildered Glasgow tourist who clearly packed for Spain and ended up in Milngavie. Sunburned pink despite the rain, socks-and-sandals, bright BLUE cagoule (not yellow — yellow is hi-vis workwear; tourist cagoules are Regatta/Peter Storm blue or red), bumbag worn at the waist (classic tourist, not chest-worn streetwear style), oversized "I ♥ SCOTLAND" white plastic carrier bag, wide bewildered eyes (NOT sunglasses — this person is lost). Camera with selfie stick. The hat becomes a TARTAN bucket hat (the tat-shop kind tourists buy on Buchanan Street — tan/red tartan, not a plain outdoor hat). A Greggs bag poking out of a pocket (white paper bag with blue oval logo).

- [ ] **Step 1: Rewrite `createTourist` method**

Replace the entire method body (lines 687-759) with the new tourist. Canvas stays 48×48.

```typescript
private createTourist(): void {
    const s = 48;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // === Socks-and-sandals legs (the universal tourist crime) ===
    // White socks pulled up high
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(cx - 7, cy + 12, 5, 8);
    g.fillRect(cx + 2, cy + 12, 5, 8);
    // Sock ribbing
    g.fillStyle(0xcccccc, 1);
    g.fillRect(cx - 7, cy + 12, 5, 1);
    g.fillRect(cx + 2, cy + 12, 5, 1);
    // Sandal straps (brown)
    g.fillStyle(0x664422, 1);
    g.fillRect(cx - 8, cy + 18, 7, 2);
    g.fillRect(cx + 1, cy + 18, 7, 2);
    g.fillRect(cx - 6, cy + 17, 2, 4);
    g.fillRect(cx + 4, cy + 17, 2, 4);
    // Sunburned knees poking between shorts and socks
    g.fillStyle(0xee8877, 1);
    g.fillRect(cx - 7, cy + 10, 5, 3);
    g.fillRect(cx + 2, cy + 10, 5, 3);

    // === Cargo shorts (khaki, bulging pockets) ===
    g.fillStyle(0x887755, 1);
    g.fillRect(cx - 9, cy + 4, 18, 8);
    g.fillStyle(0xaa9966, 1);
    g.fillRect(cx - 8, cy + 5, 16, 6);
    // Pocket flaps
    g.fillStyle(0x887755, 1);
    g.fillRect(cx - 8, cy + 6, 6, 3);
    g.fillRect(cx + 3, cy + 6, 6, 3);
    // Greggs bag poking out of pocket (white paper bag, blue oval logo)
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(cx + 4, cy + 5, 4, 3);
    g.fillStyle(0x2244aa, 1); // blue Greggs logo oval
    g.fillEllipse(cx + 6, cy + 6, 2, 1.5);

    // === Bright blue cagoule (Regatta's finest — tourist armour against Glasgow weather) ===
    g.fillStyle(0x113388, 1); // dark outline
    g.fillRect(cx - 12, cy - 6, 24, 12);
    g.fillStyle(0x2255cc, 1); // bright royal blue — the Peter Storm special
    g.fillRect(cx - 11, cy - 5, 22, 10);
    // Nylon sheen highlight (crinkly cheap material)
    g.fillStyle(0x4477dd, 0.4);
    g.fillRect(cx - 8, cy - 4, 10, 3);
    // Zip line down center
    g.fillStyle(0x1144aa, 1);
    g.fillRect(cx, cy - 5, 1, 10);
    // Rain droplets on jacket (it's always raining)
    g.fillStyle(0xaaddff, 0.6);
    g.fillCircle(cx - 6, cy - 2, 0.7);
    g.fillCircle(cx + 4, cy + 1, 0.7);
    g.fillCircle(cx - 3, cy + 3, 0.7);

    // === Bumbag / fanny pack (the mark of the tourist) ===
    g.fillStyle(0x222222, 1);
    g.fillEllipse(cx, cy + 3, 14, 5);
    g.fillStyle(0x444444, 1);
    g.fillEllipse(cx, cy + 3, 12, 4);
    // Zip
    g.fillStyle(0xddaa00, 1);
    g.fillRect(cx - 1, cy + 2, 2, 1);

    // === Head (SUNBURNED despite clearly overcast sky) ===
    g.fillStyle(0xcc6644, 1); // outline — sunburn!
    g.fillCircle(cx, cy - 12, 9);
    g.fillStyle(0xee8866, 1); // pink-red sunburn skin
    g.fillCircle(cx, cy - 12, 8);
    // Peeling nose highlight
    g.fillStyle(0xff9977, 1);
    g.fillCircle(cx, cy - 10, 2);
    // Wide bewildered eyes (this person is LOST)
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 4, cy - 13, 3.5);
    g.fillCircle(cx + 4, cy - 13, 3.5);
    g.fillStyle(0x334455, 1);
    g.fillCircle(cx - 4, cy - 13, 2);
    g.fillCircle(cx + 4, cy - 13, 2);
    // Tiny pupils — the "where am I" stare
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - 4, cy - 13, 1);
    g.fillCircle(cx + 4, cy - 13, 1);
    // Worried eyebrows
    g.lineStyle(1.5, 0x884422, 1);
    g.lineBetween(cx - 7, cy - 16, cx - 3, cy - 17);
    g.lineBetween(cx + 7, cy - 16, cx + 3, cy - 17);
    // Open mouth (mild distress)
    g.fillStyle(0x993322, 1);
    g.fillEllipse(cx, cy - 8, 3, 2);

    // === Tartan bucket hat (the tat-shop special from Buchanan Street) ===
    // Brim (tartan fabric — tan/red check pattern)
    g.fillStyle(0x886644, 1);
    g.fillEllipse(cx, cy - 19, 22, 5);
    g.fillStyle(0xbb8855, 1);
    g.fillEllipse(cx, cy - 19, 20, 4);
    // Hat crown
    g.fillStyle(0x886644, 1);
    g.fillRect(cx - 8, cy - 24, 16, 6);
    g.fillStyle(0xbb8855, 1);
    g.fillRect(cx - 7, cy - 23, 14, 5);
    // Tartan check pattern on hat (red crossing lines)
    g.fillStyle(0xcc3322, 0.7);
    g.fillRect(cx - 7, cy - 21, 14, 1);
    g.fillRect(cx - 3, cy - 23, 1, 5);
    g.fillRect(cx + 3, cy - 23, 1, 5);
    // Sunburned ear tips poking below hat brim
    g.fillStyle(0xff7755, 1);
    g.fillCircle(cx - 10, cy - 16, 2);
    g.fillCircle(cx + 10, cy - 16, 2);

    // === "I ♥ SCOTLAND" shopping bag (hanging from arm) ===
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(cx + 12, cy - 2, 8, 10);
    g.fillStyle(0xffffff, 1);
    g.fillRect(cx + 13, cy - 1, 6, 8);
    // Heart (tiny red)
    g.fillStyle(0xff2222, 1);
    g.fillCircle(cx + 15, cy + 1, 1);
    g.fillCircle(cx + 17, cy + 1, 1);
    g.fillTriangle(cx + 14, cy + 2, cx + 18, cy + 2, cx + 16, cy + 4);
    // Bag handles
    g.lineStyle(1, 0xcccccc, 1);
    g.lineBetween(cx + 14, cy - 2, cx + 12, cy - 4);
    g.lineBetween(cx + 18, cy - 2, cx + 18, cy - 4);

    // === Selfie stick + phone (held up, blocking the view) ===
    g.fillStyle(0x666666, 1);
    g.fillRect(cx - 14, cy - 6, 2, 18); // stick
    g.fillStyle(0x222222, 1);
    g.fillRect(cx - 16, cy - 10, 5, 5); // phone
    g.fillStyle(0x4488cc, 0.8);
    g.fillRect(cx - 15, cy - 9, 3, 3); // screen glow

    g.generateTexture('tourist', s, s);
    g.destroy();
  }
```

- [ ] **Step 2: Run the dev server and verify the tourist sprite visually**

Run: `npm run dev`
Open browser, start a game, wait for tourists to spawn. Verify:
- Sunburned pink face reads clearly
- Yellow cagoule is the dominant color (silhouette reads as "yellow blob")
- Socks-and-sandals visible at bottom
- Shopping bag visible on right side
- Bewildered eyes distinct from other enemies

- [ ] **Step 3: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "art: tourist rework — sunburned roaster in cagoule, socks-and-sandals, Greggs bag, bewildered eyes"
```

---

## Task 2: Chef → Chippy Worker — "Salt n' Vinegar, Nae Sauce"

**Files:**
- Modify: `src/scenes/BootScene.ts:761-823` (`createChef`)

The French chef becomes a Glasgow chippy worker. Grease-stained paper hat (not a toque), oil-splattered apron, chip fork instead of cleaver, ruddy no-nonsense face, steam rising off them. This is someone who's been standing over a fryer since 6am and has zero patience for your order.

- [ ] **Step 1: Rewrite `createChef` method**

```typescript
private createChef(): void {
    const s = 48;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // === Legs (black work trousers, scuffed) ===
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(cx - 7, cy + 12, 5, 8);
    g.fillRect(cx + 2, cy + 12, 5, 8);
    // Work boots
    g.fillStyle(0x111111, 1);
    g.fillRect(cx - 8, cy + 18, 6, 3);
    g.fillRect(cx + 2, cy + 18, 6, 3);

    // === Grease-splattered apron over shirt ===
    // White apron (stained)
    g.fillStyle(0x999988, 1); // outline — yellowed from grease
    g.fillRect(cx - 10, cy - 4, 20, 18);
    g.fillStyle(0xddddcc, 1);
    g.fillRect(cx - 9, cy - 3, 18, 16);
    // Grease stains (brown/yellow splotches)
    g.fillStyle(0xaa8833, 0.6);
    g.fillCircle(cx - 4, cy + 2, 2.5);
    g.fillCircle(cx + 5, cy + 6, 2);
    g.fillStyle(0x886622, 0.5);
    g.fillCircle(cx + 2, cy + 1, 1.5);
    g.fillCircle(cx - 6, cy + 8, 1.5);
    // Apron strings tied at back (tiny)
    g.fillStyle(0xccccbb, 1);
    g.fillRect(cx - 11, cy - 1, 2, 1);
    g.fillRect(cx + 9, cy - 1, 2, 1);

    // === Arms (sleeves rolled up, beefy forearms) ===
    g.fillStyle(0xbb7755, 1);
    g.fillRect(cx - 14, cy - 2, 4, 6);
    g.fillRect(cx + 10, cy - 2, 4, 6);

    // === Head (ruddy, no-nonsense, been working since 6am) ===
    g.fillStyle(0xaa5533, 1);
    g.fillCircle(cx, cy - 10, 8);
    g.fillStyle(0xddaa88, 1);
    g.fillCircle(cx, cy - 10, 7);
    // Flushed cheeks (steam heat)
    g.fillStyle(0xee8866, 0.6);
    g.fillCircle(cx - 4, cy - 8, 2);
    g.fillCircle(cx + 4, cy - 8, 2);
    // Tired, narrowed eyes — seen it all
    g.fillStyle(0x111111, 1);
    g.fillRect(cx - 5, cy - 11, 4, 1.5);
    g.fillRect(cx + 1, cy - 11, 4, 1.5);
    // Heavy bags under eyes
    g.fillStyle(0x996644, 0.4);
    g.fillEllipse(cx - 3, cy - 9, 4, 1.5);
    g.fillEllipse(cx + 3, cy - 9, 4, 1.5);
    // Thin-lipped mouth — patience has run out
    g.fillStyle(0x884433, 1);
    g.fillRect(cx - 3, cy - 6, 6, 1);

    // === Paper chip-shop hat (soda-jerk fold — flat top, turned-up brim all round) ===
    // Flat top crown
    g.fillStyle(0xccccbb, 1);
    g.fillRect(cx - 8, cy - 20, 16, 4);
    g.fillStyle(0xeeeedd, 1);
    g.fillRect(cx - 7, cy - 19, 14, 3);
    // Turned-up brim all around (the distinctive fold)
    g.fillStyle(0xddddcc, 1);
    g.fillRect(cx - 9, cy - 16, 18, 3);
    g.fillStyle(0xeeeedd, 1);
    g.fillRect(cx - 8, cy - 16, 16, 2);
    // Paper fold crease line
    g.fillStyle(0xbbbbaa, 0.8);
    g.fillRect(cx - 8, cy - 17, 16, 1);
    // Grease spot on hat (of course)
    g.fillStyle(0xccbb99, 0.6);
    g.fillCircle(cx + 3, cy - 18, 1.5);

    // === Iconic: chip fork in one hand (pale cream wood, two flat broad tines) ===
    // Handle (pale unfinished wood — same width as the tines)
    g.fillStyle(0xddccaa, 1);
    g.fillRect(cx + 12, cy + 2, 2, 10);
    g.fillStyle(0xeeddbb, 1);
    g.fillRect(cx + 12, cy + 3, 2, 8);
    // Two flat broad tines (more like a tiny shovel split in two)
    g.fillStyle(0xddccaa, 1);
    g.fillRect(cx + 11, cy - 3, 2, 6);
    g.fillRect(cx + 14, cy - 3, 2, 6);
    g.fillStyle(0xeeddbb, 1);
    g.fillRect(cx + 11, cy - 2, 2, 4);
    g.fillRect(cx + 14, cy - 2, 2, 4);
    // Chip impaled on fork (golden, battered, proper chippy chip)
    g.fillStyle(0xddaa33, 1);
    g.fillRect(cx + 10, cy - 5, 7, 3);
    g.fillStyle(0xeebb44, 1);
    g.fillRect(cx + 11, cy - 4, 5, 1);

    // === Steam wisps rising (it's HOT in here) ===
    g.fillStyle(0xdddddd, 0.5);
    g.fillCircle(cx - 6, cy - 20, 2);
    g.fillCircle(cx + 2, cy - 22, 2.5);
    g.fillCircle(cx + 7, cy - 19, 2);

    g.generateTexture('chef', s, s);
    g.destroy();
  }
```

- [ ] **Step 2: Visual verify in dev server**

Start a game, wait for chefs to appear. Verify:
- Paper hat reads clearly (not a French toque)
- Grease stains visible on apron
- Chip fork with golden chip visible in hand
- Steam wisps rise above the sprite
- Reads as "chippy worker" not "fine dining"

- [ ] **Step 3: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "art: chef → chippy worker — paper hat, grease stains, chip fork, zero patience"
```

---

## Task 3: Haggis Hunter — "The Absolute Weapon Wi' Wellies"

**Files:**
- Modify: `src/scenes/BootScene.ts:1052-1113` (`createHaggisHunter`)

Keep the flat cap and net (they're perfect). Add green wellies, wax Barbour jacket with pocket flaps, binoculars around neck, hunched stalking posture. This person genuinely believes haggis run around hills (and in this game, they're RIGHT).

- [ ] **Step 1: Rewrite `createHaggisHunter` method**

```typescript
private createHaggisHunter(): void {
    const s = 48;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // === Green wellies (proper mucky ones) ===
    g.fillStyle(0x1a3a1a, 1);
    g.fillRect(cx - 8, cy + 10, 6, 10);
    g.fillRect(cx + 2, cy + 10, 6, 10);
    g.fillStyle(0x2a5522, 1);
    g.fillRect(cx - 7, cy + 11, 4, 8);
    g.fillRect(cx + 3, cy + 11, 4, 8);
    // Mud splashes on wellies
    g.fillStyle(0x554422, 0.7);
    g.fillCircle(cx - 6, cy + 18, 1.5);
    g.fillCircle(cx + 5, cy + 17, 1);
    g.fillCircle(cx - 4, cy + 16, 0.8);

    // === Wax Barbour jacket (the definitive countryside coat) ===
    g.fillStyle(0x1a2a11, 1); // outline
    g.fillRect(cx - 12, cy - 6, 24, 18);
    g.fillStyle(0x2d4a22, 1);
    g.fillRect(cx - 11, cy - 5, 22, 16);
    // Wax sheen highlight
    g.fillStyle(0x3a5a2a, 0.6);
    g.fillRect(cx - 10, cy - 4, 20, 3);
    // Pocket flaps (two big ones, proper Barbour)
    g.fillStyle(0x1a3311, 1);
    g.fillRect(cx - 10, cy + 2, 8, 4);
    g.fillRect(cx + 2, cy + 2, 8, 4);
    // Pocket button
    g.fillStyle(0x886633, 1);
    g.fillCircle(cx - 6, cy + 3, 0.8);
    g.fillCircle(cx + 6, cy + 3, 0.8);
    // Corduroy collar (brown)
    g.fillStyle(0x664422, 1);
    g.fillRect(cx - 8, cy - 6, 16, 2);

    // === Binoculars around neck ===
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - 3, cy - 1, 2.5);
    g.fillCircle(cx + 3, cy - 1, 2.5);
    g.fillStyle(0x333333, 1);
    g.fillCircle(cx - 3, cy - 1, 1.8);
    g.fillCircle(cx + 3, cy - 1, 1.8);
    // Lens glint
    g.fillStyle(0x88ccff, 0.7);
    g.fillCircle(cx - 3, cy - 2, 0.6);
    g.fillCircle(cx + 3, cy - 2, 0.6);
    // Strap
    g.lineStyle(1, 0x333333, 0.8);
    g.lineBetween(cx - 3, cy - 3, cx - 4, cy - 6);
    g.lineBetween(cx + 3, cy - 3, cx + 4, cy - 6);

    // === Head (weather-beaten, determined, slightly mad) ===
    g.fillStyle(0x885533, 1);
    g.fillCircle(cx, cy - 12, 8);
    g.fillStyle(0xddaa77, 1);
    g.fillCircle(cx, cy - 12, 7);
    // Squinting eyes (been staring at hillsides for hours)
    g.fillStyle(0x111111, 1);
    g.fillRect(cx - 5, cy - 13, 3, 1.5);
    g.fillRect(cx + 2, cy - 13, 3, 1.5);
    // Crow's feet wrinkles
    g.lineStyle(0.8, 0xaa7744, 0.6);
    g.lineBetween(cx - 6, cy - 14, cx - 8, cy - 15);
    g.lineBetween(cx + 6, cy - 14, cx + 8, cy - 15);
    // Ruddy windburned cheeks
    g.fillStyle(0xcc7755, 0.5);
    g.fillCircle(cx - 4, cy - 10, 2);
    g.fillCircle(cx + 4, cy - 10, 2);
    // Stubble (heavier — been out on the moors for days)
    g.fillStyle(0x554433, 0.7);
    g.fillRect(cx - 5, cy - 9, 10, 3);

    // === Flat cap (iconic — proper tweed) ===
    g.fillStyle(0x3a3322, 1);
    g.fillRect(cx - 10, cy - 20, 20, 6);
    g.fillStyle(0x5a5533, 1);
    g.fillRect(cx - 9, cy - 19, 18, 4);
    // Tweed texture flecks
    g.fillStyle(0x4a4422, 0.7);
    g.fillCircle(cx - 5, cy - 18, 0.5);
    g.fillCircle(cx + 2, cy - 17, 0.5);
    g.fillCircle(cx + 6, cy - 18, 0.5);
    // Cap brim (jutting forward)
    g.fillStyle(0x3a3322, 1);
    g.fillRect(cx - 12, cy - 15, 14, 2);

    // === Iconic: big haggis net on a pole ===
    g.fillStyle(0x664411, 1); // pole
    g.fillRect(cx + 13, cy - 14, 2, 22);
    // Net hoop
    g.lineStyle(2, 0x333322, 1);
    g.strokeCircle(cx + 19, cy - 16, 7);
    g.lineStyle(1, 0x998866, 0.8);
    g.strokeCircle(cx + 19, cy - 16, 6);
    // Net mesh (criss-cross)
    g.lineStyle(0.8, 0x998866, 0.5);
    g.lineBetween(cx + 13, cy - 16, cx + 25, cy - 16);
    g.lineBetween(cx + 19, cy - 22, cx + 19, cy - 10);
    g.lineBetween(cx + 14, cy - 20, cx + 24, cy - 12);
    g.lineBetween(cx + 14, cy - 12, cx + 24, cy - 20);

    g.generateTexture('haggis_hunter', s, s);
    g.destroy();
  }
```

- [ ] **Step 2: Visual verify**
- [ ] **Step 3: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "art: haggis hunter — Barbour jacket, wellies, binoculars, proper tweed flat cap"
```

---

## Task 4: Angry Scotsman — "Pure Aerated, Buckfast In Hand"

**Files:**
- Modify: `src/scenes/BootScene.ts:1115-1187` (`createAngryScotsman`)

Barrel-chested, thick-necked, MASSIVE red beard, Buckfast bottle in one hand (dark green glass, cream/off-white label with gold border — the real Bucky), proper Royal Stewart tartan kilt with more detail, one sock fallen down, visible forehead veins, V-neck sunburn (pale chest, lobster-red at collar line — "taps aff" consequence), sgian-dubh handle poking from right sock, kilt pin on front apron. This man is BEELIN'.

- [ ] **Step 1: Rewrite `createAngryScotsman` method**

```typescript
private createAngryScotsman(): void {
    const s = 52;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // === Legs (bare, muscular, one sock fallen) ===
    g.fillStyle(0xcc7755, 1);
    g.fillRect(cx - 8, cy + 13, 6, 9);
    g.fillRect(cx + 2, cy + 13, 6, 9);
    // Right sock up properly
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(cx + 2, cy + 19, 6, 4);
    // Left sock fallen down around ankle (the authentic touch)
    g.fillStyle(0xdddddd, 0.8);
    g.fillRect(cx - 8, cy + 20, 6, 3);
    g.fillStyle(0xcccccc, 1);
    g.fillEllipse(cx - 5, cy + 21, 7, 3);

    // === Royal Stewart tartan kilt (PROPER red tartan) ===
    // Base red
    g.fillStyle(0x881111, 1);
    g.fillRect(cx - 13, cy + 1, 26, 14);
    g.fillStyle(0xcc2222, 1);
    g.fillRect(cx - 12, cy + 2, 24, 12);
    // Green crossing stripes (Royal Stewart)
    g.fillStyle(0x114411, 0.8);
    g.fillRect(cx - 12, cy + 4, 24, 2);
    g.fillRect(cx - 12, cy + 10, 24, 2);
    g.fillRect(cx - 8, cy + 2, 2, 12);
    g.fillRect(cx + 2, cy + 2, 2, 12);
    // Blue accent lines
    g.fillStyle(0x2244aa, 0.7);
    g.fillRect(cx - 12, cy + 7, 24, 1);
    g.fillRect(cx - 3, cy + 2, 1, 12);
    g.fillRect(cx + 7, cy + 2, 1, 12);
    // White pinstripes
    g.fillStyle(0xffffff, 0.4);
    g.fillRect(cx - 12, cy + 3, 24, 1);
    g.fillRect(cx - 12, cy + 12, 24, 1);
    // Kilt pin
    g.fillStyle(0xcccccc, 1);
    g.fillCircle(cx + 8, cy + 8, 1);

    // === Bare barrel chest (sleeveless — "taps aff" energy) ===
    g.fillStyle(0xaa5533, 1);
    g.fillRect(cx - 12, cy - 8, 24, 10);
    g.fillStyle(0xddbb99, 1); // pale torso (Scottish pale)
    g.fillRect(cx - 11, cy - 7, 22, 8);
    // V-neck sunburn line (lobster-red at collar, white below — the taps-aff tan)
    g.fillStyle(0xee6644, 0.6);
    g.fillTriangle(cx - 6, cy - 7, cx + 6, cy - 7, cx, cy - 3);
    // Chest hair (wee tufts)
    g.fillStyle(0x883311, 0.5);
    g.fillCircle(cx - 2, cy - 4, 1.5);
    g.fillCircle(cx + 2, cy - 3, 1.5);
    g.fillCircle(cx, cy - 5, 1);

    // === Head (thick neck, pure fury) ===
    // Thick neck
    g.fillStyle(0xcc6644, 1);
    g.fillRect(cx - 5, cy - 10, 10, 4);
    g.fillStyle(0xdd8866, 1);
    g.fillRect(cx - 4, cy - 9, 8, 3);
    // Head
    g.fillStyle(0xaa5533, 1);
    g.fillCircle(cx, cy - 15, 10);
    g.fillStyle(0xdd8866, 1);
    g.fillCircle(cx, cy - 15, 9);
    // FOREHEAD VEINS (this man is pure aerated)
    g.lineStyle(0.8, 0xcc5533, 0.7);
    g.lineBetween(cx - 4, cy - 22, cx - 6, cy - 19);
    g.lineBetween(cx + 3, cy - 23, cx + 5, cy - 20);
    // Flushed red face
    g.fillStyle(0xee7755, 0.4);
    g.fillCircle(cx, cy - 14, 7);

    // === MASSIVE red beard (the absolute unit) ===
    g.fillStyle(0x771100, 1);
    g.fillEllipse(cx, cy - 8, 20, 12);
    g.fillStyle(0xbb3311, 1);
    g.fillEllipse(cx, cy - 8, 18, 10);
    g.fillStyle(0xdd5522, 1);
    g.fillEllipse(cx, cy - 9, 16, 8);
    // Beard wisps hanging down
    g.fillStyle(0x881100, 1);
    g.fillRect(cx - 7, cy - 3, 2, 4);
    g.fillRect(cx - 3, cy - 2, 2, 5);
    g.fillRect(cx + 1, cy - 3, 2, 4);
    g.fillRect(cx + 5, cy - 2, 2, 5);
    // Beard braid (wee detail)
    g.fillStyle(0x992211, 1);
    g.fillRect(cx, cy - 1, 2, 3);
    g.fillStyle(0xddaa00, 1);
    g.fillCircle(cx + 1, cy + 2, 0.8); // tiny gold bead

    // === Furious eyebrows (THICK, angled down hard) ===
    g.fillStyle(0x661100, 1);
    g.fillTriangle(cx - 9, cy - 19, cx - 2, cy - 17, cx - 2, cy - 19);
    g.fillTriangle(cx + 9, cy - 19, cx + 2, cy - 17, cx + 2, cy - 19);

    // === Eyes (tiny, narrowed, RAGING) ===
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 4, cy - 16, 2);
    g.fillCircle(cx + 4, cy - 16, 2);
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - 4, cy - 16, 1);
    g.fillCircle(cx + 4, cy - 16, 1);

    // === Iconic: Buckfast bottle in hand (dark green glass, cream label, gold foil neck) ===
    // Dark green glass bottle (wine bottle silhouette — slender neck, rounded shoulders)
    g.fillStyle(0x0a2a0a, 1);
    g.fillRect(cx + 13, cy - 4, 5, 12);
    g.fillStyle(0x1a4418, 1);
    g.fillRect(cx + 14, cy - 3, 3, 10);
    // Cream/off-white label with gold border (the real Bucky label)
    g.fillStyle(0xddaa44, 1); // gold border
    g.fillRect(cx + 13, cy - 1, 5, 5);
    g.fillStyle(0xeeddbb, 1); // cream label
    g.fillRect(cx + 14, cy, 3, 3);
    // Slender bottle neck
    g.fillStyle(0x0a2a0a, 1);
    g.fillRect(cx + 15, cy - 7, 2, 4);
    // Gold foil capsule on neck (authentic detail)
    g.fillStyle(0xccaa22, 1);
    g.fillRect(cx + 14, cy - 8, 4, 2);
    // Screw cap
    g.fillStyle(0xddbb33, 1);
    g.fillRect(cx + 15, cy - 9, 2, 1);

    // === Sgian-dubh handle poking from right sock (Highland dress knife) ===
    g.fillStyle(0x111111, 1);
    g.fillRect(cx + 4, cy + 19, 2, 3);
    // Round pommel stone (amber/cairngorm)
    g.fillStyle(0xcc8833, 1);
    g.fillCircle(cx + 5, cy + 19, 1);

    // === Kilt pin (lower right of front apron) ===
    g.fillStyle(0xcccccc, 1);
    g.fillCircle(cx + 9, cy + 9, 1);
    g.fillStyle(0xeeeeee, 1);
    g.fillCircle(cx + 9, cy + 9, 0.5);

    g.generateTexture('angry_scotsman', s, s);
    g.destroy();
  }
```

- [ ] **Step 2: Visual verify**
- [ ] **Step 3: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "art: angry scotsman — barrel chest, Buckfast in hand, forehead veins, Royal Stewart tartan, pure aerated"
```

---

## Task 5: Piper — "Cheeks Like A Space Hopper"

**Files:**
- Modify: `src/scenes/BootScene.ts:1812-1896` (`createPiper`)

Military pipe-band doublet (dark navy, gold lace braiding) with silver buttons, full dress sporran (white horsehair base, silver cantle arch, black tassels), tam o'shanter with diced red/white border band and bigger red toorie pom-pom, face going RED from blowing, cheeks massively puffed, tartan on the bagpipe bag, drone pipes with ivory ferrules. The hose (socks) get red flashes at the knee fold.

- [ ] **Step 1: Rewrite `createPiper` method**

```typescript
private createPiper(): void {
    const s = 48;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // === Legs (hose/socks with diamond kilt-hose pattern) ===
    g.fillStyle(0x111111, 1);
    g.fillRect(cx - 7, cy + 12, 5, 8);
    g.fillRect(cx + 2, cy + 12, 5, 8);
    // Diamond pattern on hose
    g.fillStyle(0xeeeeee, 0.5);
    g.fillTriangle(cx - 5, cy + 14, cx - 4, cy + 16, cx - 6, cy + 16);
    g.fillTriangle(cx + 4, cy + 14, cx + 5, cy + 16, cx + 3, cy + 16);
    // Flashes (ribbons at top of socks)
    g.fillStyle(0xcc0000, 1);
    g.fillRect(cx - 7, cy + 12, 5, 1);
    g.fillRect(cx + 2, cy + 12, 5, 1);

    // === Kilt (pipe-band tartan — darker, more formal) ===
    g.fillStyle(0x001a44, 1);
    g.fillRect(cx - 10, cy + 2, 20, 12);
    g.fillStyle(0x003366, 1);
    g.fillRect(cx - 9, cy + 3, 18, 10);
    // Tartan pattern
    g.fillStyle(0x004488, 0.8);
    g.fillRect(cx - 9, cy + 6, 18, 1);
    g.fillRect(cx - 9, cy + 10, 18, 1);
    g.fillRect(cx - 4, cy + 3, 1, 10);
    g.fillRect(cx + 4, cy + 3, 1, 10);
    g.fillStyle(0x2266aa, 0.5);
    g.fillRect(cx - 9, cy + 8, 18, 1);

    // === Full dress sporran (white horsehair, silver cantle, black tassels) ===
    // Chrome chain across hips (catches the light)
    g.lineStyle(1, 0xcccccc, 0.9);
    g.lineBetween(cx - 7, cy + 3, cx + 7, cy + 3);
    // White horsehair body
    g.fillStyle(0xdddddd, 1);
    g.fillEllipse(cx, cy + 6, 8, 6);
    g.fillStyle(0xeeeeee, 1);
    g.fillEllipse(cx, cy + 6, 6, 5);
    // Hair texture lines
    g.fillStyle(0xcccccc, 0.6);
    g.fillRect(cx - 2, cy + 4, 1, 4);
    g.fillRect(cx + 1, cy + 5, 1, 3);
    // Silver cantle (the ornate metal arch at the top)
    g.fillStyle(0x888899, 1);
    g.fillEllipse(cx, cy + 3, 8, 3);
    g.fillStyle(0xaaaabb, 1);
    g.fillEllipse(cx, cy + 3, 6, 2);
    // Celtic knotwork detail on cantle (tiny dots)
    g.fillStyle(0xccccdd, 0.8);
    g.fillCircle(cx - 2, cy + 3, 0.5);
    g.fillCircle(cx, cy + 3, 0.5);
    g.fillCircle(cx + 2, cy + 3, 0.5);
    // Black tassels (3, hanging from bottom)
    g.fillStyle(0x111111, 1);
    g.fillRect(cx - 2, cy + 8, 1, 4);
    g.fillRect(cx, cy + 8, 1, 4);
    g.fillRect(cx + 2, cy + 8, 1, 4);
    // Tassel tips
    g.fillCircle(cx - 2, cy + 12, 0.8);
    g.fillCircle(cx, cy + 12, 0.8);
    g.fillCircle(cx + 2, cy + 12, 0.8);

    // === Military pipe-band doublet (dark with silver buttons) ===
    g.fillStyle(0x0a0a1a, 1);
    g.fillRect(cx - 10, cy - 6, 20, 10);
    g.fillStyle(0x222244, 1);
    g.fillRect(cx - 9, cy - 5, 18, 8);
    // Silver buttons (proper military row)
    g.fillStyle(0xcccccc, 1);
    g.fillCircle(cx - 2, cy - 3, 0.8);
    g.fillCircle(cx - 2, cy, 0.8);
    g.fillCircle(cx + 2, cy - 3, 0.8);
    g.fillCircle(cx + 2, cy, 0.8);
    // Shoulder epaulettes
    g.fillStyle(0xdddd00, 0.8);
    g.fillRect(cx - 10, cy - 6, 3, 2);
    g.fillRect(cx + 7, cy - 6, 3, 2);

    // === Head (GOING RED from blowing, cheeks like space hoppers) ===
    g.fillStyle(0xcc5533, 1);
    g.fillCircle(cx, cy - 12, 8);
    g.fillStyle(0xee7755, 1); // red-faced — EFFORT
    g.fillCircle(cx, cy - 12, 7);
    // Massively puffed cheeks
    g.fillStyle(0xff8866, 1);
    g.fillCircle(cx - 7, cy - 10, 3);
    g.fillCircle(cx + 7, cy - 10, 3);
    g.fillStyle(0xffaa88, 0.8);
    g.fillCircle(cx - 7, cy - 11, 1.5);
    g.fillCircle(cx + 7, cy - 11, 1.5);
    // Strained eyes (bulging slightly from effort)
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 3, cy - 14, 1.8);
    g.fillCircle(cx + 3, cy - 14, 1.8);
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - 3, cy - 14, 0.8);
    g.fillCircle(cx + 3, cy - 14, 0.8);
    // Sweat bead
    g.fillStyle(0xaaddff, 0.8);
    g.fillCircle(cx + 6, cy - 15, 0.8);

    // === Tam o'shanter (diced border, regimental badge, big red toorie) ===
    g.fillStyle(0x001133, 1);
    g.fillEllipse(cx, cy - 19, 16, 5);
    g.fillStyle(0x002255, 1);
    g.fillEllipse(cx, cy - 20, 14, 4);
    // Diced border band (red/white checkerboard — the proper military detail)
    g.fillStyle(0xcc0000, 1);
    g.fillRect(cx - 7, cy - 18, 2, 1);
    g.fillRect(cx - 3, cy - 18, 2, 1);
    g.fillRect(cx + 1, cy - 18, 2, 1);
    g.fillRect(cx + 5, cy - 18, 2, 1);
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(cx - 5, cy - 18, 2, 1);
    g.fillRect(cx - 1, cy - 18, 2, 1);
    g.fillRect(cx + 3, cy - 18, 2, 1);
    // Regimental badge (left front)
    g.fillStyle(0xddaa00, 1);
    g.fillCircle(cx - 3, cy - 20, 1.5);
    g.fillStyle(0xffcc22, 1);
    g.fillCircle(cx - 3, cy - 20, 0.8);
    // Big red toorie pom-pom (the crowning glory)
    g.fillStyle(0x990000, 1);
    g.fillCircle(cx + 5, cy - 23, 3.5);
    g.fillStyle(0xcc1111, 1);
    g.fillCircle(cx + 5, cy - 23, 3);
    g.fillStyle(0xee3333, 0.7);
    g.fillCircle(cx + 4, cy - 24, 1.5);

    // === BAGPIPES (the main event — big tartan bag under arm) ===
    // Bag — tartan-covered, pressed under left arm
    g.fillStyle(0x002244, 1);
    g.fillEllipse(cx - 14, cy, 16, 14);
    g.fillStyle(0x114466, 1);
    g.fillEllipse(cx - 14, cy, 14, 12);
    // Tartan on bag
    g.fillStyle(0x003366, 0.8);
    g.fillRect(cx - 20, cy - 2, 12, 1);
    g.fillRect(cx - 20, cy + 2, 12, 1);
    g.fillRect(cx - 16, cy - 5, 1, 10);
    g.fillRect(cx - 12, cy - 5, 1, 10);

    // Drone pipes (three, sticking up with gold ferrules)
    g.fillStyle(0x1a1100, 1);
    g.fillRect(cx - 19, cy - 16, 2, 18);
    g.fillRect(cx - 15, cy - 18, 2, 20);
    g.fillRect(cx - 11, cy - 16, 2, 18);
    g.fillStyle(0x443300, 1);
    g.fillRect(cx - 19, cy - 15, 1, 17);
    g.fillRect(cx - 15, cy - 17, 1, 19);
    g.fillRect(cx - 11, cy - 15, 1, 17);
    // Gold ferrule caps
    g.fillStyle(0xddaa00, 1);
    g.fillRect(cx - 20, cy - 17, 4, 2);
    g.fillRect(cx - 16, cy - 19, 4, 2);
    g.fillRect(cx - 12, cy - 17, 4, 2);
    // Gold ferrule rings (mid-pipe)
    g.fillStyle(0xccaa00, 0.8);
    g.fillRect(cx - 20, cy - 8, 4, 1);
    g.fillRect(cx - 16, cy - 8, 4, 1);
    g.fillRect(cx - 12, cy - 8, 4, 1);

    // Blowpipe (to mouth)
    g.fillStyle(0x1a1100, 1);
    g.fillRect(cx - 8, cy - 12, 6, 2);

    g.generateTexture('piper', s, s);
    g.destroy();
  }
```

- [ ] **Step 2: Visual verify**
- [ ] **Step 3: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "art: piper — military doublet, sporran, space-hopper cheeks, tartan bag, gold ferrules"
```

---

## Task 6: Sheep — "The Psycho Hill Sheep"

**Files:**
- Modify: `src/scenes/BootScene.ts:1898-1949` (`createSheep`)

Keep the creepy yellow eyes — they're perfect. Add: DRAMATIC CURLING RAM'S HORNS (Blackface rams have huge horns that curve outward and back — this is a massive visual miss in the current sprite), dirtier matted wool (these are Scottish Blackface hill sheep), manic grin with horizontal SLIT PUPILS (sheep have rectangular pupils — genuinely unsettling), one ear flopped, thistle stuck in wool. These sheep have survived Highland winters and they're harder than you.

- [ ] **Step 1: Rewrite `createSheep` method**

```typescript
private createSheep(): void {
    const s = 36;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // === Wool body (matted, dirty — these are hill sheep) ===
    // Outer wool outline (grayish-cream, slightly dirty)
    g.fillStyle(0x999988, 1);
    g.fillEllipse(cx, cy, 28, 20);
    // Cloud-shaped wool body (overlapping lumps — matted)
    g.fillStyle(0xddddcc, 1);
    g.fillCircle(cx - 8, cy, 7);
    g.fillCircle(cx - 2, cy - 3, 8);
    g.fillCircle(cx + 4, cy - 2, 7);
    g.fillCircle(cx + 8, cy + 1, 6);
    g.fillCircle(cx - 6, cy + 3, 6);
    g.fillCircle(cx + 2, cy + 4, 6);
    // Dirty patches (mud, grass stains — been on the hills)
    g.fillStyle(0xbbbb99, 0.6);
    g.fillCircle(cx - 5, cy + 4, 3);
    g.fillCircle(cx + 6, cy + 3, 2.5);
    g.fillStyle(0xaaaa88, 0.4);
    g.fillCircle(cx - 8, cy + 2, 2);
    // Wool highlights (the cleaner bits on top)
    g.fillStyle(0xeeeedd, 1);
    g.fillCircle(cx - 4, cy - 4, 4);
    g.fillCircle(cx + 3, cy - 3, 4);

    // === Thistle stuck in the wool (wee purple tuft) ===
    g.fillStyle(0x9966cc, 1);
    g.fillCircle(cx - 10, cy - 3, 1.5);
    g.fillStyle(0xbb88ee, 1);
    g.fillCircle(cx - 10, cy - 3, 0.8);
    // Thistle stem
    g.fillStyle(0x336622, 1);
    g.fillRect(cx - 10, cy - 2, 1, 3);

    // === Legs (stumpy, sturdy — hill-bred) ===
    g.fillStyle(0x111111, 1);
    g.fillRect(cx - 8, cy + 8, 3, 5);
    g.fillRect(cx - 3, cy + 8, 3, 5);
    g.fillRect(cx + 2, cy + 8, 3, 5);
    g.fillRect(cx + 7, cy + 8, 3, 5);
    // Muddy hooves
    g.fillStyle(0x332211, 0.7);
    g.fillRect(cx - 8, cy + 12, 3, 1);
    g.fillRect(cx + 7, cy + 12, 3, 1);

    // === Head (Scottish Blackface — iconic black face) ===
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx + 11, cy - 1, 6);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(cx + 11, cy - 1, 5);
    // White blaze down nose (Blackface marking)
    g.fillStyle(0xddddcc, 0.7);
    g.fillRect(cx + 10, cy - 2, 2, 4);

    // === DRAMATIC CURLING RAM'S HORNS (the iconic Blackface feature!) ===
    // Left horn — sweeps outward and back in a curl
    g.fillStyle(0x887755, 1);
    g.fillTriangle(cx + 6, cy - 4, cx + 2, cy - 9, cx + 4, cy - 2);
    g.fillStyle(0xaa9966, 1);
    g.fillTriangle(cx + 6, cy - 4, cx + 3, cy - 8, cx + 5, cy - 3);
    // Horn ridges (growth rings)
    g.fillStyle(0x776644, 0.6);
    g.fillRect(cx + 4, cy - 6, 2, 1);
    // Right horn — mirrored, sweeps the other way
    g.fillStyle(0x887755, 1);
    g.fillTriangle(cx + 16, cy - 4, cx + 20, cy - 9, cx + 18, cy - 2);
    g.fillStyle(0xaa9966, 1);
    g.fillTriangle(cx + 16, cy - 4, cx + 19, cy - 8, cx + 17, cy - 3);
    // Horn ridges
    g.fillStyle(0x776644, 0.6);
    g.fillRect(cx + 17, cy - 6, 2, 1);

    // === Ears (one up, one flopped — personality, between the horns) ===
    // Left ear — UP (alert)
    g.fillStyle(0x000000, 1);
    g.fillTriangle(cx + 8, cy - 7, cx + 10, cy - 4, cx + 6, cy - 4);
    // Right ear — FLOPPED (couldn't be bothered)
    g.fillStyle(0x000000, 1);
    g.fillTriangle(cx + 14, cy - 4, cx + 16, cy - 2, cx + 13, cy - 1);

    // === Creepy yellow eyes (THE signature — unblinking, knowing) ===
    g.fillStyle(0xffdd00, 1);
    g.fillCircle(cx + 10, cy - 2, 1.8);
    g.fillCircle(cx + 13, cy - 2, 1.8);
    // Horizontal slit pupils (goat/sheep pupils — unsettling)
    g.fillStyle(0x000000, 1);
    g.fillRect(cx + 9, cy - 2, 2, 1);
    g.fillRect(cx + 12, cy - 2, 2, 1);

    // === Manic grin (too many teeth, too much intent) ===
    g.fillStyle(0x444444, 1);
    g.fillRect(cx + 12, cy + 2, 4, 2);
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(cx + 12, cy + 2, 1, 1);
    g.fillRect(cx + 14, cy + 2, 1, 1);
    g.fillRect(cx + 13, cy + 3, 1, 1);

    g.generateTexture('sheep', s, s);
    g.destroy();
  }
```

- [ ] **Step 2: Visual verify**
- [ ] **Step 3: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "art: sheep — Blackface hill sheep, matted wool, horizontal slit pupils, manic grin, thistle in fleece"
```

---

## Task 7: Ghost → Castle Ghost — "A Wee Wail Frae The Vaults"

**Files:**
- Modify: `src/scenes/BootScene.ts:1951-1995` (`createGhost`)

Edinburgh vault / Glasgow cathedral ghost energy. Trailing tartan sash, ghostly blue-green palette, chain links on one wrist, French hood headpiece (Mary Queen of Scots nod — crescent-shaped black velvet sitting back on the head with white linen undercap visible at forehead), the wailing O-mouth stays.

- [ ] **Step 1: Rewrite `createGhost` method**

```typescript
private createGhost(): void {
    const s = 40;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // === Ethereal ghost body (blue-green, translucent layers) ===
    g.fillStyle(0x668888, 0.35);
    g.fillEllipse(cx, cy - 2, 30, 28);
    g.fillStyle(0x88aaaa, 0.5);
    g.fillEllipse(cx, cy - 2, 26, 24);
    g.fillStyle(0xaacccc, 0.45);
    g.fillEllipse(cx - 2, cy - 4, 20, 18);

    // === Trailing tartan sash (ghostly, faded) ===
    g.fillStyle(0x334466, 0.4);
    g.fillRect(cx - 4, cy - 8, 8, 20);
    g.fillStyle(0x446688, 0.3);
    g.fillRect(cx - 3, cy - 7, 6, 18);
    // Faded tartan lines
    g.fillStyle(0x556688, 0.3);
    g.fillRect(cx - 3, cy - 3, 6, 1);
    g.fillRect(cx - 3, cy + 3, 6, 1);
    g.fillRect(cx - 1, cy - 7, 1, 18);

    // === Wavy ghost-tail bottom (iconic wispy edge) ===
    g.fillStyle(0x88aaaa, 0.5);
    for (let i = 0; i < 5; i++) {
      g.fillCircle(cx - 12 + i * 6, cy + 10, 5);
    }
    g.fillStyle(0xaacccc, 0.4);
    for (let i = 0; i < 5; i++) {
      g.fillCircle(cx - 12 + i * 6, cy + 9, 4);
    }

    // === Chain links dangling from wrist (castle dungeon ghost) ===
    g.lineStyle(1.5, 0x8899aa, 0.6);
    g.strokeCircle(cx + 10, cy + 4, 2);
    g.strokeCircle(cx + 12, cy + 7, 2);
    g.strokeCircle(cx + 10, cy + 10, 2);

    // === French hood (Mary Queen of Scots — crescent-shaped black velvet) ===
    // The hood sits back on the head — a wide crescent/arc shape
    g.fillStyle(0x222233, 0.6); // dark velvet (ghostly, faded)
    g.fillEllipse(cx, cy - 12, 18, 6);
    // The crescent curve (the distinctive French hood silhouette)
    g.fillStyle(0x1a1a2a, 0.7);
    g.fillEllipse(cx, cy - 13, 16, 4);
    // White linen undercap (visible at forehead — the key detail)
    g.fillStyle(0xbbccdd, 0.5);
    g.fillRect(cx - 5, cy - 11, 10, 2);
    g.fillStyle(0xccddee, 0.4);
    g.fillRect(cx - 4, cy - 11, 8, 1);

    // === Hollow eye sockets (glowing ethereal blue-green) ===
    g.fillStyle(0x000000, 0.9);
    g.fillCircle(cx - 5, cy - 6, 4);
    g.fillCircle(cx + 5, cy - 6, 4);
    g.fillStyle(0x44ddaa, 1);
    g.fillCircle(cx - 5, cy - 6, 2.2);
    g.fillCircle(cx + 5, cy - 6, 2.2);
    g.fillStyle(0xaaffdd, 1);
    g.fillCircle(cx - 5, cy - 7, 0.8);
    g.fillCircle(cx + 5, cy - 7, 0.8);

    // === Wailing O-mouth ===
    g.fillStyle(0x000000, 0.9);
    g.fillEllipse(cx, cy + 2, 6, 6);
    g.fillStyle(0x1a3344, 1);
    g.fillEllipse(cx, cy + 2, 4, 4);

    g.generateTexture('ghost', s, s);
    g.destroy();
  }
```

- [ ] **Step 2: Visual verify**
- [ ] **Step 3: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "art: ghost — castle vault spectre, tartan sash, dungeon chains, spectral crown, blue-green glow"
```

---

## Task 8: Deep Fryer → Chippy Fryer — "Mars Bar Deep Fried To Perfection"

**Files:**
- Modify: `src/scenes/BootScene.ts:2137-2195` (`createDeepFryer`)

Add a battered mars bar visible in the oil, more aggressive bubbling, salt shaker and vinegar bottle flanking, grease-spatter orange warning glow. Peak Glasgow chippy culture.

- [ ] **Step 1: Rewrite `createDeepFryer` method**

```typescript
private createDeepFryer(): void {
    const s = 48;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 2;

    // === Metal vat (chunkier, more industrial) ===
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(cx - 18, cy - 6, 36, 22);
    g.fillStyle(0x555555, 1);
    g.fillRect(cx - 17, cy - 5, 34, 20);
    g.fillStyle(0x777777, 1);
    g.fillRect(cx - 16, cy - 4, 32, 4);
    // Rim (thick, greasy)
    g.fillStyle(0x444444, 1);
    g.fillRect(cx - 18, cy - 8, 36, 3);
    g.fillStyle(0x999999, 1);
    g.fillRect(cx - 18, cy - 7, 36, 1);
    // Handles
    g.fillStyle(0x222222, 1);
    g.fillRect(cx - 22, cy - 5, 5, 3);
    g.fillRect(cx + 17, cy - 5, 5, 3);

    // === Bubbling oil (VOLCANIC) ===
    g.fillStyle(0x774400, 1);
    g.fillRect(cx - 15, cy - 3, 30, 16);
    g.fillStyle(0xbb7700, 1);
    g.fillRect(cx - 14, cy - 2, 28, 14);
    g.fillStyle(0xdd9922, 1);
    g.fillRect(cx - 13, cy - 1, 26, 2);
    // AGGRESSIVE bubbles (this oil is RAGING)
    g.fillStyle(0xffdd44, 1);
    g.fillCircle(cx - 9, cy + 1, 2.5);
    g.fillCircle(cx + 5, cy + 3, 2.5);
    g.fillCircle(cx + 11, cy, 2);
    g.fillCircle(cx - 3, cy + 7, 2.5);
    g.fillCircle(cx - 11, cy + 5, 1.8);
    g.fillCircle(cx + 8, cy + 8, 1.5);
    g.fillCircle(cx + 1, cy + 1, 1.8);
    g.fillStyle(0xffffcc, 0.9);
    g.fillCircle(cx - 9, cy, 1.2);
    g.fillCircle(cx + 5, cy + 2, 1.2);
    g.fillCircle(cx - 3, cy + 6, 1.2);
    g.fillCircle(cx + 1, cy, 1);

    // === Battered Mars bar (the crown jewel of Glasgow cuisine) ===
    // Golden batter coating
    g.fillStyle(0xaa7711, 1);
    g.fillRect(cx - 6, cy + 2, 12, 5);
    g.fillStyle(0xcc9922, 1);
    g.fillRect(cx - 5, cy + 3, 10, 3);
    // Batter texture bumps
    g.fillStyle(0xddaa33, 0.7);
    g.fillCircle(cx - 3, cy + 3, 0.8);
    g.fillCircle(cx + 2, cy + 4, 0.8);

    // === Salt shaker (left side) ===
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(cx - 22, cy + 2, 4, 8);
    g.fillStyle(0xffffff, 1);
    g.fillRect(cx - 21, cy + 3, 2, 6);
    // Salt holes on top
    g.fillStyle(0x888888, 1);
    g.fillCircle(cx - 20, cy + 2, 0.5);
    g.fillCircle(cx - 19, cy + 2, 0.5);
    // "S" mark (wee dot pattern)
    g.fillStyle(0xaaaaaa, 1);
    g.fillCircle(cx - 20, cy + 6, 0.5);

    // === Vinegar bottle (right side) ===
    g.fillStyle(0x443311, 1);
    g.fillRect(cx + 18, cy + 1, 4, 9);
    g.fillStyle(0x664422, 1);
    g.fillRect(cx + 19, cy + 2, 2, 7);
    // Bottle neck
    g.fillStyle(0x443311, 1);
    g.fillRect(cx + 19, cy - 1, 2, 3);
    // Label
    g.fillStyle(0xddddaa, 1);
    g.fillRect(cx + 19, cy + 4, 2, 3);

    // === Steam wisps (THICK — this oil is lethal) ===
    g.fillStyle(0xdddddd, 0.7);
    g.fillCircle(cx - 8, cy - 11, 3.5);
    g.fillCircle(cx, cy - 14, 4);
    g.fillCircle(cx + 8, cy - 11, 3.5);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(cx - 8, cy - 12, 2.5);
    g.fillCircle(cx, cy - 15, 3);
    g.fillCircle(cx + 8, cy - 12, 2.5);
    // Extra wisp (rising higher)
    g.fillStyle(0xeeeeee, 0.3);
    g.fillCircle(cx + 3, cy - 18, 2);

    // === Grease-spatter warning glow ===
    g.fillStyle(0xff6600, 0.25);
    g.fillCircle(cx, cy + 3, 22);

    g.generateTexture('deep_fryer', s, s);
    g.destroy();
  }
```

- [ ] **Step 2: Visual verify**
- [ ] **Step 3: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "art: chippy fryer — battered mars bar, volcanic oil, salt & vinegar flanking, lethal steam"
```

---

## Task 9: Boss Gordon — "IT'S RAAAAW! (Pure Aerated Edition)"

**Files:**
- Modify: `src/scenes/BootScene.ts:1467-1537` (`createBossGordon`)

Face PURPLE with rage, yelling mouth MASSIVE, splattered apron, battered fish in one hand and cleaver in the other. FOREHEAD FURROWS are the signature — 3-4 horizontal parallel lines across the brow (this is what people actually recognize about Ramsay, not just "angry"). Chin jutted forward in the classic Ramsay lean. Chef hat slightly askew from screaming. This man has been told the haggis is overcooked and he's lost the plot entirely.

- [ ] **Step 1: Rewrite `createBossGordon` method**

```typescript
private createBossGordon(): void {
    const s = 80;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 4;

    // === Body (chef whites, splattered, IMPOSING) ===
    g.fillStyle(0x777777, 1);
    g.fillCircle(cx, cy, 32);
    g.fillStyle(0xddddcc, 1);
    g.fillCircle(cx, cy, 30);
    g.fillStyle(0xeeeedd, 1);
    g.fillCircle(cx - 3, cy - 3, 24);
    // Grease stains on whites
    g.fillStyle(0xccbb88, 0.4);
    g.fillCircle(cx - 10, cy + 8, 3);
    g.fillCircle(cx + 8, cy + 12, 2.5);
    g.fillCircle(cx - 4, cy + 14, 2);
    // Double-breasted buttons
    g.fillStyle(0x222222, 1);
    g.fillCircle(cx - 5, cy + 4, 1.8);
    g.fillCircle(cx - 5, cy + 10, 1.8);
    g.fillCircle(cx + 5, cy + 4, 1.8);
    g.fillCircle(cx + 5, cy + 10, 1.8);

    // === Face (PURPLE with rage — this man has ascended beyond anger) ===
    g.fillStyle(0x883355, 1);
    g.fillCircle(cx, cy - 6, 14);
    g.fillStyle(0xcc6688, 1); // purple-red rage face
    g.fillCircle(cx, cy - 6, 13);
    // Flushed to absolute beetroot
    g.fillStyle(0xdd5566, 0.4);
    g.fillCircle(cx, cy - 5, 10);
    // FOREHEAD FURROWS — THE Ramsay signature (3-4 deep horizontal lines)
    g.lineStyle(1.2, 0x994466, 0.8);
    g.lineBetween(cx - 8, cy - 18, cx + 8, cy - 18);
    g.lineBetween(cx - 9, cy - 16, cx + 9, cy - 16);
    g.lineBetween(cx - 8, cy - 14, cx + 8, cy - 14);
    g.lineStyle(0.8, 0x884455, 0.5);
    g.lineBetween(cx - 7, cy - 17, cx + 7, cy - 17);
    // Forehead veins too (visible through the furrows)
    g.lineStyle(0.8, 0xaa3344, 0.5);
    g.lineBetween(cx - 5, cy - 19, cx - 7, cy - 16);
    g.lineBetween(cx + 4, cy - 19, cx + 6, cy - 16);

    // Furious eyebrows (THICKER, MORE ANGRY)
    g.fillStyle(0x331100, 1);
    g.fillTriangle(cx - 12, cy - 14, cx - 2, cy - 11, cx - 2, cy - 15);
    g.fillTriangle(cx + 12, cy - 14, cx + 2, cy - 11, cx + 2, cy - 15);
    // Bloodshot eyes
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 6, cy - 9, 3.5);
    g.fillCircle(cx + 6, cy - 9, 3.5);
    // Bloodshot veins in eyes
    g.lineStyle(0.5, 0xff4444, 0.6);
    g.lineBetween(cx - 8, cy - 10, cx - 6, cy - 9);
    g.lineBetween(cx + 8, cy - 10, cx + 6, cy - 9);
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - 6, cy - 9, 2);
    g.fillCircle(cx + 6, cy - 9, 2);
    // Rage-dilated pupils
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx - 6, cy - 9, 1);
    g.fillCircle(cx + 6, cy - 9, 1);

    // MASSIVE open yelling mouth (IT'S RAAAAW)
    g.fillStyle(0x111111, 1);
    g.fillEllipse(cx, cy - 1, 12, 8);
    g.fillStyle(0xcc1111, 1);
    g.fillEllipse(cx, cy, 10, 6);
    // Teeth (top and bottom)
    g.fillStyle(0xffffff, 1);
    g.fillRect(cx - 4, cy - 3, 2, 2);
    g.fillRect(cx, cy - 3, 2, 2);
    g.fillRect(cx - 3, cy + 2, 2, 2);
    g.fillRect(cx + 1, cy + 2, 2, 2);
    // Uvula
    g.fillStyle(0xff6666, 1);
    g.fillCircle(cx, cy + 1, 1);

    // === GIANT chef hat (askew from screaming) ===
    g.fillStyle(0xbbbbbb, 1);
    g.fillRect(cx - 13, cy - 28, 28, 6);
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(cx - 12, cy - 27, 26, 5);
    // Puffy top (tilted slightly — he's been screaming so hard his hat shifted)
    g.fillStyle(0xbbbbbb, 1);
    g.fillCircle(cx - 9, cy - 33, 8);
    g.fillCircle(cx + 1, cy - 36, 9);
    g.fillCircle(cx + 11, cy - 34, 8);
    g.fillStyle(0xeeeeee, 1);
    g.fillCircle(cx - 9, cy - 33, 7);
    g.fillCircle(cx + 1, cy - 36, 8);
    g.fillCircle(cx + 11, cy - 34, 7);

    // === Cleaver in right hand ===
    g.fillStyle(0x221100, 1);
    g.fillRect(cx + 24, cy + 6, 4, 10);
    g.fillStyle(0x888888, 1);
    g.fillRect(cx + 21, cy - 6, 10, 14);
    g.fillStyle(0xdddddd, 1);
    g.fillRect(cx + 22, cy - 5, 8, 12);
    g.fillStyle(0xffffff, 0.8);
    g.fillRect(cx + 23, cy - 4, 2, 10);

    // === Battered fish in left hand (chippy meets fine dining) ===
    g.fillStyle(0xaa7711, 1);
    g.fillEllipse(cx - 26, cy + 4, 10, 16);
    g.fillStyle(0xcc9922, 1);
    g.fillEllipse(cx - 26, cy + 4, 8, 14);
    // Batter texture
    g.fillStyle(0xddaa33, 0.6);
    g.fillCircle(cx - 27, cy + 1, 1);
    g.fillCircle(cx - 25, cy + 6, 1);

    g.generateTexture('boss_gordon', s, s);
    g.destroy();
  }
```

- [ ] **Step 2: Visual verify**
- [ ] **Step 3: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "art: boss gordon — purple rage face, bloodshot eyes, forehead veins, battered fish, askew hat"
```

---

## Task 10: Boss Tour Bus — "First Bus On Sauchiehall Street"

**Files:**
- Modify: `src/scenes/BootScene.ts:1539-1596` (`createBossTourBus`)

Glasgow open-top tour bus in MAGENTA/HOT PINK (First Glasgow livery — NOT London red! Glasgow buses are distinctively magenta/purple-pink with a yellow swoosh stripe). Tourist faces in windows, traffic cone wedged on front bumper (Duke of Wellington nod), exhaust fumes belching, destination sign, horizontal rain hitting the open top deck (it's Glasgow, of course it's raining on the open-top tourists). The energy of a First Bus that hasn't stopped for anyone in three stops.

- [ ] **Step 1: Rewrite `createBossTourBus` method**

```typescript
private createBossTourBus(): void {
    const s = 80;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // === Bus body (MAGENTA/HOT PINK — the unmistakable First Glasgow livery) ===
    g.fillStyle(0x551133, 1); // dark outline
    g.fillRect(cx - 34, cy - 16, 68, 32);
    g.fillStyle(0xaa2266, 1); // First Glasgow magenta-pink
    g.fillRect(cx - 33, cy - 15, 66, 30);
    // Yellow swoosh stripe (the First Bus signature accent)
    g.fillStyle(0xddcc22, 1);
    g.fillRect(cx - 33, cy - 8, 66, 2);
    g.fillStyle(0xbbaa11, 1);
    g.fillRect(cx - 33, cy - 6, 66, 1);

    // === Open top deck rail (it's an open-top! in GLASGOW! in the RAIN!) ===
    g.fillStyle(0x333333, 1);
    g.fillRect(cx - 30, cy - 18, 60, 2);
    // Rail posts
    g.fillRect(cx - 28, cy - 20, 1, 4);
    g.fillRect(cx - 18, cy - 20, 1, 4);
    g.fillRect(cx - 8, cy - 20, 1, 4);
    g.fillRect(cx + 2, cy - 20, 1, 4);
    g.fillRect(cx + 12, cy - 20, 1, 4);
    g.fillRect(cx + 22, cy - 20, 1, 4);

    // === HORIZONTAL rain hitting the open top (Glasgow rain goes SIDEWAYS) ===
    g.lineStyle(0.8, 0xaaddff, 0.4);
    g.lineBetween(cx - 25, cy - 22, cx - 20, cy - 21);
    g.lineBetween(cx - 10, cy - 23, cx - 5, cy - 22);
    g.lineBetween(cx + 5, cy - 21, cx + 10, cy - 20);
    g.lineBetween(cx + 18, cy - 22, cx + 23, cy - 21);
    g.lineBetween(cx - 15, cy - 20, cx - 10, cy - 19);
    g.lineBetween(cx + 12, cy - 23, cx + 17, cy - 22);

    // === Tourist faces in windows (wee pink dots with bewildered expressions) ===
    g.fillStyle(0x222244, 1);
    g.fillRect(cx - 30, cy - 13, 60, 6);
    // Window panes
    g.fillStyle(0x88ccff, 0.7);
    for (let i = 0; i < 6; i++) {
      g.fillRect(cx - 29 + i * 10, cy - 12, 8, 5);
    }
    // Tourist faces (sunburned pink, in each window)
    g.fillStyle(0xee8877, 1);
    g.fillCircle(cx - 25, cy - 10, 1.5);
    g.fillCircle(cx - 15, cy - 10, 1.5);
    g.fillCircle(cx - 5, cy - 10, 1.5);
    g.fillCircle(cx + 5, cy - 10, 1.5);
    g.fillCircle(cx + 15, cy - 10, 1.5);
    g.fillCircle(cx + 25, cy - 10, 1.5);

    // === Destination sign ("YOKER" energy — pixel text suggestion) ===
    g.fillStyle(0x111111, 1);
    g.fillRect(cx - 12, cy - 15, 24, 4);
    g.fillStyle(0xffdd44, 1);
    g.fillRect(cx - 10, cy - 14, 20, 2);
    // Dot matrix text blocks (suggests "CITY TOUR" or similar)
    g.fillStyle(0xff8800, 1);
    g.fillRect(cx - 8, cy - 14, 2, 2);
    g.fillRect(cx - 4, cy - 14, 2, 2);
    g.fillRect(cx, cy - 14, 2, 2);
    g.fillRect(cx + 4, cy - 14, 2, 2);

    // === Headlights (angry, bearing down on you) ===
    g.fillStyle(0xffff66, 1);
    g.fillCircle(cx + 33, cy - 4, 4);
    g.fillCircle(cx + 33, cy + 4, 4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx + 33, cy - 4, 2);
    g.fillCircle(cx + 33, cy + 4, 2);
    // Light beam glow
    g.fillStyle(0xffff88, 0.15);
    g.fillTriangle(cx + 36, cy - 6, cx + 36, cy + 6, cx + 46, cy);

    // === Traffic cone on bumper (Duke of Wellington nod!) ===
    g.fillStyle(0xff6600, 1);
    g.fillTriangle(cx + 34, cy + 9, cx + 38, cy + 14, cx + 30, cy + 14);
    g.fillStyle(0xff8833, 1);
    g.fillTriangle(cx + 34, cy + 10, cx + 37, cy + 14, cx + 31, cy + 14);
    // White stripe on cone
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(cx + 31, cy + 12, 6, 1);

    // === Bumper (heavy, industrial) ===
    g.fillStyle(0x333333, 1);
    g.fillRect(cx - 33, cy + 14, 66, 4);
    g.fillStyle(0x555555, 1);
    g.fillRect(cx - 33, cy + 14, 66, 1);

    // === Wheels (big, chunky) ===
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - 20, cy + 20, 7);
    g.fillCircle(cx + 20, cy + 20, 7);
    g.fillStyle(0x333333, 1);
    g.fillCircle(cx - 20, cy + 20, 5);
    g.fillCircle(cx + 20, cy + 20, 5);
    g.fillStyle(0x888888, 1);
    g.fillCircle(cx - 20, cy + 20, 2);
    g.fillCircle(cx + 20, cy + 20, 2);

    // === Exhaust fumes belching from rear ===
    g.fillStyle(0x444444, 0.4);
    g.fillCircle(cx - 36, cy + 8, 4);
    g.fillCircle(cx - 40, cy + 5, 5);
    g.fillCircle(cx - 44, cy + 2, 4);
    g.fillStyle(0x555555, 0.25);
    g.fillCircle(cx - 38, cy + 4, 3);
    g.fillCircle(cx - 42, cy + 1, 3.5);

    g.generateTexture('boss_tour_bus', s, s);
    g.destroy();
  }
```

- [ ] **Step 2: Visual verify**
- [ ] **Step 3: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "art: boss tour bus — Glasgow livery, open top in rain, tourist faces, traffic cone on bumper, exhaust fumes"
```

---

## Task 11: Boss Laird — "Yer Bum's Oot The Windae, Peasants"

**Files:**
- Modify: `src/scenes/BootScene.ts:1598-1664` (`createBossLaird`)

More pompous, more "landed gentry sneering at the plebs." Add monocle, visible sneer (curled lip, chin up), WALRUS mustache (thick, drooping over the lip — reads "stuffy old aristocrat" vs handlebar which reads "military"), more ornate crown with rubies AND sapphires, signet ring dot. Ermine fur trim enhanced with proper black tail-tip spots in a grid pattern. This man owns half of Scotland and has never worked a day.

- [ ] **Step 1: Rewrite `createBossLaird` method**

```typescript
private createBossLaird(): void {
    const s = 80;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 4;

    // === Royal cloak (deep purple, regal, EXPENSIVE) ===
    g.fillStyle(0x0a0022, 1);
    g.fillCircle(cx, cy + 2, 30);
    g.fillStyle(0x1a0044, 1);
    g.fillCircle(cx, cy + 2, 28);
    g.fillStyle(0x2a0066, 1);
    g.fillCircle(cx, cy, 24);
    // Velvet sheen
    g.fillStyle(0x3a0088, 0.4);
    g.fillEllipse(cx - 4, cy - 4, 30, 20);
    // Gold braid trim on cloak
    g.lineStyle(1.5, 0xddaa00, 0.8);
    g.strokeCircle(cx, cy + 1, 25);

    // === Ermine fur trim (white with black spots — proper royal) ===
    g.fillStyle(0xffffff, 1);
    g.fillRect(cx - 28, cy + 14, 56, 5);
    g.fillStyle(0xeeeedd, 1);
    g.fillRect(cx - 27, cy + 15, 54, 3);
    // Black ermine tail spots (more of them, evenly spaced)
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - 22, cy + 16, 1.5);
    g.fillCircle(cx - 14, cy + 16, 1.5);
    g.fillCircle(cx - 6, cy + 16, 1.5);
    g.fillCircle(cx + 2, cy + 16, 1.5);
    g.fillCircle(cx + 10, cy + 16, 1.5);
    g.fillCircle(cx + 18, cy + 16, 1.5);
    // Tail dangles
    g.fillStyle(0x111111, 1);
    g.fillRect(cx - 22, cy + 17, 1, 2);
    g.fillRect(cx - 6, cy + 17, 1, 2);
    g.fillRect(cx + 10, cy + 17, 1, 2);

    // === Face (sneering, chin UP, looking down at you) ===
    g.fillStyle(0xaa6644, 1);
    g.fillCircle(cx, cy - 6, 12);
    g.fillStyle(0xffccaa, 1);
    g.fillCircle(cx, cy - 6, 11);
    // Powdered complexion (slightly paler than normal)
    g.fillStyle(0xffddc8, 0.5);
    g.fillCircle(cx, cy - 7, 9);

    // Prominent chin (jutting forward, looking down at the peasants)
    g.fillStyle(0xffccaa, 1);
    g.fillEllipse(cx, cy + 1, 6, 4);

    // Monocle on right eye
    g.lineStyle(1.5, 0xddaa00, 1);
    g.strokeCircle(cx + 5, cy - 8, 4);
    g.fillStyle(0xaaddff, 0.2);
    g.fillCircle(cx + 5, cy - 8, 3);
    // Monocle chain
    g.lineStyle(0.8, 0xbb8800, 0.7);
    g.lineBetween(cx + 9, cy - 6, cx + 12, cy);

    // Sneering eyes (half-lidded, contemptuous)
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 5, cy - 8, 3);
    g.fillCircle(cx + 5, cy - 8, 3);
    g.fillStyle(0x224488, 1);
    g.fillCircle(cx - 5, cy - 8, 1.5);
    g.fillCircle(cx + 5, cy - 8, 1.5);
    // Heavy, contemptuous eyelids
    g.fillStyle(0xddbb99, 1);
    g.fillRect(cx - 8, cy - 10, 6, 2);
    g.fillRect(cx + 2, cy - 10, 6, 2);

    // Walrus mustache (thick, drooping over the lip — stuffy old aristocrat)
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(cx - 8, cy - 3, 16, 3);
    g.fillStyle(0xcccccc, 1);
    g.fillRect(cx - 7, cy - 3, 14, 2);
    // Drooping ends (hangs past the mouth — walrus style)
    g.fillStyle(0xbbbbbb, 1);
    g.fillRect(cx - 8, cy - 1, 3, 3);
    g.fillRect(cx + 6, cy - 1, 3, 3);
    // Mustache highlight
    g.fillStyle(0xdddddd, 0.6);
    g.fillRect(cx - 5, cy - 3, 10, 1);

    // Thin sneer (curled lip — pure contempt for the working class)
    g.fillStyle(0xcc8877, 1);
    g.fillRect(cx - 3, cy, 6, 1);
    // One corner turned up (the sneer)
    g.fillStyle(0xcc8877, 1);
    g.fillCircle(cx + 3, cy - 1, 0.8);

    // === Signet ring (golden dot on right side — old money) ===
    g.fillStyle(0xddaa00, 1);
    g.fillCircle(cx + 20, cy + 6, 2);
    g.fillStyle(0xffcc44, 1);
    g.fillCircle(cx + 20, cy + 6, 1.2);

    // === BIG golden crown (more ornate, more jewels) ===
    g.fillStyle(0x553300, 1);
    g.fillRect(cx - 16, cy - 22, 32, 8);
    g.fillStyle(0xddaa00, 1);
    g.fillRect(cx - 15, cy - 21, 30, 6);
    // Gold highlight band
    g.fillStyle(0xffcc33, 0.6);
    g.fillRect(cx - 15, cy - 20, 30, 2);
    // Crown points (taller, more ornate)
    g.fillStyle(0x553300, 1);
    g.fillTriangle(cx - 16, cy - 22, cx - 11, cy - 34, cx - 6, cy - 22);
    g.fillTriangle(cx - 4, cy - 22, cx, cy - 36, cx + 4, cy - 22);
    g.fillTriangle(cx + 6, cy - 22, cx + 11, cy - 34, cx + 16, cy - 22);
    g.fillStyle(0xddaa00, 1);
    g.fillTriangle(cx - 15, cy - 22, cx - 11, cy - 32, cx - 7, cy - 22);
    g.fillTriangle(cx - 3, cy - 22, cx, cy - 34, cx + 3, cy - 22);
    g.fillTriangle(cx + 7, cy - 22, cx + 11, cy - 32, cx + 14, cy - 22);
    // Jewels (rubies AND sapphires)
    g.fillStyle(0xff1133, 1);
    g.fillCircle(cx - 11, cy - 30, 2.2);
    g.fillCircle(cx + 11, cy - 30, 2.2);
    g.fillStyle(0x2244ff, 1);
    g.fillCircle(cx, cy - 33, 2.5);
    // Jewel highlights
    g.fillStyle(0xff6677, 1);
    g.fillCircle(cx - 11, cy - 31, 0.8);
    g.fillCircle(cx + 11, cy - 31, 0.8);
    g.fillStyle(0x6688ff, 1);
    g.fillCircle(cx, cy - 34, 1);
    // Tiny gold fleur-de-lis on crown band
    g.fillStyle(0xffcc33, 1);
    g.fillCircle(cx - 8, cy - 19, 1);
    g.fillCircle(cx + 8, cy - 19, 1);

    g.generateTexture('boss_laird', s, s);
    g.destroy();
  }
```

- [ ] **Step 2: Visual verify**
- [ ] **Step 3: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "art: boss laird — monocle, waxed mustache, sneering contempt, signet ring, ornate crown"
```

---

## Task 12: Boss Hunter General — "Pith Helmet, Blunderbuss, Self-Awarded Medals"

**Files:**
- Modify: `src/scenes/BootScene.ts:1666-1736` (`createBossHunterGeneral`)

Colonial big-game-hunter who'd mount a haggis on the wall. Pith helmet instead of military cap, handlebar mustache (waxed, curled), comically oversized blunderbuss, shinier ostentatious medals, jodhpurs. This man awards himself medals for breakfast.

- [ ] **Step 1: Rewrite `createBossHunterGeneral` method**

```typescript
private createBossHunterGeneral(): void {
    const s = 80;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 4;

    // === Military body (safari khaki-green, not camo) ===
    g.fillStyle(0x1a2a11, 1);
    g.fillCircle(cx, cy + 2, 30);
    g.fillStyle(0x3a5a28, 1);
    g.fillCircle(cx, cy + 2, 28);
    g.fillStyle(0x4a6a38, 1);
    g.fillCircle(cx, cy, 24);

    // === Jodhpurs visible below (buff/khaki riding pants) ===
    g.fillStyle(0x887755, 1);
    g.fillRect(cx - 12, cy + 18, 10, 6);
    g.fillRect(cx + 2, cy + 18, 10, 6);
    // Riding boots (tall, polished brown)
    g.fillStyle(0x442211, 1);
    g.fillRect(cx - 12, cy + 22, 10, 4);
    g.fillRect(cx + 2, cy + 22, 10, 4);
    g.fillStyle(0x553322, 1);
    g.fillRect(cx - 11, cy + 22, 8, 3);
    g.fillRect(cx + 3, cy + 22, 8, 3);

    // === Gold shoulder epaulettes (MASSIVE, ostentatious) ===
    g.fillStyle(0x886600, 1);
    g.fillRect(cx - 24, cy - 8, 8, 5);
    g.fillRect(cx + 16, cy - 8, 8, 5);
    g.fillStyle(0xddaa00, 1);
    g.fillRect(cx - 23, cy - 7, 6, 3);
    g.fillRect(cx + 17, cy - 7, 6, 3);
    // Fringe tassels
    g.fillStyle(0xccaa00, 1);
    g.fillRect(cx - 24, cy - 4, 1, 3);
    g.fillRect(cx - 22, cy - 4, 1, 3);
    g.fillRect(cx - 20, cy - 4, 1, 3);
    g.fillRect(cx + 20, cy - 4, 1, 3);
    g.fillRect(cx + 22, cy - 4, 1, 3);

    // === Medals row (5 medals — he awards himself new ones weekly) ===
    g.fillStyle(0xcc2222, 1);
    g.fillCircle(cx - 10, cy + 2, 2.5);
    g.fillStyle(0xddaa00, 1);
    g.fillCircle(cx - 5, cy + 2, 2.5);
    g.fillStyle(0x2244aa, 1);
    g.fillCircle(cx, cy + 2, 2.5);
    g.fillStyle(0x22aa44, 1);
    g.fillCircle(cx + 5, cy + 2, 2.5);
    g.fillStyle(0xdddddd, 1);
    g.fillCircle(cx + 10, cy + 2, 2.5);
    // Medal ribbons
    g.fillStyle(0xcc2222, 0.7);
    g.fillRect(cx - 11, cy - 1, 3, 2);
    g.fillStyle(0xddaa00, 0.7);
    g.fillRect(cx - 6, cy - 1, 3, 2);
    g.fillStyle(0x2244aa, 0.7);
    g.fillRect(cx - 1, cy - 1, 3, 2);

    // === Face (ruddy, supremely confident, colonial pomposity) ===
    g.fillStyle(0xaa6644, 1);
    g.fillCircle(cx, cy - 6, 12);
    g.fillStyle(0xffccaa, 1);
    g.fillCircle(cx, cy - 6, 11);

    // Handlebar mustache (MASSIVE, waxed, curled at ends)
    g.fillStyle(0x3a2a11, 1);
    g.fillRect(cx - 10, cy - 3, 20, 3);
    // Curled ends (pointing upward — proper handlebar)
    g.fillCircle(cx - 11, cy - 4, 2);
    g.fillCircle(cx + 11, cy - 4, 2);
    g.fillStyle(0x4a3a22, 1);
    g.fillCircle(cx - 11, cy - 5, 1);
    g.fillCircle(cx + 11, cy - 5, 1);

    // Monocle (iconic)
    g.lineStyle(2, 0xddaa00, 1);
    g.strokeCircle(cx + 5, cy - 8, 4.5);
    g.fillStyle(0xaaddff, 0.15);
    g.fillCircle(cx + 5, cy - 8, 3.5);
    // Monocle chain
    g.lineStyle(0.8, 0x886600, 0.8);
    g.lineBetween(cx + 9, cy - 5, cx + 12, cy);

    // Confident eyes (stern, looking down the gun)
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 5, cy - 8, 3);
    g.fillCircle(cx + 5, cy - 8, 3);
    g.fillStyle(0x336644, 1);
    g.fillCircle(cx - 5, cy - 8, 1.5);
    g.fillCircle(cx + 5, cy - 8, 1.5);

    // One eyebrow cocked (the confident hunter)
    g.fillStyle(0x3a2a11, 1);
    g.fillRect(cx - 8, cy - 12, 6, 1.5);
    g.fillTriangle(cx + 2, cy - 13, cx + 8, cy - 12, cx + 2, cy - 11);

    // === Pith helmet (HIGH DOME — classic safari, the colonial big-game look) ===
    // Wide brim (flat, wider at rear)
    g.fillStyle(0x776644, 1);
    g.fillEllipse(cx, cy - 18, 30, 8);
    g.fillStyle(0xbbaa77, 1);
    g.fillEllipse(cx, cy - 18, 28, 7);
    // HIGH dome (taller than you'd think — rigid, not floppy)
    g.fillStyle(0x776644, 1);
    g.fillEllipse(cx, cy - 24, 18, 12);
    g.fillStyle(0xaa9966, 1);
    g.fillEllipse(cx, cy - 24, 16, 11);
    // Dome highlight (catches the light at the peak)
    g.fillStyle(0xccbb88, 0.6);
    g.fillEllipse(cx - 2, cy - 28, 10, 5);
    // Ventilation knob on top (the little finial — real pith helmet detail)
    g.fillStyle(0x887755, 1);
    g.fillCircle(cx, cy - 30, 2);
    g.fillStyle(0xaa9966, 1);
    g.fillCircle(cx, cy - 30, 1.2);
    // Puggaree band (cloth wrap — the distinctive belt of fabric around the base)
    g.fillStyle(0x554422, 1);
    g.fillRect(cx - 13, cy - 19, 26, 3);
    g.fillStyle(0x665533, 1);
    g.fillRect(cx - 12, cy - 19, 24, 2);
    // Puggaree fold lines
    g.fillStyle(0x443311, 0.5);
    g.fillRect(cx - 8, cy - 19, 1, 2);
    g.fillRect(cx - 2, cy - 19, 1, 2);
    g.fillRect(cx + 4, cy - 19, 1, 2);

    // === Comically oversized blunderbuss ===
    // Stock (ornate wood)
    g.fillStyle(0x331100, 1);
    g.fillRect(cx + 22, cy + 4, 6, 18);
    g.fillStyle(0x553322, 1);
    g.fillRect(cx + 23, cy + 5, 4, 16);
    // Barrel (flared at the end — that's what makes it a blunderbuss)
    g.fillStyle(0x333333, 1);
    g.fillRect(cx + 24, cy - 20, 4, 26);
    g.fillStyle(0x555555, 1);
    g.fillRect(cx + 25, cy - 19, 2, 24);
    // Flared muzzle (the iconic blunderbuss bell)
    g.fillStyle(0x333333, 1);
    g.fillTriangle(cx + 22, cy - 24, cx + 30, cy - 24, cx + 26, cy - 20);
    g.fillStyle(0x555555, 1);
    g.fillTriangle(cx + 23, cy - 23, cx + 29, cy - 23, cx + 26, cy - 20);
    // Gold trigger guard
    g.fillStyle(0xddaa00, 1);
    g.fillCircle(cx + 24, cy + 4, 1.5);

    g.generateTexture('boss_hunter_general', s, s);
    g.destroy();
  }
```

- [ ] **Step 2: Visual verify**
- [ ] **Step 3: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "art: boss hunter general — pith helmet, handlebar mustache, blunderbuss, 5 self-awarded medals"
```

---

## Task 13: Boss Taxman — "HMRC Never Sleeps (Pinstripe Death)"

**Files:**
- Modify: `src/scenes/BootScene.ts:1738-1810` (`createBossTaxman`)

Keep the grim reaper skeleton — it's brilliant. Add thin WIRE-RIMMED spectacles perched on the nasal cavity (not thick frames — the civil servant look), pinstripe texture on the cloak (it's a business death), calculator hanging from the scythe handle, red necktie (dressed for work), red eyes glow brighter behind the lenses. The spectacles + skull combo is a well-recognized gag. HMRC in skeletal form — nothing is certain but death and taxes, and this one is both.

- [ ] **Step 1: Rewrite `createBossTaxman` method**

```typescript
private createBossTaxman(): void {
    const s = 80;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2 + 4;

    // === Pinstripe cloak (death meets the civil service) ===
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx, cy + 2, 32);
    g.fillStyle(0x0a0a0a, 1);
    g.fillCircle(cx, cy + 2, 30);
    g.fillStyle(0x141414, 1);
    g.fillCircle(cx, cy, 26);
    // Pinstripes (subtle gray on black — bespoke reaper)
    g.fillStyle(0x222222, 0.6);
    g.fillRect(cx - 18, cy - 6, 1, 36);
    g.fillRect(cx - 12, cy - 6, 1, 36);
    g.fillRect(cx - 6, cy - 6, 1, 36);
    g.fillRect(cx, cy - 6, 1, 36);
    g.fillRect(cx + 6, cy - 6, 1, 36);
    g.fillRect(cx + 12, cy - 6, 1, 36);
    g.fillRect(cx + 18, cy - 6, 1, 36);
    // Cloak folds (deeper black)
    g.fillStyle(0x000000, 1);
    g.fillRect(cx - 14, cy + 2, 2, 28);
    g.fillRect(cx - 4, cy + 2, 2, 28);
    g.fillRect(cx + 8, cy + 2, 2, 28);
    g.fillRect(cx + 18, cy + 2, 2, 28);

    // === Necktie (visible at collar — death is DRESSED for work) ===
    g.fillStyle(0x881111, 1);
    g.fillTriangle(cx - 2, cy - 6, cx + 2, cy - 6, cx, cy + 4);
    g.fillStyle(0xaa2222, 1);
    g.fillTriangle(cx - 1, cy - 5, cx + 1, cy - 5, cx, cy + 2);

    // === Hood (iconic — deep, dark) ===
    g.fillStyle(0x000000, 1);
    g.fillTriangle(cx - 18, cy - 6, cx, cy - 34, cx + 18, cy - 6);
    g.fillStyle(0x080808, 1);
    g.fillTriangle(cx - 16, cy - 6, cx, cy - 30, cx + 16, cy - 6);
    g.fillStyle(0x000000, 1);
    g.fillEllipse(cx, cy - 10, 20, 16);

    // === Skull face ===
    g.fillStyle(0x777766, 1);
    g.fillCircle(cx, cy - 6, 13);
    g.fillStyle(0xddddcc, 1);
    g.fillCircle(cx, cy - 6, 12);
    // Cheekbone definition
    g.fillStyle(0xccccbb, 1);
    g.fillCircle(cx - 6, cy - 4, 3);
    g.fillCircle(cx + 6, cy - 4, 3);

    // === Thin wire-rimmed spectacles (the civil servant look — perched on bone) ===
    g.lineStyle(0.8, 0x888888, 1); // thin wire — not thick frames
    g.strokeCircle(cx - 5, cy - 8, 3.5);
    g.strokeCircle(cx + 5, cy - 8, 3.5);
    // Bridge (thin wire connecting the lenses)
    g.lineStyle(0.6, 0x888888, 1);
    g.lineBetween(cx - 2, cy - 8, cx + 2, cy - 8);
    // Temple arms (thin, going behind where ears would be)
    g.lineBetween(cx - 8, cy - 8, cx - 12, cy - 6);
    g.lineBetween(cx + 8, cy - 8, cx + 12, cy - 6);
    // Wire glint (catches the light — sinister)
    g.fillStyle(0xcccccc, 0.4);
    g.fillCircle(cx - 7, cy - 9, 0.5);
    g.fillCircle(cx + 7, cy - 9, 0.5);

    // Glowing red eyes behind the spectacles (HMRC sees ALL)
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx - 5, cy - 8, 3);
    g.fillCircle(cx + 5, cy - 8, 3);
    g.fillStyle(0xff0000, 1);
    g.fillCircle(cx - 5, cy - 8, 2);
    g.fillCircle(cx + 5, cy - 8, 2);
    g.fillStyle(0xff6644, 1);
    g.fillCircle(cx - 5, cy - 8, 1);
    g.fillCircle(cx + 5, cy - 8, 1);
    // Red glow leaking through lenses
    g.fillStyle(0xff2200, 0.3);
    g.fillCircle(cx - 5, cy - 8, 4);
    g.fillCircle(cx + 5, cy - 8, 4);

    // Nose cavity
    g.fillStyle(0x000000, 1);
    g.fillTriangle(cx - 1, cy - 3, cx + 1, cy - 3, cx, cy + 1);
    // Jagged skull teeth (grinning — they've found a discrepancy)
    g.fillStyle(0x000000, 1);
    g.fillRect(cx - 6, cy + 2, 12, 4);
    g.fillStyle(0xddddcc, 1);
    g.fillRect(cx - 5, cy + 2, 1, 3);
    g.fillRect(cx - 3, cy + 2, 1, 4);
    g.fillRect(cx - 1, cy + 2, 1, 3);
    g.fillRect(cx + 1, cy + 2, 1, 4);
    g.fillRect(cx + 3, cy + 2, 1, 3);

    // === SCYTHE (the weapon that signs your P45) ===
    // Handle
    g.fillStyle(0x1a0a00, 1);
    g.fillRect(cx + 24, cy - 28, 3, 56);
    g.fillStyle(0x331a00, 1);
    g.fillRect(cx + 25, cy - 27, 1, 54);
    // Scythe blade
    g.fillStyle(0x444444, 1);
    g.fillTriangle(cx + 10, cy - 32, cx + 26, cy - 28, cx + 26, cy - 18);
    g.fillStyle(0xbbbbbb, 1);
    g.fillTriangle(cx + 12, cy - 30, cx + 25, cy - 27, cx + 25, cy - 20);
    g.fillStyle(0xeeeeee, 0.7);
    g.fillTriangle(cx + 12, cy - 30, cx + 23, cy - 28, cx + 13, cy - 28);

    // === Calculator hanging from scythe handle (the real weapon) ===
    g.fillStyle(0x222222, 1);
    g.fillRect(cx + 20, cy + 10, 6, 8);
    g.fillStyle(0x333333, 1);
    g.fillRect(cx + 21, cy + 11, 4, 6);
    // Screen (showing a big number — your tax bill)
    g.fillStyle(0x88ff88, 0.8);
    g.fillRect(cx + 21, cy + 11, 4, 2);
    // Buttons
    g.fillStyle(0x888888, 0.8);
    g.fillRect(cx + 21, cy + 14, 1, 1);
    g.fillRect(cx + 23, cy + 14, 1, 1);
    g.fillRect(cx + 21, cy + 16, 1, 1);
    g.fillRect(cx + 23, cy + 16, 1, 1);
    // String attaching to handle
    g.lineStyle(0.8, 0x444444, 0.7);
    g.lineBetween(cx + 23, cy + 10, cx + 25, cy + 8);

    g.generateTexture('boss_taxman', s, s);
    g.destroy();
  }
```

- [ ] **Step 2: Visual verify**
- [ ] **Step 3: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "art: boss taxman — pinstripe reaper, spectacles on skull, red necktie, calculator on scythe, HMRC energy"
```

---

## Task 14: Highland Cow — Polish Pass

**Files:**
- Modify: `src/scenes/BootScene.ts:892-967` (`createHighlandCow`)

Already decent — add: nostril steam (it's cold), more shaggy fringe texture with individual strands, mud on hooves, more horn detail. The highland cow is beloved — it needs to be lovingly rendered.

- [ ] **Step 1: Add detail to `createHighlandCow`**

Add after the existing nostrils section (around line 963), before `generateTexture`:

```typescript
    // Nostril steam (it's cauld out)
    g.fillStyle(0xcccccc, 0.4);
    g.fillCircle(cx - 2, cy - 1, 1.5);
    g.fillCircle(cx + 3, cy - 1, 1.5);
    g.fillStyle(0xeeeeee, 0.25);
    g.fillCircle(cx - 3, cy - 2, 1);
    g.fillCircle(cx + 4, cy - 2, 1);

    // Mud on hooves (been in the field)
    g.fillStyle(0x3a2a0a, 0.7);
    g.fillCircle(cx - 11, cy + 23, 2);
    g.fillCircle(cx + 4, cy + 23, 2);

    // Extra shaggy fringe strands (individual hairs)
    g.fillStyle(0xbb9955, 0.7);
    for (let i = 0; i < 8; i++) {
      const fx = cx - 13 + i * 3.5;
      const len = 3 + (i % 3);
      g.fillRect(fx, cy - 9, 1, len);
    }
```

- [ ] **Step 2: Visual verify**
- [ ] **Step 3: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "art: highland cow — nostril steam, mud on hooves, extra shaggy fringe strands"
```

---

## Task 15: Projectiles & Pickups — Quality Pass

**Files:**
- Modify: `src/scenes/BootScene.ts` — `createThistle`, `createCaber`, `createHaggisBall`, `createHealthOrb`, `createChestTexture`

### Thistle — add green stem stub

- [ ] **Step 1: Add stem to thistle**

After the bright center (line ~1369), before `generateTexture`:

```typescript
    // Green stem stub (it's a flower head, not just a purple blob)
    g.fillStyle(0x336622, 1);
    g.fillRect(cx - 1, cy + 5, 2, 3);
    g.fillStyle(0x448833, 1);
    g.fillRect(cx - 1, cy + 5, 1, 2);
```

### Caber — add wood knots and tree rings

- [ ] **Step 2: Enhance caber**

Replace the caber method with:

```typescript
private createCaber(): void {
    const s = 24;
    const g = this.add.graphics();

    // Outline
    g.fillStyle(0x2a1a04, 1);
    g.fillRect(2, 5, 20, 12);
    // Long brown log
    g.fillStyle(0x7a5510, 1);
    g.fillRect(3, 6, 18, 10);
    // Wood grain lines
    g.fillStyle(0x5a3e08, 0.8);
    g.fillRect(3, 8, 18, 1);
    g.fillRect(3, 12, 18, 1);
    // Lighter grain highlight
    g.fillStyle(0x9a7522, 0.5);
    g.fillRect(3, 7, 18, 1);
    g.fillRect(3, 10, 18, 1);
    // Knots in the wood (dark circles)
    g.fillStyle(0x4a3008, 1);
    g.fillCircle(8, 10, 1.5);
    g.fillCircle(16, 9, 1);
    g.fillStyle(0x3a2206, 1);
    g.fillCircle(8, 10, 0.8);
    // Tree ring on right end
    g.fillStyle(0x5a3e08, 1);
    g.fillCircle(20, 11, 3);
    g.fillStyle(0x7a5510, 1);
    g.fillCircle(20, 11, 2);
    g.fillStyle(0x5a3e08, 1);
    g.fillCircle(20, 11, 1);
    // Bark texture edge (top/bottom)
    g.fillStyle(0x4a3008, 0.6);
    g.fillRect(3, 6, 18, 1);
    g.fillRect(3, 15, 18, 1);

    g.generateTexture('caber', s, s);
    g.destroy();
  }
```

### Haggis Ball — lumpier, steamier

- [ ] **Step 3: Enhance haggis ball**

Replace the method with:

```typescript
private createHaggisBall(): void {
    const s = 18;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Dark outline (lumpy — not a perfect circle)
    g.fillStyle(0x2a1a06, 1);
    g.fillCircle(cx, cy, 7);
    g.fillCircle(cx + 1, cy - 1, 6);
    // Body — mottled brown (haggis-colored)
    g.fillStyle(0x5a3e0a, 1);
    g.fillCircle(cx, cy, 6);
    g.fillCircle(cx + 1, cy - 1, 5);
    g.fillStyle(0x7a5a12, 1);
    g.fillCircle(cx - 1, cy - 1, 5);
    // Oat fleck texture
    g.fillStyle(0x9a7822, 0.8);
    g.fillCircle(cx - 2, cy - 2, 1.2);
    g.fillCircle(cx + 2, cy + 1, 1);
    g.fillCircle(cx - 1, cy + 2, 0.8);
    g.fillCircle(cx + 3, cy - 1, 0.8);
    g.fillCircle(cx - 3, cy + 1, 0.6);
    // Wet sheen highlight
    g.fillStyle(0xbb9933, 0.7);
    g.fillCircle(cx - 2, cy - 3, 1.5);
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(cx - 3, cy - 3, 0.7);
    // Steam wisps (it's fresh from the pot)
    g.fillStyle(0xcccccc, 0.35);
    g.fillCircle(cx - 1, cy - 6, 1.2);
    g.fillCircle(cx + 2, cy - 7, 1);

    g.generateTexture('haggis_ball', s, s);
    g.destroy();
  }
```

### Health Orb — Irn-Bru orange

- [ ] **Step 4: Rework health orb to Irn-Bru orange**

```typescript
private createHealthOrb(): void {
    const s = 18;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Outline (deep orange)
    g.fillStyle(0x884400, 1);
    g.fillCircle(cx, cy, 7);
    // Orb body — radioactive Irn-Bru orange
    g.fillStyle(0xee7700, 1);
    g.fillCircle(cx, cy, 6);
    // Inner glow — bright neon orange
    g.fillStyle(0xff9922, 0.8);
    g.fillCircle(cx - 1, cy - 1, 4);
    g.fillStyle(0xffbb44, 0.6);
    g.fillCircle(cx - 2, cy - 2, 2);
    // Glass bottle highlights (curved light reflection)
    g.fillStyle(0xffffff, 0.6);
    g.fillRect(cx - 3, cy - 4, 1, 5);
    g.fillStyle(0xffffff, 0.3);
    g.fillRect(cx - 2, cy - 3, 1, 3);
    // Fizz bubbles
    g.fillStyle(0xffdd88, 0.8);
    g.fillCircle(cx + 1, cy + 1, 0.6);
    g.fillCircle(cx + 2, cy - 1, 0.5);
    g.fillCircle(cx - 1, cy + 2, 0.4);
    // Hot sparkle
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 3, cy - 3, 0.8);

    g.generateTexture('health_orb', s, s);
    g.destroy();
  }
```

### Chest — tartan trim

- [ ] **Step 5: Add tartan trim to chest**

In `createChestTexture`, replace the metal band section with tartan-accented bands. After the horizontal metal band (around line 2070):

Add tartan accent to the metal bands:
```typescript
    // Tartan accent on bands (Scottish treasure!)
    g.fillStyle(0xcc2222, 0.6);
    g.fillRect(cx - 14, cy, 28, 1);
    g.fillStyle(0x224488, 0.4);
    g.fillRect(cx - 14, cy - 2, 28, 1);
```

- [ ] **Step 6: Visual verify all projectiles/pickups**
- [ ] **Step 7: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "art: projectiles & pickups — thistle stem, caber knots, steamy jobby, Irn-Bru health orb, tartan chest"
```

---

## Task 16: Terrain Decorations — Cultural Nods

**Files:**
- Modify: `src/scenes/BootScene.ts` — `createRock`, add new `createGlasgowKite`
- Modify: `src/scenes/BootScene.ts:75-114` — add `createGlasgowKite` call to `generateAllTextures`

### Rock variant with traffic cone

- [ ] **Step 1: Add traffic cone to rock variant 3**

In `createRock`, after rock variant 3 (the pebble cluster, around line 266), add a tiny fallen cone:

```typescript
    // Wee traffic cone lying on its side (if you know, you know)
    g3.fillStyle(0xff6600, 1);
    g3.fillTriangle(cx + 7, cy - 2, cx + 9, cy + 2, cx + 5, cy + 2);
    g3.fillStyle(0xff8833, 1);
    g3.fillTriangle(cx + 7, cy - 1, cx + 8, cy + 1, cx + 6, cy + 1);
    g3.fillStyle(0xffffff, 0.8);
    g3.fillRect(cx + 6, cy, 2, 1);
```

### Glasgow Kite (floating plastic bag)

- [ ] **Step 2: Create `createGlasgowKite` method**

Add new method after `createHeather`:

```typescript
  /** "Glasgow Kite" — a stray plastic bag floating majestically in the wind.
   *  Anyone who's waited at a bus stop on Maryhill Road knows this bird. */
  private createGlasgowKite(): void {
    const s = 16;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Crumpled bag body (translucent, billowing)
    g.fillStyle(0x99aacc, 0.35);
    g.fillEllipse(cx, cy, 12, 8);
    g.fillStyle(0xaabbdd, 0.3);
    g.fillEllipse(cx - 1, cy - 1, 10, 6);
    // Bag crumple lines
    g.lineStyle(0.5, 0x8899bb, 0.3);
    g.lineBetween(cx - 4, cy - 2, cx + 3, cy + 1);
    g.lineBetween(cx - 2, cy + 1, cx + 4, cy - 1);
    // Handle loops poking up
    g.fillStyle(0x8899bb, 0.4);
    g.fillCircle(cx - 2, cy - 4, 1.5);
    g.fillCircle(cx + 2, cy - 4, 1.5);
    g.fillStyle(0x99aacc, 0.25);
    g.fillCircle(cx - 2, cy - 4, 0.8);
    g.fillCircle(cx + 2, cy - 4, 0.8);
    // Trailing corner (caught in the wind)
    g.fillStyle(0x99aacc, 0.25);
    g.fillTriangle(cx + 5, cy + 2, cx + 8, cy + 5, cx + 4, cy + 4);

    g.generateTexture('deco_glasgow_kite', s, s);
    g.destroy();
  }
```

- [ ] **Step 3: Add to `generateAllTextures`**

In `generateAllTextures` (around line 109, after `createHeather()`):

```typescript
    this.createGlasgowKite();
```

- [ ] **Step 4: Wire up Glasgow Kite in terrain decoration spawning**

Find where terrain decorations are spawned (likely in GameScene) and add `deco_glasgow_kite` to the decoration pool. Search for `deco_heather` or `deco_rock` references to find the spawn logic.

- [ ] **Step 5: Visual verify**
- [ ] **Step 6: Commit**

```bash
git add src/scenes/BootScene.ts src/scenes/GameScene.ts
git commit -m "art: terrain — traffic cone on rocks, Glasgow Kite floating bag decoration"
```

---

## Task 17: Generic Boss Fallback — Quick Polish

**Files:**
- Modify: `src/scenes/BootScene.ts:1309-1342` (`createBoss`)

The generic boss is just a red circle with horns. Give it more menace — darker red gradient, sharper horns, angrier eye slit shape.

- [ ] **Step 1: Polish `createBoss`**

```typescript
private createBoss(): void {
    const s = 72;
    const g = this.add.graphics();
    const cx = s / 2, cy = s / 2;

    // Menacing dark body (deeper gradient)
    g.fillStyle(0x330808, 1);
    g.fillCircle(cx, cy, 32);
    g.fillStyle(0x661111, 1);
    g.fillCircle(cx, cy, 28);
    g.fillStyle(0x992222, 1);
    g.fillCircle(cx, cy, 22);
    g.fillStyle(0xaa2a2a, 0.6);
    g.fillCircle(cx - 3, cy - 3, 16);
    // Crown horns (sharper, more menacing)
    g.fillStyle(0x664400, 1);
    g.fillTriangle(cx - 14, cy - 24, cx - 10, cy - 10, cx - 19, cy - 10);
    g.fillTriangle(cx, cy - 28, cx - 5, cy - 10, cx + 5, cy - 10);
    g.fillTriangle(cx + 14, cy - 24, cx + 10, cy - 10, cx + 19, cy - 10);
    g.fillStyle(0xddaa00, 1);
    g.fillTriangle(cx - 13, cy - 22, cx - 11, cy - 11, cx - 17, cy - 11);
    g.fillTriangle(cx, cy - 26, cx - 4, cy - 11, cx + 4, cy - 11);
    g.fillTriangle(cx + 13, cy - 22, cx + 11, cy - 11, cx + 17, cy - 11);
    // Horn tips (bright gold)
    g.fillStyle(0xffcc33, 1);
    g.fillCircle(cx - 14, cy - 23, 1.5);
    g.fillCircle(cx, cy - 27, 1.5);
    g.fillCircle(cx + 14, cy - 23, 1.5);
    // Evil eyes (narrowed slits, not circles)
    g.fillStyle(0xffff00, 1);
    g.fillEllipse(cx - 9, cy - 4, 12, 6);
    g.fillEllipse(cx + 9, cy - 4, 12, 6);
    g.fillStyle(0xff0000, 1);
    g.fillEllipse(cx - 9, cy - 4, 6, 4);
    g.fillEllipse(cx + 9, cy - 4, 6, 4);
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx - 9, cy - 4, 1.5);
    g.fillCircle(cx + 9, cy - 4, 1.5);

    g.generateTexture('boss', s, s);
    g.destroy();
  }
```

- [ ] **Step 2: Visual verify**
- [ ] **Step 3: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "art: generic boss — deeper gradient, sharper horns, menacing slit eyes"
```

---

## Task 18: Entity & Boss Shadows — Green Tint for Grass

**Files:**
- Modify: `src/scenes/BootScene.ts:168-194` (`createEntityShadow`, `createBossShadow`)

Shadows should have a subtle green tint — they're on grass, not concrete.

- [ ] **Step 1: Update shadow colors**

In `createEntityShadow`, change the three `0x000000` fills to `0x0a1a0a` (very dark green):

```typescript
private createEntityShadow(): void {
    const s = 40;
    const g = this.add.graphics();
    g.fillStyle(0x0a1a0a, 0.25);
    g.fillEllipse(s / 2, s / 2, 36, 12);
    g.fillStyle(0x0a1a0a, 0.4);
    g.fillEllipse(s / 2, s / 2, 28, 9);
    g.fillStyle(0x0a1a0a, 0.55);
    g.fillEllipse(s / 2, s / 2, 20, 6);
    g.generateTexture('entity_shadow', s, s);
    g.destroy();
  }
```

Same for `createBossShadow`:

```typescript
private createBossShadow(): void {
    const s = 80;
    const g = this.add.graphics();
    g.fillStyle(0x0a1a0a, 0.25);
    g.fillEllipse(s / 2, s / 2, 74, 24);
    g.fillStyle(0x0a1a0a, 0.4);
    g.fillEllipse(s / 2, s / 2, 58, 18);
    g.fillStyle(0x0a1a0a, 0.55);
    g.fillEllipse(s / 2, s / 2, 42, 12);
    g.generateTexture('boss_shadow', s, s);
    g.destroy();
  }
```

- [ ] **Step 2: Visual verify**
- [ ] **Step 3: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "art: shadows — subtle green tint for grass ground"
```

---

## Task 19: Nest — Polish Pass

**Files:**
- Modify: `src/scenes/BootScene.ts:1997-2041` (`createNest`)

Add a wee feather sticking out, more twig criss-crossing, slightly warm-toned eggs.

- [ ] **Step 1: Add details to nest**

After the egg speckles section (around line 2037), before `generateTexture`:

```typescript
    // Wee feather sticking out (brown, wispy)
    g.fillStyle(0x886644, 0.8);
    g.fillTriangle(cx + 12, cy - 4, cx + 16, cy - 8, cx + 13, cy - 2);
    g.fillStyle(0xaa8866, 0.6);
    g.fillTriangle(cx + 12, cy - 3, cx + 15, cy - 7, cx + 13, cy - 2);
    // Feather spine
    g.lineStyle(0.5, 0x664422, 0.7);
    g.lineBetween(cx + 12, cy - 2, cx + 15, cy - 7);
```

- [ ] **Step 2: Visual verify**
- [ ] **Step 3: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "art: nest — wee feather sticking out, extra detail"
```

---

## Task 20: Final Visual Regression Test & Build Check

**Files:** None modified — verification only.

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: All existing tests pass (art changes don't affect logic).

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: Clean build, no TypeScript errors.

- [ ] **Step 3: Full visual regression in dev server**

```bash
npm run dev
```

Play through a full game run checking:
- All enemy sprites render correctly
- No missing textures (check console for Phaser texture warnings)
- Boss sprites appear at correct times with new art
- Projectiles (thistle, caber, haggis ball) look right in motion
- Health orb (now Irn-Bru orange) is visible and readable
- Chest sprite renders with tartan trim
- Terrain decorations include traffic cone on rocks
- Glasgow Kite decoration spawns (if wired up)
- Shadows have subtle green tint on grass

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "art: final visual regression fixes"
```
