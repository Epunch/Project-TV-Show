/**
 * connects.js — Connect (dealer) definitions for Realism Mode.
 *
 * NEW DESIGN: Encounter-triggered bulk buying with trust tiers.
 * Connects find YOU when you travel — there is no "Visit Connect" button.
 *
 * unlock rules:
 *   - "start"      → encounter-eligible from day 1
 *   - "rep:<N>"     → requires reputation >= N before they reach out
 *   - "favour"      → requires completing Tommy Bags' favour first
 *
 * Trust tiers (0–3): each tier unlocks larger lots and better discounts.
 * Trust goes up 1 per successful buy; resets to 0 on arrest in their borough.
 *
 * @typedef {Object} ConnectTier
 * @property {number} repRequired   — minimum reputation to access this tier
 * @property {number} lotOz         — fixed lot size in oz (take it all or nothing)
 * @property {number} discount      — fraction off street sell price (0.15 = 15% off)
 * @property {number} badDealChance — probability the product is secretly stepped-on
 *
 * @typedef {Object} Connect
 * @property {string}   id
 * @property {string}   name
 * @property {string}   locationId
 * @property {string[]} specialty       — drug IDs this connect stocks
 * @property {string}   personality
 * @property {ConnectTier[]} tiers      — index 0–3
 * @property {number}   qualityMin      — min purity % (honest deals)
 * @property {number}   qualityMax      — max purity %
 * @property {string}   unlock          — "start" | "rep:<N>" | "favour"
 * @property {number}   noShowChance    — prob of no-show (encounter blocked)
 * @property {number}   heatSpike       — borough heat added per bulk buy
 * @property {string}   flavour         — one-line character voice
 */

