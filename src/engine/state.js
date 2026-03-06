/**
 * state.js — Canonical game state and initialiser.
 * All engine modules read from and write to this single object.
 */
import { DRUGS } from "../data/drugs.js";
import { LOCATIONS } from "../data/locations.js";
import { GAME_CONSTANTS } from "../data/constants.js";
import { generateMarket } from "./market.js";

/**
 * Build a fresh zero-quantity inventory object keyed by drug id.
 */
function emptyInventory() {
  return Object.fromEntries(DRUGS.map((d) => [d.id, 0]));
}

/**
 * Calculate scaled debt from day count.
 * debt = BASE_DEBT × (days / BASE_DAYS)
 */
export function scaledDebt(days) {
  return Math.round(
    GAME_CONSTANTS.BASE_DEBT * (days / GAME_CONSTANTS.BASE_DAYS),
  );
}

/**
 * Calculate scaled interest rate from day count.
 * rate = BASE_RATE × (BASE_DAYS / days), capped at BASE_RATE
 */
export function scaledRate(days) {
  return Math.min(
    GAME_CONSTANTS.INTEREST_RATE,
    GAME_CONSTANTS.INTEREST_RATE * (GAME_CONSTANTS.BASE_DAYS / days),
  );
}

/**
 * Create and return a brand-new game state object.
 * Call this once at game start (or restart).
 *
 * @param {Object} config — game configuration
 * @param {string} config.playerName
 * @param {string} config.mode — 'classic' | 'choose-days' | 'advanced' | 'hustler'
 * @param {number} [config.totalDays]
 * @param {number} [config.startingCash]
 * @param {number} [config.startingDebt]
 * @param {number} [config.interestRate]
 * @param {number} [config.startingHold]
 * @param {number} [config.policeMod] — multiplier for police chance
 * @param {number} [config.volatilityMod] — multiplier for market swings
 * @returns {GameState}
 */
export function createInitialState(config = {}) {
  const mode = config.mode || "classic";
  const isHustler = mode === "hustler";
  const days = config.totalDays ?? GAME_CONSTANTS.TOTAL_DAYS;
  const debt = config.startingDebt ?? scaledDebt(days);
  const rate = config.interestRate ?? scaledRate(days);
  const playerName = config.playerName || "Anonymous";

  return {
    // ── Mode ──────────────────────────────────────────────────────────────────
    mode,
    isHustler,

    // ── Player ────────────────────────────────────────────────────────────────
    playerName,

    // ── Time ────────────────────────────────────────────────────────────────
    day: 1,
    totalDays: days,

    // ── Location ────────────────────────────────────────────────────────────
    location: LOCATIONS[0], // Start in the Bronx
    locations: LOCATIONS,

    // ── Financials ──────────────────────────────────────────────────────────
    cash: config.startingCash ?? GAME_CONSTANTS.STARTING_CASH,
    bank: 0,
    debt,
    interestRate: rate,
    bankInterestRate: GAME_CONSTANTS.BANK_INTEREST_RATE,

    // ── Inventory ───────────────────────────────────────────────────────────
    stash: emptyInventory(),
    trenchCoat: emptyInventory(),
    maxHold: config.startingHold ?? GAME_CONSTANTS.STARTING_HOLD,

    // ── Weapons ─────────────────────────────────────────────────────────────
    guns: 0,

    // ── Market ──────────────────────────────────────────────────────────────
    market: generateMarket(config.volatilityMod),

    // ── Police / market modifiers ───────────────────────────────────────────
    policeMod: config.policeMod ?? 1,
    volatilityMod: config.volatilityMod ?? 1,

    // ── Health (Hustler mode) ───────────────────────────────────────────────
    hp: isHustler ? GAME_CONSTANTS.STARTING_HP : -1, // -1 = not used
    maxHp: GAME_CONSTANTS.MAX_HP,

    // ── Items (Hustler mode) ────────────────────────────────────────────────
    items: [], // array of { id, name, icon, description, uses }

    // ── Hustler state ───────────────────────────────────────────────────────
    hardassDeputies: 0, // grows every HARDASS_DEPUTY_INTERVAL days
    jailDays: 0, // if > 0, skip turns
    tipAccuracyOverride: 0, // days remaining of guaranteed-accurate tips (burner phone)
    scannerActive: false, // true for one day after using police scanner

    // ── Vinnie's job ──────────────────────────────────────────────────────────
    vinnieJob: null, // { drugId, locationId, locationName, deadline, amount } or null

    // ── Game flow ───────────────────────────────────────────────────────────
    isOver: false,
    won: false,

    // ── Log ─────────────────────────────────────────────────────────────────
    log: [
      isHustler
        ? `Welcome, ${playerName}. The streets are meaner here. Watch your back.`
        : `Welcome, ${playerName}. Pay off your debt and get rich.`,
    ],
  };
}

/**
 * Convenience: total units currently in trench coat.
 */
export function currentLoad(state) {
  return Object.values(state.trenchCoat).reduce((sum, n) => sum + n, 0);
}

/**
 * Convenience: net worth = cash + bank − debt + market value of stash.
 */
export function netWorth(state) {
  const stashValue = Object.entries(state.stash).reduce((sum, [id, qty]) => {
    return sum + qty * (state.market[id] ?? 0);
  }, 0);
  return state.cash + state.bank - state.debt + stashValue;
}
