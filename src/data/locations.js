/**
 * Location / borough definitions.
 * Each location has a heat modifier that affects police encounter chance.
 * heatMod: 1.0 = normal, >1.0 = hotter, <1.0 = cooler.
 */
export const LOCATIONS = [
  { id: "bronx", name: "Bronx", heatMod: 1.2 },
  { id: "brooklyn", name: "Brooklyn", heatMod: 1.0 },
  { id: "queens", name: "Queens", heatMod: 0.9 },
  { id: "manhattan", name: "Manhattan", heatMod: 1.4 },
  { id: "staten", name: "Staten Island", heatMod: 0.7 },
  { id: "yonkers", name: "Yonkers", heatMod: 0.8 },
  { id: "newark", name: "Newark", heatMod: 1.1 },
  { id: "jersey", name: "Jersey City", heatMod: 1.0 },
];
