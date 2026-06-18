/**
 * Drug definitions.
 *
 * Classic/Hustler modes use: priceMin / priceMax (fantasy ranges).
 *
 * Realism mode uses: realWholesale / realRetail (per ounce, 2024 US street data).
 *   - realWholesale = base price from a connect (before priceMod)
 *   - realRetail    = street sale price (what buyers pay you)
 *   - The spread between these is your profit margin.
 *   - cuttable: true if product can be cut to increase volume
 */
export const DRUGS = [
  {
    id: "cocaine",
    name: "Cocaine",
    priceMin: 15000,
    priceMax: 30000,
    realWholesale: 700,
    realRetail: 1800,
    cuttable: true,
  },
  {
    id: "heroin",
    name: "Heroin",
    priceMin: 5000,
    priceMax: 14000,
    realWholesale: 1400,
    realRetail: 4200,
    cuttable: true,
  },
  {
    id: "molly",
    name: "Molly",
    priceMin: 500,
    priceMax: 2500,
    realWholesale: 560,
    realRetail: 1400,
    cuttable: false,
  },
  {
    id: "lsd",
    name: "LSD",
    priceMin: 1000,
    priceMax: 4500,
    realWholesale: 150,
    realRetail: 420,
    cuttable: false,
  },
  {
    id: "shrooms",
    name: "Shrooms",
    priceMin: 630,
    priceMax: 1300,
    realWholesale: 200,
    realRetail: 500,
    cuttable: false,
  },
  {
    id: "adderall",
    name: "Adderall",
    priceMin: 100,
    priceMax: 400,
    realWholesale: 80,
    realRetail: 280,
    cuttable: false,
  },
  {
    id: "weed",
    name: "Weed",
    priceMin: 300,
    priceMax: 900,
    realWholesale: 120,
    realRetail: 350,
    cuttable: false,
  },
  {
    id: "crack",
    name: "Crack",
    priceMin: 1000,
    priceMax: 3500,
    realWholesale: 500,
    realRetail: 1200,
    cuttable: true,
  },
  {
    id: "pcp",
    name: "PCP",
    priceMin: 1000,
    priceMax: 2500,
    realWholesale: 300,
    realRetail: 800,
    cuttable: true,
  },
  {
    id: "speed",
    name: "Speed",
    priceMin: 90,
    priceMax: 250,
    realWholesale: 100,
    realRetail: 300,
    cuttable: true,
  },
];
