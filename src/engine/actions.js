/**
 * actions.js — All player actions that mutate game state.
 * Every action returns { ok: boolean, message: string }.
 */
import { DRUGS } from "../data/drugs.js";
import { GAME_CONSTANTS } from "../data/constants.js";
import { currentLoad } from "./state.js";

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

  return ok(
    `Bought ${quantity} × ${drugId} for $${totalCost.toLocaleString()}.`,
  );
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

  return ok(`Sold ${quantity} × ${drugId} for $${earned.toLocaleString()}.`);
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

  return ok(`Deposited $${amount.toLocaleString()} in the bank.`);
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

  return ok(`Withdrew $${amount.toLocaleString()} from the bank.`);
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
    return ok(`Debt cleared! You paid $${paid.toLocaleString()}.`);
  }
  return ok(
    `Paid $${paid.toLocaleString()}. Remaining debt: $${state.debt.toLocaleString()}.`,
  );
}

/**
 * Borrow more cash from the loan shark.
 */
export function borrowFromShark(state, amount) {
  amount = Math.max(0, Math.floor(amount));
  if (amount === 0) return fail("Enter a valid amount.");

  state.cash += amount;
  state.debt += amount;

  return ok(
    `Borrowed $${amount.toLocaleString()}. New debt: $${state.debt.toLocaleString()}.`,
  );
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
  if (!state.isHustler)
    return fail("Clinic is only available in Hustler mode.");
  if (state.hp >= state.maxHp) return fail("You're already at full health.");
  if (!GAME_CONSTANTS.CLINIC_LOCATIONS.includes(state.location.id))
    return fail("No clinic here. Try Bronx or Manhattan.");
  if (state.cash < GAME_CONSTANTS.CLINIC_COST)
    return fail(`You need $${GAME_CONSTANTS.CLINIC_COST.toLocaleString()} for the clinic.`);

  state.cash -= GAME_CONSTANTS.CLINIC_COST;
  const healed = state.maxHp - state.hp;
  state.hp = state.maxHp;

  return ok(
    `🏥 Full treatment at the clinic. Healed ${healed} HP. HP: ${state.hp}/${state.maxHp}.`,
  );
}

// ── Hustler: Bandages ─────────────────────────────────────────────────────────

/**
 * Buy and apply bandages to heal HP (Hustler mode only).
 */
export function buyBandages(state) {
  if (!state.isHustler)
    return fail("Bandages are only available in Hustler mode.");
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
