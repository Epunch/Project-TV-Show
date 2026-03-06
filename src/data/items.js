/**
 * items.js — Street vendor item definitions (Hustler mode).
 * Each item has an id, name, icon, description, cost, and type.
 * type: 'instant' (consumed on purchase) | 'passive' (stored, consumed on trigger)
 */

export const VENDOR_ITEMS = [
  {
    id: "police_scanner",
    name: "Police Scanner",
    icon: "📡",
    description: "Reveals today's police heat level per borough.",
    cost: 800,
    type: "passive",
    uses: 1,
  },
  {
    id: "fake_id",
    name: "Fake ID",
    icon: "🪪",
    description: "Auto-skip the next police encounter. One-use.",
    cost: 1200,
    type: "passive",
    uses: 1,
  },
  {
    id: "burner_phone",
    name: "Burner Phone",
    icon: "📱",
    description: "Guarantees accurate tips for 5 days.",
    cost: 600,
    type: "passive",
    uses: 5,
  },
  {
    id: "bulletproof_vest",
    name: "Bulletproof Vest",
    icon: "🦺",
    description: "Absorbs next HP damage from mugging or police.",
    cost: 900,
    type: "passive",
    uses: 1,
  },
  {
    id: "bandages",
    name: "Bandages",
    icon: "🩹",
    description: "Restore 20 HP immediately.",
    cost: 200,
    type: "instant",
    healAmount: 20,
  },
];
