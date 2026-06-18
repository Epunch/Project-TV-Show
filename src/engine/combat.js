/**
 * combat.js — Police encounter logic (Hustler mode).
 * Handles Officer Hardass encounters with Fight / Run / Surrender.
 */
import { GAME_CONSTANTS } from "../data/constants.js";
import { currentLoad } from "./state.js";
import { hasItem, consumeItem } from "./vendor.js";

/**
 * Get number of deputies Hardass currently has.
 */
export function getDeputyCount(state) {
  return Math.floor(state.day / GAME_CONSTANTS.HARDASS_DEPUTY_INTERVAL);
}

/**
 * Generate the encounter description text.
 */
export function getEncounterText(deputies) {
  if (deputies === 0) {
    return "Officer Hardass steps out of the shadows alone, hand on his holster.";
  }
  if (deputies === 1) {
    return "Officer Hardass and his deputy block your path. Nowhere to hide.";
  }
  return `Officer Hardass and his ${deputies} deputies surround you. This looks bad.`;
}

/**
 * Process a FIGHT outcome.
 * @param {GameState} state
 * @returns {{ messages: string[], drugsLost: number, hpLost: number, cashGained: number }}
 */
export function resolveFight(state) {
  const deputies = getDeputyCount(state);
  const messages = [];
  let hpLost = 0;
  let drugsLost = 0;
  let cashGained = 0;

  // Check for bulletproof vest
  const hasVest = hasItem(state, "bulletproof_vest");

  // Fight success chance
  const successChance = Math.min(
    0.95,
    GAME_CONSTANTS.FIGHT_BASE_SUCCESS +
      state.guns * GAME_CONSTANTS.FIGHT_GUN_BONUS -
      deputies * 0.05,
  );

  const won = Math.random() < successChance;

  if (won) {
    // Win — get cash reward, keep drugs
    const reward =
      GAME_CONSTANTS.FIGHT_WIN_REWARD_MIN +
      Math.floor(
        Math.random() *
          (GAME_CONSTANTS.FIGHT_WIN_REWARD_MAX -
            GAME_CONSTANTS.FIGHT_WIN_REWARD_MIN),
      );
    cashGained = reward;
    state.cash += reward;

    // Still take some damage
    const baseDmg =
      GAME_CONSTANTS.FIGHT_HP_DAMAGE_MIN +
      Math.floor(
        Math.random() *
          (GAME_CONSTANTS.FIGHT_HP_DAMAGE_MAX -
            GAME_CONSTANTS.FIGHT_HP_DAMAGE_MIN),
      );
    const deputyDmg = deputies * GAME_CONSTANTS.FIGHT_DEPUTY_DAMAGE;
    let totalDmg = baseDmg + deputyDmg;

    if (hasVest) {
      consumeItem(state, "bulletproof_vest");
      totalDmg = Math.max(0, totalDmg - 15);
      messages.push("Vest absorbed some of the damage.");
    }

    hpLost = totalDmg;
    state.hp = Math.max(0, state.hp - totalDmg);

    messages.push(
      `You fought Hardass and WON! Took $${reward.toLocaleString()} from him.`,
    );
    messages.push(
      `You took ${totalDmg} HP damage. HP: ${state.hp}/${state.maxHp}.`,
    );
  } else {
    // Lose — lose drugs + take heavy damage
    const baseDmg =
      GAME_CONSTANTS.FIGHT_HP_DAMAGE_MAX +
      deputies * GAME_CONSTANTS.FIGHT_DEPUTY_DAMAGE;
    let totalDmg = baseDmg;

    if (hasVest) {
      consumeItem(state, "bulletproof_vest");
      totalDmg = Math.max(0, totalDmg - 15);
      messages.push("Vest absorbed some of the damage.");
    }

    hpLost = totalDmg;
    state.hp = Math.max(0, state.hp - totalDmg);

    // Lose 40-60% of drugs
    const lossRate = 0.4 + Math.random() * 0.2;
    for (const id of Object.keys(state.trenchCoat)) {
      const lost = Math.ceil(state.trenchCoat[id] * lossRate);
      state.trenchCoat[id] -= lost;
      drugsLost += lost;
    }

    messages.push(
      `You fought Hardass and LOST. You took ${totalDmg} HP damage. HP: ${state.hp}/${state.maxHp}.`,
    );
    if (drugsLost > 0) {
      messages.push(`Lost ${drugsLost} units of product in the scuffle.`);
    }
  }

  // Check death
  if (state.hp <= 0) {
    state.isOver = true;
    state.won = false;
    messages.push("You bled out on the street. Game over.");
  }

  return { messages, drugsLost, hpLost, cashGained };
}

