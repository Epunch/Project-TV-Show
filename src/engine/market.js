/**
 * market.js — Price generation engine.
 * Classic/Hustler: random ranges with spikes.
 * Realism: supply/demand model anchored to real wholesale/retail data.
 */
import { DRUGS } from "../data/drugs.js";
import { GAME_CONSTANTS } from "../data/constants.js";

/**
 * Returns a random integer between min and max (inclusive).
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a fresh market price map for one day (Classic / Hustler).
 * Each drug gets a base price within its range, and roughly 10 % of
 * drugs get a spike (up or down) to simulate special market events.
 *
 * @param {number} [volatilityMod=1] — multiplier for spike chance & magnitude
 * @returns {Object} { drugId: price, ... }
 */
export function generateMarket(volatilityMod = 1) {
  const market = {};
  const spikeChance = 0.05 * volatilityMod;
  const crashChance = 0.05 * volatilityMod;

  for (const drug of DRUGS) {
    let price = randInt(drug.priceMin, drug.priceMax);

    // ~10 % chance of a special spike event on any given drug
    const roll = Math.random();
    if (roll < spikeChance) {
      // Massive price spike — cop bust, shortage, etc.
      price = Math.round(price * (2 + Math.random() * 2 * volatilityMod));
    } else if (roll < spikeChance + crashChance) {
      // Price crash — flooded market
      price = Math.round(price * (0.15 + Math.random() * 0.25));
    }

    market[drug.id] = price;
  }

  return market;
}

/**
 * Generate a realism mode street market (retail sell prices).
 * These are the prices that BUYERS on the street will pay you.
 * Buying from connects uses getConnectPrice() from reputation.js instead.
 *
 * @param {Object} supplyEvents — { drugId: { type, endsOn } }
 * @param {Object} [boroughHeat={}] — heat per borough (affects prices slightly)
 * @param {string} [locationId=''] — current location for heat-based pricing
 * @returns {Object} { drugId: price, ... }
 */
export function generateRealismMarket(
  supplyEvents = {},
  boroughHeat = {},
  locationId = "",
) {
  const market = {};
  const heat = boroughHeat[locationId] ?? 0;

  for (const drug of DRUGS) {
    // Base retail price with ±15% daily variance
    const variance = 0.85 + Math.random() * 0.3; // 0.85 – 1.15
    let price = Math.round(drug.realRetail * variance);

    // Heat modifier: higher heat = slightly higher prices (scarcity from busts)
    const heatMod = 1 + heat * 0.3; // each 1.0 heat adds 30%
    price = Math.round(price * heatMod);

    // Supply event modifiers
    const evt = supplyEvents[drug.id];
    if (evt && evt.endsOn > 0) {
      if (evt.type === "drought") {
        price = Math.round(price * GAME_CONSTANTS.DROUGHT_PRICE_MULT);
      } else if (evt.type === "flood") {
        price = Math.round(price * GAME_CONSTANTS.FLOOD_PRICE_MULT);
      }
    }

    market[drug.id] = price;
  }

  return market;
}

/**
 * Roll supply events for realism mode (droughts / floods).
 * Called once per day. Can start new events or let existing ones expire.
 * @param {Object} supplyEvents — current events map (mutated in place)
 * @param {number} currentDay
 * @returns {string[]} — messages about new events
 */
export function rollSupplyEvents(supplyEvents, currentDay) {
  const messages = [];

  for (const drug of DRUGS) {
    const existing = supplyEvents[drug.id];

    // If there's an active event, check if it expired
    if (existing && existing.endsOn > currentDay) continue;

    // Clear expired events
    if (existing && existing.endsOn <= currentDay) {
      if (existing.type === "drought") {
        messages.push(`${drug.name} supply is back to normal.`);
      } else if (existing.type === "flood") {
        messages.push(`${drug.name} surplus has dried up.`);
      }
      delete supplyEvents[drug.id];
    }

    // Roll for new events
    if (Math.random() < GAME_CONSTANTS.DROUGHT_CHANCE) {
      const duration = randInt(
        GAME_CONSTANTS.DROUGHT_DURATION_MIN,
        GAME_CONSTANTS.DROUGHT_DURATION_MAX,
      );
      supplyEvents[drug.id] = {
        type: "drought",
        endsOn: currentDay + duration,
      };
      messages.push(`DROUGHT: ${drug.name} — supply dried up, prices spiking.`);
    } else if (Math.random() < GAME_CONSTANTS.FLOOD_CHANCE) {
      const duration = randInt(
        GAME_CONSTANTS.FLOOD_DURATION_MIN,
        GAME_CONSTANTS.FLOOD_DURATION_MAX,
      );
      supplyEvents[drug.id] = { type: "flood", endsOn: currentDay + duration };
      messages.push(`FLOOD: ${drug.name} — shipment hit, prices crashing.`);
    }
  }

  return messages;
}

/**
 * Calculate the "street buy" price — what it costs to buy a drug on the open
 * street without a connect (much more expensive than wholesale).
 * @param {string} drugId
 * @param {Object} market — current market prices
 * @returns {number}
 */
export function getStreetBuyPrice(drugId, market) {
  // Street buying = retail price + 20% markup (you're buying retail, not wholesale)
  return Math.round((market[drugId] ?? 0) * 1.2);
}