export const CONNECTS = [
  {
    id: "rico",
    name: "Rico",
    locationId: "bronx",
    specialty: ["crack", "cocaine"],
    personality: "Reliable but wary",
    tiers: [
      { repRequired: 0,  lotOz: 10,  discount: 0.15, badDealChance: 0.10 },
      { repRequired: 15, lotOz: 25,  discount: 0.25, badDealChance: 0.05 },
      { repRequired: 35, lotOz: 50,  discount: 0.35, badDealChance: 0.02 },
      { repRequired: 60, lotOz: 100, discount: 0.45, badDealChance: 0.00 },
    ],
    qualityMin: 65,
    qualityMax: 85,
    unlock: "start",
    noShowChance: 0.08,
    heatSpike: 8,
    flavour: "Rico runs the Bronx. He finds you — you don't find him.",
  },
  {
    id: "dnice",
    name: "D-Nice",
    locationId: "brooklyn",
    specialty: ["weed", "molly"],
    personality: "Best prices; flakey",
    tiers: [
      { repRequired: 0,  lotOz: 10,  discount: 0.20, badDealChance: 0.12 },
      { repRequired: 15, lotOz: 25,  discount: 0.28, badDealChance: 0.07 },
      { repRequired: 35, lotOz: 50,  discount: 0.38, badDealChance: 0.03 },
      { repRequired: 60, lotOz: 100, discount: 0.48, badDealChance: 0.00 },
    ],
    qualityMin: 55,
    qualityMax: 80,
    unlock: "start",
    noShowChance: 0.22,  // flakiest connect in the city
    heatSpike: 6,
    flavour: "D-Nice keeps the best prices in Brooklyn — when he actually shows.",
  },
  {
    id: "jin",
    name: "Jin",
    locationId: "queens",
    specialty: ["speed", "pcp"],
    personality: "Strict; cash only",
    tiers: [
      { repRequired: 0,  lotOz: 10,  discount: 0.15, badDealChance: 0.08 },
      { repRequired: 15, lotOz: 25,  discount: 0.25, badDealChance: 0.04 },
      { repRequired: 35, lotOz: 50,  discount: 0.35, badDealChance: 0.01 },
      { repRequired: 60, lotOz: 100, discount: 0.45, badDealChance: 0.00 },
    ],
    qualityMin: 70,
    qualityMax: 95,
    unlock: "rep:20",
    noShowChance: 0.05,
    heatSpike: 9,
    flavour: "Jin runs a tight operation out of Queens. Cash. Up front. Always.",
  },
  {
    id: "claudette",
    name: "Claudette",
    locationId: "manhattan",
    specialty: ["cocaine", "lsd"],
    personality: "High-end; selective",
    tiers: [
      { repRequired: 0,  lotOz: 10,  discount: 0.15, badDealChance: 0.05 },
      { repRequired: 15, lotOz: 25,  discount: 0.25, badDealChance: 0.02 },
      { repRequired: 35, lotOz: 50,  discount: 0.35, badDealChance: 0.01 },
      { repRequired: 60, lotOz: 100, discount: 0.45, badDealChance: 0.00 },
    ],
    qualityMin: 85,
    qualityMax: 98,
    unlock: "rep:50",
    noShowChance: 0.10,
    heatSpike: 12,       // Manhattan is a hot zone
    flavour: "Claudette's product is the purest in Manhattan. You pay for it.",
  },
  {
    id: "tommy",
    name: "Tommy Bags",
    locationId: "staten",
    specialty: ["heroin", "crack"],
    personality: "Owes you; generous",
    tiers: [
      { repRequired: 0,  lotOz: 10,  discount: 0.20, badDealChance: 0.08 },
      { repRequired: 15, lotOz: 25,  discount: 0.30, badDealChance: 0.04 },
      { repRequired: 35, lotOz: 50,  discount: 0.40, badDealChance: 0.01 },
      { repRequired: 60, lotOz: 100, discount: 0.50, badDealChance: 0.00 },
    ],
    qualityMin: 60,
    qualityMax: 85,
    unlock: "favour",
    noShowChance: 0.10,
    heatSpike: 8,
    flavour: "Tommy Bags owes you. Do him a solid, and Staten Island opens up.",
  },
  {
    id: "manny",
    name: "Manny",
    locationId: "yonkers",
    specialty: ["weed", "shrooms"],
    personality: "Paranoid; unreliable",
    tiers: [
      { repRequired: 0,  lotOz: 10,  discount: 0.15, badDealChance: 0.10 },
      { repRequired: 15, lotOz: 25,  discount: 0.25, badDealChance: 0.06 },
      { repRequired: 35, lotOz: 50,  discount: 0.35, badDealChance: 0.02 },
      { repRequired: 60, lotOz: 100, discount: 0.45, badDealChance: 0.00 },
    ],
    qualityMin: 60,
    qualityMax: 90,
    unlock: "rep:10",
    noShowChance: 0.30,  // most unreliable
    heatSpike: 5,
    flavour: "Manny is always looking over his shoulder. Half the time he ghosts.",
  },
  {
    id: "lilray",
    name: "Lil Ray",
    locationId: "newark",
    specialty: ["speed", "adderall"],
    personality: "Generous; heat magnet",
    tiers: [
      { repRequired: 0,  lotOz: 10,  discount: 0.18, badDealChance: 0.10 },
      { repRequired: 15, lotOz: 25,  discount: 0.28, badDealChance: 0.06 },
      { repRequired: 35, lotOz: 50,  discount: 0.38, badDealChance: 0.02 },
      { repRequired: 60, lotOz: 100, discount: 0.48, badDealChance: 0.00 },
    ],
    qualityMin: 55,
    qualityMax: 80,
    unlock: "rep:15",
    noShowChance: 0.08,
    heatSpike: 14,       // cops watch Lil Ray constantly
    flavour: "Lil Ray has plenty of product. So do the cops, who watch him 24/7.",
  },
  {
    id: "theswede",
    name: "The Swede",
    locationId: "jersey",
    specialty: ["lsd", "molly"],
    personality: "Rare; premium",
    tiers: [
      { repRequired: 0,  lotOz: 10,  discount: 0.15, badDealChance: 0.05 },
      { repRequired: 15, lotOz: 25,  discount: 0.25, badDealChance: 0.02 },
      { repRequired: 35, lotOz: 50,  discount: 0.35, badDealChance: 0.00 },
      { repRequired: 60, lotOz: 100, discount: 0.45, badDealChance: 0.00 },
    ],
    qualityMin: 90,
    qualityMax: 100,
    unlock: "rep:40",
    noShowChance: 0.15,
    heatSpike: 7,
    flavour: "The Swede moves the purest product in Jersey. Never cheap, never cut.",
  },
];
