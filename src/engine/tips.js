/**
 * tips.js — Street intel tip generator (Hustler mode).
 * Generates daily tips that are ~70% accurate, ~30% false.
 */
import { DRUGS } from "../data/drugs.js";
import { LOCATIONS } from "../data/locations.js";
import { GAME_CONSTANTS } from "../data/constants.js";

const TIP_TEMPLATES = {
  price_spike: [
    "Word is {drug} prices are spiking in {location} tomorrow.",
    "Heard {drug} is about to get real expensive in {location}.",
    "A shortage of {drug} is hitting {location} — prices going up.",
  ],
  price_crash: [
    "Someone's flooding {location} with cheap {drug}.",
    "Feds seized a shipment. {drug} prices crashing in {location}.",
    "{drug} is gonna be dirt cheap in {location} soon.",
  ],
  police_heat: [
    "Cops are doing sweeps in {location} all week. Stay away.",
    "Heavy police presence in {location}. Watch yourself.",
    "Heard {location} is crawling with undercovers right now.",
  ],
  police_cool: [
    "{location} is quiet today — cops busy elsewhere.",
    "Low heat in {location}. Good time to move product.",
    "Police pulled out of {location} for now.",
  ],
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a daily tip for the player.
 * Returns { text: string, isTip: true } for log rendering.
 *
 * @param {GameState} state
 * @returns {{ text: string, isTip: boolean }}
 */
export function generateTip(state) {
  const isAccurate =
    state.tipAccuracyOverride > 0
      ? true
      : Math.random() < GAME_CONSTANTS.TIP_ACCURACY;

  const tipType = pick([
    "price_spike",
    "price_crash",
    "police_heat",
    "police_cool",
  ]);
  const drug = pick(DRUGS).name;
  const location = pick(LOCATIONS).name;

  let template;
  if (isAccurate) {
    template = pick(TIP_TEMPLATES[tipType]);
  } else {
    // False tip — pick a random template from a DIFFERENT category
    const otherTypes = Object.keys(TIP_TEMPLATES).filter((t) => t !== tipType);
    const falseType = pick(otherTypes);
    template = pick(TIP_TEMPLATES[falseType]);
  }

  const text = template.replace("{drug}", drug).replace("{location}", location);

  // Decrement burner phone days
  if (state.tipAccuracyOverride > 0) {
    state.tipAccuracyOverride -= 1;
  }

  return { text: `💡 ${text}`, isTip: true };
}
