/**
 * market.js — Price generation engine.
 * Generates daily market prices for all drugs at a given location.
 */
import { DRUGS } from "../data/drugs.js";

/**
 * Returns a random integer between min and max (inclusive).
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a fresh market price map for one day.
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
