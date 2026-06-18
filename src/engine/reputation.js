/**
 * reputation.js — Reputation tracking, connect trust tiers, and encounter logic.
 *
 * NEW DESIGN: Connects encounter the player on travel (encounter-triggered).
 * Trust tiers gate lot sizes and discounts. No "Visit Connect" button.
 */
import { GAME_CONSTANTS } from "../data/constants.js";
import { CONNECTS } from "../data/connects.js";
import { DRUGS } from "../data/drugs.js";

/**
 * Add reputation for selling drugs on the street.
 * @param {GameState} state
 * @param {number} qty — ounces sold
 */
export function addSellRep(state, qty) {
  state.reputation += qty * GAME_CONSTANTS.REP_PER_OZ_SOLD;
}

/**
 * Add reputation for buying from a connect.
 * @param {GameState} state
 * @param {number} qty — ounces bought
 */
export function addBuyRep(state, qty) {
  state.reputation += qty * GAME_CONSTANTS.REP_PER_OZ_BOUGHT;
}

/**
 * Deduct reputation (e.g. selling garbage-purity product).
 * @param {GameState} state
 * @param {number} amount
 */
export function penaliseRep(state, amount) {
  state.reputation = Math.max(0, state.reputation - amount);
}

/**
 * Check if a connect's unlock condition is met.
 * @param {GameState} state
 * @param {Object} connect
 * @returns {boolean}
 */
export function isConnectUnlocked(state, connect) {
  const rule = connect.unlock;
  if (rule === "start") return true;
  if (rule === "favour") return state.favourCompleted === true;
  if (rule.startsWith("rep:")) {
    const threshold = parseInt(rule.split(":")[1], 10);
    return state.reputation >= threshold;
  }
  return false;
}

/**
 * Get the current trust tier (0–3) for a connect.
 * Trust is stored in state.connectTrust[id]. The tier is the stored number,
 * but also capped by the connect's repRequired gate.
 * @param {GameState} state
 * @param {Object} connect
 * @returns {number} 0–3
 */
export function getConnectTier(state, connect) {
  const raw = state.connectTrust?.[connect.id] ?? 0;
  // Find the highest tier whose repRequired the player meets
  const tiers = connect.tiers;
  let accessible = 0;
  for (let i = 0; i < tiers.length; i++) {
    if (state.reputation >= tiers[i].repRequired) {
      accessible = i;
    }
  }
  return Math.min(raw, accessible);
}

/**
 * Roll purity for a connect purchase.
 * @param {Object} connect
 * @returns {number} purity %
 */
export function rollPurity(connect) {
  const range = connect.qualityMax - connect.qualityMin;
  return connect.qualityMin + Math.floor(Math.random() * (range + 1));
}

/**
 * Build a connect encounter offer.
 * Returns null if the connect can't appear (not unlocked, burnt, on cooldown,
 * too early in game, wrong borough, no-show roll).
 *
 * @param {GameState} state
 * @param {Object} connect
 * @param {string} locationId — borough the player just arrived in
 * @returns {{ connect, drugId, quantity, unitPrice, advertisedPurity, realPurity, isSteppedOn, tier } | null}
 */
export function buildConnectOffer(state, connect, locationId) {
  // Must be in connect's borough
  if (connect.locationId !== locationId) return null;
  // Must be unlocked
  if (!isConnectUnlocked(state, connect)) return null;
  // Must not be burnt
  if (state.connectBurnt?.[connect.id]) return null;
  // Must not be arrested
  const status = state.connectStatus?.[connect.id];
  if (status && status.arrestedUntil > state.day) return null;
  // Must not be on cooldown
  if ((state.connectCooldown?.[connect.id] ?? 0) > state.day) return null;
  // No-show roll
  if (Math.random() < connect.noShowChance) return null;

  const tier = getConnectTier(state, connect);
  const tierDef = connect.tiers[tier];

  // Pick a random drug from specialty
  const drugId = connect.specialty[Math.floor(Math.random() * connect.specialty.length)];
  const drug = DRUGS.find((d) => d.id === drugId);
  if (!drug) return null;

  const lotOz = tierDef.lotOz;
  const discount = tierDef.discount;

  // Price = street sell price × (1 − discount)
  const streetPrice = drug.realWholesale ?? drug.minPrice ?? 100;
  const unitPrice = Math.max(1, Math.round(streetPrice * (1 - discount)));

  // Purity
  const advertisedPurity = rollPurity(connect);
  const isSteppedOn = Math.random() < tierDef.badDealChance;
  const realPurity = isSteppedOn
    ? Math.max(
        20,
        advertisedPurity - GAME_CONSTANTS.CONNECT_BAD_DEAL_PURITY_PENALTY,
      )
    : advertisedPurity;

  return {
    connect,
    drugId,
    quantity: lotOz,
    unitPrice,
    advertisedPurity,
    realPurity,
    isSteppedOn,
    tier,
  };
}

/**
 * Roll whether a connect encounter happens this travel.
 * Returns an offer object if one fires, null otherwise.
 *
 * @param {GameState} state
 * @param {string} locationId — where the player just arrived
 * @returns {ReturnType<typeof buildConnectOffer> | null}
 */
