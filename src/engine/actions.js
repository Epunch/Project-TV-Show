/**
 * actions.js — All player actions that mutate game state.
 * Every action returns { ok: boolean, message: string }.
 */
import { DRUGS } from "../data/drugs.js";
import { GAME_CONSTANTS } from "../data/constants.js";
import { currentLoad } from "./state.js";
import { addSellRep, addBuyRep, penaliseRep } from "./reputation.js";
import { getStreetBuyPrice } from "./market.js";
import { fmtMoney, fmtWeight } from "../data/locale.js";

// ── Helper ────────────────────────────────────────────────────────────────────

function ok(message) {
  return { ok: true, message };
}
function fail(message) {
  return { ok: false, message };
}

// ── Trading ───────────────────────────────────────────────────────────────────

/**
 * Buy drugs from the street market into the trench coat.
 */
export function buyDrug(state, drugId, quantity) {
  quantity = Math.max(0, Math.floor(quantity));
  if (quantity === 0) return fail("Enter a valid quantity.");

  const price = state.market[drugId];
  if (price === undefined) return fail("Unknown drug.");

  const totalCost = price * quantity;
  if (totalCost > state.cash) return fail("Not enough cash.");

  const spaceLeft = state.maxHold - currentLoad(state);
  if (quantity > spaceLeft)
    return fail(`Not enough space in your coat. (${spaceLeft} left)`);

  state.cash -= totalCost;
  state.trenchCoat[drugId] += quantity;

  return ok(`Bought ${quantity} × ${drugId} for ${fmtMoney(totalCost)}.`);
}

/**
 * Sell drugs from the trench coat to the street market.
 */
export function sellDrug(state, drugId, quantity) {
  quantity = Math.max(0, Math.floor(quantity));
  if (quantity === 0) return fail("Enter a valid quantity.");

  const price = state.market[drugId];
  if (price === undefined) return fail("Unknown drug.");

  const carrying = state.trenchCoat[drugId] ?? 0;
  if (quantity > carrying) return fail(`You only have ${carrying} units.`);

  const earned = price * quantity;
  state.cash -= 0; // no subtraction on sell
  state.cash += earned;
  state.trenchCoat[drugId] -= quantity;

  return ok(`Sold ${quantity} × ${drugId} for ${fmtMoney(earned)}.`);
}

// ── Stash ─────────────────────────────────────────────────────────────────────

/**
 * Move drugs from trench coat → home stash.
 */
export function dropToStash(state, drugId, quantity) {
  quantity = Math.max(0, Math.floor(quantity));
  if (quantity === 0) return fail("Enter a valid quantity.");

  const carrying = state.trenchCoat[drugId] ?? 0;
  if (quantity > carrying)
    return fail(`You only have ${carrying} units in your coat.`);

  state.trenchCoat[drugId] -= quantity;
  state.stash[drugId] += quantity;

  return ok(`Stashed ${quantity} units of ${drugId}.`);
}

/**
 * Move drugs from home stash → trench coat.
 */
export function pickFromStash(state, drugId, quantity) {
  quantity = Math.max(0, Math.floor(quantity));
  if (quantity === 0) return fail("Enter a valid quantity.");

  const inStash = state.stash[drugId] ?? 0;
  if (quantity > inStash) return fail(`Only ${inStash} units in your stash.`);

  const spaceLeft = state.maxHold - currentLoad(state);
  if (quantity > spaceLeft)
    return fail(`Not enough coat space. (${spaceLeft} left)`);

  state.stash[drugId] -= quantity;
  state.trenchCoat[drugId] += quantity;

  return ok(`Picked up ${quantity} units of ${drugId} from stash.`);
}

// ── Banking ───────────────────────────────────────────────────────────────────

/**
 * Deposit cash into the bank.
 */
