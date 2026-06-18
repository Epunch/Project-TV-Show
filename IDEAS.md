# 💡 Drug Wars — Feature Ideas & Design Notes

> This file is our living brainstorm document.
> Anything here is a candidate for implementation — not a commitment.
> Mark items `[x]` when built, `[~]` when in progress, `[ ]` when still an idea.

---

## 📖 Background & Inspiration

Drug Wars was originally written in **1984 by John E. Dell** as a high school project for IBM PC.
It was inspired by the 1979 BASIC game **Taipan!** (a sea-trading arbitrage game).

The core loop has never changed:

> Buy low → travel → sell high → dodge cops → pay off the shark → repeat.

Notable spin-offs worth drawing inspiration from:

- **Dope Wars (Beermat Software)** — most downloaded free game of the early 2000s (6.5M downloads)
- **DrugWars 2: International (TI-83)** — added RPG elements and cop fights
- **GTA: Chinatown Wars** — price trend maps, email tips on good deals
- **Zynga Dope Wars** — MMORPG style: workers, fight club, cartel building
- **Drug Lord 2** — deeper economy simulation

---

## ✅ Already Built

- [x] 10 drugs with fluctuating daily prices (spikes + crashes)
- [x] 8 locations with heat modifiers affecting police chance
- [x] Turn-based travel (each travel = 1 day)
- [x] Loan shark with daily compounding interest
- [x] Bank with daily interest on deposits
- [x] Trench coat with upgradeable capacity
- [x] Home stash (safe unlimited storage)
- [x] Guns (protection against muggers)
- [x] 11 random events (police raids, muggers, windfalls, market crashes)
- [x] Dark / light theme switcher with localStorage persistence
- [x] Player name entry on intro screen
- [x] Win / lose detection at end of 30 days

---

## 🎮 Game Mode: Classic vs Custom

### Classic Mode

Locks all settings to the original game values. No changes, pure nostalgia.

| Setting       | Classic Value  |
| ------------- | -------------- |
| Days          | 30             |
| Starting cash | $2,000         |
| Starting debt | $5,500         |
| Interest rate | 10% / day      |
| Coat capacity | 100 units      |
| Locations     | 8 NYC boroughs |

### Custom Mode

Player can tweak the game before starting. Shown on the intro screen as a collapsible
"Advanced Settings" section.

**Two things scale together with game length — debt goes up, interest rate comes down.**

This mirrors how real-world loans work: a longer term means more total debt, but a
lower periodic rate because you have more time to service it. Shorter games are
intense and punishing; longer games are more relaxed but require managing a bigger
starting hole.

**Debt scaling — linear with days:**

```
debt = BASE_DEBT × (days / BASE_DAYS)
     = $5,500  × (days / 30)
```

| Days | Starting Debt    |
| ---- | ---------------- |
| 10   | ~$1,833          |
| 20   | ~$3,667          |
| 30   | $5,500 ✦ classic |
| 45   | $8,250           |
| 60   | $11,000          |
| 90   | $16,500          |

**Interest rate scaling — inverse of days (longer loan = lower daily rate):**

```
rate = BASE_RATE × (BASE_DAYS / days)
     = 10%      × (30 / days)
```

| Days | Daily Interest Rate             |
| ---- | ------------------------------- |
| 10   | 30% / day ← brutal short game   |
| 20   | 15% / day                       |
| 30   | 10% / day ✦ classic             |
| 45   | ~6.7% / day                     |
| 60   | 5% / day                        |
| 90   | ~3.3% / day ← relaxed long game |

Both values are calculated automatically from the chosen day count — the player only
needs to move one slider. The debt and rate previews update live on the intro screen.

**Settings to expose in Custom Mode:**