export function rollConnectEncounter(state, locationId) {
  if (!state.isRealism) return null;
  if (state.day < GAME_CONSTANTS.CONNECT_ENCOUNTER_MIN_DAY) return null;

  // Find the connect for this borough
  const connect = CONNECTS.find((c) => c.locationId === locationId);
  if (!connect) return null;

  // Encounter chance formula
  const repRatio = Math.min(1, state.reputation / 100);
  const repBonus = repRatio * GAME_CONSTANTS.CONNECT_ENCOUNTER_REP_MAX;
  const heatLevel = state.boroughHeat?.[locationId] ?? 0;
  const heatPenalty = heatLevel * GAME_CONSTANTS.CONNECT_ENCOUNTER_HEAT_MAX;
  // Cooldown blocks encounter entirely
  if ((state.connectCooldown?.[connect.id] ?? 0) > state.day) return null;

  const chance = Math.max(0, GAME_CONSTANTS.CONNECT_ENCOUNTER_BASE + repBonus - heatPenalty);
  if (Math.random() > chance) return null;

  return buildConnectOffer(state, connect, locationId);
}

/**
 * Reset trust to 0 for all connects in a given borough (player got arrested there).
 * @param {GameState} state
 * @param {string} locationId
 */
export function resetConnectTrustOnArrest(state, locationId) {
  for (const connect of CONNECTS) {
    if (connect.locationId === locationId) {
      if (state.connectTrust) {
        state.connectTrust[connect.id] = 0;
      }
    }
  }
}

/**
 * Mark a connect as burnt (permanently unavailable) if player is arrested
 * carrying a significant quantity of the connect's specialty.
 * @param {GameState} state
 * @param {string} locationId — borough of arrest
 */
export function checkConnectBurnt(state, locationId) {
  const THRESHOLD = 10; // oz threshold
  for (const connect of CONNECTS) {
    if (connect.locationId !== locationId) continue;
    const hasProduct = connect.specialty.some(
      (d) => (state.trenchCoat[d] ?? 0) >= THRESHOLD,
    );
    if (hasProduct && state.connectBurnt) {
      state.connectBurnt[connect.id] = true;
    }
  }
}

/**
 * Generate fresh daily stock for all connects.
 * (Still used for legacy no-show and arrest refresh logic.)
 * @param {GameState} state
 */
export function refreshConnectStock(state) {
  for (const connect of CONNECTS) {
    let status = state.connectStatus[connect.id];
    if (!status) {
      status = {
        loyalty: 0,
        arrestedUntil: 0,
        noShowToday: false,
        dailyStock: {},
      };
      state.connectStatus[connect.id] = status;
    }
    // Refresh no-show for the day (still used as a secondary gate in buildConnectOffer)
    status.noShowToday = Math.random() < connect.noShowChance;
    status.dailyStock = {}; // no longer used for encounter flow, kept for compat
  }
}

/**
 * Process daily connect events: arrests and releases.
 * @param {GameState} state
 * @returns {string[]}
 */
export function processConnectEvents(state) {
  const messages = [];

  for (const connect of CONNECTS) {
    if (state.connectBurnt?.[connect.id]) continue;
    if (!isConnectUnlocked(state, connect)) continue;

    const status = state.connectStatus[connect.id];
    if (!status) continue;

    // Release
    if (status.arrestedUntil > 0 && state.day >= status.arrestedUntil) {
      status.arrestedUntil = 0;
      if (state.connectKnown?.[connect.id]) {
        messages.push(`${connect.name} is back on the streets.`);
      }
      continue;
    }

    // Random arrest (only if not already arrested)
    if (
      status.arrestedUntil <= 0 &&
      Math.random() < GAME_CONSTANTS.CONNECT_ARRESTED_CHANCE
    ) {
      const dark =
        GAME_CONSTANTS.CONNECT_ARRESTED_DAYS_MIN +
        Math.floor(
          Math.random() *
            (GAME_CONSTANTS.CONNECT_ARRESTED_DAYS_MAX -
              GAME_CONSTANTS.CONNECT_ARRESTED_DAYS_MIN +
              1),
        );
      status.arrestedUntil = state.day + dark;
      if (state.connectKnown?.[connect.id]) {
        messages.push(`${connect.name} got picked up. Gone for ${dark} days.`);
      }
    }
  }

  return messages;
}

// ── Legacy helpers (kept for compat with older call sites) ───────────────────

/** @deprecated Use getConnectTier() — kept for build compat */
export function getConnectLoyalty(state, connect) {
  return state.connectTrust?.[connect.id] ?? 0;
}

/** @deprecated priceMod removed — kept for build compat, returns 0 */
export function getConnectPrice() {
  return 0;
}

/** @deprecated dailyStock removed — kept for build compat, returns 0 */
export function getConnectStock() {
  return 0;
}

/** @deprecated merged into buyFromConnect — kept for build compat */
export function addLoyalty() {}

/** @deprecated listed connects by unlock — use rollConnectEncounter() instead */
export function getUnlockedConnects(state) {
  return CONNECTS.filter((c) => isConnectUnlocked(state, c));
}

/** @deprecated location-based lookup — still used in old onVisitConnect path */
export function getAvailableConnect(state, locationId) {
  const connect = CONNECTS.find((c) => c.locationId === locationId);
  if (!connect) return null;
  if (!isConnectUnlocked(state, connect)) return null;
  const status = state.connectStatus[connect.id];
  if (status && status.arrestedUntil > state.day) return null;
  if (state.connectBurnt?.[connect.id]) return null;
  return connect;
}