export function bankDeposit(state, amount) {
  amount = Math.max(0, Math.floor(amount));
  if (amount === 0) return fail("Enter a valid amount.");
  if (amount > state.cash) return fail("Not enough cash.");

  state.cash -= amount;
  state.bank += amount;

  return ok(`Deposited ${fmtMoney(amount)} in the bank.`);
}

/**
 * Withdraw cash from the bank.
 */
export function bankWithdraw(state, amount) {
  amount = Math.max(0, Math.floor(amount));
  if (amount === 0) return fail("Enter a valid amount.");
  if (amount > state.bank) return fail("Not enough in the bank.");

  state.bank -= amount;
  state.cash += amount;

  return ok(`Withdrew ${fmtMoney(amount)} from the bank.`);
}

// ── Loan shark ────────────────────────────────────────────────────────────────

/**
 * Pay down debt to the loan shark using cash.
 */
export function payDebt(state, amount) {
  amount = Math.max(0, Math.floor(amount));
  if (amount === 0) return fail("Enter a valid amount.");
  if (state.debt <= 0) return fail("You have no debt.");
  if (amount > state.cash) return fail("Not enough cash.");

  const paid = Math.min(amount, state.debt);
  state.cash -= paid;
  state.debt -= paid;

  if (state.debt <= 0) {
    state.debt = 0;
    return ok(`Debt cleared! You paid ${fmtMoney(paid)}.`);
  }
  return ok(`Paid ${fmtMoney(paid)}. Remaining debt: ${fmtMoney(state.debt)}.`);
}

/**
 * Borrow more cash from the loan shark.
 */
export function borrowFromShark(state, amount) {
  amount = Math.max(0, Math.floor(amount));
  if (amount === 0) return fail("Enter a valid amount.");

  state.cash += amount;
  state.debt += amount;

  return ok(`Borrowed ${fmtMoney(amount)}. New debt: ${fmtMoney(state.debt)}.`);
}

// ── Equipment ─────────────────────────────────────────────────────────────────

/**
 * Buy a gun.
 */
export function buyGun(state) {
  if (state.guns >= GAME_CONSTANTS.GUN_MAX)
    return fail(`You can't carry more than ${GAME_CONSTANTS.GUN_MAX} guns.`);
  if (state.cash < GAME_CONSTANTS.GUN_COST)
    return fail(`You need $${GAME_CONSTANTS.GUN_COST} to buy a gun.`);

  state.cash -= GAME_CONSTANTS.GUN_COST;
  state.guns += 1;

  return ok(`Bought a gun. You now have ${state.guns}.`);
}

/**
 * Upgrade trench coat capacity.
 */
export function upgradeCoat(state) {
  if (state.maxHold >= GAME_CONSTANTS.COAT_UPGRADE_MAX)
    return fail("Your coat is already maxed out.");
  if (state.cash < GAME_CONSTANTS.COAT_UPGRADE_COST)
    return fail(`Upgrade costs $${GAME_CONSTANTS.COAT_UPGRADE_COST}.`);

  state.cash -= GAME_CONSTANTS.COAT_UPGRADE_COST;
  state.maxHold += GAME_CONSTANTS.COAT_UPGRADE_SIZE;

  return ok(`Coat upgraded! New capacity: ${state.maxHold}.`);
}

// ── Hustler: Clinic ───────────────────────────────────────────────────────────

/**
 * Visit the clinic for a full HP heal (Hustler mode only, specific locations).
 */
export function visitClinic(state) {
  if (!state.isHustler && !state.isRealism)
    return fail("Clinic is only available in Hustler/Realism mode.");
  if (state.hp >= state.maxHp) return fail("You're already at full health.");
  if (!GAME_CONSTANTS.CLINIC_LOCATIONS.includes(state.location.id))
    return fail("No clinic here. Try Bronx or Manhattan.");
  if (state.cash < GAME_CONSTANTS.CLINIC_COST)
    return fail(
      `You need $${GAME_CONSTANTS.CLINIC_COST.toLocaleString()} for the clinic.`,
    );

  state.cash -= GAME_CONSTANTS.CLINIC_COST;
  const healed = state.maxHp - state.hp;
  state.hp = state.maxHp;

  return ok(
    `Full treatment at the clinic. Healed ${healed} HP. HP: ${state.hp}/${state.maxHp}.`,
  );
}