| Setting            | Min                     | Default | Max     | Notes                                |
| ------------------ | ----------------------- | ------- | ------- | ------------------------------------ |
| Game length (days) | 10                      | 30      | 90      | Debt + rate both scale automatically |
| Starting cash      | $500                    | $2,000  | $10,000 |                                      |
| Starting coat size | 50                      | 100     | 200     |                                      |
| Police aggression  | Low / Normal / High     | Normal  |         | Multiplier on base police chance     |
| Market volatility  | Calm / Normal / Chaotic | Normal  |         | How wild price swings are            |

> **Note:** Interest rate is no longer a free setting — it is always derived from days.
> This prevents exploitable combinations (e.g. 90 days + 1% rate = trivially easy).

---

## 🔥 Game Mode: Hustler Mode

A completely separate game mode designed for **longer, deeper gameplay** with RPG-like
mechanics. This is NOT an extension of Classic or Custom — it's its own thing.

Classic keeps its pure 30-day nostalgia. Hustler mode is where all the new features live.

### Why a separate mode?

The new features (HP, combat, items, tips, day summaries) fundamentally change the
pacing and feel of the game. Cramming them into a 30-day sprint would be overwhelming.
Hustler mode gives the player 60–365 days to explore all the new systems.

### Hustler Mode Defaults

| Setting             | Hustler Value          | Notes                              |
| ------------------- | ---------------------- | ---------------------------------- |
| Days                | 60–365 (player choice) | Slider on intro screen             |
| Starting cash       | $2,000                 | Same as classic                    |
| Starting debt       | Scales with days       | `$5,500 × (days / 30)`             |
| Interest rate       | Scales with days       | `10% × (30 / days)`, capped at 10% |
| Coat capacity       | 100 units              | Same as classic                    |
| Starting HP         | 100                    | New: health system                 |
| Locations           | 8 NYC boroughs         | Same as classic                    |
| Officer Hardass     | ✅ Enabled             | Named cop with escalating deputies |
| Big Vinnie          | ✅ Enabled             | Named loan shark with personality  |
| Street intel / tips | ✅ Enabled             | Daily tip system (sometimes false) |
| Special items       | ✅ Enabled             | Street vendor with one-off items   |
| Day summary         | ✅ Enabled             | End-of-day modal recap             |
| Fight/Run/Surrender | ✅ Enabled             | Interactive police encounters      |

### 🏥 Health / Hit Points System

The original game tracked **health** — you could be shot by cops or beaten by muggers.

- Player starts with **100 HP**
- Mugger beatdowns and police shoot-outs reduce HP
- Reaching **0 HP = instant game over** (regardless of remaining days)
- Can buy **bandages** ($200, +20 HP) or visit a **clinic** ($1,000, full heal)
  - Clinic only available in certain locations
- Guns increase your damage in a fight; more deputies = more incoming damage
- HP shown as a bar in the stats row
- Adds real stakes to every police encounter — you can't just tank everything

### 🚔 Officer Hardass — Named Police Encounters

The original had a named cop: **Officer Hardass**.

- Instead of generic "police" events → named encounters with flavour text
- Hardass starts solo; gains **+1 deputy every 10 days** (escalating difficulty)
- **Fight / Run / Surrender** choice screen (modal) instead of auto-resolving:
  - **Fight** — costs HP, risk losing drugs; if you win → cash reward + keep drugs
  - **Run** — chance to escape based on coat load (heavier = harder to run);
    fail = drop some drugs + take HP damage
  - **Surrender** — lose ALL drugs on person, go to jail for 1–3 days (skip turns),
    but take no HP damage
- Each gun gives +5% fight success chance
- Deputies increase incoming damage and reduce run success chance

### 🏦 Big Vinnie — Named Loan Shark

- Give the shark a name and personality: **Big Vinnie**
- Vinnie's boys show up more frequently as debt grows past $10,000
- Special event: Vinnie offers a **debt forgiveness deal** — do a dangerous job for him
  (e.g. carry a specific drug to a specific location within 3 days)
- Failing Vinnie's job → his boys rough you up (HP damage + cash stolen)

### 📱 Street Intel — Tip System

Inspired by GTA: Chinatown Wars' email system.