/**
 * Process a RUN outcome.
 * @param {GameState} state
 * @returns {{ messages: string[], escaped: boolean, drugsLost: number, hpLost: number }}
 */
export function resolveRun(state) {
  const deputies = getDeputyCount(state);
  const load = currentLoad(state);
  const messages = [];
  let hpLost = 0;
  let drugsLost = 0;

  const runChance = Math.max(
    0.1,
    GAME_CONSTANTS.RUN_BASE_SUCCESS -
      load * GAME_CONSTANTS.RUN_LOAD_PENALTY -
      deputies * GAME_CONSTANTS.RUN_DEPUTY_PENALTY,
  );

  const escaped = Math.random() < runChance;

  if (escaped) {
    // Drop some drugs while running (10-20%)
    const dropRate = 0.1 + Math.random() * 0.1;
    for (const id of Object.keys(state.trenchCoat)) {
      if (state.trenchCoat[id] > 0) {
        const lost = Math.ceil(state.trenchCoat[id] * dropRate);
        state.trenchCoat[id] -= lost;
        drugsLost += lost;
      }
    }
    messages.push("You made a run for it and escaped!");
    if (drugsLost > 0) {
      messages.push(`Dropped ${drugsLost} units while running.`);
    }
  } else {
    // Failed run — take damage + lose more drugs
    const dmg = GAME_CONSTANTS.RUN_FAIL_HP_DAMAGE + deputies * 3;

    const hasVest = hasItem(state, "bulletproof_vest");
    let totalDmg = dmg;
    if (hasVest) {
      consumeItem(state, "bulletproof_vest");
      totalDmg = Math.max(0, dmg - 10);
      messages.push("Vest absorbed some of the damage.");
    }

    hpLost = totalDmg;
    state.hp = Math.max(0, state.hp - totalDmg);

    const lossRate = 0.3 + Math.random() * 0.2;
    for (const id of Object.keys(state.trenchCoat)) {
      const lost = Math.ceil(state.trenchCoat[id] * lossRate);
      state.trenchCoat[id] -= lost;
      drugsLost += lost;
    }

    messages.push(
      `You tried to run but they caught you! Took ${totalDmg} HP damage. HP: ${state.hp}/${state.maxHp}.`,
    );
    if (drugsLost > 0) {
      messages.push(`Lost ${drugsLost} units of product.`);
    }
  }

  if (state.hp <= 0) {
    state.isOver = true;
    state.won = false;
    messages.push("You collapsed in the alley. Game over.");
  }

  return { messages, escaped, drugsLost, hpLost };
}

/**
 * Process a SURRENDER outcome.
 * @param {GameState} state
 * @returns {{ messages: string[], drugsLost: number, jailDays: number }}
 */
export function resolveSurrender(state) {
  const messages = [];
  let drugsLost = 0;

  // Lose ALL drugs
  for (const id of Object.keys(state.trenchCoat)) {
    drugsLost += state.trenchCoat[id];
    state.trenchCoat[id] = 0;
  }

  // Jail time
  const jailDays =
    GAME_CONSTANTS.SURRENDER_JAIL_MIN +
    Math.floor(
      Math.random() *
        (GAME_CONSTANTS.SURRENDER_JAIL_MAX -
          GAME_CONSTANTS.SURRENDER_JAIL_MIN +
          1),
    );
  state.jailDays = jailDays;

  messages.push("You put your hands up and surrendered.");
  if (drugsLost > 0) {
    messages.push(`Cops confiscated all ${drugsLost} units from your coat.`);
  }
  messages.push(
    `You're thrown in jail for ${jailDays} day${jailDays > 1 ? "s" : ""}.`,
  );

  return { messages, drugsLost, jailDays };
}
