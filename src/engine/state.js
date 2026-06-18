/**
 * state.js — Canonical game state and initialiser.
 * All engine modules read from and write to this single object.
 */
import { DRUGS } from "../data/drugs.js";
import { LOCATIONS } from "../data/locations.js";
import { GAME_CONSTANTS } from "../data/constants.js";
import { CONNECTS } from "../data/connects.js";
import { generateMarket, generateRealismMarket } from "./market.js";

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
 * @param {string} config.mode — 'classic' | 'choose-days' | 'advanced' | 'hustler' | 'realism'
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
  const isRealism = mode === "realism";
  const days =
    config.totalDays ??
    (isRealism ? GAME_CONSTANTS.REALISM_TOTAL_DAYS : GAME_CONSTANTS.TOTAL_DAYS);
  const debt =
    config.startingDebt ??
    (isRealism ? GAME_CONSTANTS.REALISM_STARTING_DEBT : scaledDebt(days));
  const rate =
    config.interestRate ??
    (isRealism ? GAME_CONSTANTS.REALISM_INTEREST_RATE : scaledRate(days));
  const playerName = config.playerName || "Anonymous";
  const startCash =
    config.startingCash ??
    (isRealism
      ? GAME_CONSTANTS.REALISM_STARTING_CASH
      : GAME_CONSTANTS.STARTING_CASH);
  const startHold =
    config.startingHold ??
    (isRealism
      ? GAME_CONSTANTS.REALISM_STARTING_HOLD
      : GAME_CONSTANTS.STARTING_HOLD);

  // Build connect status map (realism mode)
  const connectStatus = {};
  const connectTrust = {};   // trust tier (0–3) per connect
  const connectCooldown = {}; // day number when cooldown expires (0 = available)
  const connectKnown = {};    // has the player ever encountered this connect?
  const connectBurnt = {};    // connect permanently gone (arrested with their product)
  if (isRealism) {
    for (const c of CONNECTS) {
      connectStatus[c.id] = {
        loyalty: 0,
        arrestedUntil: 0,
        noShowToday: false,
        dailyStock: {},
      };
      connectTrust[c.id] = 0;
      connectCooldown[c.id] = 0;
      connectKnown[c.id] = false;
      connectBurnt[c.id] = false;
    }
  }

  // Build per-borough heat map (realism mode)
  const boroughHeat = {};
  if (isRealism) {
    for (const loc of LOCATIONS) {
      boroughHeat[loc.id] = 0;
    }
  }

  // Build supply events map (realism mode — droughts/floods)
  const supplyEvents = {};

  return {
    // ── Mode ──────────────────────────────────────────────────────────────────
    mode,
    isHustler,
    isRealism,

    // ── Player ────────────────────────────────────────────────────────────────
    playerName,

    // ── Time ────────────────────────────────────────────────────────────────
    day: 1,
    totalDays: days,

    // ── Location ────────────────────────────────────────────────────────────
    location: LOCATIONS[0], // Start in the Bronx
    locations: LOCATIONS,

    // ── Financials ──────────────────────────────────────────────────────────
    cash: startCash,
    bank: 0,
    debt,
    interestRate: rate,
    bankInterestRate: GAME_CONSTANTS.BANK_INTEREST_RATE,

    // ── Inventory ───────────────────────────────────────────────────────────
    stash: emptyInventory(),
    trenchCoat: emptyInventory(),
    maxHold: startHold,

    // ── Inventory purity tracking (realism mode) ────────────────────────────
    // { drugId: { qty, purity } } — weighted average purity in coat
    coatPurity: isRealism
      ? Object.fromEntries(DRUGS.map((d) => [d.id, 100]))
      : {},

    // ── Weapons ─────────────────────────────────────────────────────────────
    guns: 0,

    // ── Market ──────────────────────────────────────────────────────────────
    market: isRealism
      ? generateRealismMarket({})
      : generateMarket(config.volatilityMod),

    // ── Police / market modifiers ───────────────────────────────────────────
    policeMod: config.policeMod ?? 1,
    volatilityMod: config.volatilityMod ?? 1,

    // ── Health (Hustler + Realism mode) ─────────────────────────────────────
    hp: isHustler || isRealism ? GAME_CONSTANTS.STARTING_HP : -1,
    maxHp: GAME_CONSTANTS.MAX_HP,

    // ── Items (Hustler + Realism mode) ──────────────────────────────────────
    items: [],

    // ── Hustler state ───────────────────────────────────────────────────────
    hardassDeputies: 0,
    jailDays: 0,
    tipAccuracyOverride: 0,
    scannerActive: false,

    // ── Vinnie's job ──────────────────────────────────────────────────────────
    vinnieJob: null,

    // ── Realism mode state ──────────────────────────────────────────────────
    reputation: 0,
    connectStatus,
    connectTrust,        // { [connectId]: 0|1|2|3 }
    connectCooldown,     // { [connectId]: dayNumber } — available when day >= value
    connectKnown,        // { [connectId]: bool } — ever encountered?
    connectBurnt,        // { [connectId]: bool } — permanently gone?
    boroughHeat,
    supplyEvents,
    favourCompleted: false, // Tommy Bags unlock
    pendingFavour: null, // { drugId, locationId, locationName, amount, deadline } or null
    territoryTaxOwed: 0, // accumulated tax owed
    lastSaleBoroughId: null, // track where player last sold

    // ── Game flow ───────────────────────────────────────────────────────────
    isOver: false,
    won: false,

    // ── Log ─────────────────────────────────────────────────────────────────
    log: [
      isRealism
        ? `Welcome, ${playerName}. The streets are real out here. Find a connect, build your rep.`
        : isHustler
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