- On each new day, receive a random **tip** in the event log:
  - _"Word is Weed prices are spiking in Brooklyn tomorrow"_
  - _"Cops are doing sweeps in Manhattan all week"_
  - _"Someone's flooding the market with cheap Molly"_
- Tips are **~70% accurate**, **~30% false** (street rumours)
- Adds a meta-game layer — do you trust the tip?
- Tips appear as a distinct styled entry in the log (different colour / icon)

### 🎲 Special Items — Street Vendor

Randomly when you travel (~15% chance), a **street vendor** appears with a modal offer:

| Item                 | Cost   | Effect                                            |
| -------------------- | ------ | ------------------------------------------------- |
| **Police Scanner**   | $800   | Reveals today's police heat level per borough     |
| **Fake ID**          | $1,200 | Auto-skip the next police encounter (one-use)     |
| **Burner Phone**     | $600   | Guarantees accurate tips for the next 5 days      |
| **Bulletproof Vest** | $900   | Absorbs next HP damage from mugging or police hit |
| **Bandages**         | $200   | Restore 20 HP immediately                         |

- Only one item offered per vendor visit (random pick)
- Player can buy or decline
- Items stored in a simple `state.items` inventory (max 5 items)
- One-use items consumed on trigger; passive items last N days

### 📅 Day Summary Panel

After each travel, before the market loads, show a **"Day X Summary"** modal:

```
┌─────────────────────────────────────────┐
│          📅 DAY 7 SUMMARY               │
│─────────────────────────────────────────│
│  📍 Traveled to: Brooklyn               │
│                                         │
│  ⚠ Officer Hardass spotted you!         │
│    → You chose to RUN — escaped!        │
│    → Dropped 3 units of Weed            │
│                                         │
│  💰 Cash change: -$420                  │
│  🏦 Debt interest: +$550               │
│  🏥 HP: 100 → 85 (-15)                 │
│                                         │
│  💡 Tip: "Cocaine prices dropping in    │
│     Queens tomorrow"                    │
│                                         │
│          [ CONTINUE ]                   │
└─────────────────────────────────────────┘
```

- Gives the player a moment to absorb what happened
- Shows: events, cash delta, debt interest, HP change, tip of the day
- Single "Continue" button dismisses it and shows the market

---

## 🆕 Feature Ideas (Future)

> These are ideas for future phases. Not tied to any specific game mode yet.

### 📈 Price History Chart

Inspired by GTA: Chinatown Wars.

- Small sparkline chart next to each drug showing the last 5 days of prices
- Helps players spot trends and plan their trades
- Built with a simple canvas/SVG mini-chart — no external libraries

### 🌍 City Expansion — Multiple Cities

- After paying off debt, unlock a **new city** (e.g. Miami, Chicago, London)
- Each city has different drugs, prices, and police behaviour
- Travel between cities costs a full day + flight fee
- City-specific events: Miami has cartel ambushes, London has undercover cops

### 🤝 Contacts System

- As you trade in a location, you build **reputation** there
- High rep unlocks a **contact** — a local dealer who:
  - Tips you off to price spikes 1 day early
  - Occasionally sells you drugs at below-market rates
  - Can store drugs in their stash (alternative to home stash)

### 💰 Score & Leaderboard

- End-of-game score formula (like the original):
  ```
  score = (final_cash_millions × 2)  →  max 100/100 at $50M
  ```
- **Local leaderboard** stored in localStorage — top 10 runs with name, score, days, mode
- Shown on end screen + accessible from a "Hall of Fame" button on the intro

### 🏆 Achievements

Small pop-up toasts for milestone moments:
| Achievement | Trigger |
|---|---|
| **First Blood** | Make your first sale |
| **Clean Hands** | Finish a game with 0 police encounters |
| **Debt Free** | Pay off the shark before day 15 |
| **Whale** | Reach $1,000,000 cash |
| **Paranoid** | Own 10 guns at once |
| **Bad Trip** | Lose 50+ units in a single police raid |
| **Shark Bait** | Let debt exceed $50,000 |

