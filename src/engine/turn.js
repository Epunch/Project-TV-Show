/**
 * turn.js — End-of-turn processing.
 * Called when the player travels to a new location.
 * Handles: day advance, interest, random events, win/lose detection.
 * In Hustler mode: also handles jail, HP, Hardass deputies, Vinnie.
 * In Realism mode: also handles heat decay, stash raids, connect events, supply events.
 */
import { GAME_CONSTANTS } from "../data/constants.js";
import { DRUGS } from "../data/drugs.js";
import { EVENTS } from "../data/events.js";
import {
  generateMarket,
  generateRealismMarket,
  rollSupplyEvents,
} from "./market.js";
import { currentLoad } from "./state.js";
import {
  refreshConnectStock,
  processConnectEvents,
  rollConnectEncounter,
} from "./reputation.js";

/**
 * Process travel to a new location. Mutates state in place.
 * Returns an object with messages and a flag for police encounter.
 *
 * @param {GameState} state
 * @param {Location}  newLocation
 * @returns {{ messages: string[], policeEncounter: boolean, tip: object|null, vendorItem: object|null }}
 */
export function processTurn(state, newLocation) {
  const messages = [];
  let policeEncounter = false;

  // ── Jail check (Hustler/Realism: skip turn if in jail) ─────────────────────
  if ((state.isHustler || state.isRealism) && state.jailDays > 0) {
    state.jailDays -= 1;
    state.day += 1;
    if (state.isRealism) {
      state.market = generateRealismMarket(
        state.supplyEvents,
        state.boroughHeat,
        state.location.id,
      );
    } else {
      state.market = generateMarket(state.volatilityMod);
    }

    if (state.jailDays > 0) {
      messages.push(
        `Still in jail. ${state.jailDays} day${state.jailDays > 1 ? "s" : ""} left.`,
      );
    } else {
      messages.push("Out of jail. Back on the streets.");
      state.location = newLocation;
    }

    // Still apply interest while in jail
    applyInterest(state, messages);

    // Check game end
    checkGameEnd(state, messages);
    return { messages, policeEncounter: false, tip: null, vendorItem: null };
  }

  // ── Move ──────────────────────────────────────────────────────────────────
  state.location = newLocation;

  // ── Day advance ───────────────────────────────────────────────────────────
  state.day += 1;

  // ── Reset scanner each day ────────────────────────────────────────────────
  if (state.isHustler || state.isRealism) {
    state.scannerActive = false;

    // Consume scanner if player has one
    const scannerIdx = state.items.findIndex((i) => i.id === "police_scanner");
    if (scannerIdx !== -1) {
      state.items[scannerIdx].uses -= 1;
      if (state.items[scannerIdx].uses <= 0) state.items.splice(scannerIdx, 1);
      state.scannerActive = true;
      messages.push("Police scanner active — heat levels revealed.");
    }
  }

  // ── Interest ──────────────────────────────────────────────────────────────
  applyInterest(state, messages);

  // ── Hardass deputy escalation (Hustler / Realism) ─────────────────────────
  if (state.isHustler || state.isRealism) {
    state.hardassDeputies = Math.floor(
      state.day / GAME_CONSTANTS.HARDASS_DEPUTY_INTERVAL,
    );
  }

  // ── New market prices ─────────────────────────────────────────────────────
  if (state.isRealism) {
    // Roll supply events (droughts, floods)
    const supplyMessages = rollSupplyEvents(state.supplyEvents, state.day);
    messages.push(...supplyMessages);

    // Generate realism market with supply events + heat
    state.market = generateRealismMarket(
      state.supplyEvents,
      state.boroughHeat,
      newLocation.id,
    );

    // Refresh connect status for the day (arrest/release checks)
    refreshConnectStock(state);

    // Process connect events (arrests, releases)
    const connectMessages = processConnectEvents(state);
    messages.push(...connectMessages);

    // Roll connect encounter — stores offer on state for main.js to show modal
    delete state._pendingConnectOffer;
    const connectOffer = rollConnectEncounter(state, newLocation.id);
    if (connectOffer) {
      state._pendingConnectOffer = connectOffer;
    }

    // Decay borough heat
    for (const locId of Object.keys(state.boroughHeat)) {
      state.boroughHeat[locId] = Math.max(
        0,
        state.boroughHeat[locId] * (1 - GAME_CONSTANTS.HEAT_DECAY_RATE),
      );
    }

    // Stash house raid check
    const stashHasProduct = Object.values(state.stash).some((qty) => qty > 0);
    if (stashHasProduct) {
      const locationHeat = state.boroughHeat["bronx"] ?? 0; // stash is in home borough
      const raidChance =
        GAME_CONSTANTS.HEAT_STASH_RAID_BASE +
        locationHeat * GAME_CONSTANTS.HEAT_STASH_RAID_SCALE;
      if (Math.random() < raidChance) {
        let totalLost = 0;
        for (const id of Object.keys(state.stash)) {
          const lost = Math.ceil(state.stash[id] * 0.5);
          state.stash[id] -= lost;
          totalLost += lost;
        }
        if (totalLost > 0) {
          messages.push(
            `STASH RAIDED — cops confiscated ${totalLost} oz of product.`,
          );
        }
      }
    }

    // Favour (Tommy Bags unlock) deadline check
    if (state.pendingFavour) {
      const fav = state.pendingFavour;
      if (state.day > fav.deadline) {
        messages.push("Favour failed. Tommy Bags is disappointed.");
        state.pendingFavour = null;
      } else if (
        state.location.id === fav.locationId &&
        state.trenchCoat[fav.drugId] >= fav.amount
      ) {
        state.trenchCoat[fav.drugId] -= fav.amount;
        state.favourCompleted = true;
        state.reputation += GAME_CONSTANTS.REP_FAVOUR_REWARD;
        messages.push(
          `Favour complete. Delivered ${fav.amount} oz of ${fav.drugId} to ${fav.locationName}. Tommy Bags unlocked on Staten Island. +${GAME_CONSTANTS.REP_FAVOUR_REWARD} rep.`,
        );
        state.pendingFavour = null;
      }
    }
  } else {
    state.market = generateMarket(state.volatilityMod);
  }

  // ── Random events ─────────────────────────────────────────────────────────
  const load = currentLoad(state);
  const basePoliceChance =
    (GAME_CONSTANTS.BASE_POLICE_CHANCE +
      load * GAME_CONSTANTS.POLICE_DRUG_SCALE) *
    newLocation.heatMod *
    state.policeMod;

  for (const event of EVENTS) {
    let chance = event.probability;

    // Scale police events by how much heat you're carrying
    if (event.type === "police") {
      chance =
        basePoliceChance *
        (event.probability / GAME_CONSTANTS.BASE_POLICE_CHANCE);

      // In realism mode, use borough heat to scale police chance
      if (state.isRealism) {
        const bHeat = state.boroughHeat[newLocation.id] ?? 0;
        chance *= 1 + bHeat * 2; // borough heat doubles police chance
      }

      // In Hustler/Realism mode, police events become Hardass encounters
      if ((state.isHustler || state.isRealism) && Math.random() < chance) {
        // Check for Fake ID
        const fakeIdIdx = state.items.findIndex((i) => i.id === "fake_id");
        if (fakeIdIdx !== -1) {
          state.items.splice(fakeIdIdx, 1);
          messages.push("Fake ID — got past the cops. (item consumed)");
          continue;
        }
        policeEncounter = true;
        continue; // Don't apply the classic event; main.js will show the modal
      }
    }

    // Mugger events — in Hustler/Realism mode, also deal HP damage
    if (event.type === "mugger" && (state.isHustler || state.isRealism)) {
      if (Math.random() < chance) {
        if (state.guns > 0) {
          messages.push("Mugged — pulled your piece and scared them off.");
        } else {
          // Check for bulletproof vest
          const vestIdx = state.items.findIndex(
            (i) => i.id === "bulletproof_vest",
          );
          const stolen = Math.floor(state.cash * 0.2);
          state.cash = Math.max(0, state.cash - stolen);

          const hpDmg =
            GAME_CONSTANTS.MUGGER_HP_DAMAGE_MIN +
            Math.floor(
              Math.random() *
                (GAME_CONSTANTS.MUGGER_HP_DAMAGE_MAX -
                  GAME_CONSTANTS.MUGGER_HP_DAMAGE_MIN),
            );

          if (vestIdx !== -1) {
            state.items[vestIdx].uses -= 1;
            if (state.items[vestIdx].uses <= 0) state.items.splice(vestIdx, 1);
            messages.push(
              `Mugged — took $${stolen.toLocaleString()}. Vest absorbed the hit.`,
            );
          } else {
            state.hp = Math.max(0, state.hp - hpDmg);
            messages.push(
              `Mugged — took $${stolen.toLocaleString()}, beat you for ${hpDmg} HP. HP: ${state.hp}/${state.maxHp}.`,
            );
          }

          if (state.hp <= 0) {
            state.isOver = true;
            state.won = false;
            messages.push("The muggers finished you off. Game over.");
          }
        }
        continue;
      }
      continue;
    }

    // Big Vinnie (Hustler/Realism mode) — extra shark visit when debt is high
    if (event.type === "shark" && (state.isHustler || state.isRealism)) {
      // Check for Vinnie job offer first (only if no active job)
      if (
        !state.vinnieJob &&
        state.debt >= GAME_CONSTANTS.VINNIE_JOB_DEBT_MIN &&
        Math.random() < GAME_CONSTANTS.VINNIE_JOB_CHANCE
      ) {
        // Vinnie offers a job — will be shown as a modal by main.js
        // We set a flag on the turn result
        const jobDrug = DRUGS[Math.floor(Math.random() * DRUGS.length)];
        const otherLocs = state.locations.filter(
          (l) => l.id !== state.location.id,
        );
        const jobLoc = otherLocs[Math.floor(Math.random() * otherLocs.length)];
        const jobAmount = 5 + Math.floor(Math.random() * 15);
        // Store the pending offer — main.js will show the modal
        state._pendingVinnieOffer = {
          drugId: jobDrug.id,
          locationId: jobLoc.id,
          locationName: jobLoc.name,
          amount: jobAmount,
          deadline: state.day + GAME_CONSTANTS.VINNIE_JOB_DEADLINE,
        };
        continue;
      }

      let vinnieChance = event.probability;
      if (state.debt > GAME_CONSTANTS.VINNIE_DEBT_THRESHOLD) {
        vinnieChance += GAME_CONSTANTS.VINNIE_EXTRA_CHANCE;
      }
      if (state.debt > 0 && Math.random() < vinnieChance) {
        const beatdown = Math.floor(Math.random() * 500) + 200;
        state.cash = Math.max(0, state.cash - beatdown);
        const hpDmg = 5 + Math.floor(Math.random() * 10);
        state.hp = Math.max(0, state.hp - hpDmg);
        messages.push(
          `Vinnie's boys — took $${beatdown.toLocaleString()}, roughed you up for ${hpDmg} HP. HP: ${state.hp}/${state.maxHp}.`,
        );
        if (state.hp <= 0) {
          state.isOver = true;
          state.won = false;
          messages.push("Vinnie's boys went too far. Game over.");
        }
        continue;
      }
      continue;
    }

    // Normal events (non-police, non-mugger in hustler, non-shark in hustler)
    if (Math.random() < chance) {
      const result = event.apply(state);
      messages.push(`${event.message} ${result}`);
    }
  }

  // ── Vinnie job deadline check (Hustler / Realism) ─────────────────────────
  if ((state.isHustler || state.isRealism) && state.vinnieJob) {
    const job = state.vinnieJob;
    if (state.day > job.deadline) {
      // Failed the job — Vinnie's boys come for you
      const hpDmg = GAME_CONSTANTS.VINNIE_JOB_FAIL_HP;
      const cashLost = Math.min(
        state.cash,
        GAME_CONSTANTS.VINNIE_JOB_FAIL_CASH,
      );
      state.hp = Math.max(0, state.hp - hpDmg);
      state.cash = Math.max(0, state.cash - cashLost);
      messages.push(
        `Vinnie's job failed — his boys found you. Lost $${cashLost.toLocaleString()} and took ${hpDmg} HP damage. HP: ${state.hp}/${state.maxHp}.`,
      );
      state.vinnieJob = null;

      if (state.hp <= 0) {
        state.isOver = true;
        state.won = false;
        messages.push("Vinnie's boys made an example of you. Game over.");
      }
    } else if (
      state.location.id === job.locationId &&
      state.trenchCoat[job.drugId] >= job.amount
    ) {
      // Auto-complete: player is at the right location with enough drugs
      state.trenchCoat[job.drugId] -= job.amount;
      const forgiven = Math.round(
        state.debt * GAME_CONSTANTS.VINNIE_JOB_REWARD_RATIO,
      );
      state.debt = Math.max(0, state.debt - forgiven);
      messages.push(
        `Vinnie's job complete. Delivered ${job.amount} ${job.drugId} to ${job.locationName}. $${forgiven.toLocaleString()} debt forgiven. Debt: $${state.debt.toLocaleString()}.`,
      );
      state.vinnieJob = null;
    }
  }

  // ── Win / lose check ──────────────────────────────────────────────────────
  checkGameEnd(state, messages);

  // ── Vendor + tip will be handled by main.js after this returns ────────────
  return { messages, policeEncounter, tip: null, vendorItem: null };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function applyInterest(state, messages) {
  // Shark interest (daily) — use state rate, not constant
  if (state.debt > 0) {
    const rate = state.interestRate ?? GAME_CONSTANTS.INTEREST_RATE;
    const interest = Math.round(state.debt * rate);
    state.debt += interest;
    const sharkName =
      state.isHustler || state.isRealism ? "Big Vinnie" : "Loan shark";
    messages.push(
      `${sharkName} charges $${interest.toLocaleString()} interest. Debt: $${state.debt.toLocaleString()}.`,
    );
  }

  // Bank interest (daily)
  if (state.bank > 0) {
    const rate = state.bankInterestRate ?? GAME_CONSTANTS.BANK_INTEREST_RATE;
    const interest = Math.round(state.bank * rate);
    state.bank += interest;
    messages.push(
      `Bank pays $${interest.toLocaleString()} interest. Balance: $${state.bank.toLocaleString()}.`,
    );
  }
}

function checkGameEnd(state, messages) {
  if (state.day > state.totalDays) {
    state.isOver = true;
    state.won = state.debt <= 0;
  }

  if (state.cash < 0) {
    state.cash = 0;
  }
}
