# Connect System — Design Document

## The Problem

The current "Visit Connect" button is buried in the sidebar and easy to miss.
The connect system exists but feels passive — players don't feel the pull of
buying bulk because there's no drama around it.

## The Vision

You travel to a borough and — sometimes — a connect reaches out. It feels
organic, risky, and rewarding. Bulk buying is tempting but never "free money."
There's always a catch.

---

## Core Design Principles

1. **Connects find YOU** — not the other way around. Travelling triggers the
   encounter, not a sidebar button.
2. **Bulk = cheaper per unit, but more dangerous** — carrying a large load
   raises your heat and makes you a target.
3. **Trust has to be earned** — a connect won't sell to a stranger. Rep gates
   access. Screw them over and they're gone.
4. **Scarcity** — a connect only has stock for a limited window. Miss the
   window, miss the deal.

---

## Proposed Mechanics

### 1. Encounter Trigger (Travel Event)

When you travel to a borough, there's a % chance a connect encounter fires.

**Chance formula:**
```
base = 15%
+ reputation bonus  (up to +20% at max rep)
- borough heat penalty (up to -10% if heat is very high — connects go quiet)
- cooldown penalty  (0% if you used this connect within last 3 days)
```

The encounter replaces (or follows) the existing police/vendor event roll.

---

### 2. The Offer Modal

A connect approaches with a specific drug, quantity and price:

```
[ CONTACT ]
"Ghost" — Bronx Supplier

  Heroin   ·  50 oz  ·  €38/g  (street: €137/g)
  Purity: 78%

  You need: 50 oz capacity + €1,900 cash

  [ TAKE THE DEAL ]   [ PASS ]
```

**Price:** 25–45% below street sell price (varies by connect loyalty tier)
**Quantity:** Fixed lot size — you take all of it or none.
**Purity:** Real (no inflation). You still decide whether to cut it later.

---

### 3. Restrictions & Risk (the "catch")

#### A — Carry Weight
Bulk lots are large. Taking a 50 oz deal when your coat only holds 30 oz means
you need stash space. If you can't fit it, you can't take it.

#### B — Heat Spike
Every bulk buy raises borough heat by a fixed amount (e.g. +8 heat).
A connect deal is a larger transaction — more eyes on it.
High heat = more police encounters next travel.

#### C — Cash Upfront
No credit. No negotiation. Full cash required at the moment of the offer.
Miss the cash, miss the deal. (Vinnie won't loan for this.)

#### D — Loyalty / Trust Tier
Each connect has a trust level (0–3):

| Tier | Unlocked at rep | Lot size | Discount |
|------|----------------|----------|----------|
| 0    | Rep 0           | 10 oz    | 15% off  |
| 1    | Rep 15          | 25 oz    | 25% off  |
| 2    | Rep 35          | 50 oz    | 35% off  |
| 3    | Rep 60          | 100 oz   | 45% off  |

Trust increases by 1 each time you successfully buy from a connect.
Trust resets to 0 if you get arrested in their borough (you talked).

#### E — Rivalry / Exclusivity
Each connect specialises in 1–2 drugs. They won't offer anything else.
Two connects in the same borough are rivals — using one locks out the other
for 5 days.

#### F — Bad Deal Risk
Rarely (10% chance), the connect has "stepped-on" product — purity is
secretly 20–40% lower than advertised. You only find out when you try to sell.
This models the real risk of buying from unknown supply chains.
Higher trust tier = lower bad deal chance (5% → 2% → 1% → 0%).

---

### 4. Connect Roster (8 connects, one per borough)

| Name       | Borough       | Specialty         |
|------------|---------------|-------------------|
| Ghost      | Bronx         | Heroin, Crack     |
| La Reina   | Brooklyn      | Cocaine, Molly    |
| Jimmy Two  | Queens        | Weed, PCP         |
| The Greek  | Manhattan     | Cocaine, LSD      |
| Sal         | Staten Island | Heroin, Adderall  |
| Yung B     | Yonkers       | Crack, Shrooms    |
| El Primo   | Newark        | Cocaine, Weed     |
| Dex        | Jersey City   | Molly, Speed      |

---

### 5. UI Changes

- **Remove** the "Visit Connect" sidebar button entirely.
- Encounters surface via the existing travel event flow (modal popup).
- Add a **CONTACTS** section to the end-of-day summary (or a hotkey panel)
  showing known connects, their borough, specialty, and last seen day.
- Optionally show a subtle borough indicator (e.g. a `[C]` tag on the travel
  button) when a connect is active in that borough right now.

---

### 6. Progression Feel

| Days 1–10  | No connects available. Build rep through street trading.       |
| Days 10–25 | First low-tier connects start appearing. Small lots.           |
| Days 25–60 | Mid-tier connects. Larger lots, better margins. More risk.     |
| Days 60+   | High-tier connects. 100 oz lots. Borough heat climbs fast.     |

---

## Open Questions

- Should connects be permanently lost if you get busted with their product
  (i.e. police search finds > X oz of their specialty drug)?
- Do we want a "burnt connect" mechanic — a connect who gets arrested
  disappears from your roster for the rest of the game?
- Should the bad deal risk also include a "rob you" variant at low trust?
- Should connecting with Tommy Bags' favour unlock a specific high-tier connect
  (Sal on Staten Island) as a story beat?

---

## Implementation Order (suggested)

1. Data: update `connects.js` with the 8 names, boroughs, specialties, trust
2. Engine: `connectEncounter()` in `turn.js` — roll, build offer, return result
3. UI: `showConnectModal()` in `main.js` — replace current visit flow
4. UI: Remove "Visit Connect" sidebar button
5. State: add `connectTrust`, `connectCooldown`, `connectRoster` to state
6. Balance: playtesting pass on discount %, heat spike, lot sizes