### 🎵 Sound & Atmosphere

- Subtle ambient sound effects:
  - Street noise on travel
  - Cash register on buy/sell
  - Police siren on cop events
  - Heartbeat when debt is critical
- All sounds toggleable via a mute button in the header
- No external audio library needed — Web Audio API

### 🧮 Auto-Sell / Auto-Buy Suggestions

- "Best deal" indicator next to each drug in the market:
  - 🔴 = price is high (good time to sell)
  - 🟢 = price is low (good time to buy)
  - Based on where the current price sits within the drug's historical min/max range

### 🗺️ Location Heat Map

- Visual representation of the 8 locations in the sidebar
- Each location shown as a coloured dot/badge: 🟢 cool → 🟡 warm → 🔴 hot
- Heat updates each day based on how many police events occurred there recently

---

## 🛠️ Intro Screen Design

The intro screen has two layers:

**Top row — Classic game controls:**

```
[ CLASSIC ]  [ CHOOSE DAYS ]  [ ADVANCED SETTINGS ]
```

These three buttons all play the **classic game** (no new features). They only
change how much the player can configure before starting.

**Below the row — the new mode:**

```
──────────────── or ────────────────

      [ 🔥 HUSTLER MODE ]
```

A single large button that launches the completely separate Hustler experience.
All features are baked in — no options to toggle. Clicking it opens an
**information screen** that explains what Hustler mode is, then the player
clicks **START** from there.

---

### Classic (top-left button)

Starts immediately with locked 30-day defaults. No settings, no new features.

### Choose Days (top-centre button)

Shows a single slider for day count (10–90). Debt and interest scale automatically.
Same classic gameplay, just variable length.

### Advanced Settings (top-right button)

Expands a settings panel with full control over the classic game:

| Setting            | Min                     | Default | Max     | Notes                                |
| ------------------ | ----------------------- | ------- | ------- | ------------------------------------ |
| Game length (days) | 10                      | 30      | 90      | Debt + rate both scale automatically |
| Starting cash      | $500                    | $2,000  | $10,000 |                                      |
| Starting coat size | 50                      | 100     | 200     |                                      |
| Police aggression  | Low / Normal / High     | Normal  |         | Multiplier on base police chance     |
| Market volatility  | Calm / Normal / Chaotic | Normal  |         | How wild price swings are            |

### 🔥 Hustler Mode (big button below)

Clicking this opens a **full-screen information panel** (replaces the intro box)
that explains what the mode includes:

```
┌─────────────────────────────────────────────────┐
│              🔥 HUSTLER MODE                     │
│─────────────────────────────────────────────────│
│                                                  │
│  The streets got meaner. Welcome to the long     │
│  game — 60 to 365 days of hustle.                │
│                                                  │
│  🏥 HEALTH SYSTEM                                │
│  You start with 100 HP. Cops and muggers hurt.   │
│  Hit 0 and you're done — no matter the day.      │
│                                                  │
│  🚔 OFFICER HARDASS                              │
│  A named cop who gets tougher every 10 days.     │
│  Fight, Run, or Surrender — your call.           │
│                                                  │
│  🏦 BIG VINNIE                                   │
│  Your loan shark has a name and a temper.         │
│  Ignore your debt and his boys come knocking.    │
│                                                  │
│  📱 STREET INTEL                                 │
│  Daily tips on prices and police heat.           │
│  Trust them? About 70% are legit.                │
│                                                  │
│  🎲 STREET VENDOR                                │
│  Random items for sale when you travel.           │
│  Fake IDs, scanners, vests, bandages.            │
│                                                  │
│  📅 DAY SUMMARY                                  │
│  End-of-day recap so you don't miss a thing.     │
│                                                  │
│  Days: [──────────●──────] 120                   │
│  > Debt: $22,000  |  Interest: ~2.5% / day       │
│                                                  │
│        [ START HUSTLER MODE ]                    │
│              [ ← BACK ]                          │
└─────────────────────────────────────────────────┘
```