// ── Hustler: Bandages ─────────────────────────────────────────────────────────

/**
 * Buy and apply bandages to heal HP (Hustler mode only).
 */
export function buyBandages(state) {
  if (!state.isHustler && !state.isRealism)
    return fail("Bandages are only available in Hustler/Realism mode.");
  if (state.hp >= state.maxHp) return fail("You're already at full health.");
  if (state.cash < GAME_CONSTANTS.BANDAGE_COST)
    return fail(`You need $${GAME_CONSTANTS.BANDAGE_COST} for bandages.`);

  state.cash -= GAME_CONSTANTS.BANDAGE_COST;
  const healed = Math.min(GAME_CONSTANTS.BANDAGE_HEAL, state.maxHp - state.hp);
  state.hp += healed;

  return ok(
    `Applied bandages. Healed ${healed} HP. HP: ${state.hp}/${state.maxHp}.`,
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── REALISM MODE ACTIONS ────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Execute a connect bulk-buy from a pre-computed encounter offer.
 * The offer is built by rollConnectEncounter() in turn.js.
 *
 * @param {GameState} state
 * @param {Object} connect — connect definition
 * @param {Object} offer — { drugId, quantity, unitPrice, advertisedPurity, realPurity, isSteppedOn }
 * @returns {{ ok: boolean, message: string }}
 */
export function buyFromConnect(state, connect, offer) {
  if (!state.isRealism) return fail("Connect buying is only in Realism mode.");
  if (state.connectBurnt?.[connect.id])
    return fail(`${connect.name} is burnt. You're done.`);

  const { drugId, quantity, unitPrice, realPurity } = offer;
  const totalCost = unitPrice * quantity;

  if (totalCost > state.cash)
    return fail(
      `Not enough cash. Need ${fmtMoney(totalCost)}, have ${fmtMoney(state.cash)}.`,
    );

  const spaceLeft = state.maxHold - currentLoad(state);
  if (quantity > spaceLeft)
    return fail(
      `Not enough coat space. Need ${quantity} oz, have ${spaceLeft} oz.`,
    );

  const drug = DRUGS.find((d) => d.id === drugId);
  if (!drug) return fail("Unknown drug.");

  // Execute purchase
  state.cash -= totalCost;
  state.trenchCoat[drugId] = (state.trenchCoat[drugId] ?? 0) + quantity;

  // Update weighted average purity in coat (using real purity, not advertised)
  const existingQty = state.trenchCoat[drugId] - quantity;
  const existingPurity = state.coatPurity[drugId] ?? 100;
  state.coatPurity[drugId] =
    existingQty > 0
      ? Math.round(
          (existingPurity * existingQty + realPurity * quantity) /
            state.trenchCoat[drugId],
        )
      : realPurity;

  // Increment trust (capped at CONNECT_TRUST_MAX)
  if (state.connectTrust) {
    state.connectTrust[connect.id] = Math.min(
      (state.connectTrust[connect.id] ?? 0) + 1,
      GAME_CONSTANTS.CONNECT_TRUST_MAX,
    );
  }

  // Mark as known
  if (state.connectKnown) {
    state.connectKnown[connect.id] = true;
  }

  // Set cooldown (can't encounter same connect for N days)
  if (state.connectCooldown) {
    state.connectCooldown[connect.id] =
      state.day + GAME_CONSTANTS.CONNECT_COOLDOWN_DAYS;
  }

  // Add reputation
  addBuyRep(state, quantity);

  // Borough heat spike
  if (
    state.boroughHeat &&
    state.boroughHeat[connect.locationId] !== undefined
  ) {
    state.boroughHeat[connect.locationId] = Math.min(
      1,
      state.boroughHeat[connect.locationId] + (connect.heatSpike ?? 8) / 100,
    );
  }

  const steppedNote = offer.isSteppedOn
    ? " [product stepped-on — lower purity than advertised]"
    : "";
  return ok(
    `Bought ${fmtWeight(quantity, true)} of ${drug.name} from ${connect.name} at ${fmtMoney(unitPrice)}/oz (${realPurity}% pure). Total: ${fmtMoney(totalCost)}.${steppedNote}`,
  );
}

/**
 * Buy drugs from the street market (Realism mode — expensive retail).
 * @param {GameState} state
 * @param {string} drugId
 * @param {number} quantity
 */
export function buyFromStreet(state, drugId, quantity) {
  if (!state.isRealism) return fail("Street buying is Realism mode only.");
  quantity = Math.max(0, Math.floor(quantity));
  if (quantity === 0) return fail("Enter a valid quantity.");

  const price = getStreetBuyPrice(drugId, state.market);
  if (price === 0) return fail("Unknown drug.");

  const totalCost = price * quantity;
  if (totalCost > state.cash) return fail("Not enough cash.");

  const spaceLeft = state.maxHold - currentLoad(state);
  if (quantity > spaceLeft)
    return fail(`Not enough coat space. (${spaceLeft} oz left)`);

  state.cash -= totalCost;
  state.trenchCoat[drugId] += quantity;

  // Street-bought product has random purity 40–70%
  const purity = 40 + Math.floor(Math.random() * 31);
  const existingQty = state.trenchCoat[drugId] - quantity;
  const existingPurity = state.coatPurity[drugId] ?? 100;
  state.coatPurity[drugId] =
    existingQty > 0
      ? Math.round(
          (existingPurity * existingQty + purity * quantity) /
            state.trenchCoat[drugId],
        )
      : purity;

  // Heat from street purchase (more heat than connect)
  if (state.boroughHeat[state.location.id] !== undefined) {
    state.boroughHeat[state.location.id] +=
      GAME_CONSTANTS.HEAT_PER_PURCHASE * quantity * 2;
  }

  return ok(
    `Bought ${fmtWeight(quantity, true)} of ${drugId} off the street at ${fmtMoney(price)}/oz (${purity}% pure). Expensive, but no connect needed. Total: ${fmtMoney(totalCost)}.`,
  );
}

/**
 * Sell drugs on the street (Realism mode — retail, applies rep + heat + tax).
 * @param {GameState} state
 * @param {string} drugId
 * @param {number} quantity
 */
export function sellOnStreet(state, drugId, quantity) {
  if (!state.isRealism) return fail("Use regular sell for non-Realism mode.");
  quantity = Math.max(0, Math.floor(quantity));
  if (quantity === 0) return fail("Enter a valid quantity.");

  const carrying = state.trenchCoat[drugId] ?? 0;
  if (quantity > carrying) return fail(`You only have ${carrying} oz.`);

  const basePrice = state.market[drugId] ?? 0;
  const purity = state.coatPurity[drugId] ?? 100;

  // Purity affects sell price: 100% = full price, 50% = 75% of price, 30% = 60% of price
  const purityMod = 0.5 + (purity / 100) * 0.5; // range: 0.65 – 1.0
  const unitPrice = Math.round(basePrice * purityMod);
  const grossEarned = unitPrice * quantity;

  // Territory tax
  const taxRate =
    GAME_CONSTANTS.TERRITORY_TAX_MIN +
    Math.random() *
      (GAME_CONSTANTS.TERRITORY_TAX_MAX - GAME_CONSTANTS.TERRITORY_TAX_MIN);
  const tax = Math.round(grossEarned * taxRate);
  const netEarned = grossEarned - tax;

  state.cash += netEarned;
  state.trenchCoat[drugId] -= quantity;

  // If we sold everything, reset purity
  if (state.trenchCoat[drugId] <= 0) {
    state.coatPurity[drugId] = 100;
  }

  // Add reputation
  addSellRep(state, quantity);

  // Add heat
  if (state.boroughHeat[state.location.id] !== undefined) {
    state.boroughHeat[state.location.id] +=
      GAME_CONSTANTS.HEAT_PER_SALE * quantity;
  }

  // Track last sale borough
  state.lastSaleBoroughId = state.location.id;

  // Bad purity reputation hit
  if (purity < GAME_CONSTANTS.CUT_BAD_REP_THRESHOLD) {
    penaliseRep(state, GAME_CONSTANTS.REP_CUT_PENALTY);
    return ok(
      `Sold ${fmtWeight(quantity, true)} of ${drugId} (${purity}% pure) at ${fmtMoney(unitPrice)}/oz. Earned ${fmtMoney(netEarned)} (tax: ${fmtMoney(tax)}). Buyers noticed the low quality — reputation hit.`,
    );
  }

  return ok(
    `Sold ${fmtWeight(quantity, true)} of ${drugId} (${purity}% pure) at ${fmtMoney(unitPrice)}/oz. Earned ${fmtMoney(netEarned)} (tax: ${fmtMoney(tax)}).`,
  );
}

/**
 * Cut product to increase volume (Realism mode).
 * @param {GameState} state
 * @param {string} drugId
 * @param {number} targetPurity — desired purity % (lower = more volume)
 */
export function cutDrug(state, drugId, targetPurity) {
  if (!state.isRealism) return fail("Cutting is only in Realism mode.");

  const drug = DRUGS.find((d) => d.id === drugId);
  if (!drug || !drug.cuttable) return fail(`${drugId} can't be cut.`);

  const currentQty = state.trenchCoat[drugId] ?? 0;
  if (currentQty <= 0) return fail("You don't have any to cut.");

  const currentPurity = state.coatPurity[drugId] ?? 100;
  if (targetPurity >= currentPurity)
    return fail("Target purity must be lower than current.");
  if (targetPurity < GAME_CONSTANTS.CUT_MIN_PURITY)
    return fail(`Can't cut below ${GAME_CONSTANTS.CUT_MIN_PURITY}% purity.`);

  // Calculate new volume: currentQty × (currentPurity / targetPurity)
  const newQty = Math.floor(currentQty * (currentPurity / targetPurity));
  const gained = newQty - currentQty;

  // Check coat space
  const spaceLeft = state.maxHold - currentLoad(state);
  if (gained > spaceLeft)
    return fail(
      `Not enough coat space for ${gained} extra oz. (${spaceLeft} left)`,
    );

  state.trenchCoat[drugId] = newQty;
  state.coatPurity[drugId] = targetPurity;

  return ok(
    `Cut ${drugId} from ${currentPurity}% → ${targetPurity}% purity. Volume: ${fmtWeight(currentQty, true)} → ${fmtWeight(newQty, true)} (+${fmtWeight(gained, true)}).`,
  );
}

/**
 * Upgrade coat capacity (Realism mode — different limits).
 */
export function upgradeCoatRealism(state) {
  if (state.maxHold >= GAME_CONSTANTS.REALISM_COAT_UPGRADE_MAX)
    return fail("Your coat is already maxed out.");
  if (state.cash < GAME_CONSTANTS.REALISM_COAT_UPGRADE_COST)
    return fail(`Upgrade costs $${GAME_CONSTANTS.REALISM_COAT_UPGRADE_COST}.`);

  state.cash -= GAME_CONSTANTS.REALISM_COAT_UPGRADE_COST;
  state.maxHold += GAME_CONSTANTS.REALISM_COAT_UPGRADE_SIZE;

  return ok(`Coat upgraded! New capacity: ${fmtWeight(state.maxHold, true)}.`);
}
