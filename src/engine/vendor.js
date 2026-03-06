/**
 * vendor.js — Street vendor logic (Hustler mode).
 * Randomly offers a single item when the player travels.
 */
import { VENDOR_ITEMS } from "../data/items.js";
import { GAME_CONSTANTS } from "../data/constants.js";

/**
 * Roll for a vendor encounter. Returns an item definition or null.
 * @returns {Object|null}
 */
export function rollVendorEncounter() {
  if (Math.random() > GAME_CONSTANTS.VENDOR_CHANCE) return null;
  return VENDOR_ITEMS[Math.floor(Math.random() * VENDOR_ITEMS.length)];
}

/**
 * Attempt to buy a vendor item.
 * @param {GameState} state
 * @param {Object} itemDef — item definition from items.js
 * @returns {{ ok: boolean, message: string }}
 */
export function buyVendorItem(state, itemDef) {
  if (state.cash < itemDef.cost) {
    return { ok: false, message: `Not enough cash. Need $${itemDef.cost}.` };
  }

  if (itemDef.type === "instant") {
    // Apply immediately
    state.cash -= itemDef.cost;
    if (itemDef.id === "bandages") {
      const healed = Math.min(itemDef.healAmount, state.maxHp - state.hp);
      state.hp = Math.min(state.maxHp, state.hp + healed);
      return {
        ok: true,
        message: `Used bandages. Healed ${healed} HP. HP: ${state.hp}/${state.maxHp}.`,
      };
    }
    return { ok: true, message: `Used ${itemDef.name}.` };
  }

  // Passive item — store it
  if (state.items.length >= GAME_CONSTANTS.MAX_ITEMS) {
    return {
      ok: false,
      message: `Inventory full! Max ${GAME_CONSTANTS.MAX_ITEMS} items.`,
    };
  }

  state.cash -= itemDef.cost;

  // Burner phone — set tip accuracy override
  if (itemDef.id === "burner_phone") {
    state.tipAccuracyOverride = itemDef.uses;
    state.items.push({
      id: itemDef.id,
      name: itemDef.name,
      icon: itemDef.icon,
      description: itemDef.description,
      uses: itemDef.uses,
    });
    return {
      ok: true,
      message: `Bought ${itemDef.name}. Tips will be accurate for ${itemDef.uses} days.`,
    };
  }

  state.items.push({
    id: itemDef.id,
    name: itemDef.name,
    icon: itemDef.icon,
    description: itemDef.description,
    uses: itemDef.uses,
  });

  return {
    ok: true,
    message: `Bought ${itemDef.name}. ${itemDef.description}`,
  };
}

/**
 * Check if the player has a specific item. Returns the item or null.
 */
export function hasItem(state, itemId) {
  return state.items.find((i) => i.id === itemId) || null;
}

/**
 * Consume (use up) an item by id. Removes it from inventory.
 */
export function consumeItem(state, itemId) {
  const idx = state.items.findIndex((i) => i.id === itemId);
  if (idx === -1) return false;
  state.items[idx].uses -= 1;
  if (state.items[idx].uses <= 0) {
    state.items.splice(idx, 1);
  }
  return true;
}