The info screen has a days slider (60–365) and shows live debt/interest preview.
All features are always on — no checkboxes. Player reads the info, picks their
day count, and clicks START.

---

---

## 🌆 New Mode Concept: REALISM MODE — "Street Economics"

> **Research basis:** Real US street drug prices (DEA / UNODC data, 2023–2024),
> realistic supply chain economics, and multi-tier dealer hierarchy.

### The Core Problem With Classic Mode's Prices

The original Drug Wars prices are arcade fantasy:

- Cocaine: $15,000–$30,000 per "unit" (no unit defined)
- Heroin: $5,000–$14,000

In reality (2024, NYC market, per gram):
| Drug | Wholesale (g) | Street retail (g) | Notes |
| ---------- | ------------- | ------------------ | ----- |
| Cocaine | $25–$45 | $60–$120 | Pure; cut product cheaper |
| Heroin | $80–$180 | $150–$250 | DEA: 8–10× cocaine value |
| Fentanyl | $1–$5 | $30–$80 | Sold as "heroin"; deadly |
| Meth (ice) | $3–$10 | $5–$20 | Cartels flooded market |
| Crack | $10–$20 | $15–$40 | Per rock (0.2–0.5g) |
| Weed | $3–$7 | $10–$25 | Dispensary competing |
| MDMA/Molly | $20–$40 | $30–$80 | Per gram powder |
| LSD | $0.50–$2 | $5–$15 | Per tab (100µg) |
| Shrooms | $5–$10 | $10–$25 | Per gram |
| Adderall | $2–$5 | $5–$15 | Per 30mg pill |

**Key insight:** The classic game's "unit" is best interpreted as a **small bulk lot**
(e.g., an ounce or a bundle), not a single gram. Realism Mode makes this explicit.

---

### 🏪 The Dealer Network (New Mechanic)

The biggest new idea: **you can't buy from the open market alone.**
In real street economics, product moves through a chain:

```
Cartel / Wholesaler
      ↓
Mid-level Distributor (your "connect")
      ↓
You (street dealer / small operator)
      ↓
End users on the street
```

**In Realism Mode, this becomes:**

1. **Your Connect** — A named mid-level dealer in each borough. You have to
   _find_ them first (by reputation, tips, or random encounter). Each connect
   specialises in 1–3 drugs, sells in bulk at wholesale prices, and has
   limited stock per day. Their prices fluctuate based on supply pressure.

2. **Street Market** — You can still sell to random buyers on the street at
   retail prices (existing mechanic). But _buying_ from the street is now
   expensive (retail prices), inefficient, and attracts more police attention.

3. **Stash Houses** — Each borough has a stash house you can use to store product
   safely. Unlike the classic "home stash" (always safe), stash houses can be
   raided (low probability, tied to borough heat).

---

### 🧑 Connect Characters (Named Dealers Per Borough)

Each connect has a personality that affects gameplay:

| Borough    | Connect    | Specialty      | Personality trait         |
| ---------- | ---------- | -------------- | ------------------------- |
| Bronx      | Rico       | Crack, Coke    | Reliable but pricey       |
| Brooklyn   | D-Nice     | Weed, Molly    | Best prices, flaky stock  |
| Queens     | Jin        | Meth, Fentanyl | Strict — no credit        |
| Manhattan  | Claudette  | Coke, LSD      | Expensive; high quality   |
| Staten Is. | Tommy Bags | Heroin, Crack  | Owes you favours          |
| Yonkers    | Manny      | Weed, Shrooms  | Paranoid; random no-shows |
| Newark     | Lil Ray    | Meth, Adderall | Generous but heat magnet  |
| Jersey     | The Swede  | LSD, Molly     | Rare finds; premium price |

Connects must be **unlocked**:

- Some start available from day 1 (Bronx, Brooklyn)
- Others require reputation (measured by total volume traded)
- One requires completing a favour (similar to Vinnie's job mechanic)

---

### 💲 Realistic Pricing Engine

Instead of random ranges per drug, Realism Mode uses a **supply/demand model**:

```
basePrice = realWorldWholesale[drug]          // anchored to real data
streetMultiplier = 2.5x – 4x                  // what retail customers pay
connectPrice = basePrice × (0.8 – 1.1)        // wholesale, varies daily
streetBuyPrice = connectPrice × streetMultiplier // expensive if no connect
supplyShock = borough heat × recent busts     // reduces available stock
```

**Unit system (explicit):**

- All prices are **per ounce** (28g), the standard mid-level trade unit
- Display shows both price/oz and price/g for clarity
- Carry capacity is in ounces (trench coat = 10 oz default)

**Price modifiers:**

- **Drought** event: supply drops 50%, price spikes 2–3×
- **Flood** event: cartel shipment lands, price drops 40% for 2–3 days
- **Bust** event: competitor taken down, raises prices in that borough
- **Quality** variance: each lot is 60–100% pure; high purity = resell premium

---

### 📊 The Street Economy Loop

**Classic mode loop:**

```
Buy drug → Travel → Sell drug → repeat
```

**Realism mode loop:**

```
Contact connect → Negotiate bulk buy → Assess quality
→ Travel to sell turf → Find buyers → Negotiate price
→ Manage heat from volume → Pay tax (Vinnie / territory fee)
→ Build reputation → Unlock better connects → Scale up
```

**New mechanics this requires:**

| Mechanic              | Description                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| **Reputation**        | Grows with volume traded. Unlocks better connects & prices.                                      |
| **Territory tax**     | Each borough has a crew that taxes dealers (2–8% of sales). Ignore it → trouble.                 |
| **Heat accumulation** | Unlike classic (resets on travel), heat now builds borough-by-borough over time.                 |
| **Quality lots**      | When buying, you see purity %. Affects resale price. You can cut it (more units, lower quality). |
| **Credit system**     | Trusted connects offer fronting (buy now, pay next visit). Miss payment → relationship damaged.  |
| **Stash house raids** | 3–8% daily chance per stash house, rises with borough heat. Lose stored product.                 |

---

### 🎭 The "Cut" Mechanic

One of the most realistic features of the street trade: **cutting product**.

> You buy 1 oz of cocaine at 80% purity for $2,000.
> You cut it to 60% purity → now you have 1.3 oz equivalent to sell.
> Street buyers pay for quantity, not purity (unless they're savvy).
> **Risk:** if you cut too aggressively, buyers stop returning. Reputation drops.

Implementation:

- Each drug lot has a `purity` value (60–100%)
- Players can cut (reduce purity, increase volume) using a slider
- Purity is tracked and slightly affects sell price
- Events: "Word's out your stuff is garbage" → reduced buyers for 3 days

---

### 🔫 Territory & Crew Mechanics (optional deeper layer)

Inspired by the real Chicago gang study (Freakonomics / Sudhir Venkatesh research:
a franchise crew of 25–75 foot soldiers, with complex revenue splits):

- **Hire workers**: Pay $50/day for a runner who can carry 2 extra oz
- **Turf protection**: Pay a crew to protect your stash house (+reduces raid chance)
- **Rival gangs**: Occasionally muscle in on your turf → either pay, fight, or relocate

---

### 🎛️ Mode Design: How To Enter Realism Mode

Add to the intro screen (below Hustler Mode button):

```
┌─────────────────────────────────────────────────┐
│          ─────── or ───────                     │
│                                                 │
│  📊 REALISM MODE                                │
│  "Street-accurate prices. Real supply chain.    │
│   Find your connect. Build your rep."           │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Realism Mode info screen features:**

- 📊 Real-world pricing (per oz, realistic street rates)
- 🤝 Connect system (find named dealers per borough)
- 💊 Quality & cutting mechanic
- 🌡️ Persistent borough heat
- 🏚️ Stash houses (with raid risk)
- 📈 Reputation system
- 💸 Territory tax

**Game length options:** 30 / 60 / 90 days (more meaningful with slower grind)
**Starting cash:** $500 (realistic — you're just starting out)
**Starting debt:** $2,000 (smaller, but interest is steeper: 15%/day)
**Goal:** Accumulate $50,000 net worth and pay off debt

---

### 🗃️ Data Files Needed (New)

```
src/data/connects.js    — Connect character definitions per borough
src/data/lots.js        — Drug lot system (purity, quantity, source)
src/engine/reputation.js — Reputation tracking & unlock logic
src/engine/territory.js  — Territory tax & crew mechanics
src/ui/connect-modal.js  — Connect buying interface
```

### 🔧 Modified Files

```
src/data/drugs.js       — New realistic price ranges (per oz)
src/engine/market.js    — Supply/demand model instead of random range
src/engine/state.js     — Add: reputation, connects[], heatPerBorough[], stashHouses[]
src/main.js             — New Realism Mode flow
index.html              — Realism Mode button + info screen
```

---

### ⚖️ Design Principles for Realism Mode

1. **Anchored to reality** — prices within 20% of real DEA/UNODC data
2. **The grind is real** — you don't get rich overnight; margins are thin until you scale
3. **Information matters** — knowing your connect's specialty is worth more than lucky price rolls
4. **Supply chain thinking** — buying smart (wholesale via connect) beats buying dumb (street retail)
5. **Risk compounds** — heat doesn't reset; bad decisions follow you across boroughs
6. **Still a game** — compressed into 30–90 days; won't simulate a real career (but feels like one)

---

### 🆚 Comparison: Classic vs Hustler vs Realism

| Feature              | Classic          | Hustler              | Realism                                   |
| -------------------- | ---------------- | -------------------- | ----------------------------------------- |
| Price anchor         | Fantasy          | Fantasy              | Real-world (per oz)                       |
| Market model         | Random range     | Random + events      | Supply/demand + connects                  |
| Buy source           | Open market      | Open market          | Connect (wholesale) or street (expensive) |
| Heat model           | Per-travel reset | Per-travel + Hardass | Persistent per-borough                    |
| Named characters     | Vinnie (Hustler) | Vinnie + Hardass     | Vinnie + connects + territory crew        |
| HP system            | ❌               | ✅                   | ✅ (same as Hustler)                      |
| Reputation           | ❌               | ❌                   | ✅                                        |
| Drug quality/cutting | ❌               | ❌                   | ✅                                        |
| Stash houses         | Safe stash       | Safe stash           | Raidable stash houses                     |
| Difficulty           | Easy             | Medium               | Hard                                      |

---

## 🗓️ Suggested Implementation Order

| Priority  | Feature                               | Effort | Mode    |
| --------- | ------------------------------------- | ------ | ------- |
| 🔴 High   | Intro screen mode selector            | Small  | All     |
| 🔴 High   | Choose Days mode (debt/rate scaling)  | Small  | Custom  |
| 🔴 High   | Health / HP system                    | Medium | Hustler |
| 🔴 High   | Officer Hardass + Fight/Run/Surrender | Medium | Hustler |
| 🔴 High   | Big Vinnie (named shark)              | Small  | Hustler |
| 🔴 High   | Street intel / tip system             | Small  | Hustler |
| 🔴 High   | Special items / street vendor         | Medium | Hustler |
| 🔴 High   | Day summary modal                     | Small  | Hustler |
| 🟡 Medium | Price history sparklines              | Medium | Future  |
| 🟡 Medium | Score + local leaderboard             | Small  | Future  |
| 🟡 Medium | Achievements                          | Medium | Future  |
| 🟢 Low    | Contacts system                       | Large  | Future  |
| 🟢 Low    | City expansion                        | Large  | Future  |
| 🟢 Low    | Sound effects                         | Medium | Future  |
| 🟢 Low    | Location heat map                     | Medium | Future  |
